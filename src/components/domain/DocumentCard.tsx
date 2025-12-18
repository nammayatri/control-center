import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileText, Eye, Edit, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DocumentViewModal } from './DocumentViewModal';
import { DocumentUploadModal } from './DocumentUploadModal';
import { useUploadDocument } from '../../hooks/useDrivers';
import type { DriverLicenseDetail, VehicleRegistrationCertificateDetail } from '../../services/drivers';

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

export interface DocumentCardProps {
  readonly driverId: string;
  readonly documentType: string;
  readonly title: string;
  readonly documentIds: string[] | string[][] | null;
  readonly isMandatory: boolean;
  readonly hasData: boolean;
  readonly metadata?: DriverLicenseDetail | VehicleRegistrationCertificateDetail | null;
  readonly className?: string;
}

export function DocumentCard({
  driverId,
  documentType,
  title,
  documentIds,
  isMandatory,
  hasData,
  metadata,
  className,
}: DocumentCardProps) {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { mutateAsync: uploadDocument } = useUploadDocument();

  // Flatten nested arrays
  const flattenedIds: string[] = (() => {
    if (!documentIds) return [];
    
    const ids: string[] = [];
    if (Array.isArray(documentIds)) {
      documentIds.forEach(item => {
        if (Array.isArray(item)) {
          item.forEach(subItem => {
            if (typeof subItem === 'string') ids.push(subItem);
          });
        } else if (typeof item === 'string') {
          ids.push(item);
        }
      });
    }
    return ids;
  })();

  const hasMultipleDocuments = flattenedIds.length > 1;
  const documentCount = flattenedIds.length;

  if (documentCount > 0 && !selectedDocument) {
    setSelectedDocument(flattenedIds[0]);
  }

  const handleViewClick = () => {
    if (selectedDocument) {
      setIsViewModalOpen(true);
    }
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          // Extract base64 part
          const base64Content = base64String.split(',')[1];
          
          await uploadDocument({
            driverId,
            documentType,
            imageBase64: base64Content,
          });
          resolve();
        } catch (error) {
          console.error('Upload failed:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        hasData 
          ? "border-l-4 border-l-green-500/50" 
          : "border-l-4 border-l-muted",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  hasData 
                    ? "bg-green-500/10 text-green-600" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate" title={title}>
                    {title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isMandatory && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Required
                      </Badge>
                    )}
                    {hasData ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {documentCount} file{documentCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        No document
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Display */}
            {hasData && (
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2 rounded-md">
                {documentType === 'DriverLicense' && metadata && 'driverLicenseNumber' in metadata && (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="shrink-0">License No:</span>
                      <span className="font-medium font-mono truncate ml-2" title={metadata.driverLicenseNumber}>
                        {metadata.driverLicenseNumber}
                      </span>
                    </div>
                    {metadata.driverName && (
                      <div className="flex justify-between items-baseline">
                        <span className="shrink-0">Name:</span>
                        <span className="font-medium truncate ml-2" title={metadata.driverName}>
                          {metadata.driverName}
                        </span>
                      </div>
                    )}
                    {metadata.classOfVehicles && (
                      <div className="flex justify-between items-baseline">
                        <span className="shrink-0">Class:</span>
                        <span className="font-medium truncate ml-2">
                          {metadata.classOfVehicles?.join(', ')}
                        </span>
                      </div>
                    )}
                    {metadata.driverDateOfBirth && (
                      <div className="flex justify-between items-baseline">
                        <span className="shrink-0">DOB:</span>
                        <span className="font-medium ml-2">
                          {formatDate(metadata.driverDateOfBirth)}
                        </span>
                      </div>
                    )}
                    {metadata.dateOfIssue && (
                      <div className="flex justify-between items-baseline">
                        <span className="shrink-0">Issued:</span>
                        <span className="font-medium ml-2">
                          {formatDate(metadata.dateOfIssue)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {documentType === 'VehicleRegistrationCertificate' && metadata && 'vehicleRegistrationCertNumber' in metadata && (
                  <>
                    <div className="flex justify-between">
                      <span>Reg No:</span>
                      <span className="font-medium font-mono">{metadata.vehicleRegistrationCertNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-medium truncate max-w-[120px]" title={`${metadata.vehicleManufacturer} ${metadata.vehicleModel}`}>
                        {metadata.vehicleManufacturer} {metadata.vehicleModel}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Document Selection Dropdown */}
            {hasData && (
              <div className="mt-1">
                <Select 
                  value={selectedDocument} 
                  onValueChange={setSelectedDocument}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {flattenedIds.map((id, index) => (
                      <SelectItem key={id} value={id} className="text-xs">
                        {hasMultipleDocuments 
                          ? `Document ${index + 1}` 
                          : 'Document 1'}
                        <span className="ml-2 text-muted-foreground font-mono text-[10px]">
                          ({id.substring(0, 8)}...)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                disabled={!hasData}
                onClick={handleViewClick}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
              {(documentType === 'DriverLicense' || documentType === 'VehicleRegistrationCertificate') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={!hasData}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleUploadClick}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        documentId={selectedDocument || null}
        documentType={documentType}
        title={title}
        metadata={metadata}
      />

      <DocumentUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        title={title}
        onUpload={handleUpload}
      />
    </>
  );
}
