/**
 * Banners Editor Component
 * 
 * Specialized editor for carousel_banner_config which has a structure:
 * - carouselItems: Array of banner objects
 * - maxHeight: number
 * 
 * Each banner has: imageUrl, onClick (actionName, actionData)
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Image, MapPin, ChevronDown, ChevronRight, GripVertical, Plus, Trash2, ExternalLink, Play, Pause, Settings } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

// ============================================
// Types
// ============================================

interface BannerOnClick {
  actionName: string;
  actionData?: string | object;
}

interface BannerItem {
  imageUrl: string;
  onClick?: BannerOnClick;
  onClickV2?: BannerOnClick;
}

interface CityBannerConfig {
  carouselItems: BannerItem[];
  maxHeight: number;
}

type BannerConfig = Record<string, CityBannerConfig>;

interface BannersEditorProps {
  parameterValue: string;
  originalValue: string;
  onUpdate: (newValue: string) => void;
  firebaseCondition?: string;
  firebaseConditions?: Array<{ name: string; expression: string }>;
  onFirebaseConditionChange?: (condition: string) => void;
}

// Action types for banners
const BANNER_ACTIONS = [
  { value: 'none', label: 'No Action' },
  { value: 'navigateToStage', label: 'Navigate to Stage' },
  { value: 'navigateTo', label: 'Navigate To' },
  { value: 'navigateToScreen', label: 'Navigate to Screen' },
  { value: 'navigateToHybridFlow', label: 'Navigate to Hybrid Flow' },
  { value: 'openLink', label: 'Open Link' },
  { value: 'shareApp', label: 'Share App' },
  { value: 'destination', label: 'Set Destination' },
  { value: 'parkwise', label: 'Parkwise' },
  { value: 'redbus', label: 'RedBus' },
  { value: 'safetyPlus', label: 'Safety Plus' },
];

// ============================================
// Banner Row Component
// ============================================

interface BannerRowProps {
  banner: BannerItem;
  index: number;
  onUpdate: (updated: BannerItem) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function BannerRow({
  banner,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: Readonly<BannerRowProps>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actionName = banner.onClick?.actionName || 'none';
  const actionData = banner.onClick?.actionData;

  const handleActionChange = (newAction: string) => {
    if (newAction === 'none') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { onClick: _, ...rest } = banner;
      onUpdate(rest as BannerItem);
    } else if (newAction === 'shareApp') {
      onUpdate({ ...banner, onClick: { actionName: newAction } });
    } else {
      onUpdate({ 
        ...banner, 
        onClick: { actionName: newAction, actionData: actionData || '' } 
      });
    }
  };

  const handleActionDataChange = (newData: string) => {
    if (banner.onClick) {
      onUpdate({ 
        ...banner, 
        onClick: { ...banner.onClick, actionData: newData } 
      });
    }
  };

  return (
    <div
      role="listitem"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsExpanded(!isExpanded);
        }
      }}
      className={`rounded-lg border transition-all ${
        isDragging ? 'opacity-50 border-dashed' : ''
      } ${isDragOver ? 'border-blue-500 border-2' : 'border-border'}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-3 p-3">
          {/* Drag Handle */}
          <div className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Banner Thumbnail */}
          <div className="w-24 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
            {banner.imageUrl ? (
              <img 
                src={banner.imageUrl} 
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Image className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Banner Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm flex items-center gap-2">
              Banner {index + 1}
              {actionName !== 'none' && (
                <Badge variant="outline" className="text-xs">
                  {BANNER_ACTIONS.find(a => a.value === actionName)?.label || actionName}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {banner.imageUrl || 'No image URL'}
            </div>
          </div>

          {/* Expand/Collapse */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Delete */}
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-4">
            {/* Image URL */}
            <div className="space-y-2">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input
                  value={banner.imageUrl}
                  onChange={(e) => onUpdate({ ...banner, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="flex-1"
                />
                {banner.imageUrl && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(banner.imageUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={actionName} onValueChange={handleActionChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANNER_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Data - Destination Type (structured fields) */}
              {actionName === 'destination' && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                  <div className="text-sm font-medium">Destination Details</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={typeof actionData === 'object' && actionData !== null ? (actionData as any).lat || '' : ''}
                        onChange={(e) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const currentData = typeof actionData === 'object' && actionData !== null ? actionData as any : {};
                          onUpdate({
                            ...banner,
                            onClick: {
                              ...banner.onClick!,
                              actionData: { ...currentData, lat: Number.parseFloat(e.target.value) || 0 }
                            }
                          });
                        }}
                        placeholder="13.1989"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={typeof actionData === 'object' && actionData !== null ? (actionData as any).lon || '' : ''}
                        onChange={(e) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const currentData = typeof actionData === 'object' && actionData !== null ? actionData as any : {};
                          onUpdate({
                            ...banner,
                            onClick: {
                              ...banner.onClick!,
                              actionData: { ...currentData, lon: Number.parseFloat(e.target.value) || 0 }
                            }
                          });
                        }}
                        placeholder="77.7069"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      value={typeof actionData === 'object' && actionData !== null ? (actionData as any).name || '' : ''}
                      onChange={(e) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const currentData = typeof actionData === 'object' && actionData !== null ? actionData as any : {};
                        onUpdate({
                          ...banner,
                          onClick: {
                            ...banner.onClick!,
                            actionData: { ...currentData, name: e.target.value }
                          }
                        });
                      }}
                      placeholder="Kempegowda International Airport Bengaluru"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address</Label>
                    <Input
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      value={typeof actionData === 'object' && actionData !== null ? (actionData as any).address || '' : ''}
                      onChange={(e) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const currentData = typeof actionData === 'object' && actionData !== null ? actionData as any : {};
                        onUpdate({
                          ...banner,
                          onClick: {
                            ...banner.onClick!,
                            actionData: { ...currentData, address: e.target.value }
                          }
                        });
                      }}
                      placeholder="Kempegowda International Airport Bengaluru"
                    />
                  </div>
                </div>
              )}

              {/* Action Data - Other Types (simple input) */}
              {actionName !== 'none' && actionName !== 'shareApp' && actionName !== 'destination' && (
                <div className="space-y-2">
                  <Label>Action Data</Label>
                  <Input
                    value={typeof actionData === 'string' ? actionData : JSON.stringify(actionData)}
                    onChange={(e) => handleActionDataChange(e.target.value)}
                    placeholder={actionName === 'openLink' ? 'https://...' : 'screen name or data'}
                  />
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// Banner Carousel Preview Component
// ============================================

interface BannerPreviewProps {
  banners: BannerItem[];
  maxHeight: number;
}

function BannerCarouselPreview({ banners, maxHeight }: Readonly<BannerPreviewProps>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (!isPlaying || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPlaying, banners.length]);

  // Reset index when banners change
  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  if (banners.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-8 text-center text-muted-foreground">
        No banners to preview
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
      <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Image className="h-3 w-3" />
          Banner Carousel Preview
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-6 px-2"
        >
          {isPlaying ? (
            <><Pause className="h-3 w-3 mr-1" /> Pause</>
          ) : (
            <><Play className="h-3 w-3 mr-1" /> Play</>
          )}
        </Button>
      </div>


      {/* Carousel Container - fits banner width */}
      <div className="w-fit mx-auto">
        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg">
          {/* Banner Image */}
          <div 
            className="relative transition-all duration-500"
            style={{ height: Math.min(maxHeight || 200, 250) }}
          >
            {banners[currentIndex]?.imageUrl ? (
              <img
                src={banners[currentIndex].imageUrl}
                alt={`Banner ${currentIndex + 1}`}
                className="h-full object-contain bg-gray-50 dark:bg-gray-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23ddd" width="400" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="14">Image failed to load</text></svg>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 py-3 bg-white dark:bg-gray-800">
            {banners.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-gray-800 dark:bg-white w-4' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function BannersEditor({
  parameterValue,
  originalValue,
  onUpdate,
  firebaseCondition = 'default',
  firebaseConditions = [],
  onFirebaseConditionChange,
}: Readonly<BannersEditorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Parse the JSON value
  const parsedValue = useMemo<BannerConfig>(() => {
    try {
      return JSON.parse(parameterValue || '{}');
    } catch {
      return {};
    }
  }, [parameterValue]);

  const parsedOriginal = useMemo<BannerConfig>(() => {
    try {
      return JSON.parse(originalValue || '{}');
    } catch {
      return {};
    }
  }, [originalValue]);

  // Get available cities
  const cities = useMemo(() => Object.keys(parsedValue), [parsedValue]);

  // Set initial city
  useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  // Get current city data
  const cityData = useMemo<CityBannerConfig>(() => {
    return parsedValue[selectedCity] || { carouselItems: [], maxHeight: 200 };
  }, [parsedValue, selectedCity]);

  // Count changes
  const changedCount = useMemo(() => {
    return JSON.stringify(parsedValue) === JSON.stringify(parsedOriginal) ? 0 : 1;
  }, [parsedValue, parsedOriginal]);

  // Update city data
  const updateCityData = (newData: CityBannerConfig) => {
    const updated = { ...parsedValue, [selectedCity]: newData };
    onUpdate(JSON.stringify(updated, null, 2));
  };

  // Banner handlers
  const handleBannerUpdate = (index: number, updated: BannerItem) => {
    const newItems = [...cityData.carouselItems];
    newItems[index] = updated;
    updateCityData({ ...cityData, carouselItems: newItems });
  };

  const handleBannerDelete = (index: number) => {
    const newItems = cityData.carouselItems.filter((_, i) => i !== index);
    updateCityData({ ...cityData, carouselItems: newItems });
  };

  const handleAddBanner = () => {
    const newBanner: BannerItem = { imageUrl: '' };
    updateCityData({ 
      ...cityData, 
      carouselItems: [...cityData.carouselItems, newBanner] 
    });
  };

  const handleMaxHeightChange = (height: number) => {
    updateCityData({ ...cityData, maxHeight: height });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newItems = [...cityData.carouselItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(dragOverIndex, 0, draggedItem);
      updateCityData({ ...cityData, carouselItems: newItems });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Add new city
  const handleAddCity = () => {
    const cityName = prompt('Enter city name (lowercase):');
    if (cityName && !parsedValue[cityName]) {
      const updated = { 
        ...parsedValue, 
        [cityName]: { carouselItems: [], maxHeight: 200 } 
      };
      onUpdate(JSON.stringify(updated, null, 2));
      setSelectedCity(cityName);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Image className="h-4 w-4" />
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Image className="h-4 w-4" />
                    Carousel Banners
                  </CardTitle>
                  <CardDescription className="mt-1">Configure banner carousel for homescreen</CardDescription>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    Parameter: carousel_banner_config
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {changedCount > 0 && (
                  <>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Modified
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
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                    <SelectItem value="default">Default (no condition)</SelectItem>
                    {firebaseConditions.map((cond) => (
                      <SelectItem key={cond.name} value={cond.name}>
                        {cond.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground flex-1">
                  {firebaseCondition === 'default' 
                    ? 'Editing default values' 
                    : `Editing values for condition: ${firebaseCondition}`}
                </span>
              </div>
            )}

            {/* City Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">City:</span>
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city.charAt(0).toUpperCase() + city.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleAddCity}>
                <Plus className="h-4 w-4 mr-1" />
                Add City
              </Button>
            </div>

            {/* Max Height */}
            <div className="flex items-center gap-4">
              <Label className="text-sm">Max Height:</Label>
              <Input
                type="number"
                value={cityData.maxHeight || 200}
                onChange={(e) => handleMaxHeightChange(Number.parseInt(e.target.value) || 200)}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>

            {/* Banners List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Banners ({cityData.carouselItems.length})
                </span>
                <Button variant="outline" size="sm" onClick={handleAddBanner}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Banner
                </Button>
              </div>

              <div className="space-y-2">
                {cityData.carouselItems.map((banner, index) => (
                  <BannerRow
                    key={`${banner.imageUrl}-${index}`}
                    banner={banner}
                    index={index}
                    onUpdate={(updated) => handleBannerUpdate(index, updated)}
                    onDelete={() => handleBannerDelete(index)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                ))}

                {cityData.carouselItems.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
                    No banners configured for this city
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="pt-4 border-t">
              <BannerCarouselPreview 
                banners={cityData.carouselItems} 
                maxHeight={cityData.maxHeight || 200}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
