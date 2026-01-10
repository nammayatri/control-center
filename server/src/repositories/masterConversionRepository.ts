import { getClickHouseClient } from "../db/clickhouse.js";
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
  ServiceTierType,
  ConversionMetrics,
} from "../types/masterConversion.js";
import {
  getVehicleSubCategories,
  convertVehicleFiltersToServiceTiers,
  getVehicleCategory,
  type VehicleCategory,
} from "../utils/vehicleCategoryMapping.js";

const DATABASE = "cosmos";
const TABLE = "master_conversion";
const LIVE_TABLE = "master_conversion_live";
const FULL_TABLE = `${DATABASE}.${TABLE}`;
const FULL_LIVE_TABLE = `${DATABASE}.${LIVE_TABLE}`;

const COMMON_COLUMNS = [
  "local_time",
  "hour",
  "city_timezone",
  "bpp_merchant_id",
  "bap_merchant_name",
  "bpp_merchant_name",
  "bpp_mocid",
  "city",
  "state",
  "is_purple",
  "is_book_any",
  "flow_type",
  "trip_tag",
  "service_tier",
  "user_os_type",
  "user_sdk_version",
  "user_bundle_version",
  "user_backend_app_version",
  "dynamic_pricing_logic_version",
  "pooling_logic_version",
  "pooling_config_version",
  "searches",
  "retries",
  "search_got_estimates",
  "quotes_requested",
  "quotes_accepted",
  "bookings",
  "completed_rides",
  "rides",
  "cancelled_rides",
  "driver_cancellations",
  "user_cancellations",
  "other_cancellations",
  "unique_search_users",
  "unique_quote_request_users",
  "unique_ride_users",
  "unique_ride_cancelled_users",
  "unique_drivers_quote_accepted",
  "unique_ride_drivers",
  "unique_ride_cancelled_drivers",
  "total_driver_earnings",
  "total_travelled_distance",
  "total_time_to_accept",
  "total_driver_arrival_time",
  "date",
].join(", ");

/**
 * Returns a subquery that unions historical and live data.
 * The historical table is used for data before today,
 * and the live table is used for data from today onwards.
 */
function getEffectiveTableSubquery(): string {
  return `(
    SELECT ${COMMON_COLUMNS} FROM ${FULL_TABLE} WHERE local_time < toStartOfDay(now(), 'UTC')
    UNION ALL
    SELECT ${COMMON_COLUMNS} FROM ${FULL_LIVE_TABLE} WHERE local_time >= toStartOfDay(now(), 'UTC')
  )`;
}

// Type alias for query row results
type QueryRow = Record<string, unknown>;

// ============================================
// Helper Functions
// ============================================

/**
 * Determines the service tier type based on filters
 */
function getServiceTierType(filters: MasterConversionFilters): ServiceTierType {
  // Check vehicle category filters first (they take precedence)
  if (filters.vehicleCategory === "BookAny") {
    return "bookany";
  }
  if (filters.vehicleCategory && filters.vehicleCategory !== "All") {
    // Specific vehicle category selected = tier type
    return "tier";
  }

  // Then check service tier filters
  if (!filters.serviceTier || filters.serviceTier.length === 0) {
    return "tier-less"; // No filter = use "All" (tier-less)
  }

  const tiers = filters.serviceTier;
  if (tiers.includes("BookAny")) {
    return "bookany";
  }

  // Check if any tier is not "All" or "BookAny"
  const hasSpecificTier = tiers.some((t) => t !== "All" && t !== "BookAny");
  if (hasSpecificTier) {
    return "tier";
  }

  // Only "All" is selected
  return "tier-less";
}

/**
 * Builds WHERE clause with service tier logic:
 * - No service_tier filter → service_tier = "All" (tier-less)
 * - service_tier = "BookAny" → service_tier = "BookAny"
 * - service_tier = specific tier → service_tier = specific tier
 */
function buildWhereClause(filters: MasterConversionFilters): string {
  const conditions: string[] = [];

  if (filters.dateFrom) {
    // Use parseDateTimeBestEffort with UTC to match the user's query format
    // Format: 'YYYY-MM-DD 00:00:00' in UTC
    const dateFromWithTime = filters.dateFrom.includes(" ")
      ? filters.dateFrom
      : `${filters.dateFrom} 00:00:00`;
    conditions.push(
      `local_time >= parseDateTimeBestEffort('${dateFromWithTime}', 'UTC')`
    );
  }
  if (filters.dateTo) {
    // Check if dateTo includes time portion (for hourly granularity queries)
    if (filters.dateTo.includes(" ")) {
      // Has time portion - use it directly with <= operator for precise time filtering
      // This allows filtering by specific time ranges (e.g., 00:00:00 to 20:59:59)
      conditions.push(
        `local_time <= parseDateTimeBestEffort('${filters.dateTo}', 'UTC')`
      );
    } else {
      // No time portion - use the next day with < operator to include the entire day
      // This matches the user's query pattern: local_time < 'next_day 00:00:00'
      const dateToObj = new Date(filters.dateTo);
      dateToObj.setDate(dateToObj.getDate() + 1);
      const nextDay = dateToObj.toISOString().split("T")[0];
      const dateToWithTime = `${nextDay} 00:00:00`;
      conditions.push(
        `local_time < parseDateTimeBestEffort('${dateToWithTime}', 'UTC')`
      );
    }
  }
  if (filters.city && filters.city.length > 0) {
    const cities = filters.city.map((c) => `'${c}'`).join(",");
    conditions.push(`city IN (${cities})`);
  }
  if (filters.state && filters.state.length > 0) {
    const states = filters.state.map((s) => `'${s}'`).join(",");
    conditions.push(`state IN (${states})`);
  }
  // Handle merchant filters - support both old merchantId (backward compatibility) and new separate filters
  if (filters.merchantId && filters.merchantId.length > 0) {
    // Backward compatibility: treat as BPP merchants
    const validMerchants = filters.merchantId.filter(
      (m) => m && m !== "__all__"
    );
    if (validMerchants.length > 0) {
      const merchants = validMerchants.map((m) => `'${m}'`).join(",");
      conditions.push(`bpp_merchant_id IN (${merchants})`);
    }
  }
  if (filters.bapMerchantId && filters.bapMerchantId.length > 0) {
    const validBapMerchants = filters.bapMerchantId.filter(
      (m) => m && m !== "__all__"
    );
    if (validBapMerchants.length > 0) {
      const bapMerchants = validBapMerchants.map((m) => `'${m}'`).join(",");
      // Filter by BAP merchant name and ensure it's not NULL or empty
      // Use trim to handle any whitespace issues
      conditions.push(
        `trim(bap_merchant_name) IN (${bapMerchants}) AND bap_merchant_name IS NOT NULL AND bap_merchant_name != ''`
      );
    }
  }
  if (filters.bppMerchantId && filters.bppMerchantId.length > 0) {
    const validBppMerchants = filters.bppMerchantId.filter(
      (m) => m && m !== "__all__"
    );
    if (validBppMerchants.length > 0) {
      const bppMerchants = validBppMerchants.map((m) => `'${m}'`).join(",");
      conditions.push(`bpp_merchant_id IN (${bppMerchants})`);
    }
  }
  if (filters.flowType && filters.flowType.length > 0) {
    const flowTypes = filters.flowType.map((f) => `'${f}'`).join(",");
    conditions.push(`flow_type IN (${flowTypes})`);
  }
  if (filters.tripTag && filters.tripTag.length > 0) {
    const tripTags = filters.tripTag.map((t) => `'${t}'`).join(",");
    conditions.push(`trip_tag IN (${tripTags})`);
  }
  if (filters.userOsType && filters.userOsType.length > 0) {
    const validUserOsTypes = filters.userOsType.filter(
      (t) => t && t !== "__all__"
    );
    if (validUserOsTypes.length > 0) {
      const userOsTypes = validUserOsTypes.map((t) => `'${t}'`).join(",");
      conditions.push(`user_os_type IN (${userOsTypes})`);
    }
  }
  if (filters.userSdkVersion && filters.userSdkVersion.length > 0) {
    const validVersions = filters.userSdkVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`user_sdk_version IN (${versions})`);
    }
  }
  if (filters.userBundleVersion && filters.userBundleVersion.length > 0) {
    const validVersions = filters.userBundleVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`user_bundle_version IN (${versions})`);
    }
  }
  if (
    filters.userBackendAppVersion &&
    filters.userBackendAppVersion.length > 0
  ) {
    const validVersions = filters.userBackendAppVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`user_backend_app_version IN (${versions})`);
    }
  }
  if (
    filters.dynamicPricingLogicVersion &&
    filters.dynamicPricingLogicVersion.length > 0
  ) {
    const validVersions = filters.dynamicPricingLogicVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`dynamic_pricing_logic_version IN (${versions})`);
    }
  }
  if (filters.poolingLogicVersion && filters.poolingLogicVersion.length > 0) {
    const validVersions = filters.poolingLogicVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`pooling_logic_version IN (${versions})`);
    }
  }
  if (filters.poolingConfigVersion && filters.poolingConfigVersion.length > 0) {
    const validVersions = filters.poolingConfigVersion.filter(
      (t) => t && t !== "__all__"
    );
    if (validVersions.length > 0) {
      const versions = validVersions.map((t) => `'${t}'`).join(",");
      conditions.push(`pooling_config_version IN (${versions})`);
    }
  }

  // Handle vehicle category filters - convert to service_tier filters
  let effectiveServiceTiers = filters.serviceTier;
  const hasVehicleFilter = filters.vehicleCategory || filters.vehicleSubCategory;

  if (hasVehicleFilter) {
    const vehicleTiers = convertVehicleFiltersToServiceTiers(
      filters.vehicleCategory as any,
      filters.vehicleSubCategory as any
    );
    if (vehicleTiers.length > 0) {
      // If both vehicle filters and serviceTier are provided, use intersection
      if (effectiveServiceTiers && effectiveServiceTiers.length > 0) {
        effectiveServiceTiers = effectiveServiceTiers.filter((tier) =>
          vehicleTiers.includes(tier)
        );
      } else {
        effectiveServiceTiers = vehicleTiers;
      }
    }
  }

  if (effectiveServiceTiers && effectiveServiceTiers.length > 0) {
    const tiers = effectiveServiceTiers.map((t) => `'${t}'`).join(",");
    conditions.push(`service_tier IN (${tiers})`);

    // If we're filtering by specific tiers (Auto, Cab, etc.), 
    // we should usually exclude 'All' to avoid double counting, 
    // UNLESS 'All' was explicitly requested.
    if (!effectiveServiceTiers.includes("All")) {
      conditions.push(`service_tier != 'All'`);
    }
  } else {
    // Default: only show 'All' tier for general overview if no specific category/tier is selected
    // BUT only if we are NOT grouping by something that NEEDS tiered data
    // In buildWhereClause, we don't know the grouping, so we rely on the caller or default to All.
    // For now, keep existing behavior for general totals.
    // No service tier filter = use tier-less data (service_tier = "All")
    conditions.push(`service_tier = 'All'`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function buildOrderClause(sort: SortOptions): string {
  if (!sort.sortBy) return "";
  const order = sort.sortOrder === "desc" ? "DESC" : "ASC";
  return `ORDER BY ${sort.sortBy} ${order}`;
}

function safeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate conversion rate as percentage (0-100)
 */
function safeRatePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/**
 * Calculate metrics based on tier type and raw data
 */
function calculateMetrics(
  data: {
    searches: number;
    searchGotEstimates: number;
    quotesRequested: number;
    quotesAccepted: number;
    bookings: number;
    rides: number;
    completedRides: number;
    cancelledRides: number;
    userCancellations: number;
    driverCancellations: number;
    otherCancellations: number;
    searchTries?: number; // Optional searchTries for tier type conversion calculation
  },
  tierType: ServiceTierType
): ConversionMetrics {
  const metrics: ConversionMetrics = {
    conversionRate: 0,
    cancellationRate: 0,
    userCancellationRate: 0,
    driverCancellationRate: 0,
    otherCancellationRate: 0,
  };

  // Conversion Rate calculation based on tier type
  if (tierType === "tier-less" || tierType === "bookany") {
    // Tier-less/BookAny: completed_rides / searches * 100
    metrics.conversionRate = safeRatePercent(
      data.completedRides,
      data.searches
    );

    // RFA (Rider Fare Acceptance Rate): quotes_requested / search_got_estimates * 100
    if (data.searchGotEstimates > 0) {
      metrics.riderFareAcceptanceRate = safeRatePercent(
        data.quotesRequested,
        data.searchGotEstimates
      );
    }

    // DQA (Driver Quote Acceptance Rate): quotes_accepted / quotes_requested * 100
    if (data.quotesRequested > 0) {
      metrics.driverQuoteAcceptanceRate = safeRatePercent(
        data.quotesAccepted,
        data.quotesRequested
      );
    }
  } else if (tierType === "tier") {
    // Tier: completed_rides / quotes_requested * 100
    // If quotes_requested is 0, use searchTries as fallback (if available), otherwise use searches
    const denominator =
      data.quotesRequested > 0
        ? data.quotesRequested
        : data.searchTries && data.searchTries > 0
          ? data.searchTries
          : data.searches;
    metrics.conversionRate = safeRatePercent(data.completedRides, denominator);

    // Driver Acceptance Rate: rides / bookings * 100 (for Rental/InterCity)
    if (data.bookings > 0) {
      metrics.driverAcceptanceRate = safeRatePercent(data.rides, data.bookings);
    }
  }

  // Cancellation rates (same for all tier types)
  const completedBookings = data.completedRides + data.cancelledRides;
  if (completedBookings > 0) {
    metrics.cancellationRate = safeRatePercent(
      data.cancelledRides,
      completedBookings
    );
    metrics.userCancellationRate = safeRatePercent(
      data.userCancellations,
      completedBookings
    );
    metrics.driverCancellationRate = safeRatePercent(
      data.driverCancellations,
      completedBookings
    );
    metrics.otherCancellationRate = safeRatePercent(
      data.otherCancellations,
      completedBookings
    );
  }

  return metrics;
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

async function executeQuery(query: string): Promise<QueryRow[]> {
  try {
    const client = getClickHouseClient();
    const result = await client.query({ query, format: "JSONEachRow" });
    return (await result.json()) as QueryRow[];
  } catch (error) {
    console.error("ClickHouse query error:", error);
    console.error("Query:", query);
    throw error;
  }
}

// ============================================
// Executive Metrics
// ============================================

export async function getExecutiveMetrics(
  filters: MasterConversionFilters
): Promise<MasterConversionExecutiveTotals> {
  const whereClause = buildWhereClause(filters);
  const tierType = getServiceTierType(filters);

  // Debug: Log the WHERE clause for troubleshooting
  if (filters.bapMerchantId || filters.bppMerchantId) {
    console.log("Merchant filters:", {
      bapMerchantId: filters.bapMerchantId,
      bppMerchantId: filters.bppMerchantId,
    });
    console.log("WHERE clause:", whereClause);
  }

  // Debug: Log the query for troubleshooting
  const query = `
    SELECT
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(rides, rides IS NOT NULL) as rides,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_rides, cancelled_rides IS NOT NULL) as cancelled_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations,
      sumIf(other_cancellations, other_cancellations IS NOT NULL) as other_cancellations,
      maxIf(local_time, local_time >= toStartOfDay(now(), 'UTC')) as last_updated
    FROM ${getEffectiveTableSubquery()}
    ${whereClause}
  `;

  const rows = await executeQuery(query);
  const row = rows[0] || {};

  const rawData = {
    searches: safeNumber(row.searches),
    searchGotEstimates: safeNumber(row.search_got_estimates),
    quotesRequested: safeNumber(row.quotes_requested),
    quotesAccepted: safeNumber(row.quotes_accepted),
    bookings: safeNumber(row.bookings),
    rides: safeNumber(row.rides),
    completedRides: safeNumber(row.completed_rides),
    cancelledRides: safeNumber(row.cancelled_rides),
    earnings: safeNumber(row.earnings),
    userCancellations: safeNumber(row.user_cancellations),
    driverCancellations: safeNumber(row.driver_cancellations),
    otherCancellations: safeNumber(row.other_cancellations),
    lastUpdated: row.last_updated ? String(row.last_updated) : undefined,
  };

  // Search try and Quotes requested are the same.
  const searchTries = rawData.quotesRequested;

  // Now calculate metrics with searchTries available
  const metrics = calculateMetrics({ ...rawData, searchTries }, tierType);

  return {
    ...rawData,
    ...metrics,
    searchTries,
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
  filters: Omit<MasterConversionFilters, "dateFrom" | "dateTo">
): Promise<{
  current: MasterConversionComparisonPeriodData;
  previous: MasterConversionComparisonPeriodData;
  change: MasterConversionComparisonResponse["change"];
}> {
  const baseFilters = buildWhereClause({
    ...filters,
    dateFrom: undefined,
    dateTo: undefined,
  });
  const filterCondition = baseFilters
    ? baseFilters.replace("WHERE", "AND")
    : "";

  // Format dates with time for proper UTC handling
  const formatDateForQuery = (
    dateStr: string,
    isEndDate: boolean = false
  ): string => {
    if (dateStr.includes(" ")) return dateStr;
    const dateObj = new Date(dateStr);
    if (isEndDate) {
      dateObj.setDate(dateObj.getDate() + 1);
    }
    const formatted = dateObj.toISOString().split("T")[0];
    return `${formatted} 00:00:00`;
  };

  const currentFromDate = new Date(formatDateForQuery(currentFrom, false));
  const currentToDate = new Date(formatDateForQuery(currentTo, true));
  const previousFromDate = new Date(formatDateForQuery(previousFrom, false));
  const previousToDate = new Date(formatDateForQuery(previousTo, true));

  const now = new Date();

  // If current period includes "now", we should limit both intervals for a fair comparison
  let effectiveCurrentTo = currentToDate;
  let effectivePreviousTo = previousToDate;

  if (currentFromDate <= now && currentToDate > now) {
    // Current period is active (includes "today")
    effectiveCurrentTo = now;

    // Calculate the offset from the start of the current period
    const offsetMs = now.getTime() - currentFromDate.getTime();

    // Apply the same offset to the start of the previous period
    effectivePreviousTo = new Date(previousFromDate.getTime() + offsetMs);
  }

  const currentFromFormatted = currentFromDate.toISOString().replace('T', ' ').split('.')[0];
  const currentToFormatted = effectiveCurrentTo.toISOString().replace('T', ' ').split('.')[0];
  const previousFromFormatted = previousFromDate.toISOString().replace('T', ' ').split('.')[0];
  const previousToFormatted = effectivePreviousTo.toISOString().replace('T', ' ').split('.')[0];

  const query = `
    SELECT
      'current' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(rides, rides IS NOT NULL) as rides,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_rides, cancelled_rides IS NOT NULL) as cancelled_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations,
      sumIf(other_cancellations, other_cancellations IS NOT NULL) as other_cancellations
    FROM ${getEffectiveTableSubquery()}
    WHERE local_time >= parseDateTimeBestEffort('${currentFromFormatted}', 'UTC') 
      AND local_time < parseDateTimeBestEffort('${currentToFormatted}', 'UTC')
    ${filterCondition}
    UNION ALL
    SELECT
      'previous' as period,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(rides, rides IS NOT NULL) as rides,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_rides, cancelled_rides IS NOT NULL) as cancelled_rides,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations,
      sumIf(other_cancellations, other_cancellations IS NOT NULL) as other_cancellations
    FROM ${getEffectiveTableSubquery()}
    WHERE local_time >= parseDateTimeBestEffort('${previousFromFormatted}', 'UTC') 
      AND local_time < parseDateTimeBestEffort('${previousToFormatted}', 'UTC')
    ${filterCondition}
  `;

  const rows = await executeQuery(query);
  const currentRow = rows.find((r) => r.period === "current") || {};
  const previousRow = rows.find((r) => r.period === "previous") || {};

  const tierType = getServiceTierType(filters);

  const currentMetrics = calculateMetrics(
    {
      searches: safeNumber(currentRow.searches),
      searchGotEstimates: safeNumber(currentRow.search_got_estimates),
      quotesRequested: safeNumber(currentRow.quotes_requested),
      quotesAccepted: safeNumber(currentRow.quotes_accepted),
      bookings: safeNumber(currentRow.bookings),
      rides: safeNumber(currentRow.rides),
      completedRides: safeNumber(currentRow.completed_rides),
      cancelledRides: safeNumber(currentRow.cancelled_rides),
      userCancellations: safeNumber(currentRow.user_cancellations),
      driverCancellations: safeNumber(currentRow.driver_cancellations),
      otherCancellations: safeNumber(currentRow.other_cancellations),
    },
    tierType
  );

  const previousMetrics = calculateMetrics(
    {
      searches: safeNumber(previousRow.searches),
      searchGotEstimates: safeNumber(previousRow.search_got_estimates),
      quotesRequested: safeNumber(previousRow.quotes_requested),
      quotesAccepted: safeNumber(previousRow.quotes_accepted),
      bookings: safeNumber(previousRow.bookings),
      rides: safeNumber(previousRow.rides),
      completedRides: safeNumber(previousRow.completed_rides),
      cancelledRides: safeNumber(previousRow.cancelled_rides),
      userCancellations: safeNumber(previousRow.user_cancellations),
      driverCancellations: safeNumber(previousRow.driver_cancellations),
      otherCancellations: safeNumber(previousRow.other_cancellations),
    },
    tierType
  );

  const current: MasterConversionComparisonPeriodData = {
    searches: safeNumber(currentRow.searches),
    bookings: safeNumber(currentRow.bookings),
    completedRides: safeNumber(currentRow.completed_rides),
    earnings: safeNumber(currentRow.earnings),
    userCancellations: safeNumber(currentRow.user_cancellations),
    driverCancellations: safeNumber(currentRow.driver_cancellations),
    searchForQuotes: safeNumber(currentRow.quotes_requested),
    cancelledRides: safeNumber(currentRow.cancelled_rides),
    othersCancellation: safeNumber(currentRow.other_cancellations),
    quotesAccepted: safeNumber(currentRow.quotes_accepted),
    conversionRate: currentMetrics.conversionRate,
    cancellationRate: currentMetrics.cancellationRate,
    userCancellationRate: currentMetrics.userCancellationRate,
    driverCancellationRate: currentMetrics.driverCancellationRate,
  };

  const previous: MasterConversionComparisonPeriodData = {
    searches: safeNumber(previousRow.searches),
    bookings: safeNumber(previousRow.bookings),
    completedRides: safeNumber(previousRow.completed_rides),
    earnings: safeNumber(previousRow.earnings),
    userCancellations: safeNumber(previousRow.user_cancellations),
    driverCancellations: safeNumber(previousRow.driver_cancellations),
    searchForQuotes: safeNumber(previousRow.quotes_requested),
    cancelledRides: safeNumber(previousRow.cancelled_rides),
    othersCancellation: safeNumber(previousRow.other_cancellations),
    quotesAccepted: safeNumber(previousRow.quotes_accepted),
    conversionRate: previousMetrics.conversionRate,
    cancellationRate: previousMetrics.cancellationRate,
    userCancellationRate: previousMetrics.userCancellationRate,
    driverCancellationRate: previousMetrics.driverCancellationRate,
  };

  const calculateChange = (key: keyof MasterConversionComparisonPeriodData) => {
    const currentVal = current[key] ?? 0;
    const previousVal = previous[key] ?? 0;
    return {
      absolute: currentVal - previousVal,
      percent: calculatePercentChange(currentVal, previousVal),
    };
  };

  return {
    current,
    previous,
    change: {
      searches: calculateChange("searches"),
      bookings: calculateChange("bookings"),
      completedRides: calculateChange("completedRides"),
      earnings: calculateChange("earnings"),
      userCancellations: calculateChange("userCancellations"),
      driverCancellations: calculateChange("driverCancellations"),
      quotesRequested: calculateChange("searchForQuotes"),
      cancelledRides: calculateChange("cancelledRides"),
      quotesAccepted: calculateChange("quotesAccepted"),
      conversionRate: calculateChange("conversionRate"),
      cancellationRate: calculateChange("cancellationRate"),
      userCancellationRate: calculateChange("userCancellationRate"),
      driverCancellationRate: calculateChange("driverCancellationRate"),
    },
  };
}

// ============================================
// Time Series
// ============================================

export async function getTimeSeries(
  filters: MasterConversionFilters,
  sort: SortOptions,
  granularity: Granularity = "day"
): Promise<MasterConversionTimeSeriesDataPoint[]> {
  // buildWhereClause now handles time portion automatically when present
  const whereClause = buildWhereClause(filters);
  const orderClause = sort.sortBy
    ? buildOrderClause(sort)
    : "ORDER BY date ASC";

  const timeBucketExpr =
    granularity === "hour"
      ? "formatDateTime(toStartOfHour(local_time), '%Y-%m-%d %H:00:00')"
      : "formatDateTime(toDate(local_time), '%Y-%m-%d')";

  const query = `
    SELECT
      ${timeBucketExpr} as date,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(search_got_estimates, search_got_estimates IS NOT NULL) as search_got_estimates,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_rides, cancelled_rides IS NOT NULL) as cancelled_rides,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings
    FROM ${getEffectiveTableSubquery()}
    ${whereClause}
    GROUP BY date
    ${orderClause}
  `;

  const rows = await executeQuery(query);

  return rows.map((row) => {
    const result: MasterConversionTimeSeriesDataPoint = {
      date: String(row.date),
      searches: safeNumber(row.searches),
      bookings: safeNumber(row.bookings),
      completedRides: safeNumber(row.completed_rides),
      earnings: safeNumber(row.earnings),
    };

    const searchForQuotes = safeNumber(row.quotes_requested);
    if (searchForQuotes > 0) {
      result.searchForQuotes = searchForQuotes;
    }

    const searchGotEstimates = safeNumber(row.search_got_estimates);
    if (searchGotEstimates > 0) {
      result.searchGotEstimates = searchGotEstimates;
    }

    const quotesAccepted = safeNumber(row.quotes_accepted);
    if (quotesAccepted > 0) {
      result.quotesAccepted = quotesAccepted;
    }

    const cancelledRides = safeNumber(row.cancelled_rides);
    if (cancelledRides > 0) {
      result.cancelledRides = cancelledRides;
    }

    const userCancellations = safeNumber(row.user_cancellations);
    if (userCancellations > 0) {
      result.userCancellations = userCancellations;
    }

    const driverCancellations = safeNumber(row.driver_cancellations);
    if (driverCancellations > 0) {
      result.driverCancellations = driverCancellations;
    }

    return result;
  });
}

// ============================================
// Filter Options
// ============================================

export async function getFilterOptions(): Promise<MasterConversionFilterOptionsResponse> {
  // Get city-state pairs to enable filtering cities by state
  const cityStateQuery = `
    SELECT
      city,
      state
    FROM ${getEffectiveTableSubquery()}
    WHERE city IS NOT NULL AND state IS NOT NULL
    GROUP BY city, state
    ORDER BY state, city
  `;

  const query = `
    SELECT
      groupArray(DISTINCT city) as cities,
      groupArray(DISTINCT state) as states,
      groupArray(DISTINCT bpp_merchant_id) as bpp_merchant_ids,
      groupArray(DISTINCT bpp_merchant_name) as bpp_merchant_names,
      groupArray(DISTINCT flow_type) as flow_types,
      groupArray(DISTINCT trip_tag) as trip_tags,
      groupArray(DISTINCT user_os_type) as user_os_types,
      groupArray(DISTINCT user_sdk_version) as user_sdk_versions,
      groupArray(DISTINCT user_bundle_version) as user_bundle_versions,
      groupArray(DISTINCT user_backend_app_version) as user_backend_app_versions,
      groupArray(DISTINCT dynamic_pricing_logic_version) as dynamic_pricing_logic_versions,
      groupArray(DISTINCT pooling_logic_version) as pooling_logic_versions,
      groupArray(DISTINCT pooling_config_version) as pooling_config_versions,
      groupArray(DISTINCT service_tier) as service_tiers,
      min(local_time) as min_date,
      max(local_time) as max_date
    FROM ${getEffectiveTableSubquery()}
  `;

  const [rows, cityStateRows] = await Promise.all([
    executeQuery(query),
    executeQuery(cityStateQuery),
  ]);
  const row = rows[0] || {};

  // Get BAP merchants - use bap_merchant_name (there is no bap_merchant_id column)
  let bapMerchantIds: string[] = [];
  let bapMerchantNames: string[] = [];
  try {
    // Fetch all BAP merchants - use bap_merchant_name as both ID and name
    const bapQuery = `
      SELECT
        groupArray(DISTINCT bap_merchant_name) as bap_merchant_names
      FROM ${getEffectiveTableSubquery()}
      WHERE bap_merchant_name IS NOT NULL AND bap_merchant_name != ''
    `;
    const bapRows = await executeQuery(bapQuery);
    if (bapRows && bapRows.length > 0) {
      bapMerchantNames = (bapRows[0].bap_merchant_names as string[]) || [];
      // Use names as IDs since there's no separate bap_merchant_id column
      bapMerchantIds = bapMerchantNames;
      console.log(
        `Found ${bapMerchantNames.length} BAP merchants:`,
        bapMerchantNames
      );
    }
  } catch (error: any) {
    // BAP columns don't exist or query failed - log the full error for debugging
    const errorMsg = error?.message || String(error);
    console.error("Error fetching BAP merchants. Full error:", errorMsg);
  }

  // Build city-state mapping
  const cityStateMap: Record<string, string[]> = {}; // state -> cities[]
  const cityToStateMap: Record<string, string> = {}; // city -> state
  cityStateRows.forEach((r) => {
    const city = String(r.city);
    const state = String(r.state);
    if (!cityStateMap[state]) {
      cityStateMap[state] = [];
    }
    if (!cityStateMap[state].includes(city)) {
      cityStateMap[state].push(city);
    }
    cityToStateMap[city] = state;
  });

  const bppMerchantIds = (row.bpp_merchant_ids as string[]) || [];
  const bppMerchantNames = (row.bpp_merchant_names as string[]) || [];

  // Combine BPP IDs and Names
  const bppMerchantList = bppMerchantIds.map((id, index) => ({
    id,
    name: bppMerchantNames[index] || id,
    source: "BPP" as const,
  }));

  // Combine BAP IDs and Names (from separate query if available)
  const bapMerchantList = bapMerchantIds.map((id, index) => ({
    id,
    name: bapMerchantNames[index] || id,
    source: "BAP" as const,
  }));

  // Combine all merchants - BAP and BPP are separate entities
  // A BAP merchant can send requests to a BPP merchant, so we show all of them
  type MerchantItem = { id: string; name: string; source: "BPP" | "BAP" };
  const merchantMap = new Map<string, MerchantItem>();

  // Add all BPP merchants
  bppMerchantList.forEach((m) => {
    merchantMap.set(m.id, m);
  });

  // Add all BAP merchants (they are separate entities, not filtered by name)
  bapMerchantList.forEach((m) => {
    merchantMap.set(m.id, m);
  });

  const merchantList = Array.from(merchantMap.values());

  // Sort merchants: NAMMA_YATRI first, then BHARAT_TAXI, JATRI_SATHI, ANNA_APP, then others
  const merchantPriority = [
    "NAMMA_YATRI",
    "BHARAT_TAXI",
    "JATRI_SATHI",
    "ANNA_APP",
  ];
  const merchants = [
    ...merchantList
      .filter((m) => merchantPriority.includes(m.name))
      .sort((a, b) => {
        const indexA = merchantPriority.indexOf(a.name);
        const indexB = merchantPriority.indexOf(b.name);
        return indexA - indexB;
      }),
    ...merchantList
      .filter((m) => !merchantPriority.includes(m.name))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];

  // Build vehicle category options - ordered: Auto, Cab, Others, Bike, then All Categories and BookAny
  const vehicleCategories: Array<{ value: VehicleCategory; label: string }> = [
    { value: "Auto", label: "Auto" },
    { value: "Cab", label: "Cab" },
    { value: "Others", label: "Others" },
    { value: "Bike", label: "Bike" },
    { value: "All", label: "All Categories" },
    { value: "BookAny", label: "BookAny" },
  ];

  // Build vehicle sub-categories mapping
  const vehicleSubCategories: Record<VehicleCategory, string[]> = {
    All: getVehicleSubCategories("All"),
    Bike: getVehicleSubCategories("Bike"),
    Auto: getVehicleSubCategories("Auto"),
    Cab: getVehicleSubCategories("Cab"),
    Others: getVehicleSubCategories("Others"),
    BookAny: getVehicleSubCategories("BookAny"),
  };

  // Sort cities: Bangalore, Kolkata, Chennai, Bhubaneshwar, Kochi first, then others
  const cityPriority = [
    "Bangalore",
    "Kolkata",
    "Chennai",
    "Bhubaneshwar",
    "Kochi",
  ];
  const cities = (row.cities as string[]) || [];
  const sortedCities = [
    ...cities
      .filter((c) => cityPriority.includes(c))
      .sort((a, b) => {
        const indexA = cityPriority.indexOf(a);
        const indexB = cityPriority.indexOf(b);
        return indexA - indexB;
      }),
    ...cities.filter((c) => !cityPriority.includes(c)).sort(),
  ];

  // Separate BAP and BPP merchants
  const bapMerchants = merchantList
    .filter((m) => m.source === "BAP")
    .map(({ id, name }) => ({ id, name }));
  const bppMerchants = merchantList
    .filter((m) => m.source === "BPP")
    .map(({ id, name }) => ({ id, name }));

  return {
    cities: sortedCities,
    states: (row.states as string[]) || [],
    cityStateMap, // Mapping of state -> cities[]
    cityToStateMap, // Mapping of city -> state
    merchants, // Keep for backward compatibility
    bapMerchants,
    bppMerchants,
    flowTypes: (row.flow_types as string[]) || [],
    tripTags: (row.trip_tags as string[]) || [],
    userOsTypes: (row.user_os_types as string[]) || [],
    userSdkVersions: (row.user_sdk_versions as string[]) || [],
    userBundleVersions: (row.user_bundle_versions as string[]) || [],
    userBackendAppVersions: (row.user_backend_app_versions as string[]) || [],
    dynamicPricingLogicVersions:
      (row.dynamic_pricing_logic_versions as string[]) || [],
    poolingLogicVersions: (row.pooling_logic_versions as string[]) || [],
    poolingConfigVersions: (row.pooling_config_versions as string[]) || [],
    serviceTiers: (row.service_tiers as string[]) || [],
    vehicleCategories,
    vehicleSubCategories,
    dateRange: {
      min: String(row.min_date || ""),
      max: String(row.max_date || ""),
    },
  };
}

// ============================================


// ============================================
// Dimensional Trend Metrics
// ============================================

export async function getDimensionalTimeSeries(
  filters: MasterConversionFilters,
  dimension: Dimension | "none",
  granularity: Granularity
): Promise<DimensionalTimeSeriesDataPoint[]> {
  // When grouping by vehicle dimensions (category, sub_category, or service_tier), we need to:
  // 1. See all service_tiers (not just 'All')
  // 2. Exclude tier-less data (service_tier = 'All') to prevent double-counting
  // 3. Not apply vehicle category filters
  const needsVehicleMapping =
    dimension === "vehicle_category" ||
    dimension === "vehicle_sub_category" ||
    dimension === "service_tier";

  let whereClause: string;
  if (needsVehicleMapping) {
    // Build WHERE clause without vehicle category filters and without defaulting to "All"
    const filtersForQuery = {
      ...filters,
      vehicleCategory: undefined,
      vehicleSubCategory: undefined,
      serviceTier: undefined, // Remove service tier filter to get all tiers
    };
    const conditions: string[] = [];

    if (filtersForQuery.dateFrom) {
      const dateFromWithTime = filtersForQuery.dateFrom.includes(" ")
        ? filtersForQuery.dateFrom
        : `${filtersForQuery.dateFrom} 00:00:00`;
      conditions.push(
        `local_time >= parseDateTimeBestEffort('${dateFromWithTime}', 'UTC')`
      );
    }
    if (filtersForQuery.dateTo) {
      if (filtersForQuery.dateTo.includes(" ")) {
        conditions.push(
          `local_time <= parseDateTimeBestEffort('${filtersForQuery.dateTo}', 'UTC')`
        );
      } else {
        const dateToObj = new Date(filtersForQuery.dateTo);
        dateToObj.setDate(dateToObj.getDate() + 1);
        const nextDay = dateToObj.toISOString().split("T")[0];
        const dateToWithTime = `${nextDay} 00:00:00`;
        conditions.push(
          `local_time < parseDateTimeBestEffort('${dateToWithTime}', 'UTC')`
        );
      }
    }
    if (filtersForQuery.city && filtersForQuery.city.length > 0) {
      const cities = filtersForQuery.city.map((c) => `'${c}'`).join(",");
      conditions.push(`city IN (${cities})`);
    }
    if (filtersForQuery.state && filtersForQuery.state.length > 0) {
      const states = filtersForQuery.state.map((s) => `'${s}'`).join(",");
      conditions.push(`state IN (${states})`);
    }
    // Handle merchant filters
    if (filtersForQuery.merchantId && filtersForQuery.merchantId.length > 0) {
      const validMerchants = filtersForQuery.merchantId.filter(
        (m) => m && m !== "__all__"
      );
      if (validMerchants.length > 0) {
        const merchants = validMerchants.map((m) => `'${m}'`).join(",");
        conditions.push(`bpp_merchant_id IN (${merchants})`);
      }
    }
    if (
      filtersForQuery.bapMerchantId &&
      filtersForQuery.bapMerchantId.length > 0
    ) {
      const validBapMerchants = filtersForQuery.bapMerchantId.filter(
        (m) => m && m !== "__all__"
      );
      if (validBapMerchants.length > 0) {
        const bapMerchants = validBapMerchants.map((m) => `'${m}'`).join(",");
        conditions.push(
          `trim(bap_merchant_name) IN (${bapMerchants}) AND bap_merchant_name IS NOT NULL AND bap_merchant_name != ''`
        );
      }
    }
    if (
      filtersForQuery.bppMerchantId &&
      filtersForQuery.bppMerchantId.length > 0
    ) {
      const validBppMerchants = filtersForQuery.bppMerchantId.filter(
        (m) => m && m !== "__all__"
      );
      if (validBppMerchants.length > 0) {
        const bppMerchants = validBppMerchants.map((m) => `'${m}'`).join(",");
        conditions.push(`bpp_merchant_id IN (${bppMerchants})`);
      }
    }
    if (filtersForQuery.flowType && filtersForQuery.flowType.length > 0) {
      const flowTypes = filtersForQuery.flowType.map((f) => `'${f}'`).join(",");
      conditions.push(`flow_type IN (${flowTypes})`);
    }
    if (filtersForQuery.tripTag && filtersForQuery.tripTag.length > 0) {
      const tripTags = filtersForQuery.tripTag.map((t) => `'${t}'`).join(",");
      conditions.push(`trip_tag IN (${tripTags})`);
    }
    if (filtersForQuery.userOsType && filtersForQuery.userOsType.length > 0) {
      const validUserOsTypes = filtersForQuery.userOsType.filter(
        (t) => t && t !== "__all__"
      );
      if (validUserOsTypes.length > 0) {
        const userOsTypes = validUserOsTypes.map((t) => `'${t}'`).join(",");
        conditions.push(`user_os_type IN (${userOsTypes})`);
      }
    }
    if (
      filtersForQuery.userSdkVersion &&
      filtersForQuery.userSdkVersion.length > 0
    ) {
      const validVersions = filtersForQuery.userSdkVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`user_sdk_version IN (${versions})`);
      }
    }
    if (
      filtersForQuery.userBundleVersion &&
      filtersForQuery.userBundleVersion.length > 0
    ) {
      const validVersions = filtersForQuery.userBundleVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`user_bundle_version IN (${versions})`);
      }
    }
    if (
      filtersForQuery.userBackendAppVersion &&
      filtersForQuery.userBackendAppVersion.length > 0
    ) {
      const validVersions = filtersForQuery.userBackendAppVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`user_backend_app_version IN (${versions})`);
      }
    }
    if (
      filtersForQuery.dynamicPricingLogicVersion &&
      filtersForQuery.dynamicPricingLogicVersion.length > 0
    ) {
      const validVersions = filtersForQuery.dynamicPricingLogicVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`dynamic_pricing_logic_version IN (${versions})`);
      }
    }
    if (
      filtersForQuery.poolingLogicVersion &&
      filtersForQuery.poolingLogicVersion.length > 0
    ) {
      const validVersions = filtersForQuery.poolingLogicVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`pooling_logic_version IN (${versions})`);
      }
    }
    if (
      filtersForQuery.poolingConfigVersion &&
      filtersForQuery.poolingConfigVersion.length > 0
    ) {
      const validVersions = filtersForQuery.poolingConfigVersion.filter(
        (t) => t && t !== "__all__"
      );
      if (validVersions.length > 0) {
        const versions = validVersions.map((t) => `'${t}'`).join(",");
        conditions.push(`pooling_config_version IN (${versions})`);
      }
    }
    // IMPORTANT: Exclude tier-less data (service_tier = 'All') when analyzing by vehicle dimensions
    // Tier-less data only contains pre-selection metrics (searches) - after user selects a vehicle,
    // a new tiered entry is created. Including "All" would double-count post-search metrics
    // like earnings, completed rides, cancelled rides, etc.
    conditions.push(`service_tier != 'All'`);

    whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  } else {
    whereClause = buildWhereClause(filters);
  }

  const tierType = getServiceTierType(filters);

  // Time bucket format
  // ClickHouse formatDateTime:
  // Hourly: '%Y-%m-%d %H:00:00'
  // Daily: '%Y-%m-%d'

  const timeBucketExpr =
    granularity === "hour"
      ? "formatDateTime(toStartOfHour(local_time), '%Y-%m-%d %H:00:00')"
      : "formatDateTime(toDate(local_time), '%Y-%m-%d')";

  // For vehicle_category and vehicle_sub_category, we need to query by service_tier
  // and then map to the vehicle category in the application layer
  const dimensionColumn =
    dimension === "none"
      ? "'Total'"
      : needsVehicleMapping
        ? "service_tier"
        : dimension;

  const query = `
    SELECT
      ${timeBucketExpr} as timestamp,
      ${dimensionColumn} as dimension_value,
      sumIf(searches, searches IS NOT NULL) as searches,
      sumIf(quotes_requested, quotes_requested IS NOT NULL) as quotes_requested,
      sumIf(quotes_accepted, quotes_accepted IS NOT NULL) as quotes_accepted,
      sumIf(bookings, bookings IS NOT NULL) as bookings,
      sumIf(completed_rides, completed_rides IS NOT NULL) as completed_rides,
      sumIf(cancelled_rides, cancelled_rides IS NOT NULL) as cancelled_rides,
      sumIf(user_cancellations, user_cancellations IS NOT NULL) as user_cancellations,
      sumIf(driver_cancellations, driver_cancellations IS NOT NULL) as driver_cancellations,
      sumIf(total_driver_earnings, total_driver_earnings IS NOT NULL) as earnings
    FROM ${getEffectiveTableSubquery()}
    ${whereClause}
    GROUP BY timestamp, dimension_value
    ORDER BY timestamp ASC
  `;

  const rows = await executeQuery(query);

  // If vehicle_category or vehicle_sub_category, we need to map service_tier to vehicle category
  if (needsVehicleMapping) {
    // Group by the mapped dimension value
    const grouped = new Map<
      string,
      {
        timestamp: string;
        dimensionValue: string;
        searches: number;
        quotesRequested: number;
        quotesAccepted: number;
        bookings: number;
        completedRides: number;
        cancelledRides: number;
        userCancellations: number;
        driverCancellations: number;
        earnings: number;
      }
    >();

    for (const row of rows) {
      const serviceTier = String(row.dimension_value);
      const timestamp = String(row.timestamp);

      let mappedValue: string;
      if (dimension === "vehicle_category") {
        mappedValue = getVehicleCategory(serviceTier);
      } else {
        // vehicle_sub_category and service_tier: service_tier IS the value
        mappedValue = serviceTier;
      }

      const key = `${timestamp}_${mappedValue}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.searches += safeNumber(row.searches);
        existing.quotesRequested += safeNumber(row.quotes_requested);
        existing.quotesAccepted += safeNumber(row.quotes_accepted);
        existing.bookings += safeNumber(row.bookings);
        existing.completedRides += safeNumber(row.completed_rides);
        existing.cancelledRides += safeNumber(row.cancelled_rides);
        existing.userCancellations += safeNumber(row.user_cancellations);
        existing.driverCancellations += safeNumber(row.driver_cancellations);
        existing.earnings += safeNumber(row.earnings);
      } else {
        grouped.set(key, {
          timestamp,
          dimensionValue: mappedValue,
          searches: safeNumber(row.searches),
          quotesRequested: safeNumber(row.quotes_requested),
          quotesAccepted: safeNumber(row.quotes_accepted),
          bookings: safeNumber(row.bookings),
          completedRides: safeNumber(row.completed_rides),
          cancelledRides: safeNumber(row.cancelled_rides),
          userCancellations: safeNumber(row.user_cancellations),
          driverCancellations: safeNumber(row.driver_cancellations),
          earnings: safeNumber(row.earnings),
        });
      }
    }

    // Convert grouped data to result format
    return Array.from(grouped.values()).map((item) => {
      // For vehicle dimensions, we ALWAYS use tier logic (completed_rides / quotes_requested)
      // because:
      // 1. "All" tier (which has searches) is excluded to prevent double counting
      // 2. Searches are not attributable to specific vehicle categories
      // 3. Only after user selects a vehicle do we get tiered data with quotes_requested
      let conversion = 0;
      if (item.quotesRequested > 0) {
        // Tier logic: completed_rides / quotes_requested * 100
        conversion = safeRatePercent(item.completedRides, item.quotesRequested);
      }
      // Note: searches will be 0 for tiered data (expected behavior)
      // RFA (Rider Fare Acceptance) is NOT applicable for vehicle dimensions
      // because we cannot attribute why a user dropped off to a specific vehicle category

      const result: DimensionalTimeSeriesDataPoint = {
        timestamp: item.timestamp,
        dimensionValue: item.dimensionValue,
        // Searches from tiered data (will likely be 0, which is expected for vehicle dimensions)
        searches: item.searches,
        completedRides: item.completedRides,
        conversion,
      };

      if (item.quotesRequested > 0) {
        result.searchForQuotes = item.quotesRequested;
      }
      if (item.quotesAccepted > 0) {
        result.quotesAccepted = item.quotesAccepted;
      }
      if (item.bookings > 0) {
        result.bookings = item.bookings;
      }
      if (item.cancelledRides > 0) {
        result.cancelledRides = item.cancelledRides;
      }
      if (item.userCancellations > 0) {
        result.userCancellations = item.userCancellations;
      }
      if (item.driverCancellations > 0) {
        result.driverCancellations = item.driverCancellations;
      }
      if (item.earnings > 0) {
        result.earnings = item.earnings;
      }

      return result;
    });
  }

  // For other dimensions, use the original logic
  return rows.map((row) => {
    const searches = safeNumber(row.searches);
    const quotesRequested = safeNumber(row.quotes_requested);
    const quotesAccepted = safeNumber(row.quotes_accepted);
    const bookings = safeNumber(row.bookings);
    const completedRides = safeNumber(row.completed_rides);
    const cancelledRides = safeNumber(row.cancelled_rides);
    const userCancellations = safeNumber(row.user_cancellations);
    const driverCancellations = safeNumber(row.driver_cancellations);
    const earnings = safeNumber(row.earnings);

    // Calculate conversion based on tier type
    let conversion = 0;
    if (tierType === "tier-less" || tierType === "bookany") {
      conversion = safeRatePercent(completedRides, searches);
    } else if (tierType === "tier") {
      // If quotes_requested is 0, use searches as fallback
      const denominator = quotesRequested > 0 ? quotesRequested : searches;
      conversion = safeRatePercent(completedRides, denominator);
    }

    const result: DimensionalTimeSeriesDataPoint = {
      timestamp: String(row.timestamp),
      dimensionValue: String(row.dimension_value),
      searches,
      completedRides,
      conversion,
    };

    if (quotesRequested > 0) {
      result.searchForQuotes = quotesRequested;
    }
    if (quotesAccepted > 0) {
      result.quotesAccepted = quotesAccepted;
    }
    if (bookings > 0) {
      result.bookings = bookings;
    }
    if (cancelledRides > 0) {
      result.cancelledRides = cancelledRides;
    }
    if (userCancellations > 0) {
      result.userCancellations = userCancellations;
    }
    if (driverCancellations > 0) {
      result.driverCancellations = driverCancellations;
    }
    if (earnings > 0) {
      result.earnings = earnings;
    }

    return result;
  });
}
