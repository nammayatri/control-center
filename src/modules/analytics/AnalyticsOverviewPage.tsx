import { useState, useMemo } from 'react';
import { Page, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { LiveTrendChart } from './LiveTrendChart';
import { useLiveMetrics } from '../../hooks/useLiveMetrics';
import { useFilterOptions } from '../../hooks/useExecMetrics';
import type { MetricsFilters, TimeSeriesDataPoint } from '../../services/execMetrics';
import { cn } from '../../lib/utils';
import { getTrendColor, formatNumber, calculatePercentChange } from '../../lib/metricUtils';

// Priority cities - these appear first in the dropdown
const PRIORITY_CITIES = [
  'Bangalore',
  'Kolkata',
  'Chennai',
  'Kochi',
  'Bhubaneshwar',
  'Delhi',
  'Noida',
  'Gurgaon',
];

// Conversion Progress Bar Component
function ConversionProgress({ currentRate, goalRate = 50 }: { currentRate: number; goalRate?: number }) {
  const progressPercent = Math.min((currentRate / goalRate) * 100, 100);

  return (
    <div className="space-y-1 mt-2">
      <div className="relative h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-emerald-900 dark:text-emerald-100">
          {currentRate.toFixed(1)}%
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground text-right">Goal: {goalRate}%</p>
    </div>
  );
}

// KPI Card with vertical trend layout
interface KPICardProps {
  title: string;
  value: string | number;
  vsYesterday?: number;
  vsLastWeek?: number;
  metricKey: string;
  prefix?: string;
  suffix?: string;
  showProgressBar?: boolean;
  progressGoal?: number;
}

function KPICard({
  title,
  value,
  vsYesterday,
  vsLastWeek,
  metricKey,
  prefix = '',
  suffix = '',
  showProgressBar = false,
  progressGoal = 50,
}: KPICardProps) {

  const renderTrendIndicator = (change: number | undefined, label: string) => {
    if (change === undefined) return null;

    const colorClass = getTrendColor(change, metricKey);
    const Icon = change >= 0 ? TrendingUp : TrendingDown;

    return (
      <div className={cn("flex items-center gap-1 text-xs", colorClass)}>
        <Icon className="h-3 w-3" />
        <span className="font-medium">{label}:</span>
        <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <Card className="min-w-[200px]">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold mb-2">{prefix}{value}{suffix}</p>

        {/* Vertical trend layout */}
        <div className="flex flex-col gap-1">
          {renderTrendIndicator(vsYesterday, 'vs Yesterday')}
          {renderTrendIndicator(vsLastWeek, 'vs Last Week')}
        </div>

        {/* Conversion progress bar */}
        {showProgressBar && typeof value === 'number' && (
          <ConversionProgress currentRate={value} goalRate={progressGoal} />
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverviewPage() {
  const now = new Date();
  const currentHour = now.getHours();
  const [selectedCity, setSelectedCity] = useState<string>('__all__');
  const [isCumulative, setIsCumulative] = useState(false);

  // Filters for API calls
  const filters: Omit<MetricsFilters, 'dateFrom' | 'dateTo'> = useMemo(
    () => ({
      city: selectedCity === '__all__' ? undefined : [selectedCity],
    }),
    [selectedCity]
  );

  // Fetch filter options
  const { data: filterOptions } = useFilterOptions();

  // Fetch live comparison data (Today, Yesterday, Last Week) - hourly
  const liveMetrics = useLiveMetrics(filters, 'hour');

  const handleRefresh = () => {
    liveMetrics.refetch();
  };

  // Sort cities: priority cities first, then alphabetically
  const sortedCities = useMemo(() => {
    if (!filterOptions?.cities) return [];

    const priorityCitiesSet = new Set(PRIORITY_CITIES);
    const priority: string[] = [];
    const others: string[] = [];

    filterOptions.cities.forEach((city) => {
      if (priorityCitiesSet.has(city)) {
        priority.push(city);
      } else {
        others.push(city);
      }
    });

    priority.sort((a, b) => PRIORITY_CITIES.indexOf(a) - PRIORITY_CITIES.indexOf(b));
    others.sort();

    return [...priority, ...others];
  }, [filterOptions?.cities]);

  // Sum data up to current hour for fair comparison
  const sumUpToCurrentHour = (data: TimeSeriesDataPoint[] | undefined, key: keyof TimeSeriesDataPoint): number => {
    if (!data) return 0;
    return data
      .filter(point => new Date(point.date).getHours() <= currentHour)
      .reduce((sum, point) => sum + ((point[key] as number) || 0), 0);
  };

  // Calculate rate from hourly data up to current hour
  const calculateRateUpToCurrentHour = (
    data: TimeSeriesDataPoint[] | undefined,
    numeratorKey: keyof TimeSeriesDataPoint,
    denominatorKey: keyof TimeSeriesDataPoint
  ): number => {
    const numerator = sumUpToCurrentHour(data, numeratorKey);
    const denominator = sumUpToCurrentHour(data, denominatorKey);
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  };

  // Get time-comparable metrics (only data up to current hour)
  const metrics = useMemo(() => {
    const todayData = liveMetrics.today.data?.data;
    const yesterdayData = liveMetrics.yesterday.data?.data;
    const lastWeekData = liveMetrics.lastWeek.data?.data;

    return {
      searches: {
        today: sumUpToCurrentHour(todayData, 'searches'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'searches'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'searches'),
      },
      completedRides: {
        today: sumUpToCurrentHour(todayData, 'completedRides'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'completedRides'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'completedRides'),
      },
      bookings: {
        today: sumUpToCurrentHour(todayData, 'bookings'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'bookings'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'bookings'),
      },
      earnings: {
        today: sumUpToCurrentHour(todayData, 'earnings'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'earnings'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'earnings'),
      },
      cancelledRides: {
        today: sumUpToCurrentHour(todayData, 'cancelledRides'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'cancelledRides'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'cancelledRides'),
      },
      driverCancellations: {
        today: sumUpToCurrentHour(todayData, 'driverCancellations'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'driverCancellations'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'driverCancellations'),
      },
      userCancellations: {
        today: sumUpToCurrentHour(todayData, 'userCancellations'),
        yesterday: sumUpToCurrentHour(yesterdayData, 'userCancellations'),
        lastWeek: sumUpToCurrentHour(lastWeekData, 'userCancellations'),
      },
      // Rate metrics
      rfa: {
        today: calculateRateUpToCurrentHour(todayData, 'searchForQuotes', 'searchGotEstimates'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'searchForQuotes', 'searchGotEstimates'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'searchForQuotes', 'searchGotEstimates'),
      },
      dqa: {
        today: calculateRateUpToCurrentHour(todayData, 'quotesAccepted', 'searchForQuotes'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'quotesAccepted', 'searchForQuotes'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'quotesAccepted', 'searchForQuotes'),
      },
      conversion: {
        today: calculateRateUpToCurrentHour(todayData, 'completedRides', 'searches'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'completedRides', 'searches'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'completedRides', 'searches'),
      },
      cancelRate: {
        today: calculateRateUpToCurrentHour(todayData, 'cancelledRides', 'bookings'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'cancelledRides', 'bookings'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'cancelledRides', 'bookings'),
      },
      driverCancelRate: {
        today: calculateRateUpToCurrentHour(todayData, 'driverCancellations', 'bookings'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'driverCancellations', 'bookings'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'driverCancellations', 'bookings'),
      },
      riderCancelRate: {
        today: calculateRateUpToCurrentHour(todayData, 'userCancellations', 'bookings'),
        yesterday: calculateRateUpToCurrentHour(yesterdayData, 'userCancellations', 'bookings'),
        lastWeek: calculateRateUpToCurrentHour(lastWeekData, 'userCancellations', 'bookings'),
      },
    };
  }, [liveMetrics.today.data, liveMetrics.yesterday.data, liveMetrics.lastWeek.data, currentHour]);

  return (
    <Page>
      <PageContent>
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Live Overview</h1>

            {/* City Dropdown */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Cities</SelectItem>
                {sortedCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-zinc-500 font-medium">
              Comparing data till {currentHour}:00
            </span>
          </div>
        </div>

        {/* KPI Cards Row 1: Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <KPICard
            title="Searches"
            value={formatNumber(metrics.searches.today)}
            vsYesterday={calculatePercentChange(metrics.searches.today, metrics.searches.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.searches.today, metrics.searches.lastWeek)}
            metricKey="searches"
          />
          <KPICard
            title="Bookings"
            value={formatNumber(metrics.bookings.today)}
            vsYesterday={calculatePercentChange(metrics.bookings.today, metrics.bookings.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.bookings.today, metrics.bookings.lastWeek)}
            metricKey="bookings"
          />
          <KPICard
            title="Completed Rides"
            value={formatNumber(metrics.completedRides.today)}
            vsYesterday={calculatePercentChange(metrics.completedRides.today, metrics.completedRides.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.completedRides.today, metrics.completedRides.lastWeek)}
            metricKey="completedRides"
          />
          <KPICard
            title="Cancellations"
            value={formatNumber(metrics.cancelledRides.today)}
            vsYesterday={calculatePercentChange(metrics.cancelledRides.today, metrics.cancelledRides.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.cancelledRides.today, metrics.cancelledRides.lastWeek)}
            metricKey="cancelledRides"
          />
          <KPICard
            title="Earnings"
            value={formatNumber(metrics.earnings.today)}
            vsYesterday={calculatePercentChange(metrics.earnings.today, metrics.earnings.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.earnings.today, metrics.earnings.lastWeek)}
            metricKey="earnings"
            prefix="₹"
          />
        </div>

        {/* KPI Cards Row 2: Rate Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KPICard
            title="Rider Fare Acceptance %"
            value={metrics.rfa.today.toFixed(1)}
            vsYesterday={calculatePercentChange(metrics.rfa.today, metrics.rfa.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.rfa.today, metrics.rfa.lastWeek)}
            metricKey="rfa"
            suffix="%"
          />
          <KPICard
            title="Driver Quote Acceptance %"
            value={metrics.dqa.today.toFixed(1)}
            vsYesterday={calculatePercentChange(metrics.dqa.today, metrics.dqa.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.dqa.today, metrics.dqa.lastWeek)}
            metricKey="dqa"
            suffix="%"
          />
          <KPICard
            title="Overall Cancel %"
            value={metrics.cancelRate.today.toFixed(1)}
            vsYesterday={calculatePercentChange(metrics.cancelRate.today, metrics.cancelRate.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.cancelRate.today, metrics.cancelRate.lastWeek)}
            metricKey="cancellationRate"
            suffix="%"
          />
          <KPICard
            title="Driver Cancel %"
            value={metrics.driverCancelRate.today.toFixed(1)}
            vsYesterday={calculatePercentChange(metrics.driverCancelRate.today, metrics.driverCancelRate.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.driverCancelRate.today, metrics.driverCancelRate.lastWeek)}
            metricKey="driverCancellationRate"
            suffix="%"
          />
          <KPICard
            title="Rider Cancel %"
            value={metrics.riderCancelRate.today.toFixed(1)}
            vsYesterday={calculatePercentChange(metrics.riderCancelRate.today, metrics.riderCancelRate.yesterday)}
            vsLastWeek={calculatePercentChange(metrics.riderCancelRate.today, metrics.riderCancelRate.lastWeek)}
            metricKey="userCancellationRate"
            suffix="%"
          />
          <Card className="min-w-[200px]">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Conversion %</p>
              <p className="text-2xl font-bold mb-1">{metrics.conversion.today.toFixed(1)}%</p>
              <div className="flex flex-col gap-1 mb-2">
                <div className={cn("flex items-center gap-1 text-xs", getTrendColor(calculatePercentChange(metrics.conversion.today, metrics.conversion.yesterday), 'conversion'))}>
                  {(calculatePercentChange(metrics.conversion.today, metrics.conversion.yesterday) ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="font-medium">vs Yesterday:</span>
                  <span>{(calculatePercentChange(metrics.conversion.today, metrics.conversion.yesterday) ?? 0) >= 0 ? '+' : ''}{(calculatePercentChange(metrics.conversion.today, metrics.conversion.yesterday) ?? 0).toFixed(1)}%</span>
                </div>
                <div className={cn("flex items-center gap-1 text-xs", getTrendColor(calculatePercentChange(metrics.conversion.today, metrics.conversion.lastWeek), 'conversion'))}>
                  {(calculatePercentChange(metrics.conversion.today, metrics.conversion.lastWeek) ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span className="font-medium">vs Last Week:</span>
                  <span>{(calculatePercentChange(metrics.conversion.today, metrics.conversion.lastWeek) ?? 0) >= 0 ? '+' : ''}{(calculatePercentChange(metrics.conversion.today, metrics.conversion.lastWeek) ?? 0).toFixed(1)}%</span>
                </div>
              </div>
              <ConversionProgress currentRate={metrics.conversion.today} goalRate={50} />
            </CardContent>
          </Card>
        </div>

        {/* Periodic/Cumulative Toggle */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <span className="text-sm text-muted-foreground">View:</span>
          <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg p-0.5">
            <Button
              variant={!isCumulative ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-[11px] font-medium transition-all duration-200',
                !isCumulative ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
              )}
              onClick={() => setIsCumulative(false)}
            >
              Periodic
            </Button>
            <Button
              variant={isCumulative ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-[11px] font-medium transition-all duration-200',
                isCumulative ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
              )}
              onClick={() => setIsCumulative(true)}
            >
              Cumulative
            </Button>
          </div>
        </div>

        {/* Trend Charts Row 1: Searches and Completed Rides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LiveTrendChart
            title="Searches"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            metricKey="searches"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
          />
          <LiveTrendChart
            title="Completed Rides"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            metricKey="completedRides"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
          />
        </div>

        {/* Trend Charts Row 2: Conversion and Overall Cancellation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LiveTrendChart
            title="Conversion %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="completedRides"
            denominatorKey="searches"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
          <LiveTrendChart
            title="Overall Cancel %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="cancelledRides"
            denominatorKey="bookings"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
        </div>

        {/* Trend Charts Row 3: RFA, DQA, and Detailed Cancellation Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LiveTrendChart
            title="Rider Fare Acceptance %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="searchForQuotes"
            denominatorKey="searchGotEstimates"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
          <LiveTrendChart
            title="Driver Quote Acceptance %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="quotesAccepted"
            denominatorKey="searchForQuotes"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
          <LiveTrendChart
            title="Driver Cancel %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="driverCancellations"
            denominatorKey="bookings"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
          <LiveTrendChart
            title="Rider Cancel %"
            todayData={liveMetrics.today.data?.data}
            yesterdayData={liveMetrics.yesterday.data?.data}
            lastWeekData={liveMetrics.lastWeek.data?.data}
            numeratorKey="userCancellations"
            denominatorKey="bookings"
            loading={liveMetrics.isLoading}
            isCumulative={isCumulative}
            isRate={true}
          />
        </div>
      </PageContent>
    </Page>
  );
}
