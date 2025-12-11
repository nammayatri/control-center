import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn, getInitials } from '../../lib/utils';
import { Phone, Mail, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface CustomerSummaryProps {
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    mobileNumber: string;
    mobileCountryCode?: string;
    email?: string;
    blocked: boolean;
    enabled: boolean;
    createdAt?: string;
  };
  compact?: boolean;
  className?: string;
}

export function CustomerSummary({ customer, compact = false, className }: CustomerSummaryProps) {
  const name = customer.firstName 
    ? `${customer.firstName} ${customer.lastName || ''}`.trim()
    : 'Customer';
  
  const phone = customer.mobileCountryCode 
    ? `${customer.mobileCountryCode} ${customer.mobileNumber}`
    : customer.mobileNumber;

  const getStatus = () => {
    if (customer.blocked) return 'blocked';
    if (!customer.enabled) return 'disabled';
    return 'active';
  };

  const getStatusBadge = () => {
    const status = getStatus();
    switch (status) {
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge variant="success">Active</Badge>;
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground">{phone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-muted/50", className)}>
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{name}</p>
          {getStatusBadge()}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {phone}
          </span>
          {customer.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {customer.email}
            </span>
          )}
          {customer.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDate(customer.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

