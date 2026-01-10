import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';
import { useTrendData } from '../../hooks/useExecMetrics';
import type { Dimension, Granularity, MetricsFilters, DimensionalTimeSeriesDataPoint } from '../../services/execMetrics';
import { Skeleton } from '../../components/ui/skeleton';

// Use same colors as main chart
const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#14b8a6', '#f43f5e', '#6366f1'];

// Rate metrics that should be displayed as percentages
const RATE_METRICS = ['conversion', 'overall_cancel_rate', 'driver_cancel_rate', 'user_cancel_rate', 'rfa_rate', 'dqa_rate'];
// Currency metrics that should be displayed with ₹
const CURRENCY_METRICS = ['earnings'];

// Helper to format values based on metric type
const formatValue = (value: number, metricKey: string, compact: boolean = false): string => {
    const isRate = RATE_METRICS.includes(metricKey);
    const isCurrency = CURRENCY_METRICS.includes(metricKey);

    if (isRate) {
        return `${value.toFixed(1)}%`;
    }

    if (isCurrency) {
        if (compact && Math.abs(value) >= 1000) {
            if (Math.abs(value) >= 10000000) { // 1 Crore
                return `₹${(value / 10000000).toFixed(1)}Cr`;
            } else if (Math.abs(value) >= 100000) { // 1 Lakh
                return `₹${(value / 100000).toFixed(1)}L`;
            } else if (Math.abs(value) >= 1000) {
                return `₹${(value / 1000).toFixed(1)}K`;
            }
        }
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }

    // Count metrics
    if (compact && Math.abs(value) >= 1000) {
        if (Math.abs(value) >= 10000000) { // 1 Crore
            return `${(value / 10000000).toFixed(1)}Cr`;
        } else if (Math.abs(value) >= 100000) { // 1 Lakh
            return `${(value / 100000).toFixed(1)}L`;
        } else if (Math.abs(value) >= 1000) {
            return `${(value / 1000).toFixed(1)}K`;
        }
    }
    return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// Helper to get Y-axis unit based on metric
const getYAxisUnit = (metricKey: string): string => {
    if (RATE_METRICS.includes(metricKey)) return '%';
    if (CURRENCY_METRICS.includes(metricKey)) return '';
    return '';
};

interface SmallTrendChartProps {
    dimension: Dimension;
    label: string;
    filters: MetricsFilters;
    granularity: Granularity;
    preloadedData?: DimensionalTimeSeriesDataPoint[];
    isLoading?: boolean;
    metricToDisplay?: string; // Which metric to show (e.g., 'conversion', 'rfa_rate', etc.)
}

export const SmallTrendChart: React.FC<SmallTrendChartProps> = ({
    dimension,
    label,
    filters,
    granularity,
    preloadedData,
    isLoading: isLoadingProp,
    metricToDisplay
}) => {
    // Only fetch if no preloaded data
    const { data: trendData, isLoading: queryLoading } = useTrendData(dimension, granularity, filters);

    // Determine effective loading state and data source
    const isLoading = preloadedData ? (isLoadingProp ?? false) : queryLoading;
    const sourceData = preloadedData || trendData?.data;

    // Transform logic similar to main page
    // Use the provided metric or default to conversion
    const metricKey = metricToDisplay || 'conversion';

    // Determine metric type for formatting
    const isRateMetric = RATE_METRICS.includes(metricKey);

    const chartData = useMemo(() => {
        if (!sourceData) return [];
        return sourceData.reduce<any[]>((acc, curr: DimensionalTimeSeriesDataPoint) => {
            const existing = acc.find(item => item.timestamp === curr.timestamp);

            // Get the metric value dynamically
            let value = (curr[metricKey as keyof DimensionalTimeSeriesDataPoint] as number) || 0;

            // Calculate missing rate metrics if needed
            if (!curr[metricKey as keyof DimensionalTimeSeriesDataPoint] && isRateMetric) {
                if (metricKey === 'overall_cancel_rate' || metricKey === 'cancellationRate') {
                    value = (curr.cancelledRides || 0) / (curr.bookings || curr.searches || 1);
                } else if (metricKey === 'user_cancel_rate' || metricKey === 'userCancellationRate') {
                    value = (curr.userCancellations || 0) / (curr.bookings || curr.searches || 1);
                } else if (metricKey === 'driver_cancel_rate' || metricKey === 'driverCancellationRate') {
                    value = (curr.driverCancellations || 0) / (curr.bookings || curr.searches || 1);
                }
            }

            // Convert rate metrics to percentage (except conversion which is already 0-100)
            if (isRateMetric && metricKey !== 'conversion' && value <= 1) {
                value = value * 100;
            }

            if (existing) {
                existing[curr.dimensionValue] = (existing[curr.dimensionValue] || 0) + value;
            } else {
                acc.push({
                    timestamp: curr.timestamp,
                    [curr.dimensionValue]: value
                });
            }
            return acc;
        }, []).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [sourceData, metricKey, isRateMetric]);

    const trendKeys = useMemo(() => {
        if (!chartData.length) return [];
        const allKeys = Object.keys(chartData[0]).filter(k => k !== 'timestamp');
        // Filter out zero-value keys
        return allKeys.filter(key => {
            return chartData.some(point => {
                const val = point[key];
                return typeof val === 'number' && val > 0;
            });
        });
    }, [chartData]);

    return (
        <Card className="h-full">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium truncate" title={label}>
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                {isLoading ? (
                    <Skeleton className="h-40 w-full" />
                ) : chartData.length > 0 ? (
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(v) => format(new Date(v), 'd MMM')}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    unit={getYAxisUnit(metricKey)}
                                    fontSize={10}
                                    width={isRateMetric ? 35 : 50}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => formatValue(v, metricKey, true)}
                                />
                                <Tooltip
                                    labelFormatter={(v) => format(new Date(v), 'MMM d, HH:mm')}
                                    formatter={(v: number) => [formatValue(v, metricKey, false)]}
                                    contentStyle={{ fontSize: '12px' }}
                                />
                                {/* Only show legend if <= 8 items, otherwise it overwhelms the chart */}
                                {trendKeys.length <= 8 && (
                                    <Legend
                                        wrapperStyle={{
                                            fontSize: '10px',
                                            paddingTop: '10px',
                                            maxHeight: trendKeys.length > 5 ? '60px' : 'auto',
                                            overflowY: trendKeys.length > 5 ? 'auto' : 'visible'
                                        }}
                                        iconType="line"
                                        formatter={(value: string) => {
                                            // Truncate long names
                                            const displayName = value.length > 15 ? value.substring(0, 12) + '...' : value;
                                            // Calculate average value for this variant from chartData
                                            const values = chartData
                                                .map((point: Record<string, number | string>) => point[value] as number)
                                                .filter((v) => typeof v === 'number' && !isNaN(v));
                                            const avgValue = values.length > 0
                                                ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
                                                : 0;
                                            return `${displayName} (${formatValue(avgValue, metricKey, true)})`;
                                        }}
                                    />
                                )}
                                {trendKeys.map((key, index) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={key}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={1.5}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded">
                        No Data
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
