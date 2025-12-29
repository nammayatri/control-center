import { useState, useRef } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { exportFarePolicy, upsertFarePolicy } from '../../services/config';
import { handleApiError } from '../../services/api';
import {
  Download,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  LogIn,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Converts the JSON-formatted CSV response to actual CSV content
 * The API returns a string with escaped characters that need to be processed:
 * - Remove leading/trailing quotes
 * - Replace \" with "
 * - Replace \r\n with actual line breaks
 */
function processCSVResponse(response: string): string {
  let csv = response;

  // Remove leading and trailing quotes if present
  if (csv.startsWith('"') && csv.endsWith('"')) {
    csv = csv.slice(1, -1);
  }

  // Replace escaped quotes with actual quotes
  csv = csv.replace(/\\"/g, '"');

  // Replace escaped line breaks with actual line breaks
  csv = csv.replace(/\\r\\n/g, '\r\n');

  return csv;
}

/**
 * Triggers download of a CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function FarePolicyPage() {
  const { merchantId, cityId, cityName } = useDashboardContext();
  const { loginModule, logout } = useAuth();
  const navigate = useNavigate();

  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = loginModule === 'BPP';
  const isLoading = isExporting || isUploading;

  const handleExport = async () => {
    if (!merchantId || !cityId) return;

    setIsExporting(true);
    setResult(null);

    try {
      const response = await exportFarePolicy(merchantId, cityId);
      const csvContent = processCSVResponse(response);

      // Generate filename with city and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const safeCityName = (cityName || cityId).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `fare_policy_${safeCityName}_${timestamp}.csv`;

      downloadCSV(csvContent, filename);
      setResult({ success: true, message: `Fare policy exported successfully as ${filename}` });
    } catch (error) {
      const message = handleApiError(error);
      setResult({ success: false, message: `Failed to export fare policy: ${message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchantId || !cityId) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, message: 'Please select a CSV file' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      await upsertFarePolicy(merchantId, cityId, file);
      setResult({ success: true, message: `Fare policy uploaded successfully from ${file.name}` });
    } catch (error) {
      const message = handleApiError(error);
      setResult({ success: false, message: `Failed to upload fare policy: ${message}` });
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!hasAccess) {
    return (
      <Page>
        <PageHeader
          title="Fare Policy"
          breadcrumbs={[
            { label: 'Config', href: '/config' },
            { label: 'Fare Policy' },
          ]}
        />
        <PageContent>
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">Driver Login Required</h3>
              <p className="text-muted-foreground">
                Fare Policy management requires <strong>Driver (BPP)</strong> login.
              </p>
              <Button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="mt-4"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Switch Login
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    );
  }

  if (!merchantId || !cityId || cityId === 'all') {
    return (
      <Page>
        <PageHeader title="Fare Policy" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Please select a merchant and a specific city to export fare policy.
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
        title="Fare Policy"
        description="Export or update fare policy configuration for this city"
        breadcrumbs={[
          { label: 'Config', href: '/config' },
          { label: 'Fare Policy' },
        ]}
      />
      <PageContent>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Fare Policy Management
            </CardTitle>
            <CardDescription>
              Export the current fare policy configuration as a CSV file, or upload a modified CSV to update fare policies.
              The file contains all fare rules including base fare, distance rates, night shift charges, waiting charges, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Result Alert */}
            {result && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                {result.success
                  ? <CheckCircle className="h-5 w-5 text-green-600" />
                  : <XCircle className="h-5 w-5 text-red-600" />
                }
                <span className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  {result.message}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0"
                  onClick={() => setResult(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={handleExport}
                disabled={isLoading}
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
              <Button
                onClick={handleUploadClick}
                disabled={isLoading}
                size="lg"
                variant="outline"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                City: <strong>{cityName || cityId}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </Page>
  );
}
