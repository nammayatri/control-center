import { Badge, type BadgeProps } from '../ui/badge';

// Ride Status Badge
type RideStatus = 'NEW' | 'INPROGRESS' | 'COMPLETED' | 'CANCELLED';

const rideStatusConfig: Record<RideStatus, { label: string; variant: BadgeProps['variant'] }> = {
  NEW: { label: 'New', variant: 'info' },
  INPROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

interface RideStatusBadgeProps {
  status: RideStatus | string;
  className?: string;
}

export function RideStatusBadge({ status, className }: RideStatusBadgeProps) {
  const config = rideStatusConfig[status as RideStatus] || { 
    label: status, 
    variant: 'secondary' as const 
  };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Booking Status Badge
type BookingStatus = 
  | 'NEW'
  | 'CONFIRMED'
  | 'AWAITING_REASSIGNMENT'
  | 'REALLOCATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'TRIP_ASSIGNED';

const bookingStatusConfig: Record<BookingStatus, { label: string; variant: BadgeProps['variant'] }> = {
  NEW: { label: 'New', variant: 'info' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  AWAITING_REASSIGNMENT: { label: 'Reassigning', variant: 'warning' },
  REALLOCATED: { label: 'Reallocated', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  TRIP_ASSIGNED: { label: 'Assigned', variant: 'success' },
};

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = bookingStatusConfig[status as BookingStatus] || { 
    label: status, 
    variant: 'secondary' as const 
  };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Issue Status Badge
type IssueStatus = 
  | 'OPEN'
  | 'PENDING_INTERNAL'
  | 'PENDING_EXTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'NOT_APPLICABLE';

const issueStatusConfig: Record<IssueStatus, { label: string; variant: BadgeProps['variant'] }> = {
  OPEN: { label: 'Open', variant: 'info' },
  PENDING_INTERNAL: { label: 'Pending (Internal)', variant: 'warning' },
  PENDING_EXTERNAL: { label: 'Pending (External)', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
  REOPENED: { label: 'Reopened', variant: 'info' },
  NOT_APPLICABLE: { label: 'N/A', variant: 'secondary' },
};

interface IssueStatusBadgeProps {
  status: IssueStatus | string;
  className?: string;
}

export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  const config = issueStatusConfig[status as IssueStatus] || { 
    label: status, 
    variant: 'secondary' as const 
  };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Verification Status Badge
type VerificationStatus = 'PENDING' | 'VALID' | 'INVALID' | 'MANUAL_VERIFICATION_REQUIRED';

const verificationStatusConfig: Record<VerificationStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  VALID: { label: 'Verified', variant: 'success' },
  INVALID: { label: 'Invalid', variant: 'destructive' },
  MANUAL_VERIFICATION_REQUIRED: { label: 'Review Required', variant: 'warning' },
};

interface VerificationStatusBadgeProps {
  status: VerificationStatus | string;
  className?: string;
}

export function VerificationStatusBadge({ status, className }: VerificationStatusBadgeProps) {
  const config = verificationStatusConfig[status as VerificationStatus] || { 
    label: status, 
    variant: 'secondary' as const 
  };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

// Driver Mode Badge
type DriverMode = 'ONLINE' | 'OFFLINE' | 'SILENT';

const driverModeConfig: Record<DriverMode, { label: string; variant: BadgeProps['variant'] }> = {
  ONLINE: { label: 'Online', variant: 'success' },
  OFFLINE: { label: 'Offline', variant: 'secondary' },
  SILENT: { label: 'Silent', variant: 'warning' },
};

interface DriverModeBadgeProps {
  mode: DriverMode | string;
  className?: string;
}

export function DriverModeBadge({ mode, className }: DriverModeBadgeProps) {
  const config = driverModeConfig[mode as DriverMode] || { 
    label: mode, 
    variant: 'secondary' as const 
  };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

