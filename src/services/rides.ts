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

// Location with full address details
export interface RideLocationDetail {
  lat: number;
  lon: number;
  area?: string;
  areaCode?: string;
  building?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  id?: string;
}

// Simple lat/lon location
export interface SimpleLocation {
  lat: number;
  lon: number;
}

// Currency amount
export interface CurrencyAmount {
  amount: number;
  currency: string;
}

// Distance with unit
export interface DistanceWithUnit {
  value: number;
  unit: string;
}

// Trip category V2
export interface TripCategoryV2 {
  contents: string;
  tag: string;
}

// BPP Ride Summary Response - detailed ride information
export interface BPPRideSummaryResponse {
  // Ride identifiers
  rideId: string;
  rideShortId?: string;
  
  // Status
  bookingStatus: string;
  rideStatus: string;
  
  // Customer info
  customerName?: string;
  customerPhoneNo?: string;
  
  // Driver info
  driverId?: string;
  driverName?: string;
  driverPhoneNo?: string;
  
  // Vehicle info
  vehicleNo?: string;
  vehicleVariant?: string;
  vehicleServiceTierName?: string;
  mbDefaultServiceTierName?: string;
  
  // Location details
  customerPickupLocation?: RideLocationDetail;
  customerDropLocation?: RideLocationDetail;
  actualDropLocation?: SimpleLocation;
  driverStartLocation?: SimpleLocation;
  driverCurrentLocation?: SimpleLocation | null;
  nextStopLocation?: SimpleLocation | null;
  lastStopLocation?: SimpleLocation | null;
  
  // Fare
  estimatedFare?: number;
  estimatedFareWithCurrency?: CurrencyAmount;
  actualFare?: number;
  actualFareWithCurrency?: CurrencyAmount;
  driverOfferedFare?: number | null;
  driverOfferedFareWithCurrency?: CurrencyAmount | null;
  
  // Distance
  chargeableDistance?: number;
  chargeableDistanceWithUnit?: DistanceWithUnit;
  rideDistanceEstimated?: number;
  rideDistanceEstimatedWithUnit?: DistanceWithUnit;
  rideDistanceActual?: number;
  rideDistanceActualWithUnit?: DistanceWithUnit;
  maxEstimatedDistance?: number;
  maxEstimatedDistanceWithUnit?: DistanceWithUnit;
  
  // Time
  rideBookingTime?: string;
  rideCreatedAt?: string;
  rideStartTime?: string;
  rideEndTime?: string;
  scheduledAt?: string;
  estimatedDriverArrivalTime?: string;
  actualDriverArrivalTime?: string;
  
  // Duration
  rideDuration?: number;
  estimatedRideDuration?: number;
  estimatedReservedDuration?: number | null;
  pickupDuration?: number;
  bookingToRideStartDuration?: number;
  
  // OTP
  rideOtp?: string;
  endOtp?: string | null;
  
  // Trip details
  tripCategory?: string;
  tripCategoryV2?: TripCategoryV2;
  roundTrip?: boolean;
  rideCity?: string;
  merchantOperatingCityId?: string;
  
  // Flags
  isPetRide?: boolean;
  isDestinationEdited?: boolean | null;
  pickupDropOutsideOfThreshold?: boolean;
  distanceCalculationFailed?: boolean;
  driverDeviatedFromRoute?: boolean;
  driverInitiatedCallCount?: number;
  
  // Cancellation (only for cancelled rides)
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledTime?: string | null;
  
  // Delivery
  deliveryParcelImageId?: string | null;
}

export async function getBPPRideSummary(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<BPPRideSummaryResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/info`
    : `/driver-offer/{merchantId}/ride/{rideId}/info`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// Fare Parameters Details (Progressive or Slab)
export interface FareParametersDetails {
  contents: {
    deadKmFare?: number;
    deadKmFareWithCurrency?: CurrencyAmount;
    extraKmFare?: number;
    extraKmFareWithCurrency?: CurrencyAmount;
    rideDurationFare?: number;
    rideDurationFareWithCurrency?: CurrencyAmount | null;
    pickupCharge?: number;
    pickupChargeWithCurrency?: CurrencyAmount;
  };
  tag: string;
}

// Individual fare breakup structure
export interface FareBreakupDetail {
  baseFare?: number;
  baseFareWithCurrency?: CurrencyAmount;
  congestionCharge?: number;
  congestionChargeWithCurrency?: CurrencyAmount;
  customerCancellationDues?: number | null;
  customerCancellationDuesWithCurrency?: CurrencyAmount | null;
  customerExtraFee?: number | null;
  customerExtraFeeWithCurrency?: CurrencyAmount | null;
  driverSelectedFare?: number | null;
  driverSelectedFareWithCurrency?: CurrencyAmount | null;
  fareParametersDetails?: FareParametersDetails;
  govtCharges?: number | null;
  govtChargesWithCurrency?: CurrencyAmount | null;
  nightShiftCharge?: number | null;
  nightShiftChargeWithCurrency?: CurrencyAmount | null;
  nightShiftRateIfApplies?: number | null;
  rideExtraTimeFare?: number | null;
  rideExtraTimeFareWithCurrency?: CurrencyAmount | null;
  serviceCharge?: number | null;
  serviceChargeWithCurrency?: CurrencyAmount | null;
  tollCharges?: number | null;
  tollChargesWithCurrency?: CurrencyAmount | null;
  updatedAt?: string;
  waitingCharge?: number | null;
  waitingChargeWithCurrency?: CurrencyAmount | null;
}

// Fare Breakup Response
export interface FareBreakupResponse {
  estimatedFareBreakUp: FareBreakupDetail;
  actualFareBreakUp: FareBreakupDetail;
}

export async function getBPPFareBreakup(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<FareBreakupResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/fareBreakUp`
    : `/driver-offer/{merchantId}/ride/{rideId}/fareBreakUp`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// Route Point from driver's GPS track
export interface RoutePoint {
  lat: number;
  lon: number;
  accuracy: number;
  rideStatus: 'ON_PICKUP' | 'ON_RIDE';
  timestamp: string;
}

// Route Response
export interface RouteResponse {
  actualRoute: RoutePoint[];
}

export async function getBPPRideRoute(
  merchantId: string,
  rideId: string,
  cityId?: string
): Promise<RouteResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/ride/{rideId}/route`
    : `/driver-offer/{merchantId}/ride/{rideId}/route`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{rideId}', rideId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

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

// getBPPRideInfo has the same implementation as getBPPRideSummary
// Use getBPPRideSummary instead for ride info requests
export const getBPPRideInfo = getBPPRideSummary;

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

// getRideFareBreakup has the same endpoint as getBPPFareBreakup but different return type
// Use getBPPFareBreakup for fare breakup requests with proper typing
export const getRideFareBreakup = getBPPFareBreakup as (
  merchantId: string,
  rideId: string,
  cityId?: string
) => Promise<Array<{ title: string; price: number }> | FareBreakupResponse>;

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

