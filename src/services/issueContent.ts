// Issue Config API Service
// Manage issue categories, messages, options, translations, and config

import { bapApi } from './api';
import {
    toLanguageCode,
    type IssueCategoryRes,
    type IssueCategoryDetailRes,
    type IssueCategoryFlowPreviewRes,
    type CreateIssueCategoryReq,
    type UpdateIssueCategoryReq,
    type ReorderIssueCategoryReq,
    type IssueMessageDetailRes,
    type IssueMessageListRes,
    type UpsertIssueMessageReq,
    type ReorderIssueMessageReq,
    type IssueOptionDetailRes,
    type IssueOptionListRes,
    type CreateIssueOptionReq,
    type UpdateIssueOptionReq,
    type ReorderIssueOptionReq,
    type IssueTranslationListRes,
    type BulkUpsertTranslationsReq,
    type IssueConfigRes,
    type UpdateIssueConfigReq,
    type GetMessagesParams,
    type GetOptionsParams,
    type Language,
} from '../types/issueContent';

// ============================================
// Category APIs
// ============================================

export const getCategories = async (
    merchantId: string,
    cityId: string
): Promise<IssueCategoryRes[]> => {
    const response = await bapApi.get<{ categories: IssueCategoryRes[] }>(
        `/${merchantId}/${cityId}/issueV2/category`
    );
    return response.data.categories ?? [];
};

export const getCategoryDetail = async (
    merchantId: string,
    cityId: string,
    categoryId: string,
    language: Language = 'ENGLISH'
): Promise<IssueCategoryDetailRes> => {
    const response = await bapApi.get<IssueCategoryDetailRes>(
        `/${merchantId}/${cityId}/issueV2/category/${categoryId}/detail`,
        { params: { language: toLanguageCode(language) } }
    );
    return response.data;
};

export const getCategoryPreview = async (
    merchantId: string,
    cityId: string,
    categoryId: string,
    language: Language = 'ENGLISH'
): Promise<IssueCategoryFlowPreviewRes> => {
    const response = await bapApi.get<IssueCategoryFlowPreviewRes>(
        `/${merchantId}/${cityId}/issueV2/category/${categoryId}/preview`,
        { params: { language: toLanguageCode(language) } }
    );
    return response.data;
};

export const createCategory = async (
    merchantId: string,
    cityId: string,
    data: CreateIssueCategoryReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/category/create`,
        data
    );
};

export const updateCategory = async (
    merchantId: string,
    cityId: string,
    data: UpdateIssueCategoryReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/category/update`,
        data
    );
};

export const deleteCategory = async (
    merchantId: string,
    cityId: string,
    categoryId: string
): Promise<void> => {
    await bapApi.delete(
        `/${merchantId}/${cityId}/issueV2/category/${categoryId}/delete`
    );
};

export const reorderCategories = async (
    merchantId: string,
    cityId: string,
    data: ReorderIssueCategoryReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/category/reorder`,
        data
    );
};

// ============================================
// Message APIs
// ============================================

export const getMessages = async (
    merchantId: string,
    cityId: string,
    params: GetMessagesParams
): Promise<IssueMessageListRes> => {
    const response = await bapApi.get<IssueMessageListRes>(
        `/${merchantId}/${cityId}/issueV2/message/list`,
        { params }
    );
    return response.data;
};

export const getMessageDetail = async (
    merchantId: string,
    cityId: string,
    messageId: string,
    language: Language = 'ENGLISH'
): Promise<IssueMessageDetailRes> => {
    const response = await bapApi.get<IssueMessageDetailRes>(
        `/${merchantId}/${cityId}/issueV2/message/${messageId}/detail`,
        { params: { language: toLanguageCode(language) } }
    );
    return response.data;
};

export const upsertMessage = async (
    merchantId: string,
    cityId: string,
    data: UpsertIssueMessageReq,
    mediaFiles?: File[]
): Promise<void> => {
    // Always use multipart/form-data as required by the backend
    // Each field is sent separately (not as a single JSON "data" field)
    const formData = new FormData();

    // Append each field individually
    if (data.messageId) formData.append('messageId', data.messageId);
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    if (data.optionId) formData.append('optionId', data.optionId);
    formData.append('message', data.message);
    if (data.messageTitle) formData.append('messageTitle', data.messageTitle);
    if (data.messageAction) formData.append('messageAction', data.messageAction);
    if (data.label) formData.append('label', data.label);
    formData.append('priority', String(data.priority));
    if (data.messageType) formData.append('messageType', data.messageType);
    if (data.referenceCategoryId) formData.append('referenceCategoryId', data.referenceCategoryId);
    if (data.referenceOptionId) formData.append('referenceOptionId', data.referenceOptionId);
    if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));

    // Arrays need to be JSON stringified
    formData.append('messageTranslations', JSON.stringify(data.messageTranslations));
    formData.append('titleTranslations', JSON.stringify(data.titleTranslations));
    formData.append('actionTranslations', JSON.stringify(data.actionTranslations));

    if (data.options) {
        formData.append('options', JSON.stringify(data.options));
    }

    if (mediaFiles && mediaFiles.length > 0) {
        mediaFiles.forEach((file, index) => {
            formData.append(`mediaFiles[${index}]`, file);
        });
    }

    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/message/upsert`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
};

export const deleteMessage = async (
    merchantId: string,
    cityId: string,
    messageId: string
): Promise<void> => {
    await bapApi.delete(
        `/${merchantId}/${cityId}/issueV2/message/${messageId}/delete`
    );
};

export const reorderMessages = async (
    merchantId: string,
    cityId: string,
    data: ReorderIssueMessageReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/message/reorder`,
        data
    );
};

// ============================================
// Option APIs
// ============================================

export const getOptions = async (
    merchantId: string,
    cityId: string,
    params: GetOptionsParams
): Promise<IssueOptionListRes> => {
    const response = await bapApi.get<IssueOptionListRes>(
        `/${merchantId}/${cityId}/issueV2/option/list`,
        { params }
    );
    return response.data;
};

export const getOptionDetail = async (
    merchantId: string,
    cityId: string,
    optionId: string,
    language: Language = 'ENGLISH'
): Promise<IssueOptionDetailRes> => {
    const response = await bapApi.get<IssueOptionDetailRes>(
        `/${merchantId}/${cityId}/issueV2/option/${optionId}/detail`,
        { params: { language: toLanguageCode(language) } }
    );
    return response.data;
};

export const createOption = async (
    merchantId: string,
    cityId: string,
    data: CreateIssueOptionReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/option/create`,
        data,
        { params: { issueCategoryId: data.categoryId, issueMessageId: data.issueMessageId } }
    );
};

export const updateOption = async (
    merchantId: string,
    cityId: string,
    data: UpdateIssueOptionReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/option/update`,
        data,
        { params: { issueOptionid: data.optionId } }
    );
};

export const deleteOption = async (
    merchantId: string,
    cityId: string,
    optionId: string
): Promise<void> => {
    await bapApi.delete(
        `/${merchantId}/${cityId}/issueV2/option/${optionId}/delete`
    );
};

export const reorderOptions = async (
    merchantId: string,
    cityId: string,
    data: ReorderIssueOptionReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/option/reorder`,
        data
    );
};

// ============================================
// Translation APIs
// ============================================

export const getTranslations = async (
    merchantId: string,
    cityId: string,
    sentence: string
): Promise<IssueTranslationListRes> => {
    const response = await bapApi.get<IssueTranslationListRes>(
        `/${merchantId}/${cityId}/issueV2/translation/list`,
        { params: { sentence } }
    );
    return response.data;
};

export const bulkUpsertTranslations = async (
    merchantId: string,
    cityId: string,
    data: BulkUpsertTranslationsReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/translation/bulk`,
        data
    );
};

// ============================================
// Config APIs
// ============================================

export const getIssueConfig = async (
    merchantId: string,
    cityId: string
): Promise<IssueConfigRes> => {
    const response = await bapApi.get<IssueConfigRes>(
        `/${merchantId}/${cityId}/issueV2/config`
    );
    return response.data;
};

export const updateIssueConfig = async (
    merchantId: string,
    cityId: string,
    data: UpdateIssueConfigReq
): Promise<void> => {
    await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/config/update`,
        data
    );
};
