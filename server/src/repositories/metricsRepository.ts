import { getClickHouseClient } from '../db/clickhouse.js';
import type {
    MetricsFilters,
    SortOptions,
    ExecutiveMetricsTotals,
    DriverMetrics,
    RiderMetrics,
    FunnelMetrics,
    CancellationMetrics,
    ComparisonPeriodData,
    TimeSeriesDataPoint,
    FilterOptionsResponse,
    GroupedMetricsRow,
} from '../types/metrics.js';

const DATABASE = 'atlas_agg_metrics';
const TABLE = 'open_data_validation';
const FULL_TABLE = `${DATABASE}.${TABLE}`;

// Type alias for query row results
type QueryRow = Record<string, unknown>;

// ============================================
// Helper Functions
// ============================================

function buildWhereClause(filters: MetricsFilters): string {
    const conditions: string[] = [];

    if (filters.dateFrom) {
        conditions.push(`date_info >= toDateTime('${filters.dateFrom}')`);
    }
    if (filters.dateTo) {
        conditions.push(`date_info <= toDateTime('${filters.dateTo}')`);
    }
    if (filters.city && filters.city.length > 0) {
        const cities = filters.city.map(c => `'${c}'`).join(',');
        conditions.push(`city IN (${cities})`);
    }
    if (filters.flowType && filters.flowType.length > 0) {
        const flowTypes = filters.flowType.map(f => `'${f}'`).join(',');
        conditions.push(`flow_type IN (${flowTypes})`);
    }
    if (filters.tripTag && filters.tripTag.length > 0) {
        const tripTags = filters.tripTag.map(t => `'${t}'`).join(',');
        conditions.push(`trip_tag IN (${tripTags})`);
    }
    if (filters.variant && filters.variant.length > 0) {
        const variants = filters.variant.map(v => `'${v}'`).join(',');
        conditions.push(`variant IN (${variants})`);
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

export async function getExecutiveMetrics(filters: MetricsFilters): Promise<{
    totals: ExecutiveMetricsTotals;
    drivers: DriverMetrics;
    riders: RiderMetrics;
}> {
    const whereClause = buildWhereClause(filters);

    const query = `
    SELECT
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(search_for_quotes, search_for_quotes IS NOT NULL) as search_for_quotes,
      sumIf(search_got_quotes, search_got_quotes IS NOT NULL) as search_got_quotes,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(rides, rides IS NOT NULL) as rides,
      sumIf(earnings, earnings IS NOT NULL) as earnings,
      sumIf(distance, distance IS NOT NULL) as distance,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings,
      sumIf(driver_cancelled_bookings, driver_cancelled_bookings IS NOT NULL) as driver_cancelled_bookings,
      sumIf(user_cancelled_bookings, user_cancelled_bookings IS NOT NULL) as user_cancelled_bookings,
      sumIf(reg_riders, reg_riders IS NOT NULL) as reg_riders,
      sumIf(enabled_drivers, enabled_drivers IS NOT NULL) as enabled_drivers,
      sumIf(cab_enabled_drivers, cab_enabled_drivers IS NOT NULL) as cab_enabled_drivers,
      sumIf(auto_enabled_drivers, auto_enabled_drivers IS NOT NULL) as auto_enabled_drivers,
      sumIf(bike_enabled_drivers, bike_enabled_drivers IS NOT NULL) as bike_enabled_drivers
    FROM ${FULL_TABLE}
    ${whereClause}
  `;

    const rows = await executeQuery(query);
    const row = rows[0] || {};

    return {
        totals: {
            searches: safeNumber(row.searches),
            searchGotEstimates: safeNumber(row.search_got_estimates),
            searchForQuotes: safeNumber(row.search_for_quotes),
            searchGotQuotes: safeNumber(row.search_got_quotes),
            bookings: safeNumber(row.bookings),
            completedRides: safeNumber(row.completed_rides),
            rides: safeNumber(row.rides),
            earnings: safeNumber(row.earnings),
            distance: safeNumber(row.distance),
            cancelledBookings: safeNumber(row.cancelled_bookings),
            driverCancelledBookings: safeNumber(row.driver_cancelled_bookings),
            userCancelledBookings: safeNumber(row.user_cancelled_bookings),
        },
        drivers: {
            enabledDrivers: safeNumber(row.enabled_drivers),
            cabEnabledDrivers: safeNumber(row.cab_enabled_drivers),
            autoEnabledDrivers: safeNumber(row.auto_enabled_drivers),
            bikeEnabledDrivers: safeNumber(row.bike_enabled_drivers),
        },
        riders: {
            registeredRiders: safeNumber(row.reg_riders),
        },
    };
}

// ============================================
// Conversion Metrics
// ============================================

export async function getConversionMetrics(filters: MetricsFilters): Promise<{
    funnel: FunnelMetrics;
    cancellation: CancellationMetrics;
}> {
    const whereClause = buildWhereClause(filters);

    const query = `
    SELECT
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(search_got_quotes, search_got_quotes IS NOT NULL) as search_got_quotes,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings,
      sumIf(driver_cancelled_bookings, driver_cancelled_bookings IS NOT NULL) as driver_cancelled_bookings,
      sumIf(user_cancelled_bookings, user_cancelled_bookings IS NOT NULL) as user_cancelled_bookings
    FROM ${FULL_TABLE}
    ${whereClause}
  `;

    const rows = await executeQuery(query);
    const row = rows[0] || {};

    const searches = safeNumber(row.searches);
    const estimates = safeNumber(row.search_got_estimates);
    const quotes = safeNumber(row.search_got_quotes);
    const bookings = safeNumber(row.bookings);
    const completedRides = safeNumber(row.completed_rides);
    const cancelledBookings = safeNumber(row.cancelled_bookings);
    const driverCancelled = safeNumber(row.driver_cancelled_bookings);
    const userCancelled = safeNumber(row.user_cancelled_bookings);

    return {
        funnel: {
            searchToEstimate: safeRate(estimates, searches),
            estimateToQuote: safeRate(quotes, estimates),
            quoteToBooking: safeRate(bookings, quotes),
            bookingToCompletion: safeRate(completedRides, bookings),
        },
        cancellation: {
            overall: safeRate(cancelledBookings, bookings),
            byDriver: safeRate(driverCancelled, bookings),
            byUser: safeRate(userCancelled, bookings),
        },
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
    filters: Omit<MetricsFilters, 'dateFrom' | 'dateTo'>
): Promise<{
    current: ComparisonPeriodData;
    previous: ComparisonPeriodData;
    change: Record<keyof ComparisonPeriodData, { absolute: number; percent: number }>;
}> {
    const baseFilters = buildWhereClause({ ...filters, dateFrom: undefined, dateTo: undefined });
    const filterCondition = baseFilters ? baseFilters.replace('WHERE', 'AND') : '';

    const query = `
    SELECT
      'current' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(earnings, earnings IS NOT NULL) as earnings,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings
    FROM ${FULL_TABLE}
    WHERE date_info >= toDateTime('${currentFrom}') AND date_info <= toDateTime('${currentTo}')
    ${filterCondition}
    UNION ALL
    SELECT
      'previous' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(earnings, earnings IS NOT NULL) as earnings,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings
    FROM ${FULL_TABLE}
    WHERE date_info >= toDateTime('${previousFrom}') AND date_info <= toDateTime('${previousTo}')
    ${filterCondition}
  `;

    const rows = await executeQuery(query);

    const currentRow = rows.find(r => r.period === 'current') || {};
    const previousRow = rows.find(r => r.period === 'previous') || {};

    const current: ComparisonPeriodData = {
        searches: safeNumber(currentRow.searches),
        bookings: safeNumber(currentRow.bookings),
        completedRides: safeNumber(currentRow.completed_rides),
        earnings: safeNumber(currentRow.earnings),
        cancelledBookings: safeNumber(currentRow.cancelled_bookings),
    };

    const previous: ComparisonPeriodData = {
        searches: safeNumber(previousRow.searches),
        bookings: safeNumber(previousRow.bookings),
        completedRides: safeNumber(previousRow.completed_rides),
        earnings: safeNumber(previousRow.earnings),
        cancelledBookings: safeNumber(previousRow.cancelled_bookings),
    };

    return {
        current,
        previous,
        change: {
            searches: {
                absolute: current.searches - previous.searches,
                percent: calculatePercentChange(current.searches, previous.searches),
            },
            bookings: {
                absolute: current.bookings - previous.bookings,
                percent: calculatePercentChange(current.bookings, previous.bookings),
            },
            completedRides: {
                absolute: current.completedRides - previous.completedRides,
                percent: calculatePercentChange(current.completedRides, previous.completedRides),
            },
            earnings: {
                absolute: current.earnings - previous.earnings,
                percent: calculatePercentChange(current.earnings, previous.earnings),
            },
            cancelledBookings: {
                absolute: current.cancelledBookings - previous.cancelledBookings,
                percent: calculatePercentChange(current.cancelledBookings, previous.cancelledBookings),
            },
        },
    };
}

// ============================================
// Time Series
// ============================================

export async function getTimeSeries(
    filters: MetricsFilters,
    sort: SortOptions
): Promise<TimeSeriesDataPoint[]> {
    const whereClause = buildWhereClause(filters);
    const orderClause = sort.sortBy ? buildOrderClause(sort) : 'ORDER BY date ASC';

    const query = `
    SELECT
      toDate(date_info) as date,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(earnings, earnings IS NOT NULL) as earnings,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings
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
        cancelledBookings: safeNumber(row.cancelled_bookings),
    }));
}

// ============================================
// Filter Options
// ============================================

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
    const query = `
    SELECT
      groupArray(DISTINCT city) as cities,
      groupArray(DISTINCT flow_type) as flow_types,
      groupArray(DISTINCT trip_tag) as trip_tags,
      groupArray(DISTINCT variant) as variants,
      min(date_info) as min_date,
      max(date_info) as max_date
    FROM ${FULL_TABLE}
  `;

    const rows = await executeQuery(query);
    const row = rows[0] || {};

    return {
        cities: (row.cities as string[]) || [],
        flowTypes: (row.flow_types as string[]) || [],
        tripTags: (row.trip_tags as string[]) || [],
        variants: (row.variants as string[]) || [],
        dateRange: {
            min: String(row.min_date || ''),
            max: String(row.max_date || ''),
        },
    };
}

// ============================================
// Grouped Metrics (Breakdown by Dimension)
// ============================================

export async function getGroupedMetrics(
    filters: MetricsFilters,
    groupBy: 'city' | 'flow_type' | 'trip_tag' | 'variant',
    sort: SortOptions
): Promise<GroupedMetricsRow[]> {
    const whereClause = buildWhereClause(filters);
    const orderClause = sort.sortBy ? buildOrderClause(sort) : `ORDER BY ${groupBy} ASC`;

    const query = `
    SELECT
      ${groupBy} as dimension,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(earnings, earnings IS NOT NULL) as earnings,
      sumIf(cancelled_bookings, cancelled_bookings IS NOT NULL) as cancelled_bookings
    FROM ${FULL_TABLE}
    ${whereClause}
    GROUP BY ${groupBy}
    ${orderClause}
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
            cancelledBookings: safeNumber(row.cancelled_bookings),
            conversionRate: safeRate(completedRides, searches),
        };
    });
}
