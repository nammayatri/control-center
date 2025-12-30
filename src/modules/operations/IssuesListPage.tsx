import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useIssuesList } from '../../hooks/useIssues';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Search, RotateCcw, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

// Status Badge Helper
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'OPEN':
            return <Badge variant="destructive">OPEN</Badge>;
        case 'RESOLVED':
            return <Badge variant="success">RESOLVED</Badge>; // Assuming success variant exists or use default green logic
        case 'CLOSED':
            return <Badge variant="outline">CLOSED</Badge>;
        case 'PENDING_INTERNAL':
            return <Badge variant="secondary">PENDING INT</Badge>;
        case 'PENDING_EXTERNAL':
            return <Badge variant="secondary">PENDING EXT</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function IssuesListPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState<string>('OPEN');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'phone' | 'category' | 'description'>('phone');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [assignee, setAssignee] = useState('');

    // Applied filters (used for query)
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        searchType: 'phone' as 'phone' | 'category' | 'description',
        assignee: '',
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, searchType]); // Also depend on type

    useEffect(() => {
        setPage(0);
        setAppliedFilters(prev => ({ ...prev, search: debouncedSearch, searchType }));
    }, [debouncedSearch, searchType]);

    const getSearchParams = (query: string, type: string) => {
        if (!query.trim()) return {};
        const trimmed = query.trim();
        switch (type) {
            case 'category':
                return { categoryName: trimmed };
            case 'description':
                return { description: trimmed };
            case 'phone':
            default:
                return { phoneNumber: trimmed };
        }
    };

    const toUtcString = (dateStr: string, isEndOfDay = false) => {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        if (isEndOfDay) {
            date.setHours(23, 59, 59, 999);
        } else {
            date.setHours(0, 0, 0, 0);
        }
        return date.toISOString();
    };

    // Derived params for query
    const searchParams = getSearchParams(appliedFilters.search, appliedFilters.searchType);
    const queryParams = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        status,
        ...searchParams,
        assignee: appliedFilters.assignee || undefined,
        fromDate: appliedFilters.fromDate || undefined,
        toDate: appliedFilters.toDate || undefined,
    };

    const { data, isLoading, isError, isFetching } = useIssuesList(queryParams);

    // Auto-apply dates when they change
    useEffect(() => {
        if (!fromDate && !toDate) {
            setAppliedFilters(prev => ({ ...prev, fromDate: '', toDate: '' }));
            return;
        }

        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            alert('From Date cannot be later than To Date');
            return;
        }

        setAppliedFilters(prev => ({
            ...prev,
            fromDate: toUtcString(fromDate) || '',
            toDate: toUtcString(toDate, true) || ''
        }));
        setPage(0);
    }, [fromDate, toDate]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        console.log('Searching with:', { searchQuery, searchType, assignee });
        setPage(0); // Reset page on new search
        setAppliedFilters(prev => ({
            ...prev,
            search: searchQuery.trim(),
            searchType,
            assignee: assignee.trim()
        }));
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSearchType('phone');
        setAssignee('');
        setFromDate('');
        setToDate('');
        setAppliedFilters({ search: '', searchType: 'phone', assignee: '', fromDate: '', toDate: '' });
        setPage(0);
    };

    return (
        <Page>
            <PageHeader
                title="Issue Management"
                description="Track and resolve customer support issues"
                actions={
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex items-center gap-1 border rounded-md px-2 py-1 bg-background shadow-sm transition-colors",
                            fromDate && toDate && new Date(fromDate) > new Date(toDate) ? "border-red-500 bg-red-50/50" : "border-input"
                        )}>
                            <span className="text-xs font-medium text-muted-foreground">From:</span>
                            <input
                                type="date"
                                className="text-sm bg-transparent border-none outline-none focus:ring-0"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                            <span className="text-xs font-medium text-muted-foreground ml-1">To:</span>
                            <input
                                type="date"
                                className="text-sm bg-transparent border-none outline-none focus:ring-0"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                            {(fromDate || toDate) && (
                                <button
                                    onClick={() => { setFromDate(''); setToDate(''); }}
                                    className="ml-1 text-muted-foreground hover:text-foreground p-0.5"
                                    title="Clear Dates"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                }
            />
            <PageContent>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div>
                                <CardTitle>Issues</CardTitle>
                                <CardDescription>
                                    View and manage reported issues
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="flex gap-2 w-full md:w-auto items-center flex-wrap justify-end">
                                    <Select value={status} onValueChange={(val) => { setStatus(val); setPage(0); }}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OPEN">Open</SelectItem>
                                            <SelectItem value="PENDING_INTERNAL">Pending Internal</SelectItem>
                                            <SelectItem value="PENDING_EXTERNAL">Pending External</SelectItem>
                                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            <SelectItem value="CLOSED">Closed</SelectItem>
                                            <SelectItem value="REOPENED">Reopened</SelectItem>
                                            <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <form onSubmit={handleSearch} className="flex gap-2 items-center">
                                        <Select value={searchType} onValueChange={(val: 'phone' | 'category' | 'description') => setSearchType(val)}>
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="phone">Phone</SelectItem>
                                                <SelectItem value="category">Category</SelectItem>
                                                <SelectItem value="description">Description</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder={`Search by ${searchType}...`}
                                                className="pl-8 w-[200px]"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder="Assignee (exact)"
                                                className="w-[140px]"
                                                value={assignee}
                                                onChange={(e) => setAssignee(e.target.value)}
                                            />
                                        </div>
                                        <Button type="button" variant="secondary" disabled={isFetching} onClick={() => handleSearch()}>
                                            {isFetching ? '...' : 'Search'}
                                        </Button>
                                    </form>
                                    <Button variant="outline" size="icon" onClick={resetFilters} title="Reset Filters">
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-10 text-red-500">
                                Failed to load issues. Please try again.
                            </div>
                        ) : !data?.issues.length ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No issues found matching criteria.
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Short ID</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Assignee</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.issues.map((issue) => (
                                            <TableRow key={issue.issueReportId} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/ops/issues/${issue.issueReportId}`)}>
                                                <TableCell className="font-mono text-sm">{issue.issueReportShortId}</TableCell>
                                                <TableCell>{format(new Date(issue.createdAt), 'MMM d, h:mm a')}</TableCell>
                                                <TableCell>{issue.category}</TableCell>
                                                <TableCell>{issue.assignee || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                                                <TableCell>{getStatusBadge(issue.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/ops/issues/${issue.issueReportId}`); }}>
                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {data && (
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {page + 1}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={data.issues.length < PAGE_SIZE}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContent>
        </Page >
    );
}
