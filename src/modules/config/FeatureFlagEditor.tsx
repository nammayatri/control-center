/**
 * Feature Flag Editor Component
 * 
 * Business-friendly UI for editing feature flags with dropdowns.
 * Handles city-based JSON structure where cities are keys within the JSON.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Settings, ToggleLeft, MapPin, ChevronDown, ChevronRight, Truck } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';

// ============================================
// Types
// ============================================

interface FeatureFlagField {
  key: string;
  label: string;
  type: 'boolean' | 'string' | 'number' | 'object';
}

interface FeatureFlagConfig {
  parameterKey: string;
  displayName: string;
  description: string;
  section: 'appLevel' | 'homescreen';
  fields: FeatureFlagField[];
  icon?: 'settings' | 'truck';
}

// ============================================
// Feature Flag Definitions
// ============================================

// Define the fields for new_feature_flags parameter based on actual data
const NEW_FEATURE_FLAGS_FIELDS: FeatureFlagField[] = [
  { key: 'enableLocationUnserviceable', label: 'Enable Location Unserviceable', type: 'boolean' },
  { key: 'preSelectedSmartTip', label: 'Pre-selected Smart Tip', type: 'boolean' },
  { key: 'enableGreeting', label: 'Enable Greeting', type: 'boolean' },
  { key: 'slowNetworkToastThreshHold', label: 'Slow Network Toast Threshold', type: 'number' },
  { key: 'enablePetRide', label: 'Enable Pet Ride', type: 'boolean' },
  { key: 'appUpdateMethod', label: 'App Update Method', type: 'string' },
  { key: 'lookingForRidesTipEnabled', label: 'Looking For Rides Tip Enabled', type: 'boolean' },
  { key: 'shouldShowDefaultTips', label: 'Should Show Default Tips', type: 'boolean' },
  { key: 'enableMultimodal', label: 'Enable Multimodal', type: 'boolean' },
  { key: 'showPublicTransportAboveEstimates', label: 'Show Public Transport Above Estimates', type: 'boolean' },
  { key: 'enableKaptureHelpSupport', label: 'Enable Kapture Help Support', type: 'boolean' },
  { key: 'showNammaTransitOnTop', label: 'Show Namma Transit On Top', type: 'boolean' },
  { key: 'enableHyperUPI', label: 'Enable Hyper UPI', type: 'boolean' },
  { key: 'enablePickupInstructions', label: 'Enable Pickup Instructions', type: 'boolean' },
  { key: 'enablePickupInstructionsNewPill', label: 'Enable Pickup Instructions New Pill', type: 'boolean' },
  { key: 'pickupInstructionsMaxEditCount', label: 'Pickup Instructions Max Edit Count', type: 'number' },
  { key: 'pickupInstructionsCharLimit', label: 'Pickup Instructions Char Limit', type: 'number' },
  { key: 'audioRecordingTimeLimit', label: 'Audio Recording Time Limit', type: 'number' },
  { key: 'enableDriverPickupETA', label: 'Enable Driver Pickup ETA', type: 'boolean' },
  { key: 'showSeparateNammaTransit', label: 'Show Separate Namma Transit', type: 'boolean' },
  { key: 'enableAddStop', label: 'Enable Add Stop', type: 'boolean' },
  { key: 'toggleQRtoOtpFlow', label: 'Toggle QR to OTP Flow', type: 'boolean' },
  { key: 'passEnabled', label: 'Pass Enabled', type: 'boolean' },
  { key: 'enableUserRateCard', label: 'Enable User Rate Card', type: 'boolean' },
  { key: 'multimodalTrackWithoutBooking', label: 'Multimodal Track Without Booking', type: 'boolean' },
];

// Defined parameters configuration - only for simple flag-based configs
// enabled_services_v3 has its own specialized editor (ServicesEditor)
// Note: Exported at the end of the file to fix fast refresh warning
const DEFINED_PARAMETERS: FeatureFlagConfig[] = [
  {
    parameterKey: 'new_feature_flags',
    displayName: 'Feature Flags',
    description: 'Control feature visibility and availability across the app',
    section: 'appLevel',
    fields: NEW_FEATURE_FLAGS_FIELDS,
    icon: 'settings',
  },
];

// ============================================
// Boolean Field Editor
// ============================================

interface BooleanFieldEditorProps {
  fieldKey: string;
  label: string;
  value: boolean | undefined;
  originalValue: boolean | undefined;
  onChange: (value: boolean) => void;
}

function BooleanFieldEditor({ fieldKey, label, value, originalValue, onChange }: Readonly<BooleanFieldEditorProps>) {
  const isChanged = value !== originalValue;
  const displayValue = value ?? false;

  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${isChanged ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border bg-background'}`}>
      <div className="flex-1">
        <div className="font-medium text-sm flex items-center gap-2">
          {label}
          {isChanged && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
              Modified
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{fieldKey}</div>
      </div>
      <Select
        value={displayValue ? 'true' : 'false'}
        onValueChange={(v) => onChange(v === 'true')}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">
            <span className="text-green-600 font-medium">True</span>
          </SelectItem>
          <SelectItem value="false">
            <span className="text-red-600 font-medium">False</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================
// Number/String Field Editor
// ============================================

interface FieldEditorProps {
  fieldKey: string;
  label: string;
  value: string | number | undefined;
  originalValue: string | number | undefined;
  type: 'string' | 'number';
  onChange: (value: string | number) => void;
}

function FieldEditor({ fieldKey, label, value, originalValue, type, onChange }: Readonly<FieldEditorProps>) {
  const isChanged = value !== originalValue;
  const displayValue = value ?? '';

  return (
    <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${isChanged ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border bg-background'}`}>
      <div className="flex-1">
        <div className="font-medium text-sm flex items-center gap-2">
          {label}
          {isChanged && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
              Modified
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{fieldKey}</div>
      </div>
      <Input
        type={type === 'number' ? 'number' : 'text'}
        value={displayValue}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-[200px]"
      />
    </div>
  );
}

// ============================================
// Feature Flag Editor Component (City-based structure)
// ============================================

interface FeatureFlagEditorProps {
  config: FeatureFlagConfig;
  parameterValue: string;
  originalValue: string;
  onUpdate: (newValue: string) => void;
  // Firebase condition support
  firebaseCondition?: string; // Current Firebase condition being edited (e.g., 'default' or condition name)
  firebaseConditions?: Array<{ name: string; expression: string }>; // Available Firebase conditions
  onFirebaseConditionChange?: (condition: string) => void;
}

export function FeatureFlagEditor({
  config,
  parameterValue,
  originalValue,
  onUpdate,
  firebaseCondition = 'default',
  firebaseConditions = [],
  onFirebaseConditionChange,
}: Readonly<FeatureFlagEditorProps>) {
  // Parse JSON values - handle city-based structure
  const parsedValue = useMemo(() => {
    try {
      return JSON.parse(parameterValue || '{}');
    } catch {
      return {};
    }
  }, [parameterValue]);

  const parsedOriginal = useMemo(() => {
    try {
      return JSON.parse(originalValue || '{}');
    } catch {
      return {};
    }
  }, [originalValue]);

  // Get available cities from the JSON
  const availableCities = useMemo(() => {
    return Object.keys(parsedValue).filter(key => typeof parsedValue[key] === 'object');
  }, [parsedValue]);

  // State for selected city
  const [selectedCity, setSelectedCity] = useState<string>('default');

  // Get current city's values (wrapped in useMemo to prevent dependency issues)
  const cityValues = useMemo(() => 
    parsedValue[selectedCity] || parsedValue['default'] || {}, 
    [parsedValue, selectedCity]
  );
  const originalCityValues = useMemo(() => 
    parsedOriginal[selectedCity] || parsedOriginal['default'] || {}, 
    [parsedOriginal, selectedCity]
  );

  // Handle field update
  const handleFieldUpdate = (fieldKey: string, newFieldValue: boolean | string | number) => {
    const updated = {
      ...parsedValue,
      [selectedCity]: {
        ...parsedValue[selectedCity],
        [fieldKey]: newFieldValue
      }
    };
    onUpdate(JSON.stringify(updated));
  };

  // Count changes across ALL cities (aggregate)
  const changedCount = useMemo(() => {
    let count = 0;
    const allCities = Object.keys(parsedValue).filter(key => typeof parsedValue[key] === 'object');
    
    for (const city of allCities) {
      const cityVals = parsedValue[city] || {};
      const originalCityVals = parsedOriginal[city] || {};
      
      for (const field of config.fields) {
        if (cityVals[field.key] !== originalCityVals[field.key]) {
          count++;
        }
      }
    }
    return count;
  }, [parsedValue, parsedOriginal, config.fields]);

  // Get defined fields that exist in current city
  const displayFields = useMemo(() => {
    const existingKeys = new Set(Object.keys(cityValues));
    return config.fields.filter(f => existingKeys.has(f.key));
  }, [config.fields, cityValues]);

  // State for collapsible
  const [isOpen, setIsOpen] = useState(false);

  // Get the right icon
  const IconComponent = config.icon === 'truck' ? Truck : Settings;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {config.displayName}
                  </CardTitle>
                  <CardDescription className="mt-1">{config.description}</CardDescription>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    Parameter: {config.parameterKey}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {changedCount > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {changedCount} Modified
                  </Badge>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Firebase Condition Selector */}
            {firebaseConditions.length > 0 && onFirebaseConditionChange && (
              <div className="flex items-center gap-4 pb-4 border-b bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  Firebase Condition:
                </span>
                <Select value={firebaseCondition} onValueChange={onFirebaseConditionChange}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      <span className="font-medium">Default (No Condition)</span>
                    </SelectItem>
                    {firebaseConditions.map((condition) => (
                      <SelectItem key={condition.name} value={condition.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{condition.name}</span>
                          <span className="text-xs text-muted-foreground">{condition.expression}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  {firebaseCondition === 'default' ? 'Editing Default Value' : `Editing: ${firebaseCondition}`}
                </Badge>
              </div>
            )}

            {/* City Selector */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <span className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City:
              </span>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select city..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === 'default' ? 'Default (All Cities)' : city.charAt(0).toUpperCase() + city.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Feature Flags Grid */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <ToggleLeft className="h-4 w-4" />
                Feature Toggles ({displayFields.length} fields)
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto">
                {displayFields.map((field) => {
                  if (field.type === 'boolean') {
                    return (
                      <BooleanFieldEditor
                        key={field.key}
                        fieldKey={field.key}
                        label={field.label}
                        value={cityValues[field.key]}
                        originalValue={originalCityValues[field.key]}
                        onChange={(v) => handleFieldUpdate(field.key, v)}
                      />
                    );
                  }
                  if (field.type === 'number' || field.type === 'string') {
                    return (
                      <FieldEditor
                        key={field.key}
                        fieldKey={field.key}
                        label={field.label}
                        value={cityValues[field.key]}
                        originalValue={originalCityValues[field.key]}
                        type={field.type}
                        onChange={(v) => handleFieldUpdate(field.key, v)}
                      />
                    );
                  }
                  // Skip object/complex types for now
                  return null;
                })}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================
// Section Component
// ============================================

interface DefinedSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function DefinedSection({ title, description, children }: Readonly<DefinedSectionProps>) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Export DEFINED_PARAMETERS at the end to fix fast refresh warning
// (Fast refresh only works when a file only exports components)
export { DEFINED_PARAMETERS };
