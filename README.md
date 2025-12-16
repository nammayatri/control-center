# Moving Control Center

A unified internal web console (Admin/Ops Dashboard) for the Moving mobility platform. Built with React + TypeScript + Vite.

## Features

### Operations Module
- **Driver Operations** - View, search, filter, block/unblock drivers, view driver details and documents
- **Customer Operations** - Manage customers, view bookings, handle blocks
- **Rides Management** - View and manage ride bookings
- **Communications** - Message campaigns and driver notifications

### Fleet Module
- **Fleet Overview** - Dashboard with fleet KPIs
- **Vehicle Management** - Track and manage vehicles

### Analytics Module
- **Overview Dashboard** - Key performance metrics, driver activity analytics
- **Reports** - Detailed analytical reports

### System Configuration
- **Fare Policy** - Configure fare rules by merchant and city
- **Settings** - System-wide configuration

### Access Control (Admin)
- **User Management** - Create, enable/disable admin users
- **Role Management** - Define and assign roles
- **Permission Control** - RBAC-based access control

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios

## Project Structure

```
src/
├── components/           # Shared UI components
│   ├── ui/              # Base UI components (Button, Input, Table, etc.)
│   ├── layout/          # Layout components (Sidebar, TopBar, Page, etc.)
│   └── domain/          # Domain-specific components (DriverBadge, etc.)
├── context/             # React Context providers
│   ├── AuthContext.tsx
│   ├── DashboardContext.tsx
│   └── PermissionsContext.tsx
├── hooks/               # Custom React hooks
│   ├── useAdmin.ts
│   ├── useDrivers.ts
│   ├── useCustomers.ts
│   └── useAnalytics.ts
├── lib/                 # Utility functions
├── modules/             # Feature modules
│   ├── access/          # User & Role management
│   ├── analytics/       # Analytics pages
│   ├── auth/            # Login page
│   ├── config/          # System configuration
│   ├── dashboard/       # Main dashboard
│   ├── fleet/           # Fleet management
│   └── operations/      # Driver & Customer operations
├── services/            # API client layer
│   ├── api.ts           # Base API client
│   ├── admin.ts         # Admin/Auth APIs
│   ├── drivers.ts       # Driver APIs (BPP)
│   ├── customers.ts     # Customer APIs (BAP)
│   ├── rides.ts         # Ride APIs
│   ├── fleet.ts         # Fleet APIs
│   ├── analytics.ts     # Analytics APIs
│   ├── messages.ts      # Messaging APIs
│   └── config.ts        # Configuration APIs
└── types/               # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Server

The backend server is located in the `server/` directory and provides APIs with ClickHouse database integration.

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

#### Environment Variables

Configure the following in `server/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLICKHOUSE_HOST` | ClickHouse server host | `localhost` |
| `CLICKHOUSE_PORT` | ClickHouse HTTP port | `8123` |
| `CLICKHOUSE_USER` | ClickHouse username | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse password | (empty) |
| `CLICKHOUSE_DATABASE` | ClickHouse database name | `default` |
| `PORT` | Backend server port | `3001` |

#### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health check |
| `GET /health/clickhouse` | ClickHouse connection status |

## API Integration

The dashboard integrates with two OpenAPI specifications:

- **BAP API** (Customer): `https://dashboard.moving.tech/api/bap/openapi`
- **BPP API** (Driver): `https://dashboard.moving.tech/api/bpp/openapi`

### Merchant & City Context

The platform operates across multiple merchants and cities. Use the selectors in the top bar to switch context:

- **Merchant Selector**: Filter data by merchant
- **City Selector**: Filter data by city (filtered by selected merchant)

Context is persisted in URL query parameters for deep linking:
```
?merchantId=xxx&cityId=yyy
```

## Key Components

### useDashboardContext

```tsx
const { merchantId, cityId, setMerchant, setCity } = useDashboardContext();
```

Provides current merchant/city context and methods to update them.

### PermissionGuard

```tsx
<PermissionGuard resource="ops.drivers" action="view">
  <DriversPage />
</PermissionGuard>
```

Conditionally renders content based on user permissions.

### usePermissions

```tsx
const { hasPermission } = usePermissions();

if (hasPermission('admin.users', 'create')) {
  // Show create button
}
```

### API Hooks

All data fetching uses React Query hooks:

```tsx
// List drivers with filters
const { data, isLoading, error } = useDriverList({
  searchString: 'john',
  enabled: true,
  limit: 20,
  offset: 0,
});

// Get driver details
const { data: driver } = useDriverInfo(driverId);

// Mutations
const blockMutation = useBlockDriver();
await blockMutation.mutateAsync(driverId);
```

## Environment Configuration

Create a `.env` file for environment-specific settings:

```env
VITE_API_BASE_URL=https://dashboard.moving.tech/api
```

## Authentication

The dashboard uses token-based authentication:

1. User logs in via `/login`
2. Token is stored in localStorage
3. Token is attached to all API requests via the `token` header
4. On 401 response, user is redirected to login

## Development Notes

### Adding a New Module

1. Create module folder in `src/modules/`
2. Add service functions in `src/services/`
3. Create hooks in `src/hooks/`
4. Add routes in `src/App.tsx`
5. Add navigation item in `src/components/layout/Sidebar.tsx`

### Adding API Endpoints

1. Add typed functions to appropriate service file
2. Create React Query hooks for data fetching
3. Use `useDashboardContext` to get merchant/city context
4. Pass context to API calls

## License

Proprietary - Moving Technologies
