/**
 * Firebase Remote Config Hooks
 * 
 * React Query hooks for Firebase Remote Config operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as firebaseService from '../services/firebase';
import type { RemoteConfigTemplate } from '../services/firebase';

// ============================================
// Query Keys
// ============================================

export const firebaseKeys = {
  all: ['firebase'] as const,
  projects: () => [...firebaseKeys.all, 'projects'] as const,
  config: (projectId: string) => [...firebaseKeys.all, 'config', projectId] as const,
};

// ============================================
// Project Hooks
// ============================================

/**
 * Get available Firebase projects.
 */
export function useFirebaseProjects() {
  return useQuery({
    queryKey: firebaseKeys.projects(),
    queryFn: () => firebaseService.getFirebaseProjects(),
    staleTime: Infinity, // Projects config doesn't change at runtime
  });
}

// ============================================
// Remote Config Hooks
// ============================================

/**
 * Fetch Remote Config for a project.
 */
export function useFirebaseConfig(projectId: string | null) {
  return useQuery({
    queryKey: firebaseKeys.config(projectId || ''),
    queryFn: () => firebaseService.getRemoteConfig(projectId!),
    enabled: !!projectId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

/**
 * Publish Remote Config mutation.
 */
export function usePublishFirebaseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      template,
      etag,
    }: {
      projectId: string;
      template: RemoteConfigTemplate;
      etag: string;
    }) => {
      return firebaseService.publishRemoteConfig(projectId, template, etag);
    },
    onSuccess: (_, variables) => {
      // Invalidate the config for this project
      queryClient.invalidateQueries({
        queryKey: firebaseKeys.config(variables.projectId),
      });
    },
  });
}

/**
 * Validate Remote Config mutation.
 */
export function useValidateFirebaseConfig() {
  return useMutation({
    mutationFn: async ({
      projectId,
      template,
    }: {
      projectId: string;
      template: RemoteConfigTemplate;
    }) => {
      return firebaseService.validateRemoteConfig(projectId, template);
    },
  });
}
