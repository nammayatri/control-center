import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as customersService from '../services/customers';
import type { CustomerListFilters } from '../types';

// All customer hooks call BAP APIs - they should only be enabled for BAP login

export function useCustomerList(filters: CustomerListFilters = {}) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BAP login
  const hasAccess = loginModule === 'BAP';
  
  return useQuery({
    queryKey: ['customers', merchantId, cityId, filters],
    queryFn: () => customersService.listCustomers(
      apiMerchantId!,
      cityId || undefined,
      filters
    ),
    enabled: !!merchantId && hasAccess,
  });
}

export function useCustomerInfo(customerId: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BAP login
  const hasAccess = loginModule === 'BAP';
  
  return useQuery({
    queryKey: ['customer', merchantId, cityId, customerId],
    queryFn: () => customersService.getCustomerInfo(
      apiMerchantId!,
      customerId,
      cityId || undefined
    ),
    enabled: !!customerId && !!merchantId && hasAccess,
  });
}

export function useMultimodalJourneyList(
  customerPhoneNo: string,
  filters: {
    fromDate?: number;
    toDate?: number;
    isPaymentSuccess?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BAP login
  const hasAccess = loginModule === 'BAP';
  
  return useQuery({
    queryKey: ['multimodalJourneyList', merchantId, cityId, customerPhoneNo, filters],
    queryFn: () => customersService.getMultimodalJourneyList(
      apiMerchantId!,
      cityId!,
      {
        customerPhoneNo,
        ...filters,
      }
    ),
    enabled: !!merchantId && !!cityId && !!customerPhoneNo && hasAccess,
  });
}

export function useCancellationDuesDetails(customerId: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  // Only enable for BAP login
  const hasAccess = loginModule === 'BAP';
  
  return useQuery({
    queryKey: ['cancellationDues', merchantId, cityId, customerId],
    queryFn: () => customersService.getCancellationDuesDetails(
      apiMerchantId!,
      customerId,
      cityId || undefined
    ),
    enabled: !!customerId && !!merchantId && hasAccess,
  });
}

export function useBlockCustomer() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (customerId: string) => 
      customersService.blockCustomer(
        apiMerchantId!,
        customerId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useUnblockCustomer() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (customerId: string) => 
      customersService.unblockCustomer(
        apiMerchantId!,
        customerId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (customerId: string) => 
      customersService.deleteCustomer(
        apiMerchantId!,
        customerId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useSyncCancellationDues() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: (customerId: string) => 
      customersService.syncCancellationDues(
        apiMerchantId!,
        customerId,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancellationDues'] });
    },
  });
}

export function useUpdateSafetyCenterBlocking() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  
  const apiMerchantId = merchantShortId || merchantId;
  
  return useMutation({
    mutationFn: ({ customerId, shouldBlock }: { customerId: string; shouldBlock: boolean }) => 
      customersService.updateSafetyCenterBlocking(
        apiMerchantId!,
        customerId,
        { shouldBlock },
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}
