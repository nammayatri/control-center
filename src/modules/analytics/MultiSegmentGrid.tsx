import React from 'react';
import type { Dimension, Granularity, MetricsFilters } from '../../services/execMetrics';
import { SmallTrendChart } from './SmallTrendChart';
import type { GridCell } from '../../hooks/useMultiSegmentTrend';
import { Loader2 } from 'lucide-react';

interface MultiSegmentGridProps {
    segments: (Dimension | "none")[];
    gridData: GridCell[][];
    segment3Values: string[];
    filters: MetricsFilters;
    granularity: Granularity;
    isLoading: boolean;
    selectedMetric?: string; // Which metric to display in charts
}

export const MultiSegmentGrid: React.FC<MultiSegmentGridProps> = ({
    segments,
    gridData,
    segment3Values,
    filters,
    granularity,
    isLoading,
    selectedMetric
}) => {
    const segment3Label = segments[2];

    if (isLoading && (!gridData || gridData.length === 0)) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!gridData || gridData.length === 0 || !gridData[0] || gridData[0].length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                No data available based on your selection.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {gridData.map((row, rowIndex) => (
                <div key={rowIndex} className="space-y-3">
                    {/* Row Header if 3rd segment exists */}
                    {segment3Label && segment3Values[rowIndex] && (
                        <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                            <span className="font-bold text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                {segment3Values[rowIndex]}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {row.map((cell, colIndex) => {
                            const label = `${cell.segment2Value}`;

                            return (
                                <div key={colIndex} className="min-w-0">
                                    <SmallTrendChart
                                        dimension={segments[0] as Dimension} // The 1st segment is the trend lines
                                        label={label}
                                        filters={filters}
                                        granularity={granularity}
                                        preloadedData={cell.chartData}
                                        isLoading={cell.isLoading}
                                        metricToDisplay={selectedMetric}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
