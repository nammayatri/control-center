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
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

export function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roleSearchOpen, setRoleSearchOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    mobileCountryCode: '+91',
    password: '',
    roleId: '',
  });
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useUserList({
    searchString: search || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  // Role search uses API
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const { data: rolesData } = useRoleList({
    searchString: roleSearchQuery || undefined,
    limit: 50,
  });
  const createUserMutation = useCreateUser();
  const changeStatusMutation = useChangeUserEnabledStatus();

  const selectedRole = rolesData?.list?.find((r) => r.id === newUser.roleId);

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
        password: newUser.password,
        roleId: newUser.roleId || undefined,
      });
      setCreateDialogOpen(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        mobileCountryCode: '+91',
        password: '',
        roleId: '',
      });
      refetch();
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleToggleStatus = async (personId: string, currentEnabled: boolean) => {
    try {
      await changeStatusMutation.mutateAsync({
        personId,
        enabled: !currentEnabled,
      });
      refetch();
    } catch (err) {
      console.error('Failed to change status:', err);
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
            <DialogContent className="max-w-md">
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
                  <label className="text-sm font-medium">Password *</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Popover open={roleSearchOpen} onOpenChange={setRoleSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={roleSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedRole ? selectedRole.name : "Select a role..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search roles..."
                          value={roleSearchQuery}
                          onValueChange={setRoleSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>No role found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {rolesData?.list.map((role) => (
                              <CommandItem
                                key={role.id}
                                value={role.name}
                                onSelect={() => {
                                  setNewUser({ ...newUser, roleId: role.id });
                                  setRoleSearchOpen(false);
                                  setRoleSearchQuery('');
                                }}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                <div className="flex-1">
                                  <p>{role.name}</p>
                                  {role.description && (
                                    <p className="text-xs text-muted-foreground">{role.description}</p>
                                  )}
                                </div>
                                {newUser.roleId === role.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={!newUser.firstName || !newUser.mobileNumber || !newUser.password || createUserMutation.isPending}
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
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
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
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/access/users/${user.id}`)}
                    >
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
                        {user.role ? (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role.name}
                          </Badge>
                        ) : user.roles?.[0] ? (
                          <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            {user.roles[0].name}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.verified ? 'success' : 'secondary'}>
                          {user.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.registeredAt ? formatDateTime(user.registeredAt) : user.createdAt ? formatDateTime(user.createdAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(user.id, user.enabled !== false);
                              }}
                            >
                              {user.enabled !== false ? (
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
