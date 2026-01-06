/**
 * Services Editor Component
 * 
 * Specialized editor for enabled_services_v3 which has a complex structure:
 * - services: Array of service objects
 * - mainServiceTag: string
 * 
 * Each service has: serviceTag, allowGrow, category, tag, onClick
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

import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Truck, MapPin, ChevronDown, ChevronRight, Settings, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { Button } from '../../components/ui/button';
import { ServicesPreview } from './ServicesPreview';

// ============================================
// Types
// ============================================

interface ServiceTag {
  type: string;
  text: string;
  bgColor: string;
  textColor: string;
}

interface ServiceOnClick {
  actionName: string;
  actionData?: string;
}

interface Service {
  serviceTag: string;
  allowGrow: boolean;
  category: string;
  serviceImageUrl?: string;
  tag?: ServiceTag;
  onClick?: ServiceOnClick;
}

interface CityServices {
  services: Service[];
  mainServiceTag: string;
}

// Available service tags


const CATEGORIES = ['PRIVATE', 'PUBLIC'];

// ============================================
// Service Row Component
// ============================================

interface ServiceRowProps {
  service: Service;
  index: number;
  onUpdate: (updated: Service) => void;
  onDelete: () => void;
  isMainService: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

// Available action names for onClick
const ACTION_NAMES = [
  'showNammaTransitPopup',
  'navigateToStage',
  'showPopup',
  'openUrl',
  'none',
];

function ServiceRow({ 
  service, 
  index,
  onUpdate, 
  onDelete, 
  isMainService,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: Readonly<ServiceRowProps>) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle tag update
  const handleTagUpdate = (field: keyof ServiceTag, value: string) => {
    const newTag = {
      type: service.tag?.type || 'text',
      text: service.tag?.text || 'NEW',
      bgColor: service.tag?.bgColor || '#8F26FF',
      textColor: service.tag?.textColor || '#FFFFFF',
      [field]: value,
    };
    onUpdate({ ...service, tag: newTag });
  };

  // Handle onClick update
  const handleOnClickUpdate = (field: keyof ServiceOnClick, value: string) => {
    if (value === 'none' || (field === 'actionName' && !value)) {
      // Remove onClick if action is none
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onClick: _, ...rest } = service;
      onUpdate(rest);
      return;
    }
    const newOnClick = {
      actionName: service.onClick?.actionName || '',
      actionData: service.onClick?.actionData,
      [field]: value || undefined,
    };
    // Clean up undefined actionData
    if (!newOnClick.actionData) {
      delete newOnClick.actionData;
    }
    onUpdate({ ...service, onClick: newOnClick });
  };

  // Remove tag
  const handleRemoveTag = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tag: _, ...rest } = service;
    onUpdate(rest);
  };

  // Add tag
  const handleAddTag = () => {
    onUpdate({
      ...service,
      tag: {
        type: 'text',
        text: 'NEW',
        bgColor: '#8F26FF',
        textColor: '#FFFFFF',
      },
    });
  };

  return (
    <div 
      className={`rounded-lg border transition-all ${
        isMainService ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'
      } ${isDragging ? 'opacity-50 scale-95' : ''} ${
        isDragOver ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-950/20' : ''
      }`}
      role="listitem"
      tabIndex={0}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 p-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        
        {/* Service Tag */}
        <div className="flex-1">
          <div className="font-medium text-sm flex items-center gap-2">
            {service.serviceTag}
            {isMainService && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                Main
              </Badge>
            )}
            {service.tag && (
              <Badge 
                style={{ backgroundColor: service.tag.bgColor, color: service.tag.textColor }}
                className="text-xs"
              >
                {service.tag.text}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {service.category} • {service.onClick?.actionName || 'No action'}
          </div>
        </div>

        {/* Allow Grow Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Grow:</span>
          <Switch
            checked={service.allowGrow}
            onCheckedChange={(checked) => onUpdate({ ...service, allowGrow: checked })}
          />
        </div>

        {/* Category Select */}
        <Select
          value={service.category}
          onValueChange={(value) => onUpdate({ ...service, category: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Expand Button */}
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {/* Delete Button */}
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="border-t p-3 bg-muted/20 space-y-4">
          {/* Tag Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tag Badge</span>
              {service.tag ? (
                <Button variant="outline" size="sm" onClick={handleRemoveTag}>
                  Remove Tag
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleAddTag}>
                  Add Tag
                </Button>
              )}
            </div>
            {service.tag && (
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label htmlFor={`tag-text-${index}`} className="text-xs text-muted-foreground">Text</label>
                  <input
                    id={`tag-text-${index}`}
                    type="text"
                    value={service.tag.text}
                    onChange={(e) => handleTagUpdate('text', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label htmlFor={`tag-type-${index}`} className="text-xs text-muted-foreground">Type</label>
                  <input
                    id={`tag-type-${index}`}
                    type="text"
                    value={service.tag.type}
                    onChange={(e) => handleTagUpdate('type', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label htmlFor={`tag-bgcolor-${index}`} className="text-xs text-muted-foreground">Bg Color</label>
                  <div className="flex gap-1">
                    <input
                      id={`tag-bgcolor-${index}`}
                      type="color"
                      value={service.tag.bgColor}
                      onChange={(e) => handleTagUpdate('bgColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={service.tag.bgColor}
                      onChange={(e) => handleTagUpdate('bgColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      aria-label="Background color hex value"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`tag-textcolor-${index}`} className="text-xs text-muted-foreground">Text Color</label>
                  <div className="flex gap-1">
                    <input
                      id={`tag-textcolor-${index}`}
                      type="color"
                      value={service.tag.textColor}
                      onChange={(e) => handleTagUpdate('textColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={service.tag.textColor}
                      onChange={(e) => handleTagUpdate('textColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      aria-label="Text color hex value"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* onClick Section */}
          <div className="space-y-2">
            <span className="text-sm font-medium">On Click Action</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`action-name-${index}`} className="text-xs text-muted-foreground">Action Name</label>
                <Select
                  value={service.onClick?.actionName || 'none'}
                  onValueChange={(value) => handleOnClickUpdate('actionName', value)}
                >
                  <SelectTrigger id={`action-name-${index}`}>
                    <SelectValue placeholder="Select action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_NAMES.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action === 'none' ? 'No Action' : action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor={`action-data-${index}`} className="text-xs text-muted-foreground">Action Data (optional)</label>
                <input
                  id={`action-data-${index}`}
                  type="text"
                  value={service.onClick?.actionData || ''}
                  onChange={(e) => handleOnClickUpdate('actionData', e.target.value)}
                  placeholder="e.g., Search"
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Services Editor Component
// ============================================

interface ServicesEditorProps {
  parameterValue: string;
  originalValue: string;
  onUpdate: (newValue: string) => void;
  firebaseCondition?: string;
  firebaseConditions?: Array<{ name: string; expression: string }>;
  onFirebaseConditionChange?: (condition: string) => void;
}

export function ServicesEditor({
  parameterValue,
  originalValue,
  onUpdate,
  firebaseCondition = 'default',
  firebaseConditions = [],
  onFirebaseConditionChange,
}: Readonly<ServicesEditorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('bangalore');

  // Parse JSON values
  const parsedValue = useMemo(() => {
    try {
      return JSON.parse(parameterValue || '{}') as Record<string, CityServices>;
    } catch {
      return {};
    }
  }, [parameterValue]);

  const parsedOriginal = useMemo(() => {
    try {
      return JSON.parse(originalValue || '{}') as Record<string, CityServices>;
    } catch {
      return {};
    }
  }, [originalValue]);

  // Get available cities
  const availableCities = useMemo(() => {
    return Object.keys(parsedValue).filter(key => typeof parsedValue[key] === 'object');
  }, [parsedValue]);

  // Get current city's services
  const cityData = parsedValue[selectedCity] || { services: [], mainServiceTag: '' };


  // Count changes
  const changedCount = useMemo(() => {
    let count = 0;
    for (const city of availableCities) {
      const current = JSON.stringify(parsedValue[city] || {});
      const original = JSON.stringify(parsedOriginal[city] || {});
      if (current !== original) {
        count++;
      }
    }
    return count;
  }, [parsedValue, parsedOriginal, availableCities]);

  // Handle service update
  const handleServiceUpdate = (index: number, updated: Service) => {
    const newServices = [...cityData.services];
    newServices[index] = updated;
    updateCityData({ ...cityData, services: newServices });
  };

  // Handle service delete
  const handleServiceDelete = (index: number) => {
    const newServices = cityData.services.filter((_, i) => i !== index);
    updateCityData({ ...cityData, services: newServices });
  };

  // Handle main service tag change
  const handleMainServiceChange = (value: string) => {
    updateCityData({ ...cityData, mainServiceTag: value });
  };

  // Handle add service
  const handleAddService = () => {
    const newService: Service = {
      serviceTag: 'CABS',
      allowGrow: false,
      category: 'PRIVATE',
    };
    updateCityData({ ...cityData, services: [...cityData.services, newService] });
  };

  // Update city data
  const updateCityData = (newCityData: CityServices) => {
    const updated = {
      ...parsedValue,
      [selectedCity]: newCityData,
    };
    onUpdate(JSON.stringify(updated));
  };

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag end - perform the reorder
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newServices = [...cityData.services];
      const [draggedItem] = newServices.splice(draggedIndex, 1);
      newServices.splice(dragOverIndex, 0, draggedItem);
      updateCityData({ ...cityData, services: newServices });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
                    <Truck className="h-4 w-4" />
                    Services
                  </CardTitle>
                  <CardDescription className="mt-1">Configure enabled services per city</CardDescription>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    Parameter: enabled_services_v3
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {changedCount > 0 && (
                  <>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {changedCount} Cities Modified
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(originalValue);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Reset
                    </Button>
                  </>
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
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      {city.charAt(0).toUpperCase() + city.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Main Service Tag */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <span className="text-sm font-medium">Main Service:</span>
              <Select value={cityData.mainServiceTag} onValueChange={handleMainServiceChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select main service..." />
                </SelectTrigger>
                <SelectContent>
                  {cityData.services.map((service) => (
                    <SelectItem key={service.serviceTag} value={service.serviceTag}>
                      {service.serviceTag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                The main service shown prominently
              </span>
            </div>

            {/* Services List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Services ({cityData.services.length})
                </div>
                <Button variant="outline" size="sm" onClick={handleAddService}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cityData.services.map((service, index) => (
                  <ServiceRow
                    key={`${service.serviceTag}-${index}`}
                    service={service}
                    index={index}
                    onUpdate={(updated) => handleServiceUpdate(index, updated)}
                    onDelete={() => handleServiceDelete(index)}
                    isMainService={service.serviceTag === cityData.mainServiceTag}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                ))}
                {cityData.services.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
                    No services configured for this city
                  </div>
                )}
              </div>
            </div>
            
            {/* Preview Section */}
            <div className="mt-6 pt-4 border-t">
              <ServicesPreview 
                services={cityData.services} 
                mainServiceTag={cityData.mainServiceTag} 
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
