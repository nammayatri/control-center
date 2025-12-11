import { bapApi, apiRequest, buildPath } from './api';

// ============================================
// NammaTags Types
// ============================================

export type TagStage = 'Search' | 'Confirm' | 'Ride' | 'PostRide';
export type TagChakra = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'LTD';
export type SourceTag = 'Application' | 'Driver';
export type ResultType = 'BOOL' | 'INT' | 'STRING' | 'DOUBLE';

export interface TagPossibleValues {
    contents: string[];
    tag: 'Tags';
}

export interface TagRule {
    contents: string; // JSON Logic as string
    tag: 'RuleEngine';
}

export interface ApplicationTagContents {
    description: string;
    tagCategory: string;
    tagName: string;
    tagPossibleValues: TagPossibleValues;
    tagRule: TagRule;
    tagStages: TagStage[];
    tagValidity: number;
}

export interface CreateTagRequest {
    contents: ApplicationTagContents;
    tag: 'ApplicationTag';
}

export interface UpdateTagRequest {
    actionEngine?: string;
    description?: string;
    resetTagValidity?: boolean;
    tagCategory?: string;
    tagChakra?: TagChakra;
    tagName: string;
    tagPossibleValues?: TagPossibleValues;
    tagRule?: TagRule;
    tagStages?: TagStage[];
    tagValidity?: number;
}

export interface VerifyTagRuleRequest {
    logic: string;
    logicData: string;
    source: {
        contents: TagStage;
        tag: SourceTag;
    };
    useDefaultData: boolean;
}

export interface VerifyTagRuleResponse {
    result: boolean;
    message?: string;
}

// ============================================
// NammaTag Query Types
// ============================================

export interface QueryResultDefault {
    contents: boolean | number | string;
    tag: ResultType;
}

export interface QueryResult {
    resultDefault: QueryResultDefault;
    resultName: string;
}

export interface CreateQueryRequest {
    chakra: TagChakra;
    queryName: string;
    queryResults: QueryResult[];
    queryText: string;
}

export interface UpdateQueryRequest {
    chakra: TagChakra;
    queryName: string;
    queryResults: QueryResult[];
    queryText: string;
}

export interface DeleteQueryRequest {
    chakra: TagChakra;
    queryName: string;
}

// ============================================
// Tag APIs
// ============================================

export async function createTag(
    merchantId: string,
    cityId: string,
    data: CreateTagRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/tag/create', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function updateTag(
    merchantId: string,
    cityId: string,
    data: UpdateTagRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/tag/update', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function deleteTag(
    merchantId: string,
    cityId: string,
    tagName: string
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/tag/delete', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'DELETE',
        url: `${path}?tagName=${encodeURIComponent(tagName)}`,
    });
}

export async function verifyTagRule(
    merchantId: string,
    cityId: string,
    data: VerifyTagRuleRequest
): Promise<VerifyTagRuleResponse> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/tag/verify', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

// ============================================
// Query APIs
// ============================================

export async function createQuery(
    merchantId: string,
    cityId: string,
    data: CreateQueryRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/query/create', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function updateQuery(
    merchantId: string,
    cityId: string,
    data: UpdateQueryRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/query/update', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function deleteQuery(
    merchantId: string,
    cityId: string,
    data: DeleteQueryRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/query/delete', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'DELETE',
        url: path,
        data,
    });
}
