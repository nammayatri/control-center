import { getClickHouseClient, closeConnection } from '../db/clickhouse.js';

async function testJsonAggregation() {
    const client = getClickHouseClient();
    try {
        console.log('Testing JSON "reason_code" aggregation via JSONExtractKeysAndValues...');

        // Strategy: Use JSONExtractKeysAndValues to get Array(Tuple(String, Int64))
        // Then explode array with arrayJoin
        const query = `
        SELECT
            tupleElement(pair, 1) as dimension,
            sum(tupleElement(pair, 2)) as count
        FROM (
             SELECT
                arrayJoin(JSONExtractKeysAndValues(assumeNotNull(reason_code), 'Int64')) as pair
            FROM cancellations
            WHERE reason_code IS NOT NULL AND reason_code != ''
            LIMIT 100
        )
        GROUP BY dimension
        ORDER BY count DESC
        `;

        const result = await client.query({
            query: query,
            format: 'JSONEachRow'
        });
        const rows = await result.json();
        console.log('Aggregation Result:', JSON.stringify(rows, null, 2));

    } catch (error) {
        console.error('Error testing query:', error);
    } finally {
        await closeConnection();
    }
}

testJsonAggregation();
