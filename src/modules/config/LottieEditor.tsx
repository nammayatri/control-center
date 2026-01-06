/**
 * Lottie Animation Editor Component
 * 
 * Provides a visual editor for the city_lottie_config Firebase parameter
 * with Lottie animation preview capability.
 */

import { useState, useMemo, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Sparkles, MapPin, ChevronDown, ChevronRight, Settings, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

// ============================================
// Types - Based on actual city_lottie_config structure
// ============================================

interface HomeScreenLottieUrl {
  lottieUrl: string;
  androidBottomOffset?: number;
  iosBottomOffset?: number;
}

interface CityLottieConfig {
  homeScreenLottieUrl: HomeScreenLottieUrl;
}

type LottieConfig = Record<string, CityLottieConfig>;

interface LottieEditorProps {
  parameterValue: string;
  originalValue: string;
  onUpdate: (newValue: string) => void;
  firebaseCondition?: string;
  firebaseConditions?: Array<{ name: string; expression: string }>;
  onFirebaseConditionChange?: (condition: string) => void;
}

// ============================================
// Lottie Preview Component
// ============================================

interface LottiePreviewProps {
  lottieUrl: string;
  cityName: string;
  androidBottomOffset?: number;
  iosBottomOffset?: number;
}

function LottiePreview({ lottieUrl, cityName, androidBottomOffset, iosBottomOffset }: Readonly<LottiePreviewProps>) {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  // Fetch animation from URL
  useEffect(() => {
    const fetchAnimation = async () => {
      if (!lottieUrl) {
        setAnimationData(null);
        return;
      }
      
      setError(null);
      setAnimationData(null);
      setLoading(true);
      
      try {
        const response = await fetch(lottieUrl);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        const json = await response.json();
        setAnimationData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load animation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimation();
  }, [lottieUrl]);

  const bottomOffset = platform === 'ios' ? iosBottomOffset : androidBottomOffset;

  if (!lottieUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg border border-dashed">
        <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No animation URL configured for {cityName}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading animation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate px-4">{lottieUrl}</p>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No animation data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Platform Selector */}
      <div className="flex items-center gap-2 justify-center">
        <Button
          variant={platform === 'ios' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPlatform('ios')}
          className="h-7 text-xs"
        >
          iOS
        </Button>
        <Button
          variant={platform === 'android' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPlatform('android')}
          className="h-7 text-xs"
        >
          Android
        </Button>
      </div>

      {/* Phone Mockup with Lottie */}
      <div className="relative mx-auto" style={{ width: 280, height: 560 }}>
        {/* Phone Frame */}
        <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
          {/* Screen */}
          <div className="absolute inset-3 bg-white dark:bg-gray-100 rounded-[2rem] overflow-hidden">
            {/* Status Bar */}
            <div className="h-8 bg-gradient-to-b from-gray-50 to-white flex items-center justify-between px-4 text-[10px] text-gray-800">
              <span>8:02</span>
              <div className="flex gap-1">
                <span>●●●●</span>
                <span>87%</span>
              </div>
            </div>

            {/* Map Background (simplified) */}
            <div className="absolute inset-0 top-8 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
              {/* Simplified map pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* "You" marker */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[8px] px-2 py-1 rounded-full shadow-lg">
                You 👤
              </div>

              {/* Car illustration placeholder */}
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-4xl">
                🚗
              </div>
            </div>

            {/* Lottie Animation - Full width, positioned with offset from BOTTOM OF SCREEN */}
            {/* The mockup screen is ~554px tall, but actual devices are ~900px */}
            {/* Scale the offset proportionally: offset * (554 / 900) */}
            <div 
              className="absolute left-1/2 pointer-events-none z-10"
              style={{ 
                bottom: `${(bottomOffset || 420) * 0.615}px`, // Scale for mockup size
                height: 150,
                transform: 'translateX(-50%) scale(0.9)', // Center horizontally and zoom 0.9x
                transformOrigin: 'bottom center', // Zoom from bottom to maintain offset alignment
                width: 'max-content' // Ensure container doesn't constrain width
              }}
            >
              <Lottie
                animationData={animationData}
                loop={true}
                autoplay={isPlaying}
                style={{ height: '100%', width: 'auto' }}
              />
            </div>

            {/* Bottom UI Elements - Starts at same position as Lottie (offset height from bottom) */}
            <div 
              className="absolute left-0 right-0 bg-white overflow-hidden"
              style={{
                bottom: 0,
                top: `${554 - (bottomOffset || 420) * 0.615}px` // Start where Lottie is positioned
              }}
            >
              <div className="px-3 pt-0 pb-3 space-y-2">
                {/* Search Box */}
                <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-xs flex items-center justify-between">
                  <span>Where would you like to go?</span>
                  <span>→</span>
                </div>

                {/* Recent Location */}
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-[10px]">
                  <div className="font-medium">1379, 21st Main Road...</div>
                  <div className="text-gray-500">21st Main Road, 1st Sect...</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notch - Different for iOS and Android */}
          {platform === 'ios' ? (
            // iOS Dynamic Island - smaller and more refined
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-gray-900 rounded-full"></div>
          ) : (
            // Android notch (teardrop style)
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-7 px-3 text-xs"
          >
            {isPlaying ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Play</>}
          </Button>
        </div>
      </div>

      {/* Offset Info */}
      <div className="text-xs text-center text-muted-foreground mt-10 space-y-1">
        <p>
          <span className="font-medium">{platform === 'ios' ? 'iOS' : 'Android'} Bottom Offset:</span>{' '}
          {bottomOffset || 420}px
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          Animation positioned {bottomOffset || 420}px from bottom of screen
        </p>
      </div>
    </div>
  );
}

// ============================================
// City Lottie Row Component
// ============================================

interface CityLottieRowProps {
  cityName: string;
  config: CityLottieConfig;
  originalConfig?: CityLottieConfig;
  onUpdate: (newConfig: CityLottieConfig) => void;
}

function CityLottieRow({ cityName, config, originalConfig, onUpdate }: Readonly<CityLottieRowProps>) {
  const lottieData = config.homeScreenLottieUrl || { lottieUrl: '' };
  const isModified = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const handleUrlChange = (url: string) => {
    onUpdate({
      homeScreenLottieUrl: {
        ...lottieData,
        lottieUrl: url,
      }
    });
  };

  const handleAndroidOffsetChange = (value: string) => {
    const offset = Number.parseInt(value, 10);
    onUpdate({
      homeScreenLottieUrl: {
        ...lottieData,
        androidBottomOffset: Number.isNaN(offset) ? undefined : offset,
      }
    });
  };

  const handleIosOffsetChange = (value: string) => {
    const offset = Number.parseInt(value, 10);
    onUpdate({
      homeScreenLottieUrl: {
        ...lottieData,
        iosBottomOffset: Number.isNaN(offset) ? undefined : offset,
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-medium capitalize">{cityName}</h4>
          {isModified && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
              Modified
            </Badge>
          )}
        </div>

        {/* Lottie URL */}
        <div className="space-y-2">
          <Label className="text-xs">Lottie URL</Label>
          <Input
            type="text"
            value={lottieData.lottieUrl || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://raw.githubusercontent.com/..."
            className="font-mono text-xs"
          />
        </div>

        {/* Offsets */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Android Bottom Offset</Label>
            <Input
              type="number"
              value={lottieData.androidBottomOffset ?? ''}
              onChange={(e) => handleAndroidOffsetChange(e.target.value)}
              placeholder="420"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">iOS Bottom Offset</Label>
            <Input
              type="number"
              value={lottieData.iosBottomOffset ?? ''}
              onChange={(e) => handleIosOffsetChange(e.target.value)}
              placeholder="420"
            />
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3">Preview</h4>
        <LottiePreview 
          lottieUrl={lottieData.lottieUrl || ''} 
          cityName={cityName}
          androidBottomOffset={lottieData.androidBottomOffset}
          iosBottomOffset={lottieData.iosBottomOffset}
        />
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function LottieEditor({
  parameterValue,
  originalValue,
  onUpdate,
  firebaseCondition = 'default',
  firebaseConditions = [],
  onFirebaseConditionChange,
}: Readonly<LottieEditorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Parse JSON values
  const parsedValue = useMemo<LottieConfig>(() => {
    try {
      return JSON.parse(parameterValue || '{}');
    } catch {
      return {};
    }
  }, [parameterValue]);

  const parsedOriginal = useMemo<LottieConfig>(() => {
    try {
      return JSON.parse(originalValue || '{}');
    } catch {
      return {};
    }
  }, [originalValue]);

  // Get list of cities
  const cities = useMemo(() => {
    const allCities = new Set([
      ...Object.keys(parsedValue),
      ...Object.keys(parsedOriginal),
    ]);
    return Array.from(allCities).sort((a, b) => a.localeCompare(b));
  }, [parsedValue, parsedOriginal]);

  // Initialize selected city
  useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  // Count modified cities
  const changedCount = useMemo(() => {
    let count = 0;
    for (const city of cities) {
      if (JSON.stringify(parsedValue[city]) !== JSON.stringify(parsedOriginal[city])) {
        count++;
      }
    }
    return count;
  }, [parsedValue, parsedOriginal, cities]);

  // Update city config
  const updateCityConfig = (newConfig: CityLottieConfig) => {
    const updated = { ...parsedValue, [selectedCity]: newConfig };
    onUpdate(JSON.stringify(updated, null, 2));
  };

  // Add new city
  const handleAddCity = () => {
    const cityName = prompt('Enter city name (lowercase):');
    if (cityName && !parsedValue[cityName]) {
      const updated = { 
        ...parsedValue, 
        [cityName]: { 
          homeScreenLottieUrl: { 
            lottieUrl: '', 
            androidBottomOffset: 420, 
            iosBottomOffset: 420 
          } 
        } 
      };
      onUpdate(JSON.stringify(updated, null, 2));
      setSelectedCity(cityName);
    }
  };

  const currentConfig = parsedValue[selectedCity] || { homeScreenLottieUrl: { lottieUrl: '' } };
  const originalConfig = parsedOriginal[selectedCity];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4" />
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Homescreen Welcome Animation
                  </CardTitle>
                  <CardDescription className="mt-1">Configure Lottie animations for city welcome screens</CardDescription>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    Parameter: city_lottie_config
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
                      <RotateCcw className="h-3 w-3 mr-1" />
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
                Add City
              </Button>
              <span className="text-xs text-muted-foreground">
                {cities.length} cities configured
              </span>
            </div>

            {/* City Configuration */}
            {selectedCity && (
              <div className="border rounded-lg p-4 bg-background">
                <CityLottieRow
                  cityName={selectedCity}
                  config={currentConfig}
                  originalConfig={originalConfig}
                  onUpdate={updateCityConfig}
                />
              </div>
            )}

            {cities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No cities configured. Click "Add City" to get started.</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
