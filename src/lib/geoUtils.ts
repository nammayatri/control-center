import type {
  SpecialLocationFull,
  SpecialLocationCsvRow,
  GeoJSONPolygon,
} from '../types/specialLocation';

// ============================================
// Haversine Distance Calculation
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// GeoJSON Parsing
// ============================================

// Type for both Polygon and MultiPolygon
export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

/**
 * Safely parse a GeoJSON string from the API
 * Handles Polygon, MultiPolygon, and Feature wrappers
 */
export function parseGeoJsonString(geoJsonStr: string | undefined): GeoJSONGeometry | null {
  if (!geoJsonStr) return null;
  try {
    const parsed = JSON.parse(geoJsonStr);
    
    // Handle direct Polygon
    if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
      return parsed as GeoJSONGeometry;
    }
    
    // Handle MultiPolygon
    if (parsed.type === 'MultiPolygon' && Array.isArray(parsed.coordinates)) {
      return parsed as GeoJSONGeometry;
    }
    
    // Handle Feature wrapper
    if (parsed.type === 'Feature' && parsed.geometry) {
      if (parsed.geometry.type === 'Polygon' || parsed.geometry.type === 'MultiPolygon') {
        return parsed.geometry as GeoJSONGeometry;
      }
    }
    
    console.warn('Unsupported GeoJSON type:', parsed.type);
    return null;
  } catch {
    console.error('Failed to parse GeoJSON:', geoJsonStr);
    return null;
  }
}

/**
 * Convert GeoJSON polygon/multipolygon coordinates to [lat, lon] array for Leaflet
 * GeoJSON uses [lon, lat] while Leaflet uses [lat, lon]
 * For MultiPolygon, we take the first polygon only
 */
export function geoJsonToLeafletCoords(geometry: GeoJSONGeometry): [number, number][] {
  if (!geometry.coordinates) return [];
  
  let ring: number[][];
  
  if (geometry.type === 'Polygon') {
    // Polygon: coordinates[0] is the outer ring
    ring = (geometry.coordinates as number[][][])[0];
  } else if (geometry.type === 'MultiPolygon') {
    // MultiPolygon: coordinates[0][0] is the outer ring of the first polygon
    const multiCoords = geometry.coordinates as number[][][][];
    if (!multiCoords[0] || !multiCoords[0][0]) return [];
    ring = multiCoords[0][0];
  } else {
    return [];
  }
  
  if (!ring || ring.length === 0) return [];
  
  return ring.map(([lon, lat]) => [lat, lon] as [number, number]);
}

/**
 * Convert Leaflet [lat, lon] coordinates to GeoJSON [lon, lat, altitude]
 */
export function leafletCoordsToGeoJson(coords: [number, number][]): number[][][] {
  // Ensure polygon is closed (first point = last point)
  const closedCoords = [...coords];
  if (coords.length > 0) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closedCoords.push(first);
    }
  }
  
  return [closedCoords.map(([lat, lon]) => [lon, lat, 0])];
}

// ============================================
// GeoJSON to KML Conversion
// ============================================

/**
 * Convert GeoJSON polygon to KML format
 * Expected KML structure based on user-provided sample
 */
export function geoJsonToKml(
  polygon: GeoJSONPolygon,
  name: string,
  id?: string
): string {
  const placemarkId = id || generateId();
  const coordinates = polygon.coordinates[0]
    .map(([lon, lat, alt = 0]) => `${lon},${lat},${alt}`)
    .join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">
<Document>
\t<Schema name="temp" id="temp">
\t\t<SimpleField type="string" name="id">
\t\t</SimpleField>
\t</Schema>
\t<Placemark id="${placemarkId}">
\t\t<name>${escapeXml(name)}</name>
\t\t<ExtendedData>
\t\t\t<SchemaData schemaUrl="#temp">
\t\t\t\t<SimpleData name="id">${placemarkId}</SimpleData>
\t\t\t</SchemaData>
\t\t</ExtendedData>
\t\t<Polygon>
\t\t\t<outerBoundaryIs>
\t\t\t\t<LinearRing>
\t\t\t\t\t<coordinates>
\t\t\t\t\t\t${coordinates}
\t\t\t\t\t</coordinates>
\t\t\t\t</LinearRing>
\t\t\t</outerBoundaryIs>
\t\t</Polygon>
\t</Placemark>
</Document>
</kml>`;
}

/**
 * Convert a Leaflet polygon coordinates to KML
 */
export function leafletPolygonToKml(
  coords: [number, number][],
  name: string,
  id?: string
): string {
  const geoJsonCoords = leafletCoordsToGeoJson(coords);
  const polygon: GeoJSONPolygon = {
    type: 'Polygon',
    coordinates: geoJsonCoords,
  };
  return geoJsonToKml(polygon, name, id);
}

/**
 * Convert GeoJSON polygon coordinates (already in [lon, lat] format) to KML
 */
export function geoJsonPolygonToKml(
  coords: number[][],
  name: string,
  id?: string
): string {
  const polygon: GeoJSONPolygon = {
    type: 'Polygon',
    coordinates: [coords],
  };
  return geoJsonToKml(polygon, name, id);
}

/**
 * Create a KML Blob for file upload
 */
export function createKmlBlob(kmlContent: string): Blob {
  return new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
}

/**
 * Basic KML parser to extract coordinates and convert to Leaflet format
 * Returns [lat, lon][]
 */
export function parseKmlToLeafletCoords(kmlContent: string): [number, number][] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
    const coordinatesNode = xmlDoc.getElementsByTagName('coordinates')[0];
    
    if (!coordinatesNode || !coordinatesNode.textContent) {
      console.warn('No coordinates found in KML');
      return [];
    }
    
    const coordString = coordinatesNode.textContent.trim();
    const coordPairs = coordString.split(/\s+/);
    
    const result: [number, number][] = [];
    coordPairs.forEach(pair => {
      const parts = pair.split(',');
      if (parts.length >= 2) {
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lon) && !isNaN(lat)) {
          result.push([lat, lon]);
        }
      }
    });

    // Ensure it's a closed ring for Leaflet (remove last if same as first)
    if (result.length > 2) {
      const first = result[0];
      const last = result[result.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        return result.slice(0, -1);
      }
    }
    
    return result;
  } catch (e) {
    console.error('Failed to parse KML:', e);
    return [];
  }
}

// ============================================
// CSV Generation
// ============================================

const CSV_HEADERS: (keyof SpecialLocationCsvRow)[] = [
  'city',
  'ref_id',
  'location_name',
  'location_file_name',
  'location_type',
  'category',
  'gate_info_lat',
  'gate_info_lon',
  'gate_info_default_driver_extra',
  'gate_info_name',
  'gate_info_address',
  'gate_info_type',
  'gate_info_has_geom',
  'gate_info_file_name',
  'gate_info_can_queue_up_on_gate',
  'enabled',
  'priority',
  'pickup_priority',
  'drop_priority',
];

/**
 * Generate CSV content from special location rows
 */
export function generateSpecialLocationCsv(rows: SpecialLocationCsvRow[]): string {
  const header = CSV_HEADERS.join(',');
  const dataRows = rows.map((row) =>
    CSV_HEADERS.map((key) => {
      const value = row[key];
      // Handle boolean values - capitalize for Python/backend compatibility
      if (typeof value === 'boolean') {
        return value ? 'True' : 'False';
      }
      // Handle string quoting for fields that might contain commas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );
  
  return [header, ...dataRows].join('\n');
}

/**
 * Create a CSV Blob for file upload
 */
export function createCsvBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Convert SpecialLocationFull to CSV rows (one row per gate)
 */
export function specialLocationToCsvRows(
  location: SpecialLocationFull,
  city: string,
  enabled: boolean = true,
  priority: number = 0
): SpecialLocationCsvRow[] {
  const locationFileName = `${location.locationName.replace(/\s+/g, '_')}.kml`;
  
  // If no gates, create a single row with empty gate info
  if (!location.gatesInfo || location.gatesInfo.length === 0) {
    return [{
      city,
      ref_id: `${city} - ${location.locationName}`,
      location_name: location.locationName,
      location_file_name: locationFileName,
      location_type: location.locationType,
      category: location.category,
      gate_info_lat: 0,
      gate_info_lon: 0,
      gate_info_default_driver_extra: 0,
      gate_info_name: '',
      gate_info_address: '',
      gate_info_type: 'Pickup',
      gate_info_has_geom: false,
      gate_info_file_name: '',
      gate_info_can_queue_up_on_gate: false,
      enabled,
      priority,
      pickup_priority: 0,
      drop_priority: 0,
    }];
  }

  // Create one row per gate
  return location.gatesInfo.map((gate): SpecialLocationCsvRow => {
    const gateFileName = gate.geoJson 
      ? `${location.locationName.replace(/\s+/g, '_')}_${gate.name.replace(/\s+/g, '_')}.kml`
      : '';
    
    return {
      city,
      ref_id: `${city} - ${location.locationName}`,
      location_name: location.locationName,
      location_file_name: locationFileName,
      location_type: location.locationType,
      category: location.category,
      gate_info_lat: gate.point.lat,
      gate_info_lon: gate.point.lon,
      gate_info_default_driver_extra: gate.defaultDriverExtra || 0,
      gate_info_name: gate.name,
      gate_info_address: gate.address || '',
      gate_info_type: gate.gateType,
      gate_info_has_geom: !!gate.geoJson,
      gate_info_file_name: gateFileName,
      gate_info_can_queue_up_on_gate: gate.canQueueUpOnGate,
      enabled,
      priority,
      pickup_priority: 0,
      drop_priority: 0,
    };
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique ID for KML placemarks
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate the center point of a polygon for map fitting
 */
export function getPolygonCenter(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [0, 0];
  
  const sum = coords.reduce(
    (acc, [lat, lon]) => [acc[0] + lat, acc[1] + lon],
    [0, 0]
  );
  
  return [sum[0] / coords.length, sum[1] / coords.length];
}

/**
 * Calculate bounds for a polygon
 */
export function getPolygonBounds(
  coords: [number, number][]
): { minLat: number; maxLat: number; minLon: number; maxLon: number } | null {
  if (coords.length === 0) return null;
  
  const lats = coords.map(([lat]) => lat);
  const lons = coords.map(([, lon]) => lon);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}
