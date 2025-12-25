import { adminApi, apiRequest, buildQueryParams as buildApiQueryParams } from './api';

// ============================================
// Types
// ============================================

export interface MetricsFilters {
    dateFrom?: string;
    dateTo?: string;
    city?: string[];
    merchantId?: string[];
    flowType?: string[];
    tripTag?: string[];
    serviceTier?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    groupBy?: 'city' | 'merchant_id' | 'flow_type' | 'trip_tag' | 'service_tier';
}

export interface ExecutiveMetricsResponse {
    totals: {
        searches: number;
        quotesRequested: number;
        quotesAccepted: number;
        bookings: number;
        completedRides: number;
        earnings: number;
        userCancellations: number;
        driverCancellations: number;
    };
    filters: MetricsFilters;
}

export interface ComparisonMetricsResponse {
    current: {
        searches: number;
        bookings: number;
        completedRides: number;
        earnings: number;
        userCancellations: number;
        driverCancellations: number;
    };
    previous: {
        searches: number;
        bookings: number;
        completedRides: number;
        earnings: number;
        userCancellations: number;
        driverCancellations: number;
    };
    change: {
        searches: { absolute: number; percent: number };
        bookings: { absolute: number; percent: number };
        completedRides: { absolute: number; percent: number };
        earnings: { absolute: number; percent: number };
        userCancellations: { absolute: number; percent: number };
        driverCancellations: { absolute: number; percent: number };
    };
    currentPeriod: { from: string; to: string };
    previousPeriod: { from: string; to: string };
}

export interface TimeSeriesDataPoint {
    date: string;
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
}

export interface TimeSeriesResponse {
    data: TimeSeriesDataPoint[];
    filters: MetricsFilters;
}

export interface FilterOptionsResponse {
    cities: string[];
    merchants: { id: string; name: string }[];
    flowTypes: string[];
    tripTags: string[];
    serviceTiers: string[];
    dateRange: {
        min: string;
        max: string;
    };
}

export interface GroupedMetricsRow {
    dimension: string;
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    conversionRate: number;
}

export interface GroupedMetricsResponse {
    data: GroupedMetricsRow[];
    groupBy: string;
    filters: MetricsFilters;
}

export type Dimension =
    | 'service_tier'
    | 'flow_type'
    | 'trip_tag'
    | 'user_os_type'
    | 'user_bundle_version'
    | 'user_sdk_version'
    | 'user_backend_app_version'
    | 'dynamic_pricing_logic_version'
    | 'pooling_logic_version'
    | 'pooling_config_version';

export type Granularity = 'hour' | 'day';

export interface DimensionalTimeSeriesDataPoint {
    timestamp: string;
    dimensionValue: string;
    searches: number;
    completedRides: number;
    conversion: number;
}

export interface DimensionalTimeSeriesResponse {
    data: DimensionalTimeSeriesDataPoint[];
    dimension: Dimension | 'none';
    granularity: Granularity;
    filters: MetricsFilters;
}

// ============================================
// API Functions
// ============================================

/**
 * Helper to build query string for master conversion metrics
 */
function buildMasterQueryParams(filters: MetricsFilters): string {
    const params: Record<string, string | number | boolean | undefined | null> = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        groupBy: filters.groupBy,
    };

    // Add array filters as comma-separated strings if they have values
    if (filters.city?.length) params.city = filters.city.join(',');
    if (filters.merchantId?.length) params.merchantId = filters.merchantId.join(',');
    if (filters.flowType?.length) params.flowType = filters.flowType.join(',');
    if (filters.tripTag?.length) params.tripTag = filters.tripTag.join(',');
    if (filters.serviceTier?.length) params.serviceTier = filters.serviceTier.join(',');

    return buildApiQueryParams(params);
}

export async function getExecutiveMetrics(filters: MetricsFilters = {}): Promise<ExecutiveMetricsResponse> {
    const query = buildMasterQueryParams(filters);
    return apiRequest(adminApi, {
        method: 'GET',
        url: `/master-conversion/executive${query}`,
    });
}

export async function getComparisonMetrics(
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string,
    filters: MetricsFilters = {}
): Promise<ComparisonMetricsResponse> {
    const query = buildMasterQueryParams(filters);
    const prefix = query ? '&' : '?';
    const periodParams = `currentFrom=${currentFrom}&currentTo=${currentTo}&previousFrom=${previousFrom}&previousTo=${previousTo}`;

    return apiRequest(adminApi, {
        method: 'GET',
        url: `/master-conversion/comparison${query}${prefix}${periodParams}`,
    });
}

export async function getTimeSeries(
    filters: MetricsFilters = {},
    granularity: Granularity = 'day'
): Promise<TimeSeriesResponse> {
    const query = buildMasterQueryParams(filters);
    const prefix = query ? '&' : '?';

    return apiRequest(adminApi, {
        method: 'GET',
        url: `/master-conversion/timeseries${query}${prefix}granularity=${granularity}`,
    });
}

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
    return apiRequest(adminApi, {
        method: 'GET',
        url: '/master-conversion/filters',
    });
}

export async function getGroupedMetrics(
    groupBy: 'city' | 'merchant_id' | 'flow_type' | 'trip_tag' | 'service_tier',
    filters: MetricsFilters = {}
): Promise<GroupedMetricsResponse> {
    const query = buildMasterQueryParams({ ...filters, groupBy });
    return apiRequest(adminApi, {
        method: 'GET',
        url: `/master-conversion/grouped${query}`,
    });
}

export async function getTrendData(
    dimension: Dimension | 'none',
    granularity: Granularity,
    filters: MetricsFilters = {}
): Promise<DimensionalTimeSeriesResponse> {
    const query = buildMasterQueryParams(filters);
    const prefix = query ? '&' : '?';

    return apiRequest(adminApi, {
        method: 'GET',
        url: `/master-conversion/trend${query}${prefix}dimension=${dimension}&granularity=${granularity}`,
    });
}
