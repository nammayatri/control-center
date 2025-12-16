import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { DashboardProvider } from './context/DashboardContext';
import { Layout } from './components/layout/Layout';
import { TooltipProvider } from './components/ui/tooltip';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { LoginPage } from './modules/auth/LoginPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { DriversPage } from './modules/operations/DriversPage';
import { DriverDetailPage } from './modules/operations/DriverDetailPage';
import { CustomersPage } from './modules/operations/CustomersPage';
import { CustomerDetailPage } from './modules/operations/CustomerDetailPage';
import { RidesPage } from './modules/operations/RidesPage';
import { RideSummaryPage } from './modules/operations/RideSummaryPage';
import { UsersPage } from './modules/access/UsersPage';
import { UserDetailPage } from './modules/access/UserDetailPage';
import { RolesPage } from './modules/access/RolesPage';
import { RoleDetailPage } from './modules/access/RoleDetailPage';
import { AnalyticsOverviewPage } from './modules/analytics/AnalyticsOverviewPage';
import { NammaTagsPage } from './modules/config/NammaTagsPage';
import PassBookingPage from './modules/agent/PassBookingPage';
import { DynamicLogicPage } from './modules/config/DynamicLogicPage';
import IssuesListPage from './modules/operations/IssuesListPage';
import IssueDetailPage from './modules/operations/IssueDetailPage';
import { UserProfilePage } from './modules/profile/UserProfilePage';
import { Toaster } from 'sonner';

// Create Query Client - exported so it can be used to invalidate cache on context switch
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Wrapper
function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Public Route Wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Placeholder pages
function PlaceholderPage({ title }: Readonly<{ title: string }>) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">This page is under development.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardProvider>
              {/* PermissionsProvider moved to App component */}
              <Layout />
            </DashboardProvider>
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Operations */}
        <Route path="ops">
          <Route index element={<Navigate to="/ops/drivers" replace />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="rides/:rideId" element={<RideSummaryPage />} />
          <Route path="comms" element={<PlaceholderPage title="Communications" />} />
          <Route path="issues" element={<IssuesListPage />} />
          <Route path="issues/:id" element={<IssueDetailPage />} />
        </Route>

        {/* Fleet */}
        <Route path="fleet">
          <Route index element={<Navigate to="/fleet/overview" replace />} />
          <Route path="overview" element={<PlaceholderPage title="Fleet Overview" />} />
          <Route path="vehicles" element={<PlaceholderPage title="Vehicles" />} />
          <Route path="rides" element={<RidesPage />} />
        </Route>

        {/* Analytics */}
        <Route path="analytics">
          <Route index element={<Navigate to="/analytics/overview" replace />} />
          <Route path="overview" element={<AnalyticsOverviewPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        </Route>

        {/* Agent */}
        <Route path="/agent/pass-booking" element={<PassBookingPage />} />

        {/* Config */}
        <Route path="config">
          <Route index element={<Navigate to="/config/namma-tags" replace />} />
          <Route path="namma-tags" element={<NammaTagsPage />} />
          <Route path="dynamic-logic" element={<DynamicLogicPage />} />
          <Route path="fare-policy" element={<PlaceholderPage title="Fare Policy" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* Access Control */}
        <Route path="access">
          <Route index element={<Navigate to="/access/users" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="roles/:roleId" element={<RoleDetailPage />} />
          <Route path="permissions" element={<PlaceholderPage title="Permissions" />} />
        </Route>

        {/* Profile & Settings */}
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="settings" element={<PlaceholderPage title="User Settings" />} />
      </Route>

      {/* Catch all - 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  // Listen for merchant-city switch events and invalidate all queries
  useEffect(() => {
    const handleContextSwitch = () => {
      console.log('Context switched - invalidating all queries');
      queryClient.invalidateQueries();
    };

    globalThis.addEventListener('merchant-city-switch', handleContextSwitch);
    return () => {
      globalThis.removeEventListener('merchant-city-switch', handleContextSwitch);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <PermissionsProvider>
              <TooltipProvider>
                <AppRoutes />
              </TooltipProvider>
              <Toaster />
            </PermissionsProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
