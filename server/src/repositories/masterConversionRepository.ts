import { getClickHouseClient } from '../db/clickhouse.js';
import type {
    MasterConversionFilters,
    MasterConversionExecutiveTotals,
    MasterConversionComparisonPeriodData,
    MasterConversionComparisonResponse,
    MasterConversionTimeSeriesDataPoint,
    MasterConversionFilterOptionsResponse,
    GroupedMasterConversionRow,
    SortOptions,
    Dimension,
    Granularity,
    DimensionalTimeSeriesDataPoint,
} from '../types/masterConversion.js';

const DATABASE = 'cosmos';
const TABLE = 'master_conversion';
const FULL_TABLE = `${DATABASE}.${TABLE}`;

// Type alias for query row results
type QueryRow = Record<string, unknown>;

// ============================================
// Helper Functions
// ============================================

function buildWhereClause(filters: MasterConversionFilters): string {
    const conditions: string[] = [];

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
    if (filters.merchantId && filters.merchantId.length > 0) {
        const merchants = filters.merchantId.map(m => `'${m}'`).join(',');
        conditions.push(`bpp_merchant_id IN (${merchants})`);
    }
    if (filters.flowType && filters.flowType.length > 0) {
        const flowTypes = filters.flowType.map(f => `'${f}'`).join(',');
        conditions.push(`flow_type IN (${flowTypes})`);
    }
    if (filters.tripTag && filters.tripTag.length > 0) {
        const tripTags = filters.tripTag.map(t => `'${t}'`).join(',');
        conditions.push(`trip_tag IN (${tripTags})`);
    }
    if (filters.serviceTier && filters.serviceTier.length > 0) {
        const tiers = filters.serviceTier.map(s => `'${s}'`).join(',');
        conditions.push(`service_tier IN (${tiers})`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function buildOrderClause(sort: SortOptions): string {
    if (!sort.sortBy) return '';
    const order = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';
    return `ORDER BY ${sort.sortBy} ${order}`;
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

function calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
}

async function executeQuery(query: string): Promise<QueryRow[]> {
    const client = getClickHouseClient();
    const result = await client.query({ query, format: 'JSONEachRow' });
    return await result.json() as QueryRow[];
}

// ============================================
// Executive Metrics
// ============================================

export async function getExecutiveMetrics(filters: MasterConversionFilters): Promise<MasterConversionExecutiveTotals> {
    const whereClause = buildWhereClause(filters);

    const query = `
    SELECT
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations
    FROM ${FULL_TABLE}
    ${whereClause}
  `;

    const rows = await executeQuery(query);
    const row = rows[0] || {};

    return {
        searches: safeNumber(row.searches),
        quotesRequested: safeNumber(row.quotes_requested),
        quotesAccepted: safeNumber(row.quotes_accepted),
        bookings: safeNumber(row.bookings),
        completedRides: safeNumber(row.completed_rides),
        earnings: safeNumber(row.earnings),
        userCancellations: safeNumber(row.user_cancellations),
        driverCancellations: safeNumber(row.driver_cancellations),
    };
}

// ============================================
// Comparison Metrics
// ============================================

export async function getComparisonMetrics(
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string,
    filters: Omit<MasterConversionFilters, 'dateFrom' | 'dateTo'>
): Promise<{
    current: MasterConversionComparisonPeriodData;
    previous: MasterConversionComparisonPeriodData;
    change: MasterConversionComparisonResponse['change'];
}> {
    const baseFilters = buildWhereClause({ ...filters, dateFrom: undefined, dateTo: undefined });
    const filterCondition = baseFilters ? baseFilters.replace('WHERE', 'AND') : '';

    const query = `
    SELECT
      'current' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations
    FROM ${FULL_TABLE}
    WHERE local_time >= toDateTime('${currentFrom}') AND local_time <= toDateTime('${currentTo}')
    ${filterCondition}
    UNION ALL
    SELECT
      'previous' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations
    FROM ${FULL_TABLE}
    WHERE local_time >= toDateTime('${previousFrom}') AND local_time <= toDateTime('${previousTo}')
    ${filterCondition}
  `;

    const rows = await executeQuery(query);
    const currentRow = rows.find(r => r.period === 'current') || {};
    const previousRow = rows.find(r => r.period === 'previous') || {};

    const current: MasterConversionComparisonPeriodData = {
        searches: safeNumber(currentRow.searches),
        bookings: safeNumber(currentRow.bookings),
        completedRides: safeNumber(currentRow.completed_rides),
        earnings: safeNumber(currentRow.earnings),
        userCancellations: safeNumber(currentRow.user_cancellations),
        driverCancellations: safeNumber(currentRow.driver_cancellations),
    };

    const previous: MasterConversionComparisonPeriodData = {
        searches: safeNumber(previousRow.searches),
        bookings: safeNumber(previousRow.bookings),
        completedRides: safeNumber(previousRow.completed_rides),
        earnings: safeNumber(previousRow.earnings),
        userCancellations: safeNumber(previousRow.user_cancellations),
        driverCancellations: safeNumber(previousRow.driver_cancellations),
    };

    const calculateChange = (key: keyof MasterConversionComparisonPeriodData) => ({
        absolute: current[key] - previous[key],
        percent: calculatePercentChange(current[key], previous[key]),
    });

    return {
        current,
        previous,
        change: {
            searches: calculateChange('searches'),
            bookings: calculateChange('bookings'),
            completedRides: calculateChange('completedRides'),
            earnings: calculateChange('earnings'),
            userCancellations: calculateChange('userCancellations'),
            driverCancellations: calculateChange('driverCancellations'),
        }
    };
}

// ============================================
// Time Series
// ============================================


export async function getTimeSeries(
    filters: MasterConversionFilters,
    sort: SortOptions,
    granularity: Granularity = 'day'
): Promise<MasterConversionTimeSeriesDataPoint[]> {
    const whereClause = buildWhereClause(filters);
    const orderClause = sort.sortBy ? buildOrderClause(sort) : 'ORDER BY date ASC';

    const timeBucketExpr = granularity === 'hour'
        ? "formatDateTime(toStartOfHour(local_time), '%Y-%m-%d %H:00:00')"
        : "formatDateTime(toDate(local_time), '%Y-%m-%d')";

    const query = `
    SELECT
      ${timeBucketExpr} as date,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings
    FROM ${FULL_TABLE}
    ${whereClause}
    GROUP BY date
    ${orderClause}
  `;

    const rows = await executeQuery(query);

    return rows.map(row => ({
        date: String(row.date),
        searches: safeNumber(row.searches),
        bookings: safeNumber(row.bookings),
        completedRides: safeNumber(row.completed_rides),
        earnings: safeNumber(row.earnings),
    }));
}


// ============================================
// Filter Options
// ============================================

export async function getFilterOptions(): Promise<MasterConversionFilterOptionsResponse> {
    const query = `
    SELECT
      groupArray(DISTINCT city) as cities,
      groupArray(DISTINCT bpp_merchant_id) as merchant_ids,
      groupArray(DISTINCT bpp_merchant_name) as merchant_names,
      groupArray(DISTINCT flow_type) as flow_types,
      groupArray(DISTINCT trip_tag) as trip_tags,
      groupArray(DISTINCT service_tier) as service_tiers,
      min(local_time) as min_date,
      max(local_time) as max_date
    FROM ${FULL_TABLE}
  `;

    const rows = await executeQuery(query);
    const row = rows[0] || {};

    const merchantIds = (row.merchant_ids as string[]) || [];
    const merchantNames = (row.merchant_names as string[]) || [];

    // Combine IDs and Names
    const merchants = merchantIds.map((id, index) => ({
        id,
        name: merchantNames[index] || id
    }));

    return {
        cities: (row.cities as string[]) || [],
        merchants,
        flowTypes: (row.flow_types as string[]) || [],
        tripTags: (row.trip_tags as string[]) || [],
        serviceTiers: (row.service_tiers as string[]) || [],
        dateRange: {
            min: String(row.min_date || ''),
            max: String(row.max_date || ''),
        },
    };
}

// ============================================
// Grouped Metrics
// ============================================

export async function getGroupedMasterConversionMetrics(
    filters: MasterConversionFilters,
    groupBy: 'city' | 'merchant_id' | 'flow_type' | 'trip_tag' | 'service_tier',
    sort: SortOptions
): Promise<GroupedMasterConversionRow[]> {
    const whereClause = buildWhereClause(filters);
    const orderClause = sort.sortBy ? buildOrderClause(sort) : `ORDER BY searches DESC`;

    const dimensionColumn = groupBy === 'merchant_id' ? 'bpp_merchant_id' : groupBy;

    const query = `
    SELECT
      ${dimensionColumn} as dimension,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings
    FROM ${FULL_TABLE}
    ${whereClause}
    GROUP BY ${dimensionColumn}
    ${orderClause}
    LIMIT 100
  `;

    const rows = await executeQuery(query);

    return rows.map(row => {
        const searches = safeNumber(row.searches);
        const completedRides = safeNumber(row.completed_rides);

        return {
            dimension: String(row.dimension),
            searches,
            bookings: safeNumber(row.bookings),
            completedRides,
            earnings: safeNumber(row.earnings),
            conversionRate: safeRate(completedRides, searches),
        };
    });
}

// ============================================
// Dimensional Trend Metrics
// ============================================

export async function getDimensionalTimeSeries(
    filters: MasterConversionFilters,
    dimension: Dimension | 'none',
    granularity: Granularity
): Promise<DimensionalTimeSeriesDataPoint[]> {
    const whereClause = buildWhereClause(filters);

    // Time bucket format
    // ClickHouse formatDateTime: 
    // Hourly: '%Y-%m-%d %H:00:00'
    // Daily: '%Y-%m-%d'

    const timeBucketExpr = granularity === 'hour'
        ? "formatDateTime(toStartOfHour(local_time), '%Y-%m-%d %H:00:00')"
        : "formatDateTime(toDate(local_time), '%Y-%m-%d')";

    const dimensionColumn = dimension === 'none' ? "'Total'" : dimension;

    const query = `
    SELECT
      ${timeBucketExpr} as timestamp,
      ${dimensionColumn} as dimension_value,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides
    FROM ${FULL_TABLE}
    ${whereClause}
    GROUP BY timestamp, dimension_value
    ORDER BY timestamp ASC
  `;

    const rows = await executeQuery(query);

    return rows.map(row => {
        const searches = safeNumber(row.searches);
        const completedRides = safeNumber(row.completed_rides);
        return {
            timestamp: String(row.timestamp),
            dimensionValue: String(row.dimension_value),
            searches,
            completedRides,
            conversion: safeRate(completedRides, searches),
        };
    });
}
