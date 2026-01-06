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
    // Firebase
    firebase: {
        projects: Array<{
            id: string;
            name: string;
            serviceAccountKey: {
                type: string;
                project_id: string;
                private_key_id: string;
                private_key: string;
                client_email: string;
                client_id: string;
                auth_uri: string;
                token_uri: string;
                auth_provider_x509_cert_url: string;
                client_x509_cert_url: string;
            };
        }>;
    };
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
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw new TypeError(`Environment variable ${key} must be a number`);
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
    firebase: {
        projects: JSON.parse(getEnvVar('FIREBASE_PROJECTS', '[]')),
    },
};
