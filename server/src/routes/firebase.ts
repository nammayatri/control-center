/**
 * Firebase Remote Config Router
 * 
 * Server-side proxy for Firebase Remote Config operations.
 * Keeps service account credentials secure on the server.
 */

import express, { Request, Response } from 'express';
import { env } from '../config/env.js';

const router = express.Router();

// ============================================
// Types
// ============================================

interface RemoteConfigParameter {
    defaultValue?: { value: string };
    conditionalValues?: Record<string, { value: string }>;
    description?: string;
    valueType?: string;
}

// Internal type - not exported to avoid unused warning, but used for type checking
type RemoteConfigTemplate = {
    conditions?: Array<{ name: string; expression: string; tagColor?: string }>;
    parameters: Record<string, RemoteConfigParameter>;
    version?: {
        versionNumber?: string;
        updateTime?: string;
        updateUser?: { email?: string };
        updateOrigin?: string;
        updateType?: string;
    };
    parameterGroups?: Record<string, { description?: string; parameters?: Record<string, RemoteConfigParameter> }>;
};



// ============================================
// JWT Generation for Firebase
// ============================================

function base64UrlEncode(str: string): string {
    const base64 = Buffer.from(str).toString('base64');
    return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateJWT(serviceAccountKey: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const payload = {
        iss: serviceAccountKey.client_email,
        sub: serviceAccountKey.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: expiry,
        scope: 'https://www.googleapis.com/auth/firebase.remoteconfig',
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // Import private key
    const privateKey = serviceAccountKey.private_key;
    const crypto = await import('node:crypto');
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    sign.end();
    
    const signature = sign.sign(privateKey);
    // Convert signature buffer directly to base64url
    const signatureBase64 = signature.toString('base64');
    const signatureEncoded = signatureBase64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

    return `${signatureInput}.${signatureEncoded}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAccessToken(serviceAccountKey: any): Promise<string> {
    // Fix private key format: replace escaped newlines with actual newlines
    // This is necessary when the key is stored in environment variables
    const fixedServiceAccountKey = {
        ...serviceAccountKey,
        private_key: serviceAccountKey.private_key.replaceAll('\\n', '\n'),
    };
    
    const jwt = await generateJWT(fixedServiceAccountKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
}

// ============================================
// Helper Functions
// ============================================

function getProjectConfig(projectId: string) {
    const project = env.firebase.projects.find(p => p.id === projectId);
    if (!project) {
        throw new Error(`Firebase project not found: ${projectId}`);
    }
    return project;
}

// ============================================
// Routes
// ============================================

/**
 * GET /api/firebase/projects
 * List configured Firebase projects (without credentials)
 */
router.get('/projects', (_req: Request, res: Response) => {
    try {
        const projects = env.firebase.projects.map(p => ({
            id: p.id,
            name: p.name,
        }));
        res.json(projects);
    } catch (error) {
        console.error('Error listing Firebase projects:', error);
        res.status(500).json({
            error: 'Failed to list Firebase projects',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/firebase/config/:projectId
 * Fetch Remote Config template for a project
 */
router.get('/config/:projectId', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const project = getProjectConfig(projectId);
        const accessToken = await getAccessToken(project.serviceAccountKey);

        const response = await fetch(
            `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Firebase API error: ${response.statusText}`);
        }

        const etag = response.headers.get('etag') || '';
        const template = await response.json();

        res.json({ template, etag });
    } catch (error) {
        console.error('Error fetching Firebase config:', error);
        res.status(500).json({
            error: 'Failed to fetch Firebase config',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/firebase/config/:projectId
 * Publish Remote Config template
 */
router.post('/config/:projectId', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { template, etag } = req.body;

        if (!template || !etag) {
            res.status(400).json({ error: 'Missing template or etag' });
            return;
        }

        const project = getProjectConfig(projectId);
        const accessToken = await getAccessToken(project.serviceAccountKey);

        const response = await fetch(
            `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json; UTF-8',
                    'If-Match': etag,
                },
                body: JSON.stringify(template),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Firebase API error: ${response.statusText} - ${errorText}`);
        }

        const newEtag = response.headers.get('etag') || '';
        const updatedTemplate = await response.json();

        res.json({ template: updatedTemplate, etag: newEtag });
    } catch (error) {
        console.error('Error publishing Firebase config:', error);
        res.status(500).json({
            error: 'Failed to publish Firebase config',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/firebase/config/:projectId/validate
 * Validate Remote Config template locally
 * Note: Firebase doesn't provide a validation endpoint, so we do basic structure validation
 */
router.post('/config/:projectId/validate', async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { template } = req.body;

        if (!template) {
            res.status(400).json({ error: 'Missing template' });
            return;
        }

        console.log('[Firebase Validate] Project:', projectId);
        console.log('[Firebase Validate] Validating template structure...');

        // Basic validation checks
        const errors: string[] = [];

        // Check required fields
        if (!template.parameters || typeof template.parameters !== 'object') {
            errors.push('Missing or invalid "parameters" field');
        }

        // Validate conditions if present
        if (template.conditions) {
            if (Array.isArray(template.conditions)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                template.conditions.forEach((condition: any, index: number) => {
                    if (!condition.name || !condition.expression) {
                        errors.push(`Condition at index ${index} missing name or expression`);
                    }
                });
            } else {
                errors.push('"conditions" must be an array');
            }
        }

        // Validate parameters
        if (template.parameters) {
            for (const [key, param] of Object.entries(template.parameters)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = param as any;
                if (!p.defaultValue && !p.conditionalValues) {
                    errors.push(`Parameter "${key}" has no default or conditional values`);
                }
                
                // Check if values are valid JSON strings
                if (p.defaultValue?.value) {
                    try {
                        JSON.parse(p.defaultValue.value);
                    } catch {
                        // Not JSON, which is fine - can be plain string
                    }
                }
            }
        }

        // Validate parameter groups if present
        if (template.parameterGroups) {
            if (typeof template.parameterGroups !== 'object') {
                errors.push('"parameterGroups" must be an object');
            }
        }

        if (errors.length > 0) {
            console.log('[Firebase Validate] Validation failed:', errors);
            res.json({ 
                valid: false, 
                error: `Validation failed:\n${errors.join('\n')}` 
            });
            return;
        }

        console.log('[Firebase Validate] Validation passed');
        res.json({ 
            valid: true,
            message: 'Template structure is valid. Note: Full validation happens during publish.'
        });
    } catch (error) {
        console.error('Error validating Firebase config:', error);
        res.status(500).json({
            error: 'Failed to validate Firebase config',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
