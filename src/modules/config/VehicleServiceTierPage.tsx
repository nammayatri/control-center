import { useState, useEffect } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Switch } from '../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
  getVehicleServiceTierConfig,
  updateVehicleServiceTierConfig,
  type VehicleServiceTierConfig,
  type VehicleServiceTierUpdateRequest,
} from '../../services/config';
import { handleApiError } from '../../services/api';
import {
  Car,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  LogIn,
  Pencil,
  RefreshCw,
  X,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Service tier type options
const SERVICE_TIER_TYPES = [
  'AUTO_RICKSHAW',
  'SEDAN',
  'SUV',
  'HATCHBACK',
  'TAXI',
  'TAXI_PLUS',
  'PREMIUM_SEDAN',
  'BLACK',
  'BLACK_XL',
  'BIKE',
  'DELIVERY_BIKE',
  'AMBULANCE_TAXI',
  'AMBULANCE_TAXI_OXY',
  'AMBULANCE_AC',
  'AMBULANCE_AC_OXY',
  'AMBULANCE_VENTILATOR',
  'SUV_PLUS',
];

// Edit Dialog Component
interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: VehicleServiceTierConfig | null;
  onSave: (data: VehicleServiceTierUpdateRequest) => Promise<void>;
  isSaving: boolean;
}

function EditDialog({ open, onOpenChange, config, onSave, isSaving }: EditDialogProps) {
  const [formData, setFormData] = useState<VehicleServiceTierUpdateRequest>({});

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        shortDescription: config.shortDescription,
        longDescription: config.longDescription,
        seatingCapacity: config.seatingCapacity,
        priority: config.priority,
        isAirConditioned: config.isAirConditioned,
        airConditionedThreshold: config.airConditionedThreshold,
        driverRating: config.driverRating,
        vehicleRating: config.vehicleRating,
        fareAdditionPerKmOverBaseServiceTier: config.fareAdditionPerKmOverBaseServiceTier,
        isIntercityEnabled: config.isIntercityEnabled,
        isRentalsEnabled: config.isRentalsEnabled,
        baseVehicleServiceTier: config.baseVehicleServiceTier,
        luggageCapacity: config.luggageCapacity,
        oxygen: config.oxygen,
        ventilator: config.ventilator,
        stopFcmThreshold: config.stopFcmThreshold,
        stopFcmSuppressCount: config.stopFcmSuppressCount,
        vehicleIconUrl: config.vehicleIconUrl,
        allowedVehicleVariant: config.allowedVehicleVariant,
        autoSelectedVehicleVariant: config.autoSelectedVehicleVariant,
        defaultForVehicleVariant: config.defaultForVehicleVariant,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const updateField = <K extends keyof VehicleServiceTierUpdateRequest>(
    field: K,
    value: VehicleServiceTierUpdateRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Edit {config.name}
          </DialogTitle>
          <DialogDescription>
            Service Tier: {config.serviceTierType.replace(/_/g, ' ')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority ?? ''}
                onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription || ''}
              onChange={(e) => updateField('shortDescription', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">Long Description</Label>
            <Input
              id="longDescription"
              value={formData.longDescription || ''}
              onChange={(e) => updateField('longDescription', e.target.value)}
            />
          </div>

          {/* Capacity & Ratings */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seatingCapacity">Seating Capacity</Label>
              <Input
                id="seatingCapacity"
                type="number"
                value={formData.seatingCapacity ?? ''}
                onChange={(e) => updateField('seatingCapacity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverRating">Driver Rating</Label>
              <Input
                id="driverRating"
                type="number"
                step="0.1"
                value={formData.driverRating ?? ''}
                onChange={(e) => updateField('driverRating', parseFloat(e.target.value) || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleRating">Vehicle Rating</Label>
              <Input
                id="vehicleRating"
                type="number"
                step="0.1"
                value={formData.vehicleRating ?? ''}
                onChange={(e) => updateField('vehicleRating', parseFloat(e.target.value) || null)}
              />
            </div>
          </div>

          {/* Fare & AC Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fareAddition">Fare Addition Per KM</Label>
              <Input
                id="fareAddition"
                type="number"
                value={formData.fareAdditionPerKmOverBaseServiceTier ?? ''}
                onChange={(e) =>
                  updateField('fareAdditionPerKmOverBaseServiceTier', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airConditionedThreshold">AC Threshold</Label>
              <Input
                id="airConditionedThreshold"
                type="number"
                value={formData.airConditionedThreshold ?? ''}
                onChange={(e) =>
                  updateField('airConditionedThreshold', parseInt(e.target.value) || null)
                }
              />
            </div>
          </div>

          {/* Medical Equipment */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="luggageCapacity">Luggage Capacity</Label>
              <Input
                id="luggageCapacity"
                type="number"
                value={formData.luggageCapacity ?? ''}
                onChange={(e) => updateField('luggageCapacity', parseInt(e.target.value) || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oxygen">Oxygen</Label>
              <Input
                id="oxygen"
                type="number"
                value={formData.oxygen ?? ''}
                onChange={(e) => updateField('oxygen', parseInt(e.target.value) || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ventilator">Ventilator</Label>
              <Input
                id="ventilator"
                type="number"
                value={formData.ventilator ?? ''}
                onChange={(e) => updateField('ventilator', parseInt(e.target.value) || null)}
              />
            </div>
          </div>

          {/* FCM Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopFcmThreshold">Stop FCM Threshold</Label>
              <Input
                id="stopFcmThreshold"
                type="number"
                value={formData.stopFcmThreshold ?? ''}
                onChange={(e) => updateField('stopFcmThreshold', parseInt(e.target.value) || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopFcmSuppressCount">Stop FCM Suppress Count</Label>
              <Input
                id="stopFcmSuppressCount"
                type="number"
                value={formData.stopFcmSuppressCount ?? ''}
                onChange={(e) =>
                  updateField('stopFcmSuppressCount', parseInt(e.target.value) || null)
                }
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="isAirConditioned">Air Conditioned</Label>
              <Switch
                id="isAirConditioned"
                checked={formData.isAirConditioned ?? false}
                onCheckedChange={(checked) => updateField('isAirConditioned', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="baseVehicleServiceTier">Base Service Tier</Label>
              <Switch
                id="baseVehicleServiceTier"
                checked={formData.baseVehicleServiceTier ?? false}
                onCheckedChange={(checked) => updateField('baseVehicleServiceTier', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="isIntercityEnabled">Intercity Enabled</Label>
              <Switch
                id="isIntercityEnabled"
                checked={formData.isIntercityEnabled ?? false}
                onCheckedChange={(checked) => updateField('isIntercityEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="isRentalsEnabled">Rentals Enabled</Label>
              <Switch
                id="isRentalsEnabled"
                checked={formData.isRentalsEnabled ?? false}
                onCheckedChange={(checked) => updateField('isRentalsEnabled', checked)}
              />
            </div>
          </div>

          {/* Vehicle Icon URL */}
          <div className="space-y-2">
            <Label htmlFor="vehicleIconUrl">Vehicle Icon URL</Label>
            <Input
              id="vehicleIconUrl"
              value={formData.vehicleIconUrl || ''}
              onChange={(e) => updateField('vehicleIconUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export function VehicleServiceTierPage() {
  const { merchantId, cityId } = useDashboardContext();
  const { loginModule, logout } = useAuth();
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<VehicleServiceTierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [editingConfig, setEditingConfig] = useState<VehicleServiceTierConfig | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const hasAccess = loginModule === 'BPP';

  const fetchConfigs = async () => {
    if (!merchantId || !cityId || cityId === 'all') return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getVehicleServiceTierConfig(
        merchantId,
        cityId,
        filterType !== 'all' ? filterType : undefined
      );
      setConfigs(data);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [merchantId, cityId, filterType]);

  const handleEdit = (config: VehicleServiceTierConfig) => {
    setEditingConfig(config);
    setEditDialogOpen(true);
  };

  const handleSave = async (data: VehicleServiceTierUpdateRequest) => {
    if (!merchantId || !cityId || !editingConfig) return;

    setIsSaving(true);
    try {
      await updateVehicleServiceTierConfig(merchantId, cityId, editingConfig.serviceTierType, data);
      toast.success('Vehicle service tier updated successfully');
      setEditDialogOpen(false);
      await fetchConfigs(); // Refresh the list
    } catch (err) {
      const message = handleApiError(err);
      toast.error(`Failed to update: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasAccess) {
    return (
      <Page>
        <PageHeader
          title="Vehicle Service Tier"
          breadcrumbs={[
            { label: 'Config', href: '/config' },
            { label: 'Vehicle Service Tier' },
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
                Vehicle Service Tier management requires <strong>Driver (BPP)</strong> login.
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
        <PageHeader title="Vehicle Service Tier" />
        <PageContent>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Please select a merchant and a specific city to manage vehicle service tiers.
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
        title="Vehicle Service Tier"
        description="Manage vehicle service tier configurations for this city"
        breadcrumbs={[{ label: 'Config', href: '/config' }, { label: 'Vehicle Service Tier' }]}
      />
      <PageContent>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Service Tier Configurations
                </CardTitle>
                <CardDescription>
                  View and edit vehicle service tier settings for different vehicle types.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {SERVICE_TIER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={fetchConfigs} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 rounded-lg mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0"
                  onClick={() => setError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vehicle service tiers found.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Seats</TableHead>
                      <TableHead className="text-center">Priority</TableHead>
                      <TableHead className="text-center">Base Tier</TableHead>
                      <TableHead className="text-center">AC</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.serviceTierType}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {config.serviceTierType.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {config.vehicleCategory?.replace(/_/g, ' ') || '-'}
                        </TableCell>
                        <TableCell className="text-center">{config.seatingCapacity}</TableCell>
                        <TableCell className="text-center">{config.priority}</TableCell>
                        <TableCell className="text-center">
                          {config.baseVehicleServiceTier ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {config.isAirConditioned ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : config.isAirConditioned === false ? (
                            <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <EditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          config={editingConfig}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </PageContent>
    </Page>
  );
}
