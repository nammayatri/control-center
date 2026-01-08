import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Page, PageHeader } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { GeospatialMap } from '../../components/GeospatialMap';
import { Save, Loader2, MapIcon, ChevronsUpDown, Check } from 'lucide-react';
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
  getGeometryList,
  getDriverGeometryList,
  updateGeometry,
  updateDriverGeometry,
} from '../../services/geospatial';
import { leafletCoordsToGeoJson, geoJsonPolygonToKml, createKmlBlob } from '../../lib/geoUtils';
import type { GeometryAPIEntity } from '../../types/specialLocation';

export function GeometriesPage() {
  const { currentMerchant, currentCity, loginModule } = useAuth();

  // State
  const [selectedGeometryRegion, setSelectedGeometryRegion] = useState<string | undefined>();
  const [geometryPendingChanges, setGeometryPendingChanges] = useState<Map<string, GeometryAPIEntity>>(new Map());
  const [isGeometryEditing, setIsGeometryEditing] = useState(false);

  // Determine which API to use based on login module
  const isBpp = loginModule === 'BPP' || loginModule === 'FLEET';
  const getGeometries = isBpp ? getDriverGeometryList : getGeometryList;
  const saveGeometry = isBpp ? updateDriverGeometry : updateGeometry;

  // Fetch geometries
  const { data: geometries = [], isLoading, refetch: refetchGeometries } = useQuery({
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

  // Geometry save mutation
  const geometrySaveMutation = useMutation({
    mutationFn: async () => {
      if (!currentMerchant?.shortId || !currentCity?.name) {
        throw new Error('Please select a merchant and city');
      }

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

  const hasPendingChanges = geometryPendingChanges.size > 0;

  return (
    <Page>
      <PageHeader
        title="Geometries"
        breadcrumbs={[
          { label: 'City Services', href: '/city-services' },
          { label: 'Geometries' },
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
                locations={[]}
                selectedLocationId={undefined}
                selectedCategories={[]}
                isEditing={false}
                geometries={displayGeometries}
                selectedGeometryRegion={selectedGeometryRegion}
                isGeometryEditing={isGeometryEditing}
                onGeometryPolygonChange={handleGeometryPolygonChange}
                onLocationSelect={() => { }}
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
                  disabled={!hasPendingChanges || geometrySaveMutation.isPending}
                  className="bg-white/95 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
                >
                  {geometrySaveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {hasPendingChanges && <span className="ml-1 text-xs">({geometryPendingChanges.size})</span>}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
