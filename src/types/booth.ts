

// ============================================
// Auth Types
// ============================================

export interface SendOtpRequest {
    mobileCountryCode: string;
    mobileNumber: string;
    otpChannel: 'SMS' | 'WHATSAPP';
}

export interface SendOtpResponse {
    attempts: number;
    authId: string;
    authType: string;
}

export interface VerifyOtpRequest {
    deviceToken: string;
    otp: string;
    whatsappNotificationEnroll: 'OPT_IN' | 'OPT_OUT';
}

export interface VerifyOtpResponse {
    person: {
        id: string; // customerId
        firstName: string;
        lastName?: string;
        mobileNumber?: string;
        maskedMobileNumber?: string;
        email?: string;
        businessProfileVerified?: boolean;
        hasTakenRide?: boolean;
        // Add other fields as needed from the large response
    };
}

// ============================================
// Pass Types
// ============================================

export interface PassBenefit {
    tag: string;
}

export interface PassOffer {
    offerDescription: string;
    offerIds: string[];
    offerTitle: string;
    offerSponsoredBy: string[];
}

export interface PassDetails {
    id: string;
    name: string;
    description: string;
    amount: number;
    originalAmount?: number;
    savings: number;
    maxDays: number; // API returns large number, might need handling
    maxTrips: number;
    autoApply: boolean;
    benefit: PassBenefit;
    benefitDescription: string;
    offer?: PassOffer;
    documentsRequired: string[];
    eligibility: boolean;
    vehicleServiceTierType: string[];
}

export interface PassType {
    id: string;
    name: string;
    title: string;
    description: string;
    catchline: string;
}

export interface PassCategory {
    id: string;
    name: string;
    description: string;
}

export interface AvailablePassCategory {
    passCategory: PassCategory;
    passTypes: PassType[];
    passes: PassDetails[];
}

export type AvailablePassesResponse = AvailablePassCategory[];

export interface PurchasedPass {
    id: string;
    passCode: string;
    passNumber: string;
    status: 'Active' | 'Pending' | 'Expired';
    startDate: string;
    expiryDate: string;
    tripsLeft: number;
    daysToExpire: number;
    purchaseDate: string;
    passEntity: {
        category: PassCategory;
        passDetails: PassDetails;
        passType: PassType;
    };
    futureRenewals?: any[];
    profilePicture?: string;
}

export type PurchasedPassesResponse = PurchasedPass[];

// ============================================
// Payment Types
// ============================================

export interface SelectPassRequest {
    profilePicture?: string;
    startDay: string; // YYYY-MM-DD
}

export interface PaymentPayload {
    action: string;
    amount: string;
    currency: string;
    customerId: string;
    customerPhone: string;
    description: string;
    merchantId: string;
    orderId: string;
    returnUrl: string;
    basket: string; // JSON string
    // ... other SDK fields
}

export interface PaymentOrder {
    id: string;
    order_id: string;
    payment_links: {
        deep_link?: string;
        iframe?: string;
        mobile?: string;
        web?: string;
    };
    sdk_payload?: {
        payload: PaymentPayload;
        requestId: string;
        service: string;
    };
    status: 'NEW' | 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface SelectPassResponse {
    paymentOrder: PaymentOrder;
    purchasedPassId: string;
}

export interface PaymentStatusResponse {
    orderId: string;
    amount: number;
    status: 'NEW' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CHARGED';
    paymentFulfillmentStatus:
    | 'FulfillmentPending'
    | 'FulfillmentFailed'
    | 'FulfillmentSucceeded'
    | 'FulfillmentRefundPending'
    | 'FulfillmentRefundInitiated'
    | 'FulfillmentRefundFailed'
    | 'FulfillmentRefunded';
    validTill?: string;
}
