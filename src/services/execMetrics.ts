import axios from 'axios';

// Backend server URL - configurable via environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${BACKEND_URL}/api/metrics`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// Types
// ============================================

export interface MetricsFilters {
    dateFrom?: string;
    dateTo?: string;
    city?: string[];
    flowType?: string[];
    tripTag?: string[];
    variant?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    groupBy?: 'city' | 'flow_type' | 'trip_tag' | 'variant';
}

export interface ExecutiveMetricsResponse {
    totals: {
        searches: number;
        searchGotEstimates: number;
        searchForQuotes: number;
        searchGotQuotes: number;
        bookings: number;
        completedRides: number;
        rides: number;
        earnings: number;
        distance: number;
        cancelledBookings: number;
        driverCancelledBookings: number;
        userCancelledBookings: number;
    };
    drivers: {
        enabledDrivers: number;
        cabEnabledDrivers: number;
        autoEnabledDrivers: number;
        bikeEnabledDrivers: number;
    };
    riders: {
        registeredRiders: number;
    };
    filters: MetricsFilters;
}

export interface ConversionMetricsResponse {
    funnel: {
        searchToEstimate: number;
        estimateToQuote: number;
        quoteToBooking: number;
        bookingToCompletion: number;
    };
    cancellation: {
        overall: number;
        byDriver: number;
        byUser: number;
    };
    filters: MetricsFilters;
}

export interface ComparisonMetricsResponse {
    current: {
        searches: number;
        bookings: number;
        completedRides: number;
        earnings: number;
        cancelledBookings: number;
    };
    previous: {
        searches: number;
        bookings: number;
        completedRides: number;
        earnings: number;
        cancelledBookings: number;
    };
    change: {
        searches: { absolute: number; percent: number };
        bookings: { absolute: number; percent: number };
        completedRides: { absolute: number; percent: number };
        earnings: { absolute: number; percent: number };
        cancelledBookings: { absolute: number; percent: number };
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
    cancelledBookings: number;
}

export interface TimeSeriesResponse {
    data: TimeSeriesDataPoint[];
    filters: MetricsFilters;
}

export interface FilterOptionsResponse {
    cities: string[];
    flowTypes: string[];
    tripTags: string[];
    variants: string[];
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
    cancelledBookings: number;
    conversionRate: number;
}

export interface GroupedMetricsResponse {
    data: GroupedMetricsRow[];
    groupBy: string;
    filters: MetricsFilters;
}

// ============================================
// API Functions
// ============================================

function buildQueryParams(filters: MetricsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.city?.length) params.append('city', filters.city.join(','));
    if (filters.flowType?.length) params.append('flowType', filters.flowType.join(','));
    if (filters.tripTag?.length) params.append('tripTag', filters.tripTag.join(','));
    if (filters.variant?.length) params.append('variant', filters.variant.join(','));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    return params;
}

export async function getExecutiveMetrics(filters: MetricsFilters = {}): Promise<ExecutiveMetricsResponse> {
    const params = buildQueryParams(filters);
    const response = await api.get<ExecutiveMetricsResponse>(`/executive?${params}`);
    return response.data;
}

export async function getConversionMetrics(filters: MetricsFilters = {}): Promise<ConversionMetricsResponse> {
    const params = buildQueryParams(filters);
    const response = await api.get<ConversionMetricsResponse>(`/conversion?${params}`);
    return response.data;
}

export async function getComparisonMetrics(
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string,
    filters: MetricsFilters = {}
): Promise<ComparisonMetricsResponse> {
    const params = buildQueryParams(filters);
    params.append('currentFrom', currentFrom);
    params.append('currentTo', currentTo);
    params.append('previousFrom', previousFrom);
    params.append('previousTo', previousTo);

    const response = await api.get<ComparisonMetricsResponse>(`/comparison?${params}`);
    return response.data;
}

export async function getTimeSeries(filters: MetricsFilters = {}): Promise<TimeSeriesResponse> {
    const params = buildQueryParams(filters);
    const response = await api.get<TimeSeriesResponse>(`/timeseries?${params}`);
    return response.data;
}

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
    const response = await api.get<FilterOptionsResponse>('/filters');
    return response.data;
}

export async function getGroupedMetrics(
    groupBy: 'city' | 'flow_type' | 'trip_tag' | 'variant',
    filters: MetricsFilters = {}
): Promise<GroupedMetricsResponse> {
    const params = buildQueryParams({ ...filters, groupBy });
    const response = await api.get<GroupedMetricsResponse>(`/grouped?${params}`);
    return response.data;
}
