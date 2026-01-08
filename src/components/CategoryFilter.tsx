import { useState } from 'react';
import { cn } from '../lib/utils';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

export interface CategoryCount {
  category: string;
  count: number;
}

// Category colors matching the map (extended)
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'SureAirport': '#8b5cf6',
    'SureTouristSite': '#3b82f6',
    'SureRailwayStation': '#f59e0b',
    'SureBusTerminus': '#10b981',
    'SureHospital': '#ef4444',
    'SureShoppingMall': '#ec4899',
    'SureMetro': '#06b6d4',
    'SureStation': '#f97316',
    'SureMarketArea': '#84cc16',
    'SureSchool': '#eab308',
    'SureUniversity': '#a855f7',
    'SureWorkspace': '#0ea5e9',
    'SureHotel': '#d946ef',
    'SureReligiousSite': '#14b8a6',
    'SureLibrary': '#6366f1',
    'SureGarden': '#22c55e',
    'SureEvent': '#f43f5e',
    'SureTemple': '#fb923c',
    'SpecialZone': '#64748b',
    'SureBlockedAreaForAutos': '#dc2626',
    'SureCorporationHotspot': '#7c3aed',
    'SureDistrictHotspot': '#0891b2',
    'SureStadium': '#059669',
  };
  return colors[category] || '#6366f1';
};

export interface CategoryFilterProps {
  categories: CategoryCount[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  className?: string;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryToggle,
  onSelectAll,
  onClearAll,
  className,
}: Readonly<CategoryFilterProps>) {
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
  const allSelected = selectedCategories.length === 0 ||
    selectedCategories.length === categories.length;

  return (
    <div className={cn('bg-background/95 backdrop-blur rounded-lg shadow-lg p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Categories</span>
        <div className="flex gap-1">
          <button
            onClick={onSelectAll}
            className={cn(
              'text-xs px-2 py-0.5 rounded',
              allSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            All ({totalCount})
          </button>
          {selectedCategories.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs px-2 py-0.5 rounded hover:bg-muted text-muted-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map(({ category, count }) => {
          const isSelected = selectedCategories.includes(category) || allSelected;
          const color = getCategoryColor(category);

          return (
            <button
              key={category}
              onClick={() => onCategoryToggle(category)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all',
                isSelected
                  ? 'bg-opacity-20 ring-1 ring-current'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
              style={{
                backgroundColor: isSelected ? `${color}20` : undefined,
                color: isSelected ? color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{category}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                  isSelected ? 'bg-white/50' : 'bg-muted'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface CategoryOverlayProps {
  categories: CategoryCount[];
  selectedCategories: string[];
  onCategoryToggle?: (category: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  className?: string;
}

export function CategoryOverlay({
  categories,
  selectedCategories,
  onCategoryToggle,
  onSelectAll,
  onClearAll,
  className,
}: Readonly<CategoryOverlayProps>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleCategories = selectedCategories.length > 0
    ? categories.filter(c => selectedCategories.includes(c.category))
    : categories;

  const totalVisible = visibleCategories.reduce((sum, c) => sum + c.count, 0);
  const displayCount = isExpanded ? visibleCategories.length : Math.min(6, visibleCategories.length);
  const hasMore = visibleCategories.length > 6;
  const allSelected = selectedCategories.length === 0;

  return (
    <div className={cn('bg-background/95 backdrop-blur rounded-lg shadow-lg overflow-hidden', className)}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">
            {visibleCategories.length} Categories
          </span>
          <span className="text-xs text-muted-foreground">
            ({totalVisible} locations)
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t">
          {/* Filter controls */}
          {onSelectAll && onClearAll && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
              <span className="text-xs text-muted-foreground">Filter by category</span>
              <div className="flex gap-1">
                <button
                  onClick={onSelectAll}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    allSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  All
                </button>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs px-2 py-0.5 rounded hover:bg-muted text-muted-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category list */}
          <div className="p-2 max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {visibleCategories.slice(0, displayCount).map(({ category, count }) => {
                const color = getCategoryColor(category);
                const isSelected = selectedCategories.includes(category) || allSelected;

                return (
                  <button
                    key={category}
                    onClick={() => onCategoryToggle?.(category)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all text-left',
                      isSelected ? 'ring-1 ring-current/30' : 'opacity-50 hover:opacity-100',
                      onCategoryToggle ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'
                    )}
                    style={{
                      backgroundColor: `${color}15`,
                      color: isSelected ? color : undefined,
                    }}
                    disabled={!onCategoryToggle}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate flex-1">{category.replace('Sure', '')}</span>
                    <span className="font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Show more/less */}
          {hasMore && !isExpanded && (
            <div className="text-xs text-muted-foreground text-center py-1.5 border-t">
              +{visibleCategories.length - 6} more
            </div>
          )}
        </div>
      )}

      {/* Collapsed summary - show mini category dots */}
      {!isExpanded && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {visibleCategories.slice(0, 12).map(({ category }) => {
            const color = getCategoryColor(category);
            return (
              <span
                key={category}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
                title={category}
              />
            );
          })}
          {visibleCategories.length > 12 && (
            <span className="text-xs text-muted-foreground">+{visibleCategories.length - 12}</span>
          )}
        </div>
      )}
    </div>
  );
}
