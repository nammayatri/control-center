import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn, getInitials } from '../../lib/utils';
import { Star, Phone, Car, MapPin, Pencil } from 'lucide-react';
import { getCityName } from '../../lib/cityMapping';

interface DriverBadgeProps {
  name: string;
  phone?: string;
  rating?: number;
  status?: 'online' | 'offline' | 'busy' | 'blocked';
  vehicleNumber?: string;
  city?: string;
  onEditCity?: () => void;
  compact?: boolean;
  className?: string;
}

export function DriverBadge({
  name,
  phone,
  rating,
  status,
  vehicleNumber,
  city,
  onEditCity,
  compact = false,
  className,
}: Readonly<DriverBadgeProps>) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Offline';
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          {phone && (
            <p className="text-xs text-muted-foreground">{phone}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
              getStatusColor()
            )}
          />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{name}</p>
          {status && (
            <Badge
              variant={status === 'blocked' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {getStatusLabel()}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </span>
          )}
          {rating !== undefined && rating !== null && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {vehicleNumber && (
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {vehicleNumber}
            </span>
          )}
          {city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city}
              {onEditCity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCity();
                  }}
                  className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                  title="Change operating city"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DriverSummaryProps {
  driver: {
    id: string;
    firstName: string;
    lastName?: string;
    mobileNumber?: string;
    rating?: number;
    enabled: boolean;
    blocked: boolean;
    verified: boolean;
    vehicleNumber?: string;
    numberOfRides: number;
    merchantOperatingCity?: string;
    driverMode?: string;
  };
  onEditCity?: () => void;
  className?: string;
}

export function DriverSummary({ driver, onEditCity, className }: Readonly<DriverSummaryProps>) {
  const name = `${driver.firstName} ${driver.lastName || ''}`.trim();
  
  const getStatus = (): 'online' | 'offline' | 'busy' | 'blocked' => {
    if (driver.blocked) return 'blocked';
    if (!driver.enabled) return 'offline';
    if (driver.driverMode === 'ONLINE') return 'online';
    if (driver.driverMode === 'SILENT') return 'busy';
    return 'offline';
  };

  return (
    <DriverBadge
      name={name}
      phone={driver.mobileNumber}
      rating={driver.rating}
      status={getStatus()}
      vehicleNumber={driver.vehicleNumber}
      city={getCityName(driver.merchantOperatingCity || '')}
      onEditCity={onEditCity}
      className={className}
    />
  );
}

