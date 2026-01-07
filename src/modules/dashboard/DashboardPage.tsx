import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionsContext';
import { navConfig, hasAccessibleChildren, getFirstAccessibleChildPath } from '../../config/navigation';
import {
  Users,
  Car,
  ArrowRight,
  Activity,
  UserCircle,
  Truck,
  BarChart3,
  Settings,
  Shield,
  Ticket,
  LayoutDashboard,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

// Icon mapping from string to component
const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  Car: <Car className="h-6 w-6" />,
  UserCircle: <UserCircle className="h-6 w-6" />,
  Truck: <Truck className="h-6 w-6" />,
  BarChart3: <BarChart3 className="h-6 w-6" />,
  Settings: <Settings className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
  Ticket: <Ticket className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  AlertCircle: <AlertCircle className="h-6 w-6" />,
};

interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickLink({ title, description, icon, href }: QuickLinkProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { merchantId } = useDashboardContext();
  const { user, loginModule } = useAuth();
  const { hasPermission } = usePermissions();

  const isDriverModule = loginModule === 'BPP' || loginModule === 'FLEET';
  const isCustomerModule = loginModule === 'BAP';

  const hasMerchant = !!merchantId;

  const getModuleLabel = () => {
    switch (loginModule) {
      case 'BAP': return 'Customer';
      case 'BPP': return 'Driver';
      case 'FLEET': return 'Fleet';
      default: return '';
    }
  };

  // Filter nav items that should appear as quick links (skip Dashboard itself)
  // Only show parent items that have accessible children
  const quickLinks = navConfig
    .filter(item => item.path !== '/dashboard') // Skip Dashboard
    .filter(item => {
      // If item has children, check if any are accessible
      if (item.children && item.children.length > 0) {
        return hasAccessibleChildren(item, loginModule, hasPermission);
      }
      // If no children, this item itself should be accessible
      return true;
    });

  return (
    <Page>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Admin'}!`}
        description={`${getModuleLabel()} Dashboard - Here's what's happening with your platform today.`}
      />

      <PageContent>
        {/* Stats Overview - Only show for driver/fleet module */}
        {hasMerchant && isDriverModule ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold">Driver Dashboard</h3>
              <p className="text-muted-foreground mt-2">
                Search and manage driver accounts, fleet, and vehicles.
              </p>
            </CardContent>
          </Card>
        ) : hasMerchant && isCustomerModule ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold">Customer Dashboard</h3>
              <p className="text-muted-foreground mt-2">
                Search and manage customer accounts using the Customers section.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Select a Merchant</h3>
              <p className="text-muted-foreground mt-2">
                Choose a merchant from the dropdown above to view statistics and manage operations.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Links - Generated from nav config */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((item) => {
              // Get the path to navigate to (first accessible child or item path)
              const targetPath = item.children && item.children.length > 0
                ? getFirstAccessibleChildPath(item, loginModule, hasPermission) || item.path
                : item.path;

              return (
                <QuickLink
                  key={item.path}
                  title={item.label}
                  description={item.description || `Manage ${item.label.toLowerCase()}`}
                  icon={iconMap[item.icon || 'LayoutDashboard'] || <LayoutDashboard className="h-6 w-6" />}
                  href={targetPath}
                />
              );
            })}
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Select a Merchant & City 🚀</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the merchant and city selectors in the top bar to change context.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {isCustomerModule ? 'Search Customers' : 'Search Drivers'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isCustomerModule
                        ? 'Navigate to Customer Operations to search by phone number or customer ID.'
                        : 'Navigate to Driver Operations to search by phone number or driver ID.'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Manage & Take Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      View details, block/unblock accounts, and perform other operations as needed.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
