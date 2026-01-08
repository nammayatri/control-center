/**
 * Explore Editor Component
 * 
 * Specialized editor for explore_section parameter.
 * Matches JSON structure:
 * {
 *   "city_name": [
 *     {
 *       "name": "...",
 *       "category": "...",
 *       "address": "...",
 *       "description": "...",
 *       "imageUrl": "...",
 *       "lat": 12.34,
 *       "lon": 77.89,
 *       "nameBasedOnLanguage": "...",
 *       "dynamic_action": { "tag": "...", "contents": { ... } } // optional
 *     }
 *   ]
 * }
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
import { Image, MapPin, ChevronDown, ChevronRight, GripVertical, Plus, Trash2, ExternalLink, Compass, Settings, Tag } from 'lucide-react';
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

interface DynamicAction {
    tag: string;
    contents: Record<string, any>;
}

interface ExploreItem {
    name: string;
    category: string;
    address: string;
    description: string;
    imageUrl: string;
    lat: number;
    lon: number;
    nameBasedOnLanguage: string;
    dynamic_action?: DynamicAction;
}

type ExploreConfig = Record<string, ExploreItem[]>;

interface ExploreEditorProps {
    parameterValue: string;
    originalValue: string;
    onUpdate: (newValue: string) => void;
    firebaseCondition?: string;
    firebaseConditions?: Array<{ name: string; expression: string }>;
    onFirebaseConditionChange?: (condition: string) => void;
}

const CATEGORIES = [
    'Heritage',
    'Park',
    'Shopping',
    'Public Transport',
    'Museum',
    'Eateries',
    'Beach',
    'Namma Videos',
    'Science Park',
    'Sports',
    'Office',
    'Other'
];

function capitalize(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// Explore Item Row Component
// ============================================

interface ExploreRowProps {
    item: ExploreItem;
    index: number;
    onUpdate: (updated: ExploreItem) => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    isDragOver: boolean;
}

function ExploreRow({
    item,
    index,
    onUpdate,
    onDelete,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragging,
    isDragOver,
}: Readonly<ExploreRowProps>) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper to handle nested dynamic_action updates
    const handleDynamicActionUpdate = (field: string, value: any) => {
        const currentAction = item.dynamic_action || { tag: 'WebLink', contents: { url: '' } };
        if (field === 'tag') {
            onUpdate({ ...item, dynamic_action: { ...currentAction, tag: value } });
        } else if (field === 'url') {
            onUpdate({
                ...item,
                dynamic_action: {
                    ...currentAction,
                    contents: { ...currentAction.contents, url: value }
                }
            });
        } else if (field === 'enabled') {
            if (value) {
                onUpdate({ ...item, dynamic_action: { tag: 'WebLink', contents: { url: '' } } });
            } else {
                const { dynamic_action, ...rest } = item;
                onUpdate(rest as ExploreItem);
            }
        }
    };

    const hasDynamicAction = !!item.dynamic_action;

    return (
        <div
            role="listitem"
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            tabIndex={0}
            className={`rounded-lg border transition-all ${isDragging ? 'opacity-50 border-dashed' : ''
                } ${isDragOver ? 'border-blue-500 border-2' : 'border-border'}`}
        >
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="flex items-center gap-3 p-3">
                    {/* Drag Handle */}
                    <div className="cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={`Item ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                <Image className="h-6 w-6" />
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 truncate text-center">
                            {item.category}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                            {item.name || `Item ${index + 1}`}
                            {hasDynamicAction && (
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:text-blue-300">
                                    Interactive
                                </Badge>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {item.description || item.address || 'No description'}
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
                    <div className="px-4 pb-4 space-y-6 border-t pt-4">

                        {/* Section 1: Basic Info */}
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</div>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Category</Label>
                                    <Select
                                        value={CATEGORIES.includes(item.category) ? item.category : 'Other'}
                                        onValueChange={(val) => onUpdate({ ...item, category: val === 'Other' ? '' : val })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Name (English)</Label>
                                    <Input
                                        className="h-9"
                                        value={item.name}
                                        onChange={(e) => onUpdate({ ...item, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Name (Localized)</Label>
                                    <Input
                                        className="h-9"
                                        value={item.nameBasedOnLanguage}
                                        onChange={(e) => onUpdate({ ...item, nameBasedOnLanguage: e.target.value })}
                                        placeholder="Same as Name if English"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Image URL</Label>
                                    <div className="flex gap-1">
                                        <Input
                                            className="h-9"
                                            value={item.imageUrl}
                                            onChange={(e) => onUpdate({ ...item, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        {item.imageUrl && (
                                            <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => window.open(item.imageUrl, '_blank')}>
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Description</Label>
                                <Input
                                    className="h-9"
                                    value={item.description}
                                    onChange={(e) => onUpdate({ ...item, description: e.target.value })}
                                    placeholder="Short description for the explore card"
                                />
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Address</Label>
                                    <Input
                                        className="h-9"
                                        value={item.address}
                                        onChange={(e) => onUpdate({ ...item, address: e.target.value })}
                                        placeholder="Full address"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Latitude</Label>
                                    <Input
                                        className="h-9 font-mono"
                                        type="number"
                                        step="any"
                                        value={item.lat}
                                        onChange={(e) => onUpdate({ ...item, lat: parseFloat(e.target.value) || 0 })}
                                        placeholder="12.9716"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Longitude</Label>
                                    <Input
                                        className="h-9 font-mono"
                                        type="number"
                                        step="any"
                                        value={item.lon}
                                        onChange={(e) => onUpdate({ ...item, lon: parseFloat(e.target.value) || 0 })}
                                        placeholder="77.5946"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Dynamic Action */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold flex items-center gap-2">
                                    <Tag className="h-3 w-3" />
                                    Dynamic Action
                                </Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={hasDynamicAction}
                                        onChange={(e) => handleDynamicActionUpdate('enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-xs text-muted-foreground">Enabled</span>
                                </div>
                            </div>

                            {hasDynamicAction && (
                                <div className="bg-muted/30 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Tag / Type</Label>
                                        <Input
                                            className="h-8"
                                            value={item.dynamic_action?.tag || ''}
                                            onChange={(e) => handleDynamicActionUpdate('tag', e.target.value)}
                                            placeholder="e.g. WebLink"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">URL (if WebLink)</Label>
                                        <Input
                                            className="h-8"
                                            value={item.dynamic_action?.contents?.url || ''}
                                            onChange={(e) => handleDynamicActionUpdate('url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </CollapsibleContent>
            </Collapsible >
        </div >
    );
}

// ============================================
// Preview Component
// ============================================

// ============================================
function ExplorePreview({ items }: { items: ExploreItem[] }) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

    // Filter items based on selection
    const filteredItems = selectedCategory
        ? items.filter(i => i.category === selectedCategory)
        : items;

    const handleCardClick = (item: ExploreItem) => {
        if (item.dynamic_action) {
            const { tag, contents } = item.dynamic_action;
            if (tag === 'WebLink' && contents?.url) {
                // Simulate opening web link
                if (confirm(`Open Dynamic Action Link?\n${contents.url}`)) {
                    window.open(contents.url, '_blank');
                }
            } else {
                alert(`Dynamic Action: ${tag}\n${JSON.stringify(contents)}`);
            }
        } else if (item.lat && item.lon) {
            // Simulate default behavior: Open Confirm Pickup
            alert(`[SIMULATION]\nOpening "Confirm Pickup" Stage\n\nDestination:\n${item.name}\nLat: ${item.lat}\nLon: ${item.lon}`);
        } else {
            alert("No action configured (Missing lat/lon or dynamic_action)");
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-8 text-center text-muted-foreground">
                No explore items to preview
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-200 dark:border-gray-800 max-w-[400px] mx-auto shadow-sm relative">
            {/* Header */}
            <div className="mb-4">
                <div className="text-lg font-bold">Explore</div>
            </div>

            {/* Dynamic Category Chips */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                <div
                    onClick={() => setSelectedCategory(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shadow-sm transition-colors cursor-pointer ${selectedCategory === null
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                        : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                >
                    All
                </div>
                {categories.map((cat, i) => (
                    <div
                        key={i}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shadow-sm transition-colors cursor-pointer ${cat === selectedCategory
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                            : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                    >
                        {cat}
                    </div>
                ))}
                {items.length > 0 && items.every(i => !i.category) && (
                    <div className="text-xs text-muted-foreground px-2 italic">No categories defined</div>
                )}
            </div>

            {/* Horizontal Cards Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x scroll-smooth">
                {filteredItems.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleCardClick(item)}
                        className="flex-none w-[160px] snap-center group cursor-pointer active:scale-95 transition-transform"
                    >
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] mb-2 overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 shadow-sm">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.filter = "grayscale(100%) opacity(0.5)";
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100">
                                    <Image className="h-6 w-6 opacity-20" />
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="space-y-0.5">
                            <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                {item.name || 'Untitled Place'}
                            </div>
                            <div className="text-gray-400 dark:text-gray-500 text-[10px] line-clamp-1 leading-relaxed">
                                {item.description || item.address || 'No details available'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// ============================================
// Main Component
// ============================================

export function ExploreEditor({
    parameterValue,
    originalValue,
    onUpdate,
    firebaseCondition = 'default',
    firebaseConditions = [],
    onFirebaseConditionChange,
}: Readonly<ExploreEditorProps>) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<string>('');

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Parse JSON
    const parsedValue = useMemo<ExploreConfig>(() => {
        try {
            return JSON.parse(parameterValue || '{}');
        } catch {
            return {};
        }
    }, [parameterValue]);

    const parsedOriginal = useMemo<ExploreConfig>(() => {
        try {
            return JSON.parse(originalValue || '{}');
        } catch {
            return {};
        }
    }, [originalValue]);

    // Cities - Show cities with items, or the currently selected city (so you can see a newly added one)
    const cities = useMemo(() => {
        return Object.keys(parsedValue)
            .filter(city => (parsedValue[city] && parsedValue[city].length > 0) || city === selectedCity)
            .sort();
    }, [parsedValue, selectedCity]);

    useEffect(() => {
        if (cities.length > 0 && !selectedCity) {
            setSelectedCity(cities[0]);
        }
    }, [cities, selectedCity]);

    const currentItems = useMemo<ExploreItem[]>(() => {
        // In the new JSON structure, the value IS the array of items for that city key
        return parsedValue[selectedCity] || [];
    }, [parsedValue, selectedCity]);

    // Changes
    const changedCount = useMemo(() => {
        return JSON.stringify(parsedValue) === JSON.stringify(parsedOriginal) ? 0 : 1;
    }, [parsedValue, parsedOriginal]);

    const updateItems = (newItems: ExploreItem[]) => {
        const updated = { ...parsedValue, [selectedCity]: newItems };
        onUpdate(JSON.stringify(updated, null, 2));
    };

    const handleItemUpdate = (index: number, updated: ExploreItem) => {
        const newItems = [...currentItems];
        newItems[index] = updated;
        updateItems(newItems);
    };

    const handleItemDelete = (index: number) => {
        const newItems = currentItems.filter((_, i) => i !== index);
        updateItems(newItems);
    };

    const handleAddItem = () => {
        const newItem: ExploreItem = {
            imageUrl: '',
            name: 'New Place',
            nameBasedOnLanguage: 'New Place',
            description: '',
            category: 'Other',
            address: '',
            lat: 0,
            lon: 0,
        };
        updateItems([...currentItems, newItem]);
    };

    const handleCreateCity = (cityName: string) => {
        // Standardize key to lowercase/trimmed to match existing JSON conventions (e.g. "bangalore")
        // But we allow the user to type "Bangalore"
        const normalizedKey = cityName.trim().toLowerCase();

        if (!normalizedKey) return;

        if (parsedValue[normalizedKey]) {
            alert("City already exists!");
            setSelectedCity(normalizedKey);
            return;
        }

        const updated = {
            ...parsedValue,
            [normalizedKey]: []
        };

        // Update state and select the new city immediately so it appears in the filtered list
        onUpdate(JSON.stringify(updated, null, 2));
        setSelectedCity(normalizedKey);
    };

    // Drag handlers
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
            const newItems = [...currentItems];
            const [draggedItem] = newItems.splice(draggedIndex, 1);
            newItems.splice(dragOverIndex, 0, draggedItem);
            updateItems(newItems);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Compass className="h-4 w-4 text-indigo-500" />
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        Explore Section
                                    </CardTitle>
                                    <CardDescription className="mt-1">Configure explore cards for homescreen</CardDescription>
                                    <div className="text-xs text-muted-foreground font-mono mt-1">
                                        Parameter: explore_section
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
                                <Button variant="ghost" size="icon">
                                    {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="space-y-4">

                        {/* Condition & City Controls */}
                        <div className="flex flex-col gap-4 border-b pb-4">
                            {onFirebaseConditionChange && (
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

                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">City:</span>
                                <Select value={selectedCity} onValueChange={setSelectedCity}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map(c => <SelectItem key={c} value={c}>{capitalize(c)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const name = prompt("Enter city name (lowercase):");
                                    if (name) handleCreateCity(name);
                                }}>
                                    <Plus className="h-4 w-4 mr-1" /> Add City
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Items ({currentItems.length})</span>
                                <Button variant="outline" size="sm" onClick={handleAddItem}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {currentItems.map((item, idx) => (
                                    <ExploreRow
                                        key={idx}
                                        item={item}
                                        index={idx}
                                        onUpdate={(u) => handleItemUpdate(idx, u)}
                                        onDelete={() => handleItemDelete(idx)}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragEnd={handleDragEnd}
                                        isDragging={draggedIndex === idx}
                                        isDragOver={dragOverIndex === idx}
                                    />
                                ))}
                                {currentItems.length === 0 && (
                                    <div className="text-center p-4 border border-dashed rounded text-sm text-muted-foreground">
                                        No explore items for {selectedCity}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="pt-4 border-t">
                            <ExplorePreview items={currentItems} />
                        </div>

                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
