"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";
import { ScrollArea } from "./scroll-area";

// ============================================
// Types
// ============================================

export interface FilterCategory {
    id: string;
    label: string;
    filters: FilterType[];
}

export interface FilterType {
    id: string;
    label: string;
    values: FilterValue[];
    hasSubValues?: boolean;
}

export interface FilterValue {
    id: string;
    label: string;
    subValues?: FilterSubValue[];
}

export interface FilterSubValue {
    id: string;
    label: string;
}

export interface FilterSelections {
    [filterId: string]: {
        values: Set<string>;
        subValues?: { [valueId: string]: Set<string> };
    };
}

export interface AdvancedFiltersPopoverProps {
    categories: FilterCategory[];
    selections: FilterSelections;
    onSelectionsChange: (selections: FilterSelections) => void;
    onApply: () => void;
    onClear: () => void;
    trigger?: React.ReactNode;
}

// ============================================
// Component
// ============================================

export function AdvancedFiltersPopover({
    categories,
    selections,
    onSelectionsChange,
    onApply,
    onClear,
    trigger,
}: AdvancedFiltersPopoverProps) {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        categories[0]?.id || null
    );
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Get current category
    const currentCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategory),
        [categories, selectedCategory]
    );

    // Get current filter
    const currentFilter = useMemo(
        () => currentCategory?.filters.find((f) => f.id === selectedFilter),
        [currentCategory, selectedFilter]
    );

    // Get current value (for sub-values panel)
    const currentValue = useMemo(
        () => currentFilter?.values.find((v) => v.id === selectedValue),
        [currentFilter, selectedValue]
    );

    // Filter values based on search query
    const filteredValues = useMemo(() => {
        if (!currentFilter) return [];
        if (!searchQuery) return currentFilter.values;
        return currentFilter.values.filter((v) =>
            v.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [currentFilter, searchQuery]);

    // Filter sub-values based on search query
    const filteredSubValues = useMemo(() => {
        if (!currentValue?.subValues) return [];
        if (!searchQuery) return currentValue.subValues;
        return currentValue.subValues.filter((sv) =>
            sv.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [currentValue, searchQuery]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.values(selections).forEach((sel) => {
            count += sel.values.size;
            if (sel.subValues) {
                Object.values(sel.subValues).forEach((subSel) => {
                    count += subSel.size;
                });
            }
        });
        return count;
    }, [selections]);

    // Handle value toggle
    const handleValueToggle = (filterId: string, valueId: string) => {
        const newSelections = { ...selections };
        if (!newSelections[filterId]) {
            newSelections[filterId] = { values: new Set() };
        }

        const values = new Set(newSelections[filterId].values);
        if (values.has(valueId)) {
            values.delete(valueId);
        } else {
            values.add(valueId);
        }
        newSelections[filterId] = { ...newSelections[filterId], values };
        onSelectionsChange(newSelections);
    };

    // Handle sub-value toggle
    const handleSubValueToggle = (
        filterId: string,
        valueId: string,
        subValueId: string
    ) => {
        const newSelections = { ...selections };
        if (!newSelections[filterId]) {
            newSelections[filterId] = { values: new Set(), subValues: {} };
        }
        if (!newSelections[filterId].subValues) {
            newSelections[filterId].subValues = {};
        }
        if (!newSelections[filterId].subValues![valueId]) {
            newSelections[filterId].subValues![valueId] = new Set();
        }

        const subValues = new Set(newSelections[filterId].subValues![valueId]);
        if (subValues.has(subValueId)) {
            subValues.delete(subValueId);
        } else {
            subValues.add(subValueId);
        }
        newSelections[filterId].subValues![valueId] = subValues;
        onSelectionsChange(newSelections);
    };

    // Check if value is selected
    const isValueSelected = (filterId: string, valueId: string) => {
        return selections[filterId]?.values.has(valueId) || false;
    };

    // Check if sub-value is selected
    const isSubValueSelected = (
        filterId: string,
        valueId: string,
        subValueId: string
    ) => {
        return (
            selections[filterId]?.subValues?.[valueId]?.has(subValueId) || false
        );
    };

    // Handle apply
    const handleApply = () => {
        onApply();
        setOpen(false);
    };

    // Handle clear
    const handleClear = () => {
        onClear();
    };

    // Reset panel selections when popover opens
    React.useEffect(() => {
        if (open) {
            setSelectedCategory(categories[0]?.id || null);
            setSelectedFilter(null);
            setSelectedValue(null);
            setSearchQuery("");
        }
    }, [open, categories]);

    // Auto-select first filter when category changes
    React.useEffect(() => {
        if (currentCategory && currentCategory.filters.length > 0) {
            setSelectedFilter(currentCategory.filters[0].id);
            setSelectedValue(null);
            setSearchQuery("");
        }
    }, [currentCategory]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Search className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className="w-[700px] p-0"
                align="start"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="text-sm font-medium">Filters</h4>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="border-b px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search filter or value..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-9"
                        />
                    </div>
                </div>

                {/* Three-column layout */}
                <div className="flex h-[350px]">
                    {/* Column 1: Categories */}
                    <div className="w-[160px] border-r">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                            All Filters
                        </div>
                        <ScrollArea className="h-[300px]">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={cn(
                                        "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent",
                                        selectedCategory === category.id && "bg-accent font-medium"
                                    )}
                                >
                                    {category.label}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            ))}
                        </ScrollArea>
                    </div>

                    {/* Column 2: Filter Types */}
                    <div className="w-[180px] border-r">
                        <ScrollArea className="h-[320px]">
                            {currentCategory?.filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        setSelectedFilter(filter.id);
                                        setSelectedValue(null);
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent",
                                        selectedFilter === filter.id && "bg-accent font-medium"
                                    )}
                                >
                                    <span className="truncate">{filter.label}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </button>
                            ))}
                        </ScrollArea>
                    </div>

                    {/* Column 3: Values */}
                    <div className="flex-1">
                        <ScrollArea className="h-[320px]">
                            <div className="p-3">
                                {/* Show values or sub-values based on selection */}
                                {currentFilter?.hasSubValues && selectedValue ? (
                                    // Show sub-values for selected value
                                    <>
                                        <button
                                            onClick={() => setSelectedValue(null)}
                                            className="mb-3 text-xs text-primary hover:underline"
                                        >
                                            ← Back to {currentFilter.label}
                                        </button>
                                        <div className="text-xs text-muted-foreground mb-2">
                                            {currentValue?.label}
                                        </div>
                                        {/* Select All / Clear All for sub-values */}
                                        {filteredSubValues.length > 0 && (
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        const newSelections = { ...selections };
                                                        if (!newSelections[currentFilter.id]) {
                                                            newSelections[currentFilter.id] = { values: new Set(), subValues: {} };
                                                        }
                                                        if (!newSelections[currentFilter.id].subValues) {
                                                            newSelections[currentFilter.id].subValues = {};
                                                        }
                                                        newSelections[currentFilter.id].subValues![selectedValue] = new Set(
                                                            filteredSubValues.map((sv) => sv.id)
                                                        );
                                                        onSelectionsChange(newSelections);
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-muted-foreground">|</span>
                                                <button
                                                    onClick={() => {
                                                        const newSelections = { ...selections };
                                                        if (newSelections[currentFilter.id]?.subValues?.[selectedValue]) {
                                                            newSelections[currentFilter.id].subValues![selectedValue] = new Set();
                                                            onSelectionsChange(newSelections);
                                                        }
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {filteredSubValues.map((subValue) => (
                                                <label
                                                    key={subValue.id}
                                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSubValueSelected(
                                                            currentFilter.id,
                                                            selectedValue,
                                                            subValue.id
                                                        )}
                                                        onChange={() =>
                                                            handleSubValueToggle(
                                                                currentFilter.id,
                                                                selectedValue,
                                                                subValue.id
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                    <span className="text-sm">{subValue.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    // Show values
                                    <>
                                        {/* Select All / Clear All for values */}
                                        {filteredValues.length > 0 && !currentFilter?.hasSubValues && (
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        if (!currentFilter) return;
                                                        const newSelections = { ...selections };
                                                        if (!newSelections[currentFilter.id]) {
                                                            newSelections[currentFilter.id] = { values: new Set() };
                                                        }
                                                        newSelections[currentFilter.id] = {
                                                            ...newSelections[currentFilter.id],
                                                            values: new Set(filteredValues.map((v) => v.id)),
                                                        };
                                                        onSelectionsChange(newSelections);
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-muted-foreground">|</span>
                                                <button
                                                    onClick={() => {
                                                        if (!currentFilter) return;
                                                        const newSelections = { ...selections };
                                                        if (newSelections[currentFilter.id]) {
                                                            newSelections[currentFilter.id] = {
                                                                ...newSelections[currentFilter.id],
                                                                values: new Set(),
                                                            };
                                                            onSelectionsChange(newSelections);
                                                        }
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {filteredValues.map((value) => (
                                                <div key={value.id}>
                                                    {currentFilter?.hasSubValues ? (
                                                        // Value that has sub-values - clicking shows sub-values
                                                        <button
                                                            onClick={() => setSelectedValue(value.id)}
                                                            className={cn(
                                                                "flex w-full items-center justify-between px-2 py-1.5 hover:bg-accent rounded text-sm",
                                                                isValueSelected(currentFilter.id, value.id) &&
                                                                "bg-accent"
                                                            )}
                                                        >
                                                            <span>{value.label}</span>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    ) : (
                                                        // Regular value - checkbox selection
                                                        <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isValueSelected(
                                                                    currentFilter?.id || "",
                                                                    value.id
                                                                )}
                                                                onChange={() =>
                                                                    handleValueToggle(
                                                                        currentFilter?.id || "",
                                                                        value.id
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-gray-300"
                                                            />
                                                            <span className="text-sm">{value.label}</span>
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                            {filteredValues.length === 0 && (
                                                <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                                                    No values found
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                        Clear Filters
                    </Button>
                    <Button size="sm" onClick={handleApply}>
                        Apply Filters
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default AdvancedFiltersPopover;
