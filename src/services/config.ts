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

export async function exportFarePolicy(
  merchantId: string,
  cityId: string
): Promise<string> {
  // Note: bppApi base URL already includes /bpp, so path should start with /driver-offer
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/farePolicy/export`;
  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function upsertFarePolicy(
  merchantId: string,
  cityId: string,
  file: File
): Promise<void> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/farePolicy/upsert`;
  const path = buildPath(basePath, merchantId, cityId);

  const formData = new FormData();
  formData.append('file', file);

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
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

// ============================================
// Vehicle Service Tier Config APIs
// ============================================

export interface VehicleServiceTierConfig {
  serviceTierType: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  seatingCapacity: number;
  vehicleCategory: string;
  vehicleIconUrl: string | null;
  vehicleRating: number | null;
  driverRating: number | null;
  priority: number;
  isAirConditioned: boolean | null;
  airConditionedThreshold: number | null;
  allowedVehicleVariant: string[];
  autoSelectedVehicleVariant: string[];
  defaultForVehicleVariant: string[];
  baseVehicleServiceTier: boolean;
  fareAdditionPerKmOverBaseServiceTier: number;
  isIntercityEnabled: boolean | null;
  isRentalsEnabled: boolean | null;
  luggageCapacity: number | null;
  oxygen: number | null;
  ventilator: number | null;
  stopFcmThreshold: number | null;
  stopFcmSuppressCount: number | null;
  scheduleBookingListEligibilityTags: string[] | null;
}

export interface VehicleServiceTierUpdateRequest {
  airConditionedThreshold?: number | null;
  allowedVehicleVariant?: string[];
  autoSelectedVehicleVariant?: string[];
  baseVehicleServiceTier?: boolean;
  defaultForVehicleVariant?: string[];
  driverRating?: number | null;
  fareAdditionPerKmOverBaseServiceTier?: number;
  isAirConditioned?: boolean | null;
  isIntercityEnabled?: boolean | null;
  isRentalsEnabled?: boolean | null;
  longDescription?: string | null;
  luggageCapacity?: number | null;
  name?: string;
  oxygen?: number | null;
  priority?: number;
  scheduleBookingListEligibilityTags?: string[] | null;
  seatingCapacity?: number;
  shortDescription?: string | null;
  stopFcmSuppressCount?: number | null;
  stopFcmThreshold?: number | null;
  vehicleIconUrl?: string | null;
  vehicleRating?: number | null;
  ventilator?: number | null;
}

export async function getVehicleServiceTierConfig(
  merchantId: string,
  cityId: string,
  serviceTierType?: string
): Promise<VehicleServiceTierConfig[]> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/vehicleServiceTier`;
  let path = buildPath(basePath, merchantId, cityId);

  if (serviceTierType) {
    path += `?serviceTierType="${serviceTierType}"`;
  }

  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function updateVehicleServiceTierConfig(
  merchantId: string,
  cityId: string,
  serviceTierType: string,
  data: VehicleServiceTierUpdateRequest
): Promise<void> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/vehicleServiceTier/update`;
  const path = buildPath(basePath, merchantId, cityId) + `?serviceTierType="${serviceTierType}"`;

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}
