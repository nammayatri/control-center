import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Calendar, MapPin, FileText, Car } from 'lucide-react';
import { useGetDocument } from '../../hooks/useDrivers';
import type { DriverLicenseDetail, VehicleRegistrationCertificateDetail } from '../../services/drivers';

interface DocumentViewModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly documentId: string | null;
  readonly documentType: string;
  readonly title: string;
  readonly metadata?: DriverLicenseDetail | VehicleRegistrationCertificateDetail | null;
}

function getStatusBadge(status: string) {
  const statusLower = status.toLowerCase();
  if (statusLower === 'valid' || statusLower === 'approved') {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
  if (statusLower === 'invalid' || statusLower === 'rejected') {
    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
      <AlertCircle className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function DriverLicenseMetadata({ data }: { readonly data: DriverLicenseDetail }) {
  return (
    <div className="space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4" />
        License Details
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">License Number</p>
          <p className="font-mono">{data.driverLicenseNumber || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Driver Name</p>
          <p>{data.driverName || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Date of Birth
          </p>
          <p>{formatDate(data.driverDateOfBirth)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Date of Issue
          </p>
          <p>{formatDate(data.dateOfIssue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Operating City
          </p>
          <p>{data.operatingCity || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Car className="h-3 w-3" />
            Vehicle Classes
          </p>
          <p>{data.classOfVehicles?.join(', ') || '-'}</p>
        </div>
      </div>
    </div>
  );
}

function VehicleRCMetadata({ data }: { readonly data: VehicleRegistrationCertificateDetail }) {
  return (
    <div className="space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Car className="h-4 w-4" />
        RC Details
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Registration Number</p>
          <p className="font-mono">{data.vehicleRegistrationCertNumber || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Manufacturer</p>
          <p>{data.vehicleManufacturer || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Model</p>
          <p>{data.vehicleModel || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Color</p>
          <p>{data.vehicleColor || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Operating City
          </p>
          <p>{data.operatingCity || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Registration Date
          </p>
          <p>{formatDate(data.dateOfRegistration)}</p>
        </div>
        {data.vehicleCategory && (
          <div>
            <p className="text-muted-foreground text-xs">Category</p>
            <p>{data.vehicleCategory}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentViewModal({
  open,
  onOpenChange,
  documentId,
  documentType,
  title,
  metadata,
}: DocumentViewModalProps) {
  const { data, isLoading, error } = useGetDocument(open ? documentId : null);
  const [imageError, setImageError] = useState(false);

  // Reset image error when dialog opens with new document
  useEffect(() => {
    if (open) {
      setImageError(false);
    }
  }, [open, documentId]);

  const isDriverLicense = documentType.toLowerCase().includes('driverlicense');
  const isVehicleRC = documentType.toLowerCase().includes('vehicleregistrationcertificate');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </span>
            {data?.status && getStatusBadge(data.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Image */}
          <div className="relative rounded-lg border overflow-hidden bg-muted/30 min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-destructive">
                <XCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Failed to load document</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </p>
              </div>
            ) : data?.imageBase64 && !imageError ? (
              <img
                src={`data:image/jpeg;base64,${data.imageBase64}`}
                alt={title}
                className="w-full h-auto object-contain max-h-[400px]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-2" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>

          {/* Status Badge (when not shown in header) */}
          {data?.status && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Document Status:</span>
              {getStatusBadge(data.status)}
            </div>
          )}

          {/* Metadata for Driver License */}
          {isDriverLicense && metadata && 'driverLicenseNumber' in metadata && (
            <DriverLicenseMetadata data={metadata as DriverLicenseDetail} />
          )}

          {/* Metadata for Vehicle RC */}
          {isVehicleRC && metadata && 'vehicleRegistrationCertNumber' in metadata && (
            <VehicleRCMetadata data={metadata as VehicleRegistrationCertificateDetail} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
