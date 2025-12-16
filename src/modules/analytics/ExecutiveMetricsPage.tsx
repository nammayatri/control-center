import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { KPIHeader, StatTile } from '../../components/layout/KPIHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
    useConversionMetrics,
    useComparisonMetrics,
    useTimeSeries,
    useFilterOptions,
    useGroupedMetrics,
} from '../../hooks/useExecMetrics';
import type { MetricsFilters } from '../../services/execMetrics';
import {
    Search,
    ShoppingCart,
    CheckCircle,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    RefreshCw,
    Filter,
    XCircle,
    Car,
    Bike,
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
    Cell,
    Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

export function ExecutiveMetricsPage() {
    // Date filters - default to last 30 days
    const [dateFrom, setDateFrom] = useState(() =>
        format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd')
    );
    const [dateTo, setDateTo] = useState(() =>
        format(endOfDay(new Date()), 'yyyy-MM-dd')
    );

    // Dimension filters - use '__all__' as sentinel for "all" selection
    const [selectedCity, setSelectedCity] = useState<string>('__all__');
    const [selectedFlowType, setSelectedFlowType] = useState<string>('__all__');
    const [selectedVariant, setSelectedVariant] = useState<string>('__all__');
    const [groupBy, setGroupBy] = useState<'city' | 'flow_type' | 'trip_tag' | 'variant'>('city');

    // Build filters object - convert '__all__' back to undefined for API
    const filters: MetricsFilters = useMemo(() => ({
        dateFrom,
        dateTo,
        city: selectedCity !== '__all__' ? [selectedCity] : undefined,
        flowType: selectedFlowType !== '__all__' ? [selectedFlowType] : undefined,
        variant: selectedVariant !== '__all__' ? [selectedVariant] : undefined,
    }), [dateFrom, dateTo, selectedCity, selectedFlowType, selectedVariant]);

    // Comparison periods (current vs previous of same duration)
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
    const { data: conversionData, isLoading: convLoading } = useConversionMetrics(filters);
    const { data: comparisonData, isLoading: compLoading } = useComparisonMetrics(
        currentFrom, currentTo, previousFrom, previousTo, filters
    );
    const { data: timeSeriesData, isLoading: tsLoading } = useTimeSeries(filters);
    const { data: groupedData, isLoading: groupedLoading } = useGroupedMetrics(groupBy, filters);



    const handleRefresh = () => {
        refetchExec();
    };

    const handleClearFilters = () => {
        setSelectedCity('__all__');
        setSelectedFlowType('__all__');
        setSelectedVariant('__all__');
        setDateFrom(format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd'));
        setDateTo(format(endOfDay(new Date()), 'yyyy-MM-dd'));
    };

    return (
        <Page>
            <PageHeader
                title="Executive Metrics"
                description="Business performance metrics and analytics"
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
                                <Label className="text-xs">Flow Type</Label>
                                <Select value={selectedFlowType} onValueChange={setSelectedFlowType}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Flows" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Flows</SelectItem>
                                        {filterOptions?.flowTypes.map((ft) => (
                                            <SelectItem key={ft} value={ft}>{ft}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Variant</Label>
                                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Variants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Variants</SelectItem>
                                        {filterOptions?.variants.map((v) => (
                                            <SelectItem key={v} value={v}>{v}</SelectItem>
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

                {/* Second Row - Driver Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <StatTile
                        label="Enabled Drivers"
                        value={formatNumber(executiveData?.drivers.enabledDrivers || 0)}
                        icon={<Users className="h-5 w-5" />}
                        loading={execLoading}
                    />
                    <StatTile
                        label="Cab Drivers"
                        value={formatNumber(executiveData?.drivers.cabEnabledDrivers || 0)}
                        icon={<Car className="h-5 w-5" />}
                        loading={execLoading}
                    />
                    <StatTile
                        label="Auto Drivers"
                        value={formatNumber(executiveData?.drivers.autoEnabledDrivers || 0)}
                        icon={<Car className="h-5 w-5" />}
                        loading={execLoading}
                    />
                    <StatTile
                        label="Bike Drivers"
                        value={formatNumber(executiveData?.drivers.bikeEnabledDrivers || 0)}
                        icon={<Bike className="h-5 w-5" />}
                        loading={execLoading}
                    />
                </div>

                {/* Conversion Funnel & Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Conversion Funnel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {convLoading ? (
                                <Skeleton className="h-48 w-full" />
                            ) : conversionData ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium">Search → Estimate</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {formatPercent(conversionData.funnel.searchToEstimate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium">Estimate → Quote</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatPercent(conversionData.funnel.estimateToQuote)}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                        <span className="text-sm font-medium">Quote → Booking</span>
                                        <span className="text-lg font-bold text-amber-600">
                                            {formatPercent(conversionData.funnel.quoteToBooking)}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <span className="text-sm font-medium">Booking → Completion</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {formatPercent(conversionData.funnel.bookingToCompletion)}
                                        </span>
                                    </div>

                                    <div className="pt-4 border-t mt-4">
                                        <p className="text-sm text-muted-foreground mb-2">Cancellation Rates</p>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 bg-red-50 rounded">
                                                <p className="text-xs text-muted-foreground">Overall</p>
                                                <p className="font-semibold text-red-600">
                                                    {formatPercent(conversionData.cancellation.overall)}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-red-50 rounded">
                                                <p className="text-xs text-muted-foreground">By Driver</p>
                                                <p className="font-semibold text-red-600">
                                                    {formatPercent(conversionData.cancellation.byDriver)}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-red-50 rounded">
                                                <p className="text-xs text-muted-foreground">By User</p>
                                                <p className="font-semibold text-red-600">
                                                    {formatPercent(conversionData.cancellation.byUser)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                </div>

                {/* Time Series Chart */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Trend Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tsLoading ? (
                            <Skeleton className="h-72 w-full" />
                        ) : timeSeriesData?.data && timeSeriesData.data.length > 0 ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeSeriesData.data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => format(new Date(value), 'MMM d')}
                                            fontSize={12}
                                        />
                                        <YAxis fontSize={12} />
                                        <Tooltip
                                            labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                                            formatter={(value: number, name: string) => [formatNumber(value), name]}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="bookings"
                                            name="Bookings"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="completedRides"
                                            name="Completed"
                                            stroke="#22c55e"
                                            fill="#22c55e"
                                            fillOpacity={0.3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center text-muted-foreground">
                                No time series data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Grouped Breakdown */}
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Breakdown by Dimension</CardTitle>
                            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                                <SelectTrigger className="w-40 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="city">City</SelectItem>
                                    <SelectItem value="flow_type">Flow Type</SelectItem>
                                    <SelectItem value="trip_tag">Trip Tag</SelectItem>
                                    <SelectItem value="variant">Variant</SelectItem>
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
                                                    <TableCell className="font-medium">{row.dimension || '(empty)'}</TableCell>
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
        </Page>
    );
}
