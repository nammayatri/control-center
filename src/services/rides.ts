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
    ? `/{merchantId}/{city}/ride/list`
    : `/{merchantId}/ride/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  // Map our filters to API query params
  const params: Record<string, string | number | boolean | null | undefined> = {
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  };

  if (filters.status) params.status = filters.status;
  if (filters.bookingStatus) {
    // BAP uses different status values: CANCELLED→RCANCELLED, COMPLETED→RCOMPLETED
    let mappedStatus: string = filters.bookingStatus;
    if (filters.bookingStatus === 'CANCELLED') {
      mappedStatus = 'RCANCELLED';
    } else if (filters.bookingStatus === 'COMPLETED') {
      mappedStatus = 'RCOMPLETED';
    }
    params.status = mappedStatus;
  }
  if (filters.rideShortId) params.rideShortId = filters.rideShortId;
  if (filters.customerPhoneNo) params.customerPhoneNo = filters.customerPhoneNo;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const query = buildQueryParams(params);
  
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
    ? `/{merchantId}/{city}/ride/{rideId}/info`
    : `/{merchantId}/ride/{rideId}/info`;
  
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
    ? `/{merchantId}/{city}/ride/cancel`
    : `/{merchantId}/ride/cancel`;
  
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
    ? `/{merchantId}/{city}/ride/sync`
    : `/{merchantId}/ride/sync`;
  
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
    ? `/{merchantId}/{city}/ride/cancellationChargesWaiveOff/{rideId}`
    : `/{merchantId}/ride/cancellationChargesWaiveOff/{rideId}`;
  
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
  rides: Array<{
    rideId: string;
    rideShortId: string;
    bookingStatus: string;
    rideCreatedAt: string;
    driverName?: string;
    driverPhoneNo?: string;
    vehicleNo?: string;
    customerName?: string;
    customerPhoneNo?: string;
    tripCategory?: string;
    fareDiff?: number;
    fareDiffWithCurrency?: {
      amount: number;
      currency: string;
    };
  }>;
  summary: Summary;
  totalItems: number;
}

export async function listBPPRides(
  merchantId: string,
  cityId?: string,
  filters: RideListFilters = {}
): Promise<BPPRideListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/ride/list`
    : `/driver-offer/{merchantId}/ride/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  // Map our filters to API query params
  const params: Record<string, string | number | boolean | null | undefined> = {
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  };

  if (filters.bookingStatus) params.bookingStatus = `"${filters.bookingStatus}"`; // The curl example shows quotes around the status
  if (filters.rideShortId) params.rideShortId = filters.rideShortId; // Or rideId if that's what the API expects for short id search? User said "searching with short ride id"
  // User curl shows: customerPhoneNo=9930081991
  if (filters.customerPhoneNo) params.customerPhoneNo = filters.customerPhoneNo;
  if (filters.driverPhoneNo) params.driverPhoneNo = filters.driverPhoneNo;
  
  // Date handling
  // User requirement: "If we are searching with any driver number or phone number, date is mandatory"
  // API curl shows: from=2025-11-01T00:00:00Z&to=2025-12-16T00:00:00Z
  if (filters.date) {
    // Assuming filters.date is a specific day, we need to generate start/end of that day or range
    // If the UI picks a date specific, we might send from/to for that day?
    // Or if the UI sends from/to directly. 
    // The plan said "Input: Date". 
    // Let's assume filters.from and filters.to are passed if range, or we construct them from filters.date
  }
  
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  // If using generic search param from other pages? No, this is specific page.
  
  const query = buildQueryParams(params);
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/info`
    : `/driver-offer/{merchantId}/ride/{rideId}/info`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/start`
    : `/driver-offer/{merchantId}/ride/{rideId}/start`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/end`
    : `/driver-offer/{merchantId}/ride/{rideId}/end`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/cancel`
    : `/driver-offer/{merchantId}/ride/{rideId}/cancel`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/sync`
    : `/driver-offer/{merchantId}/ride/{rideId}/sync`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/fareBreakUp`
    : `/driver-offer/{merchantId}/ride/{rideId}/fareBreakUp`;
  
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
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/route`
    : `/driver-offer/{merchantId}/ride/{rideId}/route`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

