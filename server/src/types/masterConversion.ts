export interface MasterConversionFilters {
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
  vehicleCategory?: "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny" | ("Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny")[];
  vehicleSubCategory?: string | string[];
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Service tier type indicator
export type ServiceTierType = "tier-less" | "tier" | "bookany";

// New fields for conversion funnel
export interface ConversionFunnelFields {
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
}

// Calculated metrics based on tier type
export interface ConversionMetrics {
  conversionRate: number;
  riderFareAcceptanceRate?: number; // RFA - only for tier-less
  driverQuoteAcceptanceRate?: number; // DQA - only for tier-less
  driverAcceptanceRate?: number; // For tier (Rental/InterCity)
  cancellationRate: number;
  userCancellationRate: number;
  driverCancellationRate: number;
  otherCancellationRate: number;
}

export interface MasterConversionExecutiveTotals
  extends ConversionFunnelFields,
  ConversionMetrics {
  // Legacy fields for backward compatibility
  quotesRequested: number;
  quotesAccepted: number;
  // Search tries: sum of searches for the selected vehicle category (from "All" tier data)
  searchTries?: number;
  lastUpdated?: string;
}

export interface MasterConversionExecutiveResponse {
  totals: MasterConversionExecutiveTotals;
  filters: MasterConversionFilters;
  tierType: ServiceTierType; // Indicates which tier logic was used
}

export interface MasterConversionComparisonPeriodData
  extends Partial<ConversionFunnelFields> {
  searches: number;
  bookings: number;
  completedRides: number;
  earnings: number;
  userCancellations: number;
  driverCancellations: number;
  // Optional new fields
  searchForQuotes?: number;
  cancelledRides?: number;
  othersCancellation?: number;
  quotesAccepted?: number;
  conversionRate?: number;
  cancellationRate?: number;
  userCancellationRate?: number;
  driverCancellationRate?: number;
}

export interface MasterConversionComparisonChanges {
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
  searchForQuotes?: number; // For tier calculations
  searchGotEstimates?: number;
  quotesAccepted?: number;
  cancelledRides?: number;
  userCancellations?: number;
  driverCancellations?: number;
}

export interface MasterConversionTimeSeriesResponse {
  data: MasterConversionTimeSeriesDataPoint[];
  filters: MasterConversionFilters;
}

export interface MasterConversionFilterOptionsResponse {
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

export interface GroupedMasterConversionRow {
  dimension: string;
  searches: number;
  searchForQuotes?: number; // For tier calculations
  bookings: number;
  completedRides: number;
  earnings: number;
  conversionRate: number;
  // Additional metrics based on tier type
  riderFareAcceptanceRate?: number;
  driverQuoteAcceptanceRate?: number;
  driverAcceptanceRate?: number;
}

export interface GroupedMasterConversionResponse {
  data: GroupedMasterConversionRow[];
  groupBy: string;
  filters: MasterConversionFilters;
}

export type Dimension =
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
  | "pooling_config_version";

export type Granularity = "hour" | "day";

export interface DimensionalTimeSeriesDataPoint {
  timestamp: string;
  dimensionValue: string;
  searches: number;
  searchForQuotes?: number; // For tier calculations
  searchGotEstimates?: number;
  quotesAccepted?: number;
  bookings?: number;
  completedRides: number;
  cancelledRides?: number;
  userCancellations?: number;
  driverCancellations?: number;
  earnings?: number;
  conversion: number;
}

export interface DimensionalTimeSeriesResponse {
  data: DimensionalTimeSeriesDataPoint[];
  dimension: Dimension | "none";
  granularity: Granularity;
  filters: MasterConversionFilters;
}
