import { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import type { TimeSeriesDataPoint } from '../../services/execMetrics';

const COLORS = {
    today: '#3b82f6', // Blue
    yesterday: '#f59e0b', // Amber
    lastWeek: '#8b5cf6', // Purple
};

interface LiveTrendChartProps {
    title: string;
    todayData?: TimeSeriesDataPoint[];
    yesterdayData?: TimeSeriesDataPoint[];
    lastWeekData?: TimeSeriesDataPoint[];
    // Simple metric key (for counts)
    metricKey?: keyof TimeSeriesDataPoint;
    // For rate calculations: rate = (numerator / denominator) * 100
    numeratorKey?: keyof TimeSeriesDataPoint;
    denominatorKey?: keyof TimeSeriesDataPoint;
    loading?: boolean;
    isCumulative?: boolean;
    // Use this when displaying calculated rates (0-100 range)
    isRate?: boolean;
}

type LineKey = 'today' | 'yesterday' | 'lastWeek';

export function LiveTrendChart({
    title,
    todayData = [],
    yesterdayData = [],
    lastWeekData = [],
    metricKey,
    numeratorKey,
    denominatorKey,
    loading = false,
    isCumulative = false,
    isRate = false,
}: LiveTrendChartProps) {
    // Get current hour for time marker
    const currentHour = new Date().getHours();

    // State for visible lines (clickable legend)
    const [visibleLines, setVisibleLines] = useState<Record<LineKey, boolean>>({
        today: true,
        yesterday: true,
        lastWeek: true,
    });

    // Toggle line visibility
    const toggleLine = (line: LineKey) => {
        setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
    };

    // Transform and merge data
    const chartData = useMemo(() => {
        // Extract hours from all datasets
        const hours = new Set<number>();

        [todayData, yesterdayData, lastWeekData].forEach((dataset) => {
            dataset.forEach((point) => {
                const hour = new Date(point.date).getHours();
                hours.add(hour);
            });
        });

        // Create data points for each hour
        const sortedHours = Array.from(hours).sort((a, b) => a - b);

        // Create maps for quick lookup
        const todayMap = new Map(
            todayData.map((p) => [new Date(p.date).getHours(), p])
        );
        const yesterdayMap = new Map(
            yesterdayData.map((p) => [new Date(p.date).getHours(), p])
        );
        const lastWeekMap = new Map(
            lastWeekData.map((p) => [new Date(p.date).getHours(), p])
        );

        // For cumulative rate metrics, we need to track numerators and denominators separately
        let todayNumeratorSum = 0;
        let todayDenominatorSum = 0;
        let yesterdayNumeratorSum = 0;
        let yesterdayDenominatorSum = 0;
        let lastWeekNumeratorSum = 0;
        let lastWeekDenominatorSum = 0;

        // For cumulative count metrics, track simple sums
        let todayCumulative = 0;
        let yesterdayCumulative = 0;
        let lastWeekCumulative = 0;

        return sortedHours.map((hour) => {
            const todayPoint = todayMap.get(hour);
            const yesterdayPoint = yesterdayMap.get(hour);
            const lastWeekPoint = lastWeekMap.get(hour);

            if (isCumulative && isRate && numeratorKey && denominatorKey) {
                // Cumulative rate: accumulate numerators and denominators
                todayNumeratorSum += (todayPoint?.[numeratorKey] as number) || 0;
                todayDenominatorSum += (todayPoint?.[denominatorKey] as number) || 0;
                yesterdayNumeratorSum += (yesterdayPoint?.[numeratorKey] as number) || 0;
                yesterdayDenominatorSum += (yesterdayPoint?.[denominatorKey] as number) || 0;
                lastWeekNumeratorSum += (lastWeekPoint?.[numeratorKey] as number) || 0;
                lastWeekDenominatorSum += (lastWeekPoint?.[denominatorKey] as number) || 0;

                return {
                    hour: `${hour.toString().padStart(2, '0')}:00`,
                    hourNum: hour,
                    today: todayDenominatorSum > 0 ? (todayNumeratorSum / todayDenominatorSum) * 100 : 0,
                    yesterday: yesterdayDenominatorSum > 0 ? (yesterdayNumeratorSum / yesterdayDenominatorSum) * 100 : 0,
                    lastWeek: lastWeekDenominatorSum > 0 ? (lastWeekNumeratorSum / lastWeekDenominatorSum) * 100 : 0,
                };
            } else if (isCumulative && !isRate && metricKey) {
                // Cumulative count: simple accumulation
                todayCumulative += (todayPoint?.[metricKey] as number) || 0;
                yesterdayCumulative += (yesterdayPoint?.[metricKey] as number) || 0;
                lastWeekCumulative += (lastWeekPoint?.[metricKey] as number) || 0;

                return {
                    hour: `${hour.toString().padStart(2, '0')}:00`,
                    hourNum: hour,
                    today: todayCumulative,
                    yesterday: yesterdayCumulative,
                    lastWeek: lastWeekCumulative,
                };
            } else {
                // Periodic (non-cumulative) - calculate value for this hour only
                let todayValue = 0;
                let yesterdayValue = 0;
                let lastWeekValue = 0;

                if (numeratorKey && denominatorKey) {
                    // Calculate rate for this hour
                    const todayNumerator = (todayPoint?.[numeratorKey] as number) || 0;
                    const todayDenominator = (todayPoint?.[denominatorKey] as number) || 0;
                    todayValue = todayDenominator > 0 ? (todayNumerator / todayDenominator) * 100 : 0;

                    const yesterdayNumerator = (yesterdayPoint?.[numeratorKey] as number) || 0;
                    const yesterdayDenominator = (yesterdayPoint?.[denominatorKey] as number) || 0;
                    yesterdayValue = yesterdayDenominator > 0 ? (yesterdayNumerator / yesterdayDenominator) * 100 : 0;

                    const lastWeekNumerator = (lastWeekPoint?.[numeratorKey] as number) || 0;
                    const lastWeekDenominator = (lastWeekPoint?.[denominatorKey] as number) || 0;
                    lastWeekValue = lastWeekDenominator > 0 ? (lastWeekNumerator / lastWeekDenominator) * 100 : 0;
                } else if (metricKey) {
                    // Simple count for this hour
                    todayValue = (todayPoint?.[metricKey] as number) || 0;
                    yesterdayValue = (yesterdayPoint?.[metricKey] as number) || 0;
                    lastWeekValue = (lastWeekPoint?.[metricKey] as number) || 0;
                }

                return {
                    hour: `${hour.toString().padStart(2, '0')}:00`,
                    hourNum: hour,
                    today: todayValue,
                    yesterday: yesterdayValue,
                    lastWeek: lastWeekValue,
                };
            }
        });
    }, [todayData, yesterdayData, lastWeekData, metricKey, numeratorKey, denominatorKey, isCumulative, isRate]);

    // Calculate totals for legend
    const totals = useMemo(() => {
        if (chartData.length === 0) {
            return { today: 0, yesterday: 0, lastWeek: 0 };
        }

        if (isRate) {
            // For rates in cumulative mode, use the last value (which represents cumulative rate)
            // For rates in periodic mode, show average
            if (isCumulative) {
                const last = chartData[chartData.length - 1];
                return {
                    today: last.today,
                    yesterday: last.yesterday,
                    lastWeek: last.lastWeek,
                };
            } else {
                const count = chartData.length;
                return {
                    today: chartData.reduce((acc, p) => acc + p.today, 0) / count,
                    yesterday: chartData.reduce((acc, p) => acc + p.yesterday, 0) / count,
                    lastWeek: chartData.reduce((acc, p) => acc + p.lastWeek, 0) / count,
                };
            }
        }

        if (isCumulative) {
            // For cumulative counts, use the last value
            const last = chartData[chartData.length - 1];
            return {
                today: last.today,
                yesterday: last.yesterday,
                lastWeek: last.lastWeek,
            };
        }

        // For periodic counts, sum all values
        return chartData.reduce(
            (acc, point) => ({
                today: acc.today + point.today,
                yesterday: acc.yesterday + point.yesterday,
                lastWeek: acc.lastWeek + point.lastWeek,
            }),
            { today: 0, yesterday: 0, lastWeek: 0 }
        );
    }, [chartData, isCumulative, isRate]);

    const formatValue = (value: number) => {
        if (isRate) {
            return `${value.toFixed(2)}%`;
        }
        return value.toLocaleString();
    };

    // Custom legend renderer with clickable items - static, always shows all 3 lines
    const renderLegend = () => {
        const lines: Array<{ key: LineKey; name: string; color: string }> = [
            { key: 'today', name: 'Today', color: COLORS.today },
            { key: 'yesterday', name: 'Yesterday', color: COLORS.yesterday },
            { key: 'lastWeek', name: 'Last Week', color: COLORS.lastWeek },
        ];

        return (
            <div className="flex justify-center gap-4 mt-2 text-xs">
                {lines.map(({ key, name, color }) => {
                    const isVisible = visibleLines[key];
                    const total = totals[key];

                    return (
                        <div
                            key={key}
                            onClick={() => toggleLine(key)}
                            className="flex items-center gap-1.5 cursor-pointer select-none transition-all hover:opacity-70"
                            style={{ opacity: isVisible ? 1 : 0.5 }}
                        >
                            <div
                                className="w-3 h-3 rounded-sm transition-all"
                                style={{
                                    backgroundColor: isVisible ? color : '#9ca3af',
                                    border: isVisible ? 'none' : `1px solid ${color}`
                                }}
                            />
                            <span
                                className="transition-all"
                                style={{
                                    color: isVisible ? 'inherit' : '#9ca3af'
                                }}
                            >
                                {name}: {formatValue(total)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fontSize: 11 }}
                                stroke="currentColor"
                                className="text-muted-foreground"
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                stroke="currentColor"
                                className="text-muted-foreground"
                                domain={isRate ? [0, 100] : ['auto', 'auto']}
                                tickFormatter={(value) => {
                                    if (isRate) return `${value.toFixed(0)}%`;
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                    return value.toLocaleString();
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                }}
                                formatter={(value: number, name: string) => {
                                    // Only show visible lines in tooltip
                                    if (!visibleLines[name as LineKey]) return [null, null];
                                    return [formatValue(value), name === 'today' ? 'Today' : name === 'yesterday' ? 'Yesterday' : 'Last Week'];
                                }}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Legend content={renderLegend} />

                            {/* Current time marker - only show if we have data for current hour */}
                            {chartData.some((d) => d.hourNum === currentHour) && (
                                <ReferenceLine
                                    x={`${currentHour.toString().padStart(2, '0')}:00`}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                    label={{
                                        value: 'Now',
                                        position: 'top',
                                        fontSize: 10,
                                        fill: '#ef4444',
                                    }}
                                />
                            )}


                            <Line
                                type="monotone"
                                dataKey="today"
                                name="today"
                                stroke={COLORS.today}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4 }}
                                hide={!visibleLines.today}
                            />
                            <Line
                                type="monotone"
                                dataKey="yesterday"
                                name="yesterday"
                                stroke={COLORS.yesterday}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 4 }}
                                hide={!visibleLines.yesterday}
                            />
                            <Line
                                type="monotone"
                                dataKey="lastWeek"
                                name="lastWeek"
                                stroke={COLORS.lastWeek}
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                dot={false}
                                activeDot={{ r: 4 }}
                                hide={!visibleLines.lastWeek}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
