import { bapApi, apiRequest, buildPath } from './api';

// ============================================
// Domain Types
// ============================================

export interface LogicDomain {
    tag: string;
    contents?: string;
}

// ============================================
// Logic Rollout Types
// ============================================

export interface RolloutItem {
    rolloutPercentage: number;
    version: number;
    versionDescription: string;
}

export interface LogicRolloutEntry {
    domain: LogicDomain;
    modifiedBy: string;
    rollout: RolloutItem[];
    timeBounds: string;
}

// ============================================
// Time Bounds Types
// ============================================

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeekdaySchedule {
    monday: [string, string][];
    tuesday: [string, string][];
    wednesday: [string, string][];
    thursday: [string, string][];
    friday: [string, string][];
    saturday: [string, string][];
    sunday: [string, string][];
}

export interface TimeBoundsContent {
    contents: WeekdaySchedule;
    tag: 'BoundedByWeekday';
}

export interface TimeBoundsEntry {
    name: string;
    timeBoundDomain: LogicDomain;
    timeBounds: TimeBoundsContent;
}

export interface CreateTimeBoundsRequest {
    name: string;
    timeBoundDomain: LogicDomain;
    timeBounds: TimeBoundsContent;
}

// ============================================
// Dynamic Logic Types
// ============================================

export interface DynamicLogicEntry {
    description: string;
    domain: LogicDomain;
    logics: string[];
    version: number;
}

export interface VerifyLogicRequest {
    description: string;
    domain: LogicDomain;
    inputData: string[];
    rules: string[];
    shouldUpdateRule: boolean;
    updatePassword?: string;
    verifyOutput: boolean;
}

export interface VerifyLogicResponse {
    domain: LogicDomain;
    errors: string[];
    isRuleUpdated: boolean;
    result: string;
    version: number;
}

export interface LogicVersionItem {
    description: string;
    version: number;
}

// ============================================
// Domain APIs
// ============================================

export async function getDomains(
    merchantId: string,
    cityId: string
): Promise<LogicDomain[]> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic/domains', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'GET',
        url: path,
    });
}

// ============================================
// Logic Rollout APIs
// ============================================

export async function getLogicRollout(
    merchantId: string,
    cityId: string,
    domain: LogicDomain,
    timeBound?: string
): Promise<LogicRolloutEntry[]> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic/getLogicRollout', merchantId, cityId);

    const params = new URLSearchParams();
    params.append('domain', JSON.stringify(domain));
    if (timeBound) params.append('timeBound', timeBound);

    return apiRequest(bapApi, {
        method: 'GET',
        url: `${path}?${params.toString()}`,
    });
}

export async function upsertLogicRollout(
    merchantId: string,
    cityId: string,
    data: LogicRolloutEntry[]
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic/upsertLogicRollout', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

// ============================================
// Time Bounds APIs
// ============================================

export async function getTimeBounds(
    merchantId: string,
    cityId: string,
    domain: LogicDomain
): Promise<TimeBoundsEntry[]> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/timeBounds', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'GET',
        url: `${path}?domain=${encodeURIComponent(JSON.stringify(domain))}`,
    });
}

export async function createTimeBounds(
    merchantId: string,
    cityId: string,
    data: CreateTimeBoundsRequest
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/timeBounds/create', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function deleteTimeBounds(
    merchantId: string,
    cityId: string,
    domain: LogicDomain,
    name: string
): Promise<void> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/timeBounds/delete', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'DELETE',
        url: `${path}?domain=${encodeURIComponent(JSON.stringify(domain))}&name=${encodeURIComponent(name)}`,
    });
}

// ============================================
// Dynamic Logic APIs
// ============================================

export async function getDynamicLogic(
    merchantId: string,
    cityId: string,
    domain: LogicDomain,
    version: number
): Promise<DynamicLogicEntry[]> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'GET',
        url: `${path}?domain=${encodeURIComponent(JSON.stringify(domain))}&version=${version}`,
    });
}

export async function verifyDynamicLogic(
    merchantId: string,
    cityId: string,
    data: VerifyLogicRequest
): Promise<VerifyLogicResponse> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic/verify', merchantId, cityId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function getLogicVersions(
    merchantId: string,
    cityId: string,
    domain: LogicDomain,
    limit: number = 10,
    offset: number = 0
): Promise<LogicVersionItem[]> {
    const path = buildPath('/{merchantId}/{city}/nammaTag/appDynamicLogic/versions', merchantId, cityId);

    const params = new URLSearchParams();
    params.append('domain', JSON.stringify(domain));
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return apiRequest(bapApi, {
        method: 'GET',
        url: `${path}?${params.toString()}`,
    });
}
