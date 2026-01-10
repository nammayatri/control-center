import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Eye, X, Copy, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../components/ui/command';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { cn } from '../../../lib/utils';
import type { FilterOptions } from './ConditionBlock';
import { toast } from 'sonner';

interface InputBuilderProps {
    initialInput: string[]; // Array of JSON strings (we'll use only the first one)
    onChange: (inputs: string[]) => void;
    filterOptions?: FilterOptions;
}

// Standard input fields with their types
const STANDARD_FIELDS = [
    // config.merchantId removed as per request
    { key: 'config.merchantOperatingCityId', label: 'City', type: 'select', optionsKey: 'cities' },
    { key: 'extraDimensions.serviceTier', label: 'Vehicle Variant', type: 'select', optionsKey: 'vehicles' },
    { key: 'extraDimensions.tripDistance', label: 'Trip Distance', type: 'number' },
    { key: 'config.tripCategory', label: 'Trip Category', type: 'select', optionsKey: 'tripCategories' },
    { key: 'config.area.tag', label: 'Area', type: 'select', optionsKey: 'areas' },
    { key: 'config.area.contents', label: 'Area Contents', type: 'text' },
];

export function InputBuilder({ initialInput, onChange, filterOptions }: InputBuilderProps) {
    // Internal state as a flat object { "key.path": value }
    const [fields, setFields] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const [customFields, setCustomFields] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [newFieldKey, setNewFieldKey] = useState('');
    const [showAddField, setShowAddField] = useState(false);

    // Initialize from first input ONLY ONCE or when initialInput truly changes from outside
    useEffect(() => {
        // Skip if already initialized and input is from our own onChange
        if (isInitialized) return;

        try {
            const firstInput = initialInput[0] || '{}';
            const parsed = JSON.parse(firstInput);
            // Flatten nested object to dot-notation keys
            const flattened = flattenObject(parsed);
            setFields(flattened);

            // Detect custom fields (not in STANDARD_FIELDS)
            const standardKeys = new Set(STANDARD_FIELDS.map(f => f.key));
            const custom = Object.keys(flattened).filter(k => !standardKeys.has(k));
            setCustomFields(custom);
            setIsInitialized(true);
        } catch (e) {
            console.warn("Failed to parse initial input", e);
            setFields({});
            setIsInitialized(true);
        }
    }, [initialInput, isInitialized]);

    const handleFieldChange = (key: string, value: string) => {
        const newFields = { ...fields, [key]: value };
        setFields(newFields);
        // Convert back to nested object and emit
        const nested = unflattenObject(newFields);
        onChange([JSON.stringify(nested)]);
    };

    const handleAddCustomField = () => {
        if (newFieldKey && newFieldKey.trim()) {
            const key = newFieldKey.trim();
            if (!customFields.includes(key)) {
                setCustomFields(prev => [...prev, key]);
                setFields(prev => ({ ...prev, [key]: '' }));
                // Emit updated fields
                const newFields = { ...fields, [key]: '' };
                const nested = unflattenObject(newFields);
                onChange([JSON.stringify(nested)]);
            }
            setNewFieldKey('');
            setShowAddField(false);
            toast.success('Custom field added', { description: key });
        }
    };

    // Build nested object from input fields
    const buildNestedObject = (): any => {
        return unflattenObject(fields);
    };

    // Get options for a select field
    const getOptionsForField = (optionsKey?: string): { label: string; value: string }[] => {
        if (!optionsKey || !filterOptions) return [];
        switch (optionsKey) {
            case 'merchants': return filterOptions.merchants || [];
            case 'cities': return filterOptions.cities || [];
            case 'vehicles': return filterOptions.vehicles || [];
            case 'areas': return filterOptions.areas || [];
            case 'tripCategories': return (filterOptions as any).tripCategories || [];
            default: return [];
        }
    };

    // Render a field input based on its type
    const renderFieldInput = (field: typeof STANDARD_FIELDS[0], value: string) => {
        // Special handling for config.area.tag
        if (field.key === 'config.area.tag') {
            // Heuristic: Type_AreaID (Name is displayed by finding ID)
            let type = 'Pickup';
            let areaId = '';

            if (value.startsWith('Pickup_')) {
                type = 'Pickup';
                areaId = value.substring(7);
            } else if (value.startsWith('Drop_')) {
                type = 'Drop';
                areaId = value.substring(5);
            } else {
                areaId = value;
            }

            // Find Name from ID for display
            const areaOpts = filterOptions?.areas || [];
            const foundArea = areaOpts.find(a => a.value === areaId);
            const currentName = foundArea ? foundArea.label : (areaId || '');

            const handleTypeChange = (newType: string) => {
                handleFieldChange(field.key, `${newType}_${areaId}`);
            };

            const handleAreaChange = (newAreaId: string) => {
                handleFieldChange(field.key, `${type}_${newAreaId}`);
            };

            return (
                <div className="flex items-center gap-1 w-full">
                    <Select value={type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-[80px] h-8 text-xs">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pickup">Pickup</SelectItem>
                            <SelectItem value="Drop">Drop</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="text-muted-foreground text-xs">_</div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="flex-1 justify-between h-8 text-sm truncate">
                                {currentName || "Select Area..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search area by name..." />
                                <CommandEmpty>No area found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {areaOpts.map(opt => (
                                            <CommandItem
                                                key={opt.value}
                                                value={opt.label} // Search by Name
                                                onSelect={() => handleAreaChange(opt.value)} // Use ID
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", areaId === opt.value ? "opacity-100" : "opacity-0")} />
                                                {opt.label}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            );
        }

        if (field.type === 'select') {
            const options = getOptionsForField(field.optionsKey);

            // If no options available, fall back to text input
            if (options.length === 0) {
                return (
                    <Input
                        className="h-8 text-sm"
                        placeholder={field.key}
                        value={value}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                    />
                );
            }

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-sm">
                            {value ? (options.find(o => o.value === value)?.label || value) : `Select ${field.label}...`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder={`Search ${field.label}...`} />
                            <CommandEmpty>No {field.label} found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-48">
                                    {options.map(opt => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.label}
                                            onSelect={() => handleFieldChange(field.key, opt.value)}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                                            {opt.label}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            );
        }

        // Number or text input
        return (
            <Input
                className="h-8 text-sm"
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder={field.key}
                value={value}
                onChange={e => handleFieldChange(field.key, e.target.value)}
            />
        );
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Test Input Data</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowPreview(true)}>
                            <Eye className="h-3 w-3" /> Preview
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Standard Fields */}
                    {STANDARD_FIELDS.map(field => (
                        <div key={field.key} className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                            <Label className="text-xs text-muted-foreground truncate" title={field.key}>
                                {field.label}
                            </Label>
                            {renderFieldInput(field, fields[field.key] || '')}
                        </div>
                    ))}

                    {/* Custom Fields */}
                    {customFields.map(key => (
                        <div key={key} className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                            <Label className="text-xs text-muted-foreground truncate" title={key}>
                                {key.split('.').pop()}
                            </Label>
                            <Input
                                className="h-8 text-sm"
                                placeholder={key}
                                value={fields[key] || ''}
                                onChange={e => handleFieldChange(key, e.target.value)}
                            />
                        </div>
                    ))}

                    {/* Add Custom Field */}
                    {showAddField ? (
                        <div className="flex gap-2 items-center">
                            <Input
                                className="h-8 text-sm flex-1"
                                placeholder="e.g., extraDimensions.customerTags.ChurnCohort"
                                value={newFieldKey}
                                onChange={e => setNewFieldKey(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddCustomField();
                                    if (e.key === 'Escape') { setShowAddField(false); setNewFieldKey(''); }
                                }}
                                autoFocus
                            />
                            <Button size="sm" className="h-8" onClick={handleAddCustomField}>Add</Button>
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setShowAddField(false); setNewFieldKey(''); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAddField(true)}>
                            + Add Custom Field
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreview(false)}>
                    <div className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">Input JSON Preview</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(buildNestedObject(), null, 2));
                                    toast.success('Copied to clipboard');
                                }}>
                                    <Copy className="h-4 w-4 mr-1" /> Copy
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <pre className="p-4 text-sm font-mono overflow-auto max-h-[60vh]">
                            {JSON.stringify(buildNestedObject(), null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper: Flatten nested object to dot-notation keys
function flattenObject(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, fullKey));
        } else {
            result[fullKey] = value === null ? '' : String(value);
        }
    }

    return result;
}

// Helper: Unflatten dot-notation keys to nested object
function unflattenObject(flat: Record<string, string>): any {
    const result: any = {};

    for (const key in flat) {
        const value = flat[key];
        const parts = key.split('.');
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }

        // Try to parse as number
        const lastPart = parts[parts.length - 1];
        if (value === '') {
            // Skip empty values
        } else if (!isNaN(Number(value))) {
            current[lastPart] = Number(value);
        } else {
            current[lastPart] = value;
        }
    }

    return result;
}
