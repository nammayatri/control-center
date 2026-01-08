import { getClickHouseClient } from '../db/clickhouse.js';
import type { MetricsFilters, SortOptions, CancellationGroupedRow, DimensionalTimeSeriesDataPoint } from '../types/metrics.js';

const TABLE = 'cancellations';

// Helper to build WHERE clause (similar to metricsRepository but adapted for cancellations table columns)
function buildWhereClause(filters: MetricsFilters): string {
    const conditions: string[] = [];

    // Date filter on 'date' column or 'local_time'? Sample used 'local_time' and 'date'.
    // Schema says 'date' is DateTime DEFAULT now(). 'local_time' is DateTime.
    // Usually local_time is preferred for analytics if available and correct.
    // Let's use 'date' as it's standard, but check if user meant local_time.
    // Given the schema 'date' has default expression now(), it might be insertion time.
    // 'local_time' seems more like the event time. I will use 'local_time'.
    if (filters.dateFrom) {
        conditions.push(`local_time >= toDateTime('${filters.dateFrom}')`);
    }
    if (filters.dateTo) {
        conditions.push(`local_time <= toDateTime('${filters.dateTo}')`);
    }
    if (filters.city && filters.city.length > 0) {
        const cities = filters.city.map(c => `'${c}'`).join(',');
        conditions.push(`city IN (${cities})`);
    }
    // Flow type, Trip Tag exist in schema
    if (filters.flowType && filters.flowType.length > 0) {
        const flowTypes = filters.flowType.map(f => `'${f}'`).join(',');
        conditions.push(`flow_type IN (${flowTypes})`);
    }
    if (filters.tripTag && filters.tripTag.length > 0) {
        const tripTags = filters.tripTag.map(t => `'${t}'`).join(',');
        conditions.push(`trip_tag IN (${tripTags})`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function safeNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

function safeRate(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 10000) / 10000;
}

export async function getCancellationGroupedMetrics(
    filters: MetricsFilters,
    groupBy: string
): Promise<CancellationGroupedRow[]> {
    const client = getClickHouseClient();
    const whereClause = buildWhereClause(filters);

    // Map frontend groupBy to DB columns
    // Simple columns: trip_distance_bkt, fare_breakup, actual_pickup_dist__bkt
    // JSON columns: pickup_dist_left_bucket, time_to_cancel_bkt, reason_code

    let query = '';
    const isJsonColumn = ['pickup_dist_left_bucket', 'time_to_cancel_bkt', 'reason_code'].includes(groupBy);

    if (isJsonColumn) {
        // Special aggregation for JSON columns using JSONExtractKeysAndValues
        // We sum the counts for each key in the JSON map
        query = `
        SELECT
            tupleElement(pair, 1) as dimension,
            sum(tupleElement(pair, 2)) as count,
            0 as total_bookings, -- Hard to attribute total bookings to a specific reason unless we sum?
            -- Actually, if a row has total_bookings=1 and reason_code={'X':1}, it means that 1 booking was cancelled for reason X.
            -- But total_bookings in that row might be > 1 if it's aggregated?
            -- Sample: total_bookings="1", bookings_cancelled="1", reason_code={'WAIT':1}.
            -- If total_bookings="10", bookings_cancelled="2", reason_code={'A':1, 'B':1}.
            -- Then attributing total_bookings to 'A' is tricky.
            -- However, for Reason Breakdown, we usually just care about the Breakdown of Cancellations.
            -- So we might simply return counts of cancellations.
            -- But the return type requires totalBookings etc for rates.
            -- Let's calculate rates based on the GLOBAL total bookings for the filter period?
            -- Or just return 0 for totalBookings and let frontend show absolute numbers?
            -- User said: "How many people cancelled with same option".
            -- So 'count' is 'bookingsCancelled'.
            
            -- Re-evaluating: 'tupleElement(pair, 2)' is the value from the JSON map.
            -- The JSON map values (like {'WAIT': 1}) represent the count of cancellations for that reason.
            -- So sum(value) = total cancellations for that reason/bucket.
            
            sum(tupleElement(pair, 2)) as bookings_cancelled,
            -- For driver/user specific, we'd need to know if the reason is driver or user.
            -- But the reason_code itself often implies it.
            -- Or we can try to join with 'driver_cancelled' column?
            -- If 'driver_cancelled' > 0, then these reasons are driver reasons?
            -- Complicated if mixed.
            -- For now, let's just return key metrics.
            0 as user_cancelled, 
            0 as driver_cancelled
            
        FROM (
             SELECT
                arrayJoin(JSONExtractKeysAndValues(assumeNotNull(${groupBy}), 'Int64')) as pair,
                total_bookings,
                bookings_cancelled,
                user_cancelled,
                driver_cancelled
            FROM ${TABLE}
            ${whereClause} AND ${groupBy} IS NOT NULL AND ${groupBy} != ''
        )
        GROUP BY dimension
        ORDER BY bookings_cancelled DESC
        `;
    } else {
        // Standard Group By
        query = `
        SELECT
            ${groupBy} as dimension,
            sumIf(total_bookings, total_bookings IS NOT NULL) as total_bookings,
            sumIf(bookings_cancelled, bookings_cancelled IS NOT NULL) as bookings_cancelled,
            sumIf(user_cancelled, user_cancelled IS NOT NULL) as user_cancelled,
            sumIf(driver_cancelled, driver_cancelled IS NOT NULL) as driver_cancelled
        FROM ${TABLE}
        ${whereClause}
        GROUP BY dimension
        ORDER BY bookings_cancelled DESC
        `;
    }

    const result = await client.query({ query, format: 'JSONEachRow' });
    const rows = await result.json() as any[];

    // For JSON columns, we might lack total_bookings context to calculate efficient rates.
    // If needed, we could fetch global total bookings in a separate query, but for now 0 is safer than wrong data.

    return rows.map(row => {
        const totalBookings = safeNumber(row.total_bookings);
        const bookingsCancelled = safeNumber(row.bookings_cancelled);
        const userCancelled = safeNumber(row.user_cancelled);
        const driverCancelled = safeNumber(row.driver_cancelled);

        return {
            dimension: String(row.dimension),
            totalBookings,
            bookingsCancelled,
            userCancelled,
            driverCancelled,
            cancellationRate: safeRate(bookingsCancelled, totalBookings),
            userCancellationRate: safeRate(userCancelled, totalBookings),
            driverCancellationRate: safeRate(driverCancelled, totalBookings),
        };
    });
}

export async function getCancellationTrendMetrics(
    filters: MetricsFilters,
    dimension: string,
    granularity: 'hour' | 'day' = 'day'
): Promise<DimensionalTimeSeriesDataPoint[]> {
    const client = getClickHouseClient();
    const whereClause = buildWhereClause(filters);

    // Time format
    const timeFunc = granularity === 'hour' ? 'toStartOfHour' : 'toStartOfDay'; // ClickHouse functions
    const formatFunc = granularity === 'hour' ? "formatDateTime(timestamp, '%Y-%m-%d %H:%M:%S')" : "formatDateTime(timestamp, '%Y-%m-%d')";

    let query = '';
    const isJsonColumn = ['pickup_dist_left_bucket', 'time_to_cancel_bkt', 'reason_code'].includes(dimension);

    if (isJsonColumn) {
        query = `
        SELECT
            ${formatFunc} as timestamp_str,
            tupleElement(pair, 1) as dimension_value,
            sum(tupleElement(pair, 2)) as bookings_cancelled,
            0 as total_bookings,
            0 as user_cancelled,
            0 as driver_cancelled
        FROM (
             SELECT
                ${timeFunc}(local_time) as timestamp,
                arrayJoin(JSONExtractKeysAndValues(assumeNotNull(${dimension}), 'Int64')) as pair,
                total_bookings,
                bookings_cancelled,
                user_cancelled,
                driver_cancelled
            FROM ${TABLE}
            ${whereClause} AND ${dimension} IS NOT NULL AND ${dimension} != ''
        )
        GROUP BY timestamp, dimension_value
        ORDER BY timestamp
        `;
    } else {
        query = `
        SELECT
            ${formatFunc} as timestamp_str,
            ${dimension} as dimension_value,
            sumIf(total_bookings, total_bookings IS NOT NULL) as total_bookings,
            sumIf(bookings_cancelled, bookings_cancelled IS NOT NULL) as bookings_cancelled,
            sumIf(user_cancelled, user_cancelled IS NOT NULL) as user_cancelled,
            sumIf(driver_cancelled, driver_cancelled IS NOT NULL) as driver_cancelled
        FROM (
            SELECT 
                ${timeFunc}(local_time) as timestamp,
                ${dimension},
                total_bookings,
                bookings_cancelled,
                user_cancelled,
                driver_cancelled
            FROM ${TABLE}
            ${whereClause}
        )
        GROUP BY timestamp, dimension_value
        ORDER BY timestamp
        `;
    }

    const result = await client.query({ query, format: 'JSONEachRow' });
    const rows = await result.json() as any[];

    return rows.map(row => ({
        timestamp: String(row.timestamp_str),
        dimensionValue: String(row.dimension_value),
        searches: 0,
        completedRides: 0,
        conversion: 0,
        bookings: safeNumber(row.total_bookings),
        cancelledRides: safeNumber(row.bookings_cancelled),
        userCancellations: safeNumber(row.user_cancelled),
        driverCancellations: safeNumber(row.driver_cancelled),
        earnings: 0
    }));
}
