import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { X, Save, Trash2, MapIcon, Upload } from 'lucide-react';
import { GateListEditor } from './GateEditor';
import type { SpecialLocationFull, GateInfoFull, SpecialLocationType } from '../types/specialLocation';
import { parseKmlToLeafletCoords, leafletCoordsToGeoJson } from '../lib/geoUtils';

const LOCATION_TYPES: SpecialLocationType[] = ['Open', 'Closed'];

export interface SpecialLocationEditorProps {
  location: SpecialLocationFull | null;
  isNew?: boolean;
  isOpen: boolean;
  availableCategories: string[]; // Dynamic categories from API
  pickingCoordsForGateId?: string; // Gate ID currently picking coords for
  onClose: () => void;
  onSave: (location: SpecialLocationFull, isNew: boolean, enabled: boolean) => void;
  onLocationChange?: (location: SpecialLocationFull) => void; // Sync changes back to parent
  onDelete?: (locationId: string) => void;
  onLocateGate: (gateId: string) => void;
  onDrawPolygon: () => void;
  onPickCoordsForGate: (gateId: string | undefined) => void;
}

export function SpecialLocationEditor({
  location,
  isNew = false,
  isOpen,
  availableCategories,
  pickingCoordsForGateId,
  onClose,
  onSave,
  onLocationChange,
  onDelete,
  onLocateGate,
  onDrawPolygon,
  onPickCoordsForGate,
}: Readonly<SpecialLocationEditorProps>) {
  const [editedLocation, setEditedLocation] = useState<SpecialLocationFull | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const lastLocationId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (location) {
      setEditedLocation({ ...location });
      setEnabled(true);

      // Only re-calculate isCustomCategory if the location identity changed
      if (location.id !== lastLocationId.current) {
        const isCustom = location.category !== '' && !availableCategories.includes(location.category);
        setIsCustomCategory(isCustom);
        lastLocationId.current = location.id;
      }
    } else {
      setEditedLocation(null);
      setIsCustomCategory(false);
      lastLocationId.current = null;
    }
  }, [location, availableCategories]);

  if (!isOpen || !editedLocation) return null;

  const handleFieldChange = <K extends keyof SpecialLocationFull>(
    field: K,
    value: SpecialLocationFull[K]
  ) => {
    const updated = { ...editedLocation, [field]: value };
    setEditedLocation(updated);
    // Sync to parent immediately so polygon drawing works with latest data
    onLocationChange?.(updated);
  };

  const handleGatesChange = (gates: GateInfoFull[]) => {
    const updated = {
      ...editedLocation,
      gatesInfo: gates,
      gates: gates.map(g => ({
        point: g.point,
        name: g.name,
        address: g.address,
      })),
    };
    setEditedLocation(updated);
    // Sync to parent immediately so coord picking works with latest data
    onLocationChange?.(updated);
  };

  const handleSave = () => {
    if (editedLocation.locationName.trim()) {
      onSave({ ...editedLocation }, isNew, enabled);
    }
  };

  const handleDisable = () => {
    setEnabled(false);
    // Save with enabled=false - will disable in backend
    onSave({ ...editedLocation }, isNew, false);
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {isNew ? 'New Special Location' : 'Edit Location'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".kml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (content) {
                const coords = parseKmlToLeafletCoords(content);
                if (coords.length > 0) {
                  const geoJson = JSON.stringify({
                    type: 'Polygon',
                    coordinates: leafletCoordsToGeoJson(coords)
                  });
                  handleFieldChange('geoJson', geoJson);
                }
              }
            };
            reader.readAsText(file);
            // Reset input so same file can be uploaded again
            e.target.value = '';
          }
        }}
      />

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="location-name">Location Name *</Label>
              <Input
                id="location-name"
                value={editedLocation.locationName}
                onChange={(e) => handleFieldChange('locationName', e.target.value)}
                placeholder="Enter location name"
              />
            </div>

            <div className={`grid ${isCustomCategory ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              <div className="space-y-1.5">
                <Label htmlFor="location-type">Type</Label>
                <Select
                  value={editedLocation.locationType}
                  onValueChange={(v) => handleFieldChange('locationType', v as SpecialLocationType)}
                >
                  <SelectTrigger id="location-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isCustomCategory && (
                <div className="space-y-1.5">
                  <Label htmlFor="location-category">Category</Label>
                  <Select
                    value={editedLocation.category}
                    onValueChange={(v) => {
                      if (v === 'custom') {
                        setIsCustomCategory(true);
                        handleFieldChange('category', '');
                      } else {
                        handleFieldChange('category', v);
                      }
                    }}
                  >
                    <SelectTrigger id="location-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-primary font-medium">
                        + Add Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isCustomCategory && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-category">Custom Category Name</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary"
                    onClick={() => {
                      setIsCustomCategory(false);
                      handleFieldChange('category', availableCategories[0] || '');
                    }}
                  >
                    Use Existing
                  </Button>
                </div>
                <Input
                  id="custom-category"
                  value={editedLocation.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="e.g. SureBusinessPark"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Polygon Info */}
          <div className="space-y-2">
            <Label>Location Boundary</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-sm text-muted-foreground border rounded-md px-3 py-2">
                {editedLocation.geoJson ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <MapIcon className="h-4 w-4" />
                    Polygon defined
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No boundary drawn
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={onDrawPolygon}>
                  <MapIcon className="h-4 w-4 mr-1" />
                  {editedLocation.geoJson ? 'Redraw' : 'Draw'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch
              id="location-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="location-enabled" className="flex-1">
              Location Enabled
              <p className="text-xs text-muted-foreground font-normal">
                Disabled locations won't be visible to users
              </p>
            </Label>
          </div>

          {/* Gates Section */}
          <div className="border-t pt-4">
            <GateListEditor
              gates={editedLocation.gatesInfo}
              pickingCoordsForGateId={pickingCoordsForGateId}
              onGatesChange={handleGatesChange}
              onLocateGate={onLocateGate}
              onPickCoordsForGate={onPickCoordsForGate}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!editedLocation.locationName.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {isNew ? 'Create Location' : 'Save Changes'}
        </Button>
        {!isNew && onDelete && (
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleDisable}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Disable Location
          </Button>
        )}
      </div>
    </div>
  );
}
