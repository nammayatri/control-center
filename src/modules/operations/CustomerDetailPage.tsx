import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  useCustomerInfo,
  useMultimodalJourneyList,
  useCancellationDuesDetails,
  useBlockCustomer,
  useUnblockCustomer,
  useDeleteCustomer,
  useSyncCancellationDues,
} from '../../hooks/useCustomers';
import { useResetDeviceSwitchCount, usePurchasedPasses, useChangePassStartDate, usePassTransactions } from '../../hooks/useBooth';
import { useDashboardContext } from '../../context/DashboardContext';
import { usePermissions } from '../../context/PermissionsContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatCurrency, formatDistance } from '../../lib/utils';
import { listCustomers } from '../../services/customers';
import type { JourneyListItem, RideContents, MultiModalRideContents } from '../../services/customers';
import {
  ArrowLeft,
  Phone,
  Calendar,
  Shield,
  ShieldOff,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Car,
  CreditCard,
  User,
  Loader2,
  Lock,
  LogIn,
  Ticket,
  Eye,
  Clock,
  MapPin,
  Star,
  Train,
  ChevronLeft,
  ChevronRight,
  Search,
  Navigation,
  Banknote,
  CircleDot,
  CheckCircle2,
  XCircle,
  Timer,

  Hash,
  Building2,
  Bus,
  Milestone,
  Receipt,
  Gift,
  QrCode,
  Wallet,
  ShieldCheck,
  PawPrint,
  Accessibility,
  Moon,
  CalendarDays,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Label } from '../../components/ui/label';
import type { PurchasedPass } from '../../types/booth';
import { toast } from 'sonner';

// ============================================
// Helper Components
// ============================================

function InfoRow({ icon: Icon, label, value, className = '' }: {
  icon?: any;
  label: string;
  value: React.ReactNode;
  className?: string
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-medium text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'COMPLETED' || status === 'Completed' || status === 'Success'
    ? 'default'
    : status === 'CANCELLED' || status === 'Failed'
      ? 'destructive'
      : 'secondary';

  const Icon = status === 'COMPLETED' || status === 'Completed' || status === 'Success'
    ? CheckCircle2
    : status === 'CANCELLED' || status === 'Failed'
      ? XCircle
      : CircleDot;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LocationCard({ type, location }: { type: 'pickup' | 'drop'; location: any }) {
  if (!location) return null;
  const isPickup = type === 'pickup';
  return (
    <div className={`relative p-4 rounded-xl border-2 ${isPickup ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30' : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30'}`}>
      <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${isPickup ? 'bg-green-500' : 'bg-red-500'}`} />
      <div className="ml-6">
        <p className={`text-xs font-medium uppercase tracking-wide ${isPickup ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPickup ? 'Pickup' : 'Drop-off'}
        </p>
        <p className="font-semibold mt-1">{location.title || location.door || location.building || 'Location'}</p>
        {location.street && <p className="text-sm text-muted-foreground">{location.street}</p>}
        {location.area && <p className="text-sm text-muted-foreground">{location.area}</p>}
        {(location.city || location.state) && (
          <p className="text-xs text-muted-foreground mt-1">{[location.city, location.state].filter(Boolean).join(', ')}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, variant = 'default' }: {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: any;
  variant?: 'default' | 'success' | 'warning' | 'primary';
}) {
  const variantStyles = {
    default: 'bg-muted/50',
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
    primary: 'bg-primary/5 border-primary/20',
  };
  return (
    <div className={`p-4 rounded-xl border ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  );
}

// ============================================
// Ride Detail View Component
// ============================================
function RideDetailView({ ride }: { ride: RideContents }) {
  const toLocation = ride.bookingDetails?.contents?.toLocation;
  const rideInfo = ride.rideList?.[0];

  return (
    <div className="space-y-6 pb-4">
      {/* Header with Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{ride.serviceTierName || 'Ride'}</h3>
              <StatusBadge status={ride.status} />
            </div>
            <p className="text-sm text-muted-foreground">{ride.serviceTierShortDesc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{formatCurrency(ride.estimatedFare)}</p>
          <p className="text-sm text-muted-foreground">Estimated Fare</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Distance"
          value={formatDistance(ride.estimatedDistance)}
          icon={Navigation}
        />
        <StatCard
          label="Duration"
          value={`${Math.round(ride.duration / 60)} min`}
          subValue={`Est. ${Math.round(ride.estimatedDuration / 60)} min`}
          icon={Timer}
        />
        <StatCard
          label="Vehicle"
          value={ride.vehicleServiceTierType?.replace(/_/g, ' ') || 'N/A'}
          subValue={`${ride.vehicleServiceTierSeatingCapacity} seats`}
          icon={Car}
        />
        <StatCard
          label="Trip Type"
          value={ride.tripCategory?.tag || 'OneWay'}
          icon={Milestone}
        />
      </div>

      {/* Locations */}
      <SectionCard title="Route" icon={MapPin}>
        <div className="space-y-3">
          <LocationCard type="pickup" location={ride.fromLocation} />
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-border" />
          </div>
          <LocationCard type="drop" location={toLocation} />
        </div>
      </SectionCard>

      {/* Timeline */}
      <SectionCard title="Timeline" icon={Clock}>
        <div className="relative">
          <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-border" />
          <div className="space-y-4">
            {[
              { label: 'Booking Created', time: ride.createdAt, icon: Receipt },
              { label: 'Scheduled Time', time: ride.rideScheduledTime, icon: Calendar },
              { label: 'Ride Started', time: ride.rideStartTime, icon: Navigation },
              { label: 'Ride Ended', time: ride.rideEndTime, icon: CheckCircle2 },
            ].filter(item => item.time).map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 relative">
                <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.time!)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Driver & Vehicle Info */}
      {rideInfo && (
        <SectionCard title="Driver & Vehicle" icon={User}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Driver */}
            <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{rideInfo.driverName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {rideInfo.driverNumber}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{rideInfo.driverRatings}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                <InfoRow label="Registered" value={rideInfo.driverRegisteredAt ? formatDateTime(rideInfo.driverRegisteredAt) : 'N/A'} />
                <InfoRow label="Arrival Time" value={rideInfo.driverArrivalTime ? formatDateTime(rideInfo.driverArrivalTime) : 'N/A'} />
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg font-mono">{rideInfo.vehicleNumber}</p>
                  <p className="text-sm text-muted-foreground">{rideInfo.vehicleModel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Color" value={rideInfo.vehicleColor} />
                <InfoRow label="Variant" value={rideInfo.vehicleVariant?.replace(/_/g, ' ')} />
                <InfoRow label="Vehicle Age" value={rideInfo.vehicleAge ? `${rideInfo.vehicleAge} months` : 'N/A'} />
                <InfoRow label="Service Tier" value={rideInfo.vehicleServiceTierType?.replace(/_/g, ' ')} />
              </div>
            </div>
          </div>

          {/* Ride Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <InfoRow icon={Hash} label="Ride ID" value={<span className="font-mono text-xs">{rideInfo.shortRideId}</span>} />
            <InfoRow icon={Lock} label="OTP" value={<span className="font-mono">{rideInfo.rideOtp}</span>} />
            <InfoRow icon={Navigation} label="Distance" value={formatDistance(rideInfo.chargeableRideDistance)} />
            <InfoRow icon={Banknote} label="Final Price" value={formatCurrency(rideInfo.computedPrice)} />
          </div>
        </SectionCard>
      )}

      {/* Fare Breakdown */}
      <SectionCard title="Fare Breakdown" icon={Receipt}>
        <div className="space-y-2">
          {ride.fareBreakup?.filter(item => item.amount > 0).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{item.description.replace(/_/g, ' ')}</span>
              <span className="font-semibold">{formatCurrency(item.amount)}</span>
            </div>
          ))}
          {ride.discount && ride.discount > 0 && (
            <div className="flex items-center justify-between py-2 text-green-600">
              <span className="text-sm flex items-center gap-2"><Gift className="h-4 w-4" /> Discount</span>
              <span className="font-semibold">-{formatCurrency(ride.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-primary/20">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(rideInfo?.computedPrice || ride.estimatedTotalFare)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Payment & Flags */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Payment" icon={Wallet}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <Badge variant={rideInfo?.onlinePayment ? 'default' : 'outline'}>
                {rideInfo?.onlinePayment ? 'Online' : 'Cash'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toll Confidence</span>
              <span className="font-medium">{rideInfo?.tollConfidence || 'N/A'}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ride Flags" icon={ShieldCheck}>
          <div className="flex flex-wrap gap-2">
            {ride.isScheduled && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>}
            {ride.isSafetyPlus && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ShieldCheck className="h-3 w-3 mr-1" />Safety+</Badge>}
            {ride.isInsured && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Shield className="h-3 w-3 mr-1" />Insured</Badge>}
            {ride.isPetRide && <Badge variant="outline"><PawPrint className="h-3 w-3 mr-1" />Pet Ride</Badge>}
            {ride.hasDisability && <Badge variant="outline"><Accessibility className="h-3 w-3 mr-1" />Accessibility</Badge>}
            {ride.hasNightIssue && <Badge variant="destructive"><Moon className="h-3 w-3 mr-1" />Night Issue</Badge>}
            {rideInfo?.isFreeRide && <Badge variant="secondary"><Gift className="h-3 w-3 mr-1" />Free Ride</Badge>}
            {ride.isValueAddNP && <Badge variant="outline">Value Add</Badge>}
            {!ride.isScheduled && !ride.isSafetyPlus && !ride.isInsured && !ride.isPetRide && (
              <span className="text-sm text-muted-foreground">Standard ride</span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Additional Details */}
      <SectionCard title="Additional Information" icon={Building2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoRow icon={Building2} label="Agency" value={ride.agencyName} />
          <InfoRow icon={Phone} label="Support" value={ride.merchantExoPhone} />
          <InfoRow icon={Hash} label="Booking ID" value={<span className="font-mono text-xs">{ride.id?.slice(0, 12)}...</span>} />
          <InfoRow icon={Hash} label="Journey ID" value={<span className="font-mono text-xs">{ride.mbJourneyId?.slice(0, 12)}...</span>} />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================
// MultiModal Journey Detail View Component
// ============================================
function MultiModalDetailView({ journey }: { journey: MultiModalRideContents }) {
  return (
    <div className="space-y-6 pb-4">
      {/* Header with Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
            <Train className="h-7 w-7 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">Multimodal Journey</h3>
              <StatusBadge status={journey.journeyStatus} />
            </div>
            <p className="text-sm text-muted-foreground">{journey.merchantOperatingCityName} • {journey.legs?.length || 0} legs</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">
            {formatCurrency(journey.legs?.reduce((sum, leg) => sum + (leg.totalFare?.amount || 0), 0) || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Fare</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Distance"
          value={formatDistance(journey.estimatedDistance?.value || 0)}
          icon={Navigation}
        />
        <StatCard
          label="Duration"
          value={`${Math.round(journey.estimatedDuration / 60)} min`}
          icon={Timer}
        />
        <StatCard
          label="Result"
          value={journey.result}
          variant={journey.result === 'Success' ? 'success' : 'warning'}
          icon={journey.result === 'Success' ? CheckCircle2 : XCircle}
        />
        <StatCard
          label="Payment ID"
          value={journey.paymentOrderShortId}
          icon={Receipt}
        />
      </div>

      {/* Timeline */}
      <SectionCard title="Journey Timeline" icon={Clock}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoRow icon={Calendar} label="Created" value={formatDateTime(journey.createdAt)} />
          <InfoRow icon={Navigation} label="Started" value={formatDateTime(journey.startTime)} />
          <InfoRow icon={CheckCircle2} label="Ended" value={formatDateTime(journey.endTime)} />
          <InfoRow icon={Timer} label="Total Duration" value={`${Math.round(journey.estimatedDuration / 60)} minutes`} />
        </div>
      </SectionCard>

      {/* Journey Legs - Visual Timeline */}
      <SectionCard title="Journey Legs" icon={Milestone}>
        <div className="space-y-4">
          {journey.legs?.map((leg, idx) => {
            const isLast = idx === (journey.legs?.length || 0) - 1;
            const ModeIcon = leg.travelMode === 'Metro' ? Train : leg.travelMode === 'Bus' ? Bus : Car;
            const modeColor = leg.travelMode === 'Metro' ? 'bg-blue-500' : leg.travelMode === 'Bus' ? 'bg-green-500' : 'bg-amber-500';
            const modeBg = leg.travelMode === 'Metro' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              : leg.travelMode === 'Bus' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';

            return (
              <div key={leg.journeyLegId} className="relative">
                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent z-0" style={{ height: 'calc(100% - 3rem)' }} />
                )}

                <div className={`relative rounded-xl border p-4 ${modeBg}`}>
                  {/* Leg Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${modeColor} flex items-center justify-center shrink-0`}>
                        <ModeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{leg.travelMode}</span>
                          <Badge variant="outline" className="text-xs">{leg.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Leg {idx + 1} of {journey.legs?.length}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {leg.travelMode === 'Taxi' ?
                        <p className="font-bold">{formatCurrency(leg.estimatedMinFare?.amount || 0)} - {formatCurrency(leg.estimatedMaxFare?.amount || 0)}</p> :
                        <p className="font-bold">{formatCurrency(leg.totalFare?.amount || 0)}</p>
                      }
                      <p className="text-xs text-muted-foreground">{formatDistance(leg.estimatedDistance?.value || 0)} • {Math.round(leg.estimatedDuration / 60)} min</p>
                    </div>
                  </div>

                  {/* Mode-specific details */}
                  {leg.legExtraInfo?.tag === 'Metro' && (() => {
                    const metroInfo = leg.legExtraInfo.contents as any;
                    const routeInfo = metroInfo?.routeInfo?.[0];
                    return (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Train className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{metroInfo?.providerName}</span>
                        </div>

                        {routeInfo && (
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-3">
                            {/* Route visualization */}
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: `#${routeInfo.lineColorCode}` }} />
                                <div className="w-0.5 h-8" style={{ backgroundColor: `#${routeInfo.lineColorCode}` }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${routeInfo.lineColorCode}` }} />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <p className="font-semibold text-sm">{routeInfo.originStop?.name}</p>
                                  {routeInfo.platformNumber && <p className="text-xs text-muted-foreground">Platform {routeInfo.platformNumber}</p>}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{routeInfo.destinationStop?.name}</p>
                                </div>
                              </div>
                              <Badge style={{ backgroundColor: `#${routeInfo.lineColorCode}`, color: 'white' }}>
                                {routeInfo.lineColor} Line
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* Ticket Info */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {metroInfo?.ticketNo && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <QrCode className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Ticket Number</p>
                                <p className="font-mono text-sm font-medium">{metroInfo.ticketNo[0]}</p>
                              </div>
                            </div>
                          )}
                          {metroInfo?.categoryBookingDetails?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Ticket className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">{metroInfo.categoryBookingDetails[0].categoryName}</p>
                                <p className="font-medium text-sm">{formatCurrency(metroInfo.categoryBookingDetails[0].categoryFinalPrice?.amount)}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Refund Info for Failed Tickets */}
                        {metroInfo?.refund && (
                          <div className={`mt-3 p-3 rounded-lg border ${metroInfo.refund.status === 'SUCCESS' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className={`h-4 w-4 ${metroInfo.refund.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`} />
                              <span className="font-medium text-sm">Refund Information</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Refund Amount</p>
                                <p className="font-bold text-lg">{formatCurrency(metroInfo.refund.amount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Refund Status</p>
                                <Badge variant={metroInfo.refund.status === 'SUCCESS' ? 'default' : 'destructive'} className="mt-1">
                                  {metroInfo.refund.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {leg.legExtraInfo?.tag === 'Taxi' && (() => {
                    const taxiInfo = leg.legExtraInfo.contents as any;
                    return (
                      <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Car className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-sm">{taxiInfo?.serviceTierName || 'Taxi'}</span>
                          {taxiInfo?.trackingStatus && (
                            <Badge variant="outline" className="text-xs">{taxiInfo.trackingStatus}</Badge>
                          )}
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          {/* Route visualization */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full border-2 border-amber-500" />
                              <div className="w-0.5 h-8 bg-amber-500" />
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="font-semibold text-sm">{taxiInfo?.origin?.address?.title || taxiInfo?.origin?.address?.area || 'Pickup'}</p>
                                <p className="text-xs text-muted-foreground">{taxiInfo?.origin?.address?.street}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{taxiInfo?.destination?.address?.title || taxiInfo?.destination?.address?.area || 'Dropoff'}</p>
                                <p className="text-xs text-muted-foreground">{taxiInfo?.destination?.address?.street}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Info */}
                        {taxiInfo?.vehicleNumber && (
                          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg mt-3">
                            <Car className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vehicle</p>
                              <p className="font-mono text-sm font-medium">{taxiInfo.vehicleNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Bus Leg Details */}
                  {leg.legExtraInfo?.tag === 'Bus' && (() => {
                    const busInfo = leg.legExtraInfo.contents as any;
                    const serviceTier = busInfo?.selectedServiceTier;
                    return (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                        {/* Provider & Route Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">{busInfo?.providerName}</span>
                          </div>
                          {busInfo?.trackingStatus && (
                            <Badge variant="outline" className="text-xs">{busInfo.trackingStatus}</Badge>
                          )}
                        </div>

                        {/* Route Info Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-3">
                          {/* Route Number & Fleet */}
                          <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <span className="font-bold text-green-700 dark:text-green-300 text-sm">{busInfo?.routeName}</span>
                              </div>
                              <div>
                                <p className="font-semibold">{serviceTier?.serviceTierName || 'Bus'}</p>
                                <p className="text-xs text-muted-foreground">{serviceTier?.serviceTierDescription}</p>
                              </div>
                            </div>
                            {busInfo?.fleetNo && (
                              <Badge variant="outline" className="font-mono">{busInfo.fleetNo}</Badge>
                            )}
                          </div>

                          {/* Route visualization */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full border-2 border-green-500" />
                              <div className="w-0.5 h-10 bg-green-500" />
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div>
                                <p className="font-semibold text-sm">{busInfo?.originStop?.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{busInfo?.originStop?.code}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{busInfo?.destinationStop?.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{busInfo?.destinationStop?.code}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ticket & Category Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          {busInfo?.ticketNo?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <QrCode className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Ticket No</p>
                                <p className="font-mono text-sm font-medium">{busInfo.ticketNo[0]}</p>
                              </div>
                            </div>
                          )}
                          {serviceTier?.fare && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Banknote className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fare</p>
                                <p className="font-medium text-sm">{formatCurrency(serviceTier.fare.amount)}</p>
                              </div>
                            </div>
                          )}
                          {busInfo?.categoryBookingDetails?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Ticket className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">{busInfo.categoryBookingDetails[0].categoryName}</p>
                                <p className="font-medium text-sm">Qty: {busInfo.categoryBookingDetails[0].categorySelectedQuantity}</p>
                              </div>
                            </div>
                          )}
                          {busInfo?.routeCode && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Hash className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Route Code</p>
                                <p className="font-mono text-sm font-medium">{busInfo.routeCode}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Timing & Validity */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {busInfo?.ticketValidity?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Clock className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Valid Until</p>
                                <p className="text-sm">{formatDateTime(busInfo.ticketValidity[0])}</p>
                              </div>
                            </div>
                          )}
                          {busInfo?.ticketsCreatedAt?.[0] && (
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">Ticket Created</p>
                                <p className="text-sm">{formatDateTime(busInfo.ticketsCreatedAt[0])}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Leg Timing */}
                        {(busInfo?.legStartTime || busInfo?.legEndTime) && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {busInfo?.legStartTime && (
                              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                                <Navigation className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Leg Started</p>
                                  <p className="text-sm">{formatDateTime(busInfo.legStartTime)}</p>
                                </div>
                              </div>
                            )}
                            {busInfo?.legEndTime && (
                              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Leg Ended</p>
                                  <p className="text-sm">{formatDateTime(busInfo.legEndTime)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Passenger Count */}
                        {(busInfo?.adultTicketQuantity !== undefined || busInfo?.childTicketQuantity !== undefined) && (
                          <div className="flex gap-3 mt-3">
                            {busInfo?.adultTicketQuantity > 0 && (
                              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                                <User className="h-3 w-3 mr-1" />
                                {busInfo.adultTicketQuantity} Adult{busInfo.adultTicketQuantity > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {busInfo?.childTicketQuantity > 0 && (
                              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                                <User className="h-3 w-3 mr-1" />
                                {busInfo.childTicketQuantity} Child{busInfo.childTicketQuantity > 1 ? 'ren' : ''}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Booking ID */}
                        {busInfo?.bookingId && (
                          <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Booking ID</p>
                            <p className="font-mono text-xs break-all">{busInfo.bookingId}</p>
                          </div>
                        )}

                        {/* Refund Info for Failed Tickets */}
                        {busInfo?.refund && (
                          <div className={`mt-3 p-3 rounded-lg border ${busInfo.refund.status === 'SUCCESS' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className={`h-4 w-4 ${busInfo.refund.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`} />
                              <span className="font-medium text-sm">Refund Information</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Refund Amount</p>
                                <p className="font-bold text-lg">{formatCurrency(busInfo.refund.amount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Refund Status</p>
                                <Badge variant={busInfo.refund.status === 'SUCCESS' ? 'default' : 'destructive'} className="mt-1">
                                  {busInfo.refund.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Offer */}
      {journey.offer?.offerTitle && (
        <SectionCard title="Available Offers for User (Doesn't gaurantee if user has applied it)" icon={Gift}>
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-700 dark:text-green-400">{journey.offer.offerTitle}</p>
                <p className="text-sm text-green-600 dark:text-green-500">{journey.offer.offerDescription}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* IDs & Reference */}
      <SectionCard title="Reference IDs" icon={Hash}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Journey ID</p>
            <p className="font-mono text-sm mt-1 break-all">{journey.journeyId}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Order ID</p>
            <p className="font-mono text-sm mt-1">{journey.paymentOrderShortId}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================
// Main CustomerDetailPage Component
// ============================================
export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { hasAccess } = usePermissions();
  const { loginModule, logout, currentMerchant } = useAuth();

  // State
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [journeyPage, setJourneyPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<JourneyListItem | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const journeyPageSize = 5;
  const [transactionsPage, setTransactionsPage] = useState(0);
  const transactionsPageSize = 10;

  const hasCustomerAccess = loginModule === 'BAP';
  const apiMerchantId = merchantShortId || currentMerchant?.shortId || merchantId;
  const customerPhoneFromUrl = searchParams.get('phone');

  const [customerData, setCustomerData] = useState<{
    customerId: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNo: string;
    blocked: boolean;
    enabled: boolean;
  } | null>(null);
  const [customerDataLoading, setCustomerDataLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId || !apiMerchantId || !customerPhoneFromUrl) {
        setCustomerDataLoading(false);
        return;
      }
      try {
        const response = await listCustomers(apiMerchantId, cityId || undefined, { phone: customerPhoneFromUrl, limit: 100 });
        if (response.customers?.length > 0) {
          setCustomerData(response.customers.find(c => c.customerId === customerId) || response.customers[0]);
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
      } finally {
        setCustomerDataLoading(false);
      }
    };
    fetchCustomerData();
  }, [customerId, apiMerchantId, cityId, customerPhoneFromUrl]);

  const { data: customerStats, isLoading: statsLoading, error: statsError } = useCustomerInfo(hasCustomerAccess && customerId ? customerId : '');

  const fromDateMs = dateFrom ? new Date(dateFrom).getTime() : undefined;
  const toDateMs = dateTo ? new Date(dateTo).getTime() : undefined;
  const customerPhone = customerData?.phoneNo || customerPhoneFromUrl || '';

  const { data: journeyData, isLoading: journeyLoading, error: journeyError, refetch: refetchJourneys } = useMultimodalJourneyList(
    customerPhone,
    { limit: journeyPageSize, offset: journeyPage * journeyPageSize, fromDate: fromDateMs, toDate: toDateMs, isPaymentSuccess: true }
  );

  const { data: cancellationDues, isLoading: duesLoading, error: duesError } = useCancellationDuesDetails(hasCustomerAccess && customerId ? customerId : '');

  const blockMutation = useBlockCustomer();
  const unblockMutation = useUnblockCustomer();
  const deleteMutation = useDeleteCustomer();
  const syncDuesMutation = useSyncCancellationDues();
  const resetDeviceSwitchCountMutation = useResetDeviceSwitchCount();

  // Purchased Passes
  const { data: purchasedPasses, isLoading: passesLoading } = usePurchasedPasses(customerId || null);
  const changeStartDateMutation = useChangePassStartDate();

  // Pass Transactions
  const { data: passTransactions, isLoading: transactionsLoading } = usePassTransactions(
    customerId || null,
    transactionsPageSize,
    transactionsPage * transactionsPageSize
  );

  // Change Date Dialog State
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);
  const [selectedPassForDateChange, setSelectedPassForDateChange] = useState<PurchasedPass | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleChangeStartDate = async () => {
    if (!customerId || !selectedPassForDateChange?.passNumber || !newStartDate) return;
    changeStartDateMutation.mutate(
      { customerId, passNumber: selectedPassForDateChange.passNumber, startDay: newStartDate },
      {
        onSuccess: () => {
          toast.success('Pass start date updated successfully');
          setChangeDateDialogOpen(false);
          setSelectedPassForDateChange(null);
        },
        onError: (error) => {
          toast.error(`Failed to update start date: ${(error as Error).message}`);
        },
      }
    );
  };

  const openChangeDateDialog = (pass: PurchasedPass) => {
    setSelectedPassForDateChange(pass);
    setNewStartDate(new Date().toISOString().split('T')[0]);
    setChangeDateDialogOpen(true);
  };

  const onResetDeviceSwitchCount = async (custId: string, passId: string) => {
    if (!custId || !passId) return;
    resetDeviceSwitchCountMutation.mutate({ customerId: custId, passId }, {
      onSuccess: () => {
        toast.success('Device switch count reset successfully');
      },
      onError: (error) => {
        toast.error(`Failed to reset device switch count: ${(error as Error).message}`);
      },
    });
  };

  const canBlock = hasAccess('RIDER_MANAGEMENT/CUSTOMER/POST_CUSTOMER_BLOCK');
  const canUnblock = hasAccess('RIDER_MANAGEMENT/CUSTOMER/POST_CUSTOMER_UNBLOCK');
  const canDelete = hasAccess('RIDER_MANAGEMENT/CUSTOMER/DELETE_CUSTOMER_DELETE');
  const canSyncDues = hasAccess('CUSTOMER_CANCELLATION_DUES_SYNC');

  const { rides, multimodalRides } = useMemo(() => {
    if (!journeyData?.list) return { rides: [], multimodalRides: [] };
    const ridesList: JourneyListItem[] = [];
    const multimodalList: JourneyListItem[] = [];
    journeyData.list.forEach(item => {
      if (item.tag === 'Ride') ridesList.push(item);
      else if (item.tag === 'MultiModalRide') multimodalList.push(item);
    });
    return { rides: ridesList, multimodalRides: multimodalList };
  }, [journeyData]);

  const handleBlock = async () => { await blockMutation.mutateAsync(customerId!); setShowBlockDialog(false); window.location.reload(); };
  const handleUnblock = async () => { await unblockMutation.mutateAsync(customerId!); setShowUnblockDialog(false); window.location.reload(); };
  const handleDelete = async () => { await deleteMutation.mutateAsync(customerId!); setShowDeleteDialog(false); navigate('/ops/customers'); };
  const handleSyncDues = async () => { await syncDuesMutation.mutateAsync(customerId!); };
  const handleSearch = () => { setJourneyPage(0); refetchJourneys(); };

  if (!hasCustomerAccess) {
    return (
      <Page><PageHeader title="Customer Details" /><PageContent>
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center"><Lock className="h-8 w-8 text-amber-600" /></div>
            <h3 className="text-lg font-semibold">Customer Login Required</h3>
            <p className="text-muted-foreground">Please log in with the <strong>Customer (BAP)</strong> module.</p>
            <Button onClick={() => { logout(); navigate('/login'); }}><LogIn className="h-4 w-4 mr-2" />Switch Login</Button>
          </CardContent>
        </Card>
      </PageContent></Page>
    );
  }

  if (!merchantId) {
    return <Page><PageHeader title="Customer Details" /><PageContent><Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">Please select a merchant.</p></CardContent></Card></PageContent></Page>;
  }

  if (customerDataLoading || statsLoading) {
    return <Page><PageHeader title="Loading..." /><PageContent><div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div></PageContent></Page>;
  }

  if (!customerData) {
    return (
      <Page><PageHeader title="Customer Details" actions={<Button variant="outline" onClick={() => navigate('/ops/customers')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>} /><PageContent>
        <Card><CardContent className="p-12 text-center space-y-4"><AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" /><p className="text-muted-foreground">Customer not found. Please search by phone number.</p></CardContent></Card>
      </PageContent></Page>
    );
  }

  const customerName = `${customerData.firstName || ''} ${customerData.middleName || ''} ${customerData.lastName || ''}`.trim() || 'Customer';

  return (
    <Page>
      <PageHeader title={customerName} description={`ID: ${customerData.customerId}`} breadcrumbs={[{ label: 'Operations', href: '/ops' }, { label: 'Customers', href: '/ops/customers' }, { label: customerName }]} actions={<Button variant="outline" onClick={() => navigate('/ops/customers')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>} />
      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-8 w-8 text-primary" /></div>
                <div>
                  <CardTitle className="text-2xl">{customerName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {customerData.blocked ? <Badge variant="destructive">Blocked</Badge> : customerData.enabled ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <InfoRow icon={Phone} label="Phone" value={customerData.phoneNo} />
                {!statsError && customerStats && (<>
                  <InfoRow icon={Car} label="Total Rides" value={customerStats.numberOfRides} />
                  <InfoRow icon={AlertTriangle} label="SOS Count" value={customerStats.totalSosCount} />
                  <InfoRow icon={Shield} label="False Alarms" value={customerStats.falseSafetyAlarmCount} />
                </>)}
              </div>
              {customerStats?.safetyCenterDisabledOnDate && <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"><InfoRow icon={Calendar} label="Safety Center Disabled" value={formatDateTime(customerStats.safetyCenterDisabledOnDate)} /></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {customerData.blocked ? canUnblock && <Button className="w-full" variant="outline" onClick={() => setShowUnblockDialog(true)} disabled={unblockMutation.isPending}>{unblockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}Unblock</Button>
                : canBlock && <Button className="w-full" variant="destructive" onClick={() => setShowBlockDialog(true)} disabled={blockMutation.isPending}>{blockMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-2" />}Block</Button>}
              {canSyncDues && <Button className="w-full" variant="outline" onClick={handleSyncDues} disabled={syncDuesMutation.isPending}>{syncDuesMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Sync Dues</Button>}
              {canDelete && <Button className="w-full" variant="outline" onClick={() => setShowDeleteDialog(true)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete</Button>}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6"><CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div><label className="text-sm font-medium mb-1 block">From</label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" /></div>
            <div><label className="text-sm font-medium mb-1 block">To</label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
            <Button onClick={handleSearch} disabled={journeyLoading}><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
        </CardContent></Card>

        <Tabs defaultValue="rides" className="mt-6">
          <TabsList><TabsTrigger value="rides"><Car className="h-4 w-4 mr-2" />Rides ({rides.length})</TabsTrigger><TabsTrigger value="journeys"><Ticket className="h-4 w-4 mr-2" />Tickets ({multimodalRides.length})</TabsTrigger><TabsTrigger value="dues"><CreditCard className="h-4 w-4 mr-2" />Dues</TabsTrigger><TabsTrigger value="passes"><QrCode className="h-4 w-4 mr-2" />Passes ({purchasedPasses?.length || 0})</TabsTrigger></TabsList>

          <TabsContent value="rides" className="mt-4"><Card>
            <CardHeader><CardTitle>Rides</CardTitle></CardHeader>
            <CardContent className="p-0">
              {journeyLoading ? <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                : journeyError ? <div className="p-8 text-center text-muted-foreground"><AlertTriangle className="h-5 w-5 mx-auto mb-2" />Error loading</div>
                  : rides.length === 0 ? <div className="p-8 text-center text-muted-foreground">No rides</div>
                    : <><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Status</TableHead><TableHead>Fare</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>
                      {rides.map(item => {
                        const r = item.contents as RideContents; return (
                          <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedItem(item)}>
                            <TableCell className="font-mono text-xs">{r.id?.slice(0, 8)}...</TableCell>
                            <TableCell className="max-w-[150px] truncate">{r.fromLocation?.title || r.fromLocation?.area}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{r.bookingDetails?.contents?.toLocation?.title || 'N/A'}</TableCell>
                            <TableCell><StatusBadge status={r.status} /></TableCell>
                            <TableCell>{formatCurrency(r.estimatedFare)}</TableCell>
                            <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                            <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody></Table>
                      <div className="flex items-center justify-between px-4 py-3 border-t"><span className="text-sm text-muted-foreground">Page {journeyPage + 1}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={journeyPage === 0} onClick={() => setJourneyPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={!journeyData?.hasMoreData} onClick={() => setJourneyPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div></>}
            </CardContent>
          </Card></TabsContent>

          <TabsContent value="journeys" className="mt-4"><Card>
            <CardHeader><CardTitle>Tickets/Journeys</CardTitle></CardHeader>
            <CardContent className="p-0">
              {journeyLoading ? <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                : journeyError ? <div className="p-8 text-center text-muted-foreground"><AlertTriangle className="h-5 w-5 mx-auto mb-2" />Error</div>
                  : multimodalRides.length === 0 ? <div className="p-8 text-center text-muted-foreground">No journeys</div>
                    : <><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Status</TableHead><TableHead>Legs</TableHead><TableHead>Distance</TableHead><TableHead>Fare</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader><TableBody>
                      {multimodalRides.map(item => {
                        const j = item.contents as MultiModalRideContents; return (
                          <TableRow key={j.journeyId} className="cursor-pointer" onClick={() => setSelectedItem(item)}>
                            <TableCell className="font-mono text-xs">{j.journeyId?.slice(0, 8)}...</TableCell>
                            <TableCell><StatusBadge status={j.journeyStatus} /></TableCell>
                            <TableCell>{j.legs?.length} legs</TableCell>
                            <TableCell>{formatDistance(j.estimatedDistance?.value || 0)}</TableCell>
                            <TableCell>{formatCurrency(j.legs?.reduce((sum, leg) => sum + (leg.totalFare?.amount || 0), 0) || 0)}</TableCell>
                            <TableCell>{formatDateTime(j.createdAt)}</TableCell>
                            <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody></Table>
                      <div className="flex items-center justify-between px-4 py-3 border-t"><span className="text-sm text-muted-foreground">Page {journeyPage + 1}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={journeyPage === 0} onClick={() => setJourneyPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={!journeyData?.hasMoreData} onClick={() => setJourneyPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div></>}
            </CardContent>
          </Card></TabsContent>

          <TabsContent value="dues" className="mt-4"><Card>
            <CardHeader><CardTitle>Cancellation Dues</CardTitle></CardHeader>
            <CardContent>
              {duesLoading ? <Skeleton className="h-20 w-full" /> : duesError ? <div className="text-center py-4 text-muted-foreground"><AlertTriangle className="h-5 w-5 mx-auto mb-2" />Error</div> : cancellationDues ? (
                <div className="grid grid-cols-3 gap-6">
                  <StatCard label="Outstanding" value={formatCurrency(cancellationDues.cancellationCharges)} icon={CreditCard} variant={cancellationDues.cancellationCharges > 0 ? 'warning' : 'default'} />
                  <StatCard label="Disputes Used" value={cancellationDues.disputeChancesUsed} icon={AlertTriangle} />
                  <div className="p-4 rounded-xl border"><p className="text-xs text-muted-foreground uppercase">Can Dispute</p><Badge variant={cancellationDues.canDispute ? 'default' : 'secondary'} className="mt-2">{cancellationDues.canDispute ? 'Yes' : 'No'}</Badge></div>
                </div>
              ) : <p className="text-muted-foreground">No data</p>}
            </CardContent>
          </Card></TabsContent>

          <TabsContent value="passes" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Purchased Passes</CardTitle></CardHeader>
              <CardContent>
                {passesLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                  </div>
                ) : !purchasedPasses || purchasedPasses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No passes found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedPasses.map((pass) => {
                      const isDiamond = pass?.passEntity?.passDetails?.name?.toLowerCase().includes('2000');
                      const goldGradient = 'bg-gradient-to-b from-[#D4AF37] via-[#F7E7CE] to-[#AA6C39] border-[#C5A028]';
                      const silverGradient = 'bg-gradient-to-b from-[#E0E0E0] via-[#F5F5F5] to-[#BDBDBD] border-[#A0A0A0] text-gray-800';
                      const bgClass = isDiamond ? silverGradient : goldGradient;
                      const textColor = isDiamond ? 'text-gray-900' : 'text-[#5C4018]';
                      const borderColor = isDiamond ? 'border-gray-400' : 'border-[#C5A028]';

                      return (
                        <div key={pass.id} className="flex flex-col items-center">
                          <div className={`relative w-full max-w-[280px] h-auto min-h-[350px] rounded-[20px] p-4 shadow-xl flex flex-col items-center justify-between border-4 ${bgClass} font-sans mx-auto`}>
                            {/* Header */}
                            <div className="w-full flex justify-between items-start">
                              <div className="bg-black/10 rounded-full p-1.5">
                                <div className={`w-8 h-8 rounded-full border-2 ${borderColor} flex items-center justify-center font-bold text-xs ${textColor}`}>MTC</div>
                              </div>
                              <div className={`text-right ${textColor}`}>
                                <div className="text-[10px] font-bold tracking-widest opacity-80">PASS NO</div>
                                <div className="font-mono text-sm font-black">{pass.passNumber || '000000'}</div>
                              </div>
                            </div>

                            <div className={`text-center mt-2 ${textColor}`}>
                              <p className="text-xs font-medium opacity-90 uppercase tracking-wide">{pass.passEntity?.passDetails?.name}</p>
                            </div>

                            {/* Main Card */}
                            <div className="relative bg-white rounded-[16px] w-full p-3 flex flex-col items-center shadow-inner mt-2 mb-3">
                              <Avatar className="w-16 h-16 rounded-lg border-2 border-gray-100 shadow-sm mb-2">
                                <AvatarImage src={pass.profilePicture || ''} alt="User" className="object-cover" />
                                <AvatarFallback className="rounded-lg bg-gray-200 text-gray-400 text-lg">U</AvatarFallback>
                              </Avatar>
                              <div className="text-2xl font-black text-gray-800 mb-1">₹{pass.passEntity?.passDetails?.amount}</div>
                              <div className="w-3/4 h-px bg-gray-200 my-1"></div>
                              <div className="text-center">
                                <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">Valid Till</p>
                                <p className="text-sm font-bold text-gray-900 uppercase">
                                  {new Date(pass.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="w-full flex justify-between items-center">
                              <QrCode className="w-6 h-6 text-gray-800" />
                              <Badge variant={isDiamond ? 'secondary' : 'default'} className="text-xs">Active</Badge>
                            </div>
                          </div>

                          {/* Change Start Date Button */}
                          <Button
                            variant="default"
                            size="sm"
                            className="mt-4 gap-2"
                            onClick={() => openChangeDateDialog(pass)}
                          >
                            <CalendarDays className="w-4 h-4" />
                            Change Start Date
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2"
                            onClick={() => onResetDeviceSwitchCount(customerId!, pass.id!)}
                          >
                            Reset Switch Count
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pass Transactions */}
            <Card className="mt-6">
              <CardHeader><CardTitle>Pass Transactions</CardTitle></CardHeader>
              <CardContent className="p-0">
                {transactionsLoading ? (
                  <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : !passTransactions || passTransactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No transactions found</div>
                ) : (
                  <>
                    <Table><TableHeader><TableRow><TableHead>Pass Name</TableHead><TableHead>Pass Code</TableHead><TableHead>Status</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Amount</TableHead><TableHead>Created At</TableHead></TableRow></TableHeader><TableBody>
                      {passTransactions.map((transaction, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{transaction.passName}</TableCell>
                          <TableCell className="font-mono text-xs">{transaction.passCode}</TableCell>
                          <TableCell><StatusBadge status={transaction.status} /></TableCell>
                          <TableCell>{new Date(transaction.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(transaction.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody></Table>
                    <div className="flex items-center justify-between px-4 py-3 border-t"><span className="text-sm text-muted-foreground">Page {transactionsPage + 1}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={transactionsPage === 0} onClick={() => setTransactionsPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={!passTransactions || passTransactions.length < transactionsPageSize} onClick={() => setTransactionsPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Change Start Date Dialog */}
        <Dialog open={changeDateDialogOpen} onOpenChange={setChangeDateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Pass Start Date</DialogTitle>
              <DialogDescription>
                Update the start date for this pass. The pass validity will be recalculated from the new date.
              </DialogDescription>
            </DialogHeader>
            {selectedPassForDateChange && (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{selectedPassForDateChange.passEntity?.passDetails?.name}</p>
                  <p className="text-sm text-muted-foreground">Pass #: {selectedPassForDateChange.passNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label>New Start Date</Label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangeDateDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleChangeStartDate}
                disabled={changeStartDateMutation.isPending || !newStartDate}
              >
                {changeStartDateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Start Date
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{selectedItem?.tag === 'Ride' ? <><Car className="h-5 w-5" />Ride Details</> : <><Train className="h-5 w-5" />Journey Details</>}</DialogTitle></DialogHeader>
          {selectedItem?.tag === 'Ride' && <RideDetailView ride={selectedItem.contents as RideContents} />}
          {selectedItem?.tag === 'MultiModalRide' && <MultiModalDetailView journey={selectedItem.contents as MultiModalRideContents} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Block Customer</AlertDialogTitle><AlertDialogDescription>Block {customerName}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground">Block</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Unblock Customer</AlertDialogTitle><AlertDialogDescription>Unblock {customerName}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleUnblock}>Unblock</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Customer</AlertDialogTitle><AlertDialogDescription>Delete {customerName}? This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Page>
  );
}
