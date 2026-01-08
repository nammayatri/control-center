import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { DriverSummary } from '../../components/domain/DriverBadge';
import { DriverDocumentsTab } from '../../components/domain/DriverDocumentsTab';
import { DriverCoinsTab } from '../../components/domain/DriverCoinsTab';
import { VerificationStatusBadge } from '../../components/domain/StatusBadge';
import { useBlockDriver, useUnblockDriver, useEnableDriver, useDisableDriver, useUpdateDriverName, useChangeOperatingCity, useSendDummyNotification } from '../../hooks/useDrivers';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  Calendar,
  Smartphone,
  Star,
  Activity,
  SmartphoneNfc,
  Tag,
  CheckCircle2,
  Car as CarIcon,
  Ban,
  CheckCircle,
  Lock,
  User as UserIcon,
  Shield,
  LogIn,
  Pencil,
  Coins,
  Bell,
} from 'lucide-react';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import type { DriverInfoResponse } from '../../services/drivers';
import { toast } from 'sonner';

export function DriverDetailPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { merchantId } = useDashboardContext();
  const { loginModule, logout, getCitiesForMerchant, currentMerchant, switchContext } = useAuth();

  // Get driver from location state and manage locally
  const [driver, setDriver] = useState<DriverInfoResponse | undefined>(
    location.state?.driver as DriverInfoResponse | undefined
  );

  // Edit name dialog state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  // Active tab state for controlling tab-specific data fetching
  const [activeTab, setActiveTab] = useState('info');

  // Edit city dialog state
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  // Check if user has access to driver operations (requires BPP or FLEET login)
  const hasDriverAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  const blockMutation = useBlockDriver();
  const unblockMutation = useUnblockDriver();
  const enableMutation = useEnableDriver();
  const disableMutation = useDisableDriver();
  const updateNameMutation = useUpdateDriverName();
  const changeOperatingCityMutation = useChangeOperatingCity();
  const sendDummyNotificationMutation = useSendDummyNotification();

  // Get available cities for the current merchant
  const availableCities = currentMerchant ? getCitiesForMerchant(currentMerchant.shortId || currentMerchant.id) : [];

  const handleBlockDriver = (reason: string) => {
    if (!driverId || !driver) return;
    console.log(`Blocking driver ${driverId} with reason: ${reason}`);
    blockMutation.mutate(driverId, {
      onSuccess: () => {
        toast.success(`Driver ${driver.firstName} has been blocked.`);
        setDriver(prev => prev ? { ...prev, blocked: true } : prev);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error.message || 'Failed to block driver');
      }
    });
  };

  const handleUnblockDriver = () => {
    if (!driverId || !driver) return;
    unblockMutation.mutate(driverId, {
      onSuccess: () => {
        toast.success(`Driver ${driver.firstName} has been unblocked.`);
        setDriver(prev => prev ? { ...prev, blocked: false } : prev);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error.message || 'Failed to unblock driver');
      }
    });
  };

  const handleEnableDriver = () => {
    if (!driverId || !driver) return;
    enableMutation.mutate(driverId, {
      onSuccess: () => {
        toast.success(`Driver ${driver.firstName} has been enabled.`);
        setDriver(prev => prev ? { ...prev, enabled: true } : prev);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error.message || 'Failed to enable driver');
      }
    });
  };

  const handleDisableDriver = () => {
    if (!driverId || !driver) return;
    disableMutation.mutate(driverId, {
      onSuccess: () => {
        toast.success(`Driver ${driver?.firstName} has been disabled.`);
        setDriver(prev => prev ? { ...prev, enabled: false } : prev);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error.message || 'Failed to disable driver');
      }
    });
  };

  const handleEditNameClick = () => {
    if (!driver) return;
    setEditFirstName(driver.firstName || '');
    setEditMiddleName(driver.middleName || '');
    setEditLastName(driver.lastName || '');
    setIsEditingName(true);
  };

  const handleUpdateName = () => {
    if (!driverId || !driver) return;
    
    updateNameMutation.mutate(
      {
        driverId,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        middleName: editMiddleName.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Driver name updated successfully');
          setDriver(prev => prev ? {
            ...prev,
            firstName: editFirstName.trim(),
            middleName: editMiddleName.trim(),
            lastName: editLastName.trim(),
          } : prev);
          setIsEditingName(false);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update driver name');
        },
      }
    );
  };

  const handleEditCityClick = () => {
    if (!driver) return;
    setSelectedCity(driver.merchantOperatingCity || '');
    setIsEditingCity(true);
  };

  const handleUpdateCity = () => {
    if (!driverId || !driver || !selectedCity) return;

    changeOperatingCityMutation.mutate(
      {
        driverId,
        operatingCity: selectedCity,
      },
      {
        onSuccess: async () => {
          toast.success('Operating city updated successfully');
          setDriver(prev => prev ? {
            ...prev,
            merchantOperatingCity: selectedCity,
          } : prev);
          setIsEditingCity(false);
          
          // Switch dashboard context to the new city to avoid "PERSON_DOES_NOT_EXIST" error
          // Find the city object that matches the selected city name
          const newCity = availableCities.find(c => c.name === selectedCity);
          if (newCity && currentMerchant) {
            try {
              await switchContext(currentMerchant.shortId || currentMerchant.id, newCity.id);
              toast.info(`Switched to ${selectedCity} context`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
              console.error('Failed to switch city context:', error);
              toast.warning('City updated but failed to switch context. Please refresh the page.');
            }
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update operating city');
        },
      }
    );
  };

  const handleSendDummyRequest = () => {
    if (!driverId || !driver) return;
    
    sendDummyNotificationMutation.mutate(driverId, {
      onSuccess: () => {
        toast.success('Dummy notification sent successfully');
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        toast.error(error.message || 'Failed to send dummy notification');
      },
    });
  };

  if (!hasDriverAccess) {
    return (
      <Page>
        <PageHeader title="Driver Details" />
        <PageContent>
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Driver Login Required</h3>
              <p className="text-muted-foreground">
                You are currently logged in with the <strong>Customer (BAP)</strong> module.
                To access driver details, please log in with the <strong>Driver (BPP)</strong> or <strong>Fleet</strong> module.
              </p>
              <Button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="mt-4"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Switch to Driver Login
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  // These async handlers are not used in the current JSX, but are kept for completeness
  // as they were part of the original code structure.
  // The `refetch` function is missing, which would cause an error if these were called.
  if (merchantId === 'all') {
    return (
      <Page>
        <PageHeader title="Driver Details" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Please select a merchant to view driver details.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  if (!driver) {
    return (
      <Page>
        <PageHeader title="Driver Details" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No driver information found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please search for the driver again from the Drivers page.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/ops/drivers')}>
                Go to Search
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Driver Details"
        breadcrumbs={[
          { label: 'Operations', href: '/ops' },
          { label: 'Drivers', href: '/ops/drivers' },
          { label: `${driver.firstName} ${driver.lastName || ''}`.trim() },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleSendDummyRequest}
              disabled={sendDummyNotificationMutation.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              {sendDummyNotificationMutation.isPending ? 'Sending...' : 'Send Dummy Request'}
            </Button>

            {driver.blocked ? (
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={handleUnblockDriver}
                disabled={unblockMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Unblock Driver
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleBlockDriver('Blocked by admin')}
                disabled={blockMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Block Driver
              </Button>
            )}

            {driver.enabled ? (
              <Button
                variant="outline"
                className="text-orange-500 hover:text-orange-600"
                onClick={handleDisableDriver}
                disabled={disableMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Disable Driver
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={handleEnableDriver}
                disabled={enableMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Enable Driver
              </Button>
            )}
          </>
        }
      />

      <PageContent>
        {/* Driver Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <DriverSummary
                driver={{
                  id: driver.driverId,
                  firstName: driver.firstName,
                  lastName: driver.lastName,
                  mobileNumber: driver.mobileNumber,
                  rating: driver.rating,
                  enabled: driver.enabled,
                  blocked: driver.blocked,
                  verified: driver.verified,
                  vehicleNumber: driver.vehicleNumber,
                  numberOfRides: driver.numberOfRides,
                  merchantOperatingCity: driver.merchantOperatingCity,
                  driverMode: driver.driverMode as any,
                }}
                onEditCity={availableCities.length > 0 ? handleEditCityClick : undefined}
                className="flex-1"
              />


              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{driver.numberOfRides}</p>
                  <p className="text-sm text-muted-foreground">Total Rides</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {driver.rating?.toFixed(1) || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {driver.cancellationRate || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Cancel Rate</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {driver.assignedCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="mt-6" onValueChange={(value) => setActiveTab(value)}>
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="coins">
              <Coins className="h-4 w-4 mr-1" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="history">Block History</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <div className="font-medium flex items-center gap-2">
                        <span>{[driver.firstName, driver.middleName, driver.lastName].filter(Boolean).join(' ')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleEditNameClick}
                          title="Edit name"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver ID</Label>
                      <div className="font-medium font-mono text-sm truncate" title={driver.driverId}>
                        {driver.driverId}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                      <div className="font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        {driver.mobileCountryCode} {driver.mobileNumber}
                      </div>
                      {driver.alternateNumber && (
                        <div className="text-xs text-muted-foreground mt-1 ml-6">
                          Alt: {driver.alternateNumber}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="font-medium text-sm truncate" title={driver.email || 'N/A'}>
                        {driver.email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Onboarding Date</Label>
                      <div className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {driver.onboardingDate ? new Date(driver.onboardingDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Activity</Label>
                      <div className="font-medium">
                        {driver.lastActivityDate ? new Date(driver.lastActivityDate).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Rating</Label>
                      <div className="flex items-center gap-1 font-medium">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {driver.rating?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rides Completed</Label>
                      <div className="font-medium">{driver.numberOfRides} ({driver.cancelledCount ?? 0} cancelled)</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={driver.enabled ? 'default' : 'secondary'}>
                          {driver.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant={driver.blocked ? 'destructive' : 'outline'}>
                          {driver.blocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver Mode</Label>
                      <div className="font-medium">{driver.driverMode || 'N/A'}</div>
                    </div>
                  </div>

                  {driver.blocked && (
                    <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive mt-2">
                      <div className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Blocked: {driver.blockedReason || 'No reason provided'}
                      </div>
                      {driver.blockedInfo && driver.blockedInfo.length > 0 && (
                        <div className="mt-1 text-xs opacity-90">
                          Last reported: {new Date(driver.blockedInfo[0].reportedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Driver Tags */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Driver Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {driver.driverTagObject && driver.driverTagObject.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {driver.driverTagObject.map((tag, idx) => (
                        <div key={idx} className="bg-muted/30 p-2 rounded border text-sm flex justify-between items-center">
                          <span className="font-medium text-muted-foreground text-xs">{tag.tagName}</span>
                          <span className="font-semibold truncate max-w-[50%] text-right" title={String(tag.tagValue.contents)}>
                            {String(tag.tagValue.contents).replace(/"/g, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No tags assigned</div>
                  )}
                </CardContent>
              </Card>

              {/* Quality & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quality & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">AC Status</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant={driver.currentACStatus ? 'success' : 'secondary'}>
                          {driver.currentACStatus ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">AC Off Reports</Label>
                      <div className="font-medium text-destructive">
                        {driver.currentAcOffReportCount ?? 0}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">AC Restriction Unblocks</Label>
                      <div className="font-medium">
                        {driver.totalAcRestrictionUnblockCount ?? 0}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last AC Check</Label>
                      <div className="font-medium text-sm">
                        {driver.lastACStatusCheckedAt ? formatDateTime(driver.lastACStatusCheckedAt) : 'Never checked'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Block Count</Label>
                      <div className="font-medium">
                        {driver.blockCount ?? 0}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Drunk & Drive Violations</Label>
                      <div className="font-medium text-destructive">
                        {driver.drunkAndDriveViolationCount ?? 0}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Blocked Due To Rider Complains</Label>
                      <div className="mt-1">
                        <Badge variant={driver.blockedDueToRiderComplains ? 'destructive' : 'outline'}>
                          {driver.blockedDueToRiderComplains ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    {driver.downgradeReason && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Downgrade Reason</Label>
                        <div className="text-sm text-foreground mt-1 bg-muted/40 p-2 rounded">{driver.downgradeReason}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Application Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SmartphoneNfc className="h-5 w-5" />
                    App & System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Service Tiers</Label>
                      <div className="flex flex-wrap gap-1">
                        {driver.selectedServiceTiers && driver.selectedServiceTiers.length > 0 ? (
                          driver.selectedServiceTiers.map((tier, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">
                              {tier}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Client Version</span>
                      <span className="font-mono">
                        {driver.clientVersion ?
                          `${driver.clientVersion.major}.${driver.clientVersion.minor}.${driver.clientVersion.maintenance}` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Bundle Version</span>
                      <span className="font-mono">
                        {driver.bundleVersion ?
                          `${driver.bundleVersion.major}.${driver.bundleVersion.minor}.${driver.bundleVersion.maintenance}` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">React Version</span>
                      <span className="font-mono">{driver.reactVersion || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Aadhar Associated</span>
                      <span className="font-mono">{driver.aadharAssociationDetails ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs mb-1">Available Merchants</span>
                      <div className="flex flex-wrap gap-1">
                        {driver.availableMerchants?.map(m => (
                          <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                        )) || 'None'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DriverDocumentsTab 
              driverId={driver.driverId} 
              selectedServiceTiers={driver.selectedServiceTiers}
            />
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registered Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {driver.vehicleRegistrationDetails && driver.vehicleRegistrationDetails.length > 0 ? (
                  <div className="space-y-6">
                    {/* Active Vehicles Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Vehicle</h4>
                      {driver.vehicleRegistrationDetails.filter(v => v.isRcActive).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No active vehicle found.</p>
                      )}
                      {driver.vehicleRegistrationDetails
                        .filter(v => v.isRcActive)
                        .map((vehicle, i) => (
                          <div key={`active-${i}`} className="p-5 border border-primary/40 bg-primary/5 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
                              <div className="flex items-center gap-3">
                                <CarIcon className="h-6 w-6 text-primary" />
                                <div>
                                  <span className="font-mono font-bold text-xl block leading-none">
                                    {vehicle.details.certificateNumber}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.details.manufacturerModel || vehicle.details.vehicleModel} ({vehicle.details.vehicleColor})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary hover:bg-primary/90">Current</Badge>
                                <VerificationStatusBadge status={vehicle.details.verificationStatus} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Vehicle Class</Label>
                                <div className="font-medium">{vehicle.details.vehicleClass || 'N/A'}</div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Variant</Label>
                                <div className="font-medium">{vehicle.details.vehicleVariant || 'N/A'}</div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Fuel Type</Label>
                                <div className="font-medium">{vehicle.details.vehicleEnergyType || 'N/A'}</div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Capacity</Label>
                                <div className="font-medium">{vehicle.details.vehicleCapacity ? `${vehicle.details.vehicleCapacity} Seats` : 'N/A'}</div>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-muted-foreground">Manufacturer</Label>
                                <div className="font-medium truncate" title={vehicle.details.vehicleManufacturer || ''}>
                                  {vehicle.details.vehicleManufacturer || 'N/A'}
                                </div>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <Label className="text-xs text-muted-foreground">Association Date</Label>
                                <div className="font-medium">
                                  {vehicle.associatedOn ? formatDateTime(vehicle.associatedOn) : 'N/A'}
                                </div>
                              </div>

                              <div className="border-t col-span-full my-1 border-dashed opacity-50"></div>

                              <div>
                                <Label className="text-xs text-muted-foreground">Insurance Exp</Label>
                                <div className="font-medium">
                                  {vehicle.details.insuranceValidity ? formatDate(vehicle.details.insuranceValidity) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Fitness Exp</Label>
                                <div className="font-medium">
                                  {vehicle.details.fitnessExpiry ? formatDate(vehicle.details.fitnessExpiry) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Permit Exp</Label>
                                <div className="font-medium">
                                  {vehicle.details.permitExpiry ? formatDate(vehicle.details.permitExpiry) : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Inactive Vehicles History Section */}
                    {driver.vehicleRegistrationDetails.filter(v => !v.isRcActive).length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vehicle History</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>RC Number</TableHead>
                              <TableHead>Vehicle Details</TableHead>
                              <TableHead>Association History</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {driver.vehicleRegistrationDetails
                              .filter(v => !v.isRcActive)
                              .sort((a, b) => new Date(b.associatedOn || 0).getTime() - new Date(a.associatedOn || 0).getTime())
                              .map((vehicle, i) => (
                                <TableRow key={`hist-${i}`} className="text-sm opacity-80 hover:opacity-100">
                                  <TableCell className="font-mono font-medium">{vehicle.details.certificateNumber}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span>{vehicle.details.vehicleModel || vehicle.details.manufacturerModel || 'N/A'}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {[vehicle.details.vehicleVariant, vehicle.details.vehicleColor].filter(Boolean).join(' • ')}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col text-xs">
                                      <span>From: {vehicle.associatedOn ? formatDate(vehicle.associatedOn) : 'N/A'}</span>
                                      <span className="text-muted-foreground">Till: {vehicle.associatedTill ? formatDate(vehicle.associatedTill) : 'N/A'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <VerificationStatusBadge status={vehicle.details.verificationStatus} />
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No vehicle information available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins" className="mt-4">
            <DriverCoinsTab driverId={driver.driverId} isActive={activeTab === 'coins'} />
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Feedback display temporarily disabled.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Block History</CardTitle>
              </CardHeader>
              <CardContent>
                {driver.blockedInfo && driver.blockedInfo.length > 0 ? (
                  <div className="space-y-4">
                    {driver.blockedInfo.map((block, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-destructive">Blocked</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(block.reportedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-1">Reason: {block.reason || 'N/A'}</p>
                        {block.blockedBy && (
                          <p className="text-xs text-muted-foreground">Blocked By: {block.blockedBy}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No block history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Name Dialog */}
        <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Driver Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={editMiddleName}
                  onChange={(e) => setEditMiddleName(e.target.value)}
                  placeholder="Enter middle name (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Enter last name (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditingName(false)}
                disabled={updateNameMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateName}
                disabled={updateNameMutation.isPending || !editFirstName.trim()}
              >
                {updateNameMutation.isPending ? 'Updating...' : 'Update Name'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Operating City Dialog */}
        <Dialog open={isEditingCity} onOpenChange={setIsEditingCity}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Operating City</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="operatingCity">Operating City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditingCity(false)}
                disabled={changeOperatingCityMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCity}
                disabled={changeOperatingCityMutation.isPending || !selectedCity}
              >
                {changeOperatingCityMutation.isPending ? 'Updating...' : 'Update City'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </Page >
  );
}

