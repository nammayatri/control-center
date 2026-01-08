import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { GeospatialMap } from '../../components/GeospatialMap';
import { SpecialLocationEditor } from '../../components/SpecialLocationEditor';
import { PendingChangesDialog } from '../../components/PendingChangesDialog';
import { CategoryOverlay } from '../../components/CategoryFilter';
import { Plus, Save, Loader2, MapIcon, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../../components/ui/command';
import { useAuth } from '../../context/AuthContext';
import {
  getSpecialLocationList,
  getDriverSpecialLocationList,
  upsertSpecialLocation,
  upsertDriverSpecialLocation,
  getCategoriesFromLocations,
} from '../../services/geospatial';
import {
  generateSpecialLocationCsv,
  specialLocationToCsvRows,
  geoJsonPolygonToKml,
  createCsvBlob,
  createKmlBlob,
  leafletCoordsToGeoJson,
  parseGeoJsonString,
} from '../../lib/geoUtils';
import type { SpecialLocationFull, LatLong, SpecialLocationCsvRow } from '../../types/specialLocation';
import type { KmlFile } from '../../services/geospatial';

// Category color helper for dropdown
const getCategoryColorForPage = (category: string): string => {
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

export function SpecialLocationsPage() {
  const { currentMerchant, currentCity, loginModule } = useAuth();

  // State
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewLocation, setIsNewLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState<SpecialLocationFull | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, SpecialLocationFull>>(new Map());
  const [pendingEnabled, setPendingEnabled] = useState<Map<string, boolean>>(new Map());
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [gateToZoom, setGateToZoom] = useState<string | undefined>();
  const [pickingCoordsForGateId, setPickingCoordsForGateId] = useState<string | undefined>();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Determine which API to use based on login module
  const isBpp = loginModule === 'BPP' || loginModule === 'FLEET';
  const getLocations = isBpp ? getDriverSpecialLocationList : getSpecialLocationList;
  const upsertLocations = isBpp ? upsertDriverSpecialLocation : upsertSpecialLocation;

  // Fetch special locations
  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ['specialLocations', currentMerchant?.shortId, currentCity?.name, loginModule],
    queryFn: () => getLocations(
      currentMerchant?.shortId || '',
      currentCity?.name || '',
      { limit: 500 }
    ),
    enabled: !!currentMerchant?.shortId && !!currentCity?.name,
  });

  // Get categories with counts
  const categoryStats = useMemo(() => getCategoriesFromLocations(locations), [locations]);

  // Get display locations (with pending changes applied)
  const displayLocations = useMemo(() => {
    const existingIds = new Set(locations.map(l => l.id));
    const result = locations.map(loc => pendingChanges.get(loc.id) || loc);
    pendingChanges.forEach((loc, id) => {
      if (!existingIds.has(id)) {
        result.push(loc);
      }
    });
    return result;
  }, [locations, pendingChanges]);

  const hasPendingChanges = pendingChanges.size > 0;

  // Category handlers
  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }, []);

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories(categoryStats.map(c => c.category));
  }, [categoryStats]);

  const handleClearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (selectedIds?: string[]) => {
      if (!currentMerchant?.shortId || !currentCity?.name) {
        throw new Error('Please select a merchant and city');
      }

      const locationsToSave = selectedIds
        ? Array.from(pendingChanges.entries())
          .filter(([id]) => selectedIds.includes(id))
          .map(([, loc]) => loc)
        : Array.from(pendingChanges.values());

      const csvRows: SpecialLocationCsvRow[] = [];
      const locationKmls: KmlFile[] = [];
      const gateKmls: KmlFile[] = [];

      locationsToSave.forEach(location => {
        const isEnabled = pendingEnabled.get(location.id) ?? true;
        const rows = specialLocationToCsvRows(location, currentCity?.name || '', isEnabled);
        csvRows.push(...rows);

        // Generate KML for location if it has geoJson
        if (location.geoJson) {
          const geoJson = parseGeoJsonString(location.geoJson);
          if (geoJson) {
            let ring: number[][] | undefined;
            if (geoJson.type === 'Polygon') {
              ring = geoJson.coordinates[0] as number[][];
            } else if (geoJson.type === 'MultiPolygon') {
              const multi = geoJson.coordinates as number[][][][];
              ring = multi[0]?.[0];
            }

            if (ring) {
              // Use geoJsonPolygonToKml since coordinates are already in [lon, lat] format
              const kmlContent = geoJsonPolygonToKml(ring, location.locationName);
              const locationFileName = `${location.locationName.replace(/\s+/g, '_')}.kml`;
              locationKmls.push({
                filename: locationFileName,
                content: createKmlBlob(kmlContent),
              });
            }
          }
        }

        // Generate KML for gates if they have geoJson
        location.gatesInfo.forEach(gate => {
          if (gate.geoJson) {
            const geoJson = parseGeoJsonString(gate.geoJson);
            if (geoJson) {
              let ring: number[][] | undefined;
              if (geoJson.type === 'Polygon') {
                ring = geoJson.coordinates[0] as number[][];
              } else if (geoJson.type === 'MultiPolygon') {
                const multi = geoJson.coordinates as number[][][][];
                ring = multi[0]?.[0];
              }

              if (ring) {
                const kmlContent = geoJsonPolygonToKml(ring, gate.name);
                const gateFileName = `${location.locationName.replace(/\s+/g, '_')}_${gate.name.replace(/\s+/g, '_')}.kml`;
                gateKmls.push({
                  filename: gateFileName,
                  content: createKmlBlob(kmlContent),
                });
              }
            }
          }
        });
      });

      const csvContent = generateSpecialLocationCsv(csvRows);
      const csvBlob = createCsvBlob(csvContent);

      return upsertLocations(
        currentMerchant.shortId,
        currentCity.name,
        csvBlob,
        locationKmls,
        gateKmls
      );
    },
    onSuccess: () => {
      toast.success('Special locations saved successfully');
      setPendingChanges(new Map());
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Location handlers
  const handleLocationSelect = useCallback((locationId: string) => {
    if (editedLocation?.id === locationId && isEditorOpen) {
      return;
    }
    setSelectedLocationId(locationId);
    const location = displayLocations.find(l => l.id === locationId);
    if (location) {
      setEditedLocation({ ...location });
      setIsEditorOpen(true);
      setIsNewLocation(false);
    }
  }, [displayLocations, editedLocation?.id, isEditorOpen]);

  const handleNewLocation = useCallback(() => {
    const newId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newLocation: SpecialLocationFull = {
      id: newId,
      locationName: 'New Location',
      category: 'SpecialZone',
      locationType: 'Open',
      linkedLocationsIds: [],
      gatesInfo: [],
      gates: [],
      createdAt: new Date().toISOString(),
    };
    setEditedLocation(newLocation);
    setSelectedLocationId(newLocation.id);
    setIsNewLocation(true);
    setIsEditorOpen(true);
    setIsEditing(true);
  }, []);

  const handleEditorChange = useCallback((location: SpecialLocationFull) => {
    setEditedLocation(location);
    const newPending = new Map(pendingChanges);
    newPending.set(location.id, location);
    setPendingChanges(newPending);
  }, [pendingChanges]);

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
    setEditedLocation(null);
    setIsNewLocation(false);
    setIsDrawingPolygon(false);
  }, []);

  const handleEditorSave = useCallback((location: SpecialLocationFull, isNew: boolean, enabled: boolean) => {
    const newPending = new Map(pendingChanges);
    newPending.set(location.id, location);
    setPendingChanges(newPending);

    const newEnabled = new Map(pendingEnabled);
    newEnabled.set(location.id, enabled);
    setPendingEnabled(newEnabled);

    setIsEditorOpen(false);
    setEditedLocation(null);
    setIsNewLocation(false);
    toast.success(isNew ? 'Location added to pending changes' : 'Location updated');
  }, [pendingChanges, pendingEnabled]);

  const handlePolygonChange = useCallback((locationId: string, coords: [number, number][]) => {
    const geoJsonCoords = leafletCoordsToGeoJson(coords);
    const newGeoJson = JSON.stringify({
      type: 'Polygon',
      coordinates: geoJsonCoords,
    });

    const existingLocation = pendingChanges.get(locationId) || locations.find(l => l.id === locationId);
    if (existingLocation) {
      const updatedLocation = { ...existingLocation, geoJson: newGeoJson };
      const newPending = new Map(pendingChanges);
      newPending.set(locationId, updatedLocation);
      setPendingChanges(newPending);

      if (editedLocation?.id === locationId) {
        setEditedLocation(updatedLocation);
      }
    }
  }, [pendingChanges, locations, editedLocation]);

  const handleGatePositionChange = useCallback((locationId: string, gateId: string, point: LatLong) => {
    const existingLocation = pendingChanges.get(locationId) || locations.find(l => l.id === locationId);
    if (existingLocation) {
      const updatedGates = existingLocation.gatesInfo.map(g =>
        g.id === gateId ? { ...g, point } : g
      );
      const updatedLocation = { ...existingLocation, gatesInfo: updatedGates };
      const newPending = new Map(pendingChanges);
      newPending.set(locationId, updatedLocation);
      setPendingChanges(newPending);

      if (editedLocation?.id === locationId) {
        setEditedLocation(updatedLocation);
      }
    }
  }, [pendingChanges, locations, editedLocation]);

  const handleNewPolygonDrawn = useCallback((coords: [number, number][]) => {
    if (isDrawingPolygon && editedLocation) {
      const geoJsonCoords = leafletCoordsToGeoJson(coords);
      const newGeoJson = JSON.stringify({
        type: 'Polygon',
        coordinates: geoJsonCoords,
      });
      const updatedLocation = { ...editedLocation, geoJson: newGeoJson };
      setEditedLocation(updatedLocation);

      const newPending = new Map(pendingChanges);
      newPending.set(editedLocation.id, updatedLocation);
      setPendingChanges(newPending);

      setIsDrawingPolygon(false);
      toast.success('Polygon drawn! Click Save to keep changes.');
    } else if (isDrawingPolygon && !editedLocation) {
      handleNewLocation();
      setIsDrawingPolygon(false);
    }
  }, [isDrawingPolygon, editedLocation, handleNewLocation, pendingChanges]);

  const handleLocateGate = useCallback((gateId: string) => {
    setGateToZoom(gateId);
    setTimeout(() => setGateToZoom(undefined), 100);
  }, []);

  return (
    <Page>
      <PageHeader
        title="Special Locations"
        breadcrumbs={[
          { label: 'City Services', href: '/city-services' },
          { label: 'Special Locations' },
        ]}
      />
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Main Map Area */}
        <div className="flex-1 relative rounded-xl overflow-hidden border shadow-sm bg-slate-100">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Map */}
              <GeospatialMap
                locations={displayLocations}
                selectedLocationId={selectedLocationId}
                selectedCategories={selectedCategories}
                isEditing={isEditing || isDrawingPolygon}
                isDrawingMode={isDrawingPolygon}
                isPickingCoords={!!pickingCoordsForGateId}
                gateToZoom={gateToZoom}
                onLocationSelect={handleLocationSelect}
                onLocationPolygonChange={handlePolygonChange}
                onGatePositionChange={handleGatePositionChange}
                onNewPolygonDrawn={handleNewPolygonDrawn}
                onMapClick={(lat, lon) => {
                  if (pickingCoordsForGateId && editedLocation) {
                    const updatedGates = editedLocation.gatesInfo.map(g =>
                      g.id === pickingCoordsForGateId
                        ? { ...g, point: { lat, lon } }
                        : g
                    );
                    const updatedLocation = {
                      ...editedLocation,
                      gatesInfo: updatedGates,
                    };
                    setEditedLocation(updatedLocation);

                    const newPending = new Map(pendingChanges);
                    newPending.set(editedLocation.id, updatedLocation);
                    setPendingChanges(newPending);

                    setPickingCoordsForGateId(undefined);
                    toast.success('Coordinates updated!');
                  }
                }}
                className="w-full h-full"
              />

              {/* Floating Toolbar */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-[280px] justify-between bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {selectedLocationId ? (
                          <>
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCategoryColorForPage(
                                  displayLocations.find(l => l.id === selectedLocationId)?.category || ''
                                )
                              }}
                            />
                            <span className="truncate">
                              {displayLocations.find(l => l.id === selectedLocationId)?.locationName || 'Select location...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>All Locations ({displayLocations.length})</span>
                          </>
                        )}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search locations..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all-locations"
                            onSelect={() => setSelectedLocationId(undefined)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${!selectedLocationId ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <MapIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            All Locations ({displayLocations.length})
                          </CommandItem>
                          {displayLocations.map((loc) => (
                            <CommandItem
                              key={loc.id}
                              value={loc.locationName}
                              onSelect={() => setSelectedLocationId(loc.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedLocationId === loc.id ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span
                                className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: getCategoryColorForPage(loc.category) }}
                              />
                              <span className="truncate">{loc.locationName}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>

                <Button
                  size="sm"
                  onClick={handleNewLocation}
                  className="shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (pendingChanges.size > 1) {
                      setIsReviewDialogOpen(true);
                    } else {
                      saveMutation.mutate(undefined);
                    }
                  }}
                  disabled={!hasPendingChanges || saveMutation.isPending}
                  className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {hasPendingChanges && <span className="ml-1 text-xs">({pendingChanges.size})</span>}
                </Button>
              </div>

              {/* Category Filter */}
              {categoryStats.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10">
                  <CategoryOverlay
                    categories={categoryStats}
                    selectedCategories={selectedCategories}
                    onCategoryToggle={handleCategoryToggle}
                    onSelectAll={handleSelectAllCategories}
                    onClearAll={handleClearCategories}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Location Editor Panel */}
        <SpecialLocationEditor
          location={editedLocation}
          isNew={isNewLocation}
          isOpen={isEditorOpen}
          availableCategories={categoryStats.map(c => c.category)}
          pickingCoordsForGateId={pickingCoordsForGateId}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
          onLocationChange={handleEditorChange}
          onDelete={(id) => {
            const location = displayLocations.find(l => l.id === id);
            if (location) {
              const newPending = new Map(pendingChanges);
              newPending.set(id, { ...location });
              setPendingChanges(newPending);

              const newEnabled = new Map(pendingEnabled);
              newEnabled.set(id, false);
              setPendingEnabled(newEnabled);

              toast.info('Location will be disabled on save');
              handleEditorClose();
            }
          }}
          onLocateGate={handleLocateGate}
          onDrawPolygon={() => setIsDrawingPolygon(true)}
          onPickCoordsForGate={(gateId) => {
            if (pickingCoordsForGateId === gateId) {
              setPickingCoordsForGateId(undefined);
            } else {
              setPickingCoordsForGateId(gateId);
              toast.info('Click on the map to set coordinates');
            }
          }}
        />
      </div>

      {/* Pending Changes Review Dialog */}
      <PendingChangesDialog
        isOpen={isReviewDialogOpen}
        pendingChanges={pendingChanges}
        pendingEnabled={pendingEnabled}
        existingLocationIds={new Set(locations.map(l => l.id))}
        onClose={() => setIsReviewDialogOpen(false)}
        onConfirm={(selectedIds) => {
          setIsReviewDialogOpen(false);
          saveMutation.mutate(selectedIds);
        }}
        onDiscardAll={() => {
          setIsReviewDialogOpen(false);
          setPendingChanges(new Map());
          setPendingEnabled(new Map());
          toast.info('All changes discarded');
        }}
      />
    </Page>
  );
}
