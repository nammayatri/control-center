import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { listDrivers } from '../../services/drivers';
import {
  Search,
  Phone,
  Hash,
  Loader2,
  Car,
  AlertCircle,
  Lock,
  LogIn,
  CreditCard,
  FileText,
  Mail,
} from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { getDriverInfo } from '../../services/drivers';
import { CountryCodeSelect } from '../../components/ui/country-code-select';

export function DriversPage() {
  const navigate = useNavigate();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { currentMerchant, loginModule, logout } = useAuth();

  const [searchType, setSearchType] = useState<'phone' | 'id' | 'vehicle' | 'dl' | 'rc' | 'email'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [countryCode, setCountryCode] = useState('91'); // Default to India
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    const apiMerchantId = merchantShortId || currentMerchant?.shortId || merchantId;
    if (!apiMerchantId) {
      setError('Please select a merchant first');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Build search params based on type
      const params: any = {};

      switch (searchType) {
        case 'phone':
          params.mobileNumber = searchValue.trim();
          params.mobileCountryCode = countryCode;
          break;
        case 'vehicle':
          params.vehicleNumber = searchValue.trim();
          break;
        case 'dl':
          params.dlNumber = searchValue.trim();
          break;
        case 'rc':
          params.rcNumber = searchValue.trim();
          break;
        case 'email':
          params.email = searchValue.trim();
          break;
        case 'id':
          params.personId = searchValue.trim(); // Using personId as generic ID search
          break;
      }

      // Special case for direct driverId lookups (if user explicitly knows it's a UUID)
      if (searchType === 'id' && /^[0-9a-fA-F-]{36}$/.test(searchValue.trim())) {
        // Direct navigation if valid UUID
        navigate(`/ops/drivers/${searchValue.trim()}`);
        return;
      }

      const response = await getDriverInfo(
        apiMerchantId,
        cityId || undefined,
        params
      );

      if (response && response.driverId) {
        navigate(`/ops/drivers/${response.driverId}`, { state: { driver: response } });
      } else {
        setError('No driver found with provided details');
      }
    } catch (err) {
      console.error('Search error:', err);
      // Try to list drivers as fallback for some fields if getDriverInfo fails
      if (searchType === 'phone' || searchType === 'vehicle') {
        try {
          const listResponse = await listDrivers(
            apiMerchantId,
            cityId || undefined,
            { searchString: searchValue.trim(), limit: 1 }
          );

          if (listResponse.listItem && listResponse.listItem.length > 0) {
            navigate(`/ops/drivers/${listResponse.listItem[0].driverId}`);
            return;
          }
        } catch (retryErr) {
          console.error('Retry listing failed', retryErr);
        }
      }

      setError('Failed to find driver. Please verify details and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  // Check if user has access to driver operations (requires BPP or FLEET login)
  const hasDriverAccess = loginModule === 'BPP' || loginModule === 'FLEET';

  if (!hasDriverAccess) {
    return (
      <Page>
        <PageHeader title="Driver Operations" />
        <PageContent>
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Driver Login Required</h3>
              <p className="text-muted-foreground">
                You are currently logged in with the <strong>Customer (BAP)</strong> module.
                To access driver operations, please log in with the <strong>Driver (BPP)</strong> or <strong>Fleet</strong> module.
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
        <PageHeader title="Driver Operations" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Please select a merchant to search drivers.
              </p>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Driver Operations"
        description="Search and manage driver accounts"
        breadcrumbs={[
          { label: 'Operations', href: '/ops' },
          { label: 'Drivers' },
        ]}
      />

      <PageContent>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Type Tabs */}
          <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg w-full md:w-fit">
            {[
              { id: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4 mr-2" /> },
              { id: 'vehicle', label: 'Vehicle', icon: <Car className="h-4 w-4 mr-2" /> },
              { id: 'dl', label: 'DL No', icon: <CreditCard className="h-4 w-4 mr-2" /> },
              { id: 'rc', label: 'RC No', icon: <FileText className="h-4 w-4 mr-2" /> },
              { id: 'email', label: 'Email', icon: <Mail className="h-4 w-4 mr-2" /> },
              { id: 'id', label: 'Driver ID', icon: <Hash className="h-4 w-4 mr-2" /> },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSearchType(type.id as any);
                  setSearchValue('');
                  setError(null);
                }}
                className={`flex-1 md:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${searchType === type.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Driver
              </CardTitle>
              <CardDescription>
                Find driver by {searchType === 'dl' ? 'Driving License' : searchType.toUpperCase()} details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="searchValue">
                  {searchType === 'phone' ? 'Phone Number' :
                    searchType === 'vehicle' ? 'Vehicle Number' :
                      searchType === 'dl' ? 'Driving License Number' :
                        searchType === 'rc' ? 'RC Number' :
                          searchType === 'email' ? 'Email Address' : 'Driver ID'}
                </Label>
                <div className="flex gap-2">
                  {searchType === 'phone' && (
                    <CountryCodeSelect
                      value={countryCode}
                      onValueChange={setCountryCode}
                    />
                  )}
                  <Input
                    id="searchValue"
                    type={searchType === 'phone' ? 'tel' : searchType === 'email' ? 'email' : 'text'}
                    placeholder={
                      searchType === 'phone' ? '9876543210' :
                        searchType === 'vehicle' ? 'KA01AB1234' :
                          searchType === 'dl' ? 'KA0120220001234' :
                            searchType === 'email' ? 'driver@example.com' :
                              'Enter value...'
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleSearch)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchValue.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
                {searchType === 'phone' && (
                  <p className="text-xs text-muted-foreground">
                    Enter the 10-digit mobile number
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-sm">Search Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Make sure to select the correct Merchant and City before searching.</li>
                <li>For vehicle numbers, avoid spaces or special characters.</li>
                <li>Driver ID is unique and provides the most direct match.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
