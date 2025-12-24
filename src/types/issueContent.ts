// Types for Issue Config Admin Dashboard
// Manage issue categories, messages, options, translations, and config

// ============================================
// Enums and Constants
// ============================================

export const LANGUAGES = [
    'ENGLISH',
    'HINDI',
    'KANNADA',
    'TAMIL',
    'TELUGU',
    'MALAYALAM',
    'BENGALI',
    'FRENCH',
    'ODIA',
    'DUTCH',
    'GERMAN',
    'FINNISH',
    'SWEDISH',
] as const;

export type Language = (typeof LANGUAGES)[number];

// Language code mapping for API query parameters
export const LANGUAGE_CODES: Record<Language, string> = {
    ENGLISH: 'en',
    HINDI: 'hi',
    KANNADA: 'kn',
    MALAYALAM: 'ml',
    TAMIL: 'ta',
    BENGALI: 'bn',
    FRENCH: 'fr',
    TELUGU: 'te',
    ODIA: 'or',
    DUTCH: 'nl',
    GERMAN: 'de',
    FINNISH: 'fi',
    SWEDISH: 'sv',
};

export const toLanguageCode = (language: Language): string => LANGUAGE_CODES[language];

export type MessageType = 'Intermediate' | 'Terminal' | 'FAQ';
export type CategoryType = 'Category' | 'FAQ';
export type MediaFileType = 'Audio' | 'Video' | 'Image' | 'AudioLink' | 'VideoLink' | 'ImageLink' | 'PorterVideoLink';

// File types for mandatory uploads
export type FileType = 'Audio' | 'Video' | 'Image' | 'AudioLink' | 'VideoLink' | 'ImageLink' | 'PortraitVideoLink' | 'PDF';

export const FILE_TYPES: FileType[] = ['Audio', 'Video', 'Image', 'AudioLink', 'VideoLink', 'ImageLink', 'PortraitVideoLink', 'PDF'];

// Mandatory upload configuration
export interface MandatoryUpload {
    fileType: FileType;
    limit: number;
}

// Vehicle variants
export type VehicleVariant =
    | 'SEDAN'
    | 'SUV'
    | 'HATCHBACK'
    | 'AUTO_RICKSHAW'
    | 'AUTO_PLUS'
    | 'TAXI'
    | 'TAXI_PLUS'
    | 'PREMIUM_SEDAN'
    | 'BLACK'
    | 'BLACK_XL'
    | 'BIKE'
    | 'AMBULANCE_TAXI'
    | 'AMBULANCE_TAXI_OXY'
    | 'AMBULANCE_AC'
    | 'AMBULANCE_AC_OXY'
    | 'AMBULANCE_VENTILATOR'
    | 'SUV_PLUS'
    | 'DELIVERY_BIKE'
    | 'DELIVERY_LIGHT_GOODS_VEHICLE'
    | 'DELIVERY_TRUCK_MINI'
    | 'DELIVERY_TRUCK_SMALL'
    | 'DELIVERY_TRUCK_MEDIUM'
    | 'DELIVERY_TRUCK_LARGE'
    | 'DELIVERY_TRUCK_ULTRA_LARGE'
    | 'BUS_NON_AC'
    | 'BUS_AC'
    | 'HERITAGE_CAB'
    | 'EV_AUTO_RICKSHAW'
    | 'BOAT'
    | 'VIP_ESCORT'
    | 'VIP_OFFICER'
    | 'AC_PRIORITY'
    | 'BIKE_PLUS'
    | 'E_RICKSHAW';

export const VEHICLE_VARIANTS: VehicleVariant[] = [
    'SEDAN', 'SUV', 'HATCHBACK', 'AUTO_RICKSHAW', 'AUTO_PLUS', 'TAXI', 'TAXI_PLUS',
    'PREMIUM_SEDAN', 'BLACK', 'BLACK_XL', 'BIKE', 'AMBULANCE_TAXI', 'AMBULANCE_TAXI_OXY',
    'AMBULANCE_AC', 'AMBULANCE_AC_OXY', 'AMBULANCE_VENTILATOR', 'SUV_PLUS', 'DELIVERY_BIKE',
    'DELIVERY_LIGHT_GOODS_VEHICLE', 'DELIVERY_TRUCK_MINI', 'DELIVERY_TRUCK_SMALL',
    'DELIVERY_TRUCK_MEDIUM', 'DELIVERY_TRUCK_LARGE', 'DELIVERY_TRUCK_ULTRA_LARGE',
    'BUS_NON_AC', 'BUS_AC', 'HERITAGE_CAB', 'EV_AUTO_RICKSHAW', 'BOAT', 'VIP_ESCORT',
    'VIP_OFFICER', 'AC_PRIORITY', 'BIKE_PLUS', 'E_RICKSHAW',
];

// Ride statuses
export type RideStatus = 'R_NEW' | 'R_INPROGRESS' | 'R_COMPLETED' | 'R_CANCELLED' | 'R_UPCOMING';

export const RIDE_STATUSES: RideStatus[] = ['R_NEW', 'R_INPROGRESS', 'R_COMPLETED', 'R_CANCELLED', 'R_UPCOMING'];

// ============================================
// Shared Types
// ============================================

export interface Translation {
    language: Language;
    translation: string;
}

export interface MediaFile {
    id: string;
    url: string;
    fileType: MediaFileType;
}

export interface DetailedTranslationRes {
    titleTranslation: Translation[];
    contentTranslation: Translation[];
    actionTranslation: Translation[];
}

// ============================================
// Category Types
// ============================================

export interface IssueCategoryRes {
    issueCategoryId: string;
    label: string;
    category: string;
    logoUrl: string;
    categoryType: CategoryType;
    isRideRequired: boolean;
    maxAllowedRideAge: number | null;
    allowedRideStatuses: string[] | null;
    priority?: number;
    isActive?: boolean;
}

export interface IssueCategoryDetailRes {
    category: IssueCategoryRes;
    translations: Translation[];
    messages: IssueMessageDetailRes[];
    options: IssueOptionDetailRes[];
}

export interface CreateIssueCategoryReq {
    category: string;
    logoUrl: string;
    priority: number;
    categoryType: CategoryType;
    isRideRequired: boolean;
    maxAllowedRideAge?: number;
    allowedRideStatuses?: RideStatus[];
    isActive?: boolean;
    translations: Translation[];
    messages: CreateIssueMessageReq[];
    label?: string;
    igmCategory?: string;
}

export interface UpdateIssueCategoryReq {
    categoryId: string;
    category?: string;
    logoUrl?: string;
    priority?: number;
    isRideRequired?: boolean;
    maxAllowedRideAge?: number;
    allowedRideStatuses?: string[];
    label?: string;
    isActive?: boolean;
    translations?: Translation[];
}

export interface ReorderIssueCategoryReq {
    categoryOrder: [string, number][];
}

// ============================================
// Message Types
// ============================================

export interface IssueMessageDetailRes {
    messageId: string;
    message: string;
    messageTitle: string | null;
    messageAction: string | null;
    label: string | null;
    priority: number;
    messageType: MessageType;
    isActive: boolean;
    mediaFiles: MediaFile[];
    translations: DetailedTranslationRes;
    childOptions: IssueOptionDetailRes[];
}

export interface IssueMessageListRes {
    messages: IssueMessageDetailRes[];
}

export interface UpsertIssueMessageReq {
    messageId?: string;
    categoryId?: string;
    optionId?: string;
    message: string;
    messageTitle?: string;
    messageAction?: string;
    label?: string;
    priority: number;
    messageType?: MessageType;
    referenceCategoryId?: string;
    referenceOptionId?: string;
    isActive?: boolean;
    messageTranslations: Translation[];
    titleTranslations: Translation[];
    actionTranslations: Translation[];
    options?: CreateIssueOptionReq[];
}

// Alias for clarity - CreateIssueMessageReq is the backend name
export type CreateIssueMessageReq = UpsertIssueMessageReq;

export interface ReorderIssueMessageReq {
    messageOrder: [string, number][];
}

// ============================================
// Option Types
// ============================================

export interface IssueOptionDetailRes {
    optionId: string;
    option: string;
    label: string | null;
    priority: number;
    isActive: boolean;
    translations: Translation[];
    childMessages: IssueMessageDetailRes[];
    restrictedVariants?: string[];
    restrictedRideStatuses?: string[];
    showOnlyWhenUserBlocked?: boolean;
}

export interface IssueOptionListRes {
    options: IssueOptionDetailRes[];
}

export interface CreateIssueOptionReq {
    categoryId?: string;
    option: string;
    label?: string;
    priority: number;
    issueMessageId?: string;
    isActive?: boolean;
    restrictedVariants?: VehicleVariant[];
    restrictedRideStatuses?: RideStatus[];
    showOnlyWhenUserBlocked?: boolean;
    translations: Translation[];
    messages: CreateIssueMessageReq[];
    igmSubCategory?: string;
    mandatoryUploads?: MandatoryUpload[];
}

export interface UpdateIssueOptionReq {
    optionId: string;
    categoryId?: string;
    option?: string;
    label?: string;
    priority?: number;
    issueMessageId?: string;
    restrictedVariants?: VehicleVariant[];
    restrictedRideStatuses?: RideStatus[];
    showOnlyWhenUserBlocked?: boolean;
    isActive?: boolean;
    translations?: Translation[];
}

export interface ReorderIssueOptionReq {
    optionOrder: [string, number][];
}

// ============================================
// Translation Types
// ============================================

export interface IssueTranslationItem {
    sentence: string;
    language: Language;
    translation: string;
}

export interface IssueTranslationListRes {
    translations: IssueTranslationItem[];
}

export interface BulkUpsertTranslationsReq {
    translations: IssueTranslationItem[];
}

// ============================================
// Config Types
// ============================================

export interface IssueConfigRes {
    issueConfigId: string;
    autoMarkIssueClosedDuration: number;
    onCreateIssueMsgs: string[];
    onIssueReopenMsgs: string[];
    onAutoMarkIssueClsMsgs: string[];
    onKaptMarkIssueResMsgs: string[];
    onIssueCloseMsgs: string[];
    reopenCount: number;
    merchantName: string | null;
    supportEmail: string | null;
}

export interface UpdateIssueConfigReq {
    autoMarkIssueClosedDuration?: number;
    onCreateIssueMsgs?: string[];
    onIssueReopenMsgs?: string[];
    onAutoMarkIssueClsMsgs?: string[];
    onKaptMarkIssueResMsgs?: string[];
    onIssueCloseMsgs?: string[];
    reopenCount?: number;
    merchantName?: string;
    supportEmail?: string;
}

// ============================================
// Flow Preview Types
// ============================================

export interface MessagePreview {
    messageId: string;
    message: string;
    messageTitle: string | null;
    messageAction: string | null;
    label: string | null;
    messageType: MessageType;
}

export interface OptionFlowNode {
    optionId: string;
    option: string;
    label: string | null;
    childNodes: MessageFlowNode[];
}

export interface MessageFlowNode {
    message: MessagePreview;
    options: OptionFlowNode[];
    nextMessage: MessageFlowNode | null;
}

export interface IssueCategoryFlowPreviewRes {
    category: IssueCategoryRes;
    flowNodes: MessageFlowNode[];
}

// ============================================
// API Query Params
// ============================================

export interface GetMessagesParams {
    categoryId?: string;
    optionId?: string;
    isActive?: boolean;
    language?: Language;
}

export interface GetOptionsParams {
    categoryId?: string;
    messageId?: string;
    isActive?: boolean;
    language?: Language;
}
