import { useState, useEffect } from 'react';
import type { LogicCondition, LogicNode, LogicOperator, Predicate, SimpleComparison, PredicateGroup } from '../types/JsonLogicTypes';
import { FILTER_VARIABLES, OPERATORS } from '../types/JsonLogicTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Trash2, CornerDownRight, Plus, X, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { LogicEditor } from './LogicEditor';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';

// FilterOptions definition
export interface FilterOptions {
    cities: { label: string; value: string }[];
    merchants: { label: string; value: string }[];
    vehicles: { label: string; value: string }[];
    areas: { label: string; value: string }[];
    areaNames?: { label: string; value: string }[]; // For config.area.tag
    tripCategories?: { label: string; value: string }[];
    allObservedFilters?: string[];
}

interface ConditionBlockProps {
    node: LogicCondition;
    onChange: (newNode: LogicCondition) => void;
    onRemove: () => void;
    filterOptions: FilterOptions;
    parameterOptions?: string[];
}

// Helper to check type
function isGroup(p: Predicate): p is PredicateGroup {
    return 'groupOperator' in p;
}

export function ConditionBlock({ node, onChange, onRemove, filterOptions, parameterOptions }: ConditionBlockProps) {
    const [isOpen, setIsOpen] = useState(true);

    const handlePredicateChange = (newPredicate: Predicate) => {
        onChange({ ...node, predicate: newPredicate });
    };

    const handleUpdateThen = (nodes: LogicNode[]) => {
        onChange({ ...node, thenBlock: nodes });
    };

    const handleUpdateElse = (nodes: LogicNode[]) => {
        onChange({ ...node, elseBlock: nodes });
    };

    // Get summary for collapsed view
    const getPredicateSummary = (p: Predicate): string => {
        if (isGroup(p)) {
            return `${p.predicates.length} conditions (${p.groupOperator.toUpperCase()})`;
        }
        const varName = p.variable.split('.').pop() || p.variable;
        const val = p.value === null ? 'null' : String(p.value);
        return `${varName} ${p.operator} ${val}`;
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="border border-l-4 border-l-primary/40 rounded-md my-4 bg-background shadow-sm">
                {/* Header / Condition Row */}
                <div className="flex items-start gap-2 p-3 border-b bg-muted/20">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>

                    <span className="font-semibold text-sm text-primary uppercase pt-0.5">If</span>

                    <div className="flex-1">
                        {isOpen ? (
                            <PredicateEditor
                                predicate={node.predicate}
                                onChange={handlePredicateChange}
                                filterOptions={filterOptions}
                            />
                        ) : (
                            <span className="text-sm text-muted-foreground italic">{getPredicateSummary(node.predicate)}</span>
                        )}
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content Body - Collapsible */}
                <CollapsibleContent>
                    <div className="p-3 pl-8 grid gap-4">
                        {/* THEN Block */}
                        <div className="relative">
                            <div className="absolute -left-6 top-3 text-muted-foreground"><CornerDownRight className="h-5 w-5" /></div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">THEN</Badge>
                                <span className="text-xs text-muted-foreground">Apply these parameters or check nested conditions</span>
                            </div>

                            <LogicEditor
                                nodes={node.thenBlock}
                                onChange={handleUpdateThen}
                                filterOptions={filterOptions}
                                parameterOptions={parameterOptions}
                            />
                        </div>

                        {/* ELSE Block */}
                        <div className="relative border-t pt-4 mt-2">
                            <div className="absolute -left-6 top-8 text-muted-foreground"><CornerDownRight className="h-5 w-5" /></div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">ELSE (Optional)</Badge>
                                <span className="text-xs text-muted-foreground">Fallback if condition is false</span>
                            </div>

                            <LogicEditor
                                nodes={node.elseBlock}
                                onChange={handleUpdateElse}
                                filterOptions={filterOptions}
                                parameterOptions={parameterOptions}
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

// ===== Predicate Editor Component =====

interface PredicateEditorProps {
    predicate: Predicate;
    onChange: (p: Predicate) => void;
    filterOptions: FilterOptions;
    isNested?: boolean; // Flag to prevent infinite AND/OR nesting
}

function PredicateEditor({ predicate, onChange, filterOptions, isNested = false }: PredicateEditorProps) {

    const wrapInGroup = (groupOp: 'and' | 'or') => {
        // Wrap current predicate in a group
        const newGroup: PredicateGroup = {
            groupOperator: groupOp,
            predicates: [predicate, { variable: 'extraDimensions.tripDistance', operator: '==', value: '' }]
        };
        onChange(newGroup);
    };

    if (isGroup(predicate)) {
        return (
            <PredicateGroupEditor
                group={predicate}
                onChange={onChange}
                filterOptions={filterOptions}
            />
        );
    }

    // Simple Comparison - only show AND/OR buttons if not nested
    return (
        <div className="flex flex-wrap items-center gap-2">
            <SimpleComparisonEditor
                comparison={predicate}
                onChange={onChange}
                filterOptions={filterOptions}
            />
            {!isNested && (
                <>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => wrapInGroup('and')}>
                        <Layers className="h-3 w-3" /> + AND
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => wrapInGroup('or')}>
                        <Layers className="h-3 w-3" /> + OR
                    </Button>
                </>
            )}
        </div>
    );
}

// ===== Predicate Group Editor =====

interface PredicateGroupEditorProps {
    group: PredicateGroup;
    onChange: (p: Predicate) => void;
    filterOptions: FilterOptions;
}

function PredicateGroupEditor({ group, onChange, filterOptions }: PredicateGroupEditorProps) {

    const handleOperatorToggle = () => {
        const newOp = group.groupOperator === 'and' ? 'or' : 'and';
        onChange({ ...group, groupOperator: newOp });
    };

    const handleChildChange = (index: number, newChild: Predicate) => {
        const newPredicates = [...group.predicates];
        newPredicates[index] = newChild;
        onChange({ ...group, predicates: newPredicates });
    };

    const handleRemoveChild = (index: number) => {
        const newPredicates = group.predicates.filter((_, i) => i !== index);
        // If only one child remains, unwrap the group
        if (newPredicates.length === 1) {
            onChange(newPredicates[0]);
        } else if (newPredicates.length === 0) {
            // If no children, replace with empty simple comparison
            onChange({ variable: '', operator: '==', value: '' });
        } else {
            onChange({ ...group, predicates: newPredicates });
        }
    };

    const handleAddChild = () => {
        const newChild: SimpleComparison = {
            variable: 'extraDimensions.tripDistance',
            operator: '==',
            value: ''
        };
        onChange({ ...group, predicates: [...group.predicates, newChild] });
    };

    return (
        <Card className="p-2 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
                <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 font-bold uppercase text-xs"
                    onClick={handleOperatorToggle}
                >
                    {group.groupOperator}
                </Button>
                <span className="text-xs text-muted-foreground">Click to toggle</span>
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                {group.predicates.map((child, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                            <PredicateEditor
                                predicate={child}
                                onChange={(p) => handleChildChange(index, p)}
                                filterOptions={filterOptions}
                                isNested={true}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveChild(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs gap-1" onClick={handleAddChild}>
                <Plus className="h-3 w-3" /> Add Condition
            </Button>
        </Card>
    );
}

// ===== Simple Comparison Editor =====

interface SimpleComparisonEditorProps {
    comparison: SimpleComparison;
    onChange: (p: Predicate) => void;
    filterOptions: FilterOptions;
}

function SimpleComparisonEditor({ comparison, onChange, filterOptions }: SimpleComparisonEditorProps) {
    const [isCustomVar, setIsCustomVar] = useState(!FILTER_VARIABLES.some(v => v.value === comparison.variable) && comparison.variable !== '');

    // Sync isCustomVar state when comparison.variable changes (e.g., after import)
    useEffect(() => {
        const isInPreset = FILTER_VARIABLES.some(v => v.value === comparison.variable);
        const shouldBeCustom = !isInPreset && comparison.variable !== '';
        setIsCustomVar(shouldBeCustom);
    }, [comparison.variable]);

    const handleVarChange = (variable: string) => {
        if (variable === '__custom__') {
            setIsCustomVar(true);
            onChange({ ...comparison, variable: '' });
            return;
        }
        setIsCustomVar(false);

        const varDef = FILTER_VARIABLES.find(v => v.value === variable);
        let operator = comparison.operator;
        let value = comparison.value;

        // If switching from 'in' to a non-multi variable, convert to '=='
        if (operator === 'in' && varDef?.type !== 'select') {
            operator = '==';
            value = '';
        }

        onChange({ variable, operator, value });
    };

    const handleCustomVarChange = (variable: string) => {
        onChange({ ...comparison, variable });
    };

    const handleOperatorChange = (operator: LogicOperator) => {
        onChange({ ...comparison, operator });
    };

    const handleValueChange = (val: any) => {
        onChange({ ...comparison, value: val });
    };

    // Special handling for config.area.tag
    if (comparison.variable === 'config.area.tag') {
        const val = typeof comparison.value === 'string' ? comparison.value : '';
        // Value format: Type_AreaID (e.g., Pickup_1234)

        let type = 'Pickup';
        let areaId = '';

        if (val.startsWith('Pickup_')) {
            type = 'Pickup';
            areaId = val.substring(7);
        } else if (val.startsWith('Drop_')) {
            type = 'Drop';
            areaId = val.substring(5);
        } else {
            areaId = val;
        }

        // Find Name from ID for display
        const foundArea = filterOptions?.areas.find(a => a.value === areaId);
        const currentName = foundArea ? foundArea.label : (areaId || '');

        const handleTypeChange = (newType: string) => {
            onChange({ ...comparison, value: `${newType}_${areaId}` });
        };

        const handleAreaChange = (newAreaId: string) => {
            onChange({ ...comparison, value: `${type}_${newAreaId}` });
        };

        // Options: Label = Name, Value = ID
        const areaOptions = filterOptions?.areas || [];

        return (
            <div className="flex items-center gap-1 w-full">
                {/* Type Dropdown */}
                <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Drop">Drop</SelectItem>
                    </SelectContent>
                </Select>

                <div className="text-muted-foreground">_</div>

                {/* Area Dropdown (Searchable by Name) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="flex-1 justify-between h-8 text-sm truncate">
                            {currentName || "Select Area..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0">
                        <Command>
                            <CommandInput placeholder="Search area by name..." />
                            <CommandEmpty>No area found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-64">
                                    {areaOptions.map(opt => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.label} // Search by label (name)
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


    const handleSetNull = () => {
        onChange({ ...comparison, value: null });
    };

    const isMultiSelect = comparison.operator === 'in';
    const isNullValue = comparison.value === null;

    // Get options if available
    let options: { label: string; value: string }[] = [];
    if (comparison.variable === 'config.merchantOperatingCityId') options = filterOptions.cities;
    else if (comparison.variable === 'config.merchantId') options = filterOptions.merchants;
    else if (comparison.variable === 'extraDimensions.serviceTier') options = filterOptions.vehicles;
    else if (comparison.variable === 'config.area.contents') options = filterOptions.areas;
    else if (comparison.variable === 'config.area.tag') options = filterOptions.areas;
    else if (comparison.variable === 'config.tripCategory') options = filterOptions.tripCategories || [];

    // Ensure current value is in options list (for display purposes)
    if (options.length > 0 && comparison.value && !isMultiSelect) {
        const valueStr = comparison.value.toString();
        if (!options.some(opt => opt.value === valueStr)) {
            // Add current value to options so it can be displayed
            options = [...options, { label: valueStr, value: valueStr }];
        }
    }

    // Render Value Input
    const renderValueInput = () => {
        // Show null badge if value is null
        if (isNullValue) {
            return (
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="h-8 px-3">null</Badge>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleValueChange('')}>
                        Clear
                    </Button>
                </div>
            );
        }

        if (isMultiSelect) {
            const currentValues: string[] = Array.isArray(comparison.value) ? comparison.value : [];

            // Fallback: if no options but we have values, show them as chips
            if (options.length === 0 && currentValues.length > 0) {
                return (
                    <div className="flex flex-wrap gap-1 p-1 border rounded min-h-[32px]">
                        {currentValues.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                {v}
                                <button
                                    className="ml-1 hover:text-destructive"
                                    onClick={() => handleValueChange(currentValues.filter((_, idx) => idx !== i))}
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                );
            }

            // Combine options with current values (in case some values aren't in options)
            const allOptions = [...options];
            currentValues.forEach(cv => {
                if (!allOptions.some(o => o.value === cv)) {
                    allOptions.push({ label: cv, value: cv });
                }
            });

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-sm">
                            {currentValues.length > 0
                                ? `${currentValues.length} selected`
                                : "Select values..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Search..." />
                            <CommandEmpty>No item found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-64">
                                    {allOptions.map(opt => (
                                        <CommandItem
                                            key={opt.value}
                                            value={opt.label}
                                            onSelect={() => {
                                                const exists = currentValues.includes(opt.value);
                                                const newValues = exists
                                                    ? currentValues.filter(v => v !== opt.value)
                                                    : [...currentValues, opt.value];
                                                handleValueChange(newValues);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", currentValues.includes(opt.value) ? "opacity-100" : "opacity-0")} />
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

        // Single-select dropdown for == or != when options available
        if ((comparison.operator === '==' || comparison.operator === '!=') && options.length > 0) {
            const valueStr = comparison.value?.toString() || '';
            const valueInOptions = options.some(opt => opt.value === valueStr);

            // If value exists but not in options, show text input with dropdown toggle
            if (valueStr && !valueInOptions) {
                return (
                    <div className="flex items-center gap-1">
                        <Input
                            className="h-8 w-[160px]"
                            value={valueStr}
                            onChange={e => handleValueChange(e.target.value)}
                            title={`Raw value: ${valueStr}`}
                        />
                        <Select value="" onValueChange={handleValueChange}>
                            <SelectTrigger className="w-[40px] h-8 px-2">
                                <ChevronDown className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-48">
                                    {options.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>
                );
            }

            // Normal dropdown when value is in options
            return (
                <Select value={valueStr} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-[200px] h-8">
                        <SelectValue placeholder="Select value..." />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-48">
                            {options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            );
        }

        // Normal Input with null button
        return (
            <div className="flex items-center gap-1">
                <Input
                    className="h-8"
                    placeholder="Value"
                    value={comparison.value ?? ''}
                    onChange={e => handleValueChange(e.target.value)}
                />
                <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={handleSetNull} title="Set to null">
                    null
                </Button>
            </div>
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {isCustomVar ? (
                <div className="flex items-center gap-1">
                    <Input
                        className="h-8 w-[180px]"
                        placeholder="Custom variable path"
                        value={comparison.variable}
                        onChange={e => handleCustomVarChange(e.target.value)}
                    />
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsCustomVar(false)}>
                        Preset
                    </Button>
                </div>
            ) : (
                <Select value={comparison.variable || '__placeholder__'} onValueChange={handleVarChange}>
                    <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Variable" />
                    </SelectTrigger>
                    <SelectContent>
                        {FILTER_VARIABLES.map(v => (
                            <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom Variable...</SelectItem>
                    </SelectContent>
                </Select>
            )}

            <Select value={comparison.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                    {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="min-w-[150px]">
                {renderValueInput()}
            </div>
        </div>
    );
}
