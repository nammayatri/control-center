import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as dynamicLogicService from '../services/dynamicLogic';
import type {
    LogicDomain,
    LogicRolloutEntry,
    CreateTimeBoundsRequest,
    VerifyLogicRequest,
} from '../services/dynamicLogic';

// DynamicLogic hooks - BAP only

// ============================================
// Domain Queries
// ============================================

export function useDomains() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useQuery({
        queryKey: ['dynamicLogic', 'domains', merchantId, cityId, loginModule],
        queryFn: () => dynamicLogicService.getDomains(apiMerchantId!, cityId!, loginModule || undefined),
        enabled: !!apiMerchantId && !!cityId && hasAccess,
    });
}

// ============================================
// Logic Rollout
// ============================================

export function useLogicRollout(domain: LogicDomain | null, timeBound?: string) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useQuery({
        queryKey: ['dynamicLogic', 'rollout', merchantId, cityId, domain, timeBound, loginModule],
        queryFn: () => dynamicLogicService.getLogicRollout(apiMerchantId!, cityId!, domain!, timeBound, loginModule || undefined),
        enabled: !!apiMerchantId && !!cityId && !!domain && hasAccess,
    });
}

export function useUpsertLogicRollout() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: LogicRolloutEntry[]) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return dynamicLogicService.upsertLogicRollout(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicLogic', 'rollout'] });
        },
    });
}

// ============================================
// Time Bounds
// ============================================

export function useTimeBounds(domain: LogicDomain | null) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useQuery({
        queryKey: ['dynamicLogic', 'timeBounds', merchantId, cityId, domain, loginModule],
        queryFn: () => dynamicLogicService.getTimeBounds(apiMerchantId!, cityId!, domain!, loginModule || undefined),
        enabled: !!apiMerchantId && !!cityId && !!domain && hasAccess,
    });
}

export function useCreateTimeBounds() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: CreateTimeBoundsRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return dynamicLogicService.createTimeBounds(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicLogic', 'timeBounds'] });
        },
    });
}

export function useDeleteTimeBounds() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: ({ domain, name }: { domain: LogicDomain; name: string }) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return dynamicLogicService.deleteTimeBounds(apiMerchantId, cityId, domain, name, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dynamicLogic', 'timeBounds'] });
        },
    });
}

// ============================================
// Dynamic Logic
// ============================================

export function useDynamicLogic(domain: LogicDomain | null, version: number) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useQuery({
        queryKey: ['dynamicLogic', 'logic', merchantId, cityId, domain, version, loginModule],
        queryFn: () => dynamicLogicService.getDynamicLogic(apiMerchantId!, cityId!, domain!, version, loginModule || undefined),
        enabled: !!apiMerchantId && !!cityId && !!domain && version > 0 && hasAccess,
    });
}

export function useVerifyDynamicLogic() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: VerifyLogicRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return dynamicLogicService.verifyDynamicLogic(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: (data) => {
            if (data.isRuleUpdated) {
                queryClient.invalidateQueries({ queryKey: ['dynamicLogic', 'versions'] });
                queryClient.invalidateQueries({ queryKey: ['dynamicLogic', 'logic'] });
            }
        },
    });
}

export function useLogicVersions(domain: LogicDomain | null, limit: number = 10, offset: number = 0) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useQuery({
        queryKey: ['dynamicLogic', 'versions', merchantId, cityId, domain, limit, offset, loginModule],
        queryFn: () => dynamicLogicService.getLogicVersions(apiMerchantId!, cityId!, domain!, limit, offset, loginModule || undefined),
        enabled: !!apiMerchantId && !!cityId && !!domain && hasAccess,
    });
}

