import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { KPIHeader } from '../../components/layout/KPIHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    useExecutiveMetrics,
    useComparisonMetrics,
    useTimeSeries,
    useTrendData,
    useFilterOptions,
    useGroupedMetrics,
} from '../../hooks/useExecMetrics';
import type { MetricsFilters, Dimension, Granularity } from '../../services/execMetrics';
import {
    Search,
    ShoppingCart,
    CheckCircle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Filter,
    XCircle,
    LayoutGrid,
    Maximize2,
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    Cell,
    Legend,
} from 'recharts';
import { SmallTrendChart } from './SmallTrendChart';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#d946ef'];

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
    return `${(value * 100).toFixed(1)}%`;
}

// Transform flat dimensional data to wide format for Recharts
// Input: [{ timestamp: 'T1', dimensionValue: 'A', conversion: 0.1 }, { timestamp: 'T1', dimensionValue: 'B', conversion: 0.2 }]
// Output: [{ timestamp: 'T1', A: 0.1, B: 0.2 }]
function transformTrendData(data: any[] | undefined) {
    if (!data) return [];

    // Group by timestamp
    const grouped = new Map<string, any>();

    data.forEach(point => {
        const existing = grouped.get(point.timestamp) || { timestamp: point.timestamp };
        existing[point.dimensionValue] = point.conversion * 100; // Convert to percentage 0-100
        grouped.set(point.timestamp, existing);
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function ExecutiveMetricsPage() {
    // Date filters - default to last 30 days
    const [dateFrom, setDateFrom] = useState(() =>
        format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd')
    );
    const [dateTo, setDateTo] = useState(() =>
        format(endOfDay(new Date()), 'yyyy-MM-dd')
    );

    // Dimension filters
    const [selectedCity, setSelectedCity] = useState<string>('__all__');
    const [selectedMerchant, setSelectedMerchant] = useState<string>('__all__');
    const [selectedFlowType, setSelectedFlowType] = useState<string>('__all__');
    const [selectedServiceTier, setSelectedServiceTier] = useState<string>('__all__');
    const [groupBy, setGroupBy] = useState<'city' | 'merchant_id' | 'flow_type' | 'trip_tag' | 'service_tier'>('city');

    // Trend controls
    const [trendDimension, setTrendDimension] = useState<Dimension | 'none'>('none');
    const [trendGranularity, setTrendGranularity] = useState<Granularity>('day');
    const [isGridView, setIsGridView] = useState(false);

    // Build filters object
    const filters: MetricsFilters = useMemo(() => ({
        dateFrom,
        dateTo,
        city: selectedCity !== '__all__' ? [selectedCity] : undefined,
        merchantId: selectedMerchant !== '__all__' ? [selectedMerchant] : undefined,
        flowType: selectedFlowType !== '__all__' ? [selectedFlowType] : undefined,
        serviceTier: selectedServiceTier !== '__all__' ? [selectedServiceTier] : undefined,
    }), [dateFrom, dateTo, selectedCity, selectedMerchant, selectedFlowType, selectedServiceTier]);

    // Comparison periods
    const currentFrom = dateFrom;
    const currentTo = dateTo;
    const daysDiff = Math.ceil(
        (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)
    );
    const previousTo = format(subDays(new Date(dateFrom), 1), 'yyyy-MM-dd');
    const previousFrom = format(subDays(new Date(previousTo), daysDiff), 'yyyy-MM-dd');

    // Fetch data
    const { data: filterOptions } = useFilterOptions();
    const { data: executiveData, isLoading: execLoading, refetch: refetchExec } = useExecutiveMetrics(filters);
    const { data: comparisonData, isLoading: compLoading } = useComparisonMetrics(
        currentFrom, currentTo, previousFrom, previousTo, filters
    );

    // Removed useTimeSeries as we now use trendData for everything (including Overall)
    const { data: trendData, isLoading: trendLoading } = useTrendData(trendDimension, trendGranularity, filters);
    const { data: groupedData, isLoading: groupedLoading } = useGroupedMetrics(groupBy, filters);

    const handleRefresh = () => {
        refetchExec();
    };

    const handleClearFilters = () => {
        setSelectedCity('__all__');
        setSelectedMerchant('__all__');
        setSelectedFlowType('__all__');
        setSelectedServiceTier('__all__');
        setDateFrom(format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd'));
        setDateTo(format(endOfDay(new Date()), 'yyyy-MM-dd'));
    };

    // Prepare trend chart data
    const chartData = useMemo(() => {
        return transformTrendData(trendData?.data);
    }, [trendData]);

    const trendDimensionsList: { value: Dimension | 'none'; label: string }[] = [
        { value: 'none', label: 'Overall (No Breakdown)' },
        { value: 'service_tier', label: 'Service Tier' },
        { value: 'flow_type', label: 'Flow Type' },
        { value: 'trip_tag', label: 'Trip Tag' },
        { value: 'user_os_type', label: 'OS Type' },
        { value: 'user_bundle_version', label: 'App Bundle Version' },
        { value: 'user_sdk_version', label: 'SDK Version' },
        { value: 'user_backend_app_version', label: 'Backend App Version' },
        { value: 'dynamic_pricing_logic_version', label: 'Price Logic Version' },
        { value: 'pooling_logic_version', label: 'Pooling Logic Version' },
        { value: 'pooling_config_version', label: 'Pooling Config Version' },
    ];

    // Get unique keys for multi-line chart
    const trendKeys = useMemo(() => {
        if (!chartData.length) return [];
        // Available keys are all keys in the first data point excluding timestamp
        const allKeys = Object.keys(chartData[0] || {}).filter(k => k !== 'timestamp');

        // Filter out keys that have 0 total value or are always 0
        return allKeys.filter(key => {
            const hasData = chartData.some(point => {
                const val = point[key];
                return typeof val === 'number' && val > 0;
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
                    { label: 'Analytics', href: '/analytics' },
                    { label: 'Executive Metrics' },
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
                            <div>
                                <Label htmlFor="dateFrom" className="text-xs">From Date</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo" className="text-xs">To Date</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">City</Label>
                                <Select value={selectedCity} onValueChange={setSelectedCity}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Cities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Cities</SelectItem>
                                        {filterOptions?.cities.map((city) => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Merchant</Label>
                                <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Merchants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Merchants</SelectItem>
                                        {filterOptions?.merchants.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Service Tier</Label>
                                <Select value={selectedServiceTier} onValueChange={setSelectedServiceTier}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Tiers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Tiers</SelectItem>
                                        {filterOptions?.serviceTiers.map((st) => (
                                            <SelectItem key={st} value={st}>{st}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Cards */}
                <KPIHeader
                    loading={execLoading}
                    stats={[
                        {
                            label: 'Total Searches',
                            value: formatNumber(executiveData?.totals.searches || 0),
                            icon: <Search className="h-5 w-5" />,
                            change: comparisonData?.change.searches.percent,
                        },
                        {
                            label: 'Total Bookings',
                            value: formatNumber(executiveData?.totals.bookings || 0),
                            icon: <ShoppingCart className="h-5 w-5" />,
                            change: comparisonData?.change.bookings.percent,
                        },
                        {
                            label: 'Completed Rides',
                            value: formatNumber(executiveData?.totals.completedRides || 0),
                            icon: <CheckCircle className="h-5 w-5" />,
                            change: comparisonData?.change.completedRides.percent,
                        },
                        {
                            label: 'Total Earnings',
                            value: formatCurrency(executiveData?.totals.earnings || 0),
                            icon: <DollarSign className="h-5 w-5" />,
                            change: comparisonData?.change.earnings.percent,
                        },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Period Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Period Comparison</CardTitle>
                            {comparisonData && (
                                <p className="text-xs text-muted-foreground">
                                    {comparisonData.currentPeriod.from} to {comparisonData.currentPeriod.to} vs{' '}
                                    {comparisonData.previousPeriod.from} to {comparisonData.previousPeriod.to}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent>
                            {compLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : comparisonData ? (
                                <div className="space-y-3">
                                    {(['searches', 'bookings', 'completedRides', 'earnings'] as const).map((metric) => {
                                        const change = comparisonData.change[metric];
                                        const current = comparisonData.current[metric];
                                        const isPositive = change.percent >= 0;
                                        const label = metric === 'completedRides' ? 'Completed' : metric.charAt(0).toUpperCase() + metric.slice(1);

                                        return (
                                            <div key={metric} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium">{label}</p>
                                                    <p className="text-lg font-bold">
                                                        {metric === 'earnings' ? formatCurrency(current) : formatNumber(current)}
                                                    </p>
                                                </div>
                                                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    <span className="font-semibold">{change.percent.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No comparison data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Funnel Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Funnel & Cancellations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {execLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : executiveData ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between p-2 border-b">
                                        <span>Quotes Requested</span>
                                        <span className="font-semibold">{formatNumber(executiveData.totals.quotesRequested)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 border-b">
                                        <span>Quotes Accepted</span>
                                        <span className="font-semibold">{formatNumber(executiveData.totals.quotesAccepted)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 border-b">
                                        <span>User Cancellations</span>
                                        <span className="font-semibold text-red-500">{formatNumber(executiveData.totals.userCancellations)}</span>
                                    </div>
                                    <div className="flex justify-between p-2">
                                        <span>Driver Cancellations</span>
                                        <span className="font-semibold text-red-500">{formatNumber(executiveData.totals.driverCancellations)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Trend Analysis Chart */}
                {isGridView ? (
                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Dimensional Breakdown</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/30">
                                    <Button
                                        variant={trendGranularity === 'day' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setTrendGranularity('day')}
                                    >
                                        Daily
                                    </Button>
                                    <Button
                                        variant={trendGranularity === 'hour' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setTrendGranularity('hour')}
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
                            {trendDimensionsList.filter(d => d.value !== 'none').map(dim => (
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
                                <CardTitle className="text-lg">Conversation Trend Analysis</CardTitle>

                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Granularity Toggle */}
                                    <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/30">
                                        <Button
                                            variant={trendGranularity === 'day' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setTrendGranularity('day')}
                                        >
                                            Daily
                                        </Button>
                                        <Button
                                            variant={trendGranularity === 'hour' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setTrendGranularity('hour')}
                                        >
                                            Hourly
                                        </Button>
                                    </div>

                                    {/* Dimension Selector */}
                                    <Select
                                        value={trendDimension}
                                        onValueChange={(v) => setTrendDimension(v as Dimension | 'none')}
                                    >
                                        <SelectTrigger className="w-56 h-9">
                                            <SelectValue placeholder="Breakdown By..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trendDimensionsList.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
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
                                                    return trendGranularity === 'hour'
                                                        ? format(date, 'd MMM H:mm')
                                                        : format(date, 'MMM d');
                                                }}
                                                fontSize={12}
                                            />
                                            <YAxis unit="%" fontSize={12} domain={[0, 'auto']} />
                                            <Tooltip
                                                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy HH:mm')}
                                                formatter={(value: number) => [`${value.toFixed(2)}%`]}
                                            />
                                            <Legend />
                                            {trendKeys.map((key, index) => (
                                                <Line
                                                    key={key}
                                                    type="monotone"
                                                    dataKey={key}
                                                    name={key === 'Total' ? 'Overall Conversion' : key}
                                                    stroke={COLORS[index % COLORS.length]}
                                                    strokeWidth={key === 'Total' ? 3 : 2}
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
                            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
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
                                        <BarChart data={groupedData.data.slice(0, 10)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" fontSize={12} />
                                            <YAxis dataKey="dimension" type="category" width={80} fontSize={11} />
                                            <Tooltip formatter={(value: number) => formatNumber(value)} />
                                            <Bar dataKey="bookings" name="Bookings" radius={[0, 4, 4, 0]}>
                                                {groupedData.data.slice(0, 10).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                                <TableHead>{groupBy.replace('_', ' ').toUpperCase()}</TableHead>
                                                <TableHead className="text-right">Bookings</TableHead>
                                                <TableHead className="text-right">Completed</TableHead>
                                                <TableHead className="text-right">Conv. Rate</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedData.data.map((row) => (
                                                <TableRow key={row.dimension}>
                                                    <TableCell className="font-medium text-xs truncate max-w-[150px]" title={row.dimension}>
                                                        {row.dimension || '(empty)'}
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.bookings)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.completedRides)}</TableCell>
                                                    <TableCell className="text-right">{formatPercent(row.conversionRate)}</TableCell>
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
