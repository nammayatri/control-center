import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ExternalLink, MapPin, Navigation, Car, Target, CheckCircle } from 'lucide-react';
import type { RoutePoint } from '../services/rides';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const ICONS = {
  driverStart: createCustomIcon('#6366f1', '🚗'),
  pickup: createCustomIcon('#22c55e', '📍'),
  estimatedDrop: createCustomIcon('#f59e0b', '🎯'),
  actualDrop: createCustomIcon('#3b82f6', '✅'),
};

interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface RouteMapProps {
  actualRoute: RoutePoint[];
  pickupLocation?: Location;
  estimatedDropLocation?: Location;
  actualDropLocation?: Location;
}

export function RouteMap({
  actualRoute,
  pickupLocation,
  estimatedDropLocation,
  actualDropLocation,
}: Readonly<RouteMapProps>) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Layer visibility states
  const [showDriverRoute, setShowDriverRoute] = useState(true);
  const [showEstimatedRoute, setShowEstimatedRoute] = useState(true);
  const [showActualRoute, setShowActualRoute] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center (Bangalore)
    const defaultCenter: [number, number] = [12.9716, 77.5946];
    
    // Create map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map layers when data or visibility changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const bounds = L.latLngBounds([]);

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add driver route polylines
    if (showDriverRoute && actualRoute.length > 0) {
      // Separate ON_PICKUP and ON_RIDE points
      const pickupPoints: [number, number][] = [];
      const ridePoints: [number, number][] = [];
      
      actualRoute.forEach((point) => {
        const latLng: [number, number] = [point.lat, point.lon];
        bounds.extend(latLng);
        
        if (point.rideStatus === 'ON_PICKUP') {
          pickupPoints.push(latLng);
        } else {
          ridePoints.push(latLng);
        }
      });

      // Draw ON_PICKUP route (orange)
      if (pickupPoints.length > 1) {
        L.polyline(pickupPoints, { color: '#f97316', weight: 4, opacity: 0.8 }).addTo(map);
      }

      // Draw ON_RIDE route (blue)
      if (ridePoints.length > 1) {
        L.polyline(ridePoints, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
      }

      // Add driver start marker
      const start = actualRoute[0];
      L.marker([start.lat, start.lon], { icon: ICONS.driverStart })
        .bindPopup('<b>Driver Start Location</b>')
        .addTo(map);
    }

    // Add pickup marker
    if (pickupLocation) {
      bounds.extend([pickupLocation.lat, pickupLocation.lon]);
      L.marker([pickupLocation.lat, pickupLocation.lon], { icon: ICONS.pickup })
        .bindPopup(`<b>Pickup Location</b><br/>${pickupLocation.address || ''}`)
        .addTo(map);
    }

    // Add estimated drop marker and route line
    if (estimatedDropLocation) {
      bounds.extend([estimatedDropLocation.lat, estimatedDropLocation.lon]);
      L.marker([estimatedDropLocation.lat, estimatedDropLocation.lon], { icon: ICONS.estimatedDrop })
        .bindPopup(`<b>Estimated Drop</b><br/>${estimatedDropLocation.address || ''}`)
        .addTo(map);

      if (showEstimatedRoute && pickupLocation) {
        L.polyline(
          [[pickupLocation.lat, pickupLocation.lon], [estimatedDropLocation.lat, estimatedDropLocation.lon]],
          { color: '#f59e0b', weight: 3, opacity: 0.6, dashArray: '10, 10' }
        ).addTo(map);
      }
    }

    // Add actual drop marker and route line
    if (actualDropLocation) {
      bounds.extend([actualDropLocation.lat, actualDropLocation.lon]);
      L.marker([actualDropLocation.lat, actualDropLocation.lon], { icon: ICONS.actualDrop })
        .bindPopup(`<b>Actual Drop</b><br/>${actualDropLocation.address || ''}`)
        .addTo(map);

      if (showActualRoute && pickupLocation) {
        L.polyline(
          [[pickupLocation.lat, pickupLocation.lon], [actualDropLocation.lat, actualDropLocation.lon]],
          { color: '#3b82f6', weight: 3, opacity: 0.6, dashArray: '10, 10' }
        ).addTo(map);
      }
    }

    // Fit bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [actualRoute, pickupLocation, estimatedDropLocation, actualDropLocation, showDriverRoute, showEstimatedRoute, showActualRoute]);

  // Google Maps links
  const openGoogleMapsDirections = (from: Location, to: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Layers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="driver-route"
                checked={showDriverRoute}
                onCheckedChange={setShowDriverRoute}
              />
              <Label htmlFor="driver-route" className="flex items-center gap-2 cursor-pointer">
                <div className="w-4 h-1 bg-orange-500 rounded" />
                <div className="w-4 h-1 bg-blue-500 rounded" />
                Driver's Actual Path
              </Label>
            </div>
            
            {estimatedDropLocation && (
              <div className="flex items-center gap-2">
                <Switch
                  id="estimated-route"
                  checked={showEstimatedRoute}
                  onCheckedChange={setShowEstimatedRoute}
                />
                <Label htmlFor="estimated-route" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-500" />
                  Pickup → Estimated Drop
                </Label>
              </div>
            )}
            
            {actualDropLocation && (
              <div className="flex items-center gap-2">
                <Switch
                  id="actual-route"
                  checked={showActualRoute}
                  onCheckedChange={setShowActualRoute}
                />
                <Label htmlFor="actual-route" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-500" />
                  Pickup → Actual Drop
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div ref={mapContainerRef} className="h-[500px] w-full" />
        </CardContent>
      </Card>

      {/* Legend and Google Maps Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-indigo-500" />
              <span>Driver Start Location</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>Customer Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <span>Estimated Drop</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>Actual Drop</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="w-4 h-1 bg-orange-500 rounded" />
              <span>ON_PICKUP (driver coming to pickup)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500 rounded" />
              <span>ON_RIDE (ride in progress)</span>
            </div>
          </CardContent>
        </Card>

        {/* Google Maps Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in Google Maps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {actualRoute.length > 0 && pickupLocation && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => openGoogleMapsDirections(
                  { lat: actualRoute[0].lat, lon: actualRoute[0].lon },
                  pickupLocation
                )}
              >
                <Car className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="mr-1">→</span>
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                Driver Start to Pickup
              </Button>
            )}
            {pickupLocation && estimatedDropLocation && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => openGoogleMapsDirections(pickupLocation, estimatedDropLocation)}
              >
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                <span className="mr-1">→</span>
                <Target className="h-4 w-4 mr-2 text-amber-500" />
                Pickup to Estimated Drop
              </Button>
            )}
            {pickupLocation && actualDropLocation && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => openGoogleMapsDirections(pickupLocation, actualDropLocation)}
              >
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                <span className="mr-1">→</span>
                <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                Pickup to Actual Drop
              </Button>
            )}
            {actualRoute.length > 0 && actualDropLocation && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => openGoogleMapsDirections(
                  { lat: actualRoute[0].lat, lon: actualRoute[0].lon },
                  actualDropLocation
                )}
              >
                <Car className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="mr-1">→</span>
                <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                Driver Start to Actual Drop
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
