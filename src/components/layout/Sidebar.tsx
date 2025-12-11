import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePermissions } from '../../context/PermissionsContext';
import { useAuth } from '../../context/AuthContext';
import type { LoginModule } from '../../types';
import {
  LayoutDashboard,
  Users,
  Car,
  UserCircle,
  MessageSquare,
  Truck,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  resource?: string;
  action?: string;
  children?: NavItem[];
  // Which modules can access this item. If undefined, all modules can access.
  allowedModules?: LoginModule[];
  // If true, show as locked/disabled for users not logged in with the allowed module
  showLocked?: boolean;
}

// Navigation items with module restrictions
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Operations',
    path: '/ops',
    icon: <UserCircle className="h-5 w-5" />,
    children: [
      {
        label: 'Drivers',
        path: '/ops/drivers',
        icon: <Car className="h-4 w-4" />,
        resource: 'DRIVERS',
        action: 'LIST',
        allowedModules: ['BPP', 'FLEET'],
        showLocked: true,
      },
      {
        label: 'Customers',
        path: '/ops/customers',
        icon: <Users className="h-4 w-4" />,
        resource: 'DSL',
        action: 'RIDER_MANAGEMENT/CUSTOMER/GET_CUSTOMER_INFO',
        allowedModules: ['BAP'],
        showLocked: true,
      },
      {
        label: 'Rides',
        path: '/ops/rides',
        icon: <Car className="h-4 w-4" />,
        resource: 'RIDES',
        action: 'RIDE_LIST',
      },
      {
        label: 'Communications',
        path: '/ops/comms',
        icon: <MessageSquare className="h-4 w-4" />,
        resource: 'ops.comms',
        action: 'view',
      },
      {
        label: 'Issues',
        path: '/ops/issues',
        icon: <AlertCircle className="h-4 w-4" />,
        resource: 'DSL',
        action: 'RIDER_ISSUE_MANAGEMENT/ISSUE/GET_ISSUE_LIST',
      },
    ],
  },
  {
    label: 'Fleet',
    path: '/fleet',
    icon: <Truck className="h-5 w-5" />,
    allowedModules: ['BPP', 'FLEET'],
    showLocked: true,
    children: [
      {
        label: 'Overview',
        path: '/fleet/overview',
        icon: <LayoutDashboard className="h-4 w-4" />,
        resource: 'fleet',
        action: 'view',
        allowedModules: ['BPP', 'FLEET'],
      },
      {
        label: 'Vehicles',
        path: '/fleet/vehicles',
        icon: <Car className="h-4 w-4" />,
        resource: 'fleet.vehicles',
        action: 'view',
        allowedModules: ['BPP', 'FLEET'],
      },
    ],
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    children: [
      {
        label: 'Overview',
        path: '/analytics/overview',
        icon: <LayoutDashboard className="h-4 w-4" />,
        resource: '*',
        action: '*',
      },
      {
        label: 'Reports',
        path: '/analytics/reports',
        icon: <BarChart3 className="h-4 w-4" />,
        resource: '*',
        action: '*',
      },
    ],
  },
  {
    label: 'System Config',
    path: '/config',
    icon: <Settings className="h-5 w-5" />,
    children: [
      {
        label: 'NammaTags',
        path: '/config/namma-tags',
        icon: <Settings className="h-4 w-4" />,
        resource: 'DSL',
        action: 'RIDER_MANAGEMENT/NAMMA_TAG/POST_NAMMA_TAG_TAG_CREATE',
        allowedModules: ['BAP'],
        showLocked: true,
      },
      {
        label: 'Dynamic Logic',
        path: '/config/dynamic-logic',
        icon: <Settings className="h-4 w-4" />,
        resource: 'DSL',
        action: 'RIDER_MANAGEMENT/NAMMA_TAG/POST_NAMMA_TAG_APP_DYNAMIC_LOGIC_UPSERT_LOGIC_ROLLOUT',
        allowedModules: ['BAP'],
        showLocked: true,
      },
      {
        label: 'Fare Policy',
        path: '/config/fare-policy',
        icon: <Settings className="h-4 w-4" />,
        resource: 'DSL',
        action: 'DRIVER_OFFER_BPP_MANAGEMENT/MERCHANT/UPSERT_FARE_POLICY',
        allowedModules: ['BAP'],
        showLocked: true,
      },
      {
        label: 'Settings',
        path: '/config/settings',
        icon: <Settings className="h-4 w-4" />,
        resource: 'DSL',
        action: 'DRIVER_OFFER_BPP_MANAGEMENT/MERCHANT/UPSERT_FARE_POLICY',
        allowedModules: ['BAP'],
        showLocked: true,
      },
    ],
  },
  {
    label: 'Access Control',
    path: '/access',
    icon: <Shield className="h-5 w-5" />,
    children: [
      {
        label: 'Users',
        path: '/access/users',
        icon: <Users className="h-4 w-4" />,
        resource: 'admin.users',
        action: 'view',
      },
      {
        label: 'Roles',
        path: '/access/roles',
        icon: <Shield className="h-4 w-4" />,
        resource: 'admin.roles',
        action: 'view',
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { loginModule } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Auto-expand parent when child is active
  React.useEffect(() => {
    navItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.path))) {
        setExpandedItems((prev) =>
          prev.includes(item.path) ? prev : [...prev, item.path]
        );
      }
    });
  }, [location.pathname]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const canAccessItem = (item: NavItem): boolean => {
    if (!item.resource || !item.action) return true;
    return hasPermission(item.resource, item.action);
  };

  // Check if user has correct module for this item
  const hasModuleAccess = (item: NavItem): boolean => {
    if (!item.allowedModules) return true;
    if (!loginModule) return false;
    return item.allowedModules.includes(loginModule);
  };

  // Get the module name for display
  const getRequiredModuleName = (modules: LoginModule[]): string => {
    if (modules.includes('BAP')) return 'Customer (BAP)';
    if (modules.includes('BPP') || modules.includes('FLEET')) return 'Driver (BPP/Fleet)';
    return modules.join('/');
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (!canAccessItem(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const isActive = location.pathname === item.path ||
      (hasChildren && item.children?.some((c) => location.pathname.startsWith(c.path)));
    const moduleAccessGranted = hasModuleAccess(item);

    // If item requires different module and showLocked is true, show locked state
    if (!moduleAccessGranted && item.showLocked) {
      if (hasChildren) {
        return (
          <div key={item.path}>
            <div
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-medium",
                "text-sidebar-foreground/40 cursor-not-allowed"
              )}
              title={`Requires ${getRequiredModuleName(item.allowedModules!)} login`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && <Lock className="h-3 w-3" />}
            </div>
          </div>
        );
      }

      return (
        <div
          key={item.path}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
            "text-sidebar-foreground/40 cursor-not-allowed",
            isChild && "text-sm"
          )}
          title={`Requires ${getRequiredModuleName(item.allowedModules!)} login`}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              <Lock className="h-3 w-3" />
            </>
          )}
        </div>
      );
    }

    // If item requires different module and not showing locked, hide it
    if (!moduleAccessGranted) {
      return null;
    }

    if (hasChildren) {
      // Filter children based on module access
      const accessibleChildren = item.children?.filter(child =>
        hasModuleAccess(child) || child.showLocked
      );

      if (!accessibleChildren || accessibleChildren.length === 0) {
        return null;
      }

      return (
        <div key={item.path}>
          <button
            onClick={() => toggleExpand(item.path)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
              {item.children?.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            isChild && "text-sm"
          )
        }
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  // Get current module display name
  const getModuleLabel = (): string => {
    switch (loginModule) {
      case 'BAP': return 'Customer Dashboard';
      case 'BPP': return 'Driver Dashboard';
      case 'FLEET': return 'Fleet Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Moving</h1>
              <p className="text-xs text-sidebar-foreground/60">{getModuleLabel()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 text-center">
          {!collapsed && "v1.0.0"}
        </div>
      </div>
    </aside>
  );
}
