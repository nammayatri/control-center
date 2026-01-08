import { getClickHouseClient, closeConnection } from '../db/clickhouse.js';

async function checkSchema() {
    const client = getClickHouseClient();
    try {
        console.log('Checking for cancellations table...');
        const result = await client.query({
            query: `DESCRIBE cancellations`,
            format: 'JSONEachRow'
        });
        const rows = await result.json();
        console.log('Schema found:', JSON.stringify(rows, null, 2));

        // Get a sample row to see distinct values logic check
        const sample = await client.query({
            query: `SELECT * FROM cancellations LIMIT 1`,
            format: 'JSONEachRow'
        });
        const sampleRows = await sample.json();
        console.log('Sample row:', JSON.stringify(sampleRows, null, 2));

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await closeConnection();
    }
}

checkSchema();
