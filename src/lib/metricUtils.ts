/**
 * Shared utility functions for metric display and color coding
 */

// Metrics where an increase is BAD for business (should show red when going up)
export const NEGATIVE_METRICS = [
    'cancellations',
    'cancelledRides',
    'driverCancellations',
    'userCancellations',
    'otherCancellations',
    'cancellationRate',
    'driverCancellationRate',
    'userCancellationRate',
    'otherCancellationRate',
];

/**
 * Get the appropriate color class for a trend change
 * @param change - The percentage or absolute change value
 * @param metricKey - The metric identifier to determine if it's a negative metric
 * @returns Tailwind CSS color class
 */
export function getTrendColor(change: number | undefined, metricKey: string): string {
    if (change === undefined || change === 0) return 'text-muted-foreground';

    const isNegativeMetric = NEGATIVE_METRICS.some(
        (m) => metricKey.toLowerCase().includes(m.toLowerCase())
    );

    // For negative metrics: decrease = good (green), increase = bad (red)
    // For positive metrics: increase = good (green), decrease = bad (red)
    const isGood = isNegativeMetric ? change < 0 : change > 0;

    return isGood ? 'text-green-600' : 'text-red-600';
}

/**
 * Get the appropriate background color for a trend change (for charts)
 * @param change - The percentage or absolute change value
 * @param metricKey - The metric identifier
 * @returns Hex color code
 */
export function getTrendChartColor(change: number | undefined, metricKey: string): string {
    if (change === undefined || change === 0) return '#6b7280'; // gray

    const isNegativeMetric = NEGATIVE_METRICS.some(
        (m) => metricKey.toLowerCase().includes(m.toLowerCase())
    );

    const isGood = isNegativeMetric ? change < 0 : change > 0;

    return isGood ? '#22c55e' : '#ef4444'; // green : red
}

/**
 * Check if a metric is a negative metric (where increase is bad)
 */
export function isNegativeMetric(metricKey: string): boolean {
    return NEGATIVE_METRICS.some(
        (m) => metricKey.toLowerCase().includes(m.toLowerCase())
    );
}

/**
 * Format a number with K/M suffixes
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number | undefined {
    if (!previous || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
}
