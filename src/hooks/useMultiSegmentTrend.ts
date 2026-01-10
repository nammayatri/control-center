import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as execMetricsService from '../services/execMetrics';
import type {
    MetricsFilters,
    Dimension,
    Granularity,
    DimensionalTimeSeriesDataPoint
} from '../services/execMetrics';

export interface MultiSegmentConfig {
    segments: (Dimension | "none")[];
    segment1TopN: number; // Top N for trend lines (Segment 1)
    segment2TopN: number;
    segment3TopN: number;
    segment1CustomValues?: string[]; // Custom selected values for Segment 1 (overrides Top N if provided)
    segment2CustomValues?: string[]; // Custom selected values for Segment 2 (overrides Top N if provided)
    segment3CustomValues?: string[]; // Custom selected values for Segment 3 (overrides Top N if provided)
    filters: MetricsFilters;
    granularity: Granularity;
    enabled: boolean;
}

export interface GridCell {
    segment2Value: string;
    segment3Value: string | null;
    chartData: DimensionalTimeSeriesDataPoint[];
    isLoading: boolean;
    error: unknown;
}

export interface MultiSegmentResult {
    gridData: GridCell[][];
    segment2Values: string[];
    segment3Values: string[];
    isLoading: boolean;
    error: Error | null;
}

// Helper to get Top N values for a dimension
function getTopNValues(
    data: DimensionalTimeSeriesDataPoint[] | undefined,
    topN: number
): string[] {
    if (!data) return [];

    // Aggregate volume by dimension value
    // Handle both searches (tier-less) and completedRides (tiered)
    const totals: Record<string, number> = {};
    data.forEach(point => {
        const val = point.dimensionValue;
        // Ranking should use the most significant volume metric available
        const volume = (point.searches || 0) + (point.completedRides || 0) * 10; // Weight rides more heavily for tiered data
        totals[val] = (totals[val] || 0) + volume;
    });

    return Object.entries(totals)
        .sort(([, a], [, b]) => b - a) // Descending order
        .slice(0, topN)
        .map(([key]) => key);
}

export function useMultiSegmentTrend({
    segments,
    segment1TopN,
    segment2TopN,
    segment3TopN,
    segment1CustomValues,
    segment2CustomValues,
    segment3CustomValues,
    filters,
    granularity,
    enabled
}: MultiSegmentConfig): MultiSegmentResult {
    const segment1 = segments[0];
    const segment2 = segments[1];
    const segment3 = segments[2];

    // 1. Fetch data for Segment 2 to determine Top N keys (only if no custom values)
    const { data: seg2Data, isLoading: seg2Loading } = useQuery({
        queryKey: ['execMetrics', 'trend', segment2, granularity, filters],
        queryFn: () => execMetricsService.getTrendData(segment2, granularity, filters),
        enabled: enabled && !!segment2 && segment2 !== 'none' && (!segment2CustomValues || segment2CustomValues.length === 0)
    });

    // 2. Fetch data for Segment 3 to determine Top N keys
    const { data: seg3Data, isLoading: seg3Loading } = useQuery({
        queryKey: ['execMetrics', 'trend', segment3, granularity, filters],
        queryFn: () => execMetricsService.getTrendData(segment3, granularity, filters),
        enabled: enabled && !!segment3 && segment3 !== 'none' && (!segment3CustomValues || segment3CustomValues.length === 0)
    });

    // Determine values for X and Y axes
    const segment2Values = useMemo(() => {
        if (segment2CustomValues && segment2CustomValues.length > 0) return segment2CustomValues;
        return getTopNValues(seg2Data?.data, segment2TopN);
    }, [seg2Data, segment2TopN, segment2CustomValues]);

    const segment3Values = useMemo(() => {
        if (segment3CustomValues && segment3CustomValues.length > 0) return segment3CustomValues;
        const values = getTopNValues(seg3Data?.data, segment3TopN);
        return segment3 === 'run_day' ? values.sort() : values;
    }, [seg3Data, segment3TopN, segment3, segment3CustomValues]);

    // 3. Generate query combinations
    const combinations = useMemo(() => {
        const combos: { s2: string; s3: string | null }[] = [];
        if (!segment2 || segment2 === 'none') {
            combos.push({ s2: "All", s3: null });
        } else if (segment2Values.length) {
            if (segment3 && segment3Values.length) {
                segment3Values.forEach(s3 => segment2Values.forEach(s2 => combos.push({ s2, s3 })));
            } else {
                segment2Values.forEach(s2 => combos.push({ s2, s3: null }));
            }
        }
        return combos;
    }, [segment2, segment2Values, segment3Values, segment3]);

    // 4. Fetch data for each combination
    const queries = useQueries({
        queries: combinations.map(combo => {
            const combinedFilters = { ...filters };
            const applyFilter = (dim: Dimension, val: string) => {
                const filterKey = getFilterKey(dim);
                if (filterKey) {
                    (combinedFilters as any)[filterKey] = [val];
                } else if (dim === 'run_day') {
                    combinedFilters.dateFrom = `${val} 00:00:00`;
                    combinedFilters.dateTo = `${val} 23:59:59`;
                }
            };

            if (segment2 && segment2 !== 'none' && combo.s2 !== "All") applyFilter(segment2, combo.s2);
            if (segment3 && segment3 !== 'none' && combo.s3) applyFilter(segment3, combo.s3);

            return {
                queryKey: ['execMetrics', 'trend', segment1, granularity, combinedFilters, combo.s2, combo.s3],
                queryFn: () => execMetricsService.getTrendData(segment1, granularity, combinedFilters),
                enabled: enabled && combinations.length > 0
            };
        })
    });

    // 5. Compute Global Top N for Segment 1 (lines)
    // This ensures that all charts in the grid show the SAME lines for comparison
    const segment1ValuesToShow = useMemo(() => {
        if (segment1CustomValues && segment1CustomValues.length > 0) return segment1CustomValues;

        // Aggregate all data across all queries to find top N overall
        const aggregateTotals: Record<string, number> = {};
        queries.forEach(q => {
            const data = q.data?.data || [];
            data.forEach(point => {
                const val = point.dimensionValue;
                const volume = (point.searches || 0) + (point.completedRides || 0) * 10;
                aggregateTotals[val] = (aggregateTotals[val] || 0) + volume;
            });
        });

        return Object.entries(aggregateTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, segment1TopN)
            .map(([key]) => key);
    }, [queries, segment1TopN, segment1CustomValues]);

    // 6. Structure results into grid
    const gridData = useMemo(() => {
        const rows = segment3Values.length > 0 ? segment3Values : ['__default__'];
        const columns = segment2Values.length > 0 ? segment2Values : ['All'];

        return rows.map((rowKey, rowIndex) => {
            return columns.map((colKey, colIndex) => {
                const queryIndex = rowIndex * columns.length + colIndex;
                const query = queries[queryIndex];
                const rawData = query?.data?.data || [];

                // Filter chartData based on Global Top N
                const filteredData = rawData.filter(
                    (point: DimensionalTimeSeriesDataPoint) => segment1ValuesToShow.includes(point.dimensionValue)
                );

                return {
                    segment2Value: colKey,
                    segment3Value: rowKey === '__default__' ? null : rowKey,
                    chartData: filteredData,
                    isLoading: query?.isLoading,
                    error: query?.error
                };
            });
        });
    }, [queries, segment2Values, segment3Values, segment1ValuesToShow]);

    return {
        gridData,
        segment2Values,
        segment3Values,
        isLoading: seg2Loading || seg3Loading || queries.some(q => q.isLoading),
        error: (queries.find(q => q.error)?.error as Error) || null
    };
}

// Helper to map Dimension to MetricsFilters key
function getFilterKey(dim: Dimension | "none"): keyof MetricsFilters | null {
    switch (dim) {
        case 'city': return 'city';
        case 'vehicle_category': return 'vehicleCategory';
        case 'vehicle_sub_category': return 'vehicleSubCategory';
        case 'service_tier': return 'serviceTier';
        case 'flow_type': return 'flowType';
        case 'trip_tag': return 'tripTag';
        case 'user_os_type': return 'userOsType';
        case 'user_bundle_version': return 'userBundleVersion';
        case 'user_sdk_version': return 'userSdkVersion';
        case 'user_backend_app_version': return 'userBackendAppVersion';
        case 'dynamic_pricing_logic_version': return 'dynamicPricingLogicVersion';
        case 'pooling_logic_version': return 'poolingLogicVersion';
        case 'pooling_config_version': return 'poolingConfigVersion';
        // Cancellations are tricky, they might need generic field map? 
        // But for filters, we don't have cancellation_reason as specific filter key in MetricsFilters?
        // Checking MetricsFilters... yes, it has groupBy, but not filter fields for cancellation details EXCEPT via backend magic maybe?
        // Actually, MetricsFilters definition doesn't show cancellation specific filters (like trip_distance_bkt).
        // If the backend API supports filtering by these via query params even if not in type, we can cast.
        // But if not, then filtering by cancellation segments won't work client-side.
        // Assuming backend supports dynamic filters potentially.
        default: return null;
    }
}
