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
  ArrowRight,
  Loader2,
  Car,
  AlertCircle,
  Lock,
  LogIn,
} from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function DriversPage() {
  const navigate = useNavigate();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { currentMerchant, loginModule, logout } = useAuth();
  
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [driverId, setDriverId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchByPhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
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
      // Call the list API with phone number as search string
      const response = await listDrivers(
        apiMerchantId,
        cityId || undefined,
        { searchString: phoneNumber.trim(), limit: 1 }
      );

      if (response.listItem && response.listItem.length > 0) {
        // Found driver, navigate to details
        navigate(`/ops/drivers/${response.listItem[0].driverId}`);
      } else {
        setError('No driver found with this phone number');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for driver. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToDriver = () => {
    if (!driverId.trim()) {
      setError('Please enter a driver ID');
      return;
    }
    setError(null);
    navigate(`/ops/drivers/${driverId.trim()}`);
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
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => { setSearchType('phone'); setError(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'phone'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="h-4 w-4 inline-block mr-2" />
              Search by Phone
            </button>
            <button
              onClick={() => { setSearchType('id'); setError(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === 'id'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="h-4 w-4 inline-block mr-2" />
              Direct Driver ID
            </button>
          </div>

          {/* Search by Phone Number */}
          {searchType === 'phone' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Search by Phone Number
                </CardTitle>
                <CardDescription>
                  Enter the driver's phone number to find their account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number (e.g., 9876543210)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleSearchByPhone)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSearchByPhone}
                      disabled={isSearching || !phoneNumber.trim()}
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
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number without country code
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Direct Driver ID */}
          {searchType === 'id' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Go to Driver by ID
                </CardTitle>
                <CardDescription>
                  Enter the driver ID directly to view their details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driverId">Driver ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="driverId"
                      type="text"
                      placeholder="Enter driver ID (UUID)"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleGoToDriver)}
                      className="flex-1 font-mono"
                    />
                    <Button 
                      onClick={handleGoToDriver}
                      disabled={!driverId.trim()}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Driver
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The driver ID is a unique identifier (UUID format)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use phone number search for quick lookup of driver accounts</li>
                <li>• Use direct ID when you have the driver ID from other sources</li>
                <li>• Make sure you have selected the correct merchant and city</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
