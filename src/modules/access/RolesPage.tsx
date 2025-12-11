import { useState } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
import { Shield, Plus, Users } from 'lucide-react';

export function RolesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    dashboardAccessType: '',
  });

  const { data, isLoading, error, refetch } = useRoleList();
  const createRoleMutation = useCreateRole();

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
    } catch (error) {
      console.error('Failed to create role:', error);
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive">Error loading roles</p>
            </CardContent>
          </Card>
        ) : data?.list?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No roles defined yet</p>
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.list?.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {role.name}
                    </CardTitle>
                    {role.dashboardAccessType && (
                      <Badge variant="outline">{role.dashboardAccessType}</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {role.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Role ID: {role.id.slice(0, 8)}...</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </Page>
  );
}

