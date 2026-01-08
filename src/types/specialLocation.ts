// Types for Special Location API entities
// Based on API spec: /dashboard/{merchantId}/{city}/merchant/config/specialLocation/list

import type { City } from './index';

// ============================================
// Gate Types
// ============================================

export type GateType = 'Pickup' | 'Drop';

export interface LatLong {
  lat: number;
  lon: number;
}

export interface GateInfoFull {
  id: string;
  specialLocationId: string;
  point: LatLong;
  name: string;
  canQueueUpOnGate: boolean;
  gateType: GateType;
  address?: string;
  defaultDriverExtra?: number;
  geoJson?: string; // GeoJSON string for gate boundary
}

export interface GatesInfo {
  point: LatLong;
  name: string;
  address?: string;
}

// ============================================
// Special Location Types
// ============================================

export type SpecialLocationType = 'Open' | 'Closed';

export interface SpecialLocationFull {
  id: string;
  locationName: string;
  category: string;
  linkedLocationsIds: string[];
  locationType: SpecialLocationType;
  gatesInfo: GateInfoFull[];
  gates: GatesInfo[];
  createdAt: string; // ISO date string
  geoJson?: string; // GeoJSON string for location boundary
  merchantOperatingCityId?: string;
}

// ============================================
// Geometry Types
// ============================================

export type IndianState = 
  | 'AndhraPradesh'
  | 'ArunachalPradesh'
  | 'Assam'
  | 'Bihar'
  | 'Chhattisgarh'
  | 'Delhi'
  | 'Goa'
  | 'Gujarat'
  | 'Haryana'
  | 'HimachalPradesh'
  | 'Jharkhand'
  | 'Karnataka'
  | 'Kerala'
  | 'MadhyaPradesh'
  | 'Maharashtra'
  | 'Manipur'
  | 'Meghalaya'
  | 'Mizoram'
  | 'Nagaland'
  | 'Odisha'
  | 'Punjab'
  | 'Rajasthan'
  | 'Sikkim'
  | 'TamilNadu'
  | 'Telangana'
  | 'Tripura'
  | 'UttarPradesh'
  | 'Uttarakhand'
  | 'WestBengal';

export interface GeometryAPIEntity {
  region: string;
  state: IndianState;
  city: City;
  geom?: string; // GeoJSON string
}

// ============================================
// CSV Row Type for Upsert API
// ============================================

export interface SpecialLocationCsvRow {
  city: string;
  ref_id: string;
  location_name: string;
  location_file_name: string; // KML filename for location geometry
  location_type: SpecialLocationType;
  category: string;
  gate_info_lat: number;
  gate_info_lon: number;
  gate_info_default_driver_extra: number;
  gate_info_name: string;
  gate_info_address: string;
  gate_info_type: GateType;
  gate_info_has_geom: boolean;
  gate_info_file_name: string; // KML filename for gate geometry (optional)
  gate_info_can_queue_up_on_gate: boolean;
  enabled: boolean;
  priority: number;
  pickup_priority: number;
  drop_priority: number;
}

// ============================================
// Upsert Request Types
// ============================================

export interface UpsertSpecialLocationReqT {
  category?: string;
  city?: City;
  geom?: string;
  locationName?: string;
}

export interface UpsertSpecialLocationGateReqT {
  name: string;
  address?: string;
  canQueueUpOnGate?: boolean;
  defaultDriverExtra?: number;
  geom?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// Component State Types
// ============================================

export interface EditableSpecialLocation extends SpecialLocationFull {
  isDirty: boolean;
  isNew: boolean;
}

export interface EditableGate extends GateInfoFull {
  isDirty: boolean;
  isNew: boolean;
}

// Category filter state
export interface CategoryCount {
  category: string;
  count: number;
}

// GeoJSON types for map rendering
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: GeoJSONPolygon;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
