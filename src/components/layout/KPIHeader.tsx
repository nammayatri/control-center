import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface StatTileProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  trendData?: Array<{ timestamp: string; value: number }>;
  isNegativeMetric?: boolean; // If true, positive change is bad (e.g., cancellations)
  dateRange?: { from: string; to: string }; // Date range for tooltip
  comparisonDateRange?: { from: string; to: string }; // Previous period date range for comparison tooltip
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
  isNegativeMetric = false,
  dateRange: _dateRange,
  comparisonDateRange,
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
  // const _lightColor = chartColor === '#22c55e'
  //   ? 'rgba(34, 197, 94, 0.1)' // light green
  //   : chartColor === '#ef4444'
  //     ? 'rgba(239, 68, 68, 0.1)' // light red
  //     : 'rgba(107, 114, 128, 0.1)'; // light gray

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {/* Left side: Metric and change */}
          <div className="flex-shrink-0 min-w-[120px]">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
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
          {trendData && trendData.length > 0 && (
            <div className="flex-1 h-16 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                        const value = payload[0].value as number;
                        return (
                          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                            <p className="text-gray-300 mb-1">{formattedDate}</p>
                            <p className="font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
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

