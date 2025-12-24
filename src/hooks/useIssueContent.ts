// Issue Config React Query Hooks
// Manage issue categories, messages, options, translations, and config

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import * as issueContentService from '../services/issueContent';
import type {
    CreateIssueCategoryReq,
    UpdateIssueCategoryReq,
    ReorderIssueCategoryReq,
    UpsertIssueMessageReq,
    ReorderIssueMessageReq,
    CreateIssueOptionReq,
    UpdateIssueOptionReq,
    ReorderIssueOptionReq,
    BulkUpsertTranslationsReq,
    UpdateIssueConfigReq,
    GetMessagesParams,
    GetOptionsParams,
    Language,
} from '../types/issueContent';

// ============================================
// Category Queries
// ============================================

export function useCategories() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueCategories', apiMerchantId, cityId],
        queryFn: () => issueContentService.getCategories(apiMerchantId!, cityId!),
        enabled,
    });
}

export function useCategoryDetail(categoryId: string | null, language: Language = 'ENGLISH') {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && !!categoryId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueCategoryDetail', apiMerchantId, cityId, categoryId, language],
        queryFn: () => issueContentService.getCategoryDetail(apiMerchantId!, cityId!, categoryId!, language),
        enabled,
    });
}

export function useCategoryPreview(categoryId: string | null, language: Language = 'ENGLISH') {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && !!categoryId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueCategoryPreview', apiMerchantId, cityId, categoryId, language],
        queryFn: () => issueContentService.getCategoryPreview(apiMerchantId!, cityId!, categoryId!, language),
        enabled,
    });
}

// ============================================
// Category Mutations
// ============================================

export function useCreateCategory() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: CreateIssueCategoryReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.createCategory(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueCategories'] });
        },
    });
}

export function useUpdateCategory() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: UpdateIssueCategoryReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.updateCategory(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueCategories'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useDeleteCategory() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (categoryId: string) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.deleteCategory(apiMerchantId, cityId, categoryId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueCategories'] });
        },
    });
}

export function useReorderCategories() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: ReorderIssueCategoryReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.reorderCategories(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueCategories'] });
        },
    });
}

// ============================================
// Message Queries
// ============================================

export function useMessages(params: GetMessagesParams) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && loginModule === 'BAP' &&
        (!!params.categoryId || !!params.optionId);

    return useQuery({
        queryKey: ['issueMessages', apiMerchantId, cityId, params],
        queryFn: () => issueContentService.getMessages(apiMerchantId!, cityId!, params),
        enabled,
    });
}

export function useMessageDetail(messageId: string | null, language: Language = 'ENGLISH') {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && !!messageId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueMessageDetail', apiMerchantId, cityId, messageId, language],
        queryFn: () => issueContentService.getMessageDetail(apiMerchantId!, cityId!, messageId!, language),
        enabled,
    });
}

// ============================================
// Message Mutations
// ============================================

export function useUpsertMessage() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: ({ data, mediaFiles }: { data: UpsertIssueMessageReq; mediaFiles?: File[] }) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.upsertMessage(apiMerchantId, cityId, data, mediaFiles);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueMessages'] });
            queryClient.invalidateQueries({ queryKey: ['issueMessageDetail'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useDeleteMessage() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (messageId: string) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.deleteMessage(apiMerchantId, cityId, messageId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueMessages'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useReorderMessages() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: ReorderIssueMessageReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.reorderMessages(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueMessages'] });
        },
    });
}

// ============================================
// Option Queries
// ============================================

export function useOptions(params: GetOptionsParams) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && loginModule === 'BAP' &&
        (!!params.categoryId || !!params.messageId);

    return useQuery({
        queryKey: ['issueOptions', apiMerchantId, cityId, params],
        queryFn: () => issueContentService.getOptions(apiMerchantId!, cityId!, params),
        enabled,
    });
}

export function useOptionDetail(optionId: string | null, language: Language = 'ENGLISH') {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && !!optionId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueOptionDetail', apiMerchantId, cityId, optionId, language],
        queryFn: () => issueContentService.getOptionDetail(apiMerchantId!, cityId!, optionId!, language),
        enabled,
    });
}

// ============================================
// Option Mutations
// ============================================

export function useCreateOption() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: CreateIssueOptionReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.createOption(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueOptions'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useUpdateOption() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: UpdateIssueOptionReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.updateOption(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueOptions'] });
            queryClient.invalidateQueries({ queryKey: ['issueOptionDetail'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useDeleteOption() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (optionId: string) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.deleteOption(apiMerchantId, cityId, optionId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueOptions'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

export function useReorderOptions() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: ReorderIssueOptionReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.reorderOptions(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueOptions'] });
        },
    });
}

// ============================================
// Translation Queries & Mutations
// ============================================

export function useTranslations(sentence: string | null) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && !!sentence && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueTranslations', apiMerchantId, cityId, sentence],
        queryFn: () => issueContentService.getTranslations(apiMerchantId!, cityId!, sentence!),
        enabled,
    });
}

export function useBulkUpsertTranslations() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: BulkUpsertTranslationsReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.bulkUpsertTranslations(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueTranslations'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategories'] });
            queryClient.invalidateQueries({ queryKey: ['issueCategoryDetail'] });
        },
    });
}

// ============================================
// Config Queries & Mutations
// ============================================

export function useIssueConfig() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { loginModule } = useAuth();

    const apiMerchantId = merchantShortId || merchantId;
    const enabled = !!apiMerchantId && !!cityId && loginModule === 'BAP';

    return useQuery({
        queryKey: ['issueConfig', apiMerchantId, cityId],
        queryFn: () => issueContentService.getIssueConfig(apiMerchantId!, cityId!),
        enabled,
    });
}

export function useUpdateIssueConfig() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const queryClient = useQueryClient();

    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: UpdateIssueConfigReq) => {
            if (!apiMerchantId || !cityId) {
                return Promise.reject(new Error('Missing required context'));
            }
            return issueContentService.updateIssueConfig(apiMerchantId, cityId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['issueConfig'] });
        },
    });
}
