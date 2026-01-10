import { useQuery } from '@tanstack/react-query';
import * as execMetricsService from '../services/execMetrics';
import type { MetricsFilters, Dimension, Granularity } from '../services/execMetrics';

export function useExecutiveMetrics(filters: MetricsFilters = {}) {
    return useQuery({
        queryKey: ['execMetrics', 'executive', filters],
        queryFn: () => execMetricsService.getExecutiveMetrics(filters),
    });
}

export function useComparisonMetrics(
    currentFrom: string,
    currentTo: string,
    previousFrom: string,
    previousTo: string,
    filters: MetricsFilters = {},
    enabled = true
) {
    return useQuery({
        queryKey: ['execMetrics', 'comparison', currentFrom, currentTo, previousFrom, previousTo, filters],
        queryFn: () => execMetricsService.getComparisonMetrics(
            currentFrom,
            currentTo,
            previousFrom,
            previousTo,
            filters
        ),
        enabled: enabled && !!currentFrom && !!currentTo && !!previousFrom && !!previousTo,
    });
}

export function useTimeSeries(
    filters: MetricsFilters = {},
    granularity: Granularity = 'day'
) {
    return useQuery({
        queryKey: ['execMetrics', 'timeseries', filters, granularity],
        queryFn: () => execMetricsService.getTimeSeries(filters, granularity),
    });
}

export function useTrendData(
    dimension: Dimension | 'none',
    granularity: Granularity,
    filters: MetricsFilters = {}
) {
    return useQuery({
        queryKey: ['execMetrics', 'trend', dimension, granularity, filters],
        queryFn: () => execMetricsService.getTrendData(dimension, granularity, filters),
    });
}

export function useFilterOptions() {
    return useQuery({
        queryKey: ['execMetrics', 'filterOptions'],
        queryFn: () => execMetricsService.getFilterOptions(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}


