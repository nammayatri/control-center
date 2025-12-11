import { bppApi, bapApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { Summary } from '../types';

// ============================================
// Operator Analytics APIs
// ============================================

export interface OperatorAnalyticsResponse {
  rating: number;
  cancellationRate: number;
  acceptanceRate: number;
}

export async function getOperatorAllTimeAnalytics(
  merchantId: string,
  cityId?: string
): Promise<OperatorAnalyticsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/operator/dashboard/analytics/allTime`
    : `/driver-offer/{merchantId}/driver/operator/dashboard/analytics/allTime`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export interface FilteredOperatorAnalyticsResponse {
  activeDriver: number;
  driverEnabled: number;
  greaterThanOneRide: number;
  greaterThanTenRide: number;
  greaterThanFiftyRide: number;
}

export async function getOperatorFilteredAnalytics(
  merchantId: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<FilteredOperatorAnalyticsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/operator/dashboard/analytics`
    : `/driver-offer/{merchantId}/driver/operator/dashboard/analytics`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Revenue & Collection Analytics
// ============================================

export interface RevenueHistoryItem {
  date: string;
  totalRevenue: number;
  totalCollection: number;
  totalRides: number;
}

export interface RevenueHistoryResponse {
  history: RevenueHistoryItem[];
  summary: {
    totalRevenue: number;
    totalCollection: number;
    totalRides: number;
  };
}

export async function getAllFeeHistory(
  merchantId: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<RevenueHistoryResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/revenue/allFeeHistory`
    : `/driver-offer/{merchantId}/revenue/allFeeHistory`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface CollectionHistoryItem {
  date: string;
  cashCollection: number;
  onlineCollection: number;
  totalCollection: number;
}

export interface CollectionHistoryResponse {
  history: CollectionHistoryItem[];
  summary: {
    totalCashCollection: number;
    totalOnlineCollection: number;
    totalCollection: number;
  };
}

export async function getCollectionHistory(
  merchantId: string,
  from?: string,
  to?: string,
  cityId?: string
): Promise<CollectionHistoryResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/revenue/collectionHistory`
    : `/driver-offer/{merchantId}/revenue/collectionHistory`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ from, to });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Driver Activity Analytics
// ============================================

export interface DriverActivityAnalytics {
  activeDrivers: number;
  inactiveDrivers: number;
  busyDrivers: number;
  onlineDrivers: number;
  offlineDrivers: number;
}

export async function getDriverActivityAnalytics(
  merchantId: string,
  cityId?: string
): Promise<DriverActivityAnalytics> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/driver/activity`
    : `/driver-offer/{merchantId}/driver/activity`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

// ============================================
// Live Map / Driver Location Analytics
// ============================================

export interface NearbyDriver {
  driverId: string;
  driverName?: string;
  lat: number;
  lon: number;
  vehicleNumber?: string;
  vehicleVariant?: string;
  mode?: string;
}

export async function getLiveMapDrivers(
  merchantId: string,
  lat: number,
  lon: number,
  radius: number,
  cityId?: string
): Promise<NearbyDriver[]> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/liveMap/drivers/{radius}`
    : `/driver-offer/{merchantId}/liveMap/drivers/{radius}`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{radius}', String(radius));
  const query = buildQueryParams({ lat, lon });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Issue Analytics
// ============================================

export interface IssueListResponse {
  issues: Array<{
    issueReportId: string;
    issueReportShortId?: string;
    personId: string;
    rideId?: string;
    category: string;
    status: string;
    assignee?: string;
    createdAt: string;
  }>;
  summary: Summary;
}

export async function getIssueList(
  merchantId: string,
  status?: string,
  category?: string,
  from?: string,
  to?: string,
  limit?: number,
  offset?: number,
  cityId?: string
): Promise<IssueListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/{merchantId}/{city}/issueV2/list`
    : `/{merchantId}/issueV2/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ status, category, from, to, limit, offset });
  
  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export async function getBPPIssueList(
  merchantId: string,
  status?: string,
  category?: string,
  from?: string,
  to?: string,
  limit?: number,
  offset?: number,
  cityId?: string
): Promise<IssueListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/issue/list`
    : `/driver-offer/{merchantId}/issue/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ status, category, from, to, limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

// ============================================
// Subscription Analytics
// ============================================

export interface SubscriptionTransactionItem {
  id: string;
  driverId: string;
  driverName?: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface SubscriptionTransactionsResponse {
  transactions: SubscriptionTransactionItem[];
  summary: Summary;
}

export async function getSubscriptionTransactions(
  merchantId: string,
  from?: string,
  to?: string,
  limit?: number,
  offset?: number,
  cityId?: string
): Promise<SubscriptionTransactionsResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/driver-offer/{merchantId}/{city}/subscriptionTransaction/subscription/transactions`
    : `/driver-offer/{merchantId}/subscriptionTransaction/subscription/transactions`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ from, to, limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

