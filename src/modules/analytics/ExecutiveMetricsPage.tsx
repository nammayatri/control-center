import { useState, useMemo, useEffect, useCallback } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Page, PageContent } from "../../components/layout/Page";
import { KPIHeader } from "../../components/layout/KPIHeader";
import { DateRangePicker } from "../../components/ui/date-range-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

import {
  useExecutiveMetrics,
  useComparisonMetrics,
  useTimeSeries,
  useTrendData,
  useFilterOptions,
} from "../../hooks/useExecMetrics";
import { useAnalyticsFilters } from "../../hooks/useAnalyticsFilters";
import type {
  MetricsFilters,
  Dimension,
  Granularity,
} from "../../services/execMetrics";
import {
  Search,
  Check,
  X,
  Plus,
  FileText,
  CheckCircle,
  XCircle as CancelIcon,
  Filter,
  Percent,
  Maximize2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Play,
} from "lucide-react";
import type { SummaryTableRow } from "./SummaryTable";
import { SummaryTable } from "./SummaryTable";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { SmallTrendChart } from "./SmallTrendChart";
import { useMultiSegmentTrend } from "../../hooks/useMultiSegmentTrend";
import { MultiSegmentGrid } from "./MultiSegmentGrid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { cn } from "../../lib/utils";
import { parseISO } from "date-fns";
import {
  AdvancedFiltersPopover,
  type FilterCategory,
  type FilterSelections,
} from "../../components/ui/advanced-filters-popover";
import { downloadCSV, generateFilename } from "../../lib/csvDownload";
import { calculateNiceDomain, formatYAxisValue } from "../../lib/chartUtils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";

// Juspay-inspired color palette for better aesthetics
const COLORS = [
  "#5650E8", // Vibrant purple/blue
  "#F5A5A5", // Soft coral/pink
  "#22C55E", // Green
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#D946EF", // Magenta
];

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}



function formatPercent(value: number): string {
  // Backend returns percentages as 0-100, so if value > 1, it's already a percentage
  if (value > 1) {
    return `${value.toFixed(2)}%`;
  }
  return `${(value * 100).toFixed(1)}%`;
}

// Format date for tooltip: "Wed 31, 2025 08:00"
function formatTooltipDate(dateString: string): string {
  try {
    let date: Date;
    if (dateString.includes("T")) {
      date = parseISO(dateString);
    } else if (dateString.includes(" ")) {
      date = new Date(dateString.replace(" ", "T"));
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const dayName = format(date, "EEE");
    const day = format(date, "d");
    const year = format(date, "yyyy");
    const time = format(date, "HH:mm");

    return `${dayName} ${day}, ${year} ${time}`;
  } catch {
    return dateString;
  }
}

// Transform flat dimensional data to wide format for Recharts
export function ExecutiveMetricsPage() {
  // Date filters - default to today with time
  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfDay(new Date()), "yyyy-MM-dd HH:mm:ss")
  );
  const [dateTo, setDateTo] = useState(() =>
    format(endOfDay(new Date()), "yyyy-MM-dd HH:mm:ss")
  );

  // Dimension filters
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string[]>([]); // Deprecated - kept for backward compatibility
  const [selectedBapMerchant, setSelectedBapMerchant] =
    useState<string[]>([]);
  const [selectedBppMerchant, setSelectedBppMerchant] =
    useState<string[]>([]);
  const [selectedFlowType, setSelectedFlowType] = useState<string>("__all__");
  const [selectedTripTag, setSelectedTripTag] = useState<string>("__all__");
  const [selectedUserOsType, setSelectedUserOsType] =
    useState<string>("__all__");
  const [selectedUserSdkVersion, setSelectedUserSdkVersion] =
    useState<string>("__all__");
  const [selectedUserBundleVersion, setSelectedUserBundleVersion] =
    useState<string>("__all__");
  const [selectedUserBackendAppVersion, setSelectedUserBackendAppVersion] =
    useState<string>("__all__");
  const [
    selectedDynamicPricingLogicVersion,
    setSelectedDynamicPricingLogicVersion,
  ] = useState<string>("__all__");
  const [selectedPoolingLogicVersion, setSelectedPoolingLogicVersion] =
    useState<string>("__all__");
  const [selectedPoolingConfigVersion, setSelectedPoolingConfigVersion] =
    useState<string>("__all__");
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<
    "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny" | "__all__"
  >("__all__");
  const [selectedVehicleSubCategory, setSelectedVehicleSubCategory] =
    useState<string>("__all__");

  // Advanced filter selections state
  const [filterSelections, setFilterSelections] = useState<FilterSelections>(
    {}
  );
  const [trendDimension] = useState<Dimension | "none">("none");
  const [isGridView, setIsGridView] = useState(false);

  // Comparison Data Selection
  const [compareDateFrom, setCompareDateFrom] = useState<string | null>(null);
  const [compareDateTo, setCompareDateTo] = useState<string | null>(null);

  // Segment selection state
  const PINNED_SEGMENTS: (Dimension | "none")[] = [
    "none",
    "city",
    "vehicle_category",
    "trip_tag",
  ];
  const [visibleSegments, setVisibleSegments] = useState<(Dimension | "none")[]>(
    PINNED_SEGMENTS
  );
  const [isAddSegmentSheetOpen, setIsAddSegmentSheetOpen] = useState(false);

  // Metric selection for trend graphs - separated by type
  type RateMetric =
    | "conversion"
    | "driverQuoteAcceptance"
    | "riderFareAcceptance"
    | "cancellationRate"
    | "userCancellationRate"
    | "driverCancellationRate";

  type ValueMetric =
    | "searches"
    | "quotesRequested"
    | "quotesAccepted"
    | "bookings"
    | "cancelledRides"
    | "userCancellations"
    | "driverCancellations"
    | "completedRides"
    | "earnings";

  type TrendMetric = RateMetric | ValueMetric;

  const [selectedRateMetrics, setSelectedRateMetrics] = useState<RateMetric[]>(["conversion"]);
  const [selectedValueMetrics, setSelectedValueMetrics] = useState<ValueMetric[]>([]);

  // Track visible lines for clickable legend
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});


  // Selected segment values (for filtering which segment values to display)
  const [selectedSegmentValues, setSelectedSegmentValues] = useState<
    Set<string>
  >(new Set());

  // Top N selection
  const [topN, setTopN] = useState<number | "all" | "custom">(3);

  // Search query for segment values
  const [valueSearchQuery, setValueSearchQuery] = useState("");

  // Temporary segment values for popover (before applying)
  const [tempSegmentValues, setTempSegmentValues] = useState<Set<string>>(
    new Set()
  );
  // Track which chart's popover is open
  const [activePopoverGroup, setActivePopoverGroup] = useState<number | null>(null);

  // Multi-segment selection state (ordered - max 3 segments)
  interface SegmentConfiguration {
    id: string;
    name: string;
    segments: (Dimension | "none")[];
    segment1TopN: number;
    segment2TopN: number;
    segment3TopN: number;
  }

  const [savedConfigurations, setSavedConfigurations] = useState<SegmentConfiguration[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<(Dimension | "none")[]>([]);
  // Pending segments state for the UI before "Apply" is clicked
  const [pendingSegments, setPendingSegments] = useState<(Dimension | "none")[]>([]);
  const [segment1TopN, setSegment1TopN] = useState<number>(5);  // Top N for trend lines (Segment 1)
  const [segment2TopN, setSegment2TopN] = useState<number>(3);  // Top N for 2nd segment
  const [segment3TopN, setSegment3TopN] = useState<number>(3);  // Top N for 3rd segment

  // Custom selected values for each segment (when user wants specific values instead of Top N)
  const [segment1CustomValues, setSegment1CustomValues] = useState<string[]>([]);
  const [segment2CustomValues, setSegment2CustomValues] = useState<string[]>([]);
  const [segment3CustomValues, setSegment3CustomValues] = useState<string[]>([]);
  const [valuePickerSearch, setValuePickerSearch] = useState("");
  const [valuePickerOpen, setValuePickerOpen] = useState<1 | 2 | 3 | null>(null);

  const [isMultiSegmentApplied, setIsMultiSegmentApplied] = useState(false);

  // Segment selection for multi-line chart (Legacy - keep for backward compatibility or refactor)
  const [selectedSegment, setSelectedSegment] = useState<Dimension | "none">(
    "city"
  );

  const isVehicleSegment = selectedSegment === "vehicle_category" ||
    selectedSegment === "vehicle_sub_category" ||
    selectedSegment === "service_tier";

  // Track hovered line for single-line tooltip display
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Group metrics - always unified for consistent per-metric grid layout
  const metricsByYAxis = useMemo(() => {
    const allMetrics: TrendMetric[] = [
      ...selectedRateMetrics,
      ...selectedValueMetrics,
    ];

    if (allMetrics.length === 0) {
      return [];
    }

    // Always return a single unified group for per-metric grid view
    return [{ type: "unified" as const, metrics: allMetrics }];
  }, [selectedRateMetrics, selectedValueMetrics]);

  // Cumulative toggle for trend chart
  const [isCumulative, setIsCumulative] = useState(false);

  // Auto-detect granularity based on date range
  const autoDetectedGranularity = useMemo(() => {
    if (!dateFrom || !dateTo) return "day";
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diffHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 ? "hour" : "day";
  }, [dateFrom, dateTo]);

  const [trendGranularity, setTrendGranularity] = useState<Granularity>(
    autoDetectedGranularity
  );

  // Update granularity when date range changes
  useEffect(() => {
    setTrendGranularity(autoDetectedGranularity);
  }, [autoDetectedGranularity]);

  // Effective granularity - override for temporal segments that need hourly data
  const effectiveGranularity = useMemo((): Granularity => {
    // Run Hour and Run Day need hourly data
    if (selectedSegment === "run_hour" || selectedSegment === "run_day") {
      return "hour";
    }
    return trendGranularity;
  }, [selectedSegment, trendGranularity]);

  const [rfaExpanded, setRfaExpanded] = useState(false);
  const [dqaExpanded, setDqaExpanded] = useState(false);

  // Build filters object
  const filters: MetricsFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      city: selectedCity.length > 0 ? selectedCity : undefined,
      state: selectedState.length > 0 ? selectedState : undefined,
      merchantId: selectedMerchant.length > 0 ? selectedMerchant : undefined, // Deprecated
      bapMerchantId: selectedBapMerchant.length > 0 ? selectedBapMerchant : undefined,
      bppMerchantId: selectedBppMerchant.length > 0 ? selectedBppMerchant : undefined,
      flowType: selectedFlowType !== "__all__" ? [selectedFlowType] : undefined,
      tripTag: selectedTripTag !== "__all__" ? [selectedTripTag] : undefined,
      userOsType:
        selectedUserOsType !== "__all__" ? [selectedUserOsType] : undefined,
      userSdkVersion:
        selectedUserSdkVersion !== "__all__"
          ? [selectedUserSdkVersion]
          : undefined,
      userBundleVersion:
        selectedUserBundleVersion !== "__all__"
          ? [selectedUserBundleVersion]
          : undefined,
      userBackendAppVersion:
        selectedUserBackendAppVersion !== "__all__"
          ? [selectedUserBackendAppVersion]
          : undefined,
      dynamicPricingLogicVersion:
        selectedDynamicPricingLogicVersion !== "__all__"
          ? [selectedDynamicPricingLogicVersion]
          : undefined,
      poolingLogicVersion:
        selectedPoolingLogicVersion !== "__all__"
          ? [selectedPoolingLogicVersion]
          : undefined,
      poolingConfigVersion:
        selectedPoolingConfigVersion !== "__all__"
          ? [selectedPoolingConfigVersion]
          : undefined,
      vehicleCategory:
        selectedVehicleCategory !== "__all__"
          ? (selectedVehicleCategory as
            | "Bike"
            | "Auto"
            | "Cab"
            | "Others"
            | "All"
            | "BookAny")
          : undefined,
      vehicleSubCategory:
        selectedVehicleSubCategory !== "__all__"
          ? selectedVehicleSubCategory
          : undefined,
    }),
    [
      dateFrom,
      dateTo,
      selectedCity,
      selectedState,
      selectedMerchant,
      selectedBapMerchant,
      selectedBppMerchant,
      selectedFlowType,
      selectedTripTag,
      selectedUserOsType,
      selectedUserSdkVersion,
      selectedUserBundleVersion,
      selectedUserBackendAppVersion,
      selectedDynamicPricingLogicVersion,
      selectedPoolingLogicVersion,
      selectedPoolingConfigVersion,
      selectedVehicleCategory,
      selectedVehicleSubCategory,
    ]
  );

  // Separate filters for time series that include time portion for hourly granularity
  const timeSeriesFilters: MetricsFilters = useMemo(
    () => ({
      dateFrom: dateFrom, // Full datetime with time (e.g., "2025-12-21 00:00:00")
      dateTo: dateTo, // Full datetime with time (e.g., "2025-12-21 20:59:59")
      city: selectedCity.length > 0 ? selectedCity : undefined,
      state: selectedState.length > 0 ? selectedState : undefined,
      merchantId: selectedMerchant.length > 0 ? selectedMerchant : undefined, // Deprecated
      bapMerchantId: selectedBapMerchant.length > 0 ? selectedBapMerchant : undefined,
      bppMerchantId: selectedBppMerchant.length > 0 ? selectedBppMerchant : undefined,
      flowType: selectedFlowType !== "__all__" ? [selectedFlowType] : undefined,
      tripTag: selectedTripTag !== "__all__" ? [selectedTripTag] : undefined,
      userOsType:
        selectedUserOsType !== "__all__" ? [selectedUserOsType] : undefined,
      userSdkVersion:
        selectedUserSdkVersion !== "__all__"
          ? [selectedUserSdkVersion]
          : undefined,
      userBundleVersion:
        selectedUserBundleVersion !== "__all__"
          ? [selectedUserBundleVersion]
          : undefined,
      userBackendAppVersion:
        selectedUserBackendAppVersion !== "__all__"
          ? [selectedUserBackendAppVersion]
          : undefined,
      dynamicPricingLogicVersion:
        selectedDynamicPricingLogicVersion !== "__all__"
          ? [selectedDynamicPricingLogicVersion]
          : undefined,
      poolingLogicVersion:
        selectedPoolingLogicVersion !== "__all__"
          ? [selectedPoolingLogicVersion]
          : undefined,
      poolingConfigVersion:
        selectedPoolingConfigVersion !== "__all__"
          ? [selectedPoolingConfigVersion]
          : undefined,
      vehicleCategory:
        selectedVehicleCategory !== "__all__"
          ? (selectedVehicleCategory as
            | "Bike"
            | "Auto"
            | "Cab"
            | "Others"
            | "All"
            | "BookAny")
          : undefined,
      vehicleSubCategory:
        selectedVehicleSubCategory !== "__all__"
          ? selectedVehicleSubCategory
          : undefined,
    }),
    [
      dateFrom,
      dateTo,
      selectedCity,
      selectedState,
      selectedMerchant,
      selectedBapMerchant,
      selectedBppMerchant,
      selectedFlowType,
      selectedTripTag,
      selectedUserOsType,
      selectedUserSdkVersion,
      selectedUserBundleVersion,
      selectedUserBackendAppVersion,
      selectedDynamicPricingLogicVersion,
      selectedPoolingLogicVersion,
      selectedPoolingConfigVersion,
      selectedVehicleCategory,
      selectedVehicleSubCategory,
    ]
  );

  // Comparison periods - calculate previous period by shifting back by the exact duration
  // Comparison periods - calculate previous period by shifting back by the exact duration
  const comparisonPeriods = useMemo(() => {
    // Parse the full datetime strings
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Calculate the duration in milliseconds
    const durationMs = toDate.getTime() - fromDate.getTime();

    let previousFromDate: Date;
    let previousToDate: Date;

    if (compareDateFrom && compareDateTo) {
      previousFromDate = new Date(compareDateFrom);
      previousToDate = new Date(compareDateTo);
    } else {
      // Shift both dates back by the exact duration
      previousFromDate = new Date(fromDate.getTime() - durationMs);
      previousToDate = new Date(toDate.getTime() - durationMs);
    }

    // Format as full datetime strings for comparison API (backend supports datetime)
    const currentFrom = format(fromDate, "yyyy-MM-dd HH:mm:ss");
    const currentTo = format(toDate, "yyyy-MM-dd HH:mm:ss");
    const previousFrom = format(previousFromDate, "yyyy-MM-dd HH:mm:ss");
    const previousTo = format(previousToDate, "yyyy-MM-dd HH:mm:ss");

    return {
      currentFrom,
      currentTo,
      previousFrom,
      previousTo,
    };
  }, [dateFrom, dateTo, compareDateFrom, compareDateTo]);

  // Effect to reset filters when toggling compare mode
  useEffect(() => {
    if (!compareDateFrom) {
      // Clear any comparison-specific state if needed
    }
  }, [compareDateFrom]);

  // Effect to enforce cancellation metrics when a cancellation segment is selected
  useEffect(() => {
    if (selectedSegment.startsWith("cancellation_")) {
      // Enforce cancellations metric if not already selected
      // And clear rate metrics as we don't show the rate graph
      if (!selectedValueMetrics.some(m => ["cancelledRides", "userCancellations", "driverCancellations"].includes(m))) {
        setSelectedValueMetrics(["cancelledRides"]);
      } else {
        // Filter out non-cancellation value metrics
        const filtered = selectedValueMetrics.filter(m => ["cancelledRides", "userCancellations", "driverCancellations"].includes(m));
        if (filtered.length !== selectedValueMetrics.length) {
          setSelectedValueMetrics(filtered.length > 0 ? filtered : ["cancelledRides"]);
        }
      }

      if (selectedRateMetrics.length > 0) {
        setSelectedRateMetrics([]);
      }
    }
  }, [selectedSegment, selectedValueMetrics, selectedRateMetrics]);

  // Comparison filter with same parameters but shifted dates
  const comparisonFilters = useMemo(() => ({
    ...timeSeriesFilters,
    dateFrom: comparisonPeriods.previousFrom,
    dateTo: comparisonPeriods.previousTo,
  }), [timeSeriesFilters, comparisonPeriods]);

  // Fetch data
  const { data: filterOptions } = useFilterOptions();

  // Multi-segment analysis data hook
  const multiSegmentResult = useMultiSegmentTrend({
    segments: selectedSegments,
    segment1TopN: segment1TopN,
    segment2TopN: segment2TopN,
    segment3TopN: segment3TopN,
    segment1CustomValues: segment1CustomValues,
    segment2CustomValues: segment2CustomValues,
    segment3CustomValues: segment3CustomValues,
    filters: timeSeriesFilters,
    granularity: effectiveGranularity,
    enabled: isMultiSegmentApplied && selectedSegments.length > 0
  });

  // Build filter categories for AdvancedFiltersPopover
  const filterCategories: FilterCategory[] = useMemo(() => {
    if (!filterOptions) return [];

    return [
      {
        id: "geography",
        label: "Geography",
        filters: [
          {
            id: "state",
            label: "State",
            values:
              filterOptions.states?.map((s) => ({ id: s, label: s })) || [],
          },
          {
            id: "city",
            label: "City",
            values:
              filterOptions.cities?.map((c) => ({ id: c, label: c })) || [],
          },
        ],
      },
      {
        id: "merchant",
        label: "Merchant",
        filters: [
          {
            id: "bapMerchant",
            label: "BAP Merchant",
            values:
              filterOptions.bapMerchants?.map((m) => ({
                id: m.id,
                label: m.name,
              })) || [],
          },
          {
            id: "bppMerchant",
            label: "BPP Merchant",
            values:
              filterOptions.bppMerchants?.map((m) => ({
                id: m.id,
                label: m.name,
              })) || [],
          },
        ],
      },
      {
        id: "vehicle",
        label: "Vehicle Category",
        filters:
          filterOptions.vehicleCategories
            ?.filter((vc) => ["Auto", "Cab", "Bike"].includes(vc.value))
            ?.map((vc) => ({
              id: `vehicleCategory_${vc.value}`,
              label: vc.label,
              values:
                filterOptions.vehicleSubCategories?.[vc.value]?.map((sub) => ({
                  id: sub,
                  label: sub,
                })) || [],
            })) || [],
      },
      {
        id: "bookingType",
        label: "Booking Type",
        filters: [
          {
            id: "flowType",
            label: "Flow Type",
            values:
              filterOptions.flowTypes
                ?.filter((ft) => ft && ft.trim() !== "")
                ?.map((ft) => ({ id: ft, label: ft })) || [],
          },
          {
            id: "tripTag",
            label: "Trip Tag",
            values:
              filterOptions.tripTags
                ?.filter((tt) => tt && tt.trim() !== "")
                ?.map((tt) => ({ id: tt, label: tt })) || [],
          },
        ],
      },
      {
        id: "app",
        label: "App",
        filters: [
          {
            id: "osType",
            label: "OS Type",
            values:
              filterOptions.userOsTypes
                ?.filter((os) => os && os.trim() !== "")
                ?.map((os) => ({ id: os, label: os })) || [],
          },
          {
            id: "sdkVersion",
            label: "SDK Version",
            values:
              filterOptions.userSdkVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
          {
            id: "bundleVersion",
            label: "Bundle Version",
            values:
              filterOptions.userBundleVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
          {
            id: "backendAppVersion",
            label: "Backend App Version",
            values:
              filterOptions.userBackendAppVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
        ],
      },
      {
        id: "config",
        label: "Config",
        filters: [
          {
            id: "priceLogicVersion",
            label: "Price Logic Version",
            values:
              filterOptions.dynamicPricingLogicVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
          {
            id: "poolingLogicVersion",
            label: "Pooling Logic Version",
            values:
              filterOptions.poolingLogicVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
          {
            id: "poolingConfigVersion",
            label: "Pooling Config Version",
            values:
              filterOptions.poolingConfigVersions
                ?.filter((v) => v && v.trim() !== "")
                ?.map((v) => ({ id: v, label: v })) || [],
          },
        ],
      },
    ];
  }, [filterOptions]);

  // Handle filter apply - sync selections to individual state vars
  const handleFilterApply = useCallback(() => {
    // State
    const stateValues = filterSelections.state?.values;
    if (stateValues && stateValues.size > 0) {
      setSelectedState(Array.from(stateValues));
    } else {
      setSelectedState([]);
    }

    // City
    const cityValues = filterSelections.city?.values;
    if (cityValues && cityValues.size > 0) {
      setSelectedCity(Array.from(cityValues));
    } else {
      setSelectedCity([]);
    }

    // BAP Merchant
    const bapValues = filterSelections.bapMerchant?.values;
    if (bapValues && bapValues.size > 0) {
      setSelectedBapMerchant(Array.from(bapValues));
    } else {
      setSelectedBapMerchant([]);
    }

    // BPP Merchant
    const bppValues = filterSelections.bppMerchant?.values;
    if (bppValues && bppValues.size > 0) {
      setSelectedBppMerchant(Array.from(bppValues));
    } else {
      setSelectedBppMerchant([]);
    }

    // Vehicle Category & Sub-Category (now structured as vehicleCategory_Auto, vehicleCategory_Cab, etc.)
    let foundVehicleCategory = false;
    const vehicleCategories = ["Bike", "Auto", "Cab", "Others", "BookAny"];
    for (const cat of vehicleCategories) {
      const filterKey = `vehicleCategory_${cat}`;
      const subCatValues = filterSelections[filterKey]?.values;
      if (subCatValues && subCatValues.size > 0) {
        setSelectedVehicleCategory(cat as typeof selectedVehicleCategory);
        setSelectedVehicleSubCategory(Array.from(subCatValues)[0]);
        foundVehicleCategory = true;
        break;
      }
    }
    if (!foundVehicleCategory) {
      setSelectedVehicleCategory("__all__");
      setSelectedVehicleSubCategory("__all__");
    }

    // Flow Type
    const flowValues = filterSelections.flowType?.values;
    if (flowValues && flowValues.size > 0) {
      setSelectedFlowType(Array.from(flowValues)[0]);
    } else {
      setSelectedFlowType("__all__");
    }

    // Trip Tag
    const tripValues = filterSelections.tripTag?.values;
    if (tripValues && tripValues.size > 0) {
      setSelectedTripTag(Array.from(tripValues)[0]);
    } else {
      setSelectedTripTag("__all__");
    }

    // OS Type
    const osValues = filterSelections.osType?.values;
    if (osValues && osValues.size > 0) {
      setSelectedUserOsType(Array.from(osValues)[0]);
    } else {
      setSelectedUserOsType("__all__");
    }

    // SDK Version
    const sdkValues = filterSelections.sdkVersion?.values;
    if (sdkValues && sdkValues.size > 0) {
      setSelectedUserSdkVersion(Array.from(sdkValues)[0]);
    } else {
      setSelectedUserSdkVersion("__all__");
    }

    // Bundle Version
    const bundleValues = filterSelections.bundleVersion?.values;
    if (bundleValues && bundleValues.size > 0) {
      setSelectedUserBundleVersion(Array.from(bundleValues)[0]);
    } else {
      setSelectedUserBundleVersion("__all__");
    }

    // Backend App Version
    const backendValues = filterSelections.backendAppVersion?.values;
    if (backendValues && backendValues.size > 0) {
      setSelectedUserBackendAppVersion(Array.from(backendValues)[0]);
    } else {
      setSelectedUserBackendAppVersion("__all__");
    }

    // Price Logic Version
    const priceValues = filterSelections.priceLogicVersion?.values;
    if (priceValues && priceValues.size > 0) {
      setSelectedDynamicPricingLogicVersion(Array.from(priceValues)[0]);
    } else {
      setSelectedDynamicPricingLogicVersion("__all__");
    }

    // Pooling Logic Version
    const poolingLogicValues = filterSelections.poolingLogicVersion?.values;
    if (poolingLogicValues && poolingLogicValues.size > 0) {
      setSelectedPoolingLogicVersion(Array.from(poolingLogicValues)[0]);
    } else {
      setSelectedPoolingLogicVersion("__all__");
    }

    // Pooling Config Version
    const poolingConfigValues = filterSelections.poolingConfigVersion?.values;
    if (poolingConfigValues && poolingConfigValues.size > 0) {
      setSelectedPoolingConfigVersion(Array.from(poolingConfigValues)[0]);
    } else {
      setSelectedPoolingConfigVersion("__all__");
    }
  }, [filterSelections]);

  // Handle filter clear
  const handleFilterClear = useCallback(() => {
    setFilterSelections({});
    handleClearFilters();
  }, []);

  // Apply user context restrictions to filters
  const { applyUserContext } = useAnalyticsFilters();
  const restrictedFilters = useMemo(() => {
    console.log('[Executive Metrics] Recalculating restrictedFilters from filters:', filters);
    const result = applyUserContext(filters);
    console.log('[Executive Metrics] Result:', result);
    return result;
  }, [filters, applyUserContext]);
  const restrictedTimeSeriesFilters = useMemo(() => applyUserContext(timeSeriesFilters), [timeSeriesFilters, applyUserContext]);

  const {
    data: executiveData,
    isLoading: execLoading,
    refetch: refetchExec,
  } = useExecutiveMetrics(restrictedFilters);
  const { data: comparisonData, refetch: refetchComparison } =
    useComparisonMetrics(
      comparisonPeriods.currentFrom,
      comparisonPeriods.currentTo,
      comparisonPeriods.previousFrom,
      comparisonPeriods.previousTo,
      restrictedFilters
    );

  // Determine granularity based on date range
  // Use hourly if start and end day are the same, otherwise daily
  // Auto-detect granularity for KPI cards based on date range
  const timeSeriesGranularity = useMemo(() => {
    const fromDateStr = dateFrom.split(" ")[0]; // Extract date part
    const toDateStr = dateTo.split(" ")[0]; // Extract date part
    // Use hourly granularity if start and end day are the same
    return fromDateStr === toDateStr ? "hour" : "day";
  }, [dateFrom, dateTo]);

  // Fetch time series data for trend charts in KPI cards
  // Use timeSeriesFilters which includes the time portion
  const {
    data: timeSeriesData,
    isLoading: timeSeriesLoading,
    refetch: refetchTimeSeries,
  } = useTimeSeries(restrictedTimeSeriesFilters, timeSeriesGranularity);

  // Fetch comparison time series data
  const {
    data: comparisonTimeSeriesData,
    refetch: refetchComparisonTimeSeries,
  } = useTimeSeries(comparisonFilters, timeSeriesGranularity);

  // Fetch time series data for conversion trend graph with effective granularity
  // (may override to 'hour' for temporal segments like run_day)
  const { data: trendTimeSeriesData, isLoading: trendTimeSeriesLoading } =
    useTimeSeries(restrictedTimeSeriesFilters, effectiveGranularity);

  // Helper to get trend data for a metric
  const getTrendData = useMemo(() => {
    return (
      metricKey: string
    ): Array<{ timestamp: string; value: number }> | undefined => {
      if (!timeSeriesData?.data) return undefined;
      const result: Array<{ timestamp: string; value: number }> = [];
      for (const point of timeSeriesData.data) {
        let value = 0;
        if (metricKey === "conversion") {
          // Use pre-calculated conversion from backend
          value = point.conversion || 0;
        } else if (metricKey === "searches") {
          // For "Total Search Tries" when vehicle category is selected:
          // If searches is 0 (tier data), use quotes_requested as searchTries
          // Otherwise use searches (tier-less data)
          if (
            selectedVehicleCategory !== "__all__" &&
            selectedVehicleCategory !== "All"
          ) {
            // Vehicle category selected - calculate searchTries
            value =
              point.searches === 0 && point.searchForQuotes
                ? point.searchForQuotes
                : point.searches || 0;
          } else {
            // No vehicle category - use searches
            value = point.searches || 0;
          }
        } else if (metricKey === "quotesRequested") {
          value = point.searchForQuotes || 0;
        } else if (metricKey === "quotesAccepted") {
          value = point.quotesAccepted || 0;
        } else if (metricKey === "cancelledRides") {
          value = point.cancelledRides || 0;
        } else if (metricKey === "userCancellations") {
          value = point.userCancellations || 0;
        } else if (metricKey === "driverCancellations") {
          value = point.driverCancellations || 0;
        } else if (metricKey === "cancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.cancelledRides || 0) / finished) * 100 : 0;
        } else if (metricKey === "userCancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.userCancellations || 0) / finished) * 100 : 0;
        } else if (metricKey === "driverCancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.driverCancellations || 0) / finished) * 100 : 0;
        } else if (metricKey === "riderFareAcceptance") {
          // Calculate RFA: quotesRequested / searchGotEstimates * 100
          const quotesReq = point.searchForQuotes || 0;
          const searchEst = point.searchGotEstimates || 0;
          value = searchEst > 0 ? (quotesReq / searchEst) * 100 : 0;
        } else if (metricKey === "driverQuoteAcceptance") {
          // Calculate DQA: quotesAccepted / searchForQuotes * 100
          value =
            point.quotesAccepted && point.searchForQuotes
              ? (point.quotesAccepted / point.searchForQuotes) * 100
              : 0;
        } else {
          value = (point as unknown as Record<string, number>)[metricKey] || 0;
        }
        result.push({
          timestamp: point.date || "",
          value: value,
        });
      }
      return result.length > 0 ? result : undefined;
    };
  }, [timeSeriesData, selectedVehicleCategory]);

  // Helper to get comparison trend data for a metric (aligned to current time)
  const getComparisonTrendData = useMemo(() => {
    return (
      metricKey: string
    ): Array<{ timestamp: string; value: number }> | undefined => {
      if (!comparisonTimeSeriesData?.data) return undefined;

      // Calculate time difference to shift comparison dates to current range
      const timeDiff = new Date(dateFrom).getTime() - new Date(comparisonPeriods.previousFrom).getTime();

      const result: Array<{ timestamp: string; value: number }> = [];
      for (const point of comparisonTimeSeriesData.data) {
        let value = 0;
        // Reuse logic from getTrendData (simplified copy)
        if (metricKey === "conversion") {
          const denominator =
            point.searches === 0 &&
              point.searchForQuotes &&
              point.searchForQuotes > 0
              ? point.searchForQuotes
              : point.searches || point.searchForQuotes || 1;
          value =
            point.completedRides && denominator > 0
              ? (point.completedRides / denominator) * 100
              : 0;
        } else if (metricKey === "searches") {
          if (
            selectedVehicleCategory !== "__all__" &&
            selectedVehicleCategory !== "All"
          ) {
            value =
              point.searches === 0 && point.searchForQuotes
                ? point.searchForQuotes
                : point.searches || 0;
          } else {
            value = point.searches || 0;
          }
        } else if (metricKey === "quotesRequested") {
          value = point.searchForQuotes || 0;
        } else if (metricKey === "quotesAccepted") {
          value = point.quotesAccepted || 0;
        } else if (metricKey === "cancelledRides") {
          value = point.cancelledRides || 0;
        } else if (metricKey === "userCancellations") {
          value = point.userCancellations || 0;
        } else if (metricKey === "driverCancellations") {
          value = point.driverCancellations || 0;
        } else if (metricKey === "cancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.cancelledRides || 0) / finished) * 100 : 0;
        } else if (metricKey === "userCancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.userCancellations || 0) / finished) * 100 : 0;
        } else if (metricKey === "driverCancellationRate") {
          const finished = (point.completedRides || 0) + (point.cancelledRides || 0);
          value = finished > 0 ? ((point.driverCancellations || 0) / finished) * 100 : 0;
        } else if (metricKey === "riderFareAcceptance") {
          const quotesReq = point.searchForQuotes || 0;
          const searchEst = point.searchGotEstimates || 0;
          value = searchEst > 0 ? (quotesReq / searchEst) * 100 : 0;
        } else if (metricKey === "driverQuoteAcceptance") {
          value = point.quotesAccepted && point.searchForQuotes ? (point.quotesAccepted / point.searchForQuotes) * 100 : 0;
        } else {
          value = (point as unknown as Record<string, number>)[metricKey] || 0;
        }

        // Align date
        const originalDate = new Date(point.date as string);
        const alignedDate = new Date(originalDate.getTime() + timeDiff);

        // Preserve format
        // Ideally we should use the same format as input. Assuming "yyyy-MM-dd HH:mm:ss"
        // But date-fns format is used in other places.
        // We will format it to match the chart's expectation
        const alignedDateStr = format(alignedDate, "yyyy-MM-dd HH:mm:ss");

        result.push({
          timestamp: alignedDateStr,
          value: value,
        });
      }
      return result.length > 0 ? result : undefined;
    };
  }, [comparisonTimeSeriesData, selectedVehicleCategory, dateFrom, comparisonPeriods]);

  // Helper function to get metric label
  const getMetricLabel = useCallback((metric: TrendMetric): string => {
    switch (metric) {
      case "conversion":
        return "Conversion Rate";
      case "driverQuoteAcceptance":
        return "Driver Quote Acceptance Rate";
      case "riderFareAcceptance":
        return "Rider Fare Acceptance";
      case "cancellationRate":
        return "Cancellation Rate";
      case "searches":
        return "Searches";
      case "quotesRequested":
        return "Quotes Requested";
      case "quotesAccepted":
        return "Quotes Accepted";
      case "bookings":
        return "Bookings";
      case "completedRides":
        return "Completed Rides";
      case "earnings":
        return "Earnings";
      case "cancelledRides":
        return "Cancellations";
      case "userCancellations":
        return "User Cancellations";
      case "driverCancellations":
        return "Driver Cancellations";
      case "userCancellationRate":
        return "User Cancellation Rate";
      case "driverCancellationRate":
        return "Driver Cancellation Rate";
      default:
        return "Metric";
    }
  }, []);

  // Fetch dimensional time series data when segment is selected
  const { data: segmentTrendData, isLoading: segmentTrendLoading } =
    useTrendData(
      selectedSegment !== "none" ? selectedSegment : "none",
      trendGranularity,
      restrictedFilters
    );

  const { data: comparisonSegmentTrendData } = useTrendData(
    selectedSegment !== "none" ? selectedSegment : "none",
    trendGranularity,
    comparisonFilters
  );

  // Function to generate chart data for a specific metric
  const generateChartDataForMetric = useCallback(
    (metric: TrendMetric) => {
      if (selectedSegment !== "none") {
        // If segment is selected, use dimensional data
        if (!segmentTrendData?.data) return [];

        // Group by timestamp and dimension value
        const grouped = new Map<string, Record<string, number | string>>();

        // Store raw values for cumulative rate calculation
        const rawValuesMap = new Map<
          string,
          Map<string, { numerator: number; denominator: number }>
        >();

        segmentTrendData.data.forEach((point) => {
          // Only process data for selected segment values
          if (selectedSegmentValues.size > 0 && !selectedSegmentValues.has(String(point.dimensionValue || ""))) {
            return;
          }

          let value = 0;
          let numerator = 0;
          let denominator = 0;

          // Calculate metric value and store raw values
          switch (metric) {
            case "conversion": {
              // Use pre-calculated conversion from backend
              value = point.conversion || 0;
              break;
            }
            case "driverQuoteAcceptance": {
              const extendedPoint = point as typeof point & {
                quotesAccepted?: number;
              };
              numerator = extendedPoint.quotesAccepted || 0;
              denominator = point.searchForQuotes || 1;
              value =
                numerator && denominator > 0
                  ? (numerator / denominator) * 100
                  : 0;
              break;
            }
            case "riderFareAcceptance": {
              numerator = point.searchForQuotes || 0;
              denominator = point.searchGotEstimates || 0;
              value =
                denominator > 0
                  ? (numerator / denominator) * 100
                  : 0;
              break;
            }

            case "cancellationRate":
            case "userCancellationRate":
            case "driverCancellationRate": {
              // For cancellation rates, we use raw values to compute them
              // Or use pre-calculated rates if available directly (but dimensional data uses bookings & cancellations counts)
              const totalBookings = Number(point.bookings || 0);
              const totalCancelled = Number(point.cancelledRides || 0);
              const userCancelled = Number(point.userCancellations || 0);
              const driverCancelled = Number(point.driverCancellations || 0);

              numerator =
                metric === "cancellationRate"
                  ? totalCancelled
                  : metric === "driverCancellationRate"
                    ? driverCancelled
                    : userCancelled;
              denominator = totalBookings;

              const percent = denominator > 0 ? (numerator / denominator) * 100 : 0;
              value = Number(percent.toFixed(2));
              break;
            }
            case "searches": {
              value = point.searches || 0;
              break;
            }
            case "quotesRequested": {
              value = point.searchForQuotes || 0;
              break;
            }
            case "quotesAccepted": {
              value = point.quotesAccepted || 0;
              break;
            }
            case "bookings": {
              const extendedPoint = point as typeof point & {
                bookings?: number;
              };
              value = extendedPoint.bookings || 0;
              break;
            }
            case "cancelledRides": {
              value = point.cancelledRides || 0;
              break;
            }
            case "completedRides": {
              value = point.completedRides || 0;
              break;
            }
            case "earnings": {
              const extendedPoint = point as typeof point & {
                earnings?: number;
              };
              value = extendedPoint.earnings || 0;
              break;
            }
            case "userCancellations": {
              const extendedPoint = point as typeof point & {
                userCancellations?: number;
              };
              value = extendedPoint.userCancellations || 0;
              break;
            }
            case "driverCancellations": {
              const extendedPoint = point as typeof point & {
                driverCancellations?: number;
              };
              value = extendedPoint.driverCancellations || 0;
              break;
            }
          }

          const existing = grouped.get(point.timestamp) || {
            date: point.timestamp,
          };
          existing[point.dimensionValue] = value;
          grouped.set(point.timestamp, existing);

          // Store raw values for cumulative calculation
          if (
            [
              "conversion",
              "driverQuoteAcceptance",
              "riderFareAcceptance",
              "cancellationRate",
              "userCancellationRate",
              "driverCancellationRate",
            ].includes(metric)
          ) {
            if (!rawValuesMap.has(point.timestamp)) {
              rawValuesMap.set(point.timestamp, new Map());
            }
            const timestampMap = rawValuesMap.get(point.timestamp)!;
            timestampMap.set(point.dimensionValue, { numerator, denominator });
          }
        });

        let sortedData = Array.from(grouped.values()).sort(
          (a, b) =>
            new Date(a.date as string).getTime() -
            new Date(b.date as string).getTime()
        );

        // Apply cumulative transformation if enabled
        if (isCumulative && sortedData.length > 0) {
          const rates = [
            "conversion",
            "driverQuoteAcceptance",
            "riderFareAcceptance",
            "cancellationRate",
            "userCancellationRate",
            "driverCancellationRate",
          ];
          if (rates.includes(metric)) {
            // For rate metrics, accumulate numerator and denominator separately
            const segmentCumulative = new Map<
              string,
              { numerator: number; denominator: number }
            >();

            sortedData = sortedData.map((point) => {
              const newPoint: Record<string, number | string> = { ...point };
              const timestamp = point.date as string;
              const timestampRawValues = rawValuesMap.get(timestamp);

              Object.keys(point).forEach((key) => {
                if (key !== "date" && typeof point[key] === "number") {
                  if (!segmentCumulative.has(key)) {
                    segmentCumulative.set(key, {
                      numerator: 0,
                      denominator: 0,
                    });
                  }

                  const cumulative = segmentCumulative.get(key)!;
                  const rawValue = timestampRawValues?.get(key);

                  if (rawValue) {
                    cumulative.numerator += rawValue.numerator;
                    cumulative.denominator += rawValue.denominator;
                    newPoint[key] =
                      cumulative.denominator > 0
                        ? (cumulative.numerator / cumulative.denominator) * 100
                        : 0;
                  } else {
                    // Fallback: if raw values not available, use simple sum (not ideal)
                    cumulative.numerator += point[key] as number;
                    cumulative.denominator += 100;
                    newPoint[key] =
                      (cumulative.numerator / cumulative.denominator) * 100;
                  }
                }
              });

              return newPoint;
            });
          } else {
            // For non-rate metrics, simple cumulative sum
            const cumulativeData: Record<string, number> = {};
            sortedData = sortedData.map((point) => {
              const newPoint: Record<string, number | string> = { ...point };
              Object.keys(point).forEach((key) => {
                if (key !== "date" && typeof point[key] === "number") {
                  cumulativeData[key] =
                    (cumulativeData[key] || 0) + (point[key] as number);
                  newPoint[key] = cumulativeData[key];
                }
              });
              return newPoint;
            });
          }
        }

        return sortedData;
      }

      // No segment - single line chart
      if (!trendTimeSeriesData?.data) return [];

      const result = trendTimeSeriesData.data.map((point) => {
        let value = 0;

        switch (metric) {
          case "conversion": {
            // Conversion Rate: completedRides / (searches || searchForQuotes) * 100
            const denominator =
              point.searches === 0 &&
                point.searchForQuotes &&
                point.searchForQuotes > 0
                ? point.searchForQuotes
                : point.searches || point.searchForQuotes || 1;
            value =
              point.completedRides && denominator > 0
                ? (point.completedRides / denominator) * 100
                : 0;
            break;
          }

          case "driverQuoteAcceptance": {
            // DQA: quotesAccepted / searchForQuotes * 100
            value =
              point.quotesAccepted &&
                point.searchForQuotes &&
                point.searchForQuotes > 0
                ? (point.quotesAccepted / point.searchForQuotes) * 100
                : 0;
            break;
          }

          case "riderFareAcceptance": {
            // RFA: quotesRequested / searchGotEstimates * 100
            const quotesReq = point.searchForQuotes || 0;
            const searchEst = point.searchGotEstimates || 0;
            value = searchEst > 0 ? (quotesReq / searchEst) * 100 : 0;
            break;
          }

          case "cancellationRate": {
            const denom = (point.completedRides || 0) + (point.cancelledRides || 0) || 1;
            value = point.cancelledRides
              ? (point.cancelledRides / denom) * 100
              : 0;
            break;
          }

          case "userCancellationRate": {
            const denom = (point.completedRides || 0) + (point.cancelledRides || 0) || 1;
            value = point.userCancellations
              ? (point.userCancellations / denom) * 100
              : 0;
            break;
          }

          case "driverCancellationRate": {
            const denom = (point.completedRides || 0) + (point.cancelledRides || 0) || 1;
            value = point.driverCancellations
              ? (point.driverCancellations / denom) * 100
              : 0;
            break;
          }

          case "searches": {
            value = point.searches || 0;
            break;
          }

          case "quotesRequested": {
            value = point.searchForQuotes || 0;
            break;
          }

          case "quotesAccepted": {
            value = point.quotesAccepted || 0;
            break;
          }

          case "bookings": {
            value = point.bookings || 0;
            break;
          }

          case "cancelledRides": {
            value = point.cancelledRides || 0;
            break;
          }

          case "completedRides": {
            value = point.completedRides || 0;
            break;
          }

          case "earnings": {
            value = point.earnings || 0;
            break;
          }

          case "userCancellations": {
            value = point.userCancellations || 0;
            break;
          }

          case "driverCancellations": {
            value = point.driverCancellations || 0;
            break;
          }
        }

        return {
          date: point.date,
          value: Math.round(value * 100) / 100, // Round to 2 decimal places
        };
      });

      // Apply cumulative transformation if enabled
      if (isCumulative && result.length > 0) {
        const rates = [
          "conversion",
          "driverQuoteAcceptance",
          "riderFareAcceptance",
          "cancellationRate",
          "userCancellationRate",
          "driverCancellationRate",
        ];
        if (rates.includes(metric)) {
          // For rate metrics, accumulate numerator and denominator separately
          let cumulativeNumerator = 0;
          let cumulativeDenominator = 0;

          return result.map(
            (point: { date: string; value: number }, index: number) => {
              const originalPoint = trendTimeSeriesData.data[index];
              let numerator = 0;
              let denominator = 0;

              switch (metric) {
                case "conversion": {
                  numerator = originalPoint.completedRides || 0;
                  denominator =
                    originalPoint.searches === 0 &&
                      originalPoint.searchForQuotes &&
                      originalPoint.searchForQuotes > 0
                      ? originalPoint.searchForQuotes
                      : originalPoint.searches ||
                      originalPoint.searchForQuotes ||
                      1;
                  break;
                }
                case "driverQuoteAcceptance": {
                  numerator = originalPoint.quotesAccepted || 0;
                  denominator = originalPoint.searchForQuotes || 1;
                  break;
                }
                case "riderFareAcceptance": {
                  numerator = originalPoint.searchForQuotes || 0;
                  denominator = originalPoint.searchGotEstimates || 0;
                  break;
                }
                case "cancellationRate": {
                  numerator = originalPoint.cancelledRides || 0;
                  denominator = (originalPoint.completedRides || 0) + (originalPoint.cancelledRides || 0) || 1;
                  break;
                }
                case "userCancellationRate": {
                  numerator = originalPoint.userCancellations || 0;
                  denominator = (originalPoint.completedRides || 0) + (originalPoint.cancelledRides || 0) || 1;
                  break;
                }
                case "driverCancellationRate": {
                  numerator = originalPoint.driverCancellations || 0;
                  denominator = (originalPoint.completedRides || 0) + (originalPoint.cancelledRides || 0) || 1;
                  break;
                }
              }

              cumulativeNumerator += numerator;
              cumulativeDenominator += denominator;

              const cumulativeRate =
                cumulativeDenominator > 0
                  ? (cumulativeNumerator / cumulativeDenominator) * 100
                  : 0;

              return {
                ...point,
                value: Math.round(cumulativeRate * 100) / 100,
              };
            }
          );
        } else {
          // For non-rate metrics, simple cumulative sum
          let cumulative = 0;
          return result.map((point: { date: string; value: number }) => {
            cumulative += point.value;
            return {
              ...point,
              value: Math.round(cumulative * 100) / 100,
            };
          });
        }
      }

      return result;
    },
    [trendTimeSeriesData, segmentTrendData, selectedSegment, isCumulative, selectedSegmentValues]
  );

  // Generate chart data for each metric group
  const chartDataByGroup = useMemo(() => {
    return metricsByYAxis.map((group) => {
      // Generate data for each metric in this group
      const metricsData = group.metrics.map((metric) => ({
        metric,
        data: generateChartDataForMetric(metric),
      }));

      // Combine all metrics into a single dataset
      if (selectedSegment !== "none") {
        // For segments, data is already grouped by timestamp
        // Just return the first metric's data structure (they all have same timestamps)
        return {
          type: group.type,
          metrics: group.metrics,
          data: metricsData[0]?.data || [],
          metricsData, // Keep individual metric data for rendering
        };
      } else {
        // For non-segment, combine all metrics into one dataset
        const combinedData = new Map<string, Record<string, number | string>>();

        metricsData.forEach(({ metric, data }) => {
          const metricLabel = getMetricLabel(metric);
          const comparisonTrend = getComparisonTrendData(metric);

          data.forEach((point) => {
            const dateKey =
              typeof point.date === "string" ? point.date : String(point.date);
            const existing = combinedData.get(dateKey) || { date: dateKey };
            existing[metricLabel] = point.value;

            // Add comparison value if available
            if (comparisonTrend) {
              // Assuming comparisonTrend has same timestamps or we map by index/time
              // Since date ranges might differ (e.g. "Previous Week"), we can't match strictly by dateKey string if it's absolute date.
              // However, getComparisonTrendData usually returns aligned data or we need to align it.
              // The getComparisonTrendData implementation (which I should verify) likely returns aligned timestamps or original timestamps.
              // If it returns original timestamps (e.g. last week's dates), we need to align by index or relative time.
              // BUT, previously in `KPIHeader`, we passed `comparisonTrendData` to charts. 
              // Let's check `getComparisonTrendData` implementation.

              // If getComparisonTrendData returns data with "Previous" timestamps, we need to match by relative index or just map by order if lengths match.
              // Simpler approach: find by matching index if lengths are same, or find by aligned timestamp if we have that logic.
              // Let's look at how we handled it in "Conversion" chart: 
              // "const mergedData = comparisonTrendData ? conversionTrendData.map(d => { ... find c.timestamp === d.timestamp ... })"
              // This implies timestamps ARE aligned (e.g. mapped to current period or using 1,2,3... index).
              // If `getComparisonTrendData` returns aligned timestamps (i.e. dates from CURRENT range but values from PREVIOUS range), then dateKey matching works.
              // I will assume they are aligned for now and try matching by dateKey.

              const compPoint = comparisonTrend.find(c => c.timestamp === dateKey); // timestamp in trend data acts as join key
              if (compPoint) {
                existing[`${metricLabel} (Prev)`] = compPoint.value;
              }
            }
            combinedData.set(dateKey, existing);
          });
        });

        return {
          type: group.type,
          metrics: group.metrics,
          data: Array.from(combinedData.values()).sort(
            (a, b) =>
              new Date(a.date as string).getTime() -
              new Date(b.date as string).getTime()
          ),
          metricsData,
        };
      }
    });
  }, [
    metricsByYAxis,
    generateChartDataForMetric,
    selectedSegment,
    getMetricLabel,
    getComparisonTrendData,
  ]);

  // Extract top N segment values based on search volume
  const { availableSegmentValues, othersDataMap } = useMemo<{
    availableSegmentValues: string[];
    othersDataMap: Map<string, any>;
  }>(() => {
    if (selectedSegment === "none" || !segmentTrendData?.data) {
      return { availableSegmentValues: [], othersDataMap: new Map() };
    }

    // 1. Aggregate totals per segment value
    const totalsByValue = new Map<string, {
      searches: number;
      bookings: number;
      searchGotEstimates: number;
      quotesRequested: number;
      quotesAccepted: number;
      completedRides: number;
      cancelledRides: number;
      userCancellations: number;
      driverCancellations: number;
      earnings: number;
    }>();

    segmentTrendData.data.forEach((point) => {
      const val = String(point.dimensionValue || "Unknown");
      const existing = totalsByValue.get(val) || {
        searches: 0,
        bookings: 0,
        searchGotEstimates: 0,
        quotesRequested: 0,
        quotesAccepted: 0,
        completedRides: 0,
        cancelledRides: 0,
        userCancellations: 0,
        driverCancellations: 0,
        earnings: 0,
      };

      existing.searches += point.searches || 0;
      existing.bookings += point.bookings || 0;
      existing.searchGotEstimates += point.searchGotEstimates || 0;
      existing.quotesRequested += point.searchForQuotes || 0;
      existing.quotesAccepted += point.quotesAccepted || 0;
      existing.completedRides += point.completedRides || 0;
      existing.cancelledRides += point.cancelledRides || 0;
      existing.userCancellations += point.userCancellations || 0;
      existing.driverCancellations += point.driverCancellations || 0;
      existing.earnings += point.earnings || 0;

      totalsByValue.set(val, existing);
    });

    // 2. Rank values by searches, with custom priority for vehicle_category
    const sortedValues = Array.from(totalsByValue.entries())
      .sort((a, b) => {
        // Custom priority for vehicle_category segment
        if (selectedSegment === "vehicle_category") {
          // High priority categories (appear first)
          const highPriority = ["Auto", "Cab", "Bike"];
          // Low priority categories (appear last)
          const lowPriority = ["All", "Book Any", "Others", "BOOK_ANY", "ALL"];

          const aIsHighPriority = highPriority.some(p => a[0].toLowerCase().includes(p.toLowerCase()));
          const bIsHighPriority = highPriority.some(p => b[0].toLowerCase().includes(p.toLowerCase()));
          const aIsLowPriority = lowPriority.some(p => a[0].toLowerCase().includes(p.toLowerCase()));
          const bIsLowPriority = lowPriority.some(p => b[0].toLowerCase().includes(p.toLowerCase()));

          // High priority comes first
          if (aIsHighPriority && !bIsHighPriority) return -1;
          if (!aIsHighPriority && bIsHighPriority) return 1;

          // Low priority comes last
          if (aIsLowPriority && !bIsLowPriority) return 1;
          if (!aIsLowPriority && bIsLowPriority) return -1;
        }

        // Default: sort by searches (descending)
        return b[1].searches - a[1].searches;
      })
      .map(([val]) => val);

    // 3. Separate Logic:
    // a) availableSegmentValues should be filtered for vehicle_category main variants
    // b) othersDataMap should be calculated ONLY if topN is a number (5, 10, 20)

    // Filter vehicle_category to only show main variants in dropdowns
    let finalAvailableValues = sortedValues;
    if (selectedSegment === "vehicle_category") {
      finalAvailableValues = sortedValues.filter(val =>
        ["Auto", "Cab", "Bike"].includes(val)
      );
    }

    // Calculate Others data if needed (using the FULL sortedValues to determine what is "Others")
    const othersDataMap = new Map<string, any>();

    if (typeof topN === "number") {
      const topItemsCount = Math.min(topN, sortedValues.length);
      const topItems = new Set(sortedValues.slice(0, topItemsCount));

      segmentTrendData.data.forEach((point) => {
        const val = String(point.dimensionValue || "Unknown");
        if (!topItems.has(val)) {
          const dateKey = point.timestamp;
          const existing = othersDataMap.get(dateKey) || {
            searches: 0,
            bookings: 0,
            searchGotEstimates: 0,
            quotesRequested: 0,
            quotesAccepted: 0,
            completedRides: 0,
            cancelledRides: 0,
            userCancellations: 0,
            driverCancellations: 0,
            earnings: 0,
          };

          existing.searches += point.searches || 0;
          existing.bookings += point.bookings || 0;
          existing.searchGotEstimates += point.searchGotEstimates || 0;
          existing.quotesRequested += point.searchForQuotes || 0;
          existing.quotesAccepted += point.quotesAccepted || 0;
          existing.completedRides += point.completedRides || 0;
          existing.cancelledRides += point.cancelledRides || 0;
          existing.userCancellations += point.userCancellations || 0;
          existing.driverCancellations += point.driverCancellations || 0;
          existing.earnings += point.earnings || 0;

          othersDataMap.set(dateKey, existing);
        }
      });
    }

    return { availableSegmentValues: finalAvailableValues, othersDataMap };
  }, [selectedSegment, segmentTrendData, topN]);

  // Manage selection based on Top N changes
  useEffect(() => {
    if (selectedSegment === "none") {
      setSelectedSegmentValues(new Set());
      setTopN(3); // Reset to default
      setValueSearchQuery("");
      return;
    }

    if (availableSegmentValues.length > 0) {
      // If topN is a number, force selection to top N items
      if (typeof topN === "number") {
        const topItems = availableSegmentValues.slice(0, topN);
        setSelectedSegmentValues(new Set(topItems));
      } else if (topN === "all") {
        setSelectedSegmentValues(new Set(availableSegmentValues));
      }
      // specific "custom" handling is done via manual interaction, not this effect
      // unless we want to initialize it? No, keep current selection.
    }
  }, [selectedSegment, availableSegmentValues, topN]);

  // Generate chart data organized by metric (one chart per metric)
  // Works for both Overall mode (single line) and segment mode (multiple lines)
  const chartDataByMetric = useMemo(() => {
    // Get all metrics from both rate and value groups
    const allMetrics: TrendMetric[] = [
      ...selectedRateMetrics,
      ...selectedValueMetrics,
    ];

    if (allMetrics.length === 0) {
      return [];
    }

    // Helper to get metric value from a data point
    const getMetricValue = (point: any, metric: TrendMetric): number => {
      switch (metric) {
        case "searches": return point.searches || 0;
        case "quotesRequested": return point.searchForQuotes || point.quotesRequested || 0;
        case "quotesAccepted": return point.quotesAccepted || 0;
        case "bookings": return point.bookings || 0;
        case "completedRides": return point.completedRides || 0;
        case "cancelledRides": return point.cancelledRides || 0;
        case "userCancellations": return point.userCancellations || 0;
        case "driverCancellations": return point.driverCancellations || 0;
        case "earnings": return point.earnings || 0;
        case "conversion":
          const cDenom = point.searches || point.searchForQuotes || point.quotesRequested || 1;
          return ((point.completedRides || 0) / cDenom) * 100;
        case "riderFareAcceptance":
          if (isVehicleSegment) return 0;
          const quotesReqVal = point.searchForQuotes || 0;
          return point.searchGotEstimates > 0 ? (quotesReqVal / point.searchGotEstimates) * 100 : 0;
        case "driverQuoteAcceptance":
          return point.searchForQuotes > 0 ? (point.quotesAccepted / point.searchForQuotes) * 100 : 0;
        case "cancellationRate":
          return point.bookings > 0 ? (point.cancelledRides / point.bookings) * 100 : 0;
        case "userCancellationRate":
          return point.bookings > 0 ? (point.userCancellations / point.bookings) * 100 : 0;
        case "driverCancellationRate":
          return point.bookings > 0 ? (point.driverCancellations / point.bookings) * 100 : 0;
        default: return 0;
      }
    };

    // Determine if metric is a percentage
    const isPercentageMetric = (metric: TrendMetric): boolean => {
      return ["conversion", "riderFareAcceptance", "driverQuoteAcceptance",
        "cancellationRate", "userCancellationRate", "driverCancellationRate"].includes(metric);
    };

    // OVERALL MODE: Use trend time series data
    if (selectedSegment === "none") {
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) {
        return [];
      }

      return allMetrics.map((metric) => {
        const metricLabel = getMetricLabel(metric);
        const isPercentage = isPercentageMetric(metric);

        // Build data with "Overall" as the single line
        const data = trendTimeSeriesData.data.map((point) => ({
          date: point.date,
          "Overall": getMetricValue(point, metric),
        }));

        return {
          metric,
          metricLabel,
          isPercentage,
          data,
          lines: ["Overall"],
        };
      });
    }

    // RUN HOUR: Compare hours - X-axis is minute of hour, each hour is a line
    // NOTE: Since minute-level data may not be available, we'll show hourly data points
    // with X-axis representing the progression within the day
    if (selectedSegment === "run_hour") {
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) {
        return [];
      }

      return allMetrics.map((metric) => {
        const metricLabel = getMetricLabel(metric);
        const isPercentage = isPercentageMetric(metric);

        // Group data by hour label (0:00, 1:00, etc.)
        // Since we don't have minute data, we'll show a different view:
        // X-axis = hour of day (0-23), grouped by date
        // Each date becomes a line to compare hours across different days
        const byMinute = new Map<number, Record<string, number | string>>();
        const hourTotals = new Map<string, number>();

        trendTimeSeriesData.data.forEach((point) => {
          const date = new Date(point.date);
          const hour = date.getHours();
          const dayLabel = format(date, "MMM d");
          const metricValue = getMetricValue(point, metric);

          hourTotals.set(`${hour}:00`, (hourTotals.get(`${hour}:00`) || 0) + metricValue);

          // For run_hour, we use hour as X-axis and each day as a line
          // This lets you compare how hour 9, 10, 11, etc. performed on different days
          const existing = byMinute.get(hour) || { minute: `${hour.toString().padStart(2, '0')}:00` };
          existing[dayLabel] = metricValue;
          byMinute.set(hour, existing);
        });

        // Get all unique days and sort by total for Top N
        const allDays = Array.from(new Set(trendTimeSeriesData.data.map(p => format(new Date(p.date), "MMM d"))));
        const dayTotals = new Map<string, number>();
        trendTimeSeriesData.data.forEach((point) => {
          const dayLabel = format(new Date(point.date), "MMM d");
          dayTotals.set(dayLabel, (dayTotals.get(dayLabel) || 0) + getMetricValue(point, metric));
        });
        const sortedDays = allDays.sort((a, b) => (dayTotals.get(b) || 0) - (dayTotals.get(a) || 0));

        let displayedDays: string[];
        if (typeof topN === "number") {
          displayedDays = sortedDays.slice(0, topN);
        } else {
          displayedDays = sortedDays;
        }

        // Convert to array and sort by hour
        const data = Array.from(byMinute.values()).sort(
          (a, b) => parseInt(a.minute as string) - parseInt(b.minute as string)
        );

        return {
          metric,
          metricLabel,
          isPercentage,
          data,
          lines: displayedDays,
        };
      });
    }

    // RUN DAY: Compare days - X-axis is hour of day, each day is a line
    if (selectedSegment === "run_day") {
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) {
        return [];
      }

      return allMetrics.map((metric) => {
        const metricLabel = getMetricLabel(metric);
        const isPercentage = isPercentageMetric(metric);

        // Group by hour of day, with each day as a separate column
        const byHour = new Map<number, Record<string, number | string>>();
        const dayTotals = new Map<string, number>(); // For Top N ranking

        trendTimeSeriesData.data.forEach((point) => {
          const date = new Date(point.date);
          const hour = date.getHours();
          const dayLabel = format(date, "MMM d"); // "Jan 3"
          const metricValue = getMetricValue(point, metric);

          // Track totals for Top N ranking
          dayTotals.set(dayLabel, (dayTotals.get(dayLabel) || 0) + metricValue);

          const existing = byHour.get(hour) || { hour: hour.toString().padStart(2, '0') + ":00" };
          existing[dayLabel] = metricValue;
          byHour.set(hour, existing);
        });

        // Get all unique days and sort by total for Top N
        const allDays = Array.from(dayTotals.keys());
        const sortedDays = allDays.sort((a, b) => (dayTotals.get(b) || 0) - (dayTotals.get(a) || 0));

        // Apply Top N filtering
        let displayedDays: string[];
        if (typeof topN === "number") {
          displayedDays = sortedDays.slice(0, topN);
        } else {
          displayedDays = sortedDays;
        }

        // Convert to array and sort by hour
        const data = Array.from(byHour.values()).sort(
          (a, b) => parseInt(a.hour as string) - parseInt(b.hour as string)
        );

        return {
          metric,
          metricLabel,
          isPercentage,
          data,
          lines: displayedDays,
        };
      });
    }

    // RUN WEEK: Compare weeks - X-axis is day of week, each week is a line
    if (selectedSegment === "run_week") {
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) {
        return [];
      }

      return allMetrics.map((metric) => {
        const metricLabel = getMetricLabel(metric);
        const isPercentage = isPercentageMetric(metric);

        // Group by day of week, with each week as a separate column
        const byDayOfWeek = new Map<number, Record<string, number | string>>();
        const weekTotals = new Map<string, number>();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        trendTimeSeriesData.data.forEach((point) => {
          const date = new Date(point.date);
          const dayOfWeek = date.getDay(); // 0-6
          const weekLabel = `Week ${format(date, "w")}`; // Week number
          const metricValue = getMetricValue(point, metric);

          weekTotals.set(weekLabel, (weekTotals.get(weekLabel) || 0) + metricValue);

          const existing = byDayOfWeek.get(dayOfWeek) || { dayOfWeek: dayNames[dayOfWeek] };
          // Aggregate if same week & day already exists
          existing[weekLabel] = ((existing[weekLabel] as number) || 0) + metricValue;
          byDayOfWeek.set(dayOfWeek, existing);
        });

        const allWeeks = Array.from(weekTotals.keys());
        const sortedWeeks = allWeeks.sort((a, b) => (weekTotals.get(b) || 0) - (weekTotals.get(a) || 0));

        let displayedWeeks: string[];
        if (typeof topN === "number") {
          displayedWeeks = sortedWeeks.slice(0, topN);
        } else {
          displayedWeeks = sortedWeeks;
        }

        // Convert to array and sort by day of week (Mon-Sun)
        const data = Array.from(byDayOfWeek.values()).sort(
          (a, b) => dayNames.indexOf(a.dayOfWeek as string) - dayNames.indexOf(b.dayOfWeek as string)
        );

        return {
          metric,
          metricLabel,
          isPercentage,
          data,
          lines: displayedWeeks,
        };
      });
    }

    // RUN MONTH: Compare months - X-axis is day of month, each month is a line
    if (selectedSegment === "run_month") {
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) {
        return [];
      }

      return allMetrics.map((metric) => {
        const metricLabel = getMetricLabel(metric);
        const isPercentage = isPercentageMetric(metric);

        // Group by day of month, with each month as a separate column
        const byDayOfMonth = new Map<number, Record<string, number | string>>();
        const monthTotals = new Map<string, number>();

        trendTimeSeriesData.data.forEach((point) => {
          const date = new Date(point.date);
          const dayOfMonth = date.getDate(); // 1-31
          const monthLabel = format(date, "MMM yyyy"); // "Jan 2026"
          const metricValue = getMetricValue(point, metric);

          monthTotals.set(monthLabel, (monthTotals.get(monthLabel) || 0) + metricValue);

          const existing = byDayOfMonth.get(dayOfMonth) || { dayOfMonth };
          // Aggregate if same month & day already exists
          existing[monthLabel] = ((existing[monthLabel] as number) || 0) + metricValue;
          byDayOfMonth.set(dayOfMonth, existing);
        });

        const allMonths = Array.from(monthTotals.keys());
        const sortedMonths = allMonths.sort((a, b) => (monthTotals.get(b) || 0) - (monthTotals.get(a) || 0));

        let displayedMonths: string[];
        if (typeof topN === "number") {
          displayedMonths = sortedMonths.slice(0, topN);
        } else {
          displayedMonths = sortedMonths;
        }

        // Convert to array and sort by day of month
        const data = Array.from(byDayOfMonth.values()).sort(
          (a, b) => (a.dayOfMonth as number) - (b.dayOfMonth as number)
        );

        return {
          metric,
          metricLabel,
          isPercentage,
          data,
          lines: displayedMonths,
        };
      });
    }

    // SEGMENT MODE: Use segment trend data with multiple lines
    if (selectedSegmentValues.size === 0) {
      return [];
    }

    // Determine which segment values to show (topN + Others)
    const displayedSegmentValues = typeof topN === "number"
      ? [...availableSegmentValues.slice(0, topN), "Others"]
      : Array.from(selectedSegmentValues);

    return allMetrics.map((metric) => {
      const metricLabel = getMetricLabel(metric);
      const isPercentage = isPercentageMetric(metric);

      // Build data with segment values as columns
      const dataByDate = new Map<string, Record<string, number | string>>();

      // Process regular segment values (not Others)
      if (segmentTrendData?.data) {
        segmentTrendData.data.forEach((point) => {
          const segmentValue = String(point.dimensionValue || "Unknown");
          const dateKey = point.timestamp;

          // Only process if this segment value should be displayed
          if (displayedSegmentValues.includes(segmentValue) && segmentValue !== "Others") {
            const existing = dataByDate.get(dateKey) || { date: dateKey };
            existing[segmentValue] = getMetricValue(point, metric);
            dataByDate.set(dateKey, existing);
          }
        });
      }

      // Add "Others" data if in Top N mode
      if (typeof topN === "number" && othersDataMap.size > 0) {
        othersDataMap.forEach((agg, dateKey) => {
          const existing: Record<string, number | string> = dataByDate.get(dateKey) || { date: dateKey };
          existing["Others"] = getMetricValue(agg, metric);
          dataByDate.set(dateKey, existing);
        });
      }

      // Convert to array and sort by date
      const data = Array.from(dataByDate.values()).sort(
        (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
      );

      // Get the lines to display (actual segment values that have data)
      const lines = displayedSegmentValues.filter(sv =>
        sv === "Others" ? (typeof topN === "number" && othersDataMap.size > 0) : true
      );

      return {
        metric,
        metricLabel,
        isPercentage,
        data,
        lines,
      };
    }).filter(chart => chart.data.length > 0);
  }, [
    selectedSegment,
    selectedSegmentValues,
    selectedRateMetrics,
    selectedValueMetrics,
    availableSegmentValues,
    segmentTrendData,
    trendTimeSeriesData,
    othersDataMap,
    topN,
    getMetricLabel,
  ]);

  // Calculate data for Summary Table
  const summaryTableData: SummaryTableRow[] = useMemo(() => {
    if (selectedSegment === "none") {
      // Case 1: Overall (No breakdown)
      if (!trendTimeSeriesData?.data || trendTimeSeriesData.data.length === 0) return [];

      const totals = trendTimeSeriesData.data.reduce((acc, point) => {
        acc.searches += point.searches || 0;
        acc.bookings += point.bookings || 0;
        acc.quotesRequested += point.searchForQuotes || 0;
        acc.quotesAccepted += point.quotesAccepted || 0;
        acc.completedRides += point.completedRides || 0;
        acc.cancelledRides += point.cancelledRides || 0;
        acc.earnings += point.earnings || 0;

        // For rate calculation inputs
        acc.searchGotEstimates += point.searchGotEstimates || 0;
        acc.userCancellations += point.userCancellations || 0;
        acc.driverCancellations += point.driverCancellations || 0;
        return acc;
      }, {
        searches: 0,
        bookings: 0,
        quotesRequested: 0,
        quotesAccepted: 0,
        completedRides: 0,
        cancelledRides: 0,
        earnings: 0,
        searchGotEstimates: 0,
        userCancellations: 0,

        driverCancellations: 0
      });

      // Calculate comparison totals for changes
      let changes: SummaryTableRow['changes'] = undefined;
      if (comparisonTimeSeriesData?.data && comparisonTimeSeriesData.data.length > 0) {
        const compTotals = comparisonTimeSeriesData.data.reduce((acc, point) => {
          acc.searches += point.searches || 0;
          acc.bookings += point.bookings || 0;
          acc.quotesRequested += point.searchForQuotes || 0;
          acc.quotesAccepted += point.quotesAccepted || 0;
          acc.completedRides += point.completedRides || 0;
          acc.cancelledRides += point.cancelledRides || 0;
          acc.earnings += point.earnings || 0;
          acc.searchGotEstimates += point.searchGotEstimates || 0; // Needed for RFA
          return acc;
        }, { searches: 0, bookings: 0, quotesRequested: 0, quotesAccepted: 0, completedRides: 0, cancelledRides: 0, earnings: 0, searchGotEstimates: 0 });

        const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

        // Calculate rates for comparison
        const compConvDenom = compTotals.searches || compTotals.quotesRequested || 1;
        const compConversion = (compTotals.completedRides / compConvDenom) * 100;
        const compRFA = compTotals.searchGotEstimates > 0 ? (compTotals.quotesRequested / compTotals.searchGotEstimates) * 100 : 0;
        const compDQA = compTotals.quotesRequested > 0 ? (compTotals.quotesAccepted / compTotals.quotesRequested) * 100 : 0;
        const compCancel = compTotals.bookings > 0 ? (compTotals.cancelledRides / compTotals.bookings) * 100 : 0;

        const currConvDenom = totals.searches || totals.quotesRequested || 1;
        const currConversion = (totals.completedRides / currConvDenom) * 100;

        changes = {
          searches: calcChange(totals.searches, compTotals.searches),
          bookings: calcChange(totals.bookings, compTotals.bookings),
          quotesRequested: calcChange(totals.quotesRequested, compTotals.quotesRequested),
          quotesAccepted: calcChange(totals.quotesAccepted, compTotals.quotesAccepted),
          completedRides: calcChange(totals.completedRides, compTotals.completedRides),
          cancelledRides: calcChange(totals.cancelledRides, compTotals.cancelledRides),
          earnings: calcChange(totals.earnings, compTotals.earnings),
          conversionRate: compConversion > 0 ? (currConversion - compConversion) / compConversion * 100 : 0,
          riderFareAcceptance: isVehicleSegment ? 0 : (compRFA > 0 ? ((totals.searchGotEstimates > 0 ? (totals.quotesRequested / totals.searchGotEstimates) * 100 : 0) - compRFA) / compRFA * 100 : 0),
          driverQuoteAcceptance: compDQA > 0 ? ((totals.quotesRequested > 0 ? (totals.quotesAccepted / totals.quotesRequested) * 100 : 0) - compDQA) / compDQA * 100 : 0,
          cancellationRate: compCancel > 0 ? ((totals.bookings > 0 ? (totals.cancelledRides / totals.bookings) * 100 : 0) - compCancel) / compCancel * 100 : 0
        };
      }

      return [{
        id: "overall",
        label: "Overall",
        segments: ["Overall"],
        searches: totals.searches,
        quotesRequested: totals.quotesRequested,
        quotesAccepted: totals.quotesAccepted,
        bookings: totals.bookings,
        completedRides: totals.completedRides,
        cancelledRides: totals.cancelledRides,
        earnings: totals.earnings,
        conversionRate: (totals.searches || totals.quotesRequested) > 0 ? (totals.completedRides / (totals.searches || totals.quotesRequested)) * 100 : 0,
        riderFareAcceptance: !isVehicleSegment && totals.searchGotEstimates > 0 ? (totals.quotesRequested / totals.searchGotEstimates) * 100 : 0,
        driverQuoteAcceptance: totals.quotesRequested > 0 ? (totals.quotesAccepted / totals.quotesRequested) * 100 : 0,
        cancellationRate: totals.bookings > 0 ? (totals.cancelledRides / totals.bookings) * 100 : 0,
        changes
      }];
    } else {
      // Case 2: Segment Breakdown (e.g. City)
      // Use logic similar to 'availableSegmentValues' but return FULL rows
      if (!segmentTrendData?.data) return [];

      const totalsByValue = new Map<string, {
        searches: number;
        bookings: number;
        quotesRequested: number;
        quotesAccepted: number;
        completedRides: number;
        cancelledRides: number;
        earnings: number;
        searchGotEstimates: number;
      }>();

      segmentTrendData.data.forEach((point) => {
        const val = String(point.dimensionValue || "Unknown");
        const existing = totalsByValue.get(val) || {
          searches: 0,
          bookings: 0,
          quotesRequested: 0,
          quotesAccepted: 0,
          completedRides: 0,
          cancelledRides: 0,
          earnings: 0,
          searchGotEstimates: 0,
        };

        existing.searches += point.searches || 0;
        existing.bookings += point.bookings || 0;
        existing.quotesRequested += point.searchForQuotes || 0;
        existing.quotesAccepted += point.quotesAccepted || 0;
        existing.completedRides += point.completedRides || 0;
        existing.cancelledRides += point.cancelledRides || 0;
        existing.earnings += point.earnings || 0;
        existing.searchGotEstimates += point.searchGotEstimates || 0;

        totalsByValue.set(val, existing);
      });

      // Calculate comparison totals
      const compTotalsByValue = new Map<string, {
        searches: number; bookings: number; quotesRequested: number; quotesAccepted: number;
        completedRides: number; cancelledRides: number; earnings: number; searchGotEstimates: number;
      }>();

      if (comparisonSegmentTrendData?.data) {
        comparisonSegmentTrendData.data.forEach((point) => {
          const val = String(point.dimensionValue || "Unknown");
          const existing = compTotalsByValue.get(val) || {
            searches: 0, bookings: 0, quotesRequested: 0, quotesAccepted: 0,
            completedRides: 0, cancelledRides: 0, earnings: 0, searchGotEstimates: 0
          };
          existing.searches += point.searches || 0;
          existing.bookings += point.bookings || 0;
          existing.quotesRequested += point.searchForQuotes || 0;
          existing.quotesAccepted += point.quotesAccepted || 0;
          existing.completedRides += point.completedRides || 0;
          existing.cancelledRides += point.cancelledRides || 0;
          existing.earnings += point.earnings || 0;
          existing.searchGotEstimates += point.searchGotEstimates || 0;
          compTotalsByValue.set(val, existing);
        });
      }

      return Array.from(totalsByValue.entries()).map(([label, stats]) => {
        const compStats = compTotalsByValue.get(label);
        let changes: SummaryTableRow['changes'] = undefined;

        if (compStats) {
          const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

          // Calculate comparison rates
          const compConvDenom = compStats.searches || compStats.quotesRequested || 1;
          const compConversion = (compStats.completedRides / compConvDenom) * 100;
          const compRFA = compStats.searchGotEstimates > 0 ? (compStats.quotesRequested / compStats.searchGotEstimates) * 100 : 0;
          const compDQA = compStats.quotesRequested > 0 ? (compStats.quotesAccepted / compStats.quotesRequested) * 100 : 0;
          const compCancel = compStats.bookings > 0 ? (compStats.cancelledRides / compStats.bookings) * 100 : 0;

          // Calculate current rates
          const currConvDenom = stats.searches || stats.quotesRequested || 1;
          const currConversion = (stats.completedRides / currConvDenom) * 100;
          const currRFA = stats.searchGotEstimates > 0 ? (stats.quotesRequested / stats.searchGotEstimates) * 100 : 0;
          const currDQA = stats.quotesRequested > 0 ? (stats.quotesAccepted / stats.quotesRequested) * 100 : 0;
          const currCancel = stats.bookings > 0 ? (stats.cancelledRides / stats.bookings) * 100 : 0;

          changes = {
            searches: calcChange(stats.searches, compStats.searches),
            bookings: calcChange(stats.bookings, compStats.bookings),
            quotesRequested: calcChange(stats.quotesRequested, compStats.quotesRequested),
            quotesAccepted: calcChange(stats.quotesAccepted, compStats.quotesAccepted),
            completedRides: calcChange(stats.completedRides, compStats.completedRides),
            cancelledRides: calcChange(stats.cancelledRides, compStats.cancelledRides),
            earnings: calcChange(stats.earnings, compStats.earnings),
            conversionRate: compConversion > 0 ? (currConversion - compConversion) / compConversion * 100 : 0,
            riderFareAcceptance: compRFA > 0 ? (currRFA - compRFA) / compRFA * 100 : 0,
            driverQuoteAcceptance: compDQA > 0 ? (currDQA - compDQA) / compDQA * 100 : 0,
            cancellationRate: compCancel > 0 ? (currCancel - compCancel) / compCancel * 100 : 0
          };
        }

        return {
          id: label,
          label: label,
          segments: [label],
          searches: stats.searches,
          quotesRequested: stats.quotesRequested,
          quotesAccepted: stats.quotesAccepted,
          bookings: stats.bookings,
          completedRides: stats.completedRides,
          cancelledRides: stats.cancelledRides,
          earnings: stats.earnings,
          conversionRate: (stats.searches || stats.quotesRequested) > 0 ? (stats.completedRides / (stats.searches || stats.quotesRequested)) * 100 : 0,
          riderFareAcceptance: !isVehicleSegment && stats.searchGotEstimates > 0 ? (stats.quotesRequested / stats.searchGotEstimates) * 100 : 0,
          driverQuoteAcceptance: stats.quotesRequested > 0 ? (stats.quotesAccepted / stats.quotesRequested) * 100 : 0,
          cancellationRate: stats.bookings > 0 ? (stats.cancelledRides / stats.bookings) * 100 : 0,
          changes
        };
      });
    }
  }, [selectedSegment, trendTimeSeriesData, segmentTrendData, comparisonTimeSeriesData, comparisonSegmentTrendData]);

  // Calculate data for Summary Table when multi-segment is applied
  const multiSegmentSummaryTableData: SummaryTableRow[] = useMemo(() => {
    // Only compute when multi-segment mode is active and we have grid data
    if (!isMultiSegmentApplied || selectedSegments.length < 2 || !multiSegmentResult.gridData || multiSegmentResult.gridData.length === 0) {
      return [];
    }

    const rows: SummaryTableRow[] = [];
    const segment3 = selectedSegments.length > 2 ? selectedSegments[2] : null;

    // Iterate through the grid structure
    multiSegmentResult.gridData.forEach((gridRow) => {
      gridRow.forEach((cell) => {
        // Aggregate metrics from chartData (which contains segment1 values)
        if (!cell.chartData || cell.chartData.length === 0) return;

        // Group by segment1Value and aggregate
        const seg1Totals = new Map<string, {
          searches: number;
          bookings: number;
          quotesRequested: number;
          quotesAccepted: number;
          completedRides: number;
          cancelledRides: number;
          earnings: number;
          searchGotEstimates: number;
        }>();

        cell.chartData.forEach((point) => {
          const seg1Val = point.dimensionValue;
          const existing = seg1Totals.get(seg1Val) || {
            searches: 0,
            bookings: 0,
            quotesRequested: 0,
            quotesAccepted: 0,
            completedRides: 0,
            cancelledRides: 0,
            earnings: 0,
            searchGotEstimates: 0,
          };

          existing.searches += point.searches || 0;
          existing.bookings += point.bookings || 0;
          existing.quotesRequested += point.searchForQuotes || 0;
          existing.quotesAccepted += point.quotesAccepted || 0;
          existing.completedRides += point.completedRides || 0;
          existing.cancelledRides += point.cancelledRides || 0;
          existing.earnings += point.earnings || 0;
          existing.searchGotEstimates += point.searchGotEstimates || 0;

          seg1Totals.set(seg1Val, existing);
        });

        // Create a row for each segment1 value within this cell
        seg1Totals.forEach((stats, seg1Val) => {
          // Build the segments array based on how many segments are selected
          const segments: string[] = [seg1Val, cell.segment2Value];
          if (segment3 && cell.segment3Value) {
            segments.push(cell.segment3Value);
          }

          const id = segments.join('_');

          rows.push({
            id,
            label: segments.join(' / '),
            segments,
            searches: stats.searches,
            quotesRequested: stats.quotesRequested,
            quotesAccepted: stats.quotesAccepted,
            bookings: stats.bookings,
            completedRides: stats.completedRides,
            cancelledRides: stats.cancelledRides,
            earnings: stats.earnings,
            conversionRate: (stats.searches || stats.quotesRequested) > 0
              ? (stats.completedRides / (stats.searches || stats.quotesRequested)) * 100
              : 0,
            riderFareAcceptance: stats.searchGotEstimates > 0
              ? (stats.quotesRequested / stats.searchGotEstimates) * 100
              : 0,
            driverQuoteAcceptance: stats.quotesRequested > 0
              ? (stats.quotesAccepted / stats.quotesRequested) * 100
              : 0,
            cancellationRate: stats.bookings > 0
              ? (stats.cancelledRides / stats.bookings) * 100
              : 0,
          });
        });
      });
    });

    return rows;
  }, [isMultiSegmentApplied, selectedSegments, multiSegmentResult.gridData]);

  // Compute segment labels for the SummaryTable
  const summarySegmentLabels = useMemo(() => {
    // Define the dimension label mapping locally (matching trendDimensionsList)
    const dimLabelMap: Record<string, string> = {
      'none': 'Overall',
      'city': 'City',
      'vehicle_category': 'Vehicle Category',
      'vehicle_sub_category': 'Vehicle Sub-Category',
      'service_tier': 'Service Tier',
      'flow_type': 'Flow Type',
      'trip_tag': 'Trip Tag',
      'user_os_type': 'OS Type',
      'user_bundle_version': 'App Bundle Version',
      'user_sdk_version': 'SDK Version',
      'user_backend_app_version': 'Backend App Version',
      'dynamic_pricing_logic_version': 'Price Logic Version',
      'pooling_logic_version': 'Pooling Logic Version',
      'pooling_config_version': 'Pooling Config Version',
    };

    if (isMultiSegmentApplied && selectedSegments.length > 1) {
      return selectedSegments
        .filter(s => s !== 'none')
        .map(s => dimLabelMap[s] || s);
    }

    if (selectedSegment !== 'none') {
      return [dimLabelMap[selectedSegment] || selectedSegment];
    }

    return ['Overall'];
  }, [isMultiSegmentApplied, selectedSegments, selectedSegment]);

  // Fetch trend data for dimensional breakdown chart
  const { refetch: refetchTrend } = useTrendData(
    trendDimension,
    trendGranularity,
    restrictedFilters
  );

  const handleRefresh = () => {
    // Refetch all data without reloading the page
    refetchExec();
    refetchComparison();
    refetchTimeSeries();
    refetchComparisonTimeSeries();
    refetchTrend();
  };

  const handleClearFilters = () => {
    setSelectedCity([]);
    setSelectedState([]);
    setSelectedMerchant([]);
    setSelectedBapMerchant([]);
    setSelectedBppMerchant([]);
    setSelectedFlowType("__all__");
    setSelectedTripTag("__all__");
    setSelectedUserOsType("__all__");
    setSelectedUserSdkVersion("__all__");
    setSelectedUserBundleVersion("__all__");
    setSelectedUserBackendAppVersion("__all__");
    setSelectedDynamicPricingLogicVersion("__all__");
    setSelectedPoolingLogicVersion("__all__");
    setSelectedPoolingConfigVersion("__all__");
    setSelectedVehicleCategory("__all__");
    setSelectedVehicleSubCategory("__all__");
    setDateFrom(format(startOfDay(new Date()), "yyyy-MM-dd HH:mm:ss"));
    setDateTo(format(endOfDay(new Date()), "yyyy-MM-dd HH:mm:ss"));
  };

  const trendDimensionsList: { value: Dimension | "none"; label: string }[] = [
    { value: "none", label: "Overall (No Breakdown)" },
    { value: "city", label: "City" },
    { value: "vehicle_category", label: "Vehicle Category" },
    { value: "vehicle_sub_category", label: "Vehicle Sub-Category" },
    { value: "service_tier", label: "Service Tier" },
    { value: "flow_type", label: "Flow Type" },
    { value: "trip_tag", label: "Trip Tag" },
    { value: "user_os_type", label: "OS Type" },
    { value: "user_bundle_version", label: "App Bundle Version" },
    { value: "user_sdk_version", label: "SDK Version" },
    { value: "user_backend_app_version", label: "Backend App Version" },
    { value: "dynamic_pricing_logic_version", label: "Price Logic Version" },
    { value: "pooling_logic_version", label: "Pooling Logic Version" },
    { value: "pooling_config_version", label: "Pooling Config Version" },
    { value: "cancellation_trip_distance", label: "Cancellation Trip Distance" },
    { value: "cancellation_fare_breakup", label: "Cancellation Fare Bucket" },
    { value: "cancellation_pickup_distance", label: "Cancellation Pickup Distance" },
    { value: "cancellation_pickup_left", label: "Cancellation Pickup Dist. Left" },
    { value: "cancellation_time_to_cancel", label: "Cancellation Time to Cancel" },
    { value: "cancellation_reason", label: "Cancellation Reason" },
    // Temporal comparison segments
    { value: "run_hour", label: "Run Hour" },
    { value: "run_day", label: "Run Day" },
    { value: "run_week", label: "Run Week" },
    { value: "run_month", label: "Run Month" },
  ];

  return (
    <Page>
      <PageContent>
        {/* Global Filter Toolbar - Moved to top */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
            />
            <div className="flex items-center gap-2">
              <DateRangePicker
                dateFrom={compareDateFrom || comparisonPeriods.previousFrom}
                dateTo={compareDateTo || comparisonPeriods.previousTo}
                onChange={(from, to) => {
                  setCompareDateFrom(from);
                  setCompareDateTo(to);
                }}
                triggerLabel={
                  !compareDateFrom ? (
                    <span className="text-muted-foreground">Compare with</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Comparing: {format(new Date(compareDateFrom!), "MMM dd")} - {format(new Date(compareDateTo!), "MMM dd")}</span>
                      <X
                        className="h-4 w-4 hover:text-red-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareDateFrom(null);
                          setCompareDateTo(null);
                        }}
                      />
                    </div>
                  )
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {executiveData?.totals.lastUpdated && (
                <span className="text-[10px] text-zinc-500 font-medium">
                  Last updated: {new Date(executiveData.totals.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <AdvancedFiltersPopover
              categories={filterCategories}
              selections={filterSelections}
              onSelectionsChange={setFilterSelections}
              onApply={handleFilterApply}
              onClear={handleFilterClear}
              trigger={
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-medium border-zinc-200 dark:border-zinc-800">
                  <Filter className="h-4 w-4" />
                  Filters
                  {Object.keys(filterSelections).length > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      {Object.values(filterSelections).reduce(
                        (acc, sel) => acc + sel.values.size,
                        0
                      )}
                    </span>
                  )}
                </Button>
              }
            />
            {/* Active Filters Display */}
            {(() => {
              const activeFilters = [];

              if (selectedCity.length > 0) activeFilters.push({
                id: "city",
                label: "City",
                value: selectedCity.length <= 2 ? selectedCity.join(", ") : `${selectedCity.length} cities`,
                onClear: () => {
                  setSelectedCity([]);
                  setFilterSelections(prev => {
                    const next = { ...prev };
                    if (next.city) next.city.values.clear();
                    return next;
                  });
                }
              });

              if (selectedState.length > 0) activeFilters.push({
                id: "state",
                label: "State",
                value: selectedState.length <= 2 ? selectedState.join(", ") : `${selectedState.length} states`,
                onClear: () => {
                  setSelectedState([]);
                  setFilterSelections(prev => {
                    const next = { ...prev };
                    if (next.state) next.state.values.clear();
                    return next;
                  });
                }
              });

              if (selectedBapMerchant.length > 0) {
                const label = selectedBapMerchant.length <= 1
                  ? (filterOptions?.bapMerchants?.find(m => m.id === selectedBapMerchant[0])?.name || selectedBapMerchant[0])
                  : `${selectedBapMerchant.length} BAPs`;
                activeFilters.push({
                  id: "bapMerchant",
                  label: "BAP",
                  value: label,
                  onClear: () => {
                    setSelectedBapMerchant([]);
                    setFilterSelections(prev => {
                      const next = { ...prev };
                      if (next.bapMerchant) next.bapMerchant.values.clear();
                      return next;
                    });
                  }
                });
              }

              if (selectedBppMerchant.length > 0) {
                const label = selectedBppMerchant.length <= 1
                  ? (filterOptions?.bppMerchants?.find(m => m.id === selectedBppMerchant[0])?.name || selectedBppMerchant[0])
                  : `${selectedBppMerchant.length} BPPs`;
                activeFilters.push({
                  id: "bppMerchant",
                  label: "BPP",
                  value: label,
                  onClear: () => {
                    setSelectedBppMerchant([]);
                    setFilterSelections(prev => {
                      const next = { ...prev };
                      if (next.bppMerchant) next.bppMerchant.values.clear();
                      return next;
                    });
                  }
                });
              }

              if (selectedVehicleSubCategory !== "__all__" && selectedVehicleCategory !== "__all__") {
                activeFilters.push({
                  id: "vehicle",
                  label: "Vehicle",
                  value: `${selectedVehicleCategory} - ${selectedVehicleSubCategory}`,
                  onClear: () => {
                    setSelectedVehicleCategory("__all__");
                    setSelectedVehicleSubCategory("__all__");
                    setFilterSelections(prev => {
                      const next = { ...prev };
                      Object.keys(next).forEach(key => {
                        if (key.startsWith("vehicleCategory_")) {
                          next[key].values.clear();
                        }
                      });
                      return next;
                    });
                  }
                });
              } else if (selectedVehicleCategory !== "__all__") {
                activeFilters.push({
                  id: "vehicle",
                  label: "Vehicle",
                  value: selectedVehicleCategory,
                  onClear: () => {
                    setSelectedVehicleCategory("__all__");
                    setFilterSelections(prev => {
                      const next = { ...prev };
                      Object.keys(next).forEach(key => {
                        if (key.startsWith("vehicleCategory_")) {
                          next[key].values.clear();
                        }
                      });
                      return next;
                    });
                  }
                });
              }

              if (selectedFlowType !== "__all__") activeFilters.push({
                id: "flowType",
                label: "Flow",
                value: selectedFlowType,
                onClear: () => {
                  setSelectedFlowType("__all__");
                  setFilterSelections(prev => {
                    const next = { ...prev };
                    if (next.flowType) next.flowType.values.clear();
                    return next;
                  });
                }
              });

              if (selectedTripTag !== "__all__") activeFilters.push({
                id: "tripTag",
                label: "Tag",
                value: selectedTripTag,
                onClear: () => {
                  setSelectedTripTag("__all__");
                  setFilterSelections(prev => {
                    const next = { ...prev };
                    if (next.tripTag) next.tripTag.values.clear();
                    return next;
                  });
                }
              });

              if (activeFilters.length > 0) {
                return (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-[600px]">
                    {activeFilters.map(f => (
                      <Badge key={f.id} variant="secondary" className="flex items-center gap-1.5 h-7 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-normal shadow-sm whitespace-nowrap">
                        <span className="font-semibold text-xs">{f.label}:</span>
                        <span className="text-xs">{f.value}</span>
                        <X
                          className="h-3 w-3 ml-0.5 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            f.onClear();
                          }}
                        />
                      </Badge>
                    ))}
                    {activeFilters.length > 0 && (
                      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* KPI Cards */}
        <KPIHeader
          loading={execLoading || timeSeriesLoading}
          stats={useMemo(() => {
            // First line: Core metrics
            const stats = [
              {
                label: "Searches",
                value: formatNumber(executiveData?.totals?.searches || 0),
                icon: <Search className="h-5 w-5" />,
                change: comparisonData?.change?.searches?.percent,
                trendData: getTrendData("searches"),
                comparisonTrendData: getComparisonTrendData("searches"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Quotes Requested",
                value: formatNumber(executiveData?.totals?.quotesRequested || 0),
                icon: <FileText className="h-5 w-5" />,
                change: comparisonData?.change?.quotesRequested?.percent,
                trendData: getTrendData("quotesRequested"),
                comparisonTrendData: getComparisonTrendData("quotesRequested"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Quotes Accepted",
                value: formatNumber(executiveData?.totals?.quotesAccepted || 0),
                icon: <CheckCircle className="h-5 w-5" />,
                change: comparisonData?.change?.quotesAccepted?.percent,
                trendData: getTrendData("quotesAccepted"),
                comparisonTrendData: getComparisonTrendData("quotesAccepted"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Bookings",
                value: formatNumber(executiveData?.totals?.bookings || 0),
                icon: <ShoppingCart className="h-5 w-5" />,
                change: comparisonData?.change?.bookings?.percent,
                trendData: getTrendData("bookings"),
                comparisonTrendData: getComparisonTrendData("bookings"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Overall Cancellation",
                value: formatNumber(executiveData?.totals?.cancelledRides || 0),
                icon: <CancelIcon className="h-5 w-5" />,
                change: comparisonData?.change?.cancelledRides?.percent,
                trendData: getTrendData("cancelledRides"),
                comparisonTrendData: getComparisonTrendData("cancelledRides"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
                subMetrics: [
                  {
                    label: "Driver",
                    value: formatNumber(executiveData?.totals?.driverCancellations || 0),
                    change: comparisonData?.change?.driverCancellations?.percent,
                    isNegativeMetric: true,
                  },
                  {
                    label: "User",
                    value: formatNumber(executiveData?.totals?.userCancellations || 0),
                    change: comparisonData?.change?.userCancellations?.percent,
                    isNegativeMetric: true,
                  }
                ],
              },
              {
                label: "Completed Rides",
                value: formatNumber(executiveData?.totals?.completedRides || 0),
                icon: <CheckCircle className="h-5 w-5" />,
                change: comparisonData?.change?.completedRides?.percent,
                trendData: getTrendData("completedRides"),
                comparisonTrendData: getComparisonTrendData("completedRides"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
            ];

            return stats;
          }, [
            selectedVehicleCategory,
            executiveData,
            comparisonData,
            comparisonPeriods,
            getMetricLabel, // Added getMetricLabel to dependencies
            getTrendData,
            getComparisonTrendData,
            dateFrom,
            dateTo,
          ])}
        />

        {/* Conversion Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Conversion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Conversion Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">Overall Conversion</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const data = getTrendData("conversion");
                      if (data) downloadCSV(data, generateFilename("overall_conversion", dateFrom, dateTo));
                    }}
                    title="Download CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-shrink-0 min-w-[120px]">
                    <div className="text-2xl font-bold">
                      {formatPercent(executiveData?.totals?.conversionRate || 0)}
                    </div>
                    {comparisonData?.change?.conversionRate && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        comparisonData.change.conversionRate.percent > 0 ? "text-green-600" : comparisonData.change.conversionRate.percent < 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {comparisonData.change.conversionRate.percent > 0 ? <TrendingUp className="h-3 w-3" /> : comparisonData.change.conversionRate.percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        <span>{Math.abs(comparisonData.change.conversionRate.percent).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  {/* Right side: Graph */}
                  {timeSeriesData?.data && (() => {
                    const conversionTrendData = getTrendData("conversion");
                    const comparisonTrendData = getComparisonTrendData("conversion");
                    if (!conversionTrendData || conversionTrendData.length === 0) return null;

                    const mergedData = comparisonTrendData ? conversionTrendData.map(d => {
                      const comp = comparisonTrendData.find(c => c.timestamp === d.timestamp);
                      return { ...d, comparisonValue: comp?.value };
                    }) : conversionTrendData;

                    const gradientId = "gradient-overall-conversion";
                    return (
                      <div className="flex-1 h-16 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mergedData}>
                            <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            {comparisonTrendData && (
                              <Area
                                type="monotone"
                                dataKey="comparisonValue"
                                stroke="#fb923c"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                fill="transparent"
                                dot={false}
                                activeDot={{ r: 3, fill: "#fb923c" }}
                              />
                            )}
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              fill={`url(#${gradientId})`}
                              dot={false}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const timestamp = payload[0].payload?.timestamp || label || "";
                                  const formattedDate = formatTooltipDate(timestamp);
                                  return (
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg space-y-1">
                                      <p className="text-gray-300 mb-1 border-b border-gray-700 pb-1">{formattedDate}</p>
                                      {payload.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                          <span className={cn("font-medium", p.dataKey === "comparisonValue" ? "text-orange-300" : "text-white")}>
                                            {p.dataKey === "comparisonValue" ? "Prev: " : "Curr: "}
                                            {typeof p.value === 'number' ? formatPercent(p.value) : p.value}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>
              </CardHeader>
            </Card>

            {/* Rider Fare Acceptance Card */}
            {!isVehicleSegment && (
              <Collapsible open={rfaExpanded} onOpenChange={setRfaExpanded}>
                <Card>
                  <CollapsibleTrigger className="w-full hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-base">
                            Rider Fare Acceptance
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              const data = getTrendData("riderFareAcceptanceRate");
                              if (data) downloadCSV(data, generateFilename("rfa_trend", dateFrom, dateTo));
                            }}
                            title="Download CSV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {rfaExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {/* Left side: Metric and change */}
                        <div className="flex-shrink-0 min-w-[120px]">
                          <div className="text-2xl font-bold">
                            {executiveData?.totals?.riderFareAcceptanceRate !==
                              undefined
                              ? formatPercent(
                                executiveData.totals.riderFareAcceptanceRate
                              )
                              : "-"}
                          </div>
                          {(() => {
                            // Calculate RFA comparison
                            const currentRFA =
                              executiveData?.totals?.riderFareAcceptanceRate;
                            if (!currentRFA || !comparisonData) return null;
                            const previousQuotes =
                              comparisonData.previous.searchForQuotes || 0;
                            const previousSearches =
                              comparisonData.previous.searches || 1;
                            const previousRFA =
                              previousSearches > 0
                                ? (previousQuotes / previousSearches) * 100
                                : 0;
                            const rfaChange =
                              previousRFA > 0
                                ? ((currentRFA - previousRFA) / previousRFA) * 100
                                : 0;
                            return (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 mt-1 text-xs cursor-help",
                                        rfaChange > 0
                                          ? "text-green-600"
                                          : rfaChange < 0
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                      )}
                                    >
                                      {rfaChange > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : rfaChange < 0 ? (
                                        <TrendingDown className="h-3 w-3" />
                                      ) : null}
                                      {rfaChange !== 0 && (
                                        <span>
                                          {Math.abs(rfaChange).toFixed(2)}%
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                    <div className="space-y-1">
                                      <p className="text-xs">
                                        {rfaChange > 0
                                          ? "Increased by"
                                          : rfaChange < 0
                                            ? "Decreased by"
                                            : "No change"}
                                      </p>
                                      <p className="text-sm font-bold">
                                        {Math.abs(rfaChange).toFixed(2)}%
                                      </p>
                                      {comparisonPeriods && (
                                        <>
                                          <p className="text-xs text-gray-300">
                                            comparing to
                                          </p>
                                          <p className="text-xs text-gray-300">
                                            {comparisonPeriods.previousFrom} -{" "}
                                            {comparisonPeriods.previousTo}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            );
                          })()}
                        </div>
                        {/* Right side: Graph */}
                        {timeSeriesData?.data &&
                          (() => {
                            const rfaTrendData = getTrendData
                              ? getTrendData("riderFareAcceptance")
                              : undefined;
                            const comparisonRfaTrendData = getComparisonTrendData
                              ? getComparisonTrendData("riderFareAcceptance")
                              : undefined;

                            if (!rfaTrendData || rfaTrendData.length === 0)
                              return null;

                            const mergedData = comparisonRfaTrendData ? rfaTrendData.map(d => {
                              const comp = comparisonRfaTrendData.find(c => c.timestamp === d.timestamp);
                              return { ...d, comparisonValue: comp?.value };
                            }) : rfaTrendData;

                            const gradientId = "gradient-rfa";
                            return (
                              <div className="flex-1 h-16 min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={mergedData}
                                    margin={{
                                      top: 0,
                                      right: 0,
                                      left: 0,
                                      bottom: 0,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id={gradientId}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    {comparisonRfaTrendData && (
                                      <Area
                                        type="monotone"
                                        dataKey="comparisonValue"
                                        stroke="#fb923c"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        fill="transparent"
                                        dot={false}
                                        activeDot={{ r: 3, fill: "#fb923c" }}
                                      />
                                    )}
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#3b82f6"
                                      strokeWidth={2}
                                      fill={`url(#${gradientId})`}
                                      dot={false}
                                      activeDot={{ r: 3, fill: "#3b82f6" }}
                                    />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          const timestamp = payload[0].payload?.timestamp || label || "";
                                          const formattedDate = formatTooltipDate(timestamp);
                                          return (
                                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg space-y-1">
                                              <p className="text-gray-300 mb-1 border-b border-gray-700 pb-1">{formattedDate}</p>
                                              {payload.map((p, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                                  <span className={cn("font-medium", p.dataKey === "comparisonValue" ? "text-orange-300" : "text-white")}>
                                                    {p.dataKey === "comparisonValue" ? "Prev: " : "Curr: "}
                                                    {typeof p.value === 'number' ? formatPercent(p.value) : p.value}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            );
                          })()}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            {/* Left side: Metric and change */}
                            <div className="flex-shrink-0 min-w-[120px]">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {selectedVehicleCategory !== "__all__" &&
                                  selectedVehicleCategory !== "All"
                                  ? "Search Tries"
                                  : "Quotes Requested"}
                              </p>
                              <p className="text-lg font-bold mb-1">
                                {formatNumber(
                                  selectedVehicleCategory !== "__all__" &&
                                    selectedVehicleCategory !== "All"
                                    ? executiveData?.totals?.searchTries ??
                                    executiveData?.totals?.quotesRequested ??
                                    0
                                    : executiveData?.totals?.quotesRequested || 0
                                )}
                              </p>
                              {comparisonData?.change?.quotesRequested && (
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          "flex items-center gap-1 text-xs cursor-help",
                                          comparisonData.change.quotesRequested
                                            .percent > 0
                                            ? "text-green-600"
                                            : comparisonData.change
                                              .quotesRequested.percent < 0
                                              ? "text-red-600"
                                              : "text-muted-foreground"
                                        )}
                                      >
                                        {comparisonData.change.quotesRequested
                                          .percent > 0 ? (
                                          <TrendingUp className="h-3 w-3" />
                                        ) : comparisonData.change.quotesRequested
                                          .percent < 0 ? (
                                          <TrendingDown className="h-3 w-3" />
                                        ) : null}
                                        <span>
                                          {Math.abs(
                                            comparisonData.change.quotesRequested
                                              .percent
                                          ).toFixed(2)}
                                          %
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                      <div className="space-y-1">
                                        <p className="text-xs">
                                          {comparisonData.change.quotesRequested
                                            .percent > 0
                                            ? "Increased by"
                                            : comparisonData.change
                                              .quotesRequested.percent < 0
                                              ? "Decreased by"
                                              : "No change"}
                                        </p>
                                        <p className="text-sm font-bold">
                                          {Math.abs(
                                            comparisonData.change.quotesRequested
                                              .percent
                                          ).toFixed(2)}
                                          %
                                        </p>
                                        {comparisonPeriods && (
                                          <>
                                            <p className="text-xs text-gray-300">
                                              comparing to
                                            </p>
                                            <p className="text-xs text-gray-300">
                                              {comparisonPeriods.previousFrom} -{" "}
                                              {comparisonPeriods.previousTo}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {/* Right side: Graph */}
                            {(() => {
                              const quotesRequestedTrend = getTrendData
                                ? getTrendData("quotesRequested")
                                : undefined;
                              if (
                                !quotesRequestedTrend ||
                                quotesRequestedTrend.length === 0
                              )
                                return null;
                              const gradientId = "gradient-quotes-requested";
                              return (
                                <div className="flex-1 h-16 min-w-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={quotesRequestedTrend}
                                      margin={{
                                        top: 0,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                      }}
                                    >
                                      <defs>
                                        <linearGradient
                                          id={gradientId}
                                          x1="0"
                                          y1="0"
                                          x2="0"
                                          y2="1"
                                        >
                                          <stop
                                            offset="0%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0.3}
                                          />
                                          <stop
                                            offset="100%"
                                            stopColor="#3b82f6"
                                            stopOpacity={0}
                                          />
                                        </linearGradient>
                                      </defs>
                                      <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill={`url(#${gradientId})`}
                                        dot={false}
                                        activeDot={{ r: 3, fill: "#3b82f6" }}
                                      />
                                      <Tooltip
                                        content={({ active, payload, label }) => {
                                          if (
                                            active &&
                                            payload &&
                                            payload.length
                                          ) {
                                            const timestamp =
                                              payload[0].payload?.timestamp ||
                                              label ||
                                              "";
                                            const formattedDate =
                                              formatTooltipDate(timestamp);
                                            const value = payload[0]
                                              .value as number;
                                            return (
                                              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                                <p className="text-gray-300 mb-1">
                                                  {formattedDate}
                                                </p>
                                                <p className="font-semibold">
                                                  {formatNumber(value)}
                                                </p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Driver Quote Acceptance Card */}
            <Collapsible open={dqaExpanded} onOpenChange={setDqaExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-base">
                          Driver Quote Acceptance
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            const data = getTrendData("driverQuoteAcceptanceRate");
                            if (data) downloadCSV(data, generateFilename("dqa_trend", dateFrom, dateTo));
                          }}
                          title="Download CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {dqaExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {/* Left side: Metric and change */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <div className="text-2xl font-bold">
                          {executiveData?.totals?.driverQuoteAcceptanceRate !==
                            undefined
                            ? formatPercent(
                              executiveData.totals.driverQuoteAcceptanceRate
                            )
                            : "-"}
                        </div>
                        {(() => {
                          // Calculate DQA comparison
                          const currentDQA =
                            executiveData?.totals?.driverQuoteAcceptanceRate;
                          if (!currentDQA || !comparisonData) return null;
                          const currentQuotes =
                            comparisonData.current.searchForQuotes || 0;
                          const currentAccepted =
                            executiveData?.totals?.quotesAccepted || 0;
                          // Calculate previous period values from change data
                          if (
                            comparisonData.change.quotesAccepted &&
                            comparisonData.change.quotesRequested
                          ) {
                            const prevQuotesAccepted =
                              currentAccepted -
                              comparisonData.change.quotesAccepted.absolute;
                            const prevQuotesRequested =
                              currentQuotes -
                              comparisonData.change.quotesRequested.absolute;
                            const previousDQA =
                              prevQuotesRequested > 0
                                ? (prevQuotesAccepted / prevQuotesRequested) *
                                100
                                : 0;
                            const dqaChange =
                              previousDQA > 0
                                ? ((currentDQA - previousDQA) / previousDQA) *
                                100
                                : 0;
                            if (Math.abs(dqaChange) > 0.01) {
                              return (
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          "flex items-center gap-1 mt-1 text-xs cursor-help",
                                          dqaChange > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        )}
                                      >
                                        {dqaChange > 0 ? (
                                          <TrendingUp className="h-3 w-3" />
                                        ) : (
                                          <TrendingDown className="h-3 w-3" />
                                        )}
                                        <span>
                                          {Math.abs(dqaChange).toFixed(2)}%
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                      <div className="space-y-1">
                                        <p className="text-xs">
                                          {dqaChange > 0
                                            ? "Increased by"
                                            : "Decreased by"}
                                        </p>
                                        <p className="text-sm font-bold">
                                          {Math.abs(dqaChange).toFixed(2)}%
                                        </p>
                                        {comparisonPeriods && (
                                          <>
                                            <p className="text-xs text-gray-300">
                                              comparing to
                                            </p>
                                            <p className="text-xs text-gray-300">
                                              {comparisonPeriods.previousFrom} -{" "}
                                              {comparisonPeriods.previousTo}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                      {/* Right side: Graph */}
                      {timeSeriesData?.data &&
                        (() => {
                          const quotesAcceptedTrend = getTrendData
                            ? getTrendData("driverQuoteAcceptance")
                            : undefined;
                          const comparisonQuotesAcceptedTrend = getComparisonTrendData
                            ? getComparisonTrendData("driverQuoteAcceptance")
                            : undefined;

                          if (
                            !quotesAcceptedTrend ||
                            quotesAcceptedTrend.length === 0
                          )
                            return null;

                          const mergedData = comparisonQuotesAcceptedTrend ? quotesAcceptedTrend.map(d => {
                            const comp = comparisonQuotesAcceptedTrend.find(c => c.timestamp === d.timestamp);
                            return { ...d, comparisonValue: comp?.value };
                          }) : quotesAcceptedTrend;

                          const gradientId = "gradient-dqa-chart";
                          return (
                            <div className="flex-1 h-16 min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={mergedData}
                                  margin={{
                                    top: 0,
                                    right: 0,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <defs>
                                    <linearGradient
                                      id={gradientId}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#22c55e"
                                        stopOpacity={0.3}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#22c55e"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  </defs>
                                  {comparisonQuotesAcceptedTrend && (
                                    <Area
                                      type="monotone"
                                      dataKey="comparisonValue"
                                      stroke="#fb923c"
                                      strokeWidth={1}
                                      strokeDasharray="3 3"
                                      fill="transparent"
                                      dot={false}
                                      activeDot={{ r: 3, fill: "#fb923c" }}
                                    />
                                  )}
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fill={`url(#${gradientId})`}
                                    dot={false}
                                    activeDot={{ r: 3, fill: "#22c55e" }}
                                  />
                                  <Tooltip
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                        const timestamp = payload[0].payload?.timestamp || label || "";
                                        const formattedDate = formatTooltipDate(timestamp);
                                        return (
                                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg space-y-1">
                                            <p className="text-gray-300 mb-1 border-b border-gray-700 pb-1">{formattedDate}</p>
                                            {payload.map((p, idx) => (
                                              <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                                <span className={cn("font-medium", p.dataKey === "comparisonValue" ? "text-orange-300" : "text-white")}>
                                                  {p.dataKey === "comparisonValue" ? "Prev: " : "Curr: "}
                                                  {typeof p.value === 'number' ? formatPercent(p.value) : p.value}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          );
                        })()}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {/* Left side: Metric and change */}
                          <div className="flex-shrink-0 min-w-[120px]">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Quotes Accepted
                            </p>
                            <p className="text-lg font-bold mb-1">
                              {formatNumber(
                                executiveData?.totals?.quotesAccepted || 0
                              )}
                            </p>
                            {comparisonData?.change?.quotesAccepted && (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 text-xs cursor-help",
                                        comparisonData.change.quotesAccepted
                                          .percent > 0
                                          ? "text-green-600"
                                          : comparisonData.change.quotesAccepted
                                            .percent < 0
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                      )}
                                    >
                                      {comparisonData.change.quotesAccepted
                                        .percent > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : comparisonData.change.quotesAccepted
                                        .percent < 0 ? (
                                        <TrendingDown className="h-3 w-3" />
                                      ) : null}
                                      <span>
                                        {Math.abs(
                                          comparisonData.change.quotesAccepted
                                            .percent
                                        ).toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                    <div className="space-y-1">
                                      <p className="text-xs">
                                        {comparisonData.change.quotesAccepted
                                          .percent > 0
                                          ? "Increased by"
                                          : comparisonData.change.quotesAccepted
                                            .percent < 0
                                            ? "Decreased by"
                                            : "No change"}
                                      </p>
                                      <p className="text-sm font-bold">
                                        {Math.abs(
                                          comparisonData.change.quotesAccepted
                                            .percent
                                        ).toFixed(2)}
                                        %
                                      </p>
                                      {comparisonPeriods && (
                                        <>
                                          <p className="text-xs text-gray-300">
                                            comparing to
                                          </p>
                                          <p className="text-xs text-gray-300">
                                            {comparisonPeriods.previousFrom} -{" "}
                                            {comparisonPeriods.previousTo}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {/* Right side: Graph */}
                          {(() => {
                            const quotesAcceptedTrend = getTrendData
                              ? getTrendData("quotesAccepted")
                              : undefined;
                            if (
                              !quotesAcceptedTrend ||
                              quotesAcceptedTrend.length === 0
                            )
                              return null;
                            const gradientId = "gradient-quotes-accepted";
                            return (
                              <div className="flex-1 h-16 min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={quotesAcceptedTrend}
                                    margin={{
                                      top: 0,
                                      right: 0,
                                      left: 0,
                                      bottom: 0,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id={gradientId}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#22c55e"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#22c55e"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#22c55e"
                                      strokeWidth={2}
                                      fill={`url(#${gradientId})`}
                                      dot={false}
                                      activeDot={{ r: 3, fill: "#22c55e" }}
                                    />
                                    <Tooltip
                                      content={({ active, payload, label }) => {
                                        if (
                                          active &&
                                          payload &&
                                          payload.length
                                        ) {
                                          const timestamp =
                                            payload[0].payload?.timestamp ||
                                            label ||
                                            "";
                                          const formattedDate =
                                            formatTooltipDate(timestamp);
                                          const value = payload[0]
                                            .value as number;
                                          return (
                                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                              <p className="text-gray-300 mb-1">
                                                {formattedDate}
                                              </p>
                                              <p className="font-semibold">
                                                {formatNumber(value)}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Overall Cancellation Rate Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CancelIcon className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-base">Overall Cancellation Rate</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const data = getTrendData("cancellationRate");
                      if (data) downloadCSV(data, generateFilename("cancellation_rate", dateFrom, dateTo));
                    }}
                    title="Download CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-shrink-0 min-w-[120px]">
                    <div className="text-2xl font-bold">
                      {formatPercent(executiveData?.totals?.cancellationRate || 0)}
                    </div>
                    {comparisonData?.change?.cancellationRate && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        comparisonData.change.cancellationRate.percent > 0 ? "text-red-600" : comparisonData.change.cancellationRate.percent < 0 ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {comparisonData.change.cancellationRate.percent > 0 ? <TrendingUp className="h-3 w-3" /> : comparisonData.change.cancellationRate.percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        <span>{Math.abs(comparisonData.change.cancellationRate.percent).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  {/* Right side: Graph */}
                  {timeSeriesData?.data && (() => {
                    const trendData = getTrendData("cancellationRate");
                    if (!trendData || trendData.length === 0) return null;
                    const gradientId = "gradient-overall-cancellation-rate";
                    return (
                      <div className="flex-1 h-16 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#ef4444"
                              strokeWidth={2}
                              fill={`url(#${gradientId})`}
                              dot={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                      <p className="font-semibold">{formatPercent(payload[0].value as number)}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>
              </CardHeader>
            </Card>

            {/* User Cancellation Rate Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CancelIcon className="h-5 w-5 text-red-400" />
                    <CardTitle className="text-base">User Cancellation Rate</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const data = getTrendData("userCancellationRate");
                      if (data) downloadCSV(data, generateFilename("user_cancellation_rate", dateFrom, dateTo));
                    }}
                    title="Download CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-shrink-0 min-w-[120px]">
                    <div className="text-2xl font-bold">
                      {formatPercent(executiveData?.totals?.userCancellationRate || 0)}
                    </div>
                    {comparisonData?.change?.userCancellationRate && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        comparisonData.change.userCancellationRate.percent > 0 ? "text-red-600" : comparisonData.change.userCancellationRate.percent < 0 ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {comparisonData.change.userCancellationRate.percent > 0 ? <TrendingUp className="h-3 w-3" /> : comparisonData.change.userCancellationRate.percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        <span>{Math.abs(comparisonData.change.userCancellationRate.percent).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  {/* Right side: Graph */}
                  {timeSeriesData?.data && (() => {
                    const trendData = getTrendData("userCancellationRate");
                    if (!trendData || trendData.length === 0) return null;
                    const gradientId = "gradient-user-cancellation-rate";
                    return (
                      <div className="flex-1 h-16 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#f87171"
                              strokeWidth={2}
                              fill={`url(#${gradientId})`}
                              dot={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                      <p className="font-semibold">{formatPercent(payload[0].value as number)}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>
              </CardHeader>
            </Card>

            {/* Driver Cancellation Rate Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CancelIcon className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-base">Driver Cancellation Rate</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const data = getTrendData("driverCancellationRate");
                      if (data) downloadCSV(data, generateFilename("driver_cancellation_rate", dateFrom, dateTo));
                    }}
                    title="Download CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-shrink-0 min-w-[120px]">
                    <div className="text-2xl font-bold">
                      {formatPercent(executiveData?.totals?.driverCancellationRate || 0)}
                    </div>
                    {comparisonData?.change?.driverCancellationRate && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        comparisonData.change.driverCancellationRate.percent > 0 ? "text-red-600" : comparisonData.change.driverCancellationRate.percent < 0 ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {comparisonData.change.driverCancellationRate.percent > 0 ? <TrendingUp className="h-3 w-3" /> : comparisonData.change.driverCancellationRate.percent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        <span>{Math.abs(comparisonData.change.driverCancellationRate.percent).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  {/* Right side: Graph */}
                  {timeSeriesData?.data && (() => {
                    const trendData = getTrendData("driverCancellationRate");
                    if (!trendData || trendData.length === 0) return null;
                    const gradientId = "gradient-driver-cancellation-rate";
                    return (
                      <div className="flex-1 h-16 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ea580c" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#ea580c"
                              strokeWidth={2}
                              fill={`url(#${gradientId})`}
                              dot={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                                      <p className="font-semibold">{formatPercent(payload[0].value as number)}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Trend Analysis Chart */}
        {isGridView ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dimensional Breakdown</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGridView(false)}
                  className="flex items-center gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Single View
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendDimensionsList
                .filter((d) => d.value !== "none")
                .map((dim) => (
                  <SmallTrendChart
                    key={dim.value}
                    dimension={dim.value as Dimension}
                    label={dim.label}
                    filters={filters}
                    granularity={trendGranularity}
                  />
                ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {metricsByYAxis.length === 0 ? (
              <Card>
                <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
                  Please add at least one metric to view the trend analysis
                </CardContent>
              </Card>
            ) : (
              <div className={metricsByYAxis.length > 1 && selectedSegment === "none" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                {metricsByYAxis.map((group, groupIndex) => {
                  return (
                    <Card key={groupIndex} className="overflow-hidden shadow-none border-zinc-200 dark:border-zinc-800">
                      <div className="px-4 py-3 border-b bg-white dark:bg-zinc-950 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                            Trend Charts
                          </h3>

                          {/* Metric Tags for this chart */}
                          <div className="flex flex-wrap gap-1.5">
                            {group.metrics.map((metric) => (
                              <div
                                key={metric}
                                className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[10px] font-medium"
                              >
                                <span className="mr-1">{getMetricLabel(metric)}</span>
                                <button
                                  onClick={() => {
                                    const isRateMetric = ["conversion", "riderFareAcceptance", "driverQuoteAcceptance", "cancellationRate", "userCancellationRate", "driverCancellationRate"].includes(metric);
                                    if (isRateMetric) {
                                      setSelectedRateMetrics(selectedRateMetrics.filter(m => m !== metric));
                                    } else {
                                      setSelectedValueMetrics(selectedValueMetrics.filter(m => m !== metric));
                                    }
                                  }}
                                  disabled={group.metrics.length <= 1}
                                  className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right side: Add Metric dropdown + Download */}
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={(v) => {
                              const rateMetrics = ["conversion", "riderFareAcceptance", "driverQuoteAcceptance", "cancellationRate", "userCancellationRate", "driverCancellationRate"];

                              // In multi-segment mode, replace the metric instead of adding
                              if (isMultiSegmentApplied && selectedSegments.length > 0) {
                                if (rateMetrics.includes(v)) {
                                  setSelectedRateMetrics([v as RateMetric]);
                                  setSelectedValueMetrics([]);
                                } else {
                                  setSelectedValueMetrics([v as ValueMetric]);
                                  setSelectedRateMetrics([]);
                                }
                              } else {
                                // Normal mode - add to selection
                                if (rateMetrics.includes(v)) {
                                  const metric = v as RateMetric;
                                  if (!selectedRateMetrics.includes(metric)) {
                                    setSelectedRateMetrics([...selectedRateMetrics, metric]);
                                  }
                                } else {
                                  const metric = v as ValueMetric;
                                  if (!selectedValueMetrics.includes(metric)) {
                                    setSelectedValueMetrics([...selectedValueMetrics, metric]);
                                  }
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                              <SelectValue placeholder="Add Metric" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-zinc-200 dark:border-zinc-800">
                              {/* Value Metrics */}
                              {!isVehicleSegment && (
                                <SelectItem value="searches" className="text-xs">Searches</SelectItem>
                              )}
                              <SelectItem value="quotesRequested" className="text-xs">Quotes Requested</SelectItem>
                              <SelectItem value="quotesAccepted" className="text-xs">Quotes Accepted</SelectItem>
                              <SelectItem value="bookings" className="text-xs">Bookings</SelectItem>
                              <SelectItem value="cancelledRides" className="text-xs">Cancellations</SelectItem>
                              <SelectItem value="userCancellations" className="text-xs">User Cancellations</SelectItem>
                              <SelectItem value="driverCancellations" className="text-xs">Driver Cancellations</SelectItem>
                              <SelectItem value="completedRides" className="text-xs">Completed Rides</SelectItem>
                              <SelectItem value="earnings" className="text-xs">Earnings</SelectItem>
                              {/* Rate Metrics */}
                              <SelectItem value="conversion" className="text-xs">Conversion Rate</SelectItem>
                              <SelectItem value="driverQuoteAcceptance" className="text-xs">Driver Quote Acceptance</SelectItem>
                              {!isVehicleSegment && (
                                <SelectItem value="riderFareAcceptance" className="text-xs">Rider Fare Acceptance</SelectItem>
                              )}
                              <SelectItem value="cancellationRate" className="text-xs">Cancellation Rate</SelectItem>
                              <SelectItem value="userCancellationRate" className="text-xs">User Cancellation Rate</SelectItem>
                              <SelectItem value="driverCancellationRate" className="text-xs">Driver Cancellation Rate</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const chartData = chartDataByGroup[groupIndex]?.data || [];
                              downloadCSV(chartData, generateFilename("trend_charts", dateFrom, dateTo));
                            }}
                            title="Download CSV"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-2 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none">
                        <div className="flex items-center gap-1">
                          {visibleSegments.map((segment) => {
                            const dim = trendDimensionsList.find(d => d.value === segment);
                            if (!dim) return null;
                            const isSelected = selectedSegment === dim.value;
                            const isPinned = PINNED_SEGMENTS.includes(dim.value);

                            return (
                              <div key={dim.value} className="flex items-center gap-1 group">
                                <Button
                                  variant={isSelected ? "secondary" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "h-8 px-3 text-xs rounded-full transition-all duration-200",
                                    isSelected ? "bg-white dark:bg-zinc-800 shadow-sm font-medium text-primary border border-zinc-200 dark:border-zinc-700" : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() => {
                                    setSelectedSegment(dim.value as Dimension | "none");
                                    if (dim.value === "none") {
                                      setSelectedSegmentValues(new Set());
                                    } else {
                                      // Open the Sheet with this segment pre-selected
                                      setPendingSegments([dim.value as Dimension]);
                                      setIsAddSegmentSheetOpen(true);
                                    }
                                    // Clear multi-segment mode when selecting single segment
                                    setIsMultiSegmentApplied(false);
                                  }}
                                >
                                  {dim.label}
                                  {isSelected && selectedSegment !== "none" && selectedSegmentValues.size > 0 && (
                                    <span className="ml-1.5 flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                                      {selectedSegmentValues.size}
                                      <X
                                        className="h-3 w-3 cursor-pointer hover:text-primary/70"
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          setSelectedSegmentValues(new Set());
                                        }}
                                      />
                                    </span>
                                  )}
                                </Button>
                                {!isPinned && (
                                  <button
                                    onClick={() => {
                                      setVisibleSegments(prev => prev.filter(s => s !== dim.value));
                                      if (selectedSegment === dim.value) {
                                        setSelectedSegment("none");
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {/* Saved Configuration Tabs */}
                          {savedConfigurations.length > 0 && (
                            <>
                              <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2" />
                              {savedConfigurations.map((config) => {
                                const isActive = activeConfigId === config.id;
                                return (
                                  <div key={config.id} className="flex items-center gap-1 group">
                                    <Button
                                      variant={isActive ? "secondary" : "ghost"}
                                      size="sm"
                                      className={cn(
                                        "h-8 px-3 text-xs rounded-full transition-all duration-200",
                                        isActive
                                          ? "bg-primary text-primary-foreground shadow-sm font-medium"
                                          : "text-muted-foreground hover:text-foreground border border-zinc-200 dark:border-zinc-700"
                                      )}
                                      onClick={() => {
                                        // Load configuration and open sidebar for editing
                                        setActiveConfigId(config.id);
                                        setSelectedSegments(config.segments);
                                        setSegment1TopN(config.segment1TopN);
                                        setSegment2TopN(config.segment2TopN);
                                        setSegment3TopN(config.segment3TopN);
                                        setIsMultiSegmentApplied(true);
                                        setSelectedSegment("none");

                                        // Also load into pending for editing
                                        setPendingSegments([...config.segments]);
                                        setIsAddSegmentSheetOpen(true);
                                      }}
                                    >
                                      {config.name}
                                    </Button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Remove this configuration
                                        setSavedConfigurations(prev => prev.filter(c => c.id !== config.id));
                                        if (activeConfigId === config.id) {
                                          setActiveConfigId(null);
                                          setSelectedSegments([]);
                                          setIsMultiSegmentApplied(false);
                                        }
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-opacity"
                                    >
                                      <X className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* Segment Configuration Sheet */}
                          <Sheet open={isAddSegmentSheetOpen} onOpenChange={setIsAddSegmentSheetOpen}>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary hover:text-primary transition-all ml-1 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Segment
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="p-0 flex flex-col w-[450px]">
                              <SheetHeader className="p-6 border-b">
                                <SheetTitle>Segment Analysis</SheetTitle>
                                <p className="text-xs text-muted-foreground">
                                  Configure segments for dimensional analysis. First segment defines trend lines, second creates columns, third creates rows.
                                </p>
                              </SheetHeader>

                              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Segment 1 - Trend Lines */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                                    <span className="text-sm font-semibold">Trend Lines</span>
                                    <span className="text-xs text-muted-foreground">(lines within each chart)</span>
                                  </div>
                                  <Select
                                    value={pendingSegments[0] || ""}
                                    onValueChange={(v) => {
                                      const newSegments = [...pendingSegments];
                                      newSegments[0] = v as Dimension;
                                      setPendingSegments(newSegments.filter(Boolean) as Dimension[]);
                                    }}
                                  >
                                    <SelectTrigger className="h-10">
                                      <SelectValue placeholder="Select segment..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {trendDimensionsList
                                        .filter(d => d.value !== "none" && !pendingSegments.slice(1).includes(d.value))
                                        .map(dim => (
                                          <SelectItem key={dim.value} value={dim.value}>{dim.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {pendingSegments[0] && (
                                    <div className="flex items-center gap-2 pl-8">
                                      <span className="text-xs text-muted-foreground">Show:</span>
                                      <Select
                                        value={String(segment1TopN)}
                                        onValueChange={(v) => setSegment1TopN(parseInt(v))}
                                      >
                                        <SelectTrigger className="h-8 w-[90px] text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="3">Top 3</SelectItem>
                                          <SelectItem value="5">Top 5</SelectItem>
                                          <SelectItem value="10">Top 10</SelectItem>
                                          <SelectItem value="20">Top 20</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      {/* Value Picker Popover */}
                                      <Popover open={valuePickerOpen === 1} onOpenChange={(open) => {
                                        setValuePickerOpen(open ? 1 : null);
                                        if (!open) setValuePickerSearch("");
                                      }}>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                                            {segment1CustomValues.length > 0
                                              ? `${segment1CustomValues.length} Values`
                                              : "Select Values"}
                                            <ChevronDown className="h-3 w-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0" align="start">
                                          <div className="p-3 border-b">
                                            <div className="relative">
                                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input
                                                placeholder="Search values..."
                                                className="pl-8 h-9"
                                                value={valuePickerSearch}
                                                onChange={(e) => setValuePickerSearch(e.target.value)}
                                              />
                                            </div>
                                          </div>
                                          <div className="p-2 border-b flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                                              Select {trendDimensionsList.find(d => d.value === pendingSegments[0])?.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {filterOptions?.cities?.length || 0} total
                                            </span>
                                          </div>
                                          <div className="px-3 py-2 border-b flex gap-3">
                                            <button
                                              className="text-xs font-medium text-primary hover:underline"
                                              onClick={() => {
                                                const allValues = pendingSegments[0] === 'city'
                                                  ? filterOptions?.cities || []
                                                  : pendingSegments[0] === 'vehicle_category'
                                                    ? filterOptions?.vehicleCategories?.map(v => v.value) || []
                                                    : pendingSegments[0] === 'trip_tag'
                                                      ? filterOptions?.tripTags || []
                                                      : [];
                                                setSegment1CustomValues(allValues);
                                              }}
                                            >
                                              Select All
                                            </button>
                                            <button
                                              className="text-xs text-muted-foreground hover:underline"
                                              onClick={() => setSegment1CustomValues([])}
                                            >
                                              Clear All
                                            </button>
                                          </div>
                                          <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                            {(() => {
                                              let availableValues: string[] = [];
                                              if (pendingSegments[0] === 'city') {
                                                availableValues = filterOptions?.cities || [];
                                              } else if (pendingSegments[0] === 'vehicle_category') {
                                                availableValues = (filterOptions?.vehicleCategories?.map(v => v.value) || [])
                                                  .filter(v => ["Auto", "Cab", "Bike"].includes(v));
                                              } else if (pendingSegments[0] === 'trip_tag') {
                                                availableValues = filterOptions?.tripTags || [];
                                              }

                                              return availableValues
                                                .filter(v => v.toLowerCase().includes(valuePickerSearch.toLowerCase()))
                                                .map(value => (
                                                  <div
                                                    key={value}
                                                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                                    onClick={() => {
                                                      setSegment1CustomValues(prev =>
                                                        prev.includes(value)
                                                          ? prev.filter(v => v !== value)
                                                          : [...prev, value]
                                                      );
                                                    }}
                                                  >
                                                    <div className={cn(
                                                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                      segment1CustomValues.includes(value)
                                                        ? "bg-primary border-primary"
                                                        : "border-zinc-300 dark:border-zinc-600"
                                                    )}>
                                                      {segment1CustomValues.includes(value) && (
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                      )}
                                                    </div>
                                                    <span className="text-sm">{value}</span>
                                                  </div>
                                                ));
                                            })()}
                                          </div>
                                          <div className="p-3 border-t">
                                            <Button
                                              className="w-full h-9"
                                              onClick={() => setValuePickerOpen(null)}
                                            >
                                              Apply Selections
                                            </Button>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )}
                                </div>

                                {/* Segment 2 - Grid Columns */}
                                {pendingSegments[0] && (
                                  <div className="space-y-3 pt-4 border-t border-dashed">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold">2</span>
                                      <span className="text-sm font-semibold">Grid Columns</span>
                                      <span className="text-xs text-muted-foreground">(optional)</span>
                                    </div>
                                    <Select
                                      value={pendingSegments[1] || ""}
                                      onValueChange={(v) => {
                                        const newSegments = [...pendingSegments];
                                        if (v === "__none__") {
                                          newSegments.splice(1);
                                        } else {
                                          newSegments[1] = v as Dimension;
                                        }
                                        setPendingSegments(newSegments.filter(Boolean) as Dimension[]);
                                      }}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select segment (optional)..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">None</SelectItem>
                                        {trendDimensionsList
                                          .filter(d => d.value !== "none" && d.value !== pendingSegments[0] && d.value !== pendingSegments[2])
                                          .map(dim => (
                                            <SelectItem key={dim.value} value={dim.value}>{dim.label}</SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    {pendingSegments[1] && (
                                      <div className="flex items-center gap-2 pl-8">
                                        <span className="text-xs text-muted-foreground">Show:</span>
                                        <Select
                                          value={String(segment2TopN)}
                                          onValueChange={(v) => setSegment2TopN(parseInt(v))}
                                        >
                                          <SelectTrigger className="h-8 w-[90px] text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="3">Top 3</SelectItem>
                                            <SelectItem value="5">Top 5</SelectItem>
                                            <SelectItem value="10">Top 10</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        {/* Value Picker Popover for Segment 2 */}
                                        <Popover open={valuePickerOpen === 2} onOpenChange={(open) => {
                                          setValuePickerOpen(open ? 2 : null);
                                          if (!open) setValuePickerSearch("");
                                        }}>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                                              {segment2CustomValues.length > 0
                                                ? `${segment2CustomValues.length} Values`
                                                : "Select Values"}
                                              <ChevronDown className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72 p-0" align="start">
                                            <div className="p-3 border-b">
                                              <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                  placeholder="Search values..."
                                                  className="pl-8 h-9"
                                                  value={valuePickerSearch}
                                                  onChange={(e) => setValuePickerSearch(e.target.value)}
                                                />
                                              </div>
                                            </div>
                                            <div className="p-2 border-b flex items-center justify-between">
                                              <span className="text-xs font-semibold text-muted-foreground uppercase">
                                                Select {trendDimensionsList.find(d => d.value === pendingSegments[1])?.label}
                                              </span>
                                            </div>
                                            <div className="px-3 py-2 border-b flex gap-3">
                                              <button
                                                className="text-xs font-medium text-primary hover:underline"
                                                onClick={() => {
                                                  const seg = pendingSegments[1];
                                                  const allValues = seg === 'city'
                                                    ? filterOptions?.cities || []
                                                    : seg === 'vehicle_category'
                                                      ? filterOptions?.vehicleCategories?.map(v => v.value) || []
                                                      : seg === 'trip_tag'
                                                        ? filterOptions?.tripTags || []
                                                        : [];
                                                  setSegment2CustomValues(allValues);
                                                }}
                                              >
                                                Select All
                                              </button>
                                              <button
                                                className="text-xs text-muted-foreground hover:underline"
                                                onClick={() => setSegment2CustomValues([])}
                                              >
                                                Clear All
                                              </button>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                              {(() => {
                                                const seg = pendingSegments[1];
                                                let availableValues: string[] = [];
                                                if (seg === 'city') {
                                                  availableValues = filterOptions?.cities || [];
                                                } else if (seg === 'vehicle_category') {
                                                  availableValues = (filterOptions?.vehicleCategories?.map(v => v.value) || [])
                                                    .filter(v => ["Auto", "Cab", "Bike"].includes(v));
                                                } else if (seg === 'trip_tag') {
                                                  availableValues = filterOptions?.tripTags || [];
                                                }

                                                return availableValues
                                                  .filter(v => v.toLowerCase().includes(valuePickerSearch.toLowerCase()))
                                                  .map(value => (
                                                    <div
                                                      key={value}
                                                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                                      onClick={() => {
                                                        setSegment2CustomValues(prev =>
                                                          prev.includes(value)
                                                            ? prev.filter(v => v !== value)
                                                            : [...prev, value]
                                                        );
                                                      }}
                                                    >
                                                      <div className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        segment2CustomValues.includes(value)
                                                          ? "bg-primary border-primary"
                                                          : "border-zinc-300 dark:border-zinc-600"
                                                      )}>
                                                        {segment2CustomValues.includes(value) && (
                                                          <Check className="h-3 w-3 text-primary-foreground" />
                                                        )}
                                                      </div>
                                                      <span className="text-sm">{value}</span>
                                                    </div>
                                                  ));
                                              })()}
                                            </div>
                                            <div className="p-3 border-t">
                                              <Button
                                                className="w-full h-9"
                                                onClick={() => setValuePickerOpen(null)}
                                              >
                                                Apply Selections
                                              </Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Segment 3 - Grid Rows */}
                                {pendingSegments[1] && (
                                  <div className="space-y-3 pt-4 border-t border-dashed">
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold">3</span>
                                      <span className="text-sm font-semibold">Grid Rows</span>
                                      <span className="text-xs text-muted-foreground">(optional)</span>
                                    </div>
                                    <Select
                                      value={pendingSegments[2] || ""}
                                      onValueChange={(v) => {
                                        const newSegments = [...pendingSegments];
                                        if (v === "__none__") {
                                          newSegments.splice(2);
                                        } else {
                                          newSegments[2] = v as Dimension;
                                        }
                                        setPendingSegments(newSegments.filter(Boolean) as Dimension[]);
                                      }}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select segment (optional)..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">None</SelectItem>
                                        {trendDimensionsList
                                          .filter(d => d.value !== "none" && d.value !== pendingSegments[0] && d.value !== pendingSegments[1])
                                          .map(dim => (
                                            <SelectItem key={dim.value} value={dim.value}>{dim.label}</SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    {pendingSegments[2] && (
                                      <div className="flex items-center gap-2 pl-8">
                                        <span className="text-xs text-muted-foreground">Show:</span>
                                        <Select
                                          value={String(segment3TopN)}
                                          onValueChange={(v) => setSegment3TopN(parseInt(v))}
                                        >
                                          <SelectTrigger className="h-8 w-[90px] text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="3">Top 3</SelectItem>
                                            <SelectItem value="5">Top 5</SelectItem>
                                            <SelectItem value="10">Top 10</SelectItem>
                                          </SelectContent>
                                        </Select>

                                        {/* Value Picker Popover for Segment 3 */}
                                        <Popover open={valuePickerOpen === 3} onOpenChange={(open) => {
                                          setValuePickerOpen(open ? 3 : null);
                                          if (!open) setValuePickerSearch("");
                                        }}>
                                          <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                                              {segment3CustomValues.length > 0
                                                ? `${segment3CustomValues.length} Values`
                                                : "Select Values"}
                                              <ChevronDown className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72 p-0" align="start">
                                            <div className="p-3 border-b">
                                              <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                  placeholder="Search values..."
                                                  className="pl-8 h-9"
                                                  value={valuePickerSearch}
                                                  onChange={(e) => setValuePickerSearch(e.target.value)}
                                                />
                                              </div>
                                            </div>
                                            <div className="p-2 border-b flex items-center justify-between">
                                              <span className="text-xs font-semibold text-muted-foreground uppercase">
                                                Select {trendDimensionsList.find(d => d.value === pendingSegments[2])?.label}
                                              </span>
                                            </div>
                                            <div className="px-3 py-2 border-b flex gap-3">
                                              <button
                                                className="text-xs font-medium text-primary hover:underline"
                                                onClick={() => {
                                                  const seg = pendingSegments[2];
                                                  const allValues = seg === 'city'
                                                    ? filterOptions?.cities || []
                                                    : seg === 'vehicle_category'
                                                      ? filterOptions?.vehicleCategories?.map(v => v.value) || []
                                                      : seg === 'trip_tag'
                                                        ? filterOptions?.tripTags || []
                                                        : [];
                                                  setSegment3CustomValues(allValues);
                                                }}
                                              >
                                                Select All
                                              </button>
                                              <button
                                                className="text-xs text-muted-foreground hover:underline"
                                                onClick={() => setSegment3CustomValues([])}
                                              >
                                                Clear All
                                              </button>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                              {(() => {
                                                const seg = pendingSegments[2];
                                                let availableValues: string[] = [];
                                                if (seg === 'city') {
                                                  availableValues = filterOptions?.cities || [];
                                                } else if (seg === 'vehicle_category') {
                                                  availableValues = filterOptions?.vehicleCategories?.map(v => v.value) || [];
                                                } else if (seg === 'trip_tag') {
                                                  availableValues = filterOptions?.tripTags || [];
                                                }

                                                return availableValues
                                                  .filter(v => v.toLowerCase().includes(valuePickerSearch.toLowerCase()))
                                                  .map(value => (
                                                    <div
                                                      key={value}
                                                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                                      onClick={() => {
                                                        setSegment3CustomValues(prev =>
                                                          prev.includes(value)
                                                            ? prev.filter(v => v !== value)
                                                            : [...prev, value]
                                                        );
                                                      }}
                                                    >
                                                      <div className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        segment3CustomValues.includes(value)
                                                          ? "bg-primary border-primary"
                                                          : "border-zinc-300 dark:border-zinc-600"
                                                      )}>
                                                        {segment3CustomValues.includes(value) && (
                                                          <Check className="h-3 w-3 text-primary-foreground" />
                                                        )}
                                                      </div>
                                                      <span className="text-sm">{value}</span>
                                                    </div>
                                                  ));
                                              })()}
                                            </div>
                                            <div className="p-3 border-t">
                                              <Button
                                                className="w-full h-9"
                                                onClick={() => setValuePickerOpen(null)}
                                              >
                                                Apply Selections
                                              </Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Preview Summary */}
                                {pendingSegments.length > 0 && (
                                  <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Preview</div>
                                    <div className="text-sm">
                                      {pendingSegments.length === 1 && (
                                        <span>Single chart with <strong>{trendDimensionsList.find(d => d.value === pendingSegments[0])?.label}</strong> as trend lines</span>
                                      )}
                                      {pendingSegments.length === 2 && (
                                        <span>Grid of <strong>{segment2TopN}</strong> charts (by {trendDimensionsList.find(d => d.value === pendingSegments[1])?.label}), each showing <strong>{trendDimensionsList.find(d => d.value === pendingSegments[0])?.label}</strong> trends</span>
                                      )}
                                      {pendingSegments.length === 3 && (
                                        <span>Matrix of <strong>{segment2TopN} × {segment3TopN}</strong> charts (columns: {trendDimensionsList.find(d => d.value === pendingSegments[1])?.label}, rows: {trendDimensionsList.find(d => d.value === pendingSegments[2])?.label}), each showing <strong>{trendDimensionsList.find(d => d.value === pendingSegments[0])?.label}</strong> trends</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="p-6 border-t bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                                <Button
                                  className="w-full h-11 rounded-xl font-bold shadow-lg gap-2"
                                  disabled={pendingSegments.length === 0}
                                  onClick={() => {
                                    // Generate configuration name from segment labels
                                    const configName = pendingSegments
                                      .map(seg => trendDimensionsList.find(d => d.value === seg)?.label || seg)
                                      .join(" + ");

                                    const newConfig: SegmentConfiguration = {
                                      id: Date.now().toString(),
                                      name: configName,
                                      segments: [...pendingSegments],
                                      segment1TopN,
                                      segment2TopN,
                                      segment3TopN,
                                    };

                                    // Add to saved configurations
                                    setSavedConfigurations(prev => [...prev, newConfig]);
                                    setActiveConfigId(newConfig.id);

                                    // Apply this configuration
                                    setSelectedSegments(pendingSegments);

                                    // If only one segment is selected, use the normal selectedSegment 
                                    // flow to get the big chart (same as clicking City/Vehicle Category pills)
                                    if (pendingSegments.length === 1) {
                                      setSelectedSegment(pendingSegments[0]);
                                      setIsMultiSegmentApplied(false);

                                      // Sync custom values to the legacy selectedSegmentValues state
                                      // so the single-segment chart uses them for filtering
                                      if (segment1CustomValues.length > 0) {
                                        setSelectedSegmentValues(new Set(segment1CustomValues));
                                        setTopN("custom");
                                      } else {
                                        setSelectedSegmentValues(new Set());
                                        setTopN(segment1TopN);
                                      }
                                    } else {
                                      // For 2+ segments, use multi-segment grid
                                      setIsMultiSegmentApplied(true);
                                      setSelectedSegment("none");
                                    }

                                    setIsAddSegmentSheetOpen(false);

                                    // Reset pending for next configuration
                                    setPendingSegments([]);
                                  }}
                                >
                                  <Play className="h-4 w-4 fill-current" />
                                  Apply Analysis
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full h-10 rounded-xl"
                                  onClick={() => {
                                    setPendingSegments([]);
                                    setIsAddSegmentSheetOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>

                        {/* Segment Value Selector (Only if segment is selected) */}
                        {selectedSegment !== "none" && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={topN === "all" || topN === "custom" ? "custom" : String(topN)}
                              onValueChange={(v) => {
                                if (v === "custom") {
                                  setTopN("custom");
                                } else if (v === "all") {
                                  setTopN("all");
                                } else {
                                  setTopN(parseInt(v));
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-[90px] text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg">
                                <SelectValue placeholder={topN === "custom" ? "Custom" : topN === "all" ? "All" : `Top ${topN}`} />
                              </SelectTrigger>
                              <SelectContent align="end">
                                <SelectItem value="3" className="text-xs">Top 3</SelectItem>
                                <SelectItem value="5" className="text-xs">Top 5</SelectItem>
                                <SelectItem value="10" className="text-xs">Top 10</SelectItem>
                                <SelectItem value="20" className="text-xs">Top 20</SelectItem>
                                <SelectItem value="all" className="text-xs">All</SelectItem>
                                <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                              </SelectContent>
                            </Select>

                            <Popover
                              open={activePopoverGroup === groupIndex}
                              onOpenChange={(open) => {
                                if (open) {
                                  setActivePopoverGroup(groupIndex);
                                  setTempSegmentValues(new Set(selectedSegmentValues));
                                  setValueSearchQuery(""); // Clear search on open
                                } else {
                                  setActivePopoverGroup(null);
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 min-w-[140px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium"
                                >
                                  {selectedSegmentValues.size === 0 ? "Select Values" : `${selectedSegmentValues.size} Values`}
                                  <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl" align="end">
                                <div className="p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                      placeholder="Search values..."
                                      className="h-8 pl-8 text-xs bg-white dark:bg-zinc-900"
                                      value={valueSearchQuery}
                                      onChange={(e) => setValueSearchQuery(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-4 p-1">
                                  <div className="flex items-center justify-between px-2 pt-1">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Select {trendDimensionsList.find(d => d.value === selectedSegment)?.label}</div>
                                    <div className="text-[10px] text-muted-foreground">{availableSegmentValues.length} total</div>
                                  </div>
                                  <div className="flex items-center gap-2 px-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-primary"
                                      onClick={() => setTempSegmentValues(new Set(availableSegmentValues))}
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground"
                                      onClick={() => setTempSegmentValues(new Set())}
                                    >
                                      Clear All
                                    </Button>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                                    {availableSegmentValues
                                      .filter(val => val.toLowerCase().includes(valueSearchQuery.toLowerCase()))
                                      .map((value) => {
                                        const isSelected = tempSegmentValues.has(value);
                                        return (
                                          <div
                                            key={value}
                                            className={cn(
                                              "flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-sm transition-colors duration-150",
                                              isSelected && "bg-zinc-50 dark:bg-zinc-800/50"
                                            )}
                                            onClick={() => {
                                              const newSet = new Set(tempSegmentValues);
                                              if (isSelected) {
                                                newSet.delete(value);
                                              } else {
                                                newSet.add(value);
                                              }
                                              setTempSegmentValues(newSet);
                                            }}
                                          >
                                            <div className={cn(
                                              "h-4 w-4 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                              isSelected ? "bg-primary border-primary scale-110 shadow-sm" : "border-zinc-300 dark:border-zinc-700"
                                            )}>
                                              {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground stroke-[3px]" />}
                                            </div>
                                            <span className={cn("truncate flex-1 font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>{value || "(empty)"}</span>
                                          </div>
                                        );
                                      })}
                                  </div>
                                  <div className="flex justify-end gap-2 pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                                    <Button size="sm" className="h-8 px-4 text-xs font-bold rounded-lg shadow-sm" onClick={() => {
                                      setSelectedSegmentValues(new Set(tempSegmentValues));
                                      setTopN("custom");
                                      setActivePopoverGroup(null);
                                    }}>Apply Selections</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-0 relative bg-white dark:bg-zinc-950">
                        <div className="pt-4 pb-4 px-6">
                          {(() => {
                            const isLoading =
                              trendTimeSeriesLoading ||
                              (selectedSegment !== "none" && segmentTrendLoading);

                            if (isLoading) {
                              return <Skeleton className="h-[400px] w-full" />;
                            }

                            // Multi-Segment View
                            if (isMultiSegmentApplied && selectedSegments.length > 0) {
                              const metricToShow = selectedRateMetrics[0] || selectedValueMetrics[0] || 'conversion';
                              return (
                                <MultiSegmentGrid
                                  segments={selectedSegments}
                                  gridData={multiSegmentResult.gridData}
                                  segment3Values={multiSegmentResult.segment3Values}
                                  filters={timeSeriesFilters}
                                  granularity={effectiveGranularity}
                                  isLoading={multiSegmentResult.isLoading}
                                  selectedMetric={metricToShow}
                                />
                              );
                            }

                            // Filter metrics for this group
                            const groupSpecificMetrics = chartDataByMetric.filter(m =>
                              group.metrics.includes(m.metric as any)
                            );

                            // If we have metric-based charts (one chart per metric)
                            if (groupSpecificMetrics.length > 0) {
                              return (
                                <div className={groupSpecificMetrics.length === 1 ? "" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                                  {groupSpecificMetrics.map((metricChart) => (
                                    <Card key={metricChart.metric} className="overflow-hidden">
                                      <CardContent className="p-0">
                                        {/* Header with all controls */}
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                                          {/* Left side controls */}
                                          <div className="flex items-center gap-2">
                                            {/* Daily/Hourly Toggle */}
                                            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-md p-0.5">
                                              <Button
                                                variant={trendGranularity === "day" ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                  "h-6 px-2.5 text-[11px] font-medium transition-all",
                                                  trendGranularity === "day" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                                onClick={() => setTrendGranularity("day")}
                                              >
                                                Daily
                                              </Button>
                                              <Button
                                                variant={trendGranularity === "hour" ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                  "h-6 px-2.5 text-[11px] font-medium transition-all",
                                                  trendGranularity === "hour" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                                onClick={() => setTrendGranularity("hour")}
                                              >
                                                Hourly
                                              </Button>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700" />

                                            {/* Period/Cumulative Toggle */}
                                            <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-md p-0.5">
                                              <Button
                                                variant={!isCumulative ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                  "h-6 px-2.5 text-[11px] font-medium transition-all",
                                                  !isCumulative ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                                onClick={() => setIsCumulative(false)}
                                              >
                                                Period
                                              </Button>
                                              <Button
                                                variant={isCumulative ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                  "h-6 px-2.5 text-[11px] font-medium transition-all",
                                                  isCumulative ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                                onClick={() => setIsCumulative(true)}
                                              >
                                                Cumulative
                                              </Button>
                                            </div>
                                          </div>

                                          {/* Right side - Metric selector */}
                                          <Select
                                            value={metricChart.metric}
                                            onValueChange={(newMetric) => {
                                              const allRateOptions: RateMetric[] = ["conversion", "driverQuoteAcceptance", "riderFareAcceptance", "cancellationRate", "userCancellationRate", "driverCancellationRate"];
                                              const allValueOptions: ValueMetric[] = ["searches", "quotesRequested", "quotesAccepted", "bookings", "cancelledRides", "userCancellations", "driverCancellations", "completedRides", "earnings"];

                                              if (allRateOptions.includes(newMetric as RateMetric)) {
                                                if (selectedRateMetrics.includes(metricChart.metric as RateMetric)) {
                                                  setSelectedRateMetrics(prev => prev.map(m => m === metricChart.metric ? (newMetric as RateMetric) : m));
                                                } else {
                                                  setSelectedRateMetrics([newMetric as RateMetric]);
                                                  setSelectedValueMetrics(prev => prev.filter(m => m !== metricChart.metric));
                                                }
                                              } else if (allValueOptions.includes(newMetric as ValueMetric)) {
                                                if (selectedValueMetrics.includes(metricChart.metric as ValueMetric)) {
                                                  setSelectedValueMetrics(prev => prev.map(m => m === metricChart.metric ? (newMetric as ValueMetric) : m));
                                                } else {
                                                  setSelectedValueMetrics([newMetric as ValueMetric]);
                                                  setSelectedRateMetrics(prev => prev.filter(m => m !== metricChart.metric));
                                                }
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="h-7 w-44 text-[11px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                                              <SelectValue>{metricChart.metricLabel}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Rate Metrics</div>
                                              <SelectItem value="conversion">Conversion Rate</SelectItem>
                                              {!isVehicleSegment && (
                                                <SelectItem value="riderFareAcceptance">Rider Fare Acceptance</SelectItem>
                                              )}
                                              <SelectItem value="driverQuoteAcceptance">Driver Quote Acceptance</SelectItem>
                                              <SelectItem value="cancellationRate">Cancellation Rate</SelectItem>
                                              <SelectItem value="userCancellationRate">User Cancellation Rate</SelectItem>
                                              <SelectItem value="driverCancellationRate">Driver Cancellation Rate</SelectItem>
                                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Value Metrics</div>
                                              {!isVehicleSegment && (
                                                <SelectItem value="searches">Searches</SelectItem>
                                              )}
                                              <SelectItem value="quotesRequested">Quotes Requested</SelectItem>
                                              <SelectItem value="quotesAccepted">Quotes Accepted</SelectItem>
                                              <SelectItem value="bookings">Bookings</SelectItem>
                                              <SelectItem value="completedRides">Completed Rides</SelectItem>
                                              <SelectItem value="cancelledRides">Cancellations</SelectItem>
                                              <SelectItem value="userCancellations">User Cancellations</SelectItem>
                                              <SelectItem value="driverCancellations">Driver Cancellations</SelectItem>
                                              <SelectItem value="earnings">Earnings</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Chart area */}
                                        <div className={groupSpecificMetrics.length === 1 ? "h-[400px] p-4" : "h-[280px] p-4"}>
                                          <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                              data={metricChart.data}
                                              margin={{
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 60,
                                              }}
                                              onMouseMove={(state: any) => {
                                                if (state?.activePayload && state.activePayload.length > 0 && state.chartY !== undefined) {
                                                  const chartY = state.chartY;
                                                  const chartHeight = groupSpecificMetrics.length === 1 ? 330 : 210;

                                                  const entries = state.activePayload.filter((e: any) => e.value !== undefined && e.name);
                                                  if (entries.length === 0) return;

                                                  const values = entries.map((e: any) => e.value);
                                                  const maxVal = Math.max(...values);
                                                  const minVal = Math.min(...values);
                                                  const range = maxVal - minVal || maxVal || 1;

                                                  let closestLine = entries[0]?.name;
                                                  let closestDistance = Infinity;

                                                  entries.forEach((entry: any) => {
                                                    const normalized = (maxVal - entry.value) / range;
                                                    const estimatedY = 5 + normalized * chartHeight;
                                                    const distance = Math.abs(chartY - estimatedY);

                                                    if (distance < closestDistance) {
                                                      closestDistance = distance;
                                                      closestLine = entry.name;
                                                    }
                                                  });

                                                  setHoveredLine(closestLine);
                                                }
                                              }}
                                              onMouseLeave={() => setHoveredLine(null)}
                                            >
                                              <CartesianGrid
                                                stroke="#f5f5f5"
                                                strokeWidth={1}
                                                vertical={true}
                                                horizontal={true}
                                              />
                                              <XAxis
                                                dataKey={
                                                  selectedSegment === "run_hour" ? "minute" :
                                                    selectedSegment === "run_day" ? "hour" :
                                                      selectedSegment === "run_week" ? "dayOfWeek" :
                                                        selectedSegment === "run_month" ? "dayOfMonth" :
                                                          "date"
                                                }
                                                tickFormatter={(value, index) => {
                                                  if (selectedSegment === "run_hour" || selectedSegment === "run_day" || selectedSegment === "run_week") {
                                                    return value;
                                                  }
                                                  if (selectedSegment === "run_month") {
                                                    return `Day ${value}`;
                                                  }
                                                  const date = new Date(value);
                                                  const hour = date.getHours();

                                                  // Smart date/time formatting
                                                  if (effectiveGranularity === "hour") {
                                                    // At midnight or first tick, show date
                                                    if (hour === 0 || index === 0) {
                                                      return format(date, "d MMM");
                                                    }
                                                    // Otherwise show time only
                                                    return format(date, "HH:mm");
                                                  }
                                                  return format(date, "MMM d");
                                                }}
                                                fontSize={10}
                                                angle={-45}
                                                textAnchor="end"
                                                height={70}
                                                interval="preserveStartEnd"
                                                tick={{ fill: '#6b7280' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                                tickLine={{ stroke: '#e5e7eb' }}
                                              />
                                              <YAxis
                                                fontSize={10}
                                                domain={metricChart.isPercentage ? [0, 100] : calculateNiceDomain(metricChart.data || [], metricChart.lines)}
                                                tickFormatter={(value) => {
                                                  if (metricChart.isPercentage) {
                                                    return `${value.toFixed(0)}%`;
                                                  }
                                                  return formatYAxisValue(value);
                                                }}
                                                tick={{ fill: '#6b7280' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                                tickLine={{ stroke: '#e5e7eb' }}
                                                width={50}
                                              />
                                              <Tooltip
                                                content={({ active, payload, label }) => {
                                                  if (active && payload && payload.length) {
                                                    const dateStr = label || payload[0]?.payload?.date || "";
                                                    let formattedDate = "";
                                                    let formattedTime = "";

                                                    if (selectedSegment === "run_hour" || selectedSegment === "run_day") {
                                                      formattedTime = dateStr;
                                                      formattedDate = metricChart.lines[0] || "";
                                                    } else if (selectedSegment === "run_week") {
                                                      formattedDate = dateStr;
                                                    } else if (selectedSegment === "run_month") {
                                                      formattedDate = `Day ${dateStr}`;
                                                    } else {
                                                      try {
                                                        const date = new Date(dateStr);
                                                        formattedDate = format(date, "yyyy-MM-dd");
                                                        formattedTime = format(date, "HH:mm");
                                                      } catch {
                                                        formattedDate = dateStr;
                                                      }
                                                    }

                                                    return (
                                                      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden min-w-[180px]">
                                                        {(hoveredLine ? payload.filter(entry => entry.name === hoveredLine) : payload).map((entry, index) => {
                                                          const value = entry.value as number;
                                                          const formattedValue = metricChart.isPercentage
                                                            ? `${value.toFixed(1)}%`
                                                            : value >= 1000000
                                                              ? `${(value / 1000000).toFixed(1)}M`
                                                              : value >= 1000
                                                                ? `${(value / 1000).toFixed(1)}K`
                                                                : value.toLocaleString();
                                                          return (
                                                            <div
                                                              key={index}
                                                              className="flex border-b border-gray-100 dark:border-zinc-800 last:border-b-0"
                                                            >
                                                              <div
                                                                className="w-1.5 flex-shrink-0"
                                                                style={{ backgroundColor: entry.color }}
                                                              />
                                                              <div className="px-3 py-2.5 flex-1">
                                                                {index === 0 && (
                                                                  <div className="mb-2">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                      {formattedDate}
                                                                    </p>
                                                                    {formattedTime && (
                                                                      <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                        {formattedTime}
                                                                      </p>
                                                                    )}
                                                                  </div>
                                                                )}
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                                                  {entry.name}
                                                                </p>
                                                                <p
                                                                  className="text-lg font-bold"
                                                                  style={{ color: entry.color }}
                                                                >
                                                                  {formattedValue}
                                                                </p>
                                                              </div>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                }}
                                              />
                                              <Legend
                                                content={(props) => {
                                                  const { payload } = props;
                                                  if (!payload || payload.length === 0) return null;

                                                  return (
                                                    <div className="flex flex-wrap gap-4 justify-start px-4 py-3">
                                                      {payload.map((entry: any) => {
                                                        const isVisible = visibleLines[entry.value] !== false;
                                                        return (
                                                          <div
                                                            key={entry.value}
                                                            onClick={() => {
                                                              setVisibleLines(prev => ({
                                                                ...prev,
                                                                [entry.value]: !prev[entry.value]
                                                              }));
                                                            }}
                                                            className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-70"
                                                            style={{ opacity: isVisible ? 1 : 0.4 }}
                                                          >
                                                            <div
                                                              className="w-3 h-3 rounded-sm transition-all"
                                                              style={{
                                                                backgroundColor: isVisible ? entry.color : '#9ca3af',
                                                                border: isVisible ? 'none' : `1px solid ${entry.color}`
                                                              }}
                                                            />
                                                            <span
                                                              className="text-xs font-medium transition-all"
                                                              style={{ color: isVisible ? 'inherit' : '#9ca3af' }}
                                                            >
                                                              {entry.value}
                                                            </span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  );
                                                }}
                                              />
                                              {metricChart.lines.map((segmentValue, lineIndex) => (
                                                <Line
                                                  key={segmentValue}
                                                  type="monotone"
                                                  dataKey={segmentValue}
                                                  name={segmentValue}
                                                  stroke={COLORS[lineIndex % COLORS.length]}
                                                  strokeWidth={2}
                                                  strokeLinecap="round"
                                                  strokeDasharray={segmentValue === "Others" ? "4 4" : undefined}
                                                  dot={false}
                                                  activeDot={{ r: 5, strokeWidth: 2 }}
                                                  hide={visibleLines[segmentValue] === false}
                                                />
                                              ))}
                                            </LineChart>
                                          </ResponsiveContainer>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              );
                            }

                            // Fallback if no specific metrics found for this group
                            return (
                              <div className="h-[400px] flex items-center justify-center text-muted-foreground italic">
                                No selected metrics in this category ({group.type})
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
                }
              </div>
            )
            }

            <div className="mt-8">
              <SummaryTable
                data={isMultiSegmentApplied && selectedSegments.length > 1 && multiSegmentSummaryTableData.length > 0
                  ? multiSegmentSummaryTableData
                  : summaryTableData}
                segmentLabels={summarySegmentLabels}
                title="Summary Table"
                loading={trendTimeSeriesLoading || segmentTrendLoading || (isMultiSegmentApplied && multiSegmentResult.isLoading)}
                showComparison={!!compareDateFrom}
              />
            </div>
          </div >
        )
        }


        {/* End of content */}
      </PageContent >
    </Page >
  );
}
