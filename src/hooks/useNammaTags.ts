import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as nammaTagsService from '../services/nammaTags';
import type {
    CreateTagRequest,
    UpdateTagRequest,
    VerifyTagRuleRequest,
    CreateQueryRequest,
    UpdateQueryRequest,
    DeleteQueryRequest,
} from '../services/nammaTags';

// NammaTags hooks - BAP only

// ============================================
// Tag Mutations
// ============================================

export function useCreateTag() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule; // BAP or BPP

    return useMutation({
        mutationFn: (data: CreateTagRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.createTag(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaTags'] });
        },
    });
}

export function useUpdateTag() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: UpdateTagRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.updateTag(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaTags'] });
        },
    });
}

export function useDeleteTag() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (tagName: string) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.deleteTag(apiMerchantId, cityId, tagName, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaTags'] });
        },
    });
}

export function useVerifyTagRule() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: VerifyTagRuleRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.verifyTagRule(apiMerchantId, cityId, data, loginModule || undefined);
        },
    });
}

// ============================================
// Query Mutations
// ============================================

export function useCreateQuery() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: CreateQueryRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.createQuery(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaQueries'] });
        },
    });
}

export function useUpdateQuery() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: UpdateQueryRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.updateQuery(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaQueries'] });
        },
    });
}

export function useDeleteQuery() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;
    const hasAccess = !!loginModule;

    return useMutation({
        mutationFn: (data: DeleteQueryRequest) => {
            if (!apiMerchantId || !cityId || !hasAccess) {
                return Promise.reject(new Error('Missing required context'));
            }
            return nammaTagsService.deleteQuery(apiMerchantId, cityId, data, loginModule || undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nammaQueries'] });
        },
    });
}
