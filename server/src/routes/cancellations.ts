import { Router, Request, Response } from 'express';
import { getCancellationGroupedMetrics } from '../repositories/cancellationsRepository.js';
import type { MetricsFilters, GroupedMetricsResponse } from '../types/metrics.js';

const router = Router();

// Helper: Parse Query Parameters (duplicated from metrics.ts to keep it self-contained)
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

// GET /api/cancellations/grouped
router.get('/grouped', async (req: Request, res: Response) => {
    try {
        const { groupBy } = req.query;

        // Valid dimensions for cancellations
        const validGroupBy = [
            'trip_distance_bkt',
            'fare_breakup',
            'actual_pickup_dist__bkt',
            'pickup_dist_left_bucket',
            'time_to_cancel_bkt',
            'reason_code'
        ];

        if (!groupBy || !validGroupBy.includes(String(groupBy))) {
            res.status(400).json({
                error: 'Invalid groupBy parameter',
                message: `groupBy must be one of: ${validGroupBy.join(', ')}`,
            });
            return;
        }

        const filters = parseFilters(req.query);
        const data = await getCancellationGroupedMetrics(filters, String(groupBy));

        // Reuse GroupedMetricsResponse structure but typing data as any[] or specific
        // Since the interface expects GroupedMetricsRow, and we return CancellationGroupedRow,
        // we might strictly technically mismatch if we used GroupedMetricsResponse interface literally.
        // But for JSON res.json(), it's fine.
        // Or we can define a CancellationGroupedResponse.
        // Let's just send JSON.

        res.json({
            data,
            groupBy: String(groupBy),
            filters,
        });
    } catch (error) {
        console.error('Error fetching grouped cancellation metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch grouped cancellation metrics',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/cancellations/trend
router.get('/trend', async (req: Request, res: Response) => {
    try {
        const { dimension, granularity } = req.query;

        // Valid dimensions for cancellations
        const validDimensions = [
            'trip_distance_bkt',
            'fare_breakup',
            'actual_pickup_dist__bkt',
            'pickup_dist_left_bucket',
            'time_to_cancel_bkt',
            'reason_code'
        ];

        if (!dimension || !validDimensions.includes(String(dimension))) {
            res.status(400).json({
                error: 'Invalid dimension parameter',
                message: `dimension must be one of: ${validDimensions.join(', ')}`
            });
            return;
        }

        const filters = parseFilters(req.query);
        // We need to import getCancellationTrendMetrics from repo. It doesn't exist yet, but I will add it.
        const { getCancellationTrendMetrics } = await import('../repositories/cancellationsRepository.js');

        const data = await getCancellationTrendMetrics(
            filters,
            String(dimension),
            (granularity as 'hour' | 'day') || 'day'
        );

        res.json({
            data,
            dimension: String(dimension),
            granularity: granularity || 'day',
            filters
        });
    } catch (error) {
        console.error('Error fetching cancellation trend metrics:', error);
        res.status(500).json({
            error: 'Failed to fetch cancellation trend metrics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
