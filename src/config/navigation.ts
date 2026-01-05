import type { LoginModule } from '../types';

export interface NavItem {
    label: string;
    path: string;
    icon?: string; // Icon name for reference (actual icons rendered in components)
    resource?: string;
    action?: string;
    children?: NavItem[];
    // Which modules can access this item. If undefined, all modules can access.
    allowedModules?: LoginModule[];
    // If true, show as locked/disabled for users not logged in with the allowed module
    showLocked?: boolean;
    // Description for dashboard quick links
    description?: string;
}

// Navigation items configuration - shared between Sidebar and Dashboard
export const navConfig: NavItem[] = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        description: 'Overview and quick access',
    },
    {
        label: 'Operations',
        path: '/ops',
        icon: 'UserCircle',
        children: [
            {
                label: 'Drivers',
                path: '/ops/drivers',
                icon: 'Car',
                resource: 'DRIVERS',
                action: 'LIST',
                allowedModules: ['BPP', 'FLEET'],
                showLocked: true,
                description: 'Manage drivers, view profiles, and handle issues',
            },
            {
                label: 'Customers',
                path: '/ops/customers',
                icon: 'Users',
                resource: 'DSL',
                action: 'RIDER_MANAGEMENT/CUSTOMER/GET_CUSTOMER_INFO',
                allowedModules: ['BAP'],
                showLocked: true,
                description: 'View customers, bookings, and support tickets',
            },
            {
                label: 'Rides',
                path: '/ops/rides',
                icon: 'Car',
                resource: 'RIDES',
                action: 'RIDE_LIST',
            },
            {
                label: 'Communications',
                path: '/ops/comms',
                icon: 'MessageSquare',
                resource: 'ops.comms',
                action: 'view',
            },
            {
                label: 'Issues',
                path: '/ops/issues',
                icon: 'AlertCircle',
                resource: 'DSL',
                action: 'RIDER_ISSUE_MANAGEMENT/ISSUE/GET_ISSUE_LIST',
            },
        ],
    },
    {
        label: 'Fleet',
        path: '/fleet',
        icon: 'Truck',
        allowedModules: ['BPP', 'FLEET'],
        showLocked: true,
        description: 'Monitor vehicles and fleet performance',
        children: [
            {
                label: 'Overview',
                path: '/fleet/overview',
                icon: 'LayoutDashboard',
                resource: 'fleet',
                action: 'view',
                allowedModules: ['BPP', 'FLEET'],
            },
            {
                label: 'Vehicles',
                path: '/fleet/vehicles',
                icon: 'Car',
                resource: 'fleet.vehicles',
                action: 'view',
                allowedModules: ['BPP', 'FLEET'],
            },
        ],
    },
    {
        label: 'Analytics',
        path: '/analytics',
        icon: 'BarChart3',
        description: 'View reports and performance metrics',
        children: [
            {
                label: 'Overview',
                path: '/analytics/overview',
                icon: 'LayoutDashboard',
                resource: '*',
                action: '*',
            },
            {
                label: 'Executive Metrics',
                path: '/analytics/executive',
                icon: 'BarChart3',
                resource: '*',
                action: '*',
                description: 'Business KPIs, conversion funnel, and trends',
            },
            {
                label: 'Reports',
                path: '/analytics/reports',
                icon: 'BarChart3',
                resource: '*',
                action: '*',
            },
        ],
    },
    {
        label: 'Agent Booth',
        path: '/agent',
        icon: 'Ticket',
        allowedModules: ['BAP'],
        description: 'Book bus passes for customers at booths',
        children: [
            {
                label: 'Pass Booking',
                path: '/agent/pass-booking',
                icon: 'Ticket',
                resource: 'DSL',
                action: 'RIDER_APP_MANAGEMENT/PASS/POST_PASS_CUSTOMER_PASS_SELECT',
            },
        ],
    },
    {
        label: 'System Config',
        path: '/config',
        icon: 'Settings',
        description: 'Manage fare policies and settings',
        children: [
            {
                label: 'NammaTags',
                path: '/config/namma-tags',
                icon: 'Settings',
                resource: 'DSL',
                action: 'RIDER_MANAGEMENT/NAMMA_TAG/POST_NAMMA_TAG_TAG_CREATE',
                allowedModules: ['BAP', 'BPP'],
                showLocked: true,
            },
            {
                label: 'Dynamic Logic',
                path: '/config/dynamic-logic',
                icon: 'Settings',
                resource: 'DSL',
                action: 'RIDER_MANAGEMENT/NAMMA_TAG/POST_NAMMA_TAG_APP_DYNAMIC_LOGIC_UPSERT_LOGIC_ROLLOUT',
                allowedModules: ['BAP', 'BPP'],
                showLocked: true,
            },
            {
                label: 'Fare Policy',
                path: '/config/fare-policy',
                icon: 'Settings',
                resource: 'DSL',
                action: 'DRIVER_OFFER_BPP_MANAGEMENT/MERCHANT/UPSERT_FARE_POLICY',
                allowedModules: ['BAP', 'BPP'],
                showLocked: true,
            },
            {
                label: 'Issue Config',
                path: '/config/issue-config',
                icon: 'MessageSquare',
                resource: 'DSL',
                action: '*',
                allowedModules: ['BAP'],
                showLocked: true,
                description: 'Manage issue categories, messages, and options',
            },
            {
                label: 'Vehicle Service Tier',
                path: '/config/vehicle-service-tier',
                icon: 'Car',
                resource: 'DSL',
                action: '*',
                allowedModules: ['BPP'],
                showLocked: true,
                description: 'Manage vehicle service tier configurations',
            },

            {
                label: 'Settings',
                path: '/config/settings',
                icon: 'Settings',
                resource: 'DSL',
                action: 'DRIVER_OFFER_BPP_MANAGEMENT/MERCHANT/UPSERT_FARE_POLICY',
                allowedModules: ['BAP', 'BPP'],
                showLocked: true,
            },
        ],
    },
    {
        label: 'Access Control',
        path: '/access',
        icon: 'Shield',
        description: 'Manage users, roles, and permissions',
        children: [
            {
                label: 'Users',
                path: '/access/users',
                icon: 'Users',
                resource: 'admin.users',
                action: 'view',
            },
            {
                label: 'Roles',
                path: '/access/roles',
                icon: 'Shield',
                resource: 'admin.roles',
                action: 'view',
            },
        ],
    },
];

// Utility function to check if user can access a nav item
export function canAccessNavItem(
    item: NavItem,
    loginModule: LoginModule | null,
    hasPermission: (resource: string, action: string) => boolean
): boolean {
    // Check module access
    if (item.allowedModules) {
        if (!loginModule || !item.allowedModules.includes(loginModule)) {
            return false;
        }
    }

    // Check permission
    if (item.resource && item.action) {
        if (!hasPermission(item.resource, item.action)) {
            return false;
        }
    }

    return true;
}

// Check if parent has any accessible children
export function hasAccessibleChildren(
    item: NavItem,
    loginModule: LoginModule | null,
    hasPermission: (resource: string, action: string) => boolean
): boolean {
    if (!item.children || item.children.length === 0) {
        return false;
    }

    return item.children.some(child => canAccessNavItem(child, loginModule, hasPermission));
}

// Get first accessible child path (for navigation)
export function getFirstAccessibleChildPath(
    item: NavItem,
    loginModule: LoginModule | null,
    hasPermission: (resource: string, action: string) => boolean
): string | null {
    if (!item.children || item.children.length === 0) {
        return null;
    }

    const accessibleChild = item.children.find(child =>
        canAccessNavItem(child, loginModule, hasPermission)
    );

    return accessibleChild?.path || null;
}
