/**
 * Firebase Remote Config Service
 * 
 * Calls server API which proxies Firebase REST API calls.
 * Server handles authentication and keeps credentials secure.
 */

// ============================================
// Types
// ============================================

export interface FirebaseProject {
  id: string;
  name: string;
}

export interface RemoteConfigParameter {
  defaultValue?: { value: string };
  conditionalValues?: Record<string, { value: string }>;
  description?: string;
  valueType?: string;
}

export interface RemoteConfigTemplate {
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
}

export interface RemoteConfigResponse {
  template: RemoteConfigTemplate;
  etag: string;
}

export interface ValidationResponse {
  valid: boolean;
  error?: string;
}

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ============================================
// API Functions
// ============================================

/**
 * Get list of configured Firebase projects
 */
export async function getFirebaseProjects(): Promise<FirebaseProject[]> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/projects`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase projects: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch Remote Config template for a project
 */
export async function getRemoteConfig(projectId: string): Promise<RemoteConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/config/${projectId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Remote Config: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Publish Remote Config template
 */
export async function publishRemoteConfig(
  projectId: string,
  template: RemoteConfigTemplate,
  etag: string
): Promise<RemoteConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/config/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template, etag }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to publish Remote Config: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Validate Remote Config template
 */
export async function validateRemoteConfig(
  projectId: string,
  template: RemoteConfigTemplate
): Promise<ValidationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/config/${projectId}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to validate Remote Config: ${response.statusText}`);
  }
  
  return response.json();
}
