import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Role, Permission, Merchant, City, LoginModule, FleetConfig, UserAccessMatrix } from '../types';
import { getProfile, getAccessMatrix, switchMerchantAndCity } from '../services/auth';

// Mapping of merchant to their available cities
export interface MerchantCityMapping {
  merchantShortId: string;
  cities: City[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  merchants: Merchant[];
  cities: City[];
  merchantCityMap: MerchantCityMapping[];
  currentMerchant: Merchant | null;
  currentCity: City | null;
  accessMatrix: UserAccessMatrix[];
  loginModule: LoginModule | null;
  fleetConfig: FleetConfig | null;
  login: (token: string, user: User, module: LoginModule, fleetConfig?: FleetConfig) => void;
  logout: () => void;
  setCurrentMerchant: (merchant: Merchant | null) => void;
  setCurrentCity: (city: City | null) => void;
  switchContext: (merchantId: string, cityId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasAccess: (actionType: string) => boolean;
  getCitiesForMerchant: (merchantId: string) => City[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'dashboard_token';
const USER_KEY = 'dashboard_user';
const MODULE_KEY = 'dashboard_module';
const FLEET_CONFIG_KEY = 'dashboard_fleet_config';
const MERCHANTS_KEY = 'dashboard_merchants';
const CITIES_KEY = 'dashboard_cities';
const MERCHANT_CITY_MAP_KEY = 'dashboard_merchant_city_map';
const CURRENT_MERCHANT_KEY = 'dashboard_current_merchant';
const CURRENT_CITY_KEY = 'dashboard_current_city';
const ACCESS_MATRIX_KEY = 'dashboard_access_matrix';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [loginModule, setLoginModule] = useState<LoginModule | null>(() => {
    const stored = localStorage.getItem(MODULE_KEY);
    return stored as LoginModule | null;
  });

  const [fleetConfig, setFleetConfig] = useState<FleetConfig | null>(() => {
    const stored = localStorage.getItem(FLEET_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    const stored = localStorage.getItem(MERCHANTS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [cities, setCities] = useState<City[]>(() => {
    const stored = localStorage.getItem(CITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [currentMerchant, setCurrentMerchantState] = useState<Merchant | null>(() => {
    const stored = localStorage.getItem(CURRENT_MERCHANT_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [currentCity, setCurrentCityState] = useState<City | null>(() => {
    const stored = localStorage.getItem(CURRENT_CITY_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [accessMatrix, setAccessMatrix] = useState<UserAccessMatrix[]>(() => {
    const stored = localStorage.getItem(ACCESS_MATRIX_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [merchantCityMap, setMerchantCityMap] = useState<MerchantCityMapping[]>(() => {
    const stored = localStorage.getItem(MERCHANT_CITY_MAP_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const isAuthenticated = !!token && !!user;

  // Fetch profile and access matrix
  const fetchProfileData = useCallback(async (module: LoginModule) => {
    try {
      console.log('Fetching profile data for module:', module);

      // Fetch profile and access matrix in parallel
      const [profileData, accessMatrixData] = await Promise.all([
        getProfile(module),
        getAccessMatrix(module),
      ]);

      console.log('Profile data:', profileData);
      console.log('Access matrix:', accessMatrixData);

      // Map available merchants
      const mappedMerchants: Merchant[] = (profileData.availableMerchants || []).map(m => ({
        id: m.merchantId,
        shortId: m.merchantShortId,
        name: m.merchantName,
      }));

      // Map available cities
      const mappedCities: City[] = (profileData.availableCitiesForMerchant || []).map(c => ({
        id: c.cityId,
        name: c.cityName,
      }));

      // Map merchant-city mappings
      const mappedMerchantCityMap: MerchantCityMapping[] = (profileData.merchantCityMap || []).map(m => ({
        merchantShortId: m.merchantShortId,
        cities: m.cities.map(c => ({
          id: c.cityId,
          name: c.cityName,
        })),
      }));

      // Set current merchant/city from profile - but DON'T overwrite if already set
      // This prevents resetting after context switch
      let currentMerch: Merchant | null = null;
      let currentCty: City | null = null;

      // Check what's currently in localStorage (our source of truth for current selection)
      const storedMerchant = localStorage.getItem(CURRENT_MERCHANT_KEY);
      const storedCity = localStorage.getItem(CURRENT_CITY_KEY);

      if (storedMerchant) {
        // Keep the existing merchant if it's still valid
        const parsed = JSON.parse(storedMerchant);
        if (mappedMerchants.some(m => m.shortId === parsed.shortId || m.id === parsed.id)) {
          currentMerch = parsed;
        }
      }

      if (storedCity) {
        // Keep the existing city if it's still valid
        const parsed = JSON.parse(storedCity);
        const allAvailableCities = mappedMerchantCityMap.flatMap(m => m.cities);
        if (allAvailableCities.some(c => c.id === parsed.id) || mappedCities.some(c => c.id === parsed.id)) {
          currentCty = parsed;
        }
      }

      // If no valid stored merchant, use profile data or default to first
      if (!currentMerch) {
        if (profileData.currentMerchant) {
          currentMerch = {
            id: profileData.currentMerchant.merchantId,
            shortId: profileData.currentMerchant.merchantShortId,
            name: profileData.currentMerchant.merchantName,
          };
        } else if (mappedMerchants.length > 0) {
          currentMerch = mappedMerchants[0];
        }
      }

      // If no valid stored city, use profile data or default to first for merchant
      if (!currentCty) {
        if (profileData.currentCity) {
          currentCty = {
            id: profileData.currentCity.cityId,
            name: profileData.currentCity.cityName,
          };
        } else if (currentMerch && mappedMerchantCityMap.length > 0) {
          // Get first city for the current merchant
          const merchantMapping = mappedMerchantCityMap.find(m => m.merchantShortId === currentMerch!.shortId);
          if (merchantMapping && merchantMapping.cities.length > 0) {
            currentCty = merchantMapping.cities[0];
          }
        } else if (mappedCities.length > 0) {
          currentCty = mappedCities[0];
        }
      }

      // Update state
      const storedUser = localStorage.getItem(USER_KEY);
      const currentUser = storedUser ? JSON.parse(storedUser) : (user || {});

      const updatedUser: User = {
        ...currentUser,
        id: profileData.personId || currentUser.id || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName,
        email: profileData.email,
        mobileNumber: profileData.mobileNumber || '',
        mobileCountryCode: profileData.mobileCountryCode || '',
        roles: profileData.roles || currentUser.roles || [],
      };
      setUser(updatedUser);

      setMerchants(mappedMerchants);
      setCities(mappedCities);
      setMerchantCityMap(mappedMerchantCityMap);
      setCurrentMerchantState(currentMerch);
      setCurrentCityState(currentCty);
      setAccessMatrix(accessMatrixData || []);

      // Persist to localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(MERCHANTS_KEY, JSON.stringify(mappedMerchants));
      localStorage.setItem(CITIES_KEY, JSON.stringify(mappedCities));
      localStorage.setItem(MERCHANT_CITY_MAP_KEY, JSON.stringify(mappedMerchantCityMap));
      if (currentMerch) localStorage.setItem(CURRENT_MERCHANT_KEY, JSON.stringify(currentMerch));
      if (currentCty) localStorage.setItem(CURRENT_CITY_KEY, JSON.stringify(currentCty));
      localStorage.setItem(ACCESS_MATRIX_KEY, JSON.stringify(accessMatrixData || []));

    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  }, []);

  // Validate token and fetch profile on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (token && loginModule) {
        try {
          await fetchProfileData(loginModule);
        } catch (error) {
          console.error('Session validation failed:', error);
        }
      }
      setIsLoading(false);
    };

    initializeSession();
  }, [token, loginModule, fetchProfileData]);

  const login = useCallback(async (newToken: string, newUser: User, module: LoginModule, newFleetConfig?: FleetConfig) => {
    console.log('AuthContext login called:', { newToken: !!newToken, newUser, module });

    // Set token first so API calls work
    setToken(newToken);
    setUser(newUser);
    setLoginModule(module);
    setFleetConfig(newFleetConfig || null);

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(MODULE_KEY, module);
    if (newFleetConfig) {
      localStorage.setItem(FLEET_CONFIG_KEY, JSON.stringify(newFleetConfig));
    }

    // Fetch profile data after login
    try {
      await fetchProfileData(module);
    } catch (error) {
      console.error('Failed to fetch profile after login:', error);
    }

    console.log('AuthContext login complete');
  }, [fetchProfileData]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setLoginModule(null);
    setFleetConfig(null);
    setMerchants([]);
    setCities([]);
    setMerchantCityMap([]);
    setCurrentMerchantState(null);
    setCurrentCityState(null);
    setAccessMatrix([]);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODULE_KEY);
    localStorage.removeItem(FLEET_CONFIG_KEY);
    localStorage.removeItem(MERCHANTS_KEY);
    localStorage.removeItem(CITIES_KEY);
    localStorage.removeItem(MERCHANT_CITY_MAP_KEY);
    localStorage.removeItem(CURRENT_MERCHANT_KEY);
    localStorage.removeItem(CURRENT_CITY_KEY);
    localStorage.removeItem(ACCESS_MATRIX_KEY);
  }, []);

  const setCurrentMerchant = useCallback((merchant: Merchant | null) => {
    setCurrentMerchantState(merchant);
    if (merchant) {
      localStorage.setItem(CURRENT_MERCHANT_KEY, JSON.stringify(merchant));
    } else {
      localStorage.removeItem(CURRENT_MERCHANT_KEY);
    }
  }, []);

  const setCurrentCity = useCallback((city: City | null) => {
    setCurrentCityState(city);
    if (city) {
      localStorage.setItem(CURRENT_CITY_KEY, JSON.stringify(city));
    } else {
      localStorage.removeItem(CURRENT_CITY_KEY);
    }
  }, []);

  const switchContext = useCallback(async (merchantId: string, cityId: string) => {
    if (!loginModule) return;

    try {
      const response = await switchMerchantAndCity(loginModule, merchantId, cityId);

      // Update token
      setToken(response.token);
      localStorage.setItem(TOKEN_KEY, response.token);

      // Immediately update current merchant and city based on selection
      // Find the merchant from our list
      let selectedMerchant = merchants.find(m => m.shortId === merchantId || m.id === merchantId);

      // FOR BPP/FLEET: If merchant not found in list, and it matches the current user's merchant ID, create a temporary one
      // This is because BPP/Fleet might return merchantId differently or not include it in availableMerchants
      if (!selectedMerchant && (loginModule === 'BPP' || loginModule === 'FLEET')) {
        // If the switched merchantId matches what we expect, construct it
        selectedMerchant = {
          id: merchantId,
          shortId: merchantId,
          name: merchantId.replace(/_/g, ' '), // Basic formatting
        };
      }

      if (selectedMerchant) {
        setCurrentMerchantState(selectedMerchant);
        localStorage.setItem(CURRENT_MERCHANT_KEY, JSON.stringify(selectedMerchant));
      }

      // Find the city from the merchant-city map or cities list
      const merchantMapping = merchantCityMap.find(m => m.merchantShortId === merchantId);
      let selectedCity = merchantMapping?.cities.find(c => c.id === cityId)
        || cities.find(c => c.id === cityId);

      // FOR BPP/FLEET: If city not found, create a temporary one
      if (!selectedCity && (loginModule === 'BPP' || loginModule === 'FLEET')) {
        selectedCity = {
          id: cityId,
          name: cityId.split(':')[1] || cityId
        };
      }

      if (selectedCity) {
        setCurrentCityState(selectedCity);
        localStorage.setItem(CURRENT_CITY_KEY, JSON.stringify(selectedCity));
      }

      // Dispatch custom event to notify app of context switch (for cache invalidation)
      window.dispatchEvent(new CustomEvent('merchant-city-switch', {
        detail: { merchantId, cityId }
      }));

      // Refetch profile to get any other updates (like updated cities list)
      // But don't wait for it - the context is already updated
      fetchProfileData(loginModule).catch(err => {
        console.warn('Profile refresh after context switch failed:', err);
      });
    } catch (error) {
      console.error('Failed to switch context:', error);
      throw error;
    }
  }, [loginModule, fetchProfileData, merchants, merchantCityMap, cities]);

  const refreshProfile = useCallback(async () => {
    if (loginModule) {
      await fetchProfileData(loginModule);
    }
  }, [loginModule, fetchProfileData]);

  const hasAccess = useCallback((actionType: string): boolean => {
    // Ensure accessMatrix is an array before using array methods
    if (!accessMatrix || !Array.isArray(accessMatrix) || accessMatrix.length === 0) {
      return true; // Default allow if no matrix
    }
    return accessMatrix.some(item => item.userActionType === actionType);
  }, [accessMatrix]);

  // Get cities for a specific merchant
  const getCitiesForMerchant = useCallback((merchantId: string): City[] => {
    const mapping = merchantCityMap.find(m => m.merchantShortId === merchantId);
    return mapping?.cities || [];
  }, [merchantCityMap]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        merchants,
        cities,
        merchantCityMap,
        currentMerchant,
        currentCity,
        accessMatrix,
        loginModule,
        fleetConfig,
        login,
        logout,
        setCurrentMerchant,
        setCurrentCity,
        switchContext,
        refreshProfile,
        hasAccess,
        getCitiesForMerchant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for getting current user info
export function useCurrentUser(): {
  id: string;
  name: string;
  roles: string[];
  permissions: Permission[];
} | null {
  const { user } = useAuth();

  if (!user) return null;

  const roles = user.roles?.map((r: Role) => r.name) || [];

  // Extract permissions from roles (simplified - in real app, this would come from API)
  const permissions: Permission[] = [];

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName || ''}`.trim(),
    roles,
    permissions,
  };
}
