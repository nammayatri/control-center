import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { useUserList, useRoleList, useCreateUser, useChangeUserEnabledStatus } from '../../hooks/useAdmin';
import { formatDateTime } from '../../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MoreVertical,
  Check,
  X,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    mobileCountryCode: '+91',
    roleId: '',
  });
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useUserList({
    searchString: search || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const { data: rolesData } = useRoleList();
  const createUserMutation = useCreateUser();
  const changeStatusMutation = useChangeUserEnabledStatus();

  const handleSearch = () => {
    setPage(0);
  };

  const handleCreateUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        firstName: newUser.firstName,
        lastName: newUser.lastName || undefined,
        email: newUser.email || undefined,
        mobileNumber: newUser.mobileNumber,
        mobileCountryCode: newUser.mobileCountryCode,
        roleId: newUser.roleId || undefined,
      });
      setCreateDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        mobileCountryCode: '+91',
        roleId: '',
      });
      refetch();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleToggleStatus = async (personId: string, currentEnabled: boolean) => {
    try {
      await changeStatusMutation.mutateAsync({
        personId,
        enabled: !currentEnabled,
      });
      refetch();
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  return (
    <Page>
      <PageHeader
        title="User Management"
        description="Manage admin users and their access"
        breadcrumbs={[
          { label: 'Access Control', href: '/access' },
          { label: 'Users' },
        ]}
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new admin user to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country Code</label>
                    <Input
                      value={newUser.mobileCountryCode}
                      onChange={(e) => setNewUser({ ...newUser, mobileCountryCode: e.target.value })}
                      placeholder="+91"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Mobile Number *</label>
                    <Input
                      value={newUser.mobileNumber}
                      onChange={(e) => setNewUser({ ...newUser, mobileNumber: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={newUser.roleId}
                    onValueChange={(value) => setNewUser({ ...newUser, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesData?.list?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={!newUser.firstName || !newUser.mobileNumber || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <PageContent>
        {/* Filters */}
        <FilterBar
          searchPlaceholder="Search by name, email, or phone..."
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
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      Error loading users
                    </TableCell>
                  </TableRow>
                ) : data?.list?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.list?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        {user.mobileCountryCode} {user.mobileNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="outline">
                              <Shield className="h-3 w-3 mr-1" />
                              {role.name}
                            </Badge>
                          )) || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.enabled ? 'success' : 'secondary'}>
                          {user.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? formatDateTime(user.createdAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.id, user.enabled)}
                            >
                              {user.enabled ? (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Enable User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

