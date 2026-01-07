/**
 * Firebase Remote Config Service
 * 
 * Calls server API which proxies Firebase REST API calls.
 * Server handles authentication and keeps credentials secure.
 */

import { adminApi } from './api';

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
// API Functions
// ============================================

/**
 * Get list of configured Firebase projects
 */
export async function getFirebaseProjects(): Promise<FirebaseProject[]> {
  const response = await adminApi.get<FirebaseProject[]>('/firebase/projects');
  return response.data;
}

/**
 * Fetch Remote Config template for a project
 */
export async function getRemoteConfig(projectId: string): Promise<RemoteConfigResponse> {
  const response = await adminApi.get<RemoteConfigResponse>(`/firebase/config/${projectId}`);
  return response.data;
}

/**
 * Publish Remote Config template
 */
export async function publishRemoteConfig(
  projectId: string,
  template: RemoteConfigTemplate,
  etag: string
): Promise<RemoteConfigResponse> {
  const response = await adminApi.post<RemoteConfigResponse>(
    `/firebase/config/${projectId}`,
    { template, etag }
  );
  return response.data;
}

/**
 * Validate Remote Config template
 */
export async function validateRemoteConfig(
  projectId: string,
  template: RemoteConfigTemplate
): Promise<ValidationResponse> {
  const response = await adminApi.post<ValidationResponse>(
    `/firebase/config/${projectId}/validate`,
    { template }
  );
  return response.data;
}
