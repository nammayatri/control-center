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
  blockedInfo?: Array<{
    reportedAt: string;
    blockedBy: string;
    blockReason?: string;
    blockTimeInHours?: number;
  }>;
}

export async function getDriverInfo(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<DriverInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/info`
    : `/driver-offer/{merchantId}/driver/info`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ driverId });
  
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

