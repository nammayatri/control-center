import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePermissions } from '../../context/PermissionsContext';
import { useAuth } from '../../context/AuthContext';
import { navConfig, canAccessNavItem, hasAccessibleChildren, type NavItem } from '../../config/navigation';
import type { LoginModule } from '../../types';
import {
  LayoutDashboard,
  Users,
  Car,
  UserCircle,
  MessageSquare,
  Truck,
  BarChart3,
  Ticket,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  Lock,
  AlertCircle,
} from 'lucide-react';

// Icon mapping from string to React component
const iconMap: Record<string, (size: 'sm' | 'lg') => React.ReactNode> = {
  LayoutDashboard: (size) => <LayoutDashboard className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Users: (size) => <Users className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Car: (size) => <Car className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  UserCircle: (size) => <UserCircle className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  MessageSquare: (size) => <MessageSquare className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Truck: (size) => <Truck className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  BarChart3: (size) => <BarChart3 className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Ticket: (size) => <Ticket className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Settings: (size) => <Settings className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Shield: (size) => <Shield className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  AlertCircle: (size) => <AlertCircle className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
};

const getIcon = (iconName: string | undefined, isChild: boolean): React.ReactNode => {
  const size = isChild ? 'sm' : 'lg';
  const iconFn = iconMap[iconName || 'LayoutDashboard'];
  return iconFn ? iconFn(size) : <LayoutDashboard className={isChild ? 'h-4 w-4' : 'h-5 w-5'} />;
};

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
    navConfig.forEach((item) => {
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
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const isActive = location.pathname === item.path ||
      (hasChildren && item.children?.some((c) => location.pathname.startsWith(c.path)));
    const moduleAccessGranted = hasModuleAccess(item);
    const canAccess = canAccessNavItem(item, loginModule, hasPermission);

    // If item requires different module and showLocked is true, show locked state
    if (!moduleAccessGranted && item.showLocked) {
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
          {getIcon(item.icon, isChild)}
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              <Lock className="h-3 w-3" />
            </>
          )}
        </div>
      );
    }

    // If item requires different module and not showing locked, or no permission, hide it
    if (!canAccess) {
      return null;
    }

    if (hasChildren) {
      // Check if user can access any children
      const hasAccessible = hasAccessibleChildren(item, loginModule, hasPermission);

      // If no children are actually accessible, hide the parent tab entirely
      if (!hasAccessible) {
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
              {getIcon(item.icon, false)}
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
        {getIcon(item.icon, isChild)}
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
        {navConfig.map((item) => renderNavItem(item))}
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
