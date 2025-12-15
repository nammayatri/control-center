import { bapApi, apiRequest, buildPath } from './api';
import type {
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    AvailablePassesResponse,
    SelectPassRequest,
    SelectPassResponse,
    PaymentStatusResponse,
    PurchasedPassesResponse,
} from '../types/booth';

// ============================================
// Auth APIs
// ============================================

export async function sendAuthOtp(
    merchantId: string,
    cityId: string,
    data: SendOtpRequest
): Promise<SendOtpResponse> {
    // Note: The curl command provided uses /bap/:merchantId/rideBooking/registration/auth
    // It doesn't seem to have cityId in the path.
    // Our bapApi base is likely /api/bap or similar.
    // We will assume standard structure but careful with path.
    return apiRequest(bapApi, {
        method: 'POST',
        url: `/${merchantId}/${cityId}/rideBooking/registration/auth`,
        data,
    });
}

export async function verifyAuthOtp(
    merchantId: string,
    cityId: string,
    authId: string,
    data: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
    // curl: /bap/sd/rideBooking/registration/:merchantId/verify
    // Path seems slightly different: /sd/rideBooking...
    return apiRequest(bapApi, {
        method: 'POST',
        url: `/${merchantId}/${cityId}/rideBooking/registration/${authId}/verify`,
        data,
    });
}

// ============================================
// Pass APIs
// ============================================

export async function getAvailablePasses(
    merchantId: string,
    cityId: string,
    customerId: string
): Promise<AvailablePassesResponse> {
    // curl: /bap/:merchantId/:city/pass/customer/:customerId/availablePasses
    const path = buildPath('/{merchantId}/{city}/pass/customer/{customerId}/availablePasses', merchantId, cityId);
    return apiRequest(bapApi, {
        method: 'GET',
        url: path.replace('{customerId}', customerId),
    });
}

export async function getPurchasedPasses(
    merchantId: string,
    cityId: string,
    customerId: string
): Promise<PurchasedPassesResponse> {
    // curl: /bap/:merchantId/:city/pass/customer/:customerId/purchasedPasses?status=Active
    const path = buildPath('/{merchantId}/{city}/pass/customer/{customerId}/purchasedPasses', merchantId, cityId);
    return apiRequest(bapApi, {
        method: 'GET',
        url: path.replace('{customerId}', customerId),
        params: { status: '"Active"' },
    });
}

export async function selectPass(
    merchantId: string,
    cityId: string,
    customerId: string,
    passId: string,
    data: SelectPassRequest
): Promise<SelectPassResponse> {
    // curl: /bap/:merchantId/:city/pass/customer/:customerId/pass/:passId/select
    let path = buildPath('/{merchantId}/{city}/pass/customer/{customerId}/pass/{passId}/select', merchantId, cityId);
    path = path.replace('{customerId}', customerId).replace('{passId}', passId);

    return apiRequest(bapApi, {
        method: 'POST',
        url: path,
        data,
    });
}

export async function checkPaymentStatus(
    merchantId: string,
    cityId: string,
    customerId: string,
    orderId: string
): Promise<PaymentStatusResponse> {
    // curl: /bap/:merchantId/:city/pass/customer/:customerId/payment/:orderId/status
    let path = buildPath('/{merchantId}/{city}/pass/customer/{customerId}/payment/{orderId}/status', merchantId, cityId);
    path = path.replace('{customerId}', customerId).replace('{orderId}', orderId);

    return apiRequest(bapApi, {
        method: 'GET',
        url: path,
    });
}

export async function changePassStartDate(
    merchantId: string,
    cityId: string,
    customerId: string,
    passNumber: string,
    startDay: string
): Promise<void> {
    // curl: /bap/:merchantId/:city/pass/customer/:customerId/activateToday/{passNumber}?startDay=YYYY-MM-DD
    let path = buildPath('/{merchantId}/{city}/pass/customer/{customerId}/activateToday/{passNumber}', merchantId, cityId);
    path = path.replace('{customerId}', customerId).replace('{passNumber}', passNumber);

    return apiRequest(bapApi, {
        method: 'POST',
        url: `${path}?startDay=${startDay}`,
    });
}
