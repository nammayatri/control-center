/**
 * Languages Editor Component
 * 
 * Specialized editor for allowed_languages which has structure:
 * - configUrl: string (URL to language config)
 * - [city]: Array of { name: string, translatedName: string }
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
import { Languages, MapPin, ChevronDown, ChevronRight, Settings, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// ============================================
// Types
// ============================================

interface Language {
  name: string;
  translatedName: string;
}

interface AllowedLanguagesData {
  configUrl?: string;
  [city: string]: string | Language[] | undefined;
}

// Supported languages for quick add
const COMMON_LANGUAGES = [
  { name: 'English', translatedName: 'English' },
  { name: 'Hindi', translatedName: 'हिन्दी' },
  { name: 'Kannada', translatedName: 'ಕನ್ನಡ' },
  { name: 'Tamil', translatedName: 'தமிழ்' },
  { name: 'Malayalam', translatedName: 'മലയാളം' },
  { name: 'Bengali', translatedName: 'বাংলা' },
  { name: 'French', translatedName: 'Français' },
  { name: 'Telugu', translatedName: 'తెలుగు' },
  { name: 'Odia', translatedName: 'ଓଡ଼ିଆ' },
  { name: 'DUTCH', translatedName: 'Nederlands' },
  { name: 'GERMAN', translatedName: 'Deutsch' },
  { name: 'FINNISH', translatedName: 'Suomi' },
  { name: 'SWEDISH', translatedName: 'Svenska' },
];

// ============================================
// Language Row Component
// ============================================

interface LanguageRowProps {
  language: Language;
  index: number;
  onUpdate: (updated: Language) => void;
  onDelete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

function LanguageRow({ 
  language, 
  index,
  onUpdate, 
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: Readonly<LanguageRowProps>) {
  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded border bg-background transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDragOver ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-950/20' : ''}`}
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
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          value={language.name}
          onChange={(e) => onUpdate({ ...language, name: e.target.value })}
          placeholder="Language name"
          className="h-8"
        />
        <Input
          value={language.translatedName}
          onChange={(e) => onUpdate({ ...language, translatedName: e.target.value })}
          placeholder="Translated name"
          className="h-8"
        />
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

// ============================================
// Languages Editor Component
// ============================================

interface LanguagesEditorProps {
  parameterValue: string;
  originalValue: string;
  onUpdate: (newValue: string) => void;
  firebaseCondition?: string;
  firebaseConditions?: Array<{ name: string; expression: string }>;
  onFirebaseConditionChange?: (condition: string) => void;
}

export function LanguagesEditor({
  parameterValue,
  originalValue,
  onUpdate,
  firebaseCondition = 'default',
  firebaseConditions = [],
  onFirebaseConditionChange,
}: Readonly<LanguagesEditorProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('bangalore');

  // Parse JSON values
  const parsedValue = useMemo(() => {
    try {
      return JSON.parse(parameterValue || '{}') as AllowedLanguagesData;
    } catch {
      return {};
    }
  }, [parameterValue]);

  const parsedOriginal = useMemo(() => {
    try {
      return JSON.parse(originalValue || '{}') as AllowedLanguagesData;
    } catch {
      return {};
    }
  }, [originalValue]);

  // Get available cities (keys that are arrays, not configUrl)
  const availableCities = useMemo(() => {
    return Object.keys(parsedValue).filter(key => 
      key !== 'configUrl' && Array.isArray(parsedValue[key])
    );
  }, [parsedValue]);

  // Get current city's languages
  const cityLanguages = (parsedValue[selectedCity] as Language[]) || [];

  // Count changes (order-sensitive for arrays)
  const changedCount = useMemo(() => {
    let count = 0;
    const allKeys = new Set([...Object.keys(parsedValue), ...Object.keys(parsedOriginal)]);
    for (const key of allKeys) {
      // JSON.stringify preserves array order, so this will detect reordering
      const current = JSON.stringify(parsedValue[key]);
      const original = JSON.stringify(parsedOriginal[key]);
      if (current !== original) {
        count++;
      }
    }
    return count;
  }, [parsedValue, parsedOriginal]);

  // Handle config URL update
  const handleConfigUrlUpdate = (url: string) => {
    const updated = { ...parsedValue, configUrl: url };
    onUpdate(JSON.stringify(updated));
  };

  // Handle language update
  const handleLanguageUpdate = (index: number, updated: Language) => {
    const newLanguages = [...cityLanguages];
    newLanguages[index] = updated;
    updateCityLanguages(newLanguages);
  };

  // Handle language delete
  const handleLanguageDelete = (index: number) => {
    const newLanguages = cityLanguages.filter((_, i) => i !== index);
    updateCityLanguages(newLanguages);
  };

  // Handle add language
  const handleAddLanguage = () => {
    const newLanguages = [...cityLanguages, { name: '', translatedName: '' }];
    updateCityLanguages(newLanguages);
  };

  // Handle add common language
  const handleAddCommonLanguage = (lang: Language) => {
    // Check if already exists
    if (cityLanguages.some(l => l.name === lang.name)) return;
    const newLanguages = [...cityLanguages, lang];
    updateCityLanguages(newLanguages);
  };

  // Update city languages
  const updateCityLanguages = (newLanguages: Language[]) => {
    const updated = {
      ...parsedValue,
      [selectedCity]: newLanguages,
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
      const newLanguages = [...cityLanguages];
      const [draggedItem] = newLanguages.splice(draggedIndex, 1);
      newLanguages.splice(dragOverIndex, 0, draggedItem);
      updateCityLanguages(newLanguages);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Get languages not yet added to current city
  const availableToAdd = COMMON_LANGUAGES.filter(
    lang => !cityLanguages.some(l => l.name === lang.name)
  );

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
                    <Languages className="h-4 w-4" />
                    Languages
                  </CardTitle>
                  <CardDescription className="mt-1">Configure allowed languages per city</CardDescription>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    Parameter: allowed_languages
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {changedCount > 0 && (
                  <>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {changedCount} Modified
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

            {/* Config URL */}
            <div className="space-y-2 pb-4 border-b">
              <label htmlFor="config-url" className="text-sm font-medium">Config URL</label>
              <Input
                id="config-url"
                value={parsedValue.configUrl || ''}
                onChange={(e) => handleConfigUrlUpdate(e.target.value)}
                placeholder="https://..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                URL to fetch language configuration from
              </p>
            </div>

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
              <Badge variant="secondary">
                {cityLanguages.length} languages
              </Badge>
            </div>

            {/* Quick Add Common Languages */}
            {availableToAdd.length > 0 && (
              <div className="space-y-2 pb-4 border-b">
                <span className="text-sm font-medium">Quick Add:</span>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.slice(0, 8).map((lang) => (
                    <Button
                      key={lang.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCommonLanguage(lang)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Languages List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  Languages ({cityLanguages.length})
                </div>
                <Button variant="outline" size="sm" onClick={handleAddLanguage}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom
                </Button>
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-2 gap-2 px-10 text-xs text-muted-foreground font-medium">
                <span>Name (code)</span>
                <span>Translated Name</span>
              </div>

              <div className="space-y-1 max-h-[350px] overflow-y-auto">
                {cityLanguages.map((language, index) => (
                  <LanguageRow
                    key={`${language.name}-${index}`}
                    language={language}
                    index={index}
                    onUpdate={(updated) => handleLanguageUpdate(index, updated)}
                    onDelete={() => handleLanguageDelete(index)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    isDragOver={dragOverIndex === index}
                  />
                ))}
                {cityLanguages.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
                    No languages configured for this city
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
