import {
  apiRequest,
  adminApi,
  buildQueryParams as buildApiQueryParams,
} from "./api";

// ============================================
// Types
// ============================================

export interface MetricsFilters {
  dateFrom?: string;
  dateTo?: string;
  city?: string[];
  state?: string[];
  merchantId?: string[]; // Deprecated - kept for backward compatibility
  bapMerchantId?: string[];
  bppMerchantId?: string[];
  flowType?: string[];
  tripTag?: string[];
  userOsType?: string[];
  userSdkVersion?: string[];
  userBundleVersion?: string[];
  userBackendAppVersion?: string[];
  dynamicPricingLogicVersion?: string[];
  poolingLogicVersion?: string[];
  poolingConfigVersion?: string[];
  serviceTier?: string[];
  vehicleCategory?: "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny";
  vehicleSubCategory?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  groupBy?: "city" | "merchant_id" | "flow_type" | "trip_tag" | "service_tier" | "cancellation_trip_distance" | "cancellation_fare_breakup" | "cancellation_pickup_distance" | "cancellation_pickup_left" | "cancellation_time_to_cancel" | "cancellation_reason";
}

export type ServiceTierType = "tier-less" | "tier" | "bookany";

export interface ExecutiveMetricsResponse {
  totals: {
    searches: number;
    searchGotEstimates: number;
    quotesRequested: number;
    quotesAccepted: number;
    bookings: number;
    rides: number;
    completedRides: number;
    cancelledRides: number;
    earnings: number;
    userCancellations: number;
    driverCancellations: number;
    otherCancellations: number;
    // Calculated metrics
    conversionRate: number;
    riderFareAcceptanceRate?: number; // RFA - only for tier-less/bookany
    driverQuoteAcceptanceRate?: number; // DQA - only for tier-less/bookany
    driverAcceptanceRate?: number; // For tier (Rental/InterCity)
    cancellationRate: number;
    userCancellationRate: number;
    driverCancellationRate: number;
    otherCancellationRate: number;
    // Search tries: sum of searches for selected vehicle category
    searchTries?: number;
    lastUpdated?: string;
  };
  filters: MetricsFilters;
  tierType: ServiceTierType;
}

export interface ComparisonMetricsResponse {
  current: {
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    userCancellations: number;
    driverCancellations: number;
    searchForQuotes?: number;
    cancelledRides?: number;
    othersCancellation?: number;
    conversionRate?: number;
    cancellationRate?: number;
    userCancellationRate?: number;
    driverCancellationRate?: number;
  };
  previous: {
    searches: number;
    bookings: number;
    completedRides: number;
    earnings: number;
    userCancellations: number;
    driverCancellations: number;
    searchForQuotes?: number;
    cancelledRides?: number;
    othersCancellation?: number;
    conversionRate?: number;
    cancellationRate?: number;
    userCancellationRate?: number;
    driverCancellationRate?: number;
  };
  change: {
    searches: { absolute: number; percent: number };
    bookings: { absolute: number; percent: number };
    completedRides: { absolute: number; percent: number };
    earnings: { absolute: number; percent: number };
    userCancellations: { absolute: number; percent: number };
    driverCancellations: { absolute: number; percent: number };
    quotesRequested?: { absolute: number; percent: number };
    cancelledRides?: { absolute: number; percent: number };
    quotesAccepted?: { absolute: number; percent: number };
    conversionRate?: { absolute: number; percent: number };
    cancellationRate?: { absolute: number; percent: number };
    userCancellationRate?: { absolute: number; percent: number };
    driverCancellationRate?: { absolute: number; percent: number };
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
  searchForQuotes?: number;
  searchGotEstimates?: number;
  quotesAccepted?: number;
  cancelledRides?: number;
  userCancellations?: number;
  driverCancellations?: number;
}

export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[];
  filters: MetricsFilters;
}

export interface FilterOptionsResponse {
  cities: string[];
  states: string[];
  cityStateMap?: Record<string, string[]>; // state -> cities[]
  cityToStateMap?: Record<string, string>; // city -> state
  merchants: { id: string; name: string }[]; // Deprecated - kept for backward compatibility
  bapMerchants: { id: string; name: string }[];
  bppMerchants: { id: string; name: string }[];
  flowTypes: string[];
  tripTags: string[];
  userOsTypes?: string[];
  userSdkVersions?: string[];
  userBundleVersions?: string[];
  userBackendAppVersions?: string[];
  dynamicPricingLogicVersions?: string[];
  poolingLogicVersions?: string[];
  poolingConfigVersions?: string[];
  serviceTiers: string[];
  vehicleCategories: Array<{
    value: "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny";
    label: string;
  }>;
  vehicleSubCategories: Record<
    "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny",
    string[]
  >;
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
  searchForQuotes?: number;
  riderFareAcceptanceRate?: number;
  driverQuoteAcceptanceRate?: number;
  driverAcceptanceRate?: number;
  // Cancellation specific fields
  totalBookings?: number;
  bookingsCancelled?: number;
  userCancelled?: number;
  driverCancelled?: number;
  cancellationRate?: number;
  userCancellationRate?: number;
  driverCancellationRate?: number;
}

export interface GroupedMetricsResponse {
  data: GroupedMetricsRow[];
  groupBy: string;
  filters: MetricsFilters;
}

export type Dimension =
  | "city"
  | "service_tier"
  | "vehicle_category"
  | "vehicle_sub_category"
  | "flow_type"
  | "trip_tag"
  | "user_os_type"
  | "user_bundle_version"
  | "user_sdk_version"
  | "user_backend_app_version"
  | "dynamic_pricing_logic_version"
  | "pooling_logic_version"
  | "pooling_config_version"
  | "cancellation_trip_distance"
  | "cancellation_fare_breakup"
  | "cancellation_pickup_distance"
  | "cancellation_pickup_left"
  | "cancellation_time_to_cancel"
  | "cancellation_reason"
  | "run_hour"   // Temporal comparison: compare hours (within single day)
  | "run_day"    // Temporal comparison: compare days
  | "run_week"   // Temporal comparison: compare weeks
  | "run_month"; // Temporal comparison: compare months

export type Granularity = "hour" | "day";

export interface DimensionalTimeSeriesDataPoint {
  timestamp: string;
  dimensionValue: string;
  searches: number;
  completedRides: number;
  conversion: number;
  searchForQuotes?: number;
  searchGotEstimates?: number;
  quotesAccepted?: number;
  bookings?: number;
  cancelledRides?: number;
  userCancellations?: number;
  driverCancellations?: number;
  earnings?: number;
}

export interface DimensionalTimeSeriesResponse {
  data: DimensionalTimeSeriesDataPoint[];
  dimension: Dimension | "none";
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
  if (filters.city?.length) params.city = filters.city.join(",");
  if (filters.state?.length) params.state = filters.state.join(",");
  if (filters.merchantId?.length)
    params.merchantId = filters.merchantId.join(","); // Deprecated
  if (filters.bapMerchantId?.length)
    params.bapMerchantId = filters.bapMerchantId.join(",");
  if (filters.bppMerchantId?.length)
    params.bppMerchantId = filters.bppMerchantId.join(",");
  if (filters.flowType?.length) params.flowType = filters.flowType.join(",");
  if (filters.tripTag?.length) params.tripTag = filters.tripTag.join(",");
  if (filters.userOsType?.length)
    params.userOsType = filters.userOsType.join(",");
  if (filters.userSdkVersion?.length)
    params.userSdkVersion = filters.userSdkVersion.join(",");
  if (filters.userBundleVersion?.length)
    params.userBundleVersion = filters.userBundleVersion.join(",");
  if (filters.userBackendAppVersion?.length)
    params.userBackendAppVersion = filters.userBackendAppVersion.join(",");
  if (filters.dynamicPricingLogicVersion?.length)
    params.dynamicPricingLogicVersion =
      filters.dynamicPricingLogicVersion.join(",");
  if (filters.poolingLogicVersion?.length)
    params.poolingLogicVersion = filters.poolingLogicVersion.join(",");
  if (filters.poolingConfigVersion?.length)
    params.poolingConfigVersion = filters.poolingConfigVersion.join(",");
  if (filters.serviceTier?.length)
    params.serviceTier = filters.serviceTier.join(",");
  if (filters.vehicleCategory) params.vehicleCategory = filters.vehicleCategory;
  if (filters.vehicleSubCategory)
    params.vehicleSubCategory = filters.vehicleSubCategory;

  return buildApiQueryParams(params);
}

export async function getExecutiveMetrics(
  filters: MetricsFilters = {}
): Promise<ExecutiveMetricsResponse> {
  const query = buildMasterQueryParams(filters);
  return apiRequest(adminApi, {
    method: "GET",
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
  const prefix = query ? "&" : "?";
  const periodParams = `currentFrom=${currentFrom}&currentTo=${currentTo}&previousFrom=${previousFrom}&previousTo=${previousTo}`;

  return apiRequest(adminApi, {
    method: "GET",
    url: `/master-conversion/comparison${query}${prefix}${periodParams}`,
  });
}

export async function getTimeSeries(
  filters: MetricsFilters = {},
  granularity: Granularity = "day"
): Promise<TimeSeriesResponse> {
  const query = buildMasterQueryParams(filters);
  const prefix = query ? "&" : "?";

  return apiRequest(adminApi, {
    method: "GET",
    url: `/master-conversion/timeseries${query}${prefix}granularity=${granularity}`,
  });
}

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
  return apiRequest(adminApi, {
    method: "GET",
    url: "/master-conversion/filters",
  });
}



export async function getTrendData(
  dimension: Dimension | "none",
  granularity: Granularity,
  filters: MetricsFilters = {}
): Promise<DimensionalTimeSeriesResponse> {
  // Check if it's a cancellation metric
  if (dimension.startsWith('cancellation_')) {
    const validMap: Record<string, string> = {
      'cancellation_trip_distance': 'trip_distance_bkt',
      'cancellation_fare_breakup': 'fare_breakup',
      'cancellation_pickup_distance': 'actual_pickup_dist__bkt',
      'cancellation_pickup_left': 'pickup_dist_left_bucket',
      'cancellation_time_to_cancel': 'time_to_cancel_bkt',
      'cancellation_reason': 'reason_code'
    };

    const backendDimension = validMap[dimension];
    if (backendDimension) {
      const query = buildMasterQueryParams(filters); // No need to override groupBy here as it's separate param
      const prefix = query ? "&" : "?";
      return apiRequest(adminApi, {
        method: "GET",
        url: `/cancellations/trend${query}${prefix}dimension=${backendDimension}&granularity=${granularity}`,
      });
    }
  }

  const query = buildMasterQueryParams(filters);
  const prefix = query ? "&" : "?";

  return apiRequest(adminApi, {
    method: "GET",
    url: `/master-conversion/trend${query}${prefix}dimension=${dimension}&granularity=${granularity}`,
  });
}
