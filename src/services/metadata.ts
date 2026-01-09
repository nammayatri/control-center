
const METRICS_API_URL = 'http://localhost:3000/api';


interface UuidResponse {
    success: boolean;
    uuid?: string;
    cities?: { city: string; id: string }[];
    error?: string;
}

/**
 * Fetch City UUID from backend (Clickhouse)
 * @param city City Name
 * @param merchantId Merchant Short ID (e.g., m001)
 * @param type 'driver' (default) or 'customer'
 */
export async function getCityUuid(
    city: string,
    merchantId: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<string | null> {
    try {
        const url = `${METRICS_API_URL}/metadata/city-uuid?city=${encodeURIComponent(city)}&merchantId=${encodeURIComponent(merchantId)}&type=${type}`;

        // Using fetch directly as this hits the node server, not the BAP/BPP services
        const response = await fetch(url);
        const data: UuidResponse = await response.json();

        if (data.success && data.uuid) {
            return data.uuid;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch UUID for city: ${city}`, error);
        return null; // Fail gracefully
    }
}

/**
 * Fetch all City UUIDs for a merchant from backend (Clickhouse)
 */
export async function getMerchantCities(
    merchantId: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<{ city: string; id: string }[]> {
    try {
        const url = `${METRICS_API_URL}/metadata/merchant-cities?merchantId=${encodeURIComponent(merchantId)}&type=${type}`;

        const response = await fetch(url);
        const data: UuidResponse = await response.json();

        if (data.success && data.cities) {
            return data.cities;
        }
        return [];
    } catch (error) {
        console.error(`Failed to fetch cities for merchant: ${merchantId}`, error);
        return [];
    }
}

/**
 * Fetch Merchant UUID from backend (Clickhouse)
 * @param merchant Merchant Name
 * @param type 'driver' (default) or 'customer'
 */
export async function getMerchantUuid(
    merchant: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<string | null> {
    try {
        const url = `${METRICS_API_URL}/metadata/merchant-uuid?merchant=${encodeURIComponent(merchant)}&type=${type}`;

        const response = await fetch(url);
        const data: UuidResponse = await response.json();

        if (data.success && data.uuid) {
            return data.uuid;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch UUID for merchant: ${merchant}`, error);
        return null;
    }
}
