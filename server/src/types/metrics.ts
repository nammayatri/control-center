// ============================================
// Request Filters
// ============================================

export interface MetricsFilters {
    dateFrom?: string;
    dateTo?: string;
    city?: string[];
    flowType?: string[];
    tripTag?: string[];
    variant?: string[];
}

export interface SortOptions {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GroupByOptions {
    groupBy?: 'date' | 'city' | 'flow_type' | 'trip_tag' | 'variant';
}

export interface MetricsQueryParams extends MetricsFilters, SortOptions, GroupByOptions { }

// ============================================
// Raw Data Types (from ClickHouse)
// ============================================

export interface RawMetricsRow {
    date_info: string;
    city: string;
    flow_type: string;
    trip_tag: string;
    variant: string;
    searches: number | null;
    search_got_estimates: number | null;
    search_for_quotes: number | null;
    search_got_quotes: number | null;
    bookings: number | null;
    completed_rides: number | null;
    rides: number | null;
    earnings: number | null;
    distance: number | null;
    cancelled_bookings: number | null;
    driver_cancelled_bookings: number | null;
    user_cancelled_bookings: number | null;
    reg_riders: number | null;
    enabled_drivers: number | null;
    cab_enabled_drivers: number | null;
    auto_enabled_drivers: number | null;
    bike_enabled_drivers: number | null;
}

// ============================================
// Executive Metrics Response
// ============================================

export interface ExecutiveMetricsTotals {
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
}

export interface DriverMetrics {
    enabledDrivers: number;
    cabEnabledDrivers: number;
    autoEnabledDrivers: number;
    bikeEnabledDrivers: number;
}

export interface RiderMetrics {
    registeredRiders: number;
}

export interface ExecutiveMetricsResponse {
    totals: ExecutiveMetricsTotals;
    drivers: DriverMetrics;
    riders: RiderMetrics;
    filters: MetricsFilters;
}

// ============================================
// Conversion Metrics Response
// ============================================

export interface FunnelMetrics {
    searchToEstimate: number;
    estimateToQuote: number;
    quoteToBooking: number;
    bookingToCompletion: number;
}

export interface CancellationMetrics {
    overall: number;
    byDriver: number;
    byUser: number;
}

export interface ConversionMetricsResponse {
    funnel: FunnelMetrics;
    cancellation: CancellationMetrics;
    filters: MetricsFilters;
}

// ============================================
// Comparison Metrics Response
// ============================================

export interface MetricsChange {
    absolute: number;
    percent: number;
}

export interface ComparisonPeriodData {
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    cancelledBookings: number;
}

export interface ComparisonChanges {
    searches: MetricsChange;
    bookings: MetricsChange;
    completedRides: MetricsChange;
    earnings: MetricsChange;
    cancelledBookings: MetricsChange;
}

export interface ComparisonMetricsResponse {
    current: ComparisonPeriodData;
    previous: ComparisonPeriodData;
    change: ComparisonChanges;
    currentPeriod: { from: string; to: string };
    previousPeriod: { from: string; to: string };
}

// ============================================
// Time Series Response
// ============================================

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

// ============================================
// Filter Options Response
// ============================================

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

// ============================================
// Grouped/Breakdown Response
// ============================================

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
