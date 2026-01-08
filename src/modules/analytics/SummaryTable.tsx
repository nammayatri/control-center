import { useState, useMemo } from "react";
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export interface SummaryTableRow {
    id: string; // Unique ID (e.g., dimension value)
    label: string; // Display name

    // Metrics
    searches: number;
    quotesRequested: number;
    quotesAccepted: number;
    bookings: number;
    completedRides: number;
    cancelledRides: number;
    earnings: number;

    // Rates (pre-calculated or calculated on the fly? Better pre-calculated)
    conversionRate: number;
    riderFareAcceptance: number;
    driverQuoteAcceptance: number;
    cancellationRate: number;

    // Changes for comparison
    changes?: {
        [key in keyof Omit<SummaryTableRow, 'id' | 'label' | 'changes'>]?: number;
    };
}

interface SummaryTableProps {
    data: SummaryTableRow[];
    title?: string;
    loading?: boolean;
    showComparison?: boolean;
}

type SortConfig = {
    key: keyof SummaryTableRow;
    direction: "asc" | "desc";
} | null;

export function SummaryTable({ data, title = "Summary Table", loading = false, showComparison = false }: SummaryTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "completedRides", direction: "desc" });

    // Filter
    const filteredData = useMemo(() => {
        return data.filter((row) =>
            row.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    // Sort
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key] ?? 0;
            const bValue = b[sortConfig.key] ?? 0;

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const requestSort = (key: keyof SummaryTableRow) => {
        let direction: "asc" | "desc" = "desc"; // Default to desc for metrics
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof SummaryTableRow) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
        }
        return sortConfig.direction === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3 text-primary" />
        ) : (
            <ArrowDown className="ml-2 h-3 w-3 text-primary" />
        );
    };

    const downloadCSV = () => {
        const headers = [
            "Label",
            "Searches",
            "Quotes Req",
            "Quotes Acc",
            "Bookings",
            "Completed",
            "Cancelled",
            "Earnings",
            "Conversion %",
            "RFA %",
            "DQA %",
            "Cancellation %"
        ];

        const csvRows = [
            headers.join(","),
            ...sortedData.map(row => [
                `"${row.label}"`,
                row.searches,
                row.quotesRequested,
                row.quotesAccepted,
                row.bookings,
                row.completedRides,
                row.cancelledRides,
                row.earnings.toFixed(2),
                row.conversionRate.toFixed(2),
                row.riderFareAcceptance.toFixed(2),
                row.driverQuoteAcceptance.toFixed(2),
                row.cancellationRate.toFixed(2)
            ].join(","))
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `summary_table_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatPercent = (num: number) => `${num.toFixed(2)}%`;
    const formatCurrency = (num: number) => `₹${formatNumber(num)}`;

    const renderCell = (value: number, change: number | undefined, format: (n: number) => string, inverse = false) => {
        return (
            <div className="flex flex-col items-end">
                <span>{format(value)}</span>
                {showComparison && change !== undefined && Math.abs(change) > 0.01 && (
                    <span className={`text-[10px] ${(inverse ? change < 0 : change > 0) ? "text-green-500" : "text-red-500"
                        }`}>
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </span>
                )}
            </div>
        );
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Summary Table"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 w-[250px] bg-white dark:bg-zinc-900"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadCSV} className="h-9 gap-2">
                        <Download className="h-4 w-4" />
                        Export Table
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                            <TableHead className="w-[180px] cursor-pointer" onClick={() => requestSort("label")}>
                                <div className="flex items-center">
                                    Label {getSortIcon("label")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("searches")}>
                                <div className="flex items-center justify-end">
                                    Searches {getSortIcon("searches")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("quotesRequested")}>
                                <div className="flex items-center justify-end">
                                    Quotes Req. {getSortIcon("quotesRequested")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("quotesAccepted")}>
                                <div className="flex items-center justify-end">
                                    Quotes Acc. {getSortIcon("quotesAccepted")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("bookings")}>
                                <div className="flex items-center justify-end">
                                    Bookings {getSortIcon("bookings")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("completedRides")}>
                                <div className="flex items-center justify-end">
                                    Completed {getSortIcon("completedRides")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("cancelledRides")}>
                                <div className="flex items-center justify-end">
                                    Cancelled {getSortIcon("cancelledRides")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("earnings")}>
                                <div className="flex items-center justify-end">
                                    Earnings {getSortIcon("earnings")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("conversionRate")}>
                                <div className="flex items-center justify-end">
                                    Conv. % {getSortIcon("conversionRate")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("riderFareAcceptance")}>
                                <div className="flex items-center justify-end">
                                    RFA % {getSortIcon("riderFareAcceptance")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("driverQuoteAcceptance")}>
                                <div className="flex items-center justify-end">
                                    DQA % {getSortIcon("driverQuoteAcceptance")}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort("cancellationRate")}>
                                <div className="flex items-center justify-end">
                                    Cancel % {getSortIcon("cancellationRate")}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px]" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                                    No data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium text-xs">{row.label}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.searches, row.changes?.searches, formatNumber)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.quotesRequested, row.changes?.quotesRequested, formatNumber)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.quotesAccepted, row.changes?.quotesAccepted, formatNumber)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.bookings, row.changes?.bookings, formatNumber)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.completedRides, row.changes?.completedRides, formatNumber)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.cancelledRides, row.changes?.cancelledRides, formatNumber, true)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.earnings, row.changes?.earnings, formatCurrency)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.conversionRate, row.changes?.conversionRate, formatPercent)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.riderFareAcceptance, row.changes?.riderFareAcceptance, formatPercent)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.driverQuoteAcceptance, row.changes?.driverQuoteAcceptance, formatPercent)}</TableCell>
                                    <TableCell className="text-right text-xs py-2">{renderCell(row.cancellationRate, row.changes?.cancellationRate, formatPercent, true)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
