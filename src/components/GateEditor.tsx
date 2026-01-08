import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Plus, GripVertical, MapPin, Target, Crosshair } from 'lucide-react';
import type { GateInfoFull, LatLong, GateType } from '../types/specialLocation';

export interface GateEditorProps {
  gate: GateInfoFull;
  isNew?: boolean;
  isPickingCoords?: boolean; // True if currently picking coords for this gate
  onUpdate: (gate: GateInfoFull) => void;
  onDelete: () => void;
  onLocateOnMap: () => void;
  onPickFromMap: () => void;
}

export function GateEditor({
  gate,
  isNew = false,
  isPickingCoords = false,
  onUpdate,
  onDelete,
  onLocateOnMap,
  onPickFromMap,
}: Readonly<GateEditorProps>) {
  const [isExpanded, setIsExpanded] = useState(isNew || isPickingCoords);

  // Keep expanded when picking coords for this gate
  const shouldBeExpanded = isExpanded || isPickingCoords;

  const handleFieldChange = <K extends keyof GateInfoFull>(
    field: K,
    value: GateInfoFull[K]
  ) => {
    onUpdate({ ...gate, [field]: value });
  };

  const handlePointChange = (field: keyof LatLong, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({
        ...gate,
        point: { ...gate.point, [field]: numValue },
      });
    }
  };

  return (
    <Card className={`border ${isNew ? 'border-blue-500 border-dashed' : ''}`}>
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {gate.gateType === 'Pickup' ? (
            <MapPin className="h-4 w-4 text-green-500" />
          ) : (
            <Target className="h-4 w-4 text-orange-500" />
          )}
          <CardTitle className="text-sm flex-1">
            {gate.name || 'New Gate'}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {gate.gateType}
          </span>
        </div>
      </CardHeader>

      {shouldBeExpanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`gate-name-${gate.id}`}>Gate Name *</Label>
              <Input
                id={`gate-name-${gate.id}`}
                value={gate.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter gate name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`gate-type-${gate.id}`}>Type</Label>
              <Select
                value={gate.gateType}
                onValueChange={(v) => handleFieldChange('gateType', v as GateType)}
              >
                <SelectTrigger id={`gate-type-${gate.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                  <SelectItem value="Drop">Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`gate-address-${gate.id}`}>Address</Label>
            <Input
              id={`gate-address-${gate.id}`}
              value={gate.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Enter address"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Coordinates</Label>
              <Button
                variant={isPickingCoords ? 'default' : 'outline'}
                size="sm"
                onClick={onPickFromMap}
                className="h-7 text-xs gap-1"
              >
                <Crosshair className="h-3 w-3" />
                {isPickingCoords ? 'Click on map...' : 'Pick from Map'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`gate-lat-${gate.id}`} className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  id={`gate-lat-${gate.id}`}
                  type="number"
                  step="0.000001"
                  value={gate.point.lat}
                  onChange={(e) => handlePointChange('lat', e.target.value)}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor={`gate-lon-${gate.id}`} className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  id={`gate-lon-${gate.id}`}
                  type="number"
                  step="0.000001"
                  value={gate.point.lon}
                  onChange={(e) => handlePointChange('lon', e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`gate-extra-${gate.id}`}>Driver Extra (₹)</Label>
              <Input
                id={`gate-extra-${gate.id}`}
                type="number"
                value={gate.defaultDriverExtra || 0}
                onChange={(e) =>
                  handleFieldChange('defaultDriverExtra', parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id={`gate-queue-${gate.id}`}
                checked={gate.canQueueUpOnGate}
                onCheckedChange={(checked) =>
                  handleFieldChange('canQueueUpOnGate', checked)
                }
              />
              <Label htmlFor={`gate-queue-${gate.id}`} className="text-sm">
                Can Queue Up
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onLocateOnMap}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Locate on Map
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export interface GateListEditorProps {
  gates: GateInfoFull[];
  pickingCoordsForGateId?: string; // Gate ID currently picking coords for
  onGatesChange: (gates: GateInfoFull[]) => void;
  onLocateGate: (gateId: string) => void;
  onPickCoordsForGate: (gateId: string) => void;
}

export function GateListEditor({
  gates,
  pickingCoordsForGateId,
  onGatesChange,
  onLocateGate,
  onPickCoordsForGate,
}: Readonly<GateListEditorProps>) {
  const handleAddGate = () => {
    const newGate: GateInfoFull = {
      id: `new-${Date.now()}`,
      specialLocationId: '',
      name: '',
      gateType: 'Pickup',
      point: { lat: 0, lon: 0 },
      canQueueUpOnGate: false,
    };
    onGatesChange([...gates, newGate]);
  };

  const handleUpdateGate = (index: number, updatedGate: GateInfoFull) => {
    const newGates = [...gates];
    newGates[index] = updatedGate;
    onGatesChange(newGates);
  };

  const handleDeleteGate = (index: number) => {
    const newGates = gates.filter((_, i) => i !== index);
    onGatesChange(newGates);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Gates ({gates.length})</h4>
        <Button variant="outline" size="sm" onClick={handleAddGate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Gate
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {gates.map((gate, index) => (
          <GateEditor
            key={gate.id}
            gate={gate}
            isNew={gate.id.startsWith('new-')}
            isPickingCoords={pickingCoordsForGateId === gate.id}
            onUpdate={(updated) => handleUpdateGate(index, updated)}
            onDelete={() => handleDeleteGate(index)}
            onLocateOnMap={() => onLocateGate(gate.id)}
            onPickFromMap={() => onPickCoordsForGate(gate.id)}
          />
        ))}
        {gates.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
            No gates added. Click "Add Gate" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
