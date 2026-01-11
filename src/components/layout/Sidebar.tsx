import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePermissions } from '../../context/PermissionsContext';
import { useAuth } from '../../context/AuthContext';
import { navConfig, canAccessNavItem, hasAccessibleChildren, type NavItem } from '../../config/navigation';
import { ModuleSwitcher } from '../domain/ModuleSwitcher';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Icon mapping from string to React component
const iconMap: Record<string, (size: 'sm' | 'lg' | 'xl') => React.ReactNode> = {
  LayoutDashboard: (size) => <LayoutDashboard className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Users: (size) => <Users className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Car: (size) => <Car className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  UserCircle: (size) => <UserCircle className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  MessageSquare: (size) => <MessageSquare className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Truck: (size) => <Truck className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  BarChart3: (size) => <BarChart3 className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Ticket: (size) => <Ticket className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Settings: (size) => <Settings className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  Shield: (size) => <Shield className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
  AlertCircle: (size) => <AlertCircle className={size === 'xl' ? 'h-6 w-6' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
};

const getIcon = (iconName: string | undefined, isChild: boolean, isCollapsed: boolean): React.ReactNode => {
  const size = isChild ? 'sm' : (isCollapsed ? 'xl' : 'lg');
  const iconFn = iconMap[iconName || 'LayoutDashboard'];
  return iconFn ? iconFn(size) : <LayoutDashboard className={isChild ? 'h-4 w-4' : 'h-5 w-5'} />;
};

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = true }: Readonly<SidebarProps>) {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { loginModule } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [isHovered, setIsHovered] = React.useState(false);

  // Determine if we should show expanded state
  const showExpanded = !collapsed || isHovered;

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
      const content = (
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
            "text-sidebar-foreground/40 cursor-not-allowed",
            isChild && "text-sm",
            !showExpanded && "justify-center"
          )}
          title={showExpanded ? `Requires ${getRequiredModuleName(item.allowedModules!)} login` : undefined}
        >
          {getIcon(item.icon, isChild, !showExpanded)}
          {showExpanded && (
            <>
              <span className="flex-1">{item.label}</span>
              <Lock className="h-3 w-3" />
            </>
          )}
        </div>
      );

      // Show tooltip when collapsed
      if (!showExpanded) {
        return (
          <TooltipProvider key={item.path}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                {content}
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label} (Locked)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return <div key={item.path}>{content}</div>;
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

      const buttonContent = (
        <button
          onClick={() => toggleExpand(item.path)}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            !showExpanded && "justify-center"
          )}
        >
          <div className={cn("flex items-center", showExpanded && "gap-3")}>
            {getIcon(item.icon, false, !showExpanded)}
            {showExpanded && <span>{item.label}</span>}
          </div>
          {showExpanded && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )
          )}
        </button>
      );

      return (
        <div key={item.path}>
          {!showExpanded ? (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            buttonContent
          )}
          {showExpanded && isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
              {item.children?.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    const linkContent = (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            isChild && "text-sm",
            !showExpanded && "justify-center"
          )
        }
      >
        {getIcon(item.icon, isChild, !showExpanded)}
        {showExpanded && <span>{item.label}</span>}
      </NavLink>
    );

    if (!showExpanded) {
      return (
        <TooltipProvider key={item.path}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.path}>{linkContent}</div>;
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed && !isHovered && "w-[60px]",
        collapsed && isHovered && "w-64 fixed left-0 top-0 h-screen z-50 shadow-2xl",
        !collapsed && "w-64"
      )}
    >
      {/* Logo & Module Switcher */}
      <div className="h-16 px-3 border-b border-sidebar-border flex items-center">
        {!showExpanded ? (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <ModuleSwitcher />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navConfig.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 text-center">
          {showExpanded && "v1.0.0"}
        </div>
      </div>
    </aside>
  );
}
