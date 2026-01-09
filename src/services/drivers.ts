import { bppApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { Driver, DriverListFilters, Summary, DriverLicense, VehicleRegistration } from '../types';

// ============================================
// Driver List & Info APIs
// ============================================

export interface DriverListResponse {
  listItem: Driver[];
  summary: Summary;
}

export async function listDrivers(
  merchantId: string,
  cityId?: string,
  filters: DriverListFilters = {}
): Promise<DriverListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/list`
    : `/driver-offer/{merchantId}/driver/list`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({
    searchString: filters.searchString,
    enabled: filters.enabled,
    blocked: filters.blocked,
    verified: filters.verified,
    subscribed: filters.subscribed,
    vehicleVariant: filters.vehicleVariant,
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface DriverInfoResponse {
  driverId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  email?: string;
  rating?: number;
  enabled: boolean;
  blocked: boolean;
  blockedDueToRiderComplains?: boolean;
  blockedReason?: string;
  verified: boolean;
  subscribed: boolean;
  vehicleNumber?: string;
  numberOfRides: number;
  merchantOperatingCity?: string;
  driverMode?: string;
  createdAt?: string;
  lastActivityDate?: string;
  onboardingDate?: string;
  driverLicenseDetails?: DriverLicense;
  vehicleRegistrationDetails?: VehicleRegistration[];
  cancellationRate?: number;
  assignedCount?: number;
  cancelledCount?: number;
  driverTag?: string[];
  driverTagObject?: Array<{
    tagName: string;
    tagValue: { contents: string | number; tag: string };
    tagExpiry: string | null;
  }>;
  // AC Quality Stats
  totalAcRestrictionUnblockCount?: number;
  lastACStatusCheckedAt?: string;
  currentAcOffReportCount?: number;
  currentACStatus?: boolean;

  // Service Tiers & Switching
  selectedServiceTiers?: string[];
  canSwitchToInterCity?: boolean;
  canSwitchToIntraCity?: boolean;
  canSwitchToRental?: boolean;
  canDowngradeToHatchback?: boolean;
  canDowngradeToSedan?: boolean;
  canDowngradeToTaxi?: boolean;
  downgradeReason?: string | null;

  // Violations & Blocks
  blockCount?: number;
  drunkAndDriveViolationCount?: number;
  blockStateModifier?: string | null;
  softBlockExpiryTime?: string | null;
  softBlockReasonFlag?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  softBlockStiers?: any; // or string[] if known

  // Other Info
  alternateNumber?: string | null;
  lastOfflineTime?: string | null;
  reactVersion?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  windowSize?: any;

  blockedInfo?: Array<{
    reportedAt: string;
    reason: string;
    blockedBy?: string;
    blockTimeInHours?: number;
  }>;
  availableMerchants?: string[];
  clientVersion?: {
    major: number;
    minor: number;
    maintenance: number;
    build: number | null;
    preRelease: number | null;
  };
  bundleVersion?: {
    major: number;
    minor: number;
    maintenance: number;
    build: number | null;
    preRelease: number | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aadharAssociationDetails?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panCardDetails?: any;
}

export interface DriverInfoSearchParams {
  [key: string]: string | number | boolean | null | undefined;
  driverId?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  vehicleNumber?: string;
  dlNumber?: string;
  rcNumber?: string;
  email?: string;
  personId?: string;
}

export async function getDriverInfo(
  merchantId: string,
  cityId?: string,
  params: DriverInfoSearchParams = {}
): Promise<DriverInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/info`
    : `/driver-offer/{merchantId}/driver/info`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams(params);

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Driver Actions
// ============================================

export async function blockDriver(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/block`
    : `/driver-offer/{merchantId}/driver/{driverId}/block`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

export interface BlockWithReasonRequest {
  reasonCode: string;
  blockReason?: string;
  blockTimeInHours?: number;
}

export async function blockDriverWithReason(
  merchantId: string,
  driverId: string,
  data: BlockWithReasonRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/blockWithReason`
    : `/driver-offer/{merchantId}/driver/{driverId}/blockWithReason`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

export async function unblockDriver(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/unblock`
    : `/driver-offer/{merchantId}/driver/{driverId}/unblock`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

export async function enableDriver(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/enable`
    : `/driver-offer/{merchantId}/driver/{driverId}/enable`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

export async function disableDriver(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/disable`
    : `/driver-offer/{merchantId}/driver/{driverId}/disable`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

// ============================================
// Driver Documents
// ============================================

export interface DocumentsInfoResponse {
  driverLicense?: DriverLicense;
  vehicleRegistrationDetails?: VehicleRegistration[];
}

export async function getDriverDocuments(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<DocumentsInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/documents/info`
    : `/driver-offer/{merchantId}/driver/{driverId}/documents/info`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Driver Documents List API (for Documents Tab)
// ============================================

export interface DriverLicenseDetail {
  classOfVehicles: string[];
  createdAt: string;
  dateOfIssue: string | null;
  driverDateOfBirth: string;
  driverLicenseNumber: string;
  driverName: string;
  imageId1: string;
  imageId2: string | null;
  operatingCity: string;
}

export interface VehicleRegistrationCertificateDetail {
  airConditioned: boolean | null;
  createdAt: string;
  dateOfRegistration: string | null;
  failedRules: string[];
  imageId: string;
  operatingCity: string;
  oxygen: boolean | null;
  vehicleCategory: string | null;
  vehicleColor: string;
  vehicleDoors: number | null;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleModelYear: number | null;
  vehicleRegistrationCertNumber: string;
  vehicleSeatBelts: number | null;
  ventilator: boolean | null;
}

export interface DriverDocumentsListResponse {
  aadhaar: string[];
  businessLicense: string[];
  commonDocuments: string[];
  driverLicense: string[][];
  driverLicenseDetails: DriverLicenseDetail[];
  gstCertificate: string[];
  odometer: string[];
  pan: string[];
  profilePhoto: string[];
  ssn: string[] | null;
  uploadProfile: string[];
  vehicleBack: string[];
  vehicleBackInterior: string[];
  vehicleFitnessCertificate: string[];
  vehicleFront: string[];
  vehicleFrontInterior: string[];
  vehicleInspectionForm: string[];
  vehicleInsurance: string[];
  vehicleLeft: string[];
  vehicleNOC: string[];
  vehiclePUC: string[];
  vehiclePermit: string[];
  vehicleRegistrationCertificate: string[];
  vehicleRegistrationCertificateDetails: VehicleRegistrationCertificateDetail[];
  vehicleRight: string[];
  [key: string]: string[] | string[][] | DriverLicenseDetail[] | VehicleRegistrationCertificateDetail[] | null;
}

export async function getDriverDocumentsList(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<DriverDocumentsListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/documents/list`
    : `/driver-offer/{merchantId}/driver/{driverId}/documents/list`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Document Configs API (for Documents Tab)
// ============================================

export interface DocumentConfigItem {
  applicableTo: string;
  checkExpiry: boolean;
  checkExtraction: boolean;
  dependencyDocumentType: string[];
  description: string | null;
  disableWarning: string;
  documentCategory: string | null;
  documentFields: string | null;
  documentType: string;
  filterForOldApks: boolean;
  isDisabled: boolean;
  isHidden: boolean;
  isMandatory: boolean;
  isMandatoryForEnabling: boolean;
  rcNumberPrefixList: string[];
  title: string;
}

export interface DocumentConfigsResponse {
  ambulances: DocumentConfigItem[] | null;
  autos: DocumentConfigItem[] | null;
  bikes: DocumentConfigItem[] | null;
  boat: DocumentConfigItem[] | null;
  bus: DocumentConfigItem[] | null;
  cabs: DocumentConfigItem[] | null;
  fleet: DocumentConfigItem[] | null;
  trucks: DocumentConfigItem[] | null;
}

export async function getDocumentConfigs(
  merchantId: string,
  cityId?: string
): Promise<DocumentConfigsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/onboarding/document/configs`
    : `/driver-offer/{merchantId}/onboarding/document/configs`;

  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Driver Activity & Stats
// ============================================

export interface DriverActivityResponse {
  activeDrivers: number;
  inactiveDrivers: number;
  busyDrivers: number;
}

export async function getDriverActivity(
  merchantId: string,
  cityId?: string
): Promise<DriverActivityResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/activity`
    : `/driver-offer/{merchantId}/driver/activity`;

  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export interface DriverStatsResponse {
  totalRides: number;
  totalEarnings: number;
  averageRating: number;
  totalDistance: number;
}

export async function getDriverStats(
  merchantId: string,
  driverId?: string,
  cityId?: string
): Promise<DriverStatsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/stats`
    : `/driver-offer/{merchantId}/driver/stats`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = driverId ? buildQueryParams({ driverId }) : '';

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Driver Earnings & Payments
// ============================================

export interface DriverEarningsResponse {
  totalEarnings: number;
  totalRides: number;
  earnings: Array<{
    date: string;
    amount: number;
    rides: number;
  }>;
}

export async function getDriverEarnings(
  merchantId: string,
  driverId: string,
  cityId?: string,
  from?: string,
  to?: string
): Promise<DriverEarningsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/earnings`
    : `/driver-offer/{merchantId}/driver/earnings`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ driverId, from, to });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Driver Location
// ============================================

export interface DriverLocationResponse {
  lat: number;
  lon: number;
  lastUpdated: string;
}

export async function getDriverLocation(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<DriverLocationResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/location`
    : `/driver-offer/{merchantId}/driver/location`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ driverId });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Driver Feedback
// ============================================

export interface DriverFeedbackItem {
  rideId: string;
  feedbackText?: string;
  feedbackDetails?: string;
  createdAt: string;
}

export interface DriverFeedbackResponse {
  feedbacks: DriverFeedbackItem[];
}

export async function getDriverFeedback(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<DriverFeedbackResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/feedback/list`
    : `/driver-offer/{merchantId}/driver/feedback/list`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ driverId });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Block Reason List
// ============================================

export interface BlockReason {
  reasonCode: string;
  reasonMessage: string;
}

export async function getBlockReasonList(
  merchantId: string,
  cityId?: string
): Promise<BlockReason[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/blockReasonList`
    : `/driver-offer/{merchantId}/driver/blockReasonList`;

  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Pan/Aadhar/Selfie Details
// ============================================

export interface PanAadharSelfieDetail {
  createdAt: string;
  failureReason: string | null;
  imageId1: string | null;
  imageId2: string | null;
  transactionId: string;
  updatedAt: string;
  verificationStatus: string;
}

export type PanAadharSelfieDetailsResponse = PanAadharSelfieDetail[];

export async function getPanAadharSelfieDetails(
  merchantId: string,
  driverId: string,
  docType: string,
  cityId?: string
): Promise<PanAadharSelfieDetailsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/panAadharSelfieDetailsList`
    : `/driver-offer/{merchantId}/driver/panAadharSelfieDetailsList`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = `?docType=${docType}&driverId=${driverId}`;

  return apiRequest(bppApi, {
    method: 'GET',
    url: path + query,
  });
}

// ============================================
// Document Image API
// ============================================

export interface GetDocumentResponse {
  imageBase64: string;
  status: string;
}

export async function getDocument(
  merchantId: string,
  documentId: string,
  cityId?: string
): Promise<GetDocumentResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/getDocument/${documentId}`
    : `/driver-offer/{merchantId}/driver/getDocument/${documentId}`;

  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// Helper to map UI/Config document document types to the specific ImageType enum expected by the backend
function mapToImageType(documentType: string): string {
  const mapping: Record<string, string> = {
    'ProfilePhoto': 'ProfilePhotoImage',
    'VehicleInsurance': 'VehicleInsuranceImage', 
    'VehiclePermit': 'VehiclePermitImage', 
    'VehiclePUC': 'VehiclePUCImage',
    'VehicleFitness': 'VehicleFitnessCertificateImage',
    'VehicleInspection': 'VehicleInspectionImage',
  };

  return mapping[documentType] || documentType;
}

export async function uploadDocument(
  merchantId: string,
  driverId: string,
  documentType: string,
  imageBase64: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/document/upload`
    : `/driver-offer/{merchantId}/driver/{driverId}/document/upload`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  // Appending documentType to query to differentiate
  const query = `?documentType=${documentType}`;
  
  const imageType = mapToImageType(documentType);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path + query,
    data: {
      imageBase64,
      imageType,
      documentType, 
    },
  });
}

// ============================================
// Driver Name Update
// ============================================

export interface UpdateDriverNameRequest {
  firstName: string;
  lastName: string;
  middleName: string;
}

export async function updateDriverName(
  merchantId: string,
  driverId: string,
  data: UpdateDriverNameRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/updateName`
    : `/driver-offer/{merchantId}/driver/{driverId}/updateName`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Driver Coin History
// ============================================

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface CoinBurnHistoryItem {
  cash: number;
  cashWithCurrency: CurrencyAmount;
  createdAt: string;
  numCoins: number;
  title: string;
  updatedAt: string;
}

export interface CoinEarnHistoryItem {
  bulkUploadTitle: string | null;
  coins: number;
  coinsUsed: number;
  createdAt: string;
  eventFunction: {
    contents?: number;
    tag: string;
  };
  expirationAt: string | null;
  rideId: string | null;
  rideShortId: string | null;
  status: string;
}

export interface CoinHistoryResponse {
  coinBalance: number;
  coinEarned: number;
  coinExpired: number;
  coinUsed: number;
  coinBurnHistory: CoinBurnHistoryItem[];
  coinEarnHistory: CoinEarnHistoryItem[];
}

export async function getDriverCoinHistory(
  merchantId: string,
  driverId: string,
  limit: number = 5,
  offset: number = 0,
  cityId?: string
): Promise<CoinHistoryResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/coins/coinHistory/{driverId}`
    : `/driver-offer/{merchantId}/coins/coinHistory/{driverId}`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);
  const query = buildQueryParams({ limit, offset });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Bulk Upload Coins (Refund Coins)
// ============================================

export interface BulkUploadTitle {
  bn: string;
  en: string;
  fr: string;
  hi: string;
  kn: string;
  ml: string;
  ta: string;
  te: string;
}

export interface DriverIdWithCoins {
  amount: number;
  amountWithCurrency: CurrencyAmount;
  driverId: string;
}

export interface BulkUploadCoinsRequest {
  bulkUploadTitle: BulkUploadTitle;
  driverIdListWithCoins: DriverIdWithCoins[];
  eventFunction: {
    tag: string;
    contents: string;
  };
  expirationTime: number;
}

export interface FailedItem {
  driverId: string;
  errorMessage: string;
}

export interface BulkUploadCoinsResponse {
  failed: number;
  failedItems: FailedItem[];
  success: number;
}

export async function bulkUploadCoinsV2(
  merchantId: string,
  data: BulkUploadCoinsRequest
): Promise<BulkUploadCoinsResponse> {
  const path = buildPath('/driver-offer/{merchantId}/coins/bulkUploadCoinsV2', merchantId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Change Operating City
// ============================================

export interface ChangeOperatingCityRequest {
  operatingCity: string;
}

export interface ChangeOperatingCityResponse {
  result: string;
}

export async function changeOperatingCity(
  merchantId: string,
  driverId: string,
  operatingCity: string,
  cityId?: string
): Promise<ChangeOperatingCityResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/changeOperatingCity`
    : `/driver-offer/{merchantId}/driver/{driverId}/changeOperatingCity`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { operatingCity },
  });
}

// ============================================
// Send Dummy Notification
// ============================================

export interface SendDummyNotificationResponse {
  result: string;
}

export async function sendDummyNotification(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<SendDummyNotificationResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/{driverId}/sendDummyNotification`
    : `/driver-offer/{merchantId}/driver/{driverId}/sendDummyNotification`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

// ============================================
// Driver Subscription/Plan Details
// ============================================

export interface AmountWithCurrency {
  amount: number;
  currency: string;
}

export interface PlanFareBreakupItem {
  amount: number;
  amountWithCurrency: AmountWithCurrency;
  component: string;
}

export interface CoinEntity {
  coinDiscountUpto: number;
  coinDiscountUptoWithCurrency: AmountWithCurrency;
}

export interface CurrentPlanDetails {
  autopayDues: number;
  autopayDuesWithCurrency: AmountWithCurrency;
  bankErrors: unknown[];
  cancellationPenalties: unknown[];
  coinEntity: CoinEntity;
  currentDues: number;
  currentDuesWithCurrency: AmountWithCurrency;
  description: string;
  dueBoothCharges: number;
  dueBoothChargesWithCurrency: AmountWithCurrency;
  dues: unknown[];
  freeRideCount: number;
  frequency: string;
  id: string;
  name: string;
  offers: unknown[];
  paymentMode: string;
  planFareBreakup: PlanFareBreakupItem[];
  totalPlanCreditLimit: number;
  totalPlanCreditLimitWithCurrency: AmountWithCurrency;
}

export interface MandateDetails {
  autopaySetupDate: string;
  endDate: string;
  frequency: string;
  mandateId: string;
  maxAmount: number;
  maxAmountWithCurrency: AmountWithCurrency;
  payerApp: string;
  payerVpa: string;
  startDate: string;
  status: string;
}

export interface DriverPlanResponse {
  askForPlanSwitchByCity: boolean;
  askForPlanSwitchByVehicle: boolean;
  autoPayStatus: string | null;
  currentPlanDetails: CurrentPlanDetails | null;
  isEligibleForCharge: boolean;
  isLocalized: boolean;
  lastPaymentType: string | null;
  latestAutopayPaymentDate: string | null;
  latestManualPaymentDate: string | null;
  mandateDetails: MandateDetails | null;
  orderId: string | null;
  payoutVpa: string | null;
  planRegistrationDate: string | null;
  safetyPlusData: unknown | null;
  subscribed: boolean;
}

export async function getDriverPlanDetails(
  merchantId: string,
  driverId: string,
  serviceName: string = 'YATRI_SUBSCRIPTION',
  cityId?: string
): Promise<DriverPlanResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/plan/{driverId}/"${serviceName}"`
    : `/driver-offer/{merchantId}/plan/{driverId}/"${serviceName}"`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Available Plans List (for plan comparison)
// ============================================

export interface AvailablePlansResponse {
  isLocalized: boolean;
  list: CurrentPlanDetails[];
  subscriptionStartTime: string;
}

export async function getAvailablePlans(
  merchantId: string,
  driverId: string,
  serviceName: string = 'YATRI_SUBSCRIPTION',
  cityId?: string
): Promise<AvailablePlansResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/plan/{driverId}/"${serviceName}"/v2/list`
    : `/driver-offer/{merchantId}/plan/{driverId}/"${serviceName}"/v2/list`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Payment History
// ============================================

export interface AutoPayInvoice {
  amount: number;
  amountWithCurrency: AmountWithCurrency;
  autoPayStage: string;
  coinDiscountAmount: number;
  coinDiscountAmountWithCurrency: AmountWithCurrency;
  executionAt: string;
  invoiceId: string;
  isCoinCleared: boolean;
  rideTakenOn: string;
}

export interface ManualPayInvoice {
  amount: number;
  amountWithCurrency: AmountWithCurrency;
  invoiceId: string;
  paymentDate: string;
  rideTakenOn: string;
}

export interface PaymentHistoryResponse {
  autoPayInvoices: AutoPayInvoice[];
  manualPayInvoices: ManualPayInvoice[];
}

export type PaymentMode = 'AUTOPAY_INVOICE' | 'MANUAL_INVOICE';

export async function getPaymentHistory(
  merchantId: string,
  driverId: string,
  paymentMode: PaymentMode,
  serviceName: string = 'YATRI_SUBSCRIPTION',
  limit: number = 5,
  offset: number = 0,
  cityId?: string
): Promise<PaymentHistoryResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/plan/{driverId}/payments/history/v2/"${serviceName}"`
    : `/driver-offer/{merchantId}/plan/{driverId}/payments/history/v2/"${serviceName}"`;

  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);
  const query = buildQueryParams({ 
    paymentMode: `"${paymentMode}"`,
    limit,
    offset,
  });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export async function switchDriverPlan(
  merchantId: string,
  driverId: string,
  planId: string,
  serviceName: string = 'YATRI_SUBSCRIPTION',
  cityId?: string
): Promise<{ result: string }> {
  /*
  Path pattern:
  Localized: /driver-offer/{merchantId}/{city}/plan/{planId}/{driverId}/"{serviceName}"/v2/select
  Global:    /driver-offer/{merchantId}/plan/{planId}/{driverId}/"{serviceName}"/v2/select
  */
  
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/plan/{driverId}/{planId}/"${serviceName}"/v2/select`
    : `/driver-offer/{merchantId}/plan/{driverId}/{planId}/"${serviceName}"/v2/select`;

  const path = buildPath(basePath, merchantId, cityId)
    .replace('{driverId}', driverId)
    .replace('{planId}', planId);

  return apiRequest(bppApi, {
    method: 'PUT',
    url: path,
  });
}

// ============================================
// Send Subscription Communication
// ============================================

export type MediaChannel = 'SMS' | 'WHATSAPP' | 'OVERLAY' | 'ALERT';

export type SubscriptionMessageKey =
  | 'WHATSAPP_CLEAR_DUES_CALL_MISSED_MESSAGE'
  | 'WHATSAPP_CLEAR_DUES_MESSAGE'
  | 'WHATSAPP_CLEAR_DUES_MESSAGE_TO_BLOCKED_DRIVERS'
  | 'WHATSAPP_SETUP_AUTOPAY_MESSAGE'
  | 'WHATSAPP_SWITCH_PLAN_MESSAGE'
  | 'WHATSAPP_HOW_IT_WORKS_MESSAGE'
  | 'SMS_CLEAR_DUES_CALL_MISSED_MESSAGE'
  | 'SMS_CLEAR_DUES_MESSAGE'
  | 'SMS_CLEAR_DUES_MESSAGE_TO_BLOCKED_DRIVERS'
  | 'SMS_SETUP_AUTOPAY_MESSAGE'
  | 'SMS_SWITCH_PLAN_MESSAGE'
  | 'SMS_HOW_IT_WORKS_MESSAGE';

export interface SendSubscriptionSmsRequest {
  channel: MediaChannel;
  messageId?: string;
  messageKey: SubscriptionMessageKey;
  overlayKey?: string;
}

export interface SendSubscriptionSmsResponse {
  result: string;
}

export async function sendSubscriptionCommunication(
  merchantId: string,
  driverId: string,
  data: SendSubscriptionSmsRequest
): Promise<SendSubscriptionSmsResponse> {
  const path = `/driver-offer/${merchantId}/driver/${driverId}/sendSms`;

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}
