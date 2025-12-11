import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // Filter states (local, not applied yet)
    const [phoneNumber, setPhoneNumber] = useState('');
    const [assignee, setAssignee] = useState('');

    // Applied filters (used for query)
    const [appliedFilters, setAppliedFilters] = useState({
        phoneNumber: '',
        assignee: ''
    });

    // Derived params for query
    const queryParams = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        status,
        phoneNumber: appliedFilters.phoneNumber || undefined,
        assignee: appliedFilters.assignee || undefined,
    };

    const { data, isLoading, isError, isFetching } = useIssuesList(queryParams);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        console.log('Searching with:', { phoneNumber, assignee });
        setPage(0); // Reset page on new search
        setAppliedFilters({
            phoneNumber,
            assignee
        });
    };

    const resetFilters = () => {
        setPhoneNumber('');
        setAssignee('');
        setAppliedFilters({ phoneNumber: '', assignee: '' });
        setPage(0);
    };

    return (
        <Page>
            <PageHeader title="Issue Management" description="Track and resolve customer support issues" />
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
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Phone..."
                                                className="pl-8 w-[140px]"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
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
                        {data && data.summary.totalCount > PAGE_SIZE && (
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
                                    Page {page + 1} of {Math.ceil(data.summary.totalCount / PAGE_SIZE)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * PAGE_SIZE >= data.summary.totalCount}
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
