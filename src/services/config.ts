import { bppApi, apiRequest, buildPath } from './api';
import type { ServiceUsageConfig } from '../types';

// ============================================
// Service Usage Config APIs
// ============================================

export async function getServiceUsageConfig(
  merchantId: string,
  cityId?: string
): Promise<ServiceUsageConfig> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/serviceUsageConfig`
    : `/bpp/driver-offer/{merchantId}/merchant/serviceUsageConfig`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Fare Policy APIs
// ============================================

export interface FarePolicyUpdateRequest {
  baseFare?: number;
  baseDistance?: number;
  perExtraKmRate?: number;
  nightShiftCharge?: number;
  waitingCharge?: number;
  description?: string;
}

export async function updateFarePolicy(
  merchantId: string,
  farePolicyId: string,
  data: FarePolicyUpdateRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/farePolicy/{farePolicyId}/update`
    : `/bpp/driver-offer/{merchantId}/merchant/config/farePolicy/{farePolicyId}/update`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{farePolicyId}', farePolicyId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Driver Pool Config APIs
// ============================================

export interface DriverPoolConfigResponse {
  minRadiusOfSearch: number;
  maxRadiusOfSearch: number;
  radiusStepSize: number;
  driverPositionInfoExpiry: number;
  actualDistanceThreshold: number;
}

export async function getDriverPoolConfig(
  merchantId: string,
  cityId?: string
): Promise<DriverPoolConfigResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/driverPool`
    : `/bpp/driver-offer/{merchantId}/merchant/config/driverPool`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function updateDriverPoolConfig(
  merchantId: string,
  data: Partial<DriverPoolConfigResponse>,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/driverPool/update`
    : `/bpp/driver-offer/{merchantId}/merchant/config/driverPool/update`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Common Config APIs
// ============================================

export interface CommonConfigResponse {
  pickupLocThreshold: number;
  dropLocThreshold: number;
  rideTimeEstimatedThreshold: number;
  defaultPopupDelay: number;
  popupDelayToAddAsPenalty: number;
  thresholdCancellationScore: number;
  minRidesForCancellationScore: number;
}

export async function getCommonConfig(
  merchantId: string,
  cityId?: string
): Promise<CommonConfigResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/common`
    : `/bpp/driver-offer/{merchantId}/merchant/config/common`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function updateCommonConfig(
  merchantId: string,
  data: Partial<CommonConfigResponse>,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/common/update`
    : `/bpp/driver-offer/{merchantId}/merchant/config/common/update`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Onboarding Document Config APIs
// ============================================

export interface DocumentConfigResponse {
  documentType: string;
  checkExpiry: boolean;
  checkExtraction: boolean;
  maxRetryCount: number;
  supportedVehicleClasses: string[];
}

export async function getOnboardingDocumentConfig(
  merchantId: string,
  cityId?: string
): Promise<DocumentConfigResponse[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/config/onboardingDocument`
    : `/bpp/driver-offer/{merchantId}/merchant/config/onboardingDocument`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Scheduler Trigger APIs
// ============================================

export interface SchedulerTriggerRequest {
  jobName: string;
  jobData: string;
  scheduledAt?: string;
}

export async function triggerSchedulerJob(
  merchantId: string,
  data: SchedulerTriggerRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/scheduler/trigger`
    : `/bpp/driver-offer/{merchantId}/merchant/scheduler/trigger`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Special Location APIs
// ============================================

export interface SpecialLocation {
  id: string;
  name: string;
  categoryCode: string;
  city: string;
  state: string;
}

export async function upsertSpecialLocation(
  merchantId: string,
  data: Omit<SpecialLocation, 'id'>,
  cityId?: string
): Promise<{ id: string }> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/specialLocation/upsert`
    : `/bpp/driver-offer/{merchantId}/merchant/specialLocation/upsert`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

export async function deleteSpecialLocation(
  merchantId: string,
  specialLocationId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/merchant/specialLocation/{specialLocationId}/delete`
    : `/bpp/driver-offer/{merchantId}/merchant/specialLocation/{specialLocationId}/delete`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{specialLocationId}', specialLocationId);
  
  return apiRequest(bppApi, {
    method: 'DELETE',
    url: path,
  });
}

