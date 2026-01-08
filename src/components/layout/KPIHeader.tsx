import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ChevronDown } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  trendData?: Array<{ timestamp: string; value: number }>;
  comparisonTrendData?: Array<{ timestamp: string; value: number }>;
  isNegativeMetric?: boolean; // If true, positive change is bad (e.g., cancellations)
  dateRange?: { from: string; to: string }; // Date range for tooltip
  comparisonDateRange?: { from: string; to: string }; // Previous period date range for comparison tooltip
  subMetrics?: Array<{
    label: string;
    value: string | number;
    change?: number;
    isNegativeMetric?: boolean;
  }>;
}

export function StatTile({
  label,
  value,
  change,
  changeLabel,
  icon: _icon,
  loading,
  className,
  trendData,
  comparisonTrendData,
  isNegativeMetric = false,
  dateRange: _dateRange,
  comparisonDateRange,
  subMetrics,
}: StatTileProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    // Arrow direction always matches the change direction (up for increase, down for decrease)
    // Color will indicate if it's good or bad
    return change > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    const isPositive = change > 0;
    // For negative metrics (cancellations), positive change is bad (red)
    const isGood = isNegativeMetric ? !isPositive : isPositive;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getChartColor = () => {
    if (change === undefined || change === 0) return '#6b7280';
    const isPositive = change > 0;
    // For negative metrics (cancellations), positive change is bad (red)
    const isGood = isNegativeMetric ? !isPositive : isPositive;
    return isGood ? '#22c55e' : '#ef4444';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format date for tooltip: "Tue, 17th 8:00 am"
  const formatTooltipDate = (dateString: string): string => {
    try {
      // Try parsing as ISO or various formats
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else if (dateString.includes(' ')) {
        // Format: "2025-12-17 08:00:00"
        date = new Date(dateString.replace(' ', 'T'));
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return dateString;
      }

      const dayName = format(date, 'EEE'); // Tue
      const day = format(date, 'd'); // 17
      const daySuffix = getDaySuffix(parseInt(day)); // th
      const time = format(date, 'h:mm a'); // 8:00 am

      return `${dayName}, ${day}${daySuffix} ${time}`;
    } catch {
      return dateString;
      return dateString;
    }
  };

  const getDaySuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const chartColor = getChartColor();
  const gradientId = `gradient-${label.replace(/\s+/g, '-')}`;

  // Merge trendData and comparisonTrendData for rendering
  const mergedChartData = React.useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    if (!comparisonTrendData || comparisonTrendData.length === 0) return trendData;

    // Create map for fast lookup
    const comparisonMap = new Map(comparisonTrendData.map(d => [d.timestamp, d.value]));

    return trendData.map(d => ({
      ...d,
      value: d.value,
      comparisonValue: comparisonMap.get(d.timestamp)
    }));
  }, [trendData, comparisonTrendData]);


  const content = (
    <Card className={cn(subMetrics ? "cursor-pointer hover:bg-muted/50 transition-colors" : "", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {/* Left side: Metric and change */}
          <div className="flex-shrink-0 min-w-[120px]">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              {subMetrics && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            {change !== undefined && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-1 text-xs font-medium cursor-help", getTrendColor())}>
                      {getTrendIcon()}
                      <span>{Math.abs(change).toFixed(2)}%</span>
                      {changeLabel && (
                        <span className="text-muted-foreground ml-1">{changeLabel}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    <div className="space-y-1">
                      <p className="text-xs">
                        {change > 0 ? 'Increased by' : change < 0 ? 'Decreased by' : 'No change'}
                      </p>
                      <p className="text-sm font-bold">
                        {Math.abs(change).toFixed(2)}%
                      </p>
                      {comparisonDateRange && (
                        <>
                          <p className="text-xs text-gray-300">comparing to</p>
                          <p className="text-xs text-gray-300">
                            {comparisonDateRange.from} - {comparisonDateRange.to}
                          </p>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Right side: Graph - takes remaining space */}
          {mergedChartData && mergedChartData.length > 0 && (
            <div className="flex-1 h-16 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  {/* Comparison Area (rendered first to be behind) */}
                  {comparisonTrendData && (
                    <Area
                      type="monotone"
                      dataKey="comparisonValue"
                      stroke="#fb923c" // Orange-400
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      fill="transparent"
                      dot={false}
                      activeDot={{ r: 3, fill: "#fb923c" }}
                    />
                  )}

                  {/* Main Metric Area */}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 3, fill: chartColor }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        // Use timestamp from payload data, fallback to label
                        const timestamp = payload[0].payload?.timestamp || label || '';
                        const formattedDate = formatTooltipDate(timestamp);

                        return (
                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg space-y-1">
                            <p className="text-gray-300 mb-1 border-b border-gray-700 pb-1">{formattedDate}</p>
                            {payload.map((p, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                <span className={cn("font-medium", p.dataKey === "comparisonValue" ? "text-orange-300" : "text-white")}>
                                  {p.dataKey === "comparisonValue" ? "Prev: " : "Curr: "}
                                  {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
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
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (subMetrics) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {content}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 shadow-xl border-zinc-200 dark:border-zinc-800" align="start">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Breakdown</h4>
            <div className="space-y-2">
              {subMetrics.map((sub, idx) => {
                const isPositive = (sub.change || 0) > 0;
                const isGood = sub.isNegativeMetric ? !isPositive : isPositive;
                const trendColor = (sub.change === 0 || sub.change === undefined) ? 'text-muted-foreground' : (isGood ? 'text-green-600' : 'text-red-600');

                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{sub.label}</p>
                      <p className="text-sm font-bold">{sub.value}</p>
                    </div>
                    {sub.change !== undefined && (
                      <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                        {sub.change > 0 ? <TrendingUp className="h-3 w-3" /> : (sub.change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />)}
                        <span>{Math.abs(sub.change).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return content;
}

interface KPIHeaderProps {
  stats: StatTileProps[];
  loading?: boolean;
  className?: string;
}

export function KPIHeader({ stats, loading, className }: KPIHeaderProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {stats.map((stat, index) => (
        <StatTile key={index} {...stat} loading={loading} />
      ))}
    </div>
  );
}

