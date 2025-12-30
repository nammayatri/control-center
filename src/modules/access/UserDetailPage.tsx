import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../../components/ui/accordion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../../components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../../components/ui/command';
import {
    useUserDetail,
    useRoleAccessMatrix,
    useChangeUserEnabledStatus,
    useChangeUserPassword,
    useChangeUserEmail,
    useChangeUserMobile,
    useAssignRole,
    useAssignMerchantCityAccess,
    useRoleList,
} from '../../hooks/useAdmin';
import { formatDateTime, getInitials } from '../../lib/utils';
import { getCityName, CITY_NAME_MAP } from '../../lib/cityUtils';
import type { AccessMatrix } from '../../types';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    Shield,
    CheckCircle2,
    XCircle,
    Building2,
    MapPin,
    Lock,
    Unlock,
    MoreVertical,
    Check,
    X,
    KeyRound,
    Edit,
    Plus,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';



export function UserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    // Dialog states
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [accessDialogOpen, setAccessDialogOpen] = useState(false);

    // Form states
    const [newPassword, setNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState({ mobileNumber: '', mobileCountryCode: '+91' });
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [roleSearchOpen, setRoleSearchOpen] = useState(false);
    const [roleSearchQuery, setRoleSearchQuery] = useState('');
    const [accessForm, setAccessForm] = useState({ merchantId: '', operatingCity: '' });

    const { data: user, isLoading, refetch } = useUserDetail(userId || null);
    const roleId = user?.role?.id || user?.roles?.[0]?.id;
    const { data: accessMatrixData, isLoading: isLoadingMatrix } = useRoleAccessMatrix(roleId || '');
    const { data: rolesData } = useRoleList({ searchString: roleSearchQuery || undefined, limit: 50 });

    // Mutations
    const changeStatusMutation = useChangeUserEnabledStatus();
    const changePasswordMutation = useChangeUserPassword();
    const changeEmailMutation = useChangeUserEmail();
    const changeMobileMutation = useChangeUserMobile();
    const assignRoleMutation = useAssignRole();
    const assignAccessMutation = useAssignMerchantCityAccess();

    // Group access matrix by apiEntity
    const groupedPermissions = useMemo(() => {
        if (!accessMatrixData?.accessMatrixRow) return {};

        const grouped: Record<string, AccessMatrix[]> = {};
        accessMatrixData.accessMatrixRow.forEach((item) => {
            if (!grouped[item.apiEntity]) {
                grouped[item.apiEntity] = [];
            }
            grouped[item.apiEntity].push(item);
        });

        return Object.keys(grouped)
            .sort()
            .reduce((acc, key) => {
                acc[key] = grouped[key].sort((a, b) =>
                    a.userActionType.localeCompare(b.userActionType)
                );
                return acc;
            }, {} as Record<string, AccessMatrix[]>);
    }, [accessMatrixData]);



    const getAccessBadge = (accessType: string) => {
        if (accessType === 'USER_FULL_ACCESS') {
            return <Badge variant="success" className="text-xs">Full Access</Badge>;
        }
        if (accessType === 'USER_NO_ACCESS') {
            return <Badge variant="secondary" className="text-xs">No Access</Badge>;
        }
        return <Badge variant="outline" className="text-xs">{accessType}</Badge>;
    };

    const handleToggleStatus = async () => {
        if (!user) return;
        try {
            await changeStatusMutation.mutateAsync({
                personId: user.id,
                enabled: user.enabled === false,
            });
            toast.success(user.enabled === false ? 'User enabled' : 'User disabled');
            refetch();
        } catch (err) {
            toast.error('Failed to change status');
            console.error('Failed to change status:', err);
        }
    };

    const handleChangePassword = async () => {
        if (!user || !newPassword) return;
        try {
            await changePasswordMutation.mutateAsync({
                personId: user.id,
                newPassword,
            });
            toast.success('Password changed successfully');
            setPasswordDialogOpen(false);
            setNewPassword('');
        } catch (err) {
            toast.error('Failed to change password');
            console.error('Failed to change password:', err);
        }
    };

    const handleChangeEmail = async () => {
        if (!user || !newEmail) return;
        try {
            await changeEmailMutation.mutateAsync({
                personId: user.id,
                email: newEmail,
            });
            toast.success('Email changed successfully');
            setEmailDialogOpen(false);
            setNewEmail('');
            refetch();
        } catch (err) {
            toast.error('Failed to change email');
            console.error('Failed to change email:', err);
        }
    };

    const handleChangePhone = async () => {
        if (!user || !newPhone.mobileNumber) return;
        try {
            await changeMobileMutation.mutateAsync({
                personId: user.id,
                mobileNumber: newPhone.mobileNumber,
                mobileCountryCode: newPhone.mobileCountryCode,
            });
            toast.success('Phone number changed successfully');
            setPhoneDialogOpen(false);
            setNewPhone({ mobileNumber: '', mobileCountryCode: '+91' });
            refetch();
        } catch (err) {
            toast.error('Failed to change phone number');
            console.error('Failed to change phone:', err);
        }
    };

    const handleAssignRole = async () => {
        if (!user || !selectedRoleId) return;
        try {
            await assignRoleMutation.mutateAsync({
                personId: user.id,
                roleId: selectedRoleId,
            });
            toast.success('Role assigned successfully');
            setRoleDialogOpen(false);
            setSelectedRoleId('');
            refetch();
        } catch (err) {
            toast.error('Failed to assign role');
            console.error('Failed to assign role:', err);
        }
    };

    const handleAssignAccess = async () => {
        if (!user || !accessForm.merchantId || !accessForm.operatingCity) return;
        try {
            await assignAccessMutation.mutateAsync({
                personId: user.id,
                merchantId: accessForm.merchantId,
                operatingCity: accessForm.operatingCity,
            });
            toast.success('Merchant/City access assigned successfully');
            setAccessDialogOpen(false);
            setAccessForm({ merchantId: '', operatingCity: '' });
            refetch();
        } catch (err) {
            toast.error('Failed to assign access');
            console.error('Failed to assign access:', err);
        }
    };

    const roleName = user?.role?.name || user?.roles?.[0]?.name || 'No Role';
    const roleDescription = user?.role?.description || user?.roles?.[0]?.description;

    if (isLoading) {
        return (
            <Page>
                <PageHeader
                    title="User Details"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Users', href: '/access/users' },
                        { label: 'Loading...' },
                    ]}
                />
                <PageContent>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </PageContent>
            </Page>
        );
    }

    if (!user) {
        return (
            <Page>
                <PageHeader
                    title="User Not Found"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Users', href: '/access/users' },
                        { label: 'Not Found' },
                    ]}
                />
                <PageContent>
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">User not found or you don't have access.</p>
                            <Button className="mt-4" onClick={() => navigate('/access/users')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Users
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
                    title="User Details"
                    breadcrumbs={[
                        { label: 'Access Control', href: '/access' },
                        { label: 'Users', href: '/access/users' },
                        { label: `${user.firstName} ${user.lastName || ''}` },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => navigate('/access/users')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                                        <KeyRound className="h-4 w-4 mr-2" />
                                        Change Password
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setNewEmail(user.email || '');
                                        setEmailDialogOpen(true);
                                    }}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Change Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setNewPhone({
                                            mobileNumber: user.mobileNumber || '',
                                            mobileCountryCode: user.mobileCountryCode || '+91',
                                        });
                                        setPhoneDialogOpen(true);
                                    }}>
                                        <Phone className="h-4 w-4 mr-2" />
                                        Change Phone
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedRoleId(roleId || '');
                                        setRoleDialogOpen(true);
                                    }}>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAccessDialogOpen(true)}>
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Assign Merchant/City
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleToggleStatus}>
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
                        </div>
                    }
                />

                <PageContent>
                    {/* User Header Card */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                                        {getInitials(`${user.firstName} ${user.lastName || ''}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold">
                                        {user.firstName} {user.lastName || ''}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        ID: {user.id}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {user.verified ? (
                                            <Badge variant="success">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Not Verified
                                            </Badge>
                                        )}
                                        {user.enabled !== false ? (
                                            <Badge variant="outline">
                                                <Unlock className="h-3 w-3 mr-1" />
                                                Enabled
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <Lock className="h-3 w-3 mr-1" />
                                                Disabled
                                            </Badge>
                                        )}
                                        <Badge variant="outline">
                                            <Shield className="h-3 w-3 mr-1" />
                                            {roleName}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="info">Information</TabsTrigger>
                            <TabsTrigger value="access">Merchant Access</TabsTrigger>
                            <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contact Info */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-base">Contact Information</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setEmailDialogOpen(true)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{user.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Phone</p>
                                                <p className="font-medium">{user.mobileCountryCode} {user.mobileNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Registered</p>
                                                <p className="font-medium">
                                                    {user.registeredAt ? formatDateTime(user.registeredAt) : user.createdAt ? formatDateTime(user.createdAt) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Role Info */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-base">Role & Access</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setRoleDialogOpen(true)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assigned Role</p>
                                                <p className="font-medium">{roleName}</p>
                                                {roleDescription && (
                                                    <p className="text-sm text-muted-foreground mt-1">{roleDescription}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="access" className="space-y-4">
                            <div className="flex justify-end mb-2">
                                <Button onClick={() => setAccessDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Assign Access
                                </Button>
                            </div>

                            {/* Available Merchants */}
                            {user.availableMerchants && user.availableMerchants.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            Available Merchants
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {user.availableMerchants.map((merchant) => (
                                                <Badge key={merchant} variant="outline" className="text-sm py-1 px-3">
                                                    {merchant}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Available Cities */}
                            {user.availableCitiesForMerchant && user.availableCitiesForMerchant.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Available Cities by Merchant
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {user.availableCitiesForMerchant.map((item) => (
                                            <div key={item.merchantShortId} className="border-b last:border-0 pb-4 last:pb-0">
                                                <p className="font-medium mb-2">{item.merchantShortId}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.operatingCity.map((city) => (
                                                        <Badge key={city} variant="secondary" className="text-sm">
                                                            {getCityName(city)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {(!user.availableMerchants || user.availableMerchants.length === 0) &&
                                (!user.availableCitiesForMerchant || user.availableCitiesForMerchant.length === 0) && (
                                    <Card>
                                        <CardContent className="py-8 text-center text-muted-foreground">
                                            No merchant or city access configured
                                        </CardContent>
                                    </Card>
                                )}
                        </TabsContent>

                        <TabsContent value="permissions">
                            {isLoadingMatrix ? (
                                <Card>
                                    <CardContent className="py-8">
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : Object.keys(groupedPermissions).length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No permissions data available for this role
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Access Matrix for Role: {roleName}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Accordion type="multiple" className="w-full">
                                            {Object.entries(groupedPermissions).map(([entity, permissions]) => (
                                                <AccordionItem key={entity} value={entity}>
                                                    <AccordionTrigger className="text-sm hover:no-underline">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{entity}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {permissions.length} permissions
                                                            </Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-2">
                                                            {permissions.map((perm, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between py-2 px-3 rounded bg-muted/50"
                                                                >
                                                                    <span className="text-sm font-mono">
                                                                        {perm.userActionType}
                                                                    </span>
                                                                    {getAccessBadge(perm.userAccessType)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </PageContent>
            </Page>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {user.firstName} {user.lastName || ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={!newPassword || changePasswordMutation.isPending}
                        >
                            {changePasswordMutation.isPending ? 'Saving...' : 'Change Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Email Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Email</DialogTitle>
                        <DialogDescription>
                            Update email address for {user.firstName} {user.lastName || ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangeEmail}
                            disabled={!newEmail || changeEmailMutation.isPending}
                        >
                            {changeEmailMutation.isPending ? 'Saving...' : 'Change Email'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Phone Dialog */}
            <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Phone Number</DialogTitle>
                        <DialogDescription>
                            Update phone number for {user.firstName} {user.lastName || ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Country Code</label>
                                <Input
                                    value={newPhone.mobileCountryCode}
                                    onChange={(e) => setNewPhone({ ...newPhone, mobileCountryCode: e.target.value })}
                                    placeholder="+91"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <Input
                                    value={newPhone.mobileNumber}
                                    onChange={(e) => setNewPhone({ ...newPhone, mobileNumber: e.target.value })}
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPhoneDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangePhone}
                            disabled={!newPhone.mobileNumber || changeMobileMutation.isPending}
                        >
                            {changeMobileMutation.isPending ? 'Saving...' : 'Change Phone'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Role</DialogTitle>
                        <DialogDescription>
                            Assign a new role to {user.firstName} {user.lastName || ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Popover open={roleSearchOpen} onOpenChange={setRoleSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {selectedRoleId
                                            ? rolesData?.list?.find((r) => r.id === selectedRoleId)?.name || 'Select role...'
                                            : 'Search and select role...'}
                                        <Shield className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                            <CommandEmpty>No roles found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-auto">
                                                {rolesData?.list?.map((role) => (
                                                    <CommandItem
                                                        key={role.id}
                                                        value={role.name}
                                                        onSelect={() => {
                                                            setSelectedRoleId(role.id);
                                                            setRoleSearchOpen(false);
                                                        }}
                                                    >
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        <div className="flex-1">
                                                            <p>{role.name}</p>
                                                            {role.description && (
                                                                <p className="text-xs text-muted-foreground">{role.description}</p>
                                                            )}
                                                        </div>
                                                        {selectedRoleId === role.id && (
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
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignRole}
                            disabled={!selectedRoleId || assignRoleMutation.isPending}
                        >
                            {assignRoleMutation.isPending ? 'Saving...' : 'Assign Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Merchant/City Access Dialog */}
            <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Merchant/City Access</DialogTitle>
                        <DialogDescription>
                            Grant access to a merchant and operating city for {user.firstName} {user.lastName || ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Merchant ID</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between font-normal"
                                    >
                                        {accessForm.merchantId || 'Select or type merchant...'}
                                        <Building2 className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search or type merchant..."
                                            value={accessForm.merchantId}
                                            onValueChange={(val) => setAccessForm({ ...accessForm, merchantId: val })}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    Type a custom merchant ID or select from list
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup heading="BAP (Customer)">
                                                {['NAMMA_YATRI', 'YATRI', 'JATRI_SATHI', 'BHARAT_TAXI', 'BRIDGE'].map((m) => (
                                                    <CommandItem
                                                        key={m}
                                                        value={m}
                                                        onSelect={() => setAccessForm({ ...accessForm, merchantId: m })}
                                                    >
                                                        <Building2 className="mr-2 h-4 w-4" />
                                                        {m}
                                                        {accessForm.merchantId === m && (
                                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            <CommandGroup heading="BPP (Driver/Partner)">
                                                {['NAMMA_YATRI_PARTNER', 'YATRI_PARTNER', 'JATRI_SATHI_PARTNER', 'BHARAT_TAXI_PARTNER', 'BRIDGE_PARTNER'].map((m) => (
                                                    <CommandItem
                                                        key={m}
                                                        value={m}
                                                        onSelect={() => setAccessForm({ ...accessForm, merchantId: m })}
                                                    >
                                                        <Building2 className="mr-2 h-4 w-4" />
                                                        {m}
                                                        {accessForm.merchantId === m && (
                                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">Select from list or type a custom merchant ID</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Operating City</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between font-normal"
                                    >
                                        {accessForm.operatingCity || 'Select or type city...'}
                                        <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search or type city..."
                                            value={accessForm.operatingCity}
                                            onValueChange={(val) => setAccessForm({ ...accessForm, operatingCity: val })}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    Type a custom city name or select from list
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup heading="All Cities">
                                                {[...new Set(Object.values(CITY_NAME_MAP))].sort().map((city) => (
                                                    <CommandItem
                                                        key={city}
                                                        value={city}
                                                        onSelect={() => setAccessForm({ ...accessForm, operatingCity: city })}
                                                    >
                                                        <MapPin className="mr-2 h-4 w-4" />
                                                        {city}
                                                        {accessForm.operatingCity === city && (
                                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">Select from list or type a custom city name</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignAccess}
                            disabled={!accessForm.merchantId || !accessForm.operatingCity || assignAccessMutation.isPending}
                        >
                            {assignAccessMutation.isPending ? 'Saving...' : 'Assign Access'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
