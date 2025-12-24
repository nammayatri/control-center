import { getClickHouseClient, closeConnection } from './db/clickhouse.js';

async function checkSchema() {
    try {
        console.log('Checking schema for cosmos.master_conversion...');
        const client = getClickHouseClient();
        const result = await client.query({
            query: 'DESCRIBE cosmos.master_conversion',
            format: 'JSONEachRow',
        });
        const rows = await result.json();
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Failed to check schema:', error);
    } finally {
        await closeConnection();
    }
}

checkSchema();
