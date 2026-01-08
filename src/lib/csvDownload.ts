/**
 * Utility functions for downloading data as CSV files
 */

/**
 * Convert an array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(data: T[]): string {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV header row
    const headerRow = headers.map(escapeCSVValue).join(',');

    // Create data rows
    const dataRows = data.map(row =>
        headers.map(header => escapeCSVValue(row[header])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: unknown): string {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // If value contains comma, newline, or quote, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Download data as a CSV file
 * @param data - Array of objects to convert to CSV
 * @param filename - Name of the file (without extension)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadCSV(
    data: object[],
    filename: string
): void {
    if (data.length === 0) {
        console.warn('No data to download');
        return;
    }

    const csv = arrayToCSV(data as Record<string, unknown>[]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate a filename with timestamp
 */
export function generateFilename(baseName: string, dateFrom?: string, dateTo?: string): string {
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();

    if (dateFrom && dateTo) {
        const from = dateFrom.split(' ')[0]; // Get just the date part
        const to = dateTo.split(' ')[0];
        return `${sanitizedName}_${from}_to_${to}`;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedName}_${timestamp}`;
}
