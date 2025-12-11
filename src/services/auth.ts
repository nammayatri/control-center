import { bapApi, bppApi, apiRequest } from './api';
import type { User, LoginModule, FleetConfig, UserAccessMatrix, Role } from '../types';

// ============================================
// BAP (Customer Dashboard) Login - Password Based
// ============================================

export interface BapLoginRequest {
  email: string;
  password: string;
}

export interface BapLoginResponse {
  token: string;
  personId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  roles?: Role[];
}

export async function loginBap(data: BapLoginRequest): Promise<{ token: string; user: User }> {
  const response = await apiRequest<BapLoginResponse>(bapApi, {
    method: 'POST',
    url: '/user/login',
    data,
  });

  console.log('BAP Login Raw Response:', response);

  // Handle different response formats
  const token = response.token || (response as any).authToken || (response as any).accessToken;

  if (!token) {
    console.error('No token in response:', response);
    throw new Error('No token received from server');
  }

  const user: User = {
    id: response.personId || (response as any).userId || (response as any).id || 'unknown',
    firstName: response.firstName || (response as any).name || 'Admin',
    lastName: response.lastName,
    email: response.email || data.email,
    mobileNumber: response.mobileNumber || '',
    mobileCountryCode: response.mobileCountryCode || '+91',
    roles: response.roles || [],
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  console.log('Parsed user:', user);
  return { token, user };
}

// ============================================
// BPP (Driver Dashboard) Login - Password Based
// ============================================

export interface BppLoginRequest {
  email: string;
  password: string;
}

export interface BppLoginResponse {
  token: string;
  personId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  roles?: Role[];
}

export async function loginBpp(data: BppLoginRequest): Promise<{ token: string; user: User }> {
  const response = await apiRequest<BppLoginResponse>(bppApi, {
    method: 'POST',
    url: '/user/login',
    data,
  });

  console.log('BPP Login Raw Response:', response);

  // Handle different response formats
  const token = response.token || (response as any).authToken || (response as any).accessToken;

  if (!token) {
    console.error('No token in response:', response);
    throw new Error('No token received from server');
  }

  const user: User = {
    id: response.personId || (response as any).userId || (response as any).id || 'unknown',
    firstName: response.firstName || (response as any).name || 'Admin',
    lastName: response.lastName,
    email: response.email || data.email,
    mobileNumber: response.mobileNumber || '',
    mobileCountryCode: response.mobileCountryCode || '+91',
    roles: response.roles || [],
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  console.log('Parsed user:', user);
  return { token, user };
}

// ============================================
// Fleet Login - OTP Based
// ============================================

export interface FleetRequestOtpRequest {
  mobileNumber: string;
  mobileCountryCode: string;
}

export interface FleetRequestOtpResponse {
  attempts: number;
  authId: string;
  authType: string;
}

export async function requestFleetOtp(
  fleetConfig: FleetConfig,
  data: FleetRequestOtpRequest
): Promise<FleetRequestOtpResponse> {
  const { merchantId, city } = fleetConfig;

  return apiRequest<FleetRequestOtpResponse>(bppApi, {
    method: 'POST',
    url: `/driver-offer/${merchantId}/${city}/fleet/v2/login/otp`,
    data,
  });
}

export interface FleetVerifyOtpRequest {
  mobileNumber: string;
  mobileCountryCode: string;
  otp: string;
}

export interface FleetVerifyOtpResponse {
  token: string;
  personId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  fleetOwnerId?: string;
  fleetType?: string;
}

export async function verifyFleetOtp(
  fleetConfig: FleetConfig,
  data: FleetVerifyOtpRequest
): Promise<{ token: string; user: User }> {
  const { merchantId, city } = fleetConfig;

  const response = await apiRequest<FleetVerifyOtpResponse>(bppApi, {
    method: 'POST',
    url: `/driver-offer/${merchantId}/${city}/fleet/v2/verify/otp`,
    data,
  });

  const user: User = {
    id: response.personId || response.fleetOwnerId || '',
    firstName: response.firstName || 'Fleet Owner',
    lastName: response.lastName,
    email: response.email,
    mobileNumber: response.mobileNumber || data.mobileNumber,
    mobileCountryCode: response.mobileCountryCode || data.mobileCountryCode,
    roles: [{ id: 'fleet_owner', name: 'Fleet Owner' }],
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  return { token: response.token, user };
}

// ============================================
// Common Auth Functions
// ============================================

export async function logout(module: LoginModule): Promise<void> {
  const api = module === 'BAP' ? bapApi : bppApi;

  try {
    await apiRequest(api, {
      method: 'POST',
      url: '/user/logout',
    });
  } catch {
    // Ignore logout errors
  }
}

// ============================================
// Profile API Types
// ============================================

export interface MerchantCity {
  cityId: string;
  cityName: string;
}

export interface AvailableMerchant {
  merchantId: string;
  merchantShortId: string;
  merchantName: string;
}

// Mapping of merchant to their available cities
export interface MerchantCityMapping {
  merchantShortId: string;
  cities: MerchantCity[];
}

export interface ProfileResponse {
  personId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  mobileCountryCode?: string;
  roles?: Role[];
  availableMerchants: AvailableMerchant[];
  availableCitiesForMerchant: MerchantCity[];
  merchantCityMap: MerchantCityMapping[];
  currentMerchant?: {
    merchantId: string;
    merchantShortId: string;
    merchantName: string;
  };
  currentCity?: {
    cityId: string;
    cityName: string;
  };
}

export interface AccessMatrixItem {
  userActionType: string;
  userAccessType: string;
}

// City code to name mapping for STD codes
const CITY_NAME_MAP: Record<string, string> = {
  'std:080': 'Bangalore',
  'std:044': 'Chennai',
  'std:033': 'Kolkata',
  'std:011': 'Delhi',
  'std:0484': 'Kochi',
  'std:040': 'Hyderabad',
  'std:022': 'Mumbai',
  'std:0821': 'Mysore',
  'std:0816': 'Tumkur',
  'std:0353': 'Siliguri',
};

// Merchant short ID to display name mapping
const MERCHANT_NAME_MAP: Record<string, string> = {
  'NAMMA_YATRI': 'Namma Yatri',
  'YATRI': 'Yatri',
  'JATRI_SAATHI': 'Jatri Saathi',
  'ANNA_APP': 'Anna App',
  'NAMMA_YATRI_PARTNER': 'Namma Yatri Partner',
  'YATRI_PARTNER': 'Yatri Partner',
  'JATRI_SAATHI_PARTNER': 'Jatri Saathi Partner',
  'Y_PARTNER': 'Y Partner',
};

function getCityName(cityCode: string): string {
  return CITY_NAME_MAP[cityCode] || cityCode.replace('std:', '');
}

function getMerchantName(merchantShortId: string): string {
  return MERCHANT_NAME_MAP[merchantShortId] || merchantShortId.replace(/_/g, ' ');
}

export async function getProfile(module: LoginModule): Promise<ProfileResponse> {
  const api = module === 'BAP' ? bapApi : bppApi;

  try {
    const response = await apiRequest<any>(api, {
      method: 'GET',
      url: '/user/profile',
    });

    console.log('Profile Raw Response:', JSON.stringify(response, null, 2));

    // Handle different response formats
    const data = response.result || response.data || response;

    // The availableCitiesForMerchant contains both merchants and their cities
    // Format: [{ merchantShortId: "NAMMA_YATRI", operatingCity: ["std:080", "std:044"] }]
    const rawData = data.availableCitiesForMerchant || data.available_cities_for_merchant || [];

    // Extract unique merchants and build merchant-city mapping
    const merchants: AvailableMerchant[] = [];
    const allCities: MerchantCity[] = [];
    const merchantCityMap: MerchantCityMapping[] = [];

    if (Array.isArray(rawData)) {
      rawData.forEach((item: any) => {
        const merchantShortId = item.merchantShortId || item.merchant_short_id || '';
        if (merchantShortId) {
          merchants.push({
            merchantId: merchantShortId, // Use shortId as ID
            merchantShortId: merchantShortId,
            merchantName: getMerchantName(merchantShortId),
          });

          // Extract cities for this merchant
          const cityList = item.operatingCity || item.operating_city || item.cities || [];
          const merchantCities: MerchantCity[] = [];

          if (Array.isArray(cityList)) {
            cityList.forEach((cityCode: string) => {
              const city: MerchantCity = {
                cityId: cityCode,
                cityName: getCityName(cityCode),
              };
              merchantCities.push(city);

              // Only add to global list if not already present
              if (!allCities.find(c => c.cityId === cityCode)) {
                allCities.push(city);
              }
            });
          }

          // Store merchant-city mapping
          merchantCityMap.push({
            merchantShortId,
            cities: merchantCities,
          });
        }
      });
    }

    console.log('Parsed merchants:', merchants);
    console.log('Parsed cities:', allCities);
    console.log('Merchant-City Map:', merchantCityMap);

    // Extract current merchant
    const rawCurrentMerchant = data.currentMerchant || data.current_merchant;
    let currentMerchant = undefined;
    if (rawCurrentMerchant) {
      const shortId = rawCurrentMerchant.merchantShortId || rawCurrentMerchant.merchant_short_id || rawCurrentMerchant.shortId || '';
      currentMerchant = {
        merchantId: rawCurrentMerchant.merchantId || rawCurrentMerchant.merchant_id || shortId,
        merchantShortId: shortId,
        merchantName: rawCurrentMerchant.merchantName || rawCurrentMerchant.merchant_name || getMerchantName(shortId),
      };
    }

    // Extract current city
    const rawCurrentCity = data.currentCity || data.current_city || data.merchantOperatingCityId;
    let currentCity = undefined;
    if (rawCurrentCity) {
      if (typeof rawCurrentCity === 'string') {
        currentCity = {
          cityId: rawCurrentCity,
          cityName: getCityName(rawCurrentCity),
        };
      } else {
        const cityId = rawCurrentCity.cityId || rawCurrentCity.city_id || rawCurrentCity.id || '';
        currentCity = {
          cityId: cityId,
          cityName: rawCurrentCity.cityName || rawCurrentCity.city_name || getCityName(cityId),
        };
      }
    }

    return {
      personId: data.personId || data.person_id || data.id || '',
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      email: data.email,
      mobileNumber: data.mobileNumber || data.mobile_number,
      mobileCountryCode: data.mobileCountryCode || data.mobile_country_code,
      roles: data.roles || (data.role ? [data.role] : []),
      availableMerchants: merchants,
      availableCitiesForMerchant: allCities,
      merchantCityMap,
      currentMerchant,
      currentCity,
    };
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // Return empty profile on error - don't break login flow
    return {
      personId: '',
      availableMerchants: [],
      availableCitiesForMerchant: [],
      merchantCityMap: [],
    };
  }
}

export async function getAccessMatrix(module: LoginModule): Promise<UserAccessMatrix[]> {
  const api = module === 'BAP' ? bapApi : bppApi;

  try {
    const response = await apiRequest<any>(api, {
      method: 'GET',
      url: '/user/getAccessMatrix',
    });

    console.log('Access Matrix Response:', response);

    // Handle nested structure from API
    if (response && response.accessMatrixRow && Array.isArray(response.accessMatrixRow)) {
      return response.accessMatrixRow;
    }

    // Fallback if it returns array directly
    if (Array.isArray(response)) {
      return response;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch access matrix:', error);
    // Return empty array on error - don't break login flow
    return [];
  }
}

export async function switchMerchant(module: LoginModule, merchantId: string): Promise<{ token: string }> {
  const api = module === 'BAP' ? bapApi : bppApi;

  const response = await apiRequest<{ token: string }>(api, {
    method: 'POST',
    url: '/user/switchMerchant',
    data: { merchantId },
  });

  return response;
}

export interface SwitchMerchantCityResponse {
  authToken: string;
  city: string;
  merchantId: string;
  message?: string;
  is2faEnabled?: boolean;
  is2faMandatory?: boolean;
}

export async function switchMerchantAndCity(
  module: LoginModule,
  merchantId: string,
  cityId: string
): Promise<{ token: string }> {
  const api = module === 'BAP' ? bapApi : bppApi;

  const response = await apiRequest<SwitchMerchantCityResponse>(api, {
    method: 'POST',
    url: '/user/switchMerchantAndCity',
    data: { merchantId, city: cityId },
  });

  console.log('Switch Merchant/City Response:', response);

  // Return the token in a normalized format
  return { token: response.authToken };
}

export interface ChangePasswordRequest {
  newPassword: string;
  oldPassword: string;
}

export async function changePassword(
  module: LoginModule,
  data: ChangePasswordRequest
): Promise<void> {
  const api = module === 'BAP' ? bapApi : bppApi;

  await apiRequest(api, {
    method: 'POST',
    url: '/user/changePassword',
    data,
  });
}


