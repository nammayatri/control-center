import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { SpecialLocationFull, LatLong, GeometryAPIEntity } from '../types/specialLocation';
import { parseGeoJsonString, geoJsonToLeafletCoords, getPolygonCenter, haversineDistance } from '../lib/geoUtils';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createGateIcon = (gateType: 'Pickup' | 'Drop', isDraggable: boolean = false) => {
  const color = gateType === 'Pickup' ? '#22c55e' : '#f97316';
  const borderColor = isDraggable ? '#3b82f6' : 'white';
  const borderWidth = isDraggable ? 3 : 2;
  return L.divIcon({
    className: 'gate-marker',
    html: `<div style="
      background-color: ${color}; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: ${borderWidth}px solid ${borderColor}; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.4); 
      font-size: 14px;
      cursor: ${isDraggable ? 'grab' : 'pointer'};
      transition: all 0.2s ease;
    ">${gateType === 'Pickup' ? '📍' : '🎯'}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Location polygon style by category
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

export interface GeospatialMapProps {
  locations: SpecialLocationFull[];
  selectedLocationId?: string;
  selectedCategories: string[];
  isEditing: boolean;
  isDrawingMode?: boolean; // When true, enables polygon drawing tool
  isPickingCoords?: boolean; // When true, next map click picks coordinates
  gateToZoom?: string;
  // Geometry support
  geometries?: GeometryAPIEntity[];
  selectedGeometryRegion?: string;
  isGeometryEditing?: boolean;
  onGeometryPolygonChange?: (region: string, coords: [number, number][]) => void;
  onLocationSelect: (locationId: string) => void;
  onLocationPolygonChange?: (locationId: string, coords: [number, number][]) => void;
  onGatePositionChange?: (locationId: string, gateId: string, point: LatLong) => void;
  onNewPolygonDrawn?: (coords: [number, number][]) => void;
  onMapClick?: (lat: number, lon: number) => void; // For picking coordinates
  className?: string;
}

export function GeospatialMap({
  locations,
  selectedLocationId,
  selectedCategories,
  isEditing,
  isDrawingMode,
  isPickingCoords,
  gateToZoom,
  geometries = [],
  selectedGeometryRegion,
  isGeometryEditing,
  onGeometryPolygonChange,
  onLocationSelect,
  onLocationPolygonChange,
  onGatePositionChange,
  onNewPolygonDrawn,
  onMapClick,
  className = '',
}: Readonly<GeospatialMapProps>) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{
    polygons: Map<string, L.Polygon>;
    gates: Map<string, L.Marker>;
    locationIdByPolygon: WeakMap<L.Polygon, string>;
  }>({
    polygons: new Map(),
    gates: new Map(),
    locationIdByPolygon: new WeakMap(),
  });
  const isDraggingRef = useRef(false);
  const lastSelectedLocationId = useRef<string | undefined>(undefined);
  const lastSelectedGeometryRegion = useRef<string | undefined>(undefined);

  const [mapReady, setMapReady] = useState(false);

  // When a location is selected, show only it and neighbours within 5km radius
  const filteredLocations = useMemo(() => {
    // Start with category-filtered locations
    const baseLocations = selectedCategories.length > 0
      ? locations.filter(loc => selectedCategories.includes(loc.category))
      : locations;

    if (!selectedLocationId) {
      console.log('[GeospatialMap] No selectedLocationId, showing all', baseLocations.length, 'locations');
      return baseLocations;
    }

    const selectedLoc = baseLocations.find(l => l.id === selectedLocationId);
    if (!selectedLoc) {
      console.log('[GeospatialMap] Selected location not found in baseLocations');
      return baseLocations;
    }

    console.log('[GeospatialMap] Selected location:', selectedLoc.locationName);

    // Get center of selected location's polygon
    const selectedGeoJson = parseGeoJsonString(selectedLoc.geoJson);
    if (!selectedGeoJson) {
      console.log('[GeospatialMap] No geoJson for selected location');
      return [selectedLoc]; // Just return the selected location
    }

    const selectedCoords = geoJsonToLeafletCoords(selectedGeoJson);
    const selectedCenter = getPolygonCenter(selectedCoords);
    console.log('[GeospatialMap] Selected center:', selectedCenter);

    // Filter locations within 2km radius
    const RADIUS_KM = 2;
    const result = baseLocations.filter(loc => {
      if (loc.id === selectedLocationId) return true; // Always include selected

      const locGeoJson = parseGeoJsonString(loc.geoJson);
      if (!locGeoJson) return false;

      const locCoords = geoJsonToLeafletCoords(locGeoJson);
      const locCenter = getPolygonCenter(locCoords);

      const distance = haversineDistance(
        selectedCenter[0], selectedCenter[1],
        locCenter[0], locCenter[1]
      );

      return distance <= RADIUS_KM;
    });

    console.log('[GeospatialMap] Filtered to', result.length, 'locations within', RADIUS_KM, 'km');
    return result;
  }, [locations, selectedCategories, selectedLocationId]);

  // Handle polygon edit complete
  const handlePolygonEdit = useCallback((polygon: L.Polygon, locationId: string) => {
    const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
    const coords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
    onLocationPolygonChange?.(locationId, coords);
  }, [onLocationPolygonChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [20.5937, 78.9629];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 5,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Add CartoDB Positron tiles for cleaner geojson.io-like look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    // Configure Geoman defaults
    map.pm.setGlobalOptions({
      pathOptions: {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.3,
        weight: 2,
      },
      snappable: true,
      snapDistance: 15,
      allowSelfIntersection: false,
    });

    // Style the Geoman toolbar
    map.pm.setLang('en');

    // Add custom CSS to push Geoman controls down and standardise marker dots
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-top.leaflet-left .leaflet-pm-toolbar {
        margin-top: 10px !important;
      }
      /* Standardize Geoman dots (vertices and midpoints) */
      .leaflet-marker-icon.leaflet-pm-draggable {
        width: 10px !important;
        height: 10px !important;
        margin-left: -5px !important;
        margin-top: -5px !important;
        background: white !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 50% !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
      }
      /* Ghost markers (midpoints) slightly more transparent but same size */
      .leaflet-marker-icon.leaflet-pm-draggable.leaflet-pm-ghost-marker {
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(style);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Handle coordinate picking mode
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const container = map.getContainer();

    if (isPickingCoords) {
      // Change cursor to crosshair
      container.style.cursor = 'crosshair';

      // Use mouseup instead of click to avoid conflicts with polygon drag
      const handleMouseUp = (e: L.LeafletMouseEvent) => {
        // Don't trigger if user was dragging
        if ((e.originalEvent as MouseEvent).button === 0) {
          onMapClick?.(e.latlng.lat, e.latlng.lng);
        }
      };

      // Also handle direct click on non-layer areas
      map.on('click', handleMouseUp);

      return () => {
        map.off('click', handleMouseUp);
        container.style.cursor = '';
      };
    } else {
      container.style.cursor = '';
    }
  }, [isPickingCoords, mapReady, onMapClick]);

  // Handle Geoman controls based on editing mode
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    if (isEditing) {
      // Add Geoman controls for drawing
      map.pm.addControls({
        position: 'topleft',
        drawCircle: false,
        drawCircleMarker: false,
        drawMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawText: false,
        cutPolygon: false,
        rotateMode: false,
        dragMode: false,
        editMode: true,
        removalMode: false,
        drawPolygon: true,
      });

      // Handle new polygon creation
      const handleCreate = (e: { shape: string; layer: L.Layer }) => {
        if (e.shape === 'Polygon') {
          const polygon = e.layer as L.Polygon;
          const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
          const coords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
          onNewPolygonDrawn?.(coords);
          // Remove the drawn polygon (it will be managed by the location state)
          map.removeLayer(polygon);
        }
      };

      map.on('pm:create', handleCreate);

      return () => {
        map.off('pm:create', handleCreate);
        map.pm.removeControls();
      };
    } else {
      // Remove Geoman controls when not editing
      map.pm.removeControls();
    }
  }, [isEditing, mapReady, onNewPolygonDrawn]);

  // Enable drawing mode programmatically when isDrawingMode is true
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    if (isDrawingMode) {
      // Enable polygon drawing mode programmatically
      map.pm.enableDraw('Polygon', {
        snappable: true,
        snapDistance: 15,
        allowSelfIntersection: false,
        templineStyle: {
          color: '#3b82f6',
          weight: 2,
          dashArray: '5, 10',
        },
        hintlineStyle: {
          color: '#3b82f6',
          weight: 2,
          dashArray: '5, 10',
        },
        pathOptions: {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          weight: 2,
        },
      });
    } else {
      // Disable drawing mode
      map.pm.disableDraw();
    }
  }, [isDrawingMode, mapReady]);

  // Render location polygons and gates
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const { polygons, gates, locationIdByPolygon } = layersRef.current;
    const bounds = L.latLngBounds([]);

    // Clear existing layers
    polygons.forEach((polygon, id) => {
      // If we are currently dragging this polygon, DO NOT remove it.
      // Doing so interrupts the drag and causes the "snapping back" behavior.
      if (isDraggingRef.current && id === selectedLocationId) {
        return;
      }
      polygon.pm.disable();
      map.removeLayer(polygon);
      polygons.delete(id);
    });
    gates.forEach(marker => map.removeLayer(marker));
    gates.clear();

    // Add polygons for each location
    filteredLocations.forEach((location) => {
      // If we are currently dragging this polygon, we already have it on the map.
      // Do not add it again as it will double up or reset.
      if (isDraggingRef.current && location.id === selectedLocationId) {
        // We still bound extend the bounds if needed, but the polygon itself is held over.
        const currentPolygon = polygons.get(location.id);
        if (currentPolygon) {
          bounds.extend(currentPolygon.getBounds());
        }
        return;
      }

      const geoJson = parseGeoJsonString(location.geoJson);

      if (geoJson) {
        const coords = geoJsonToLeafletCoords(geoJson);
        if (coords.length > 0) {
          const isSelected = location.id === selectedLocationId;
          const color = getCategoryColor(location.category);

          const polygon = L.polygon(coords, {
            color: isSelected ? '#1d4ed8' : color,
            weight: isSelected ? 3 : 2,
            fillColor: color,
            fillOpacity: isSelected ? 0.35 : 0.15,
            dashArray: isSelected ? undefined : '5, 5',
          });

          // Store location ID for this polygon
          locationIdByPolygon.set(polygon, location.id);

          // Only add popup and click handler when NOT in picking coords mode
          if (!isPickingCoords) {
            // Add popup with location info (only when not editing)
            if (!isEditing) {
              polygon.bindPopup(`
                <div style="min-width: 160px; padding: 4px;">
                  <strong style="font-size: 14px;">${location.locationName}</strong><br/>
                  <span style="color: ${color}; font-size: 18px;">●</span> 
                  <span style="color: #666;">${location.category}</span><br/>
                  <small style="color: #999;">Type: ${location.locationType} | Gates: ${location.gatesInfo.length}</small>
                </div>
              `);
            }

            // Click handler to select
            polygon.on('click', () => {
              onLocationSelect(location.id);
            });
          }

          // Enable editing for selected polygon in edit mode
          if (isSelected && isEditing) {
            polygon.pm.enable({
              allowSelfIntersection: false,
              snappable: true,
              snapDistance: 15,
            });

            // Only update state when editing is complete (not during drag)
            // This prevents polygon re-render mid-edit which causes "jumping" behavior
            let vertexTimeout: any = null;

            polygon.on('pm:markerdragstart', () => {
              isDraggingRef.current = true;
              if (vertexTimeout) {
                clearTimeout(vertexTimeout);
                vertexTimeout = null;
              }
            });

            polygon.on('pm:markerdragend', () => {
              isDraggingRef.current = false;
              handlePolygonEdit(polygon, location.id);
            });

            polygon.on('pm:vertexadded', () => {
              // For midpoints, dragging starts with vertexadded.
              // We delay the update to see if it's followed by a dragstart.
              vertexTimeout = setTimeout(() => {
                if (!isDraggingRef.current) {
                  handlePolygonEdit(polygon, location.id);
                }
                vertexTimeout = null;
              }, 100);
            });

            polygon.on('pm:vertexremoved', () => {
              handlePolygonEdit(polygon, location.id);
            });
          }

          polygon.addTo(map);
          polygons.set(location.id, polygon);

          coords.forEach(coord => bounds.extend(coord));
        }
      }

      // Add gate markers
      const isLocationSelected = location.id === selectedLocationId;
      location.gatesInfo.forEach((gate) => {
        const isDraggable = isEditing && isLocationSelected;

        const marker = L.marker([gate.point.lat, gate.point.lon], {
          icon: createGateIcon(gate.gateType, isDraggable),
          draggable: isDraggable,
        });

        marker.bindPopup(`
          <div style="min-width: 140px; padding: 4px;">
            <strong style="font-size: 14px;">${gate.name}</strong><br/>
            <span style="color: ${gate.gateType === 'Pickup' ? '#22c55e' : '#f97316'};">●</span>
            <span style="color: #666;">${gate.gateType}</span><br/>
            ${gate.address ? `<small style="color: #999;">${gate.address}</small>` : ''}
            ${gate.defaultDriverExtra ? `<br/><small style="color: #666;">Extra: ₹${gate.defaultDriverExtra}</small>` : ''}
          </div>
        `);

        if (isDraggable) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onGatePositionChange?.(location.id, gate.id, { lat: pos.lat, lon: pos.lng });
          });
        }

        marker.addTo(map);
        gates.set(gate.id, marker);
        bounds.extend([gate.point.lat, gate.point.lon]);
      });
    });

    // Fit bounds if we have locations (only on initial load or category change)
    if (bounds.isValid() && !selectedLocationId) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredLocations, selectedLocationId, isEditing, isPickingCoords, mapReady, onLocationSelect, onGatePositionChange, handlePolygonEdit]);

  // Render geometry polygons (separate from location polygons)
  useEffect(() => {
    if (!mapRef.current || !mapReady || geometries.length === 0) return;

    const map = mapRef.current;
    const { polygons } = layersRef.current;
    const bounds = L.latLngBounds([]);

    // Render geometry polygons
    geometries.forEach((geo) => {
      const regionKey = `geo_${geo.region}`;

      // Skip if not selected and we have a selection
      if (selectedGeometryRegion && geo.region !== selectedGeometryRegion) {
        // Remove existing polygon for non-selected geometries
        const existing = polygons.get(regionKey);
        if (existing) {
          map.removeLayer(existing);
          polygons.delete(regionKey);
        }
        return;
      }

      const geoJson = parseGeoJsonString(geo.geom);
      if (!geoJson) return;

      const coords = geoJsonToLeafletCoords(geoJson);
      if (coords.length === 0) return;

      const isSelected = geo.region === selectedGeometryRegion;

      // Remove existing polygon to redraw
      const existing = polygons.get(regionKey);
      if (existing) {
        map.removeLayer(existing);
        polygons.delete(regionKey);
      }

      const polygon = L.polygon(coords, {
        color: isSelected ? '#dc2626' : '#059669',
        weight: isSelected ? 3 : 2,
        fillColor: isSelected ? '#dc2626' : '#059669',
        fillOpacity: isSelected ? 0.25 : 0.1,
        dashArray: isSelected ? undefined : '5, 5',
      });

      polygon.bindPopup(`<strong>${geo.region}</strong><br/><small>${geo.city} - ${geo.state}</small>`);

      // Enable editing if in geometry edit mode
      if (isGeometryEditing && isSelected) {
        polygon.pm.enable({
          allowSelfIntersection: false,
        });

        polygon.on('pm:markerdragend', () => {
          const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
          const newCoords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
          onGeometryPolygonChange?.(geo.region, newCoords);
        });

        polygon.on('pm:vertexremoved', () => {
          const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
          const newCoords: [number, number][] = latLngs.map(ll => [ll.lat, ll.lng]);
          onGeometryPolygonChange?.(geo.region, newCoords);
        });
      }

      polygon.addTo(map);
      polygons.set(regionKey, polygon);
      coords.forEach(coord => bounds.extend(coord));
    });

    // Fit bounds to selected geometry ONLY if the selection has changed
    if (bounds.isValid() && selectedGeometryRegion && lastSelectedGeometryRegion.current !== selectedGeometryRegion) {
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 14, duration: 0.8 });
      lastSelectedGeometryRegion.current = selectedGeometryRegion;
    } else if (!selectedGeometryRegion) {
      lastSelectedGeometryRegion.current = undefined;
    }
  }, [geometries, selectedGeometryRegion, isGeometryEditing, mapReady, onGeometryPolygonChange]);

  // Show/hide Geoman toolbar controls for geometry editing
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;

    if (isGeometryEditing && selectedGeometryRegion) {
      // Add Geoman toolbar with Edit and Drag tools
      map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: false,
        drawCircle: false,
        drawText: false,
        editMode: true,  // Enable edit mode button
        dragMode: true,  // Enable drag mode button
        cutPolygon: false,
        removalMode: false,
        rotateMode: false,
      });
    } else {
      // Remove Geoman toolbar controls
      map.pm.removeControls();
    }
  }, [isGeometryEditing, selectedGeometryRegion, mapReady]);

  // Selected location for explicit tracking
  const selectedLocation = useMemo(() =>
    filteredLocations.find(l => l.id === selectedLocationId),
    [filteredLocations, selectedLocationId]
  );

  // Focus on selected location ONLY when it changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocationId || !mapReady || isDraggingRef.current) return;

    // Only zoom if the selection has changed
    if (lastSelectedLocationId.current === selectedLocationId) return;

    const loc = selectedLocation;
    if (!loc) return;

    const bounds = L.latLngBounds([]);

    // Add polygon bounds directly from GeoJSON for immediate reaction
    const geoJson = parseGeoJsonString(loc.geoJson);
    if (geoJson) {
      const coords = geoJsonToLeafletCoords(geoJson);
      coords.forEach((coord: [number, number]) => bounds.extend(coord));
    }

    // Add gate positions to bounds
    loc.gatesInfo.forEach((gate: any) => {
      bounds.extend([gate.point.lat, gate.point.lon]);
    });

    // Fly to bounds with smooth animation
    if (bounds.isValid()) {
      mapRef.current.flyToBounds(bounds, {
        padding: [100, 100],
        maxZoom: 17,
        duration: 0.8
      });
      lastSelectedLocationId.current = selectedLocationId;
    }
  }, [selectedLocationId, mapReady, selectedLocation]); // Depend on selectedLocation to ensure we have data, but ref prevents double zoom

  // Reset selection ref when selection is cleared
  useEffect(() => {
    if (!selectedLocationId) {
      lastSelectedLocationId.current = undefined;
    }
  }, [selectedLocationId]);

  // Zoom to specific gate
  useEffect(() => {
    if (!mapRef.current || !gateToZoom || !mapReady) return;

    const gateMarker = layersRef.current.gates.get(gateToZoom);
    if (gateMarker) {
      const pos = gateMarker.getLatLng();
      mapRef.current.flyTo(pos, 18, { duration: 0.5 });
      setTimeout(() => gateMarker.openPopup(), 600);
    }
  }, [gateToZoom, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full min-h-[500px] ${className}`}
      style={{
        zIndex: 0,
        background: '#f8fafc',
      }}
    />
  );
}
