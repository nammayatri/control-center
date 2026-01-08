import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  getGeometryList,
  getDriverGeometryList,
  updateGeometry,
  updateDriverGeometry,
} from '../../services/geospatial';
import {
  generateSpecialLocationCsv,
  specialLocationToCsvRows,
  createCsvBlob,
  createKmlBlob,
  leafletCoordsToGeoJson,
  geoJsonPolygonToKml,
  parseGeoJsonString,
} from '../../lib/geoUtils';
import type { SpecialLocationFull, LatLong, SpecialLocationCsvRow, GeometryAPIEntity } from '../../types/specialLocation';
import type { KmlFile } from '../../services/geospatial';

type TabType = 'special-locations' | 'geometry';

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

export function GeospatialPage() {
  const { currentMerchant, currentCity, loginModule } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('special-locations');
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

  // Geometry state
  const [selectedGeometryRegion, setSelectedGeometryRegion] = useState<string | undefined>();
  const [geometryPendingChanges, setGeometryPendingChanges] = useState<Map<string, GeometryAPIEntity>>(new Map());
  const [isGeometryEditing, setIsGeometryEditing] = useState(false);

  // Determine which API to use based on login module
  const isBpp = loginModule === 'BPP' || loginModule === 'FLEET';
  const getLocations = isBpp ? getDriverSpecialLocationList : getSpecialLocationList;
  const upsertLocations = isBpp ? upsertDriverSpecialLocation : upsertSpecialLocation;
  const getGeometries = isBpp ? getDriverGeometryList : getGeometryList;
  const saveGeometry = isBpp ? updateDriverGeometry : updateGeometry;

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

  // Fetch geometries
  const { data: geometries = [], isLoading: _isLoadingGeometries, refetch: refetchGeometries } = useQuery({
    queryKey: ['geometries', currentMerchant?.shortId, currentCity?.name, loginModule],
    queryFn: () => getGeometries(
      currentMerchant?.shortId || '',
      currentCity?.name || '',
      { limit: 500 }
    ),
    enabled: !!currentMerchant?.shortId && !!currentCity?.name,
  });

  // Get display geometries (with pending changes applied)
  const displayGeometries = useMemo(() => {
    return geometries.map(geo => geometryPendingChanges.get(geo.region) || geo);
  }, [geometries, geometryPendingChanges]);

  // Get categories with counts
  const categoryStats = useMemo(() => getCategoriesFromLocations(locations), [locations]);

  // Get display locations (with pending changes applied)
  const displayLocations = useMemo(() => {
    const existingIds = new Set(locations.map(l => l.id));

    // Start with existing locations, applying any pending changes
    const result = locations.map(loc => pendingChanges.get(loc.id) || loc);

    // Add any NEW locations from pendingChanges that aren't in the API yet
    pendingChanges.forEach((loc, id) => {
      if (!existingIds.has(id)) {
        result.push(loc);
      }
    });

    return result;
  }, [locations, pendingChanges]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (selectedIds?: string[]) => {
      if (!currentMerchant?.shortId || !currentCity?.name) {
        throw new Error('Please select a merchant and city');
      }

      // Get locations to save - either selected ones or all pending
      const idsToSave = selectedIds || Array.from(pendingChanges.keys());
      const locationsToSave = idsToSave
        .map(id => pendingChanges.get(id))
        .filter((loc): loc is SpecialLocationFull => loc !== undefined);

      if (locationsToSave.length === 0) {
        throw new Error('No changes to save');
      }

      // Generate CSV rows only for changed locations
      const csvRows: SpecialLocationCsvRow[] = [];
      const locationKmls: KmlFile[] = [];
      const gateKmls: KmlFile[] = [];

      locationsToSave.forEach(location => {
        // Get enabled state - default to true if not tracked
        const isEnabled = pendingEnabled.get(location.id) ?? true;

        const rows = specialLocationToCsvRows(
          location,
          currentCity.name,
          isEnabled,
          0 // priority
        );
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
              locationKmls.push({
                filename: `${location.locationName.replace(/\s+/g, '_')}.kml`,
                content: createKmlBlob(kmlContent),
              });
            }
          }
        }

        // Generate KML for gates with geometry
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
                gateKmls.push({
                  filename: `${location.locationName.replace(/\s+/g, '_')}_${gate.name.replace(/\s+/g, '_')}.kml`,
                  content: createKmlBlob(kmlContent),
                });
              }
            }
          }
        });
      });

      // Create CSV blob
      const csvContent = generateSpecialLocationCsv(csvRows);
      const csvBlob = createCsvBlob(csvContent);

      // Upload
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

  // Geometry save mutation
  const geometrySaveMutation = useMutation({
    mutationFn: async () => {
      if (!currentMerchant?.shortId || !currentCity?.name) {
        throw new Error('Please select a merchant and city');
      }

      // Save all pending geometry changes
      const promises = Array.from(geometryPendingChanges.values()).map(geo => {
        // Convert GeoJSON to KML
        if (!geo.geom) {
          throw new Error(`No geometry data for region ${geo.region}`);
        }

        const geoJson = JSON.parse(geo.geom);
        const kmlContent = geoJsonPolygonToKml(geoJson.coordinates[0], geo.region);
        const kmlBlob = createKmlBlob(kmlContent);

        return saveGeometry(
          currentMerchant.shortId,
          currentCity.name,
          geo.region,
          kmlBlob
        );
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Geometry saved successfully');
      setGeometryPendingChanges(new Map());
      refetchGeometries();
    },
    onError: (error) => {
      toast.error(`Failed to save geometry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Handle geometry selection
  const handleGeometrySelect = useCallback((region: string) => {
    setSelectedGeometryRegion(region);
    setIsGeometryEditing(true);
  }, []);

  // Handle geometry polygon change (from map)
  const handleGeometryPolygonChange = useCallback((region: string, coords: [number, number][]) => {
    const geoJsonCoords = leafletCoordsToGeoJson(coords);
    const newGeoJson = JSON.stringify({
      type: 'Polygon',
      coordinates: geoJsonCoords,
    });

    const existingGeo = geometryPendingChanges.get(region) || geometries.find(g => g.region === region);
    if (existingGeo) {
      const updatedGeo = { ...existingGeo, geom: newGeoJson };
      const newPending = new Map(geometryPendingChanges);
      newPending.set(region, updatedGeo);
      setGeometryPendingChanges(newPending);
    }
  }, [geometryPendingChanges, geometries]);


  const handleLocationSelect = useCallback((locationId: string) => {
    // If we're already editing this location, don't reset state (e.g., during coord picking)
    if (editedLocation?.id === locationId && isEditorOpen) {
      return;
    }

    setSelectedLocationId(locationId);
    const location = displayLocations.find(l => l.id === locationId);
    if (location) {
      setEditedLocation({ ...location });
      setIsEditorOpen(true);
      setIsNewLocation(false);
      setPickingCoordsForGateId(undefined); // Clear picking state when switching locations
    }
  }, [displayLocations, editedLocation?.id, isEditorOpen]);

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleClearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const handleNewLocation = useCallback(() => {
    const newLocation: SpecialLocationFull = {
      id: `new-${Date.now()}`,
      locationName: '',
      category: 'Other',
      locationType: 'Open',
      linkedLocationsIds: [],
      gatesInfo: [],
      gates: [],
      createdAt: new Date().toISOString(),
    };
    setEditedLocation(newLocation);
    setSelectedLocationId(newLocation.id); // Set selected ID so map can focus
    setIsNewLocation(true);
    setIsEditorOpen(true);
    setIsEditing(true);
  }, []);

  const handleEditorChange = useCallback((location: SpecialLocationFull) => {
    setEditedLocation(location);
    // Sync to pending changes so the map shows changes (like KML upload) immediately
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

    // Track enabled state separately
    const newEnabled = new Map(pendingEnabled);
    newEnabled.set(location.id, enabled);
    setPendingEnabled(newEnabled);

    setIsEditorOpen(false);
    setEditedLocation(null);
    toast.success(isNew ? 'Location added (save to persist)' : `Location ${enabled ? 'updated' : 'will be disabled'} (save to persist)`);
  }, [pendingChanges, pendingEnabled]);

  const handlePolygonChange = useCallback((locationId: string, coords: [number, number][]) => {
    const location = pendingChanges.get(locationId) || displayLocations.find(l => l.id === locationId);
    if (location) {
      const geoJsonCoords = leafletCoordsToGeoJson(coords);
      const updatedLocation: SpecialLocationFull = {
        ...location,
        geoJson: JSON.stringify({
          type: 'Polygon',
          coordinates: geoJsonCoords,
        }),
      };
      const newPending = new Map(pendingChanges);
      newPending.set(locationId, updatedLocation);
      setPendingChanges(newPending);
    }
  }, [pendingChanges, displayLocations]);

  const handleGatePositionChange = useCallback((locationId: string, gateId: string, point: LatLong) => {
    const location = pendingChanges.get(locationId) || displayLocations.find(l => l.id === locationId);
    if (location) {
      const updatedGates = location.gatesInfo.map(g =>
        g.id === gateId ? { ...g, point } : g
      );
      const updatedLocation: SpecialLocationFull = {
        ...location,
        gatesInfo: updatedGates,
        gates: updatedGates.map(g => ({ point: g.point, name: g.name, address: g.address })),
      };
      const newPending = new Map(pendingChanges);
      newPending.set(locationId, updatedLocation);
      setPendingChanges(newPending);
    }
  }, [pendingChanges, displayLocations]);

  const handleNewPolygonDrawn = useCallback((coords: [number, number][]) => {
    if (isDrawingPolygon && editedLocation) {
      const geoJsonCoords = leafletCoordsToGeoJson(coords);
      const newGeoJson = JSON.stringify({
        type: 'Polygon',
        coordinates: geoJsonCoords,
      });

      // Update the edited location
      const updatedLocation = {
        ...editedLocation,
        geoJson: newGeoJson,
      };
      setEditedLocation(updatedLocation);

      // Also add to pending changes immediately so map shows the new polygon
      const newPending = new Map(pendingChanges);
      newPending.set(editedLocation.id, updatedLocation);
      setPendingChanges(newPending);

      setIsDrawingPolygon(false);
      toast.success('Polygon drawn! Click "Save Changes" to confirm.');
    } else if (!editedLocation) {
      // If no location is being edited, prompt user to create new
      handleNewLocation();
    }
  }, [isDrawingPolygon, editedLocation, handleNewLocation, pendingChanges]);

  const handleLocateGate = useCallback((gateId: string) => {
    // Set the gate to zoom to - map will handle the zoom
    setGateToZoom(gateId);
    // Clear after a short delay so it can be triggered again for the same gate
    setTimeout(() => setGateToZoom(undefined), 1000);
  }, []);

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <Page>
      <PageHeader
        title="Geospatial"
        breadcrumbs={[
          { label: 'Config', href: '/config' },
          { label: 'Geospatial' },
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
                geometries={displayGeometries}
                selectedGeometryRegion={selectedGeometryRegion}
                isGeometryEditing={isGeometryEditing}
                onGeometryPolygonChange={handleGeometryPolygonChange}
                onLocationSelect={handleLocationSelect}
                onLocationPolygonChange={handlePolygonChange}
                onGatePositionChange={handleGatePositionChange}
                onNewPolygonDrawn={handleNewPolygonDrawn}
                onMapClick={(lat, lon) => {
                  if (pickingCoordsForGateId && editedLocation) {
                    // Update the gate coordinates
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

                    // Also update pendingChanges so map shows the new gate position
                    const newPending = new Map(pendingChanges);
                    newPending.set(editedLocation.id, updatedLocation);
                    setPendingChanges(newPending);

                    setPickingCoordsForGateId(undefined);
                    toast.success('Coordinates updated!');
                  }
                }}
                className="w-full h-full"
              />

              {/* Floating Toolbar (top-right inside map) */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                {activeTab === 'special-locations' && (
                  <>
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
                        // Show review dialog if multiple changes, otherwise save directly
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
                  </>
                )}

                {/* Geometry Tab Toolbar */}
                {activeTab === 'geometry' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[280px] justify-between bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                        >
                          <span className="flex items-center gap-2 truncate">
                            {selectedGeometryRegion ? (
                              <span className="truncate">
                                {displayGeometries.find(g => g.region === selectedGeometryRegion)?.region || 'Select region...'}
                              </span>
                            ) : (
                              <>
                                <MapIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>All Regions ({displayGeometries.length})</span>
                              </>
                            )}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Search regions..." />
                          <CommandList>
                            <CommandEmpty>No region found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all-regions"
                                onSelect={() => {
                                  setSelectedGeometryRegion(undefined);
                                  setIsGeometryEditing(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${!selectedGeometryRegion ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <MapIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                All Regions ({displayGeometries.length})
                              </CommandItem>
                              {displayGeometries.map((geo) => (
                                <CommandItem
                                  key={geo.region}
                                  value={geo.region}
                                  onSelect={() => handleGeometrySelect(geo.region)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${selectedGeometryRegion === geo.region ? 'opacity-100' : 'opacity-0'}`}
                                  />
                                  <span className="truncate">{geo.region}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant={isGeometryEditing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsGeometryEditing(!isGeometryEditing)}
                      disabled={!selectedGeometryRegion}
                      className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                    >
                      {isGeometryEditing ? 'Done' : 'Edit'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => geometrySaveMutation.mutate()}
                      disabled={geometryPendingChanges.size === 0 || geometrySaveMutation.isPending}
                      className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                    >
                      {geometrySaveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {geometryPendingChanges.size > 0 && <span className="ml-1 text-xs">({geometryPendingChanges.size})</span>}
                    </Button>
                  </>
                )}
              </div>

              {/* Tab Switcher (top-left) */}
              <div className="absolute top-3 left-3 z-10">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
                  <TabsList className="bg-white/95 backdrop-blur-sm shadow-lg">
                    <TabsTrigger value="special-locations" className="gap-1.5">
                      <MapIcon className="h-3.5 w-3.5" />
                      Locations
                    </TabsTrigger>
                    <TabsTrigger value="geometry" className="gap-1.5">
                      Geometry
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Category Filter (below tabs) */}
              {activeTab === 'special-locations' && categoryStats.length > 0 && (
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
            // Just mark as disabled in pending changes
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

export default GeospatialPage;
