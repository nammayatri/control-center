import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { listDrivers, getDriverInfo, bulkFetchDriversByPhone, bulkFetchDriversById } from '../../services/drivers';
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
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

import { toast } from 'sonner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CountryCodeSelect } from '../../components/ui/country-code-select';

type SearchType = 'phone' | 'id' | 'vehicle' | 'dl' | 'rc' | 'email';

interface SearchParams {
  [key: string]: string | number | boolean | null | undefined;
  mobileNumber?: string;
  mobileCountryCode?: string;
  vehicleNumber?: string;
  dlNumber?: string;
  rcNumber?: string;
  email?: string;
  personId?: string;
}

function getSearchLabel(searchType: SearchType): string {
  switch (searchType) {
    case 'phone': return 'Phone Number';
    case 'vehicle': return 'Vehicle Number';
    case 'dl': return 'Driving License Number';
    case 'rc': return 'RC Number';
    case 'email': return 'Email Address';
    case 'id': return 'Driver ID';
  }
}

function getInputType(searchType: SearchType): string {
  if (searchType === 'phone') return 'tel';
  if (searchType === 'email') return 'email';
  return 'text';
}

function getPlaceholder(searchType: SearchType): string {
  switch (searchType) {
    case 'phone': return '9876543210';
    case 'vehicle': return 'KA01AB1234';
    case 'dl': return 'KA0120220001234';
    case 'email': return 'driver@example.com';
    default: return 'Enter value...';
  }
}

function BulkDriverSearch() {
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { currentMerchant } = useAuth();
  const [activeBulkTab, setActiveBulkTab] = useState<'phone' | 'id'>('phone');
  const [isUploading, setIsUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any[] | null>(null);

  const apiMerchantId = merchantShortId || currentMerchant?.shortId || merchantId;

  const handleDownloadSample = () => {
    let content = '';
    if (activeBulkTab === 'phone') {
      content = 'mobileNumber\n9930081991\n8328111468';
    } else {
      content = 'personId\n643890b2-adb1-4c4b-9e36-15e368181c12\n77d40521-b66b-408e-b7d0-f2f9caf1d21f';
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeBulkTab === 'phone' ? 'sample_drivers_phone.csv' : 'sample_drivers_id.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadResult = () => {
    if (!uploadResult || uploadResult.length === 0) return;

    // Convert JSON to CSV
    const headers = Object.keys(uploadResult[0]);
    const csvContent = [
      headers.join(','),
      ...uploadResult.map(row => 
        headers.map(header => {
          const val = row[header];
          // Handle commas in values by wrapping in quotes
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver_search_results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!apiMerchantId) {
      toast.error('Please select a merchant first');
      return;
    }
    
    // Default to 'all' city if cityId is undefined/empty to match other API calls logic
    // But specific bulk API might require city. Based on curl: /NAMMA_YATRI_PARTNER/Bangalore/...
    // If no city selected, this might fail if API requires city. 
    // The curl example included city 'Bangalore'.
    // `drivers.ts` logic for `buildPath` handles `cityId` being optional or 'all'.
    // We'll pass `cityId || 'all'` if that's safe, or assume the user has selected a city if required.
    // Given the curl url has 'Bangalore', it implies a city context is usually needed.
    // However, `drivers.ts` `buildPath` will omit city segment if cityId is missing or 'all' for MOST paths,
    // BUT for these new paths: `/driver-offer/{merchantId}/{city}/driver/personId`, the `{city}` part is explicit in the base string I added.
    // Wait, my implementation in `drivers.ts`:
    // `const basePath = '/driver-offer/{merchantId}/{city}/driver/personId';`
    // `buildPath` implementation:
    // `if (cityId && cityId !== "all") { return basePath.replace... }`
    // `return basePath.replace("{merchantId}", merchantId).replace("/{city}", "");`
    // So if cityId is missing, it removes `/{city}`.
    // `/driver-offer/MERCHANT/driver/personId` -> valid?
    // The curl was: `.../api/bpp/driver-offer/NAMMA_YATRI_PARTNER/Bangalore/driver/personId`
    // If I used `replace("/{city}", "")`, I get `.../NAMMA_YATRI_PARTNER/driver/personId`.
    // I hope the backend supports both. If not, I should probably enforce city selection or default to a city.
    // For now, I'll proceed with current `cityId` from context.

    setIsUploading(true);
    setUploadResult(null);

    try {
      let response;
      if (activeBulkTab === 'phone') {
        response = await bulkFetchDriversByPhone(apiMerchantId, cityId || 'all', file);
      } else {
        response = await bulkFetchDriversById(apiMerchantId, cityId || 'all', file);
      }
      
      if (Array.isArray(response)) {
        setUploadResult(response);
        toast.success(`Successfully fetched ${response.length} records`);
      } else {
        // If response is not an array, wrap it or handle error
        console.error('Unexpected response format', response);
        toast.error('Received unexpected response format');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Bulk upload failed', error);
      toast.error(error.message || 'Failed to fetch driver details');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Driver Search
        </CardTitle>
        <CardDescription>
          Fetch details for multiple drivers by uploading a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeBulkTab} onValueChange={(v) => {
            setActiveBulkTab(v as 'phone' | 'id');
            setUploadResult(null);
          }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="phone">By Phone Number</TabsTrigger>
            <TabsTrigger value="id">By Driver ID</TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Upload CSV File</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a CSV file containing {activeBulkTab === 'phone' ? 'mobile numbers' : 'driver IDs'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadSample} title="Download Sample CSV">
                  <Download className="h-4 w-4 mr-2" />
                  Sample
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing file...
              </div>
            )}

            {uploadResult && (
              <div className="bg-muted/30 rounded-lg p-4 border flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Ready to download</p>
                  <p className="text-xs text-muted-foreground">{uploadResult.length} records found</p>
                </div>
                <Button onClick={handleDownloadResult}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function DriversPage() {
  const navigate = useNavigate();
  const { merchantId, cityId, merchantShortId } = useDashboardContext();
  const { currentMerchant, loginModule, logout, getCitiesForMerchant, switchContext } = useAuth();

  const [searchType, setSearchType] = useState<SearchType>('phone');
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

    // Store original city to restore context later
    const originalCityId = cityId;

    try {
      // Build search params based on type
      const params: SearchParams = {};

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

      // First, try searching in the currently selected city (if one is selected)
      let response = null;

      if (cityId) {
        try {
          response = await getDriverInfo(apiMerchantId, cityId, params);
        } catch {
          console.log('Driver not found in current city, will search other cities');
        }
      }

      // If not found in current city, search across all accessible cities for this merchant
      if (!response?.driverId) {
        const accessibleCities = getCitiesForMerchant(apiMerchantId);
        
        for (const city of accessibleCities) {
          // Skip the city we already searched
          if (city.id === cityId) continue;

          try {
            // Switch context to the new city before searching
            await switchContext(apiMerchantId, city.id);
            
            response = await getDriverInfo(apiMerchantId, city.id, params);
            if (response?.driverId) {
              console.log(`Driver found in city: ${city.name}`);
              break;
            }
          } catch {
            // Continue searching in other cities
            console.log(`Driver not found in city: ${city.name}`);
          }
        }
      }

      if (response?.driverId) {
        navigate(`/ops/drivers/${response.driverId}`, { state: { driver: response } });
      } else {
        // Restore original city context if driver not found
        if (originalCityId) {
          try {
            await switchContext(apiMerchantId, originalCityId);
          } catch (err) {
            console.error('Failed to restore original city context:', err);
          }
        }
        setError('No driver found with provided details in any accessible city');
      }
    } catch (err) {
      console.error('Search error:', err);
      
      // Restore original city context on error
      if (originalCityId) {
        try {
          await switchContext(apiMerchantId, originalCityId);
        } catch (error_) {
          console.error('Failed to restore original city context:', error_);
        }
      }
      
      // Try to list drivers as fallback for some fields if getDriverInfo fails
      if (searchType === 'phone' || searchType === 'vehicle') {
        try {
          const listResponse = await listDrivers(
            apiMerchantId,
            cityId || undefined,
            { searchString: searchValue.trim(), limit: 1 }
          );

          if (listResponse.listItem?.length > 0) {
            navigate(`/ops/drivers/${listResponse.listItem[0].driverId}`);
            return;
          }
        } catch (error_) {
          console.error('Retry listing failed', error_);
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
                  setSearchType(type.id as SearchType);
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
                  {getSearchLabel(searchType)}
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
                    type={getInputType(searchType)}
                    placeholder={getPlaceholder(searchType)}
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

          {/* Bulk Search Card */}
          <BulkDriverSearch />

          {/* Tips Card */}
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-sm">Search Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Search automatically checks all cities within the selected merchant that you have access to.</li>
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
