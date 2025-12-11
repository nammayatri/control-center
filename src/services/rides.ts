import { bapApi, bppApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { RideListFilters, Summary } from '../types';

// ============================================
// BAP Ride APIs (Customer-side)
// ============================================

export interface RideListResponse {
  list: Array<{
    id: string;
    status: string;
    createdAt: string;
    bookingId?: string;
    customerName?: string;
    customerPhone?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    fromLocation?: {
      lat: number;
      lon: number;
      area?: string;
      city?: string;
    };
    toLocation?: {
      lat: number;
      lon: number;
      area?: string;
      city?: string;
    };
    estimatedFare?: number;
    computedFare?: number;
    distance?: number;
  }>;
  summary: Summary;
}

export async function listRides(
  merchantId: string,
  cityId?: string,
  filters: RideListFilters = {}
): Promise<RideListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bap/{merchantId}/{city}/ride/list`
    : `/bap/{merchantId}/ride/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({
    status: filters.status,
    from: filters.from,
    to: filters.to,
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  });
  
  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface RideInfoResponse {
  id: string;
  bppRideId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  bookingId?: string;
  customerName?: string;
  customerPhone?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleVariant?: string;
  fromLocation?: {
    lat: number;
    lon: number;
    area?: string;
    street?: string;
    city?: string;
    state?: string;
  };
  toLocation?: {
    lat: number;
    lon: number;
    area?: string;
    street?: string;
    city?: string;
    state?: string;
  };
  estimatedFare?: number;
  computedFare?: number;
  estimatedDistance?: number;
  chargeableDistance?: number;
  rideStartTime?: string;
  rideEndTime?: string;
  tripStartTime?: string;
  tripEndTime?: string;
  fareBreakup?: Array<{
    title: string;
    price: number;
  }>;
}

export async function getRideInfo(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<RideInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bap/{merchantId}/{city}/ride/{rideId}/info`
    : `/bap/{merchantId}/ride/{rideId}/info`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bapApi, {
    method: 'GET',
    url: path,
  });
}

export interface CancelRideRequest {
  reasonCode: string;
  additionalInfo?: string;
}

export async function cancelRide(
  merchantId: string,
  rideId: string,
  data: CancelRideRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bap/{merchantId}/{city}/ride/cancel`
    : `/bap/{merchantId}/ride/cancel`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data: { ...data, rideId },
  });
}

export async function syncRide(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bap/{merchantId}/{city}/ride/sync`
    : `/bap/{merchantId}/ride/sync`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data: { rideId },
  });
}

export async function waiveCancellationCharges(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bap/{merchantId}/{city}/ride/cancellationChargesWaiveOff/{rideId}`
    : `/bap/{merchantId}/ride/cancellationChargesWaiveOff/{rideId}`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
  });
}

// ============================================
// BPP Ride APIs (Driver-side)
// ============================================

export interface BPPRideListResponse {
  list: Array<{
    id: string;
    bppRideId: string;
    status: string;
    createdAt: string;
    driverId: string;
    driverName?: string;
    vehicleNumber?: string;
    fromLocation?: {
      lat: number;
      lon: number;
      area?: string;
    };
    toLocation?: {
      lat: number;
      lon: number;
      area?: string;
    };
    fare?: number;
    distance?: number;
    duration?: number;
  }>;
  summary: Summary;
}

export async function listBPPRides(
  merchantId: string,
  cityId?: string,
  filters: RideListFilters = {}
): Promise<BPPRideListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/list`
    : `/bpp/driver-offer/{merchantId}/ride/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({
    status: filters.status,
    from: filters.from,
    to: filters.to,
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export async function getBPPRideInfo(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<RideInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/info`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/info`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function startRide(
  merchantId: string,
  rideId: string,
  point: { lat: number; lon: number },
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/start`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/start`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { point },
  });
}

export async function endRide(
  merchantId: string,
  rideId: string,
  point: { lat: number; lon: number },
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/end`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/end`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { point },
  });
}

export async function cancelBPPRide(
  merchantId: string,
  rideId: string,
  reasonCode: string,
  additionalInfo?: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/cancel`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/cancel`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { reasonCode, additionalInfo },
  });
}

export async function syncBPPRide(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/sync`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/sync`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

export async function getRideFareBreakup(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<Array<{ title: string; price: number }>> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/fareBreakUp`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/fareBreakUp`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function getRideRoute(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<Array<{ lat: number; lon: number; timestamp: string }>> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/ride/{rideId}/route`
    : `/bpp/driver-offer/{merchantId}/ride/{rideId}/route`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

