import { useQuery } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as analyticsService from '../services/analytics';

// These analytics hooks are for BPP (driver) data - they should only be enabled for BPP/FLEET login

export function useOperatorAllTimeAnalytics() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['operatorAllTimeAnalytics', merchantId, cityId],
    queryFn: () => analyticsService.getOperatorAllTimeAnalytics(
      apiMerchantId!,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useOperatorFilteredAnalytics(from?: string, to?: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['operatorFilteredAnalytics', merchantId, cityId, from, to],
    queryFn: () => analyticsService.getOperatorFilteredAnalytics(
      apiMerchantId!,
      from,
      to,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useRevenueHistory(from?: string, to?: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['revenueHistory', merchantId, cityId, from, to],
    queryFn: () => analyticsService.getAllFeeHistory(
      apiMerchantId!,
      from,
      to,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useCollectionHistory(from?: string, to?: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['collectionHistory', merchantId, cityId, from, to],
    queryFn: () => analyticsService.getCollectionHistory(
      apiMerchantId!,
      from,
      to,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useDriverActivityAnalytics() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['driverActivityAnalytics', merchantId, cityId],
    queryFn: () => analyticsService.getDriverActivityAnalytics(
      apiMerchantId!,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useLiveMapDrivers(lat: number, lon: number, radius: number) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['liveMapDrivers', merchantId, cityId, lat, lon, radius],
    queryFn: () => analyticsService.getLiveMapDrivers(
      apiMerchantId!,
      lat,
      lon,
      radius,
      cityId || undefined
    ),
    enabled: !!merchantId && !!lat && !!lon && hasAccess,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// BAP Issue list - for customer issues
export function useIssueList(params: {
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BAP login (customer issues)
  const hasAccess = loginModule === 'BAP';
  
  return useQuery({
    queryKey: ['issues', merchantId, cityId, params],
    queryFn: () => analyticsService.getIssueList(
      apiMerchantId!,
      params.status,
      params.category,
      params.from,
      params.to,
      params.limit,
      params.offset,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

// BPP subscription transactions
export function useSubscriptionTransactions(params: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['subscriptionTransactions', merchantId, cityId, params],
    queryFn: () => analyticsService.getSubscriptionTransactions(
      apiMerchantId!,
      params.from,
      params.to,
      params.limit,
      params.offset,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}
