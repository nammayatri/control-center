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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  useExecutiveMetrics,
  useComparisonMetrics,
  useTimeSeries,
  useTrendData,
  useFilterOptions,
  useGroupedMetrics,
} from "../../hooks/useExecMetrics";
import type {
  MetricsFilters,
  Dimension,
  Granularity,
} from "../../services/execMetrics";
import {
  Search,
  ShoppingCart,
  CheckCircle,
  Coins as IndianRupee,
  RefreshCw,
  Filter,
  LayoutGrid,
  Maximize2,
  Percent,
  XCircle as CancelIcon,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Plus,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  Legend,
} from "recharts";
import { SmallTrendChart } from "./SmallTrendChart";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#d946ef",
];

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
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
  const [selectedCity, setSelectedCity] = useState<string>("__all__");
  const [selectedState, setSelectedState] = useState<string>("__all__");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("__all__"); // Deprecated - kept for backward compatibility
  const [selectedBapMerchant, setSelectedBapMerchant] =
    useState<string>("__all__");
  const [selectedBppMerchant, setSelectedBppMerchant] =
    useState<string>("__all__");
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
  const [groupBy, setGroupBy] = useState<
    "city" | "merchant_id" | "flow_type" | "trip_tag" | "service_tier"
  >("city");

  // Advanced filter selections state
  const [filterSelections, setFilterSelections] = useState<FilterSelections>(
    {}
  );
  const [trendDimension] = useState<Dimension | "none">("none");
  const [isGridView, setIsGridView] = useState(false);

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
  const [segmentSearchQuery, setSegmentSearchQuery] = useState("");

  // Metric selection for conversion trend graph
  type TrendMetric =
    | "conversion"
    | "driverQuoteAcceptance"
    | "riderFareAcceptance"
    | "cancellationRate"
    | "searches"
    | "searchTries"
    | "bookings"
    | "completedRides"
    | "earnings"
    | "userCancellation"
    | "driverCancellation";
  const [selectedTrendMetrics, setSelectedTrendMetrics] = useState<
    TrendMetric[]
  >(["conversion"]);

  // Selected segment values (for filtering which segment values to display)
  const [selectedSegmentValues, setSelectedSegmentValues] = useState<
    Set<string>
  >(new Set());

  // Temporary segment values for popover (before applying)
  const [tempSegmentValues, setTempSegmentValues] = useState<Set<string>>(
    new Set()
  );
  const [isSegmentPopoverOpen, setIsSegmentPopoverOpen] = useState(false);

  // Group metrics by Y-axis type
  const metricsByYAxis = useMemo(() => {
    // Helper to determine Y-axis type for a metric
    const getYAxisType = (metric: TrendMetric): "percentage" | "count" => {
      return [
        "conversion",
        "driverQuoteAcceptance",
        "riderFareAcceptance",
        "cancellationRate",
      ].includes(metric)
        ? "percentage"
        : "count";
    };

    const groups: { type: "percentage" | "count"; metrics: TrendMetric[] }[] =
      [];
    const percentageMetrics: TrendMetric[] = [];
    const countMetrics: TrendMetric[] = [];

    selectedTrendMetrics.forEach((metric) => {
      if (getYAxisType(metric) === "percentage") {
        percentageMetrics.push(metric);
      } else {
        countMetrics.push(metric);
      }
    });

    if (percentageMetrics.length > 0) {
      groups.push({ type: "percentage", metrics: percentageMetrics });
    }
    if (countMetrics.length > 0) {
      groups.push({ type: "count", metrics: countMetrics });
    }

    return groups;
  }, [selectedTrendMetrics]);

  // Segment selection for multi-line chart
  const [selectedSegment, setSelectedSegment] = useState<Dimension | "none">(
    "none"
  );

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
  const [rfaExpanded, setRfaExpanded] = useState(false);
  const [dqaExpanded, setDqaExpanded] = useState(false);
  const [cancellationExpanded, setCancellationExpanded] = useState(false);

  // Build filters object
  const filters: MetricsFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      city: selectedCity !== "__all__" ? [selectedCity] : undefined,
      state: selectedState !== "__all__" ? [selectedState] : undefined,
      merchantId:
        selectedMerchant !== "__all__" ? [selectedMerchant] : undefined, // Deprecated
      bapMerchantId:
        selectedBapMerchant !== "__all__" ? [selectedBapMerchant] : undefined,
      bppMerchantId:
        selectedBppMerchant !== "__all__" ? [selectedBppMerchant] : undefined,
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
      city: selectedCity !== "__all__" ? [selectedCity] : undefined,
      state: selectedState !== "__all__" ? [selectedState] : undefined,
      merchantId:
        selectedMerchant !== "__all__" ? [selectedMerchant] : undefined, // Deprecated
      bapMerchantId:
        selectedBapMerchant !== "__all__" ? [selectedBapMerchant] : undefined,
      bppMerchantId:
        selectedBppMerchant !== "__all__" ? [selectedBppMerchant] : undefined,
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
  const comparisonPeriods = useMemo(() => {
    // Parse the full datetime strings
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Calculate the duration in milliseconds
    const durationMs = toDate.getTime() - fromDate.getTime();

    // Shift both dates back by the exact duration
    const previousFromDate = new Date(fromDate.getTime() - durationMs);
    const previousToDate = new Date(toDate.getTime() - durationMs);

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
  }, [dateFrom, dateTo]);

  // Fetch data
  const { data: filterOptions } = useFilterOptions();

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
            ?.filter((vc) => vc.value !== "All")
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
      setSelectedState(Array.from(stateValues)[0]);
    } else {
      setSelectedState("__all__");
    }

    // City
    const cityValues = filterSelections.city?.values;
    if (cityValues && cityValues.size > 0) {
      setSelectedCity(Array.from(cityValues)[0]);
    } else {
      setSelectedCity("__all__");
    }

    // BAP Merchant
    const bapValues = filterSelections.bapMerchant?.values;
    if (bapValues && bapValues.size > 0) {
      setSelectedBapMerchant(Array.from(bapValues)[0]);
    } else {
      setSelectedBapMerchant("__all__");
    }

    // BPP Merchant
    const bppValues = filterSelections.bppMerchant?.values;
    if (bppValues && bppValues.size > 0) {
      setSelectedBppMerchant(Array.from(bppValues)[0]);
    } else {
      setSelectedBppMerchant("__all__");
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

  const {
    data: executiveData,
    isLoading: execLoading,
    refetch: refetchExec,
  } = useExecutiveMetrics(filters);
  const { data: comparisonData, refetch: refetchComparison } =
    useComparisonMetrics(
      comparisonPeriods.currentFrom,
      comparisonPeriods.currentTo,
      comparisonPeriods.previousFrom,
      comparisonPeriods.previousTo,
      filters
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
  } = useTimeSeries(timeSeriesFilters, timeSeriesGranularity);

  // Fetch time series data for conversion trend graph with user-selected granularity
  const { data: trendTimeSeriesData, isLoading: trendTimeSeriesLoading } =
    useTimeSeries(timeSeriesFilters, trendGranularity);

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
          // Calculate conversion rate based on tier type
          // If quotes_requested is available and searches is 0 (tier data), use quotes_requested
          // Otherwise use searches (tier-less data)
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
        } else if (metricKey === "riderFareAcceptance") {
          // Calculate RFA: searchForQuotes / searches * 100
          value =
            point.searchForQuotes && point.searches
              ? (point.searchForQuotes / point.searches) * 100
              : 0;
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

  // Helper function to get metric label
  const getMetricLabel = useCallback((metric: TrendMetric): string => {
    switch (metric) {
      case "conversion":
        return "Conversion Rate";
      case "driverQuoteAcceptance":
        return "Driver Quote Acceptance Rate";
      case "riderFareAcceptance":
        return "Rider Fare Acceptance Rate";
      case "cancellationRate":
        return "Cancellation Rate";
      case "searches":
        return "Searches";
      case "searchTries":
        return "Search Tries";
      case "bookings":
        return "Bookings";
      case "completedRides":
        return "Completed Rides";
      case "earnings":
        return "Earnings";
      case "userCancellation":
        return "User Cancellation";
      case "driverCancellation":
        return "Driver Cancellation";
      default:
        return "Metric";
    }
  }, []);

  // Fetch dimensional time series data when segment is selected
  const { data: segmentTrendData, isLoading: segmentTrendLoading } =
    useTrendData(
      selectedSegment !== "none" ? selectedSegment : "none",
      trendGranularity,
      filters
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
              const denom =
                point.searches === 0 &&
                  point.searchForQuotes &&
                  point.searchForQuotes > 0
                  ? point.searchForQuotes
                  : point.searches || point.searchForQuotes || 1;
              numerator = point.completedRides || 0;
              denominator = denom;
              value =
                numerator && denominator > 0
                  ? (numerator / denominator) * 100
                  : point.conversion || 0;
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
              denominator = point.searches || 1;
              value =
                numerator && denominator > 0
                  ? (numerator / denominator) * 100
                  : 0;
              break;
            }
            case "cancellationRate": {
              const extendedPoint = point as typeof point & {
                bookings?: number;
                cancelledRides?: number;
              };
              numerator = extendedPoint.cancelledRides || 0;
              denominator = extendedPoint.bookings || 1;
              value =
                numerator && denominator > 0
                  ? (numerator / denominator) * 100
                  : 0;
              break;
            }
            case "searches": {
              value = point.searches || 0;
              break;
            }
            case "searchTries": {
              value = point.searchForQuotes || point.searches || 0;
              break;
            }
            case "bookings": {
              const extendedPoint = point as typeof point & {
                bookings?: number;
              };
              value = extendedPoint.bookings || 0;
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
            case "userCancellation": {
              const extendedPoint = point as typeof point & {
                userCancellations?: number;
              };
              value = extendedPoint.userCancellations || 0;
              break;
            }
            case "driverCancellation": {
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
          const isRateMetric = [
            "conversion",
            "driverQuoteAcceptance",
            "riderFareAcceptance",
            "cancellationRate",
          ].includes(metric);

          if (isRateMetric) {
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
            // RFA: searchForQuotes / searches * 100
            value =
              point.searchForQuotes && point.searches && point.searches > 0
                ? (point.searchForQuotes / point.searches) * 100
                : 0;
            break;
          }

          case "cancellationRate": {
            // Cancellation Rate: cancelledRides / bookings * 100
            value =
              point.cancelledRides && point.bookings && point.bookings > 0
                ? (point.cancelledRides / point.bookings) * 100
                : 0;
            break;
          }

          case "searches": {
            value = point.searches || 0;
            break;
          }

          case "searchTries": {
            value = point.searchForQuotes || point.searches || 0;
            break;
          }

          case "bookings": {
            value = point.bookings || 0;
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

          case "userCancellation": {
            value = point.userCancellations || 0;
            break;
          }

          case "driverCancellation": {
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
        const isRateMetric = [
          "conversion",
          "driverQuoteAcceptance",
          "riderFareAcceptance",
          "cancellationRate",
        ].includes(metric);

        if (isRateMetric) {
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
                  denominator = originalPoint.searches || 1;
                  break;
                }
                case "cancellationRate": {
                  numerator = originalPoint.cancelledRides || 0;
                  denominator = originalPoint.bookings || 1;
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
          data.forEach((point) => {
            const dateKey =
              typeof point.date === "string" ? point.date : String(point.date);
            const existing = combinedData.get(dateKey) || { date: dateKey };
            existing[metricLabel] = point.value;
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
  ]);

  // Extract unique segment values from the data
  const availableSegmentValues = useMemo(() => {
    if (selectedSegment === "none" || !segmentTrendData?.data) return [];
    const values = new Set<string>();
    segmentTrendData.data.forEach((point) => {
      if (point.dimensionValue) {
        values.add(String(point.dimensionValue));
      }
    });
    return Array.from(values).sort();
  }, [selectedSegment, segmentTrendData]);

  // Initialize selectedSegmentValues when segment changes or when data loads
  useEffect(() => {
    if (selectedSegment !== "none" && availableSegmentValues.length > 0) {
      // If no values are selected, select all by default
      setSelectedSegmentValues((prev) => {
        if (prev.size === 0) {
          const allValues = new Set(availableSegmentValues);
          setTempSegmentValues(allValues);
          return allValues;
        } else {
          // Remove values that no longer exist in availableSegmentValues
          const newSet = new Set<string>();
          prev.forEach((val) => {
            if (availableSegmentValues.includes(val)) {
              newSet.add(val);
            }
          });
          // If all were removed, select all available
          if (newSet.size === 0) {
            const allValues = new Set(availableSegmentValues);
            setTempSegmentValues(allValues);
            return allValues;
          } else {
            setTempSegmentValues(new Set(newSet));
            return newSet;
          }
        }
      });
    } else if (selectedSegment === "none") {
      setSelectedSegmentValues(new Set());
      setTempSegmentValues(new Set());
    }
  }, [selectedSegment, availableSegmentValues]);

  // Generate separate chart data for each selected segment value
  const chartDataBySegmentValue = useMemo(() => {
    if (selectedSegment === "none" || selectedSegmentValues.size === 0) {
      return [];
    }

    return metricsByYAxis.map((group) => {
      // Generate data for each metric in this group
      const metricsData = group.metrics.map((metric) => ({
        metric,
        data: generateChartDataForMetric(metric),
      }));

      // For each selected segment value, create a separate dataset
      const segmentValueData = Array.from(selectedSegmentValues).map(
        (segmentValue) => {
          // Combine all metrics for this segment value
          const combinedData = new Map<
            string,
            Record<string, number | string>
          >();

          metricsData.forEach(({ metric, data }) => {
            const metricLabel = getMetricLabel(metric);
            data.forEach((point) => {
              const pointRecord = point as Record<string, number | string>;
              // Check if this point has data for the current segment value
              if (pointRecord[segmentValue] !== undefined) {
                const dateKey =
                  typeof pointRecord.date === "string"
                    ? pointRecord.date
                    : String(pointRecord.date);
                const existing = combinedData.get(dateKey) || { date: dateKey };
                existing[metricLabel] = pointRecord[segmentValue] as number;
                combinedData.set(dateKey, existing);
              }
            });
          });

          return {
            segmentValue,
            data: Array.from(combinedData.values()).sort(
              (a, b) =>
                new Date(a.date as string).getTime() -
                new Date(b.date as string).getTime()
            ),
          };
        }
      );

      return {
        type: group.type,
        metrics: group.metrics,
        segmentValueData,
      };
    });
  }, [
    selectedSegment,
    selectedSegmentValues,
    metricsByYAxis,
    generateChartDataForMetric,
    getMetricLabel,
  ]);

  // Fetch trend data for dimensional breakdown chart
  const { refetch: refetchTrend } = useTrendData(
    trendDimension,
    trendGranularity,
    filters
  );
  const {
    data: groupedData,
    isLoading: groupedLoading,
    refetch: refetchGrouped,
  } = useGroupedMetrics(groupBy, filters);

  const handleRefresh = () => {
    // Refetch all data without reloading the page
    refetchExec();
    refetchComparison();
    refetchTimeSeries();
    refetchTrend();
    refetchGrouped();
  };

  const handleClearFilters = () => {
    setSelectedCity("__all__");
    setSelectedState("__all__");
    setSelectedMerchant("__all__");
    setSelectedBapMerchant("__all__");
    setSelectedBppMerchant("__all__");
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
            <Button onClick={handleRefresh} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <RefreshCw className="h-4 w-4" />
            </Button>
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
          </div>
        </div>

        {/* KPI Cards */}
        <KPIHeader
          loading={execLoading || timeSeriesLoading}
          stats={useMemo(() => {
            // First line: Core metrics
            const firstLineStats = [
              {
                label:
                  selectedVehicleCategory !== "__all__" &&
                    selectedVehicleCategory !== "All"
                    ? "Total Search Tries"
                    : "Total Searches",
                value: formatNumber(
                  selectedVehicleCategory !== "__all__" &&
                    selectedVehicleCategory !== "All"
                    ? executiveData?.totals?.searchTries ??
                    executiveData?.totals?.searches ??
                    0
                    : executiveData?.totals?.searches || 0
                ),
                icon: <Search className="h-5 w-5" />,
                change: comparisonData?.change?.searches?.percent,
                trendData: getTrendData("searches"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Total Bookings",
                value: formatNumber(executiveData?.totals?.bookings || 0),
                icon: <ShoppingCart className="h-5 w-5" />,
                change: comparisonData?.change?.bookings?.percent,
                trendData: getTrendData("bookings"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Completed Rides",
                value: formatNumber(executiveData?.totals?.completedRides || 0),
                icon: <CheckCircle className="h-5 w-5" />,
                change: comparisonData?.change?.completedRides?.percent,
                trendData: getTrendData("completedRides"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Total Earnings",
                value: formatCurrency(executiveData?.totals?.earnings || 0),
                icon: <IndianRupee className="h-5 w-5" />,
                change: comparisonData?.change?.earnings?.percent,
                trendData: getTrendData("earnings"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
              {
                label: "Overall Conversion",
                value: formatPercent(
                  executiveData?.totals?.conversionRate || 0
                ),
                icon: <Percent className="h-5 w-5" />,
                change: undefined, // Conversion rate change not in comparison
                trendData: getTrendData("conversion"),
                dateRange: { from: dateFrom, to: dateTo },
                comparisonDateRange: comparisonPeriods
                  ? {
                    from: comparisonPeriods.previousFrom,
                    to: comparisonPeriods.previousTo,
                  }
                  : undefined,
              },
            ];

            // Return only first line stats (core metrics)
            return firstLineStats;
          }, [
            selectedVehicleCategory,
            executiveData,
            comparisonData,
            comparisonPeriods,
            getTrendData,
            dateFrom,
            dateTo,
          ])}
        />

        {/* Conversion Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Conversion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rider Fare Acceptance Card */}
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
                          if (!rfaTrendData || rfaTrendData.length === 0)
                            return null;
                          const gradientId = "gradient-rfa";
                          return (
                            <div className="flex-1 h-16 min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={rfaTrendData}
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
                                      if (active && payload && payload.length) {
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
                                              {formatPercent(value)}
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
                          const dqaTrendData = getTrendData
                            ? getTrendData("driverQuoteAcceptance")
                            : undefined;
                          if (!dqaTrendData || dqaTrendData.length === 0)
                            return null;
                          const gradientId = "gradient-dqa";
                          return (
                            <div className="flex-1 h-16 min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={dqaTrendData}
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
                                      if (active && payload && payload.length) {
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
                                              {formatPercent(value)}
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

            {/* Cancellation Card */}
            <Collapsible
              open={cancellationExpanded}
              onOpenChange={setCancellationExpanded}
            >
              <Card>
                <CollapsibleTrigger className="w-full hover:bg-muted/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CancelIcon className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-base">
                          Cancellation
                        </CardTitle>
                      </div>
                      {cancellationExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {/* Left side: Metric and change */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <div className="text-2xl font-bold">
                          {formatNumber(
                            executiveData?.totals?.cancelledRides || 0
                          )}
                        </div>
                        {comparisonData?.change?.cancelledRides && (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "flex items-center gap-1 mt-1 text-xs cursor-help",
                                    comparisonData.change.cancelledRides
                                      .percent > 0
                                      ? "text-red-600"
                                      : comparisonData.change.cancelledRides
                                        .percent < 0
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                  )}
                                >
                                  {comparisonData.change.cancelledRides
                                    .percent > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : comparisonData.change.cancelledRides
                                    .percent < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  <span>
                                    {Math.abs(
                                      comparisonData.change.cancelledRides
                                        .percent
                                    ).toFixed(2)}
                                    %
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                <div className="space-y-1">
                                  <p className="text-xs">
                                    {comparisonData.change.cancelledRides
                                      .percent > 0
                                      ? "Increased by"
                                      : comparisonData.change.cancelledRides
                                        .percent < 0
                                        ? "Decreased by"
                                        : "No change"}
                                  </p>
                                  <p className="text-sm font-bold">
                                    {Math.abs(
                                      comparisonData.change.cancelledRides
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
                      {timeSeriesData?.data &&
                        (() => {
                          const cancelledTrendData = getTrendData
                            ? getTrendData("cancelledRides")
                            : undefined;
                          if (
                            !cancelledTrendData ||
                            cancelledTrendData.length === 0
                          )
                            return null;
                          const gradientId = "gradient-cancelled";
                          return (
                            <div className="flex-1 h-16 min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={cancelledTrendData}
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
                                        stopColor="#ef4444"
                                        stopOpacity={0.3}
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#ef4444"
                                        stopOpacity={0}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fill={`url(#${gradientId})`}
                                    dot={false}
                                    activeDot={{ r: 3, fill: "#ef4444" }}
                                  />
                                  <Tooltip
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
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
                              User Cancellations
                            </p>
                            <p className="text-lg font-bold mb-1">
                              {formatNumber(
                                executiveData?.totals?.userCancellations || 0
                              )}
                              <span className="text-xs text-muted-foreground ml-1 font-normal">
                                (
                                {formatPercent(
                                  executiveData?.totals?.userCancellationRate ||
                                  0
                                )}
                                )
                              </span>
                            </p>
                            {comparisonData?.change?.userCancellations && (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 text-xs cursor-help",
                                        comparisonData.change.userCancellations
                                          .percent > 0
                                          ? "text-red-600"
                                          : comparisonData.change
                                            .userCancellations.percent < 0
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                      )}
                                    >
                                      {comparisonData.change.userCancellations
                                        .percent > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : comparisonData.change
                                        .userCancellations.percent < 0 ? (
                                        <TrendingDown className="h-3 w-3" />
                                      ) : null}
                                      <span>
                                        {Math.abs(
                                          comparisonData.change
                                            .userCancellations.percent
                                        ).toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                    <div className="space-y-1">
                                      <p className="text-xs">
                                        {comparisonData.change.userCancellations
                                          .percent > 0
                                          ? "Increased by"
                                          : comparisonData.change
                                            .userCancellations.percent < 0
                                            ? "Decreased by"
                                            : "No change"}
                                      </p>
                                      <p className="text-sm font-bold">
                                        {Math.abs(
                                          comparisonData.change
                                            .userCancellations.percent
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
                            const userCancellationsTrend = getTrendData
                              ? getTrendData("userCancellations")
                              : undefined;
                            if (
                              !userCancellationsTrend ||
                              userCancellationsTrend.length === 0
                            )
                              return null;
                            const gradientId = "gradient-user-cancellations";
                            return (
                              <div className="flex-1 h-16 min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={userCancellationsTrend}
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
                                          stopColor="#ef4444"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#ef4444"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#ef4444"
                                      strokeWidth={2}
                                      fill={`url(#${gradientId})`}
                                      dot={false}
                                      activeDot={{ r: 3, fill: "#ef4444" }}
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
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {/* Left side: Metric and change */}
                          <div className="flex-shrink-0 min-w-[120px]">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Driver Cancellations
                            </p>
                            <p className="text-lg font-bold mb-1">
                              {formatNumber(
                                executiveData?.totals?.driverCancellations || 0
                              )}
                              <span className="text-xs text-muted-foreground ml-1 font-normal">
                                (
                                {formatPercent(
                                  executiveData?.totals
                                    ?.driverCancellationRate || 0
                                )}
                                )
                              </span>
                            </p>
                            {comparisonData?.change?.driverCancellations && (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center gap-1 text-xs cursor-help",
                                        comparisonData.change
                                          .driverCancellations.percent > 0
                                          ? "text-red-600"
                                          : comparisonData.change
                                            .driverCancellations.percent < 0
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                      )}
                                    >
                                      {comparisonData.change.driverCancellations
                                        .percent > 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : comparisonData.change
                                        .driverCancellations.percent < 0 ? (
                                        <TrendingDown className="h-3 w-3" />
                                      ) : null}
                                      <span>
                                        {Math.abs(
                                          comparisonData.change
                                            .driverCancellations.percent
                                        ).toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                    <div className="space-y-1">
                                      <p className="text-xs">
                                        {comparisonData.change
                                          .driverCancellations.percent > 0
                                          ? "Increased by"
                                          : comparisonData.change
                                            .driverCancellations.percent < 0
                                            ? "Decreased by"
                                            : "No change"}
                                      </p>
                                      <p className="text-sm font-bold">
                                        {Math.abs(
                                          comparisonData.change
                                            .driverCancellations.percent
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
                            const driverCancellationsTrend = getTrendData
                              ? getTrendData("driverCancellations")
                              : undefined;
                            if (
                              !driverCancellationsTrend ||
                              driverCancellationsTrend.length === 0
                            )
                              return null;
                            const gradientId = "gradient-driver-cancellations";
                            return (
                              <div className="flex-1 h-16 min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={driverCancellationsTrend}
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
                                          stopColor="#ef4444"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#ef4444"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#ef4444"
                                      strokeWidth={2}
                                      fill={`url(#${gradientId})`}
                                      dot={false}
                                      activeDot={{ r: 3, fill: "#ef4444" }}
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
              metricsByYAxis.map((group, groupIndex) => (
                <Card key={groupIndex} className="overflow-hidden shadow-none border-zinc-200 dark:border-zinc-800">
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
                                }
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

                      {/* Add Segments Sheet */}
                      <Sheet open={isAddSegmentSheetOpen} onOpenChange={setIsAddSegmentSheetOpen}>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary hover:text-primary transition-all ml-1"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 flex flex-col w-[400px]">
                          <SheetHeader className="p-6 border-b">
                            <SheetTitle>Add Segments</SheetTitle>
                            <p className="text-xs text-muted-foreground">You can choose up to a maximum of 3 segments</p>
                          </SheetHeader>
                          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search Segments"
                                className="pl-9 h-10 rounded-lg"
                                value={segmentSearchQuery}
                                onChange={(e) => setSegmentSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              {trendDimensionsList
                                .filter(d =>
                                  d.value !== "none" &&
                                  !visibleSegments.includes(d.value) &&
                                  d.label.toLowerCase().includes(segmentSearchQuery.toLowerCase())
                                )
                                .map((dim) => (
                                  <div
                                    key={dim.value}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer group transition-colors"
                                    onClick={() => {
                                      if (visibleSegments.length < 7) { // 4 pinned + 3 extra
                                        setVisibleSegments(prev => [...prev, dim.value as Dimension]);
                                        setIsAddSegmentSheetOpen(false);
                                      }
                                    }}
                                  >
                                    <div className="h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-primary transition-colors">
                                      <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                    </div>
                                    <span className="text-sm font-medium">{dim.label}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div className="p-6 border-t bg-zinc-50/50 dark:bg-zinc-900/50">
                            <Button
                              className="w-full h-11 rounded-xl font-bold shadow-lg"
                              onClick={() => setIsAddSegmentSheetOpen(false)}
                            >
                              Add Segments
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => setIsGridView(true)}
                        title="Show All Dimensions"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-0 relative bg-white dark:bg-zinc-950">
                    {/* Internal Chart Controls (Overlay) */}
                    <div className="absolute top-6 left-6 right-6 z-10 flex flex-col gap-3 pointer-events-none">
                      <div className="flex items-center justify-between">
                        {/* Left: Granularity */}
                        <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] pointer-events-auto">
                          <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-0.5">
                            <Button
                              variant={trendGranularity === "day" ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-[11px] font-medium transition-all duration-200",
                                trendGranularity === "day" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                              )}
                              onClick={() => setTrendGranularity("day")}
                            >
                              Daily
                            </Button>
                            <Button
                              variant={trendGranularity === "hour" ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-[11px] font-medium transition-all duration-200",
                                trendGranularity === "hour" ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                              )}
                              onClick={() => setTrendGranularity("hour")}
                            >
                              Hourly
                            </Button>
                          </div>

                          <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                          <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-0.5">
                            <Button
                              variant={!isCumulative ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-[11px] font-medium transition-all duration-200",
                                !isCumulative ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                              )}
                              onClick={() => setIsCumulative(false)}
                            >
                              Period
                            </Button>
                            <Button
                              variant={isCumulative ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-[11px] font-medium transition-all duration-200",
                                isCumulative ? "bg-white dark:bg-zinc-700 shadow-sm" : "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                              )}
                              onClick={() => setIsCumulative(true)}
                            >
                              Cumulative
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-0.5 text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={handleRefresh}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Center: Metric Selector */}
                        <div className="pointer-events-auto flex items-center gap-3">
                          <Select
                            onValueChange={(v) => {
                              const metric = v as TrendMetric;
                              if (!selectedTrendMetrics.includes(metric)) {
                                setSelectedTrendMetrics([
                                  ...selectedTrendMetrics,
                                  metric,
                                ]);
                              }
                            }}
                          >
                            <SelectTrigger className="w-48 h-9 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-xs font-medium focus:ring-1 focus:ring-primary/20">
                              <SelectValue placeholder="Add Metric" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="conversion" className="text-xs">Conversion Rate</SelectItem>
                              <SelectItem value="driverQuoteAcceptance" className="text-xs">Driver Quote Acceptance</SelectItem>
                              <SelectItem value="riderFareAcceptance" className="text-xs">Rider Fare Acceptance</SelectItem>
                              <SelectItem value="cancellationRate" className="text-xs">Cancellation Rate</SelectItem>
                              <SelectItem value="searches" className="text-xs">Searches</SelectItem>
                              <SelectItem value="bookings" className="text-xs">Bookings</SelectItem>
                              <SelectItem value="completedRides" className="text-xs">Completed Rides</SelectItem>
                              <SelectItem value="earnings" className="text-xs">Earnings</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Segment Value Selector (Only if segment is selected) */}
                          {selectedSegment !== "none" && (
                            <Popover
                              open={isSegmentPopoverOpen}
                              onOpenChange={(open) => {
                                setIsSegmentPopoverOpen(open);
                                if (open) setTempSegmentValues(new Set(selectedSegmentValues));
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 min-w-[140px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-xs font-medium"
                                >
                                  {selectedSegmentValues.size === 0 ? "Select Values" : `${selectedSegmentValues.size} Values`}
                                  <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl" align="end">
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
                                    {availableSegmentValues.map((value) => {
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
                                      setIsSegmentPopoverOpen(false);
                                    }}>Apply Selections</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Right Gap */}
                        <div />
                      </div>

                      {/* Selected Metric Tags */}
                      <div className="flex flex-wrap gap-2 pointer-events-auto">
                        {selectedTrendMetrics.map((metric) => (
                          <div
                            key={metric}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg shadow-sm text-[10px] font-medium transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 group"
                          >
                            <span className="text-foreground">{getMetricLabel(metric)}</span>
                            <button
                              onClick={() => {
                                if (selectedTrendMetrics.length > 1) {
                                  setSelectedTrendMetrics(selectedTrendMetrics.filter(m => m !== metric));
                                }
                              }}
                              className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-32 pb-8 px-8">
                      {(() => {
                        const isLoading =
                          trendTimeSeriesLoading ||
                          (selectedSegment !== "none" && segmentTrendLoading);

                        if (isLoading) {
                          return <Skeleton className="h-[650px] w-full" />;
                        }

                        // If segment is selected and multiple metrics are present, show separate graphs per segment value
                        if (
                          selectedSegment !== "none" &&
                          selectedSegmentValues.size > 0 &&
                          group.metrics.length > 1
                        ) {
                          const segmentGroupData =
                            chartDataBySegmentValue[groupIndex];
                          if (!segmentGroupData) return null;

                          return (
                            <div className="space-y-6">
                              {segmentGroupData.segmentValueData.map(
                                ({ segmentValue, data }) => {
                                  if (!data || data.length === 0) return null;

                                  return (
                                    <div key={segmentValue} className="space-y-2">
                                      <h3 className="text-base font-semibold">
                                        {trendDimensionsList.find(
                                          (d) => d.value === selectedSegment
                                        )?.label || "Segment"}
                                        : {segmentValue || "(empty)"} -{" "}
                                        {group.metrics
                                          .map((m) => getMetricLabel(m))
                                          .join(", ")}
                                      </h3>
                                      <div className="h-[550px]">
                                        <ResponsiveContainer
                                          width="100%"
                                          height="100%"
                                        >
                                          <LineChart
                                            data={data}
                                            margin={{
                                              top: 5,
                                              right: 30,
                                              left: 20,
                                              bottom: 60,
                                            }}
                                          >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                              dataKey="date"
                                              tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return trendGranularity === "hour"
                                                  ? format(date, "d MMM H:mm")
                                                  : format(date, "MMM d");
                                              }}
                                              fontSize={10}
                                              angle={-45}
                                              textAnchor="end"
                                              height={80}
                                              interval="preserveStartEnd"
                                            />
                                            <YAxis
                                              fontSize={10}
                                              domain={[0, "auto"]}
                                              tickFormatter={(value) => {
                                                if (group.type === "percentage") {
                                                  return `${value.toFixed(0)}%`;
                                                }
                                                // For large numbers, format them
                                                if (value >= 1000000)
                                                  return `${(
                                                    value / 1000000
                                                  ).toFixed(1)}M`;
                                                if (value >= 1000)
                                                  return `${(
                                                    value / 1000
                                                  ).toFixed(1)}K`;
                                                return value.toLocaleString();
                                              }}
                                            />
                                            <Tooltip
                                              content={({
                                                active,
                                                payload,
                                                label,
                                              }) => {
                                                if (
                                                  active &&
                                                  payload &&
                                                  payload.length
                                                ) {
                                                  const dateStr =
                                                    label ||
                                                    payload[0].payload?.date ||
                                                    "";
                                                  const formattedDate =
                                                    formatTooltipDate(dateStr);
                                                  return (
                                                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-700">
                                                      <p className="text-gray-300 mb-2 font-medium">
                                                        {formattedDate}
                                                      </p>
                                                      {payload.map(
                                                        (entry, index) => {
                                                          const value =
                                                            entry.value as number;
                                                          const isPercentage =
                                                            group.type ===
                                                            "percentage";
                                                          const formattedValue =
                                                            isPercentage
                                                              ? `${value.toFixed(
                                                                2
                                                              )}%`
                                                              : value >= 1000000
                                                                ? `${(
                                                                  value / 1000000
                                                                ).toFixed(2)}M`
                                                                : value >= 1000
                                                                  ? `${(
                                                                    value / 1000
                                                                  ).toFixed(2)}K`
                                                                  : value.toLocaleString();
                                                          return (
                                                            <p
                                                              key={index}
                                                              className="mb-1"
                                                              style={{
                                                                color:
                                                                  entry.color,
                                                              }}
                                                            >
                                                              <span className="font-semibold">
                                                                {entry.name}:
                                                              </span>{" "}
                                                              {formattedValue}
                                                            </p>
                                                          );
                                                        }
                                                      )}
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Legend
                                              wrapperStyle={{
                                                paddingTop: "20px",
                                              }}
                                              formatter={(value: string) => {
                                                if (data.length > 0) {
                                                  const values = data
                                                    .map((point) => {
                                                      const val = (
                                                        point as Record<
                                                          string,
                                                          number | string
                                                        >
                                                      )[value];
                                                      return typeof val ===
                                                        "number"
                                                        ? val
                                                        : 0;
                                                    })
                                                    .filter(
                                                      (v) =>
                                                        typeof v === "number" &&
                                                        !isNaN(v)
                                                    );
                                                  if (values.length > 0) {
                                                    const avg =
                                                      values.reduce(
                                                        (sum, v) => sum + v,
                                                        0
                                                      ) / values.length;
                                                    const isPercentage =
                                                      group.type === "percentage";
                                                    const formattedAvg =
                                                      isPercentage
                                                        ? `${avg.toFixed(2)}%`
                                                        : avg >= 1000000
                                                          ? `${(
                                                            avg / 1000000
                                                          ).toFixed(2)}M`
                                                          : avg >= 1000
                                                            ? `${(avg / 1000).toFixed(
                                                              2
                                                            )}K`
                                                            : avg.toFixed(0);
                                                    return `${value} (${formattedAvg})`;
                                                  }
                                                }
                                                return value;
                                              }}
                                            />
                                            {group.metrics.map(
                                              (metric, index) => (
                                                <Line
                                                  key={metric}
                                                  type="monotone"
                                                  dataKey={getMetricLabel(metric)}
                                                  name={getMetricLabel(metric)}
                                                  stroke={
                                                    COLORS[index % COLORS.length]
                                                  }
                                                  strokeWidth={3}
                                                  dot={false}
                                                  activeDot={{ r: 6 }}
                                                />
                                              )
                                            )}
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          );
                        }

                        // Default rendering (no segment or single metric)
                        const groupData = chartDataByGroup[groupIndex];
                        if (!groupData) return null;

                        if (!groupData.data || groupData.data.length === 0) {
                          return (
                            <div className="h-[650px] flex items-center justify-center text-muted-foreground">
                              No data available for the selected filters
                            </div>
                          );
                        }

                        return (
                          <div className="h-[650px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={groupData.data}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 60,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return trendGranularity === "hour"
                                      ? format(date, "d MMM H:mm")
                                      : format(date, "MMM d");
                                  }}
                                  fontSize={10}
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  interval="preserveStartEnd"
                                />
                                <YAxis
                                  fontSize={10}
                                  domain={[0, "auto"]}
                                  tickFormatter={(value) => {
                                    if (group.type === "percentage") {
                                      return `${value.toFixed(0)}%`;
                                    }
                                    if (value >= 1000000)
                                      return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000)
                                      return `${(value / 1000).toFixed(1)}K`;
                                    return value.toLocaleString();
                                  }}
                                />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const dateStr =
                                        label || payload[0].payload?.date || "";
                                      const formattedDate =
                                        formatTooltipDate(dateStr);
                                      return (
                                        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-700">
                                          <p className="text-gray-300 mb-2 font-medium">
                                            {formattedDate}
                                          </p>
                                          {payload.map((entry, index) => {
                                            const value = entry.value as number;
                                            const isPercentage =
                                              group.type === "percentage";
                                            const formattedValue = isPercentage
                                              ? `${value.toFixed(2)}%`
                                              : value >= 1000000
                                                ? `${(value / 1000000).toFixed(2)}M`
                                                : value >= 1000
                                                  ? `${(value / 1000).toFixed(2)}K`
                                                  : value.toLocaleString();
                                            return (
                                              <p
                                                key={index}
                                                className="mb-1"
                                                style={{ color: entry.color }}
                                              >
                                                <span className="font-semibold">
                                                  {entry.name}:
                                                </span>{" "}
                                                {formattedValue}
                                              </p>
                                            );
                                          })}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend
                                  wrapperStyle={{ paddingTop: "20px" }}
                                  formatter={(value: string) => {
                                    if (groupData.data.length > 0) {
                                      const values = groupData.data
                                        .map((point) => {
                                          const val = (
                                            point as Record<
                                              string,
                                              number | string
                                            >
                                          )[value];
                                          return typeof val === "number"
                                            ? val
                                            : 0;
                                        })
                                        .filter(
                                          (v) =>
                                            typeof v === "number" && !isNaN(v)
                                        );
                                      if (values.length > 0) {
                                        const avg =
                                          values.reduce((sum, v) => sum + v, 0) /
                                          values.length;
                                        const isPercentage =
                                          group.type === "percentage";
                                        const formattedAvg = isPercentage
                                          ? `${avg.toFixed(2)}%`
                                          : avg >= 1000000
                                            ? `${(avg / 1000000).toFixed(2)}M`
                                            : avg >= 1000
                                              ? `${(avg / 1000).toFixed(2)}K`
                                              : avg.toFixed(0);
                                        return `${value} (${formattedAvg})`;
                                      }
                                    }
                                    return value;
                                  }}
                                />
                                {selectedSegment === "none"
                                  ? group.metrics.map((metric, index) => (
                                    <Line
                                      key={metric}
                                      type="monotone"
                                      dataKey={getMetricLabel(metric)}
                                      name={getMetricLabel(metric)}
                                      stroke={COLORS[index % COLORS.length]}
                                      strokeWidth={3}
                                      dot={false}
                                      activeDot={{ r: 6 }}
                                    />
                                  ))
                                  : (() => {
                                    const firstMetricData =
                                      groupData.metricsData?.[0]?.data;
                                    if (
                                      !firstMetricData ||
                                      firstMetricData.length === 0
                                    )
                                      return null;
                                    const firstPoint = firstMetricData[0];
                                    if (!firstPoint) return null;
                                    const segmentKeys = Object.keys(
                                      firstPoint
                                    ).filter(
                                      (k) =>
                                        k !== "date" &&
                                        typeof (
                                          firstPoint as Record<
                                            string,
                                            number | string
                                          >
                                        )[k] === "number" &&
                                        // Also filter by selectedSegmentValues if applicable
                                        (selectedSegmentValues.size === 0 || selectedSegmentValues.has(k))
                                    );
                                    return segmentKeys.map((key, index) => (
                                      <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={key}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                      />
                                    ));
                                  })()}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Grouped Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Aggregate Breakdown</CardTitle>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as typeof groupBy)}
              >
                <SelectTrigger className="w-40 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="merchant_id">Merchant</SelectItem>
                  <SelectItem value="flow_type">Flow Type</SelectItem>
                  <SelectItem value="trip_tag">Trip Tag</SelectItem>
                  <SelectItem value="service_tier">Service Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {groupedLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : groupedData?.data && groupedData.data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={groupedData.data.slice(0, 10)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis
                        dataKey="dimension"
                        type="category"
                        width={80}
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: number) => formatNumber(value)}
                      />
                      <Bar
                        dataKey="bookings"
                        name="Bookings"
                        radius={[0, 4, 4, 0]}
                      >
                        {groupedData.data.slice(0, 10).map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {groupBy.replace("_", " ").toUpperCase()}
                        </TableHead>
                        <TableHead className="text-right">Searches</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Conv. Rate</TableHead>
                        {/* Show additional metrics if available */}
                        {groupedData.data.some(
                          (r) => r.riderFareAcceptanceRate !== undefined
                        ) && (
                            <TableHead className="text-right">
                              Rider Fare Acceptance
                            </TableHead>
                          )}
                        {groupedData.data.some(
                          (r) => r.driverQuoteAcceptanceRate !== undefined
                        ) && (
                            <TableHead className="text-right">
                              Driver Quote Acceptance
                            </TableHead>
                          )}
                        {groupedData.data.some(
                          (r) => r.driverAcceptanceRate !== undefined
                        ) && (
                            <TableHead className="text-right">
                              Driver Acc.
                            </TableHead>
                          )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedData.data.map((row) => (
                        <TableRow key={row.dimension}>
                          <TableCell
                            className="font-medium text-xs truncate max-w-[150px]"
                            title={row.dimension}
                          >
                            {row.dimension || "(empty)"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(row.searches)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(row.bookings)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(row.completedRides)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercent(row.conversionRate)}
                          </TableCell>
                          {groupedData.data.some(
                            (r) => r.riderFareAcceptanceRate !== undefined
                          ) && (
                              <TableCell className="text-right">
                                {row.riderFareAcceptanceRate !== undefined
                                  ? formatPercent(row.riderFareAcceptanceRate)
                                  : "-"}
                              </TableCell>
                            )}
                          {groupedData.data.some(
                            (r) => r.driverQuoteAcceptanceRate !== undefined
                          ) && (
                              <TableCell className="text-right">
                                {row.driverQuoteAcceptanceRate !== undefined
                                  ? formatPercent(row.driverQuoteAcceptanceRate)
                                  : "-"}
                              </TableCell>
                            )}
                          {groupedData.data.some(
                            (r) => r.driverAcceptanceRate !== undefined
                          ) && (
                              <TableCell className="text-right">
                                {row.driverAcceptanceRate !== undefined
                                  ? formatPercent(row.driverAcceptanceRate)
                                  : "-"}
                              </TableCell>
                            )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No grouped data available
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </Page >
  );
}
