import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useDashboardContext } from '../../context/DashboardContext';
import { formatDateTime, cn } from '../../lib/utils';
import {
  ArrowLeft,
  User,
  Car,
  MapPin,
  Clock,
  DollarSign,
  Key,
  Info,
  AlertTriangle,
  Phone,
  Loader2,
  Receipt,
} from 'lucide-react';
import type { BPPRideSummaryResponse, FareBreakupResponse, RouteResponse } from '../../services/rides';
import { getBPPRideSummary, getBPPFareBreakup, getBPPRideRoute } from '../../services/rides';
import { RouteMap } from '../../components/RouteMap';

// Helper to format location address
function formatLocationAddress(location?: {
  area?: string;
  building?: string;
  street?: string;
  city?: string;
  state?: string;
}): string {
  if (!location) return '-';
  const parts = [location.building, location.street, location.area, location.city]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
}

// Helper to format distance
function formatDistance(meters?: number): string {
  if (!meters) return '-';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
}

// Helper to format fare
function formatFare(fare?: { amount: number; currency: string }): string {
  if (!fare) return '-';
  return `${fare.currency} ${fare.amount.toFixed(2)}`;
}

// Helper to format duration
function formatDuration(minutes?: number): string {
  if (minutes === undefined || minutes === null) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Status badge component
function StatusBadge({ status, type }: Readonly<{ status: string; type: 'booking' | 'ride' }>) {
  const getVariant = () => {
    if (status.includes('COMPLETED')) return 'default';
    if (status.includes('CANCELLED')) return 'destructive';
    if (status.includes('ONGOING') || status.includes('INPROGRESS')) return 'secondary';
    return 'outline';
  };
  
  const getClassName = () => {
    if (status.includes('COMPLETED')) return 'bg-green-100 text-green-800 hover:bg-green-100';
    if (status.includes('CANCELLED')) return 'bg-red-100 text-red-800 hover:bg-red-100';
    if (status.includes('ONGOING') || status.includes('INPROGRESS')) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    return '';
  };

  return (
    <Badge variant={getVariant()} className={cn("text-xs", getClassName())}>
      {type === 'booking' ? 'Booking: ' : 'Ride: '}{status}
    </Badge>
  );
}

// Currency amount type matching the API
type CurrencyAmount = { amount: number; currency: string } | null | undefined;

// FareRow component for fare breakup table
function FareRow({ 
  label, 
  estimated, 
  actual 
}: Readonly<{ 
  label: string; 
  estimated: CurrencyAmount; 
  actual: CurrencyAmount;
}>) {
  const estAmount = estimated?.amount ?? 0;
  const actAmount = actual?.amount ?? 0;
  const diff = actAmount - estAmount;
  const currency = estimated?.currency || actual?.currency || 'INR';
  
  // Skip rendering if both are null/0
  if (!estimated && !actual) {
    return null;
  }

  const formatAmount = (amt: CurrencyAmount) => {
    if (!amt) return '-';
    return `${amt.currency} ${amt.amount.toFixed(2)}`;
  };

  // Format the difference display
  const formatDifference = () => {
    if (diff === 0) return '-';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${currency} ${diff.toFixed(2)}`;
  };

  return (
    <TableRow className={cn(
      diff !== 0 && "bg-amber-50 hover:bg-amber-100"
    )}>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right">{formatAmount(estimated)}</TableCell>
      <TableCell className="text-right">{formatAmount(actual)}</TableCell>
      <TableCell className={cn(
        "text-right font-medium",
        diff > 0 && "text-red-600",
        diff < 0 && "text-green-600",
        diff === 0 && "text-muted-foreground"
      )}>
        {formatDifference()}
      </TableCell>
    </TableRow>
  );
}

// Fare Breakup Content Component - extracted to reduce complexity
function FareBreakupContent({ 
  fareBreakup, 
  fareLoading 
}: Readonly<{ 
  fareBreakup: FareBreakupResponse | null; 
  fareLoading: boolean;
}>) {
  if (fareLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check if fareBreakup or its inner objects are null/undefined (happens for cancelled rides)
  if (!fareBreakup?.estimatedFareBreakUp || !fareBreakup?.actualFareBreakUp) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No fare breakup data available</p>
          {fareBreakup && (!fareBreakup.estimatedFareBreakUp || !fareBreakup.actualFareBreakUp) && (
            <p className="text-xs text-muted-foreground mt-2">
              Fare details may not be available for cancelled rides
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Fares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Primary Fares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Parameter</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FareRow 
                label="Base Fare"
                estimated={fareBreakup.estimatedFareBreakUp.baseFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.baseFareWithCurrency}
              />
              <FareRow 
                label="Dead Km Fare"
                estimated={fareBreakup.estimatedFareBreakUp.fareParametersDetails?.contents.deadKmFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.fareParametersDetails?.contents.deadKmFareWithCurrency}
              />
              <FareRow 
                label="Extra Km Fare"
                estimated={fareBreakup.estimatedFareBreakUp.fareParametersDetails?.contents.extraKmFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.fareParametersDetails?.contents.extraKmFareWithCurrency}
              />
              <FareRow 
                label="Pickup Charges"
                estimated={fareBreakup.estimatedFareBreakUp.fareParametersDetails?.contents.pickupChargeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.fareParametersDetails?.contents.pickupChargeWithCurrency}
              />
              <FareRow 
                label="Congestion Charge"
                estimated={fareBreakup.estimatedFareBreakUp.congestionChargeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.congestionChargeWithCurrency}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Time-Based Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Time-Based Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Parameter</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FareRow 
                label="Night Shift Charge"
                estimated={fareBreakup.estimatedFareBreakUp.nightShiftChargeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.nightShiftChargeWithCurrency}
              />
              <FareRow 
                label="Waiting Charge"
                estimated={fareBreakup.estimatedFareBreakUp.waitingChargeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.waitingChargeWithCurrency}
              />
              <FareRow 
                label="Extra Time Fare"
                estimated={fareBreakup.estimatedFareBreakUp.rideExtraTimeFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.rideExtraTimeFareWithCurrency}
              />
              <FareRow 
                label="Ride Duration Fare"
                estimated={fareBreakup.estimatedFareBreakUp.fareParametersDetails?.contents.rideDurationFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.fareParametersDetails?.contents.rideDurationFareWithCurrency}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Additional Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Parameter</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <FareRow 
                label="Service Charge"
                estimated={fareBreakup.estimatedFareBreakUp.serviceChargeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.serviceChargeWithCurrency}
              />
              <FareRow 
                label="Govt Charges"
                estimated={fareBreakup.estimatedFareBreakUp.govtChargesWithCurrency}
                actual={fareBreakup.actualFareBreakUp.govtChargesWithCurrency}
              />
              <FareRow 
                label="Toll Charges"
                estimated={fareBreakup.estimatedFareBreakUp.tollChargesWithCurrency}
                actual={fareBreakup.actualFareBreakUp.tollChargesWithCurrency}
              />
              <FareRow 
                label="Customer Extra Fee"
                estimated={fareBreakup.estimatedFareBreakUp.customerExtraFeeWithCurrency}
                actual={fareBreakup.actualFareBreakUp.customerExtraFeeWithCurrency}
              />
              <FareRow 
                label="Driver Selected Fare"
                estimated={fareBreakup.estimatedFareBreakUp.driverSelectedFareWithCurrency}
                actual={fareBreakup.actualFareBreakUp.driverSelectedFareWithCurrency}
              />
              <FareRow 
                label="Cancellation Dues"
                estimated={fareBreakup.estimatedFareBreakUp.customerCancellationDuesWithCurrency}
                actual={fareBreakup.actualFareBreakUp.customerCancellationDuesWithCurrency}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function RideSummaryPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { merchantId, cityId } = useDashboardContext();

  // Get ride data from location state (passed from RidesPage) or fetch it
  const [ride, setRide] = useState<BPPRideSummaryResponse | undefined>(
    location.state?.ride as BPPRideSummaryResponse | undefined
  );
  const [fareBreakup, setFareBreakup] = useState<FareBreakupResponse | null>(null);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!ride);
  const [fareLoading, setFareLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch ride details if not passed via state
  useEffect(() => {
    if (ride || !rideId || !merchantId) return;
    
    const fetchRideDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBPPRideSummary(merchantId, rideId, cityId || undefined);
        setRide(data);
      } catch (err) {
        console.error('Failed to fetch ride details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ride details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId, merchantId, cityId, ride]);

  // Fetch fare breakup when switching to fare tab
  useEffect(() => {
    if (activeTab !== 'fare' || fareBreakup || !rideId || !merchantId) return;
    
    const fetchFareBreakup = async () => {
      setFareLoading(true);
      try {
        const data = await getBPPFareBreakup(merchantId, rideId, cityId || undefined);
        setFareBreakup(data);
      } catch (err) {
        console.error('Failed to fetch fare breakup:', err);
      } finally {
        setFareLoading(false);
      }
    };

    fetchFareBreakup();
  }, [activeTab, fareBreakup, rideId, merchantId, cityId]);

  // Fetch route data when switching to route tab
  useEffect(() => {
    if (activeTab !== 'route' || routeData || !rideId || !merchantId) return;
    
    const fetchRouteData = async () => {
      setRouteLoading(true);
      try {
        const data = await getBPPRideRoute(merchantId, rideId, cityId || undefined);
        setRouteData(data);
      } catch (err) {
        console.error('Failed to fetch route data:', err);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRouteData();
  }, [activeTab, routeData, rideId, merchantId, cityId]);

  // Loading state
  if (isLoading) {
    return (
      <Page>
        <PageHeader title="Ride Summary" />
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContent>
      </Page>
    );
  }

  // Error state
  if (error || !ride) {
    return (
      <Page>
        <PageHeader title="Ride Summary" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <p className="text-muted-foreground">{error || 'No ride information found.'}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rides
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
        title="Ride Summary"
        breadcrumbs={[
          { label: 'Operations', href: '/ops' },
          { label: 'Rides', href: '/ops/rides' },
          { label: ride.rideShortId || rideId || 'Details' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rides
          </Button>
        }
      />

      <PageContent>
        {/* Ride Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Ride #{ride.rideShortId || ride.rideId}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    className="text-sm text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors text-left"
                    title="Click to copy"
                    onClick={() => {
                      navigator.clipboard.writeText(ride.rideId);
                    }}
                  >
                    {ride.rideId}
                  </button>
                  <button
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                    title="Copy Ride ID"
                    onClick={() => {
                      navigator.clipboard.writeText(ride.rideId);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                {ride.rideBookingTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Booked: {formatDateTime(ride.rideBookingTime)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ride.bookingStatus} type="booking" />
                <StatusBadge status={ride.rideStatus} type="ride" />
                {ride.vehicleServiceTierName && (
                  <Badge variant="outline">{ride.vehicleServiceTierName}</Badge>
                )}
                {ride.tripCategory && (
                  <Badge variant="secondary">{ride.tripCategory}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Info - Only show for cancelled rides - moved to top */}
        {ride.bookingStatus.includes('CANCELLED') && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Cancellation Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-red-600">Cancelled By</Label>
                  <div className="font-medium mt-1">{ride.cancelledBy || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-red-600">Cancellation Time</Label>
                  <div className="font-medium mt-1">
                    {ride.cancelledTime ? formatDateTime(ride.cancelledTime) : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-red-600">Reason</Label>
                  <div className="font-medium mt-1">{ride.cancellationReason || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fare Change Detected - Show when estimated and actual fares differ */}
        {ride.estimatedFareWithCurrency && ride.actualFareWithCurrency && 
         ride.estimatedFareWithCurrency.amount !== ride.actualFareWithCurrency.amount && (
          <Card 
            className="mb-6 border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setActiveTab('fare')}
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <DollarSign className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800">Fare Change Detected</h3>
                      <p className="text-sm text-amber-600">Click to view detailed breakdown</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pl-12 sm:pl-0">
                    <div className="text-center">
                      <Label className="text-xs text-amber-600">Estimated</Label>
                      <div className="font-medium text-amber-800">
                        {ride.estimatedFareWithCurrency.currency} {ride.estimatedFareWithCurrency.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <Label className="text-xs text-amber-600">Actual</Label>
                      <div className="font-medium text-amber-800">
                        {ride.actualFareWithCurrency.currency} {ride.actualFareWithCurrency.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <Label className="text-xs text-amber-600">Difference</Label>
                      <div className={cn(
                        "font-bold",
                        (ride.actualFareWithCurrency.amount - ride.estimatedFareWithCurrency.amount) > 0 
                          ? "text-red-600" 
                          : "text-green-600"
                      )}>
                        {(ride.actualFareWithCurrency.amount - ride.estimatedFareWithCurrency.amount) > 0 ? '+' : ''}
                        {ride.actualFareWithCurrency.currency} {(ride.actualFareWithCurrency.amount - ride.estimatedFareWithCurrency.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Probable Reasons */}
                {(ride.pickupDropOutsideOfThreshold || ride.driverDeviatedFromRoute) && (
                  <div className="flex items-center gap-2 pl-12 border-t border-amber-200 pt-3">
                    <span className="text-xs font-medium text-amber-700">Probable reason:</span>
                    <div className="flex flex-wrap gap-2">
                      {ride.pickupDropOutsideOfThreshold && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                          Pickup/Drop outside threshold
                        </Badge>
                      )}
                      {ride.driverDeviatedFromRoute && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                          Driver deviated from route
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="fare" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Fare Breakup
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Route
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <div className="font-medium">{ride.customerName || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <div className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {ride.customerPhoneNo || '-'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver & Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="h-5 w-5" />
                    Driver & Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver Name</Label>
                      <div className="font-medium">{ride.driverName || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver Phone</Label>
                      <div className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {ride.driverPhoneNo || '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
                      <div className="font-mono font-medium">{ride.vehicleNo || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Vehicle Type</Label>
                      <div className="font-medium">{ride.vehicleVariant || '-'}</div>
                    </div>
                  </div>
                  {ride.driverId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver ID</Label>
                      <div className="font-mono text-sm text-muted-foreground truncate" title={ride.driverId}>
                        {ride.driverId}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <Label className="text-xs text-green-700 font-medium">Pickup Location</Label>
                      <div className="font-medium mt-1">
                        {formatLocationAddress(ride.customerPickupLocation)}
                      </div>
                      {ride.customerPickupLocation && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {ride.customerPickupLocation.lat.toFixed(6)}, {ride.customerPickupLocation.lon.toFixed(6)}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <Label className="text-xs text-red-700 font-medium">Drop Location</Label>
                      <div className="font-medium mt-1">
                        {formatLocationAddress(ride.customerDropLocation)}
                      </div>
                      {ride.customerDropLocation && (
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {ride.customerDropLocation.lat.toFixed(6)}, {ride.customerDropLocation.lon.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fare & Distance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Fare & Distance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Estimated Fare</Label>
                      <div className="font-medium text-lg">
                        {formatFare(ride.estimatedFareWithCurrency)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Actual Fare</Label>
                      <div className="font-medium text-lg text-green-600">
                        {formatFare(ride.actualFareWithCurrency)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Estimated Distance</Label>
                      <div className="font-medium">{formatDistance(ride.rideDistanceEstimated)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Chargeable Distance</Label>
                      <div className="font-medium">{formatDistance(ride.chargeableDistance)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time & Duration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Time & Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Booking Time</Label>
                      <div className="font-medium">
                        {ride.rideBookingTime ? formatDateTime(ride.rideBookingTime) : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ride Created</Label>
                      <div className="font-medium">
                        {ride.rideCreatedAt ? formatDateTime(ride.rideCreatedAt) : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ride Start</Label>
                      <div className="font-medium">
                        {ride.rideStartTime ? formatDateTime(ride.rideStartTime) : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ride End</Label>
                      <div className="font-medium">
                        {ride.rideEndTime ? formatDateTime(ride.rideEndTime) : '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Est. Duration</Label>
                      <div className="font-medium">{formatDuration(ride.estimatedRideDuration)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Actual Duration</Label>
                      <div className="font-medium">{formatDuration(ride.rideDuration)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OTP & Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Key className="h-5 w-5" />
                    OTP & Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Ride OTP</Label>
                      <div className="font-mono font-bold text-2xl tracking-widest">
                        {ride.rideOtp || '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End OTP</Label>
                      <div className="font-mono font-bold text-2xl tracking-widest">
                        {ride.endOtp || '-'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5" />
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Trip Category</Label>
                      <div className="font-medium mt-1">{ride.tripCategoryV2?.contents || ride.tripCategory || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Round Trip</Label>
                      <div className="mt-1">
                        <Badge variant={ride.roundTrip ? 'default' : 'secondary'}>
                          {ride.roundTrip ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pet Ride</Label>
                      <div className="mt-1">
                        <Badge variant={ride.isPetRide ? 'default' : 'secondary'}>
                          {ride.isPetRide ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ride City</Label>
                      <div className="font-medium mt-1">{ride.rideCity || '-'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pickup/Drop Threshold</Label>
                      <div className="mt-1">
                        <Badge variant={ride.pickupDropOutsideOfThreshold ? 'destructive' : 'outline'}>
                          {ride.pickupDropOutsideOfThreshold ? 'Outside' : 'Within'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Driver Deviated</Label>
                      <div className="mt-1">
                        <Badge variant={ride.driverDeviatedFromRoute ? 'destructive' : 'outline'}>
                          {ride.driverDeviatedFromRoute ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Fare Breakup Tab */}
          <TabsContent value="fare">
            <FareBreakupContent fareBreakup={fareBreakup} fareLoading={fareLoading} />
          </TabsContent>

          {/* Route Tab */}
          <TabsContent value="route">
            {routeLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : routeData?.actualRoute && routeData.actualRoute.length > 0 ? (
              <RouteMap
                actualRoute={routeData.actualRoute}
                pickupLocation={ride.customerPickupLocation ? {
                  lat: ride.customerPickupLocation.lat,
                  lon: ride.customerPickupLocation.lon,
                  address: formatLocationAddress(ride.customerPickupLocation)
                } : undefined}
                estimatedDropLocation={ride.customerDropLocation ? {
                  lat: ride.customerDropLocation.lat,
                  lon: ride.customerDropLocation.lon,
                  address: formatLocationAddress(ride.customerDropLocation)
                } : undefined}
                actualDropLocation={ride.actualDropLocation ? {
                  lat: ride.actualDropLocation.lat,
                  lon: ride.actualDropLocation.lon
                } : undefined}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No route data available for this ride</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </Page>
  );
}
