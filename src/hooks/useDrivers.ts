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
      cityId || undefined,
      { driverId },
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

export function useDriverDocumentsList(driverId: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();

  const apiMerchantId = merchantShortId || merchantId;

  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  return useQuery({
    queryKey: ['driverDocumentsList', merchantId, cityId, driverId],
    queryFn: () => driversService.getDriverDocumentsList(
      apiMerchantId!,
      driverId,
      cityId || undefined
    ),
    enabled: !!driverId && !!merchantId && hasAccess,
    refetchOnMount: 'always',
  });
}

export function useDocumentConfigs() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();

  const apiMerchantId = merchantShortId || merchantId;

  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  return useQuery({
    queryKey: ['documentConfigs', merchantId, cityId],
    queryFn: () => driversService.getDocumentConfigs(
      apiMerchantId!,
      cityId || undefined
    ),
    enabled: !!merchantId && hasAccess,
    refetchOnMount: 'always',
  });
}

export function useGetDocument(documentId: string | null) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();

  const apiMerchantId = merchantShortId || merchantId;

  // Only enable for BPP or FLEET login
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  return useQuery({
    queryKey: ['document', merchantId, cityId, documentId],
    queryFn: () => driversService.getDocument(
      apiMerchantId!,
      documentId!,
      cityId || undefined
    ),
    enabled: !!documentId && !!merchantId && hasAccess,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();

  const apiMerchantId = merchantShortId || merchantId;

  return useMutation({
    mutationFn: ({
      driverId,
      documentType,
      imageBase64,
    }: {
      driverId: string;
      documentType: string;
      imageBase64: string;
    }) =>
      driversService.uploadDocument(
        apiMerchantId!,
        driverId,
        documentType,
        imageBase64,
        cityId || undefined
      ),
    onSuccess: (_, variables) => {
      // Invalidate the documents list for this driver
      queryClient.invalidateQueries({
        queryKey: ['driverDocumentsList', merchantId, cityId, variables.driverId],
      });
      // Also invalidate document configs as counts might change? Unlikely but safe.
      queryClient.invalidateQueries({
        queryKey: ['documentConfigs', merchantId, cityId],
      });
      // Invalidate additional documents (ProfilePhoto, Aadhaar, Pan)
      queryClient.invalidateQueries({
        queryKey: ['panAadharSelfieDetails', merchantId, cityId, variables.driverId],
      });
    },
  });
}

export function usePanAadharSelfieDetails(driverId: string, docType: string) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  const apiMerchantId = merchantShortId || merchantId;
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  return useQuery({
    queryKey: ['panAadharSelfieDetails', merchantId, cityId, driverId, docType],
    queryFn: () => driversService.getPanAadharSelfieDetails(
      apiMerchantId!,
      driverId,
      docType,
      cityId || undefined
    ),
    enabled: !!driverId && !!merchantId && hasAccess && !!docType,
    refetchOnMount: 'always',
  });
}

export function useUpdateDriverName() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();

  const apiMerchantId = merchantShortId || merchantId;

  return useMutation({
    mutationFn: ({
      driverId,
      firstName,
      lastName,
      middleName,
    }: {
      driverId: string;
      firstName: string;
      lastName: string;
      middleName: string;
    }) =>
      driversService.updateDriverName(
        apiMerchantId!,
        driverId,
        { firstName, lastName, middleName },
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useDriverCoinHistory(driverId: string, limit: number = 5, offset: number = 0, enabled: boolean = true) {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { loginModule } = useAuth();
  const apiMerchantId = merchantShortId || merchantId;
  const hasAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  return useQuery({
    queryKey: ['driverCoinHistory', merchantId, cityId, driverId, limit, offset],
    queryFn: () => driversService.getDriverCoinHistory(
      apiMerchantId!,
      driverId,
      limit,
      offset,
      cityId || undefined
    ),
    enabled: !!driverId && !!merchantId && hasAccess && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

export function useBulkUploadCoins() {
  const { merchantId, merchantShortId } = useDashboardContext();
  const queryClient = useQueryClient();
  const apiMerchantId = merchantShortId || merchantId;

  return useMutation({
    mutationFn: (data: Parameters<typeof driversService.bulkUploadCoinsV2>[1]) =>
      driversService.bulkUploadCoinsV2(apiMerchantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverCoinHistory'] });
    },
  });
}

export function useChangeOperatingCity() {
  const queryClient = useQueryClient();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();

  const apiMerchantId = merchantShortId || merchantId;

  return useMutation({
    mutationFn: ({
      driverId,
      operatingCity,
    }: {
      driverId: string;
      operatingCity: string;
    }) =>
      driversService.changeOperatingCity(
        apiMerchantId!,
        driverId,
        operatingCity,
        cityId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useSendDummyNotification() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();

  const apiMerchantId = merchantShortId || merchantId;

  return useMutation({
    mutationFn: (driverId: string) =>
      driversService.sendDummyNotification(
        apiMerchantId!,
        driverId,
        cityId || undefined
      ),
  });
}
