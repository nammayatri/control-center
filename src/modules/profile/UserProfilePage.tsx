import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { User, Mail, Phone, Shield, Search, Lock } from 'lucide-react';
import { changePassword } from '../../services/auth';
import { toast } from 'sonner';

export function UserProfilePage() {
    const { user, accessMatrix, loginModule } = useAuth();
    const [filter, setFilter] = useState('');
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (!user || !loginModule) {
            toast.error('Session error. Please login again.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(loginModule, {
                oldPassword: currentPassword,
                newPassword: newPassword
            });
            toast.success('Password changed successfully');
            setIsChangePasswordOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to change password. Please check your current password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const filteredMatrix = accessMatrix?.filter((item) => {
        const search = filter.toLowerCase();
        return (
            item.apiEntity?.toLowerCase().includes(search) ||
            item.userActionType?.toLowerCase().includes(search) ||
            item.userAccessType?.toLowerCase().includes(search)
        );
    }) || [];

    return (
        <Page>
            <PageHeader
                title="User Profile"
                description="View your account details and permissions"
                actions={
                    <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Lock className="mr-2 h-4 w-4" />
                                Change Password
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleChangePassword}>
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                    <DialogDescription>
                                        Update your password to keep your account secure.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />
            <PageContent>
                <div className="grid gap-6">
                    {/* User Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-1">
                                    <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                                    <div className="flex items-center gap-2 text-lg font-medium">
                                        {user?.firstName} {user?.lastName}
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <span className="text-sm font-medium text-muted-foreground">Email Address</span>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {user?.email || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-1">
                                    <span className="text-sm font-medium text-muted-foreground">Role</span>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <Badge variant="secondary">{user?.roles?.[0]?.name || 'No Role Assigned'}</Badge>
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <span className="text-sm font-medium text-muted-foreground">Mobile Number</span>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {user?.mobileCountryCode} {user?.mobileNumber}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Access Matrix Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Access Permissions
                                    </CardTitle>
                                    <CardDescription>
                                        List of actions you are authorized to perform
                                    </CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search permissions..."
                                        className="pl-8"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Access Level</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMatrix.length > 0 ? (
                                            filteredMatrix.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.apiEntity || 'N/A'}</TableCell>
                                                    <TableCell>{item.userActionType}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={item.userAccessType === 'USER_FULL_ACCESS' ? 'default' : 'secondary'}
                                                            className={item.userAccessType === 'USER_NO_ACCESS' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : ''}
                                                        >
                                                            {item.userAccessType.replace(/USER_|_ACCESS/g, '')}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                    No permissions found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4 text-xs text-muted-foreground text-center">
                                Total Permissions: {accessMatrix?.length || 0} | Showing: {filteredMatrix.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PageContent>
        </Page>
    );
}
