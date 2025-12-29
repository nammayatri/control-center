import { useQuery } from '@tanstack/react-query';
import * as execMetricsService from '../services/execMetrics';
import type { MetricsFilters } from '../services/execMetrics';

export function useExecutiveMetrics(filters: MetricsFilters = {}) {
    return useQuery({
        queryKey: ['execMetrics', 'executive', filters],
        queryFn: () => execMetricsService.getExecutiveMetrics(filters),
    });
}

export function useConversionMetrics(filters: MetricsFilters = {}) {
    return useQuery({
        queryKey: ['execMetrics', 'conversion', filters],
        queryFn: () => execMetricsService.getConversionMetrics(filters),
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

export function useTimeSeries(filters: MetricsFilters = {}) {
    return useQuery({
        queryKey: ['execMetrics', 'timeseries', filters],
        queryFn: () => execMetricsService.getTimeSeries(filters),
    });
}

export function useFilterOptions() {
    return useQuery({
        queryKey: ['execMetrics', 'filterOptions'],
        queryFn: () => execMetricsService.getFilterOptions(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

export function useGroupedMetrics(
    groupBy: 'city' | 'flow_type' | 'trip_tag' | 'variant',
    filters: MetricsFilters = {},
    enabled = true
) {
    return useQuery({
        queryKey: ['execMetrics', 'grouped', groupBy, filters],
        queryFn: () => execMetricsService.getGroupedMetrics(groupBy, filters),
        enabled,
    });
}
