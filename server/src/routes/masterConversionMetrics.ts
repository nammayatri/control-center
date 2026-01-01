import { Router, Request, Response } from "express";
import {
  getExecutiveMetrics,
  getComparisonMetrics,
  getTimeSeries,
  getFilterOptions,
  getGroupedMasterConversionMetrics,
  getDimensionalTimeSeries,
} from "../repositories/masterConversionRepository.js";
import type {
  MasterConversionFilters,
  SortOptions,
  MasterConversionExecutiveResponse,
  MasterConversionComparisonResponse,
  MasterConversionTimeSeriesResponse,
  MasterConversionFilterOptionsResponse,
  GroupedMasterConversionResponse,
  Dimension,
  Granularity,
  DimensionalTimeSeriesResponse,
} from "../types/masterConversion.js";

const router = Router();

// ============================================
// Helper: Parse Query Parameters
// ============================================

function parseFilters(query: Record<string, unknown>): MasterConversionFilters {
  const parseArray = (value: unknown): string[] | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return undefined;
  };

  const vehicleCategory = query.vehicleCategory as
    | "Bike"
    | "Auto"
    | "Cab"
    | "Others"
    | "All"
    | "BookAny"
    | undefined;
  const vehicleSubCategory = query.vehicleSubCategory
    ? String(query.vehicleSubCategory)
    : undefined;

  return {
    dateFrom: query.dateFrom ? String(query.dateFrom) : undefined,
    dateTo: query.dateTo ? String(query.dateTo) : undefined,
    city: parseArray(query.city),
    state: parseArray(query.state),
    merchantId: parseArray(query.merchantId), // Deprecated - kept for backward compatibility
    bapMerchantId: parseArray(query.bapMerchantId),
    bppMerchantId: parseArray(query.bppMerchantId),
    flowType: parseArray(query.flowType),
    tripTag: parseArray(query.tripTag),
    userOsType: parseArray(query.userOsType),
    userSdkVersion: parseArray(query.userSdkVersion),
    userBundleVersion: parseArray(query.userBundleVersion),
    userBackendAppVersion: parseArray(query.userBackendAppVersion),
    dynamicPricingLogicVersion: parseArray(query.dynamicPricingLogicVersion),
    poolingLogicVersion: parseArray(query.poolingLogicVersion),
    poolingConfigVersion: parseArray(query.poolingConfigVersion),
    serviceTier: parseArray(query.serviceTier),
    vehicleCategory:
      vehicleCategory &&
      ["Bike", "Auto", "Cab", "Others", "All", "BookAny"].includes(
        vehicleCategory
      )
        ? vehicleCategory
        : undefined,
    vehicleSubCategory,
  };
}

function parseSortOptions(query: Record<string, unknown>): SortOptions {
  return {
    sortBy: query.sortBy ? String(query.sortBy) : undefined,
    sortOrder: query.sortOrder === "desc" ? "desc" : "asc",
  };
}

// ============================================
// GET /api/master-conversion/executive
// ============================================

router.get("/executive", async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const totals = await getExecutiveMetrics(filters);

    // Determine tier type for response
    const hasServiceTier =
      filters.serviceTier && filters.serviceTier.length > 0;
    let tierType: "tier-less" | "tier" | "bookany" = "tier-less";
    if (hasServiceTier) {
      if (filters.serviceTier!.includes("BookAny")) {
        tierType = "bookany";
      } else if (
        filters.serviceTier!.some((t) => t !== "All" && t !== "BookAny")
      ) {
        tierType = "tier";
      }
    }

    const response: MasterConversionExecutiveResponse = {
      totals,
      filters,
      tierType,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching executive master conversion metrics:", error);
    res.status(500).json({
      error: "Failed to fetch executive metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// GET /api/master-conversion/comparison
// ============================================

router.get("/comparison", async (req: Request, res: Response) => {
  try {
    const { currentFrom, currentTo, previousFrom, previousTo } = req.query;

    if (!currentFrom || !currentTo || !previousFrom || !previousTo) {
      res.status(400).json({
        error: "Missing required parameters",
        message:
          "currentFrom, currentTo, previousFrom, previousTo are required",
      });
      return;
    }

    const filters = parseFilters(req.query);
    const metrics = await getComparisonMetrics(
      String(currentFrom),
      String(currentTo),
      String(previousFrom),
      String(previousTo),
      filters
    );

    const response: MasterConversionComparisonResponse = {
      ...metrics,
      currentPeriod: { from: String(currentFrom), to: String(currentTo) },
      previousPeriod: { from: String(previousFrom), to: String(previousTo) },
    };

    res.json(response);
  } catch (error) {
    console.error(
      "Error fetching comparison master conversion metrics:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch comparison metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// GET /api/master-conversion/timeseries
// ============================================

router.get("/timeseries", async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const sort = parseSortOptions(req.query);
    const { granularity = "day" } = req.query;
    const validGranularities: Granularity[] = ["day", "hour"];

    // Basic validation
    if (!validGranularities.includes(String(granularity) as Granularity)) {
      res.status(400).json({
        error: "Invalid granularity",
        message: 'granularity must be "day" or "hour"',
      });
      return;
    }

    const data = await getTimeSeries(
      filters,
      sort,
      String(granularity) as Granularity
    );

    const response: MasterConversionTimeSeriesResponse = {
      data,
      filters,
    };

    res.json(response);
  } catch (error) {
    console.error(
      "Error fetching time series master conversion metrics:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch time series metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// GET /api/master-conversion/filters
// ============================================

router.get("/filters", async (_req: Request, res: Response) => {
  try {
    const options: MasterConversionFilterOptionsResponse =
      await getFilterOptions();
    res.json(options);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({
      error: "Failed to fetch filter options",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// GET /api/master-conversion/grouped
// ============================================

router.get("/grouped", async (req: Request, res: Response) => {
  try {
    const { groupBy } = req.query;
    const validGroupBy = [
      "city",
      "merchant_id",
      "flow_type",
      "trip_tag",
      "service_tier",
    ];

    if (!groupBy || !validGroupBy.includes(String(groupBy))) {
      res.status(400).json({
        error: "Invalid groupBy parameter",
        message: `groupBy must be one of: ${validGroupBy.join(", ")}`,
      });
      return;
    }

    const filters = parseFilters(req.query);
    const sort = parseSortOptions(req.query);
    const data = await getGroupedMasterConversionMetrics(
      filters,
      groupBy as
        | "city"
        | "merchant_id"
        | "flow_type"
        | "trip_tag"
        | "service_tier",
      sort
    );

    const response: GroupedMasterConversionResponse = {
      data,
      groupBy: String(groupBy),
      filters,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching grouped master conversion metrics:", error);
    res.status(500).json({
      error: "Failed to fetch grouped master conversion metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// GET /api/master-conversion/trend
// ============================================

router.get("/trend", async (req: Request, res: Response) => {
  try {
    const { dimension = "none", granularity = "day" } = req.query;
    const validGranularities: Granularity[] = ["day", "hour"];

    // Basic validation
    if (!validGranularities.includes(String(granularity) as Granularity)) {
      res.status(400).json({
        error: "Invalid granularity",
        message: 'granularity must be "day" or "hour"',
      });
      return;
    }

    const filters = parseFilters(req.query);
    const data = await getDimensionalTimeSeries(
      filters,
      String(dimension) as Dimension | "none",
      String(granularity) as Granularity
    );

    const response: DimensionalTimeSeriesResponse = {
      data,
      dimension: String(dimension) as Dimension | "none",
      granularity: String(granularity) as Granularity,
      filters,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching dimensional trend metrics:", error);
    res.status(500).json({
      error: "Failed to fetch dimensional trend metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
