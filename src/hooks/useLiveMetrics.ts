import { useMemo } from 'react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useTimeSeries } from './useExecMetrics';
import type { MetricsFilters, Granularity } from '../services/execMetrics';

/**
 * Hook to fetch live metrics with comparison data for:
 * - Today (current day)
 * - Yesterday
 * - Same day last week
 */
export function useLiveMetrics(
    filters: Omit<MetricsFilters, 'dateFrom' | 'dateTo'> = {},
    granularity: Granularity = 'hour'
) {
    const now = new Date();

    // Today: from start of day to current time
    const todayFilters = useMemo(
        () => ({
            ...filters,
            dateFrom: format(startOfDay(now), 'yyyy-MM-dd HH:mm:ss'),
            dateTo: format(endOfDay(now), 'yyyy-MM-dd HH:mm:ss'),
        }),
        [filters, now]
    );

    // Yesterday: full day
    const yesterdayFilters = useMemo(
        () => ({
            ...filters,
            dateFrom: format(startOfDay(subDays(now, 1)), 'yyyy-MM-dd HH:mm:ss'),
            dateTo: format(endOfDay(subDays(now, 1)), 'yyyy-MM-dd HH:mm:ss'),
        }),
        [filters, now]
    );

    // Same day last week: full day
    const lastWeekFilters = useMemo(
        () => ({
            ...filters,
            dateFrom: format(startOfDay(subDays(now, 7)), 'yyyy-MM-dd HH:mm:ss'),
            dateTo: format(endOfDay(subDays(now, 7)), 'yyyy-MM-dd HH:mm:ss'),
        }),
        [filters, now]
    );

    const todayQuery = useTimeSeries(todayFilters, granularity);
    const yesterdayQuery = useTimeSeries(yesterdayFilters, granularity);
    const lastWeekQuery = useTimeSeries(lastWeekFilters, granularity);

    return {
        today: todayQuery,
        yesterday: yesterdayQuery,
        lastWeek: lastWeekQuery,
        isLoading:
            todayQuery.isLoading ||
            yesterdayQuery.isLoading ||
            lastWeekQuery.isLoading,
        refetch: () => {
            todayQuery.refetch();
            yesterdayQuery.refetch();
            lastWeekQuery.refetch();
        },
    };
}
