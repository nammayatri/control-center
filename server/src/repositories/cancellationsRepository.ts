import { getClickHouseClient } from '../db/clickhouse.js';
import type { MetricsFilters, SortOptions, DimensionalTimeSeriesDataPoint } from '../types/metrics.js';

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
