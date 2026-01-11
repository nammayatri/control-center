import { format } from 'date-fns';

interface TickFormatterOptions {
    granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Smart X-axis tick formatter
 * - Shows date at midnight transitions
 * - Shows time only for other hours
 * - First tick always shows date
 */
export function createSmartXAxisFormatter(options: TickFormatterOptions) {
    // We return a pure function that formats based on value and index
    // This avoids closure state management issues with Recharts re-renders
    return (value: string | number, index: number) => {
        const date = new Date(value);
        const hour = date.getHours();

        // For daily/weekly/monthly granularity, always show appropriate date
        if (options.granularity === 'day') {
            return format(date, 'MMM d');
        }
        if (options.granularity === 'week') {
            return format(date, 'MMM d');
        }
        if (options.granularity === 'month') {
            return format(date, 'MMM yyyy');
        }

        // For hourly granularity
        if (options.granularity === 'hour') {
            // First tick (index 0) OR midnight (hour 0) -> Show Date
            if (index === 0 || hour === 0) {
                return format(date, 'd MMM'); // "11 Jan"
            }

            // Otherwise, show time only
            return format(date, 'HH:mm'); // "01:00"
        }

        return format(date, 'd MMM HH:mm');
    };
}

/**
 * Calculate a "nice" domain for Y-axis
 * Returns [min, max] with round numbers
 */
export function calculateNiceDomain(
    data: any[],
    dataKeys: string[]
): [number, number] {
    // Get all values across all data keys
    let allValues: number[] = [];

    dataKeys.forEach(key => {
        if (!data) return;
        data.forEach(point => {
            if (point[key] != null && !isNaN(point[key])) {
                allValues.push(Number(point[key]));
            }
        });
    });

    if (allValues.length === 0) {
        return [0, 100];
    }

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    // If max is 0, return default
    if (maxValue === 0) return [0, 10];

    // Calculate range and nice step
    // If range is 0 (all values same), default to 0-value*1.2
    let range = maxValue - minValue;
    if (range === 0) {
        range = maxValue;
    }

    const targetTicks = 5;
    const roughStep = range / targetTicks;

    // Round step to nice number (1, 2, 5, 10, 20, 50, 100, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;

    let niceStep: number;
    if (residual <= 1.5) {
        niceStep = magnitude;
    } else if (residual <= 3) {
        niceStep = 2 * magnitude;
    } else if (residual <= 7) {
        niceStep = 5 * magnitude;
    } else {
        niceStep = 10 * magnitude;
    }

    // Calculate nice min and max
    // We generally want Y-axis to start at 0 for bar/area charts, but for line charts
    // showing trends, sometimes we might want to zoom in. 
    // However, for this use case (Requests/Rates), starting at 0 is usually safer unless specified.
    const niceMin = 0; // Keeping floor at 0 for now as requested
    const niceMax = Math.ceil((maxValue * 1.15) / niceStep) * niceStep; // 15% padding

    return [niceMin, niceMax];
}

/**
 * Format Y-axis values with K/M suffixes
 */
export function formatYAxisValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
}
