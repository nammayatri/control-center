import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { FilterBar } from '../../components/layout/FilterBar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { useRoleList, useCreateRole } from '../../hooks/useAdmin';
import { Shield, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export function RolesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    dashboardAccessType: '',
  });
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useRoleList({
    searchString: search || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });
  const createRoleMutation = useCreateRole();

  const handleSearch = () => {
    setPage(0);
  };

  const handleCreateRole = async () => {
    try {
      await createRoleMutation.mutateAsync({
        name: newRole.name,
        description: newRole.description || undefined,
        dashboardAccessType: newRole.dashboardAccessType || undefined,
      });
      setCreateDialogOpen(false);
      setNewRole({ name: '', description: '', dashboardAccessType: '' });
      refetch();
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Role Management"
        description="Manage roles and permissions"
        breadcrumbs={[
          { label: 'Access Control', href: '/access' },
          { label: 'Roles' },
        ]}
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define a new role with specific access permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name *</label>
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="e.g., SUPPORT_AGENT"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Brief description of the role"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dashboard Access Type</label>
                  <Input
                    value={newRole.dashboardAccessType}
                    onChange={(e) => setNewRole({ ...newRole, dashboardAccessType: e.target.value })}
                    placeholder="e.g., FULL, LIMITED"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={!newRole.name || createRoleMutation.isPending}
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <PageContent>
        {/* Search */}
        <FilterBar
          searchPlaceholder="Search roles by name..."
          searchValue={search}
          onSearchChange={setSearch}
          onSearch={handleSearch}
        />

        {/* Table */}
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Role ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-destructive">
                      Error loading roles
                    </TableCell>
                  </TableRow>
                ) : data?.list?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.list?.map((role) => (
                    <TableRow
                      key={role.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/access/roles/${role.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        {role.dashboardAccessType ? (
                          <Badge variant="outline">{role.dashboardAccessType}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {role.id.slice(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.summary?.totalCount || 0)} of {data.summary?.totalCount || 0}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(page + 1) * pageSize >= (data.summary?.totalCount || 0)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
