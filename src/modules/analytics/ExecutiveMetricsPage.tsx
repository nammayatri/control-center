import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Page, PageHeader, PageContent } from "../../components/layout/Page";
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
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
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
  XCircle,
  LayoutGrid,
  Maximize2,
  Percent,
  MessageSquare,
  XCircle as CancelIcon,
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
  Cell,
  Legend,
} from "recharts";
import { SmallTrendChart } from "./SmallTrendChart";

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

// Transform flat dimensional data to wide format for Recharts
// Input: [{ timestamp: 'T1', dimensionValue: 'A', conversion: 0.1 }, { timestamp: 'T1', dimensionValue: 'B', conversion: 0.2 }]
// Output: [{ timestamp: 'T1', A: 0.1, B: 0.2 }]
function transformTrendData(
  data:
    | Array<{ timestamp: string; dimensionValue: string; conversion: number }>
    | undefined
) {
  if (!data) return [];

  // Group by timestamp
  const grouped = new Map<string, Record<string, number | string>>();

  data.forEach((point) => {
    const existing = grouped.get(point.timestamp) || {
      timestamp: point.timestamp,
    };
    // Backend already returns conversion as percentage (0-100), so use it directly
    existing[point.dimensionValue] = point.conversion;
    grouped.set(point.timestamp, existing);
  });

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

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
  const [selectedMerchant, setSelectedMerchant] = useState<string>("__all__");
  const [selectedFlowType, setSelectedFlowType] = useState<string>("__all__");
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<
    "Bike" | "Auto" | "Cab" | "Others" | "All" | "BookAny" | "__all__"
  >("__all__");
  const [selectedVehicleSubCategory, setSelectedVehicleSubCategory] =
    useState<string>("__all__");
  const [groupBy, setGroupBy] = useState<
    "city" | "merchant_id" | "flow_type" | "trip_tag" | "service_tier"
  >("city");

  // Trend controls
  const [trendDimension, setTrendDimension] = useState<Dimension | "none">(
    "none"
  );
  const [trendGranularity, setTrendGranularity] = useState<Granularity>("day");
  const [isGridView, setIsGridView] = useState(false);

  // Build filters object
  const filters: MetricsFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      city: selectedCity !== "__all__" ? [selectedCity] : undefined,
      state: selectedState !== "__all__" ? [selectedState] : undefined,
      merchantId:
        selectedMerchant !== "__all__" ? [selectedMerchant] : undefined,
      flowType: selectedFlowType !== "__all__" ? [selectedFlowType] : undefined,
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
      selectedFlowType,
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
        selectedMerchant !== "__all__" ? [selectedMerchant] : undefined,
      flowType: selectedFlowType !== "__all__" ? [selectedFlowType] : undefined,
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
      selectedFlowType,
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

  // Fetch trend data for dimensional breakdown chart
  const {
    data: trendData,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useTrendData(trendDimension, trendGranularity, filters);
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
    setSelectedFlowType("__all__");
    setSelectedVehicleCategory("__all__");
    setSelectedVehicleSubCategory("__all__");
    setDateFrom(format(startOfDay(new Date()), "yyyy-MM-dd HH:mm:ss"));
    setDateTo(format(endOfDay(new Date()), "yyyy-MM-dd HH:mm:ss"));
  };

  // Prepare trend chart data
  const chartData = useMemo(() => {
    return transformTrendData(trendData?.data);
  }, [trendData]);

  const trendDimensionsList: { value: Dimension | "none"; label: string }[] = [
    { value: "none", label: "Overall (No Breakdown)" },
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

  // Get unique keys for multi-line chart
  const trendKeys = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    // Available keys are all keys in the first data point excluding timestamp
    const firstPoint = chartData[0];
    if (!firstPoint) return [];
    const allKeys = Object.keys(firstPoint).filter((k) => k !== "timestamp");

    // Filter out keys that have 0 total value or are always 0
    return allKeys.filter((key) => {
      const hasData = chartData.some((point) => {
        const val = point?.[key];
        return typeof val === "number" && val > 0;
      });
      return hasData;
    });
  }, [chartData]);

  return (
    <Page>
      <PageHeader
        title="Executive Metrics"
        description="Business performance metrics from Master Conversion"
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "Executive Metrics" },
        ]}
        actions={
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <PageContent>
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <Label className="text-xs mb-2 block">Date Range</Label>
                <DateRangePicker
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onChange={(from, to) => {
                    setDateFrom(from);
                    setDateTo(to);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Select
                  value={selectedState}
                  onValueChange={(value) => {
                    setSelectedState(value);
                    // Reset city if it's not in the newly selected state
                    if (value !== "__all__" && selectedCity !== "__all__") {
                      const citiesInState =
                        filterOptions?.cityStateMap?.[value] || [];
                      if (!citiesInState.includes(selectedCity)) {
                        setSelectedCity("__all__");
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All States</SelectItem>
                    {filterOptions?.states?.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Cities</SelectItem>
                    {(() => {
                      // Filter cities based on selected state
                      let citiesToShow = filterOptions?.cities || [];
                      if (
                        selectedState !== "__all__" &&
                        filterOptions?.cityStateMap?.[selectedState]
                      ) {
                        citiesToShow =
                          filterOptions.cityStateMap[selectedState];
                        // Sort cities with priority order
                        const cityPriority = [
                          "Bangalore",
                          "Kolkata",
                          "Chennai",
                          "Bhubaneshwar",
                          "Kochi",
                        ];
                        citiesToShow = [
                          ...citiesToShow
                            .filter((c) => cityPriority.includes(c))
                            .sort((a, b) => {
                              const indexA = cityPriority.indexOf(a);
                              const indexB = cityPriority.indexOf(b);
                              return indexA - indexB;
                            }),
                          ...citiesToShow
                            .filter((c) => !cityPriority.includes(c))
                            .sort(),
                        ];
                      }
                      return citiesToShow.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Merchant</Label>
                <Select
                  value={selectedMerchant}
                  onValueChange={setSelectedMerchant}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Merchants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Merchants</SelectItem>
                    {filterOptions?.merchants?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Vehicle Category</Label>
                <Select
                  value={selectedVehicleCategory}
                  onValueChange={(value) => {
                    setSelectedVehicleCategory(
                      value as typeof selectedVehicleCategory
                    );
                    setSelectedVehicleSubCategory("__all__");
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Categories</SelectItem>
                    {filterOptions?.vehicleCategories
                      ?.filter((vc) => vc.value !== "All") // Filter out "All" since we have "__all__" for no filter
                      ?.map((vc) => (
                        <SelectItem key={vc.value} value={vc.value}>
                          {vc.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedVehicleCategory !== "__all__" &&
                selectedVehicleCategory !== "All" &&
                selectedVehicleCategory !== "BookAny" && (
                  <div>
                    <Label className="text-xs">Vehicle Sub-Category</Label>
                    <Select
                      value={selectedVehicleSubCategory}
                      onValueChange={setSelectedVehicleSubCategory}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Sub-Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          All Sub-Categories
                        </SelectItem>
                        {filterOptions?.vehicleSubCategories?.[
                          selectedVehicleCategory
                        ]?.map((vsc) => (
                          <SelectItem key={vsc} value={vsc}>
                            {vsc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <KPIHeader
          loading={execLoading || timeSeriesLoading}
          stats={useMemo(() => {
            // Helper to get trend data for a metric
            const getTrendData = (
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
                  value =
                    (point as unknown as Record<string, number>)[metricKey] ||
                    0;
                }
                result.push({
                  timestamp: point.date || "",
                  value: value,
                });
              }
              return result.length > 0 ? result : undefined;
            };

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
              },
              {
                label: "Total Bookings",
                value: formatNumber(executiveData?.totals?.bookings || 0),
                icon: <ShoppingCart className="h-5 w-5" />,
                change: comparisonData?.change?.bookings?.percent,
                trendData: getTrendData("bookings"),
                dateRange: { from: dateFrom, to: dateTo },
              },
              {
                label: "Completed Rides",
                value: formatNumber(executiveData?.totals?.completedRides || 0),
                icon: <CheckCircle className="h-5 w-5" />,
                change: comparisonData?.change?.completedRides?.percent,
                trendData: getTrendData("completedRides"),
                dateRange: { from: dateFrom, to: dateTo },
              },
              {
                label: "Total Earnings",
                value: formatCurrency(executiveData?.totals?.earnings || 0),
                icon: <IndianRupee className="h-5 w-5" />,
                change: comparisonData?.change?.earnings?.percent,
                trendData: getTrendData("earnings"),
                dateRange: { from: dateFrom, to: dateTo },
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
              },
            ];

            // Second line: Quote-related metrics
            const secondLineStats = [
              {
                label: "Quotes Requested",
                value: formatNumber(
                  executiveData?.totals?.quotesRequested || 0
                ),
                icon: <MessageSquare className="h-5 w-5" />,
                change: comparisonData?.change?.quotesRequested?.percent,
                trendData: getTrendData("quotesRequested"),
                dateRange: { from: dateFrom, to: dateTo },
              },
              {
                label: "Quotes Accepted",
                value: formatNumber(executiveData?.totals?.quotesAccepted || 0),
                icon: <CheckCircle className="h-5 w-5" />,
                change: comparisonData?.change?.quotesAccepted?.percent,
                trendData: getTrendData("quotesAccepted"),
                dateRange: { from: dateFrom, to: dateTo },
              },
            ];

            // Add tier-specific metrics to second line
            if (
              executiveData?.tierType === "tier-less" ||
              executiveData?.tierType === "bookany"
            ) {
              if (
                executiveData?.totals?.riderFareAcceptanceRate !== undefined
              ) {
                secondLineStats.push({
                  label: "Rider Fare Acceptance",
                  value: formatPercent(
                    executiveData.totals.riderFareAcceptanceRate
                  ),
                  icon: <Percent className="h-5 w-5" />,
                  change: undefined, // RFA change not in comparison
                  trendData: getTrendData("riderFareAcceptance"),
                  dateRange: { from: dateFrom, to: dateTo },
                });
              }
              if (
                executiveData?.totals?.driverQuoteAcceptanceRate !== undefined
              ) {
                secondLineStats.push({
                  label: "Driver Quote Acceptance",
                  value: formatPercent(
                    executiveData.totals.driverQuoteAcceptanceRate
                  ),
                  icon: <Percent className="h-5 w-5" />,
                  change: undefined, // DQA change not in comparison
                  trendData: getTrendData("driverQuoteAcceptance"),
                  dateRange: { from: dateFrom, to: dateTo },
                });
              }
            } else if (
              executiveData?.tierType === "tier" &&
              executiveData?.totals?.driverAcceptanceRate !== undefined
            ) {
              secondLineStats.push({
                label: "DAR",
                value: formatPercent(executiveData.totals.driverAcceptanceRate),
                icon: <Percent className="h-5 w-5" />,
                change: undefined, // DAR change not in comparison
                trendData: undefined, // DAR is calculated differently
                dateRange: { from: dateFrom, to: dateTo },
              });
            }

            // Third line: Cancellation metrics
            const thirdLineStats = [
              {
                label: "Total Cancellations",
                value: formatNumber(executiveData?.totals?.cancelledRides || 0),
                icon: <CancelIcon className="h-5 w-5" />,
                change: comparisonData?.change?.cancelledRides?.percent,
                trendData: getTrendData("cancelledRides"),
                isNegativeMetric: true, // Increases are bad
                dateRange: { from: dateFrom, to: dateTo },
              },
              {
                label: "User Cancellations",
                value: formatNumber(
                  executiveData?.totals?.userCancellations || 0
                ),
                icon: <CancelIcon className="h-5 w-5" />,
                change: comparisonData?.change?.userCancellations?.percent,
                trendData: getTrendData("userCancellations"),
                isNegativeMetric: true, // Increases are bad
                dateRange: { from: dateFrom, to: dateTo },
              },
              {
                label: "Driver Cancellations",
                value: formatNumber(
                  executiveData?.totals?.driverCancellations || 0
                ),
                icon: <CancelIcon className="h-5 w-5" />,
                change: comparisonData?.change?.driverCancellations?.percent,
                trendData: getTrendData("driverCancellations"),
                isNegativeMetric: true, // Increases are bad
                dateRange: { from: dateFrom, to: dateTo },
              },
            ];

            // Combine all stats
            return [...firstLineStats, ...secondLineStats, ...thirdLineStats];
          }, [
            selectedVehicleCategory,
            executiveData,
            comparisonData,
            timeSeriesData,
            dateFrom,
            dateTo,
          ])}
        />

        {/* Trend Analysis Chart */}
        {isGridView ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dimensional Breakdown</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/30">
                  <Button
                    variant={trendGranularity === "day" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTrendGranularity("day")}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={
                      trendGranularity === "hour" ? "secondary" : "ghost"
                    }
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTrendGranularity("hour")}
                  >
                    Hourly
                  </Button>
                </div>
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
          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  Conversation Trend Analysis
                </CardTitle>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Granularity Toggle */}
                  <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/30">
                    <Button
                      variant={
                        trendGranularity === "day" ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setTrendGranularity("day")}
                    >
                      Daily
                    </Button>
                    <Button
                      variant={
                        trendGranularity === "hour" ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setTrendGranularity("hour")}
                    >
                      Hourly
                    </Button>
                  </div>

                  {/* Dimension Selector */}
                  <Select
                    value={trendDimension}
                    onValueChange={(v) =>
                      setTrendDimension(v as Dimension | "none")
                    }
                  >
                    <SelectTrigger className="w-56 h-9">
                      <SelectValue placeholder="Breakdown By..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trendDimensionsList.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsGridView(true)}
                    title="Show All Dimensions"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Multi-Line Chart for Dimensional Breakdown AND Overall Conversion */}
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return trendGranularity === "hour"
                            ? format(date, "d MMM H:mm")
                            : format(date, "MMM d");
                        }}
                        fontSize={12}
                      />
                      <YAxis unit="%" fontSize={12} domain={[0, "auto"]} />
                      <Tooltip
                        labelFormatter={(value) =>
                          format(new Date(value), "MMM d, yyyy HH:mm")
                        }
                        formatter={(value: number) => [`${value.toFixed(2)}%`]}
                      />
                      <Legend
                        formatter={(value: string) => {
                          // Calculate average percentage for this variant from chartData
                          const values = chartData
                            .map((point) => point[value] as number)
                            .filter((v) => typeof v === "number" && !isNaN(v));
                          const avgValue =
                            values.length > 0
                              ? values.reduce((sum, v) => sum + v, 0) /
                                values.length
                              : 0;
                          return `${value} (${avgValue.toFixed(2)}%)`;
                        }}
                      />
                      {trendKeys.map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key === "Total" ? "Overall Conversion" : key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={key === "Total" ? 3 : 2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available for the selected filters
                </div>
              )}
            </CardContent>
          </Card>
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
    </Page>
  );
}
