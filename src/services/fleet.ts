import { bppApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { FleetOwner, Vehicle, Summary } from '../types';

// ============================================
// Fleet Owner APIs
// ============================================

export interface FleetListResponse {
  listItem: FleetOwner[];
  summary: Summary;
}

export async function listFleets(
  merchantId: string,
  cityId?: string,
  limit?: number,
  offset?: number
): Promise<FleetListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/operator/fleets`
    : `/bpp/driver-offer/{merchantId}/operator/fleets`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Fleet Vehicle APIs
// ============================================

export interface FleetVehicleListResponse {
  vehicles: Vehicle[];
  summary: Summary;
}

export async function listFleetVehicles(
  merchantId: string,
  fleetOwnerId?: string,
  cityId?: string,
  limit?: number,
  offset?: number
): Promise<FleetVehicleListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/getAllVehicle`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/getAllVehicle`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Fleet Driver APIs
// ============================================

export interface FleetDriverListResponse {
  drivers: Array<{
    driverId: string;
    firstName: string;
    lastName?: string;
    mobileNumber: string;
    vehicleNumber?: string;
    isActive: boolean;
    fleetOwnerId: string;
  }>;
  summary: Summary;
}

export async function listFleetDrivers(
  merchantId: string,
  fleetOwnerId?: string,
  cityId?: string,
  limit?: number,
  offset?: number
): Promise<FleetDriverListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/getAllDriver`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/getAllDriver`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Fleet Analytics APIs
// ============================================

export interface FleetDashboardAnalyticsResponse {
  activeDriver: number;
  driverEnabled: number;
  greaterThanOneRide: number;
  greaterThanTenRide: number;
  greaterThanFiftyRide: number;
}

export async function getFleetDashboardAnalytics(
  merchantId: string,
  fleetOwnerId?: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<FleetDashboardAnalyticsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/dashboard/analytics`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/dashboard/analytics`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface FleetAllTimeAnalyticsResponse {
  rating: number;
  cancellationRate: number;
  acceptanceRate: number;
}

export async function getFleetAllTimeAnalytics(
  merchantId: string,
  fleetOwnerId?: string,
  cityId?: string
): Promise<FleetAllTimeAnalyticsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/dashboard/analytics/allTime`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/dashboard/analytics/allTime`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Fleet Earnings APIs
// ============================================

export interface FleetEarningResponse {
  totalEarnings: number;
  totalRides: number;
  totalDistance: number;
}

export async function getFleetTotalEarning(
  merchantId: string,
  fleetOwnerId?: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<FleetEarningResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/totalEarning`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/totalEarning`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface DriverEarningResponse {
  driverId: string;
  driverName: string;
  totalEarnings: number;
  totalRides: number;
}

export async function getFleetDriverEarnings(
  merchantId: string,
  fleetOwnerId?: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<DriverEarningResponse[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/driverEarning`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/driverEarning`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface VehicleEarningResponse {
  vehicleNumber: string;
  totalEarnings: number;
  totalRides: number;
}

export async function getFleetVehicleEarnings(
  merchantId: string,
  fleetOwnerId?: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<VehicleEarningResponse[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/vehicleEarning`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/vehicleEarning`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId, from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Fleet Associations APIs
// ============================================

export async function linkDriverToFleet(
  merchantId: string,
  driverId: string,
  fleetOwnerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/driverAssociation`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/driverAssociation`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { driverId, fleetOwnerId },
  });
}

export async function linkVehicleToFleet(
  merchantId: string,
  vehicleNumber: string,
  fleetOwnerId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/vehicleAssociation`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/vehicleAssociation`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: { vehicleNumber, fleetOwnerId },
  });
}

export async function unlinkDriverFromFleet(
  merchantId: string,
  driverId: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/{driverId}/fleet/remove/driver`
    : `/bpp/driver-offer/{merchantId}/driver/{driverId}/fleet/remove/driver`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{driverId}', driverId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

export async function unlinkVehicleFromFleet(
  merchantId: string,
  vehicleNumber: string,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/{vehicleNo}/fleet/remove/vehicle`
    : `/bpp/driver-offer/{merchantId}/driver/{vehicleNo}/fleet/remove/vehicle`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{vehicleNo}', vehicleNumber);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
  });
}

// ============================================
// Fleet Status
// ============================================

export interface FleetStatusResponse {
  totalDrivers: number;
  activeDrivers: number;
  onlineDrivers: number;
  busyDrivers: number;
  totalVehicles: number;
  activeVehicles: number;
}

export async function getFleetStatus(
  merchantId: string,
  fleetOwnerId?: string,
  cityId?: string
): Promise<FleetStatusResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/driver/fleet/status`
    : `/bpp/driver-offer/{merchantId}/driver/fleet/status`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ fleetOwnerId });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

