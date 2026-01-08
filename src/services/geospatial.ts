import { bapApi, bppApi, apiRequest, buildPath, buildQueryParams } from './api';
import type {
  SpecialLocationFull,
  GeometryAPIEntity,
} from '../types/specialLocation';

// ============================================
// Special Location APIs
// ============================================

export interface SpecialLocationListParams {
  limit?: number;
  offset?: number;
}

/**
 * Get list of special locations for a city
 * GET /dashboard/{merchantId}/{city}/merchant/config/specialLocation/list
 */
export async function getSpecialLocationList(
  merchantId: string,
  city: string,
  params: SpecialLocationListParams = {}
): Promise<SpecialLocationFull[]> {
  const basePath = `/{merchantId}/{city}/merchant/config/specialLocation/list`;
  const path = buildPath(basePath, merchantId, city);
  const queryParams = buildQueryParams({
    limit: params.limit,
    offset: params.offset,
  });

  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${queryParams}`,
  });
}

/**
 * Get list of special locations for driver app (BPP)
 * Uses the same endpoint structure
 */
export async function getDriverSpecialLocationList(
  merchantId: string,
  city: string,
  params: SpecialLocationListParams = {}
): Promise<SpecialLocationFull[]> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/specialLocation/list`;
  const path = buildPath(basePath, merchantId, city);
  const queryParams = buildQueryParams({
    limit: params.limit,
    offset: params.offset,
  });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${queryParams}`,
  });
}

export interface KmlFile {
  filename: string;
  content: Blob;
}

/**
 * Upsert special locations with CSV and KML files
 * POST /dashboard/{merchantId}/{city}/merchant/config/specialLocation/upsert
 * 
 * This single API handles all CRUD operations:
 * - Create: Add new rows to CSV
 * - Update: Modify existing rows in CSV
 * - Delete: Set enabled=False in CSV
 */
export async function upsertSpecialLocation(
  merchantId: string,
  city: string,
  csvFile: File | Blob,
  locationGeoms: KmlFile[] = [],
  gateGeoms: KmlFile[] = []
): Promise<{ success: boolean; unprocessedEntities?: string[] }> {
  const basePath = `/{merchantId}/{city}/merchant/config/specialLocation/upsert`;
  const path = buildPath(basePath, merchantId, city);

  const formData = new FormData();
  formData.append('file', csvFile, 'special_location.csv');

  // Append location geometry KML files
  locationGeoms.forEach((kml) => {
    formData.append('locationGeoms', kml.content, kml.filename);
  });

  // Append gate geometry KML files (optional)
  gateGeoms.forEach((kml) => {
    formData.append('gateGeoms', kml.content, kml.filename);
  });

  return apiRequest(bapApi, {
    method: 'POST',
    url: path,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Upsert special locations for driver app (BPP)
 */
export async function upsertDriverSpecialLocation(
  merchantId: string,
  city: string,
  csvFile: File | Blob,
  locationGeoms: KmlFile[] = [],
  gateGeoms: KmlFile[] = []
): Promise<{ success: boolean; unprocessedEntities?: string[] }> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/specialLocation/upsert`;
  const path = buildPath(basePath, merchantId, city);

  const formData = new FormData();
  formData.append('file', csvFile, 'special_location.csv');

  locationGeoms.forEach((kml) => {
    formData.append('locationGeoms', kml.content, kml.filename);
  });

  gateGeoms.forEach((kml) => {
    formData.append('gateGeoms', kml.content, kml.filename);
  });

  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ============================================
// Geometry APIs
// ============================================

export interface GeometryListParams {
  limit?: number;
  offset?: number;
}

/**
 * Get list of geometries for a city (BAP)
 * GET /dashboard/{merchantId}/{city}/merchant/config/geometry/list
 */
export async function getGeometryList(
  merchantId: string,
  city: string,
  params: GeometryListParams = {}
): Promise<GeometryAPIEntity[]> {
  const basePath = `/{merchantId}/{city}/merchant/config/geometry/list`;
  const path = buildPath(basePath, merchantId, city);
  const queryParams = buildQueryParams({
    limit: params.limit,
    offset: params.offset,
  });

  return apiRequest(bapApi, {
    method: 'GET',
    url: `${path}${queryParams}`,
  });
}

/**
 * Get list of geometries for driver app (BPP)
 */
export async function getDriverGeometryList(
  merchantId: string,
  city: string,
  params: GeometryListParams = {}
): Promise<GeometryAPIEntity[]> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/geometry/list`;
  const path = buildPath(basePath, merchantId, city);
  const queryParams = buildQueryParams({
    limit: params.limit,
    offset: params.offset,
  });

  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${queryParams}`,
  });
}

/**
 * Update geometry (BAP)
 * PUT /dashboard/{merchantId}/{city}/merchant/config/geometry/update
 * Multipart form data: region (text), file (kml)
 */
export async function updateGeometry(
  merchantId: string,
  city: string,
  region: string,
  kmlFile: Blob
): Promise<{ success: boolean }> {
  const basePath = `/{merchantId}/{city}/merchant/config/geometry/update`;
  const path = buildPath(basePath, merchantId, city);

  const formData = new FormData();
  formData.append('region', region);
  formData.append('file', kmlFile, `${region.replace(/\s+/g, '_')}.kml`);

  return apiRequest(bapApi, {
    method: 'PUT',
    url: path,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Update geometry for driver app (BPP)
 * Multipart form data: region (text), file (kml)
 */
export async function updateDriverGeometry(
  merchantId: string,
  city: string,
  region: string,
  kmlFile: Blob
): Promise<{ success: boolean }> {
  const basePath = `/driver-offer/{merchantId}/{city}/merchant/config/geometry/update`;
  const path = buildPath(basePath, merchantId, city);

  const formData = new FormData();
  formData.append('region', region);
  formData.append('file', kmlFile, `${region.replace(/\s+/g, '_')}.kml`);

  return apiRequest(bppApi, {
    method: 'PUT',
    url: path,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get unique categories from special locations list
 */
export function getCategoriesFromLocations(
  locations: SpecialLocationFull[]
): { category: string; count: number }[] {
  const categoryMap = new Map<string, number>();
  
  locations.forEach((loc) => {
    const count = categoryMap.get(loc.category) || 0;
    categoryMap.set(loc.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
