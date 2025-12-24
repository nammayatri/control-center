export interface MasterConversionFilters {
    dateFrom?: string;
    dateTo?: string;
    city?: string[];
    merchantId?: string[];
    flowType?: string[];
    tripTag?: string[];
    serviceTier?: string[];
}

export interface SortOptions {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface MasterConversionExecutiveTotals {
    searches: number;
    quotesRequested: number;
    quotesAccepted: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    userCancellations: number;
    driverCancellations: number;
}

export interface MasterConversionExecutiveResponse {
    totals: MasterConversionExecutiveTotals;
    filters: MasterConversionFilters;
}

export interface MasterConversionComparisonPeriodData {
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    userCancellations: number;
    driverCancellations: number;
}

export interface MasterConversionComparisonChanges {
    searches: { absolute: number; percent: number };
    bookings: { absolute: number; percent: number };
    completedRides: { absolute: number; percent: number };
    earnings: { absolute: number; percent: number };
    userCancellations: { absolute: number; percent: number };
    driverCancellations: { absolute: number; percent: number };
}

export interface MasterConversionComparisonResponse {
    current: MasterConversionComparisonPeriodData;
    previous: MasterConversionComparisonPeriodData;
    change: MasterConversionComparisonChanges;
    currentPeriod: { from: string; to: string };
    previousPeriod: { from: string; to: string };
}

export interface MasterConversionTimeSeriesDataPoint {
    date: string;
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
}

export interface MasterConversionTimeSeriesResponse {
    data: MasterConversionTimeSeriesDataPoint[];
    filters: MasterConversionFilters;
}

export interface MasterConversionFilterOptionsResponse {
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

export interface GroupedMasterConversionRow {
    dimension: string;
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    conversionRate: number;
}

export interface GroupedMasterConversionResponse {
    data: GroupedMasterConversionRow[];
    groupBy: string;
    filters: MasterConversionFilters;
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
    filters: MasterConversionFilters;
}
