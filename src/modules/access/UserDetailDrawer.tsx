import { useMemo } from 'react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '../../components/ui/sheet';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../../components/ui/accordion';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useUserDetail, useRoleAccessMatrix } from '../../hooks/useAdmin';
import { formatDateTime, getInitials } from '../../lib/utils';
import type { AccessMatrix } from '../../types';
import {
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
} from 'lucide-react';

interface UserDetailDrawerProps {
    userId: string | null;
    open: boolean;
    onClose: () => void;
}

export function UserDetailDrawer({ userId, open, onClose }: UserDetailDrawerProps) {
    const { data: user, isLoading } = useUserDetail(userId);
    const roleId = user?.role?.id || user?.roles?.[0]?.id;
    const { data: accessMatrixData, isLoading: isLoadingMatrix } = useRoleAccessMatrix(roleId || '');

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

        // Sort by entity name
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

    const roleName = user?.role?.name || user?.roles?.[0]?.name || 'No Role';
    const roleDescription = user?.role?.description || user?.roles?.[0]?.description;

    return (
        <Sheet open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle>User Details</SheetTitle>
                    <SheetDescription>
                        View user information and access permissions
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    {isLoading ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : user ? (
                        <div className="space-y-6 py-4">
                            {/* User Header */}
                            <div className="flex items-start gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                        {getInitials(`${user.firstName} ${user.lastName || ''}`)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">
                                        {user.firstName} {user.lastName || ''}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {user.id.slice(0, 8)}...
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
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
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="info" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="info">Info</TabsTrigger>
                                    <TabsTrigger value="access">Access</TabsTrigger>
                                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="space-y-4 mt-4">
                                    {/* Contact Info */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Contact Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{user.email || 'No email'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {user.mobileCountryCode} {user.mobileNumber}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Registered: {user.registeredAt ? formatDateTime(user.registeredAt) : user.createdAt ? formatDateTime(user.createdAt) : '-'}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Role Info */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">Role</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-start gap-3">
                                                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <p className="font-medium">{roleName}</p>
                                                    {roleDescription && (
                                                        <p className="text-sm text-muted-foreground">{roleDescription}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="access" className="space-y-4 mt-4">
                                    {/* Available Merchants */}
                                    {user.availableMerchants && user.availableMerchants.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    Available Merchants
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.availableMerchants.map((merchant) => (
                                                        <Badge key={merchant} variant="outline">
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
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    Available Cities by Merchant
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {user.availableCitiesForMerchant.map((item) => (
                                                    <div key={item.merchantShortId}>
                                                        <p className="text-sm font-medium mb-1">{item.merchantShortId}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.operatingCity.map((city) => (
                                                                <Badge key={city} variant="secondary" className="text-xs">
                                                                    {city}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                <TabsContent value="permissions" className="mt-4">
                                    {isLoadingMatrix ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : Object.keys(groupedPermissions).length === 0 ? (
                                        <Card>
                                            <CardContent className="py-8 text-center text-muted-foreground">
                                                No permissions data available
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Accordion type="multiple" className="w-full">
                                            {Object.entries(groupedPermissions).map(([entity, permissions]) => (
                                                <AccordionItem key={entity} value={entity}>
                                                    <AccordionTrigger className="text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{entity}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {permissions.length}
                                                            </Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-2">
                                                            {permissions.map((perm, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50"
                                                                >
                                                                    <span className="text-xs font-mono">
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
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            User not found
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
