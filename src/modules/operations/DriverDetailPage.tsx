import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { DriverSummary } from '../../components/domain/DriverBadge';
import { DriverModeBadge, VerificationStatusBadge } from '../../components/domain/StatusBadge';
import { useDriverInfo, useDriverFeedback, useBlockDriver, useUnblockDriver, useEnableDriver, useDisableDriver } from '../../hooks/useDrivers';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Car,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lock,
  LogIn,
} from 'lucide-react';

export function DriverDetailPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { merchantId } = useDashboardContext();
  const { loginModule, logout } = useAuth();

  // Check if user has access to driver operations (requires BPP or FLEET login)
  const hasDriverAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  // These hooks must be called unconditionally, but we'll skip the API calls if no access
  const { data: driver, isLoading, error, refetch } = useDriverInfo(hasDriverAccess ? (driverId || '') : '');
  const { data: feedback } = useDriverFeedback(hasDriverAccess ? (driverId || '') : '');
  
  const blockMutation = useBlockDriver();
  const unblockMutation = useUnblockDriver();
  const enableMutation = useEnableDriver();
  const disableMutation = useDisableDriver();

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

  const handleBlock = async () => {
    if (!driverId) return;
    await blockMutation.mutateAsync(driverId);
    refetch();
  };

  const handleUnblock = async () => {
    if (!driverId) return;
    await unblockMutation.mutateAsync(driverId);
    refetch();
  };

  const handleEnable = async () => {
    if (!driverId) return;
    await enableMutation.mutateAsync(driverId);
    refetch();
  };

  const handleDisable = async () => {
    if (!driverId) return;
    await disableMutation.mutateAsync(driverId);
    refetch();
  };

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

  if (isLoading) {
    return (
      <Page>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Page>
    );
  }

  if (error || !driver) {
    return (
      <Page>
        <PageHeader title="Driver Details" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive">Error loading driver details</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                Go Back
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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {driver.blocked ? (
              <Button 
                variant="outline" 
                onClick={handleUnblock}
                disabled={unblockMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Unblock
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleBlock}
                disabled={blockMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Block
              </Button>
            )}
            {driver.enabled ? (
              <Button 
                variant="outline" 
                onClick={handleDisable}
                disabled={disableMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disable
              </Button>
            ) : (
              <Button 
                onClick={handleEnable}
                disabled={enableMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Enable
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
                  driverMode: driver.driverMode,
                }}
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
        <Tabs defaultValue="info" className="mt-6">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="history">Block History</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{driver.mobileCountryCode} {driver.mobileNumber}</p>
                    </div>
                  </div>
                  {driver.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{driver.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p>{driver.merchantOperatingCity || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Onboarded</p>
                      <p>{driver.onboardingDate ? formatDate(driver.onboardingDate) : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {driver.driverMode && <DriverModeBadge mode={driver.driverMode} />}
                    {driver.verified && <Badge variant="success">Verified</Badge>}
                    {driver.subscribed && <Badge variant="info">Subscribed</Badge>}
                    {driver.blocked && <Badge variant="destructive">Blocked</Badge>}
                    {!driver.enabled && <Badge variant="secondary">Disabled</Badge>}
                  </div>
                  
                  {driver.driverTag && driver.driverTag.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {driver.driverTag.map((tag, i) => (
                          <Badge key={i} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {driver.blockedReason && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-medium text-destructive">Block Reason</p>
                      <p className="text-sm">{driver.blockedReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Driver License</CardTitle>
              </CardHeader>
              <CardContent>
                {driver.driverLicenseDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">License Number</p>
                        <p className="font-mono">{driver.driverLicenseDetails.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expiry</p>
                        <p>{formatDate(driver.driverLicenseDetails.licenseExpiry)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <VerificationStatusBadge status={driver.driverLicenseDetails.verificationStatus} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vehicle Classes</p>
                        <p>{driver.driverLicenseDetails.classOfVehicles?.join(', ') || '-'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No license information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registered Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {driver.vehicleRegistrationDetails && driver.vehicleRegistrationDetails.length > 0 ? (
                  <div className="space-y-4">
                    {driver.vehicleRegistrationDetails.map((vehicle, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <span className="font-mono font-medium">
                              {vehicle.certificateNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {vehicle.isRcActive && <Badge variant="success">Active</Badge>}
                            <VerificationStatusBadge status={vehicle.verificationStatus} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Model</p>
                            <p>{vehicle.vehicleModel || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Variant</p>
                            <p>{vehicle.vehicleVariant || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fitness Expiry</p>
                            <p>{formatDate(vehicle.fitnessExpiry)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Insurance</p>
                            <p>{vehicle.insuranceValidity ? formatDate(vehicle.insuranceValidity) : '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vehicles registered</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedback?.feedbacks && feedback.feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {feedback.feedbacks.map((fb, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Ride: {fb.rideId.slice(0, 8)}...
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(fb.createdAt)}
                          </span>
                        </div>
                        <p>{fb.feedbackText || fb.feedbackDetails || 'No feedback text'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No feedback available</p>
                )}
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
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{block.blockedBy}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(block.reportedAt)}
                          </span>
                        </div>
                        {block.blockReason && (
                          <p className="text-sm">{block.blockReason}</p>
                        )}
                        {block.blockTimeInHours && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Duration: {block.blockTimeInHours} hours
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No block history</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </Page>
  );
}

