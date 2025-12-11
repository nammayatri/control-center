import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { Permission, UserAccessMatrix } from '../types';

interface PermissionsContextType {
  permissions: Permission[];
  accessMatrix: UserAccessMatrix[];
  hasPermission: (resource: string, action: string) => boolean;
  hasAccess: (actionType: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: React.ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const { user, accessMatrix, hasAccess: authHasAccess } = useAuth();

  // Ensure accessMatrix is always an array
  const safeAccessMatrix = useMemo(() => {
    if (!accessMatrix) return [];
    if (Array.isArray(accessMatrix)) return accessMatrix;
    // If it's an object with array property, try to extract it
    if (typeof accessMatrix === 'object') {
      console.log('accessMatrix is object:', accessMatrix);
      return [];
    }
    return [];
  }, [accessMatrix]);

  // Build permissions from access matrix
  const permissions = useMemo((): Permission[] => {
    if (safeAccessMatrix.length === 0) return [];
    
    return safeAccessMatrix.map((access) => ({
      resource: access.userAccessType,
      action: access.userActionType,
    }));
  }, [safeAccessMatrix]);

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      // Super admin check
      if (user?.roles?.some((r) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN')) {
        return true;
      }
      
      // If no access matrix, allow all (for backwards compatibility)
      if (safeAccessMatrix.length === 0) {
        return true;
      }
      
      return permissions.some(
        (p) => 
          (p.resource === resource || p.resource === '*') &&
          (p.action === action || p.action === '*')
      );
    },
    [permissions, user, safeAccessMatrix]
  );

  // Check access based on userActionType from access matrix
  const hasAccess = useCallback(
    (actionType: string): boolean => {
      return authHasAccess(actionType);
    },
    [authHasAccess]
  );

  const hasAnyPermission = useCallback(
    (perms: Array<{ resource: string; action: string }>): boolean => {
      return perms.some((p) => hasPermission(p.resource, p.action));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (perms: Array<{ resource: string; action: string }>): boolean => {
      return perms.every((p) => hasPermission(p.resource, p.action));
    },
    [hasPermission]
  );

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        accessMatrix: safeAccessMatrix,
        hasPermission,
        hasAccess,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Component for conditionally rendering based on permissions
interface PermissionGuardProps {
  resource?: string;
  action?: string;
  actionType?: string; // For access matrix check
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  resource, 
  action, 
  actionType,
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, hasAccess } = usePermissions();
  
  // Check by actionType if provided
  if (actionType) {
    if (!hasAccess(actionType)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }
  
  // Check by resource/action
  if (resource && action && !hasPermission(resource, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Higher-order component for permission-protected routes
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: string,
  action: string,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(resource, action)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

// Hook for checking access by action type
export function useHasAccess(actionType: string): boolean {
  const { hasAccess } = usePermissions();
  return hasAccess(actionType);
}
