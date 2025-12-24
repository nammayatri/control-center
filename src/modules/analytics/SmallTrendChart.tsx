import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { useTrendData } from '../../hooks/useExecMetrics';
import type { Dimension, Granularity, MetricsFilters, DimensionalTimeSeriesDataPoint } from '../../services/execMetrics';
import { Skeleton } from '../../components/ui/skeleton';

// Use same colors as main chart
const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#14b8a6', '#f43f5e', '#6366f1'];

interface SmallTrendChartProps {
    dimension: Dimension;
    label: string;
    filters: MetricsFilters;
    granularity: Granularity;
}

export const SmallTrendChart: React.FC<SmallTrendChartProps> = ({ dimension, label, filters, granularity }) => {
    const { data: trendData, isLoading } = useTrendData(dimension, granularity, filters);

    // Transform logic similar to main page
    const chartData = useMemo(() => {
        if (!trendData?.data) return [];
        return trendData.data.reduce<any[]>((acc, curr: DimensionalTimeSeriesDataPoint) => {
            const existing = acc.find(item => item.timestamp === curr.timestamp);
            const conversionRate = (curr.conversion || 0) * 100;

            if (existing) {
                existing[curr.dimensionValue] = conversionRate;
            } else {
                acc.push({
                    timestamp: curr.timestamp,
                    [curr.dimensionValue]: conversionRate
                });
            }
            return acc;
        }, []).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [trendData]);

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
                    <div className="h-40">
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
                                    unit="%"
                                    fontSize={10}
                                    width={30}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    labelFormatter={(v) => format(new Date(v), 'MMM d, HH:mm')}
                                    formatter={(v: number) => [`${v.toFixed(1)}%`]}
                                    contentStyle={{ fontSize: '12px' }}
                                />
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
