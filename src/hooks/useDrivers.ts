import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as driversService from '../services/drivers';
import type { DriverListFilters } from '../types';

// All driver hooks call BPP APIs - they should only be enabled for BPP/FLEET login

export function useDriverList(filters: DriverListFilters = {}) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  // Use merchantShortId for API calls as that's what the API expects
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['drivers', merchantId, cityId, filters],
    queryFn: () => driversService.listDrivers(
      apiMerchantId!,
      cityId || undefined,
      filters
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useDriverInfo(driverId: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['driver', merchantId, cityId, driverId],
    queryFn: () => driversService.getDriverInfo(
      apiMerchantId!,
      driverId,
      cityId || undefined
    ),
    enabled: !!driverId && !!merchantId && hasAccess,
  });
}

export function useDriverActivity() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['driverActivity', merchantId, cityId],
    queryFn: () => driversService.getDriverActivity(
      apiMerchantId!,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useDriverEarnings(driverId: string, from?: string, to?: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['driverEarnings', merchantId, cityId, driverId, from, to],
    queryFn: () => driversService.getDriverEarnings(
      apiMerchantId!,
      driverId,
      cityId || undefined,
      from,
      to
    ),
    enabled: !!driverId && !!merchantId && hasAccess,
  });
}

export function useDriverFeedback(driverId: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['driverFeedback', merchantId, cityId, driverId],
    queryFn: () => driversService.getDriverFeedback(
      apiMerchantId!,
      driverId,
      cityId || undefined
    ),
    enabled: !!driverId && !!merchantId && hasAccess,
  });
}

export function useBlockDriver() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (driverId: string) => 
      driversService.blockDriver(
        apiMerchantId!,
        driverId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useUnblockDriver() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (driverId: string) => 
      driversService.unblockDriver(
        apiMerchantId!,
        driverId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useEnableDriver() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (driverId: string) => 
      driversService.enableDriver(
        apiMerchantId!,
        driverId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useDisableDriver() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (driverId: string) => 
      driversService.disableDriver(
        apiMerchantId!,
        driverId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useBlockReasonList() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';
  
  return useQuery({
    queryKey: ['blockReasons', merchantId, cityId],
    queryFn: () => driversService.getBlockReasonList(
      apiMerchantId!,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
  });
}
