import { useQuery, useMutation } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import * as boothService from '../services/booth';
import type {
    SendOtpRequest,
    VerifyOtpRequest,
    SelectPassRequest,
} from '../types/booth';

// Using 'BAP' implied context for now as this is an agent feature likely on BAP side
// But following pattern, we should use context if needed.
// Services use bapApi directly currently.

export function useSendAuthOtp() {
    const { merchantShortId, cityId, merchantId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: (data: SendOtpRequest) => {
            if (!apiMerchantId) return Promise.reject(new Error('Missing merchant context'));
            return boothService.sendAuthOtp(apiMerchantId, cityId!, data);
        },
    });
}

export function useVerifyAuthOtp() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: ({ authId, data }: { authId: string; data: VerifyOtpRequest }) => {
            if (!apiMerchantId) return Promise.reject(new Error('Missing merchant context'));
            return boothService.verifyAuthOtp(apiMerchantId, cityId!, authId, data);
        },
    });
}

export function useAvailablePasses(customerId: string | null) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useQuery({
        queryKey: ['booth', 'passes', 'available', apiMerchantId, cityId, customerId],
        queryFn: () => boothService.getAvailablePasses(apiMerchantId!, cityId!, customerId!),
        enabled: !!apiMerchantId && !!cityId && !!customerId,
    });
}

export function usePurchasedPasses(customerId: string | null) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useQuery({
        queryKey: ['booth', 'passes', 'purchased', apiMerchantId, cityId, customerId],
        queryFn: () => boothService.getPurchasedPasses(apiMerchantId!, cityId!, customerId!),
        enabled: !!apiMerchantId && !!cityId && !!customerId,
    });
}

export function useSelectPass() {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useMutation({
        mutationFn: ({
            customerId,
            passId,
            data,
        }: {
            customerId: string;
            passId: string;
            data: SelectPassRequest;
        }) => {
            if (!apiMerchantId || !cityId) return Promise.reject(new Error('Missing context'));
            return boothService.selectPass(apiMerchantId, cityId, customerId, passId, data);
        },
    });
}

export function usePaymentStatus(customerId: string | null, orderId: string | null) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const apiMerchantId = merchantShortId || merchantId;

    return useQuery({
        queryKey: ['booth', 'payment', 'status', apiMerchantId, cityId, customerId, orderId],
        queryFn: () => boothService.checkPaymentStatus(apiMerchantId!, cityId!, customerId!, orderId!),
        enabled: !!apiMerchantId && !!cityId && !!customerId && !!orderId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            const fulfillment = query.state.data?.paymentFulfillmentStatus;

            // Stop polling if completed or failed
            if (status === 'COMPLETED' || status === 'FAILED' || status === 'CHARGED') {
                if (fulfillment === 'FulfillmentSucceeded' || fulfillment === 'FulfillmentFailed') {
                    return false;
                }
            }
            return 2000; // Poll every 2s
        },
    });
}
