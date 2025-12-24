import { getClickHouseClient, closeConnection } from './db/clickhouse.js';
import {
    getExecutiveMetrics,
    getComparisonMetrics,
    getTimeSeries,
    getFilterOptions
} from './repositories/masterConversionRepository.js';

async function verify() {
    try {
        console.log('Starting verification of expanded metrics...');
        getClickHouseClient();

        console.log('1. Testing getExecutiveMetrics...');
        const executive = await getExecutiveMetrics({});
        console.log('   Executive Totals:', JSON.stringify(executive, null, 2));

        console.log('2. Testing getComparisonMetrics...');
        const comparison = await getComparisonMetrics(
            '2024-01-01 00:00:00', '2024-01-02 00:00:00',
            '2024-01-02 00:00:00', '2024-01-03 00:00:00',
            {}
        );
        console.log('   Comparison Change:', JSON.stringify(comparison.change, null, 2));

        console.log('3. Testing getTimeSeries...');
        const timeseries = await getTimeSeries({}, { sortBy: 'date', sortOrder: 'asc' });
        console.log('   TimeSeries Points:', timeseries.length);
        if (timeseries.length > 0) console.log('   First Point:', timeseries[0]);

        console.log('4. Testing getFilterOptions...');
        const filters = await getFilterOptions();
        console.log('   Cities:', filters.cities.slice(0, 3));
        console.log('   Merchants:', filters.merchants.slice(0, 3));

        console.log('✅ Expanded Verification Successful');
    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    } finally {
        await closeConnection();
    }
}

verify();
