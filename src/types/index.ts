// ============================================
// Common Types
// ============================================

export type LoginModule = 'BAP' | 'BPP' | 'FLEET';

export interface FleetConfig {
  merchantId: string;
  city: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Summary {
  totalCount: number;
  count: number;
}

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  mobileNumber: string;
  mobileCountryCode: string;
  roles?: Role[];
  role?: Role; // Single role from list API
  enabled?: boolean;
  verified?: boolean;
  createdAt?: string;
  registeredAt?: string;
  updatedAt?: string;
  receiveNotification?: boolean | null;
  availableMerchants?: string[];
  availableCitiesForMerchant?: {
    merchantShortId: string;
    operatingCity: string[];
  }[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  dashboardAccessType?: string;
}

export interface Permission {
  resource: string;
  action: string;
  merchantIds?: string[];
  cityIds?: string[];
}

export interface AccessMatrix {
  apiEntity: string;
  userActionType: string;
  userAccessType: string;
}

export interface RoleAccessMatrixResponse {
  role: Role;
  accessMatrixRow: AccessMatrix[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Merchant {
  id: string;
  shortId: string;
  name: string;
  enabled?: boolean;
  city?: string;
}

export interface City {
  id: string;
  name: string;
  merchantId?: string;
}

export interface UserAccessMatrix {
  userActionType: string;
  userAccessType: string;
  apiEntity: string;
}

// ============================================
// Driver Types (BPP)
// ============================================

export type DriverMode = 'ONLINE' | 'OFFLINE' | 'SILENT';
export type VerificationStatus = 'PENDING' | 'VALID' | 'INVALID' | 'MANUAL_VERIFICATION_REQUIRED';

export interface Driver {
  driverId: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  mobileNumber: string;
  mobileCountryCode?: string;
  email?: string;
  rating?: number;
  enabled: boolean;
  blocked: boolean;
  verified: boolean;
  subscribed: boolean;
  vehicleNumber?: string;
  numberOfRides: number;
  merchantOperatingCity?: string;
  driverMode?: DriverMode;
  createdAt?: string;
  lastActivityDate?: string;
  onboardingDate?: string;
  driverLicenseDetails?: DriverLicense;
  vehicleRegistrationDetails?: VehicleRegistration[];
}

export interface DriverLicense {
  driverLicenseId: string;
  licenseNumber: string;
  licenseExpiry: string;
  classOfVehicles: string[];
  verificationStatus: VerificationStatus;
  driverName?: string;
  driverDob?: string;
}

export interface VehicleRegistration {
  associatedOn: string;
  associatedTill: string;
  details: {
    certificateNumber: string;
    registrationCertificateId: string;
    vehicleModel?: string;
    manufacturerModel?: string;
    vehicleManufacturer?: string;
    vehicleColor?: string;
    vehicleEnergyType?: string;
    vehicleCapacity?: number;
    vehicleClass?: string;
    vehicleVariant?: string;
    insuranceValidity?: string;
    fitnessExpiry?: string;
    permitExpiry?: string;
    pucExpiry?: string;
    verificationStatus: VerificationStatus;
    failedRules?: string[];
    documentImageId?: string;
    reviewRequired?: boolean;
    reviewedAt?: string;
  };
  isRcActive: boolean;
}

export interface DriverListFilters {
  searchString?: string;
  enabled?: boolean;
  blocked?: boolean;
  verified?: boolean;
  subscribed?: boolean;
  vehicleVariant?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Customer Types (BAP)
// ============================================

export interface Customer {
  customerId: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNo?: string;
  mobileNumber: string;
  mobileCountryCode: string;
  email?: string;
  blocked: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerListFilters {
  searchString?: string;
  blocked?: boolean;
  enabled?: boolean;
  phone?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Ride & Booking Types
// ============================================

export type RideStatus =
  | 'NEW'
  | 'INPROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type BookingStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'AWAITING_REASSIGNMENT'
  | 'REALLOCATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'TRIP_ASSIGNED';

export interface Ride {
  id: string;
  bppRideId?: string;
  status: RideStatus;
  driverName?: string;
  driverNumber?: string;
  driverRating?: number;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleVariant?: string;
  computedPrice?: number;
  chargeableRideDistance?: number;
  rideStartTime?: string;
  rideEndTime?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  estimatedFare: number;
  estimatedDistance?: number;
  estimatedDuration?: number;
  fromLocation: Location;
  toLocation?: Location;
  rideList: Ride[];
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  lat: number;
  lon: number;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  building?: string;
}

export interface RideListFilters {
  status?: RideStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Fleet Types
// ============================================

export type FleetType = 'NORMAL' | 'RENTAL' | 'BUSINESS';

export interface FleetOwner {
  id: string;
  name: string;
  mobileNumber: string;
  mobileCountryCode: string;
  enabled: boolean;
  verified: boolean;
  fleetType?: FleetType;
  vehicleCount: number;
  registeredAt?: string;
}

export interface Vehicle {
  vehicleNo: string;
  vehicleType?: string;
  rcId?: string;
  driverId?: string;
  driverName?: string;
  fleetOwnerId?: string;
  fleetOwnerName?: string;
  isActive: boolean;
}

// ============================================
// Issue Types
// ============================================

export type IssueStatus =
  | 'OPEN'
  | 'PENDING_INTERNAL'
  | 'PENDING_EXTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'NOT_APPLICABLE';

export interface Issue {
  issueReportId: string;
  issueReportShortId?: string;
  personId: string;
  rideId?: string;
  category: string;
  status: IssueStatus;
  assignee?: string;
  deleted: boolean;
  createdAt: string;
}

export interface IssueDetail extends Issue {
  description?: string;
  option?: string;
  comments: IssueComment[];
  mediaFiles: MediaFile[];
  personDetail?: PersonDetail;
  chats?: ChatDetail[];
}

export interface IssueComment {
  comment: string;
  authorDetail: AuthorDetail;
  timestamp: string;
}

export interface AuthorDetail {
  authorId: string;
  firstName?: string;
  lastName?: string;
}

export interface MediaFile {
  id: string;
  _type: 'Audio' | 'Video' | 'Image' | 'PDF';
  url: string;
  createdAt: string;
}

export interface PersonDetail {
  personId: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
}

export interface ChatDetail {
  id: string;
  chatType: 'Text' | 'Audio' | 'Image';
  content?: string;
  sender: 'USER' | 'BOT';
  timestamp: string;
}

// ============================================
// Message / Communication Types
// ============================================

export type MessageType = 'Text' | 'Audio' | 'Image';
export type MessageDeliveryStatus = 'Failed' | 'Success' | 'Queued' | 'Sending';

export interface Message {
  messageId: string;
  title: string;
  _type: MessageType;
  shareable: boolean;
}

export interface MessageDetail extends Message {
  description: string;
  shortDescription: string;
  mediaFiles: MediaFile[];
}

export interface MessageDeliveryInfo {
  messageId: string;
  success: number;
  failed: number;
  queued: number;
  sending: number;
  seen: number;
  liked: number;
  viewed: number;
}

// ============================================
// Analytics Types
// ============================================

export interface OperatorAnalytics {
  rating: number;
  cancellationRate: number;
  acceptanceRate: number;
}

export interface FilteredAnalytics {
  activeDriver: number;
  driverEnabled: number;
  greaterThanOneRide: number;
  greaterThanTenRide: number;
  greaterThanFiftyRide: number;
}

export interface FleetAnalytics {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalEarnings: number;
  totalRides: number;
}

// ============================================
// Config Types
// ============================================

export interface FarePolicy {
  id: string;
  vehicleVariant: string;
  baseFare: number;
  baseDistance: number;
  perExtraKmRate?: number;
  nightShiftCharge?: number;
  waitingCharge?: number;
  description?: string;
}

export interface ServiceUsageConfig {
  getDistances: string;
  getRoutes: string;
  snapToRoad: string;
  getPlaceName: string;
  getPlaceDetails: string;
  autoComplete: string;
  smsProvidersPriorityList: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// UI State Types
// ============================================

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters: Record<string, unknown>;
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

