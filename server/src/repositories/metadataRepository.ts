import { getClickHouseClient } from '../db/clickhouse.js';

/**
 * Get City UUID from ClickHouse
 * @param cityName Name of the city (e.g., "Bangalore")
 * @param merchantShortId Merchant short ID (e.g., "m001")
 * @param type 'driver' (BPP) or 'customer' (BAP)
 */
export async function getCityUuid(
    cityName: string,
    merchantShortId: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<string | null> {
    const client = getClickHouseClient();
    const db = type === 'driver' ? 'atlas_driver_offer_bpp' : 'atlas_app';
    const table = 'merchant_operating_city';

    // Note: merchant_id in dashboard corresponds to merchant_short_id in ClickHouse table
    const query = `
        SELECT id
        FROM ${db}.${table}
        WHERE city = {cityName: String}
        AND merchant_short_id = {merchantShortId: String}
        LIMIT 1
    `;

    try {
        const resultSet = await client.query({
            query: query,
            format: 'JSONEachRow',
            query_params: {
                cityName,
                merchantShortId
            }
        });
        const rows = await resultSet.json<{ id: string }>();
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.error(`Error fetching city UUID for ${cityName} (merchant: ${merchantShortId}):`, error);
        return null; // Return null on failure so caller can handle (e.g. fallback)
    }
}

/**
 * Get all Cities and their UUIDs for a merchant
 */
export async function getMerchantCities(
    merchantShortId: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<{ city: string; id: string }[]> {
    const client = getClickHouseClient();
    const db = type === 'driver' ? 'atlas_driver_offer_bpp' : 'atlas_app';
    const table = 'merchant_operating_city';

    const query = `
        SELECT city, id
        FROM ${db}.${table}
        WHERE merchant_short_id = {merchantShortId: String}
        AND sign = 0
    `;

    try {
        const resultSet = await client.query({
            query: query,
            format: 'JSONEachRow',
            query_params: { merchantShortId }
        });
        const rows = await resultSet.json<{ city: string; id: string }>();
        return rows;
    } catch (error) {
        console.error(`Error fetching cities for merchant ${merchantShortId}:`, error);
        return [];
    }
}

/**
 * Get Merchant UUID from ClickHouse
 * @param merchantName Name of the merchant
 * @param type 'driver' (BPP) or 'customer' (BAP)
 */
export async function getMerchantUuid(
    merchantName: string,
    type: 'driver' | 'customer' = 'driver'
): Promise<string | null> {
    const client = getClickHouseClient();
    const db = type === 'driver' ? 'atlas_driver_offer_bpp' : 'atlas_app';
    const table = 'merchant';

    const query = `
        SELECT id
        FROM ${db}.${table}
        WHERE name = {merchantName: String}
        LIMIT 1
    `;

    try {
        const resultSet = await client.query({
            query: query,
            format: 'JSONEachRow',
            query_params: {
                merchantName
            }
        });
        const rows = await resultSet.json<{ id: string }>();
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.error(`Error fetching merchant UUID for ${merchantName}:`, error);
        return null;
    }
}
