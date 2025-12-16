import 'dotenv/config';

export interface EnvConfig {
    // ClickHouse
    clickhouse: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    // Server
    port: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] ?? defaultValue;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Missing required environment variable: ${key}`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a number`);
    }
    return parsed;
}

export const env: EnvConfig = {
    clickhouse: {
        host: getEnvVar('CLICKHOUSE_HOST', 'localhost'),
        port: getEnvVarAsNumber('CLICKHOUSE_PORT', 8123),
        user: getEnvVar('CLICKHOUSE_USER', 'default'),
        password: getEnvVar('CLICKHOUSE_PASSWORD', ''),
        database: getEnvVar('CLICKHOUSE_DATABASE', 'default'),
    },
    port: getEnvVarAsNumber('PORT', 3001),
};
