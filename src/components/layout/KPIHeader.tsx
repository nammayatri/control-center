import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

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
}

export function StatTile({
  label,
  value,
  change,
  changeLabel,
  icon,
  loading,
  className,
  trendData,
  isNegativeMetric = false,
  dateRange,
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

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 mt-1 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(change).toFixed(2)}%</span>
                {changeLabel && (
                  <span className="text-muted-foreground ml-1">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {icon}
            </div>
          )}
        </div>
        {trendData && trendData.length > 0 && (
          <div className="h-16 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={getChartColor()}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#1f2937',
                    border: 'none',
                    color: '#fff',
                  }}
                  labelStyle={{
                    color: '#fff',
                    marginBottom: '4px',
                  }}
                  formatter={(value: number) => [value.toLocaleString(), '']}
                  labelFormatter={(label) => {
                    if (dateRange) {
                      return `${dateRange.from} - ${dateRange.to}`;
                    }
                    return label;
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          backgroundColor: '#1f2937',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          color: '#fff',
                        }}>
                          <p style={{ margin: 0, marginBottom: '4px', fontSize: '12px', color: '#9ca3af' }}>
                            {dateRange ? `${dateRange.from} - ${dateRange.to}` : label}
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                            {payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
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
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4", className)}>
      {stats.map((stat, index) => (
        <StatTile key={index} {...stat} loading={loading} />
      ))}
    </div>
  );
}

