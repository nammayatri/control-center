import { createClient, ClickHouseClient } from '@clickhouse/client';
import { env } from '../config/env.js';

let client: ClickHouseClient | null = null;

/**
 * Get or create the ClickHouse client instance
 */
export function getClickHouseClient(): ClickHouseClient {
    if (!client) {
        client = createClient({
            url: `http://${env.clickhouse.host}:${env.clickhouse.port}`,
            username: env.clickhouse.user,
            password: env.clickhouse.password,
            database: env.clickhouse.database,
        });
    }
    return client;
}

/**
 * Test the ClickHouse connection
 * @returns true if connection is successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
    const clickhouse = getClickHouseClient();
    try {
        const result = await clickhouse.query({
            query: 'SELECT 1',
            format: 'JSONEachRow',
        });
        await result.json();
        console.log('✅ ClickHouse connection successful');
        return true;
    } catch (error) {
        console.error('❌ ClickHouse connection failed:', error);
        throw error;
    }
}

/**
 * Close the ClickHouse connection
 */
export async function closeConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        console.log('ClickHouse connection closed');
    }
}
