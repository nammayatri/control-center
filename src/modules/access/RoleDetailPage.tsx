import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { useRoleAccessMatrix, useAssignAccessLevel } from '../../hooks/useAdmin';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Shield,
    Search,
    Check,
    X,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { Switch } from '../../components/ui/switch';

export function RoleDetailPage() {
    const { roleId } = useParams<{ roleId: string }>();
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [entityFilter, setEntityFilter] = useState<string>('all');
    const [accessFilter, setAccessFilter] = useState<string>('all');
    const [addAccessDialogOpen, setAddAccessDialogOpen] = useState(false);
    const [newAccess, setNewAccess] = useState({
        apiEntity: '',
        userActionType: '',
        userAccessType: 'USER_FULL_ACCESS' as 'USER_FULL_ACCESS' | 'USER_NO_ACCESS',
    });

    const { data, isLoading, refetch } = useRoleAccessMatrix(roleId || '');
    const assignAccessMutation = useAssignAccessLevel();

    // Get unique entities for filter
    const uniqueEntities = useMemo(() => {
        if (!data?.accessMatrixRow) return [];
        const entities = new Set(data.accessMatrixRow.map((row) => row.apiEntity));
        return Array.from(entities).sort();
    }, [data]);

    // Filter and search access matrix
    const filteredAccessMatrix = useMemo(() => {
        if (!data?.accessMatrixRow) return [];

        return data.accessMatrixRow.filter((row) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !row.apiEntity.toLowerCase().includes(query) &&
                    !row.userActionType.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Entity filter
            if (entityFilter !== 'all' && row.apiEntity !== entityFilter) {
                return false;
            }

            // Access type filter
            if (accessFilter !== 'all' && row.userAccessType !== accessFilter) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            // Sort by entity first, then by action type
            const entityCompare = a.apiEntity.localeCompare(b.apiEntity);
            if (entityCompare !== 0) return entityCompare;
            return a.userActionType.localeCompare(b.userActionType);
        });
    }, [data, searchQuery, entityFilter, accessFilter]);

    // Group by entity for summary
    const entitySummary = useMemo(() => {
        if (!data?.accessMatrixRow) return {};

        const summary: Record<string, { full: number; none: number }> = {};
        data.accessMatrixRow.forEach((row) => {
            if (!summary[row.apiEntity]) {
                summary[row.apiEntity] = { full: 0, none: 0 };
            }
            if (row.userAccessType === 'USER_FULL_ACCESS') {
                summary[row.apiEntity].full++;
            } else {
                summary[row.apiEntity].none++;
            }
        });
        return summary;
    }, [data]);

    const handleToggleAccess = async (
        apiEntity: string,
        userActionType: string,
        currentAccess: string
    ) => {
        if (!roleId) return;

        const newAccessType = currentAccess === 'USER_FULL_ACCESS' ? 'USER_NO_ACCESS' : 'USER_FULL_ACCESS';

        try {
            await assignAccessMutation.mutateAsync({
                roleId,
                data: {
                    apiEntity,
                    userActionType,
                    userAccessType: newAccessType,
                },
            });
            toast.success(`Access updated to ${newAccessType === 'USER_FULL_ACCESS' ? 'Full Access' : 'No Access'}`);
        } catch (err) {
            toast.error('Failed to update access');
            console.error('Failed to update access:', err);
        }
    };

    const handleAddAccess = async () => {
        if (!roleId || !newAccess.apiEntity || !newAccess.userActionType) return;

        try {
            await assignAccessMutation.mutateAsync({
                roleId,
                data: newAccess,
            });
            toast.success('Access added successfully');
            setAddAccessDialogOpen(false);
            setNewAccess({
                apiEntity: '',
                userActionType: '',
                userAccessType: 'USER_FULL_ACCESS',
            });
        } catch (err) {
            toast.error('Failed to add access');
            console.error('Failed to add access:', err);
        }
    };

    const role = data?.role;

    if (isLoading) {
        return (
            <Page>
                <PageHeader
                    title="Role Details"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Roles', href: '/access/roles' },
                        { label: 'Loading...' },
                    ]}
                />
                <PageContent>
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </PageContent>
            </Page>
        );
    }

    if (!role) {
        return (
            <Page>
                <PageHeader
                    title="Role Not Found"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Roles', href: '/access/roles' },
                        { label: 'Not Found' },
                    ]}
                />
                <PageContent>
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">Role not found or you don't have access.</p>
                            <Button className="mt-4" onClick={() => navigate('/access/roles')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Roles
                            </Button>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>
        );
    }

    return (
        <>
            <Page>
                <PageHeader
                    title="Role Details"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Roles', href: '/access/roles' },
                        { label: role.name },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate('/access/roles')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button variant="outline" onClick={() => refetch()}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    }
                />

                <PageContent>
                    {/* Role Info Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Shield className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{role.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {role.description || 'No description provided'}
                                        </CardDescription>
                                    </div>
                                </div>
                                {role.dashboardAccessType && (
                                    <Badge variant="outline" className="text-sm">
                                        {role.dashboardAccessType}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Role ID:</span>{' '}
                                    <code className="text-xs bg-muted px-2 py-1 rounded">{role.id}</code>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Total Permissions:</span>{' '}
                                    <Badge variant="secondary">{data?.accessMatrixRow?.length || 0}</Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Full Access:</span>{' '}
                                    <Badge variant="success">
                                        {data?.accessMatrixRow?.filter((r) => r.userAccessType === 'USER_FULL_ACCESS').length || 0}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">No Access:</span>{' '}
                                    <Badge variant="secondary">
                                        {data?.accessMatrixRow?.filter((r) => r.userAccessType === 'USER_NO_ACCESS').length || 0}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Entity Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                        {Object.entries(entitySummary).map(([entity, counts]) => (
                            <Card
                                key={entity}
                                className={`cursor-pointer transition-all ${entityFilter === entity ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                                onClick={() => setEntityFilter(entityFilter === entity ? 'all' : entity)}
                            >
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground truncate">{entity}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-green-600 text-sm font-medium">{counts.full}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-red-600 text-sm font-medium">{counts.none}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Access Matrix */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <CardTitle>Access Matrix</CardTitle>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search permissions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-[200px]"
                                        />
                                    </div>

                                    {/* Access Filter */}
                                    <Select value={accessFilter} onValueChange={setAccessFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Filter by access" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Access</SelectItem>
                                            <SelectItem value="USER_FULL_ACCESS">Full Access</SelectItem>
                                            <SelectItem value="USER_NO_ACCESS">No Access</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Entity Filter */}
                                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Filter by entity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Entities</SelectItem>
                                            {uniqueEntities.map((entity) => (
                                                <SelectItem key={entity} value={entity}>
                                                    {entity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Add Access Button */}
                                    <Button onClick={() => setAddAccessDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Access
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>API Entity</TableHead>
                                            <TableHead>Action Type</TableHead>
                                            <TableHead>Access</TableHead>
                                            <TableHead className="w-[100px] text-center">Toggle</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccessMatrix.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No permissions found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAccessMatrix.map((row, idx) => (
                                                <TableRow key={`${row.apiEntity}-${row.userActionType}-${idx}`}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {row.apiEntity}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {row.userActionType}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.userAccessType === 'USER_FULL_ACCESS' ? (
                                                            <Badge variant="success" className="gap-1">
                                                                <Check className="h-3 w-3" />
                                                                Full Access
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <X className="h-3 w-3" />
                                                                No Access
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={row.userAccessType === 'USER_FULL_ACCESS'}
                                                            onCheckedChange={() => handleToggleAccess(
                                                                row.apiEntity,
                                                                row.userActionType,
                                                                row.userAccessType
                                                            )}
                                                            disabled={assignAccessMutation.isPending}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y">
                                {filteredAccessMatrix.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No permissions found
                                    </div>
                                ) : (
                                    filteredAccessMatrix.map((row, idx) => (
                                        <div
                                            key={`mobile-${row.apiEntity}-${row.userActionType}-${idx}`}
                                            className="p-4 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {row.apiEntity}
                                                </Badge>
                                                <Switch
                                                    checked={row.userAccessType === 'USER_FULL_ACCESS'}
                                                    onCheckedChange={() => handleToggleAccess(
                                                        row.apiEntity,
                                                        row.userActionType,
                                                        row.userAccessType
                                                    )}
                                                    disabled={assignAccessMutation.isPending}
                                                />
                                            </div>
                                            <p className="font-mono text-sm break-all">
                                                {row.userActionType}
                                            </p>
                                            <div>
                                                {row.userAccessType === 'USER_FULL_ACCESS' ? (
                                                    <Badge variant="success" className="gap-1">
                                                        <Check className="h-3 w-3" />
                                                        Full Access
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <X className="h-3 w-3" />
                                                        No Access
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Results count */}
                            <div className="px-4 py-3 border-t text-sm text-muted-foreground">
                                Showing {filteredAccessMatrix.length} of {data?.accessMatrixRow?.length || 0} permissions
                            </div>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>

            {/* Add Access Dialog */}
            <Dialog open={addAccessDialogOpen} onOpenChange={setAddAccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Access Permission</DialogTitle>
                        <DialogDescription>
                            Add a new permission to the {role?.name} role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Entity</label>
                            <Input
                                value={newAccess.apiEntity}
                                onChange={(e) => setNewAccess({ ...newAccess, apiEntity: e.target.value.toUpperCase() })}
                                placeholder="e.g., CUSTOMERS, DRIVERS, MERCHANT"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Action Type</label>
                            <Input
                                value={newAccess.userActionType}
                                onChange={(e) => setNewAccess({ ...newAccess, userActionType: e.target.value.toUpperCase() })}
                                placeholder="e.g., AUTH, SEND_DASHBOARD_MESSAGE"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Access Level</label>
                            <Select
                                value={newAccess.userAccessType}
                                onValueChange={(value: 'USER_FULL_ACCESS' | 'USER_NO_ACCESS') =>
                                    setNewAccess({ ...newAccess, userAccessType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER_FULL_ACCESS">Full Access</SelectItem>
                                    <SelectItem value="USER_NO_ACCESS">No Access</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddAccessDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddAccess}
                            disabled={!newAccess.apiEntity || !newAccess.userActionType || assignAccessMutation.isPending}
                        >
                            {assignAccessMutation.isPending ? 'Adding...' : 'Add Access'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
