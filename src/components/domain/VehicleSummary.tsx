import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Car, User } from 'lucide-react';

interface VehicleSummaryProps {
  vehicle: {
    vehicleNo: string;
    vehicleType?: string;
    driverId?: string;
    driverName?: string;
    fleetOwnerId?: string;
    fleetOwnerName?: string;
    isActive: boolean;
  };
  compact?: boolean;
  className?: string;
}

export function VehicleSummary({ vehicle, compact = false, className }: VehicleSummaryProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Car className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{vehicle.vehicleNo}</p>
          {vehicle.vehicleType && (
            <p className="text-xs text-muted-foreground">{vehicle.vehicleType}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <Car className="h-6 w-6 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium font-mono">{vehicle.vehicleNo}</p>
          <Badge variant={vehicle.isActive ? 'success' : 'secondary'}>
            {vehicle.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
          {vehicle.vehicleType && (
            <span>{vehicle.vehicleType}</span>
          )}
          {vehicle.driverName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {vehicle.driverName}
            </span>
          )}
          {vehicle.fleetOwnerName && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              Fleet: {vehicle.fleetOwnerName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

