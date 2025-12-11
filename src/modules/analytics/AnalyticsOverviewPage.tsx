import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { KPIHeader, StatTile } from '../../components/layout/KPIHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useOperatorAllTimeAnalytics, useOperatorFilteredAnalytics, useDriverActivityAnalytics } from '../../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Car,
  TrendingUp,
  Star,
  XCircle,
  CheckCircle,
  Activity,
  LogIn,
  BarChart3,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsOverviewPage() {
  const { merchantId } = useDashboardContext();
  const { loginModule, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user has access to driver analytics (requires BPP or FLEET login)
  const hasDriverAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  const { data: allTimeData, isLoading: allTimeLoading } = useOperatorAllTimeAnalytics();
  const { data: filteredData, isLoading: filteredLoading } = useOperatorFilteredAnalytics();
  const { data: activityData, isLoading: activityLoading } = useDriverActivityAnalytics();

  // Show message for BAP users
  if (!hasDriverAccess) {
    return (
      <Page>
        <PageHeader
          title="Analytics Overview"
          breadcrumbs={[
            { label: 'Analytics', href: '/analytics' },
            { label: 'Overview' },
          ]}
        />
        <PageContent>
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Driver Analytics</h3>
              <p className="text-muted-foreground">
                This page shows driver-related analytics and metrics. You are currently logged in with the <strong>Customer (BAP)</strong> module.
              </p>
              <p className="text-muted-foreground text-sm">
                To view driver analytics, please log in with the <strong>Driver (BPP)</strong> or <strong>Fleet</strong> module.
              </p>
              <Button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="mt-4"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Switch to Driver Login
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  if (!merchantId) {
    return (
      <Page>
        <PageHeader title="Analytics Overview" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Please select a merchant to view analytics.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  const isLoading = allTimeLoading || filteredLoading || activityLoading;

  // Prepare chart data
  const driverDistributionData = filteredData ? [
    { name: '>50 Rides', value: filteredData.greaterThanFiftyRide, fill: COLORS[0] },
    { name: '>10 Rides', value: filteredData.greaterThanTenRide - filteredData.greaterThanFiftyRide, fill: COLORS[1] },
    { name: '>1 Ride', value: filteredData.greaterThanOneRide - filteredData.greaterThanTenRide, fill: COLORS[2] },
    { name: 'New', value: filteredData.driverEnabled - filteredData.greaterThanOneRide, fill: COLORS[3] },
  ].filter(d => d.value > 0) : [];

  const activityChartData = activityData ? [
    { name: 'Active', value: activityData.activeDrivers, fill: COLORS[0] },
    { name: 'Busy', value: activityData.busyDrivers, fill: COLORS[1] },
    { name: 'Inactive', value: activityData.inactiveDrivers, fill: COLORS[3] },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Analytics Overview"
        description="Key performance metrics and insights"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Overview' },
        ]}
      />

      <PageContent>
        {/* KPI Cards */}
        <KPIHeader
          loading={isLoading}
          stats={[
            {
              label: 'Average Rating',
              value: allTimeData?.rating?.toFixed(2) || '-',
              icon: <Star className="h-5 w-5" />,
            },
            {
              label: 'Acceptance Rate',
              value: `${allTimeData?.acceptanceRate?.toFixed(1) || 0}%`,
              icon: <CheckCircle className="h-5 w-5" />,
            },
            {
              label: 'Cancellation Rate',
              value: `${allTimeData?.cancellationRate?.toFixed(1) || 0}%`,
              icon: <XCircle className="h-5 w-5" />,
            },
            {
              label: 'Active Drivers',
              value: filteredData?.activeDriver || 0,
              icon: <Users className="h-5 w-5" />,
            },
          ]}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Driver Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Activity Status</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : activityChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {activityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Experience Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver Experience Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : driverDistributionData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={driverDistributionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {driverDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatTile
            label="Total Enabled"
            value={filteredData?.driverEnabled || 0}
            icon={<Users className="h-5 w-5" />}
            loading={filteredLoading}
          />
          <StatTile
            label="Drivers >1 Ride"
            value={filteredData?.greaterThanOneRide || 0}
            icon={<Car className="h-5 w-5" />}
            loading={filteredLoading}
          />
          <StatTile
            label="Drivers >10 Rides"
            value={filteredData?.greaterThanTenRide || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            loading={filteredLoading}
          />
          <StatTile
            label="Drivers >50 Rides"
            value={filteredData?.greaterThanFiftyRide || 0}
            icon={<Activity className="h-5 w-5" />}
            loading={filteredLoading}
          />
        </div>
      </PageContent>
    </Page>
  );
}
