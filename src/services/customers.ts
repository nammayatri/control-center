import { bapApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { Customer, CustomerListFilters } from '../types';

// ============================================
// Customer List & Info APIs
// ============================================

export interface CustomerListResponse {
  customers: Array<{
    customerId: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phoneNo: string;
    blocked: boolean;
    enabled: boolean;
  }>;
  summary: {
    count: number;
    totalCount: number;
  };
  totalItems: number;
}

export async function listCustomers(
  merchantId: string,
  cityId?: string,
  filters: CustomerListFilters = {}
): Promise<CustomerListResponse> {
  // Note: bapApi already has /api/bap as baseURL, so paths should not include /bap
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/list`
    : `/{merchantId}/customer/list`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({
    searchString: filters.searchString,
    blocked: filters.blocked,
    phone: filters.phone,
    personId: filters.personId,
    enabled: filters.enabled,
    limit: filters.limit || 20,
    offset: filters.offset || 0,
  });

  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface CustomerInfoResponse {
  falseSafetyAlarmCount: number;
  numberOfRides: number;
  safetyCenterDisabledOnDate: string | null;
  totalSosCount: number;
}

export async function getCustomerInfo(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<CustomerInfoResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/info`
    : `/{merchantId}/customer/{customerId}/info`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Customer Actions
// ============================================

export async function blockCustomer(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/block`
    : `/{merchantId}/customer/{customerId}/block`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
  });
}

export async function unblockCustomer(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/unblock`
    : `/{merchantId}/customer/{customerId}/unblock`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
  });
}

export async function deleteCustomer(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/delete`
    : `/{merchantId}/customer/{customerId}/delete`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'DELETE',
    url: path,
  });
}

export interface UpdateSafetyCenterBlockingRequest {
  shouldBlock: boolean;
}

export async function updateSafetyCenterBlocking(
  merchantId: string,
  customerId: string,
  data: UpdateSafetyCenterBlockingRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/updateSafetyCenterBlocking`
    : `/{merchantId}/customer/{customerId}/updateSafetyCenterBlocking`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Customer Bookings & Rides - Multimodal Journey List
// ============================================

// Types for Multimodal Journey List
export interface Location {
  id: string;
  lat: number;
  lon: number;
  area?: string;
  areaCode?: string;
  building?: string;
  city?: string;
  country?: string;
  door?: string;
  extras?: string;
  instructions?: string;
  placeId?: string | null;
  state?: string;
  street?: string;
  title?: string;
  ward?: string;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface FareBreakup {
  amount: number;
  amountWithCurrency: CurrencyAmount;
  description: string;
}

export interface RideContents {
  agencyName: string;
  agencyNumber: string;
  bookingDetails: {
    contents: {
      estimatedDistance: number;
      estimatedDistanceWithUnit: {
        unit: string;
        value: number;
      };
      isUpgradedToCab: boolean;
      stops: unknown[];
      toLocation: Location;
    };
    fareProductType: string;
  };
  cancellationReason: string | null;
  createdAt: string;
  discount: number | null;
  discountWithCurrency: CurrencyAmount | null;
  driversPreviousRideDropLocLat: number | null;
  driversPreviousRideDropLocLon: number | null;
  duration: number;
  estimatedDistance: number;
  estimatedDistanceWithUnit: {
    unit: string;
    value: number;
  };
  estimatedDuration: number;
  estimatedEndTimeRange: string | null;
  estimatedFare: number;
  estimatedFareBreakup: FareBreakup[];
  estimatedFareWithCurrency: CurrencyAmount;
  estimatedTotalFare: number;
  estimatedTotalFareWithCurrency: CurrencyAmount;
  fareBreakup: FareBreakup[];
  favCount: number;
  fromLocation: Location;
  hasDisability: boolean;
  hasNightIssue: boolean;
  id: string;
  initialPickupLocation: Location;
  insuredAmount: number | null;
  isAirConditioned: boolean | null;
  isAlreadyFav: boolean;
  isBookingUpdated: boolean;
  isInsured: boolean;
  isPetRide: boolean;
  isSafetyPlus: boolean;
  isScheduled: boolean;
  isValueAddNP: boolean;
  mbJourneyId: string;
  merchantExoPhone: string;
  paymentInstrument: unknown | null;
  paymentMethodId: string;
  paymentUrl: string | null;
  returnTime: string | null;
  rideEndTime: string;
  rideList: Array<{
    allowedEditLocationAttempts: number;
    allowedEditPickupLocationAttempts: number;
    bppRideId: string;
    cancellationChargesOnCancel: number | null;
    cancellationFeeIfCancelled: number | null;
    chargeableRideDistance: number;
    chargeableRideDistanceWithUnit: {
      unit: string;
      value: number;
    };
    computedPrice: number;
    computedPriceWithCurrency: CurrencyAmount;
    createdAt: string;
    destinationReachedAt: string | null;
    driverArrivalTime: string;
    driverImage: string | null;
    driverName: string;
    driverNumber: string;
    driverRatings: number;
    driverRegisteredAt: string;
    endOdometerReading: number | null;
    endOtp: string;
    favCount: number;
    feedbackSkipped: boolean;
    id: string;
    insuredAmount: number | null;
    isAlreadyFav: boolean;
    isFreeRide: boolean;
    isInsured: boolean;
    isPetRide: boolean;
    isSafetyPlus: boolean;
    onlinePayment: boolean;
    rideEndTime: string;
    rideOtp: string;
    rideRating: number | null;
    rideStartTime: string;
    shortRideId: string;
    startOdometerReading: number | null;
    status: string;
    stopsInfo: unknown[];
    talkedWithDriver: boolean;
    tollConfidence: string;
    traveledRideDistance: {
      unit: string;
      value: number;
    };
    updatedAt: string;
    vehicleAge: number;
    vehicleColor: string;
    vehicleModel: string;
    vehicleNumber: string;
    vehicleServiceTierType: string;
    vehicleVariant: string;
  }>;
  rideScheduledTime: string;
  rideStartTime: string;
  serviceTierName: string;
  serviceTierShortDesc: string;
  sosStatus: string | null;
  specialLocationName: string | null;
  specialLocationTag: string | null;
  status: string;
  tripCategory: {
    contents: string;
    tag: string;
  };
  tripTerms: unknown[];
  updatedAt: string;
  vehicleIconUrl: string;
  vehicleServiceTierAirConditioned: boolean | null;
  vehicleServiceTierSeatingCapacity: number;
  vehicleServiceTierType: string;
}

export interface MultiModalRideContents {
  createdAt: string;
  endTime: string;
  estimatedDistance: {
    unit: string;
    value: number;
  };
  estimatedDuration: number;
  estimatedMaxFare: CurrencyAmount;
  estimatedMinFare: CurrencyAmount;
  isSingleMode: boolean;
  journeyId: string;
  journeyStatus: string;
  legs: Array<{
    actualDistance: {
      unit: string;
      value: number;
    } | null;
    bookingAllowed: boolean;
    bookingStatus: {
      contents: string;
      tag: string;
    };
    entrance: Location | null;
    estimatedChildFare: number | null;
    estimatedDistance: {
      unit: string;
      value: number;
    };
    estimatedDuration: number;
    estimatedMaxFare: CurrencyAmount;
    estimatedMinFare: CurrencyAmount;
    estimatedTotalFare: number | null;
    exit: unknown | null;
    journeyLegId: string;
    legExtraInfo: {
      contents: unknown;
      tag: string;
    };
    merchantId: string;
    merchantOperatingCityId: string;
    order: number;
    personId: string;
    pricingId: string;
    searchId: string;
    skipBooking: boolean;
    startTime: string;
    status: string;
    totalFare: CurrencyAmount | null;
    travelMode: string;
    validTill: string | null;
  }>;
  merchantOperatingCityName: string;
  offer: {
    offerDescription: string;
    offerIds: unknown[];
    offerSponsoredBy: unknown[];
    offerTitle: string;
  };
  paymentOrderShortId: string;
  result: string;
  startTime: string;
  unifiedQR: unknown;
  unifiedQRV2: unknown;
}

export interface JourneyListItem {
  contents: RideContents | MultiModalRideContents;
  tag: 'Ride' | 'MultiModalRide';
}

export interface MultimodalJourneyListResponse {
  bookingOffset: number;
  hasMoreData: boolean;
  journeyOffset: number;
  list: JourneyListItem[];
}

export interface MultimodalJourneyListFilters {
  customerPhoneNo?: string;
  fromDate?: number; // timestamp in milliseconds
  toDate?: number; // timestamp in milliseconds
  isPaymentSuccess?: boolean;
  limit?: number;
  offset?: number;
}

export async function getMultimodalJourneyList(
  merchantId: string,
  cityId: string,
  filters: MultimodalJourneyListFilters = {}
): Promise<MultimodalJourneyListResponse> {
  const basePath = `/{merchantId}/{city}/rideBooking/multiModal/list/`;
  const path = buildPath(basePath, merchantId, cityId);

  const queryParams: Record<string, string | number> = {
    limit: filters.limit || 5,
    offset: filters.offset || 0,
    Offset: filters.offset || 0,
    Limit: filters.limit || 5,
    mboffset: filters.offset || 0,
    mblimit: filters.limit || 5,
  };

  if (filters.customerPhoneNo) {
    queryParams.customerPhoneNo = filters.customerPhoneNo;
  }
  if (filters.fromDate) {
    queryParams.fromDate = filters.fromDate;
  }
  if (filters.toDate) {
    queryParams.toDate = filters.toDate;
  }
  if (filters.isPaymentSuccess !== undefined) {
    queryParams.isPaymentSuccess = filters.isPaymentSuccess ? 'true' : 'false';
  }

  const query = buildQueryParams(queryParams);

  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Customer Cancellation Dues
// ============================================

export interface CancellationDuesDetails {
  cancellationCharges: number;
  disputeChancesUsed: number;
  canDispute: boolean;
}

export async function getCancellationDuesDetails(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<CancellationDuesDetails> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/getCancellationDuesDetails`
    : `/{merchantId}/customer/{customerId}/getCancellationDuesDetails`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'GET',
    url: path,
  });
}

export async function syncCancellationDues(
  merchantId: string,
  customerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/cancellationDuesSync`
    : `/{merchantId}/customer/{customerId}/cancellationDuesSync`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
  });
}

// ============================================
// Customer SOS
// ============================================

export interface CreateSOSRequest {
  flow: string;
  rideId?: string;
}

export async function createCustomerSOS(
  merchantId: string,
  customerId: string,
  data: CreateSOSRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/{customerId}/sos/create`
    : `/{merchantId}/customer/{customerId}/sos/create`;

  const path = buildPath(basePath, merchantId, cityId).replace('{customerId}', customerId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data,
  });
}

// ============================================
// Customer Lookup
// ============================================

export async function getCustomerByPersonId(
  merchantId: string,
  personId: string,
  cityId?: string
): Promise<Customer> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/personId`
    : `/{merchantId}/customer/personId`;

  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ personId });

  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export async function getCustomersByPhoneNumbers(
  merchantId: string,
  phoneNumbers: string[],
  cityId?: string
): Promise<Customer[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/customer/personNumbers`
    : `/{merchantId}/customer/personNumbers`;

  const path = buildPath(basePath, merchantId, cityId);

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data: { phoneNumbers },
  });
}

