import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
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
  Lock,
  Ticket,
} from 'lucide-react';

interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  locked?: boolean;
  lockMessage?: string;
}

function QuickLink({ title, description, icon, href, locked, lockMessage }: QuickLinkProps) {
  const navigate = useNavigate();

  if (locked) {
    return (
      <Card className="opacity-60 cursor-not-allowed">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-lg text-muted-foreground">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                {title}
                <Lock className="h-3 w-3" />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{lockMessage || 'Different login required'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink
              title="Driver Operations"
              description="Manage drivers, view profiles, and handle issues"
              icon={<UserCircle className="h-6 w-6" />}
              href="/ops/drivers"
              locked={isCustomerModule}
              lockMessage="Requires Driver (BPP) login"
            />
            <QuickLink
              title="Customer Operations"
              description="View customers, bookings, and support tickets"
              icon={<Users className="h-6 w-6" />}
              href="/ops/customers"
              locked={isDriverModule}
              lockMessage="Requires Customer (BAP) login"
            />
            <QuickLink
              title="Fleet Management"
              description="Monitor vehicles and fleet performance"
              icon={<Truck className="h-6 w-6" />}
              href="/fleet/overview"
              locked={isCustomerModule}
              lockMessage="Requires Driver (BPP/Fleet) login"
            />
            <QuickLink
              title="Analytics"
              description="View reports and performance metrics"
              icon={<BarChart3 className="h-6 w-6" />}
              href="/analytics/overview"
            />
            <QuickLink
              title="Agent Booth"
              description="Book bus passes for customers at booths"
              icon={<Ticket className="h-6 w-6" />}
              href="/agent/pass-booking"
              locked={isDriverModule}
              lockMessage="Requires Customer (BAP) login"
            />
            <QuickLink
              title="System Configuration"
              description="Manage fare policies and settings"
              icon={<Settings className="h-6 w-6" />}
              href="/config/settings"
            />
            <QuickLink
              title="Access Control"
              description="Manage users, roles, and permissions"
              icon={<Shield className="h-6 w-6" />}
              href="/access/users"
            />
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
                    <h4 className="font-medium">Select a Merchant & City</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the merchant and city selectors in the top bar, then click Switch to change context.
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
