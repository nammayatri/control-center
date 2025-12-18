import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DocumentCard } from './DocumentCard';
import { useDriverDocumentsList, useDocumentConfigs, usePanAadharSelfieDetails } from '../../hooks/useDrivers';
import { Loader2, FileStack, AlertTriangle } from 'lucide-react';
import type { 
  DocumentConfigItem, 
  DriverDocumentsListResponse,
  DriverLicenseDetail,
  VehicleRegistrationCertificateDetail,
  PanAadharSelfieDetail
} from '../../services/drivers';

interface DriverDocumentsTabProps {
  readonly driverId: string;
  readonly selectedServiceTiers?: string[];
}

// Map document type from config to the corresponding key in the list response
// Config uses PascalCase (e.g., "VehicleRegistrationCertificate")
// List response uses camelCase (e.g., "vehicleRegistrationCertificate")
function getDocumentListKey(configDocumentType: string): string {
  // Convert PascalCase to camelCase
  return configDocumentType.charAt(0).toLowerCase() + configDocumentType.slice(1);
}

// Check if a document type has data in the list response
function getDocumentData(
  documentType: string,
  documentsData: DriverDocumentsListResponse | undefined
): string[] | string[][] | null {
  if (!documentsData) return null;
  
  const key = getDocumentListKey(documentType);
  const data = documentsData[key];
  
  if (!data) return null;
  if (Array.isArray(data) && data.length === 0) return null;
  
  return data as string[] | string[][];
}

// Determine which vehicle category to use based on selectedServiceTiers
function getVehicleCategory(selectedServiceTiers?: string[]): 'autos' | 'cabs' {
  if (!selectedServiceTiers || selectedServiceTiers.length === 0) {
    return 'cabs'; // Default to cabs
  }
  
  // Check if any tier contains "auto" (case-insensitive)
  const hasAuto = selectedServiceTiers.some(tier => 
    tier.toLowerCase().includes('auto')
  );
  
  return hasAuto ? 'autos' : 'cabs';
}

// Extract metadata for specific document types
function getDocumentMetadata(
  documentType: string,
  documentsData: DriverDocumentsListResponse | undefined
): DriverLicenseDetail | VehicleRegistrationCertificateDetail | null {
  if (!documentsData) return null;
  
  if (documentType === 'DriverLicense') {
    return documentsData.driverLicenseDetails?.[0] || null;
  }
  
  if (documentType === 'VehicleRegistrationCertificate') {
    return documentsData.vehicleRegistrationCertificateDetails?.[0] || null;
  }
  
  return null;
}

export function DriverDocumentsTab({ driverId, selectedServiceTiers }: DriverDocumentsTabProps) {
  const { 
    data: documentsData, 
    isLoading: isLoadingDocuments,
    error: documentsError 
  } = useDriverDocumentsList(driverId);
  
  const { 
    data: configsData, 
    isLoading: isLoadingConfigs,
    error: configsError 
  } = useDocumentConfigs();

  // New hooks for additional documents
  const { data: profilePhotoData } = usePanAadharSelfieDetails(driverId, 'ProfilePhoto');
  const { data: aadhaarCardData } = usePanAadharSelfieDetails(driverId, 'AadhaarCard');
  const { data: panCardData } = usePanAadharSelfieDetails(driverId, 'PanCard');

  const isLoading = isLoadingDocuments || isLoadingConfigs;
  const error = documentsError || configsError;
  const vehicleCategory = getVehicleCategory(selectedServiceTiers);

  // Helper to process new API data format to DocumentCard props
  const processAdditionalDoc = (data: PanAadharSelfieDetail[] | undefined): string[] | null => {
    if (!data || data.length === 0) return null;
    const latest = data[0]; // Assuming we show the latest one
    const ids: string[] = [];
    if (latest.imageId1) ids.push(latest.imageId1);
    if (latest.imageId2) ids.push(latest.imageId2);
    return ids.length > 0 ? ids : null;
  };

  const applicableConfigs = useMemo(() => {
    if (!configsData) return [];
    
    // Get base configs
    const baseConfigs = configsData[vehicleCategory] || [];
    
    // Create configs for new types if they don't exist in base configs
    const additionalConfigs: DocumentConfigItem[] = [
      {
        documentType: 'ProfilePhoto',
        title: 'Profile Photo',
        isMandatory: true,
        // ... default values for other required fields ...
        applicableTo: vehicleCategory,
        checkExpiry: false,
        checkExtraction: false,
        dependencyDocumentType: [],
        description: null,
        disableWarning: '',
        documentCategory: null,
        documentFields: null,
        filterForOldApks: false,
        isDisabled: false,
        isHidden: false,
        isMandatoryForEnabling: true,
        rcNumberPrefixList: [],
      },
      {
        documentType: 'AadhaarCard',
        title: 'Aadhaar Card',
        isMandatory: true,
        applicableTo: vehicleCategory,
        checkExpiry: false,
        checkExtraction: false,
        dependencyDocumentType: [],
        description: null,
        disableWarning: '',
        documentCategory: null,
        documentFields: null,
        filterForOldApks: false,
        isDisabled: false,
        isHidden: false,
        isMandatoryForEnabling: true,
        rcNumberPrefixList: [],
      },
      {
        documentType: 'PanCard',
        title: 'PAN Card',
        isMandatory: true,
        applicableTo: vehicleCategory, 
        checkExpiry: false,
        checkExtraction: false,
        dependencyDocumentType: [],
        description: null,
        disableWarning: '',
        documentCategory: null,
        documentFields: null,
        filterForOldApks: false,
        isDisabled: false,
        isHidden: false,
        isMandatoryForEnabling: true,
        rcNumberPrefixList: [],
      }
    ];

    // Filter out duplicates if backend already sends them, otherwise append
    const existingTypes = new Set(baseConfigs.map(c => c.documentType));
    const newConfigs = additionalConfigs.filter(c => !existingTypes.has(c.documentType));
    
    return [...baseConfigs, ...newConfigs].filter(c => !c.isHidden && !c.isDisabled);
  }, [configsData, vehicleCategory]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-destructive">Failed to load documents</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applicableConfigs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <FileStack className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No document configurations found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count documents with data
  const documentsWithData = applicableConfigs.filter(config => {
      let data = null;
      if (config.documentType === 'ProfilePhoto') data = processAdditionalDoc(profilePhotoData);
      else if (config.documentType === 'AadhaarCard') data = processAdditionalDoc(aadhaarCardData);
      else if (config.documentType === 'PanCard') data = processAdditionalDoc(panCardData);
      else data = getDocumentData(config.documentType, documentsData);
      return data !== null;
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileStack className="h-5 w-5" />
              Driver Documents
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {vehicleCategory === 'autos' ? 'Auto' : 'Cab'} Documents
              </Badge>
              <Badge 
                variant={documentsWithData === applicableConfigs.length ? 'default' : 'secondary'}
                className="text-xs"
              >
                {documentsWithData} / {applicableConfigs.length} uploaded
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applicableConfigs.map((config) => {
          let documentData: string[] | string[][] | null = null;
          let metadata = null;
          
          if (config.documentType === 'ProfilePhoto') {
             const panAadharData = processAdditionalDoc(profilePhotoData) || [];
             const listData = getDocumentData(config.documentType, documentsData);
             
             // Check if listData matches what processAdditionalDoc returns logic or if it needs flattening
             // getDocumentData returns string[] | string[][], but for ProfilePhoto it's usually string[]
             const flatListData: string[] = [];
             if (listData) {
               if (Array.isArray(listData[0])) {
                  // Handle possibly nested array
                  (listData as string[][]).forEach(group => flatListData.push(...group));
               } else {
                  flatListData.push(...(listData as string[]));
               }
             }
 
             const combined = [...panAadharData, ...flatListData];
             // Deduplicate
             const uniqueIds = Array.from(new Set(combined));
             documentData = uniqueIds.length > 0 ? uniqueIds : null;
          } else if (config.documentType === 'AadhaarCard') {
            documentData = processAdditionalDoc(aadhaarCardData);
          } else if (config.documentType === 'PanCard') {
            documentData = processAdditionalDoc(panCardData);
          } else {
            documentData = getDocumentData(config.documentType, documentsData);
            metadata = getDocumentMetadata(config.documentType, documentsData);
          }
          
          const hasData = documentData !== null;
          
          return (
            <DocumentCard
              key={config.documentType}
              driverId={driverId}
              documentType={config.documentType}
              title={config.title}
              documentIds={documentData}
              isMandatory={config.isMandatory}
              hasData={hasData}
              metadata={metadata}
            />
          );
        })}
      </div>
    </div>
  );
}
