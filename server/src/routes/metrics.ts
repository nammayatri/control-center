import { Router, Request, Response } from 'express';
import {
    getExecutiveMetrics,
    getConversionMetrics,
    getComparisonMetrics,
    getTimeSeries,
    getFilterOptions,
    getGroupedMetrics,
} from '../repositories/metricsRepository.js';
import type {
    MetricsFilters,
    SortOptions,
    ExecutiveMetricsResponse,
    ConversionMetricsResponse,
    ComparisonMetricsResponse,
    TimeSeriesResponse,
    FilterOptionsResponse,
    GroupedMetricsResponse,
} from '../types/metrics.js';

const router = Router();

// ============================================
// Helper: Parse Query Parameters
// ============================================

function parseFilters(query: Record<string, unknown>): MetricsFilters {
    const parseArray = (value: unknown): string[] | undefined => {
        if (!value) return undefined;
        if (typeof value === 'string') {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(value)) {
            return value.map(String);
        }
        return undefined;
    };

    return {
        dateFrom: query.dateFrom ? String(query.dateFrom) : undefined,
        dateTo: query.dateTo ? String(query.dateTo) : undefined,
        city: parseArray(query.city),
        flowType: parseArray(query.flowType),
        tripTag: parseArray(query.tripTag),
        variant: parseArray(query.variant),
    };
}

function parseSortOptions(query: Record<string, unknown>): SortOptions {
    return {
        sortBy: query.sortBy ? String(query.sortBy) : undefined,
        sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
    };
}

// ============================================
// GET /api/metrics/executive
// ============================================

router.get('/executive', async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req.query);
        const { totals, drivers, riders } = await getExecutiveMetrics(filters);

        const response: ExecutiveMetricsResponse = {
            totals,
            drivers,
            riders,
            filters,
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching executive metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch executive metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// ============================================
// GET /api/metrics/conversion
// ============================================

router.get('/conversion', async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req.query);
        const { funnel, cancellation } = await getConversionMetrics(filters);

        const response: ConversionMetricsResponse = {
            funnel,
            cancellation,
            filters,
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching conversion metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch conversion metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// ============================================
// GET /api/metrics/comparison
// ============================================

router.get('/comparison', async (req: Request, res: Response) => {
    try {
        const { currentFrom, currentTo, previousFrom, previousTo } = req.query;

        if (!currentFrom || !currentTo || !previousFrom || !previousTo) {
            res.status(400).json({
                error: 'Missing required parameters',
                message: 'currentFrom, currentTo, previousFrom, previousTo are required',
            });
            return;
        }

        const filters = parseFilters(req.query);
        const { current, previous, change } = await getComparisonMetrics(
            String(currentFrom),
            String(currentTo),
            String(previousFrom),
            String(previousTo),
            filters
        );

        const response: ComparisonMetricsResponse = {
            current,
            previous,
            change,
            currentPeriod: { from: String(currentFrom), to: String(currentTo) },
            previousPeriod: { from: String(previousFrom), to: String(previousTo) },
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching comparison metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch comparison metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// ============================================
// GET /api/metrics/timeseries
// ============================================

router.get('/timeseries', async (req: Request, res: Response) => {
    try {
        const filters = parseFilters(req.query);
        const sort = parseSortOptions(req.query);
        const data = await getTimeSeries(filters, sort);

        const response: TimeSeriesResponse = {
            data,
            filters,
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching time series:', error);
        res.status(500).json({
            error: 'Failed to fetch time series',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// ============================================
// GET /api/metrics/filters
// ============================================

router.get('/filters', async (_req: Request, res: Response) => {
    try {
        const options: FilterOptionsResponse = await getFilterOptions();
        res.json(options);
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({
            error: 'Failed to fetch filter options',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// ============================================
// GET /api/metrics/grouped
// ============================================

router.get('/grouped', async (req: Request, res: Response) => {
    try {
        const { groupBy } = req.query;
        const validGroupBy = ['city', 'flow_type', 'trip_tag', 'variant'];

        if (!groupBy || !validGroupBy.includes(String(groupBy))) {
            res.status(400).json({
                error: 'Invalid groupBy parameter',
                message: `groupBy must be one of: ${validGroupBy.join(', ')}`,
            });
            return;
        }

        const filters = parseFilters(req.query);
        const sort = parseSortOptions(req.query);
        const data = await getGroupedMetrics(
            filters,
            groupBy as 'city' | 'flow_type' | 'trip_tag' | 'variant',
            sort
        );

        const response: GroupedMetricsResponse = {
            data,
            groupBy: String(groupBy),
            filters,
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching grouped metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch grouped metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
