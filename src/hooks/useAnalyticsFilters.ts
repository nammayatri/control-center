import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { MetricsFilters } from '../services/execMetrics';
import type { Merchant, City } from '../types';

interface AnalyticsFiltersResult {
    applyUserContext: (filters: MetricsFilters) => MetricsFilters;
    isAdmin: boolean;
    allowedMerchants: Merchant[] | null;
    allowedCities: City[] | null;
    merchantCityMap: { merchantShortId: string; cities: City[] }[];
}

/**
 * Hook to apply user context restrictions to analytics filters.
 * 
 * For non-admin users:
 * - Restricts filter options to only merchants/cities they have access to
 * - Defaults to current merchant and city in queries
 * 
 * For DASHBOARD_ADMIN users:
 * - No restrictions applied
 * - All filter options available
 */
export function useAnalyticsFilters(): AnalyticsFiltersResult {
    const {
        user,
        merchants,
        cities,
        merchantCityMap,
        currentMerchant,
        currentCity,
        loginModule
    } = useAuth();

    // Debug: Log what we get from AuthContext
    console.log('[Analytics Filters Hook] AuthContext values:', {
        currentMerchant,
        currentCity,
        loginModule,
        merchantsCount: merchants?.length,
        citiesCount: cities?.length
    });

    // Check if user has DASHBOARD_ADMIN access
    const isAdmin = useMemo(() => {
        return user?.roles?.some(r => r.dashboardAccessType === 'DASHBOARD_ADMIN') ?? false;
    }, [user?.roles]);

    // Available merchants for filter dropdown (null = no restrictions)
    const allowedMerchants = useMemo(() => {
        return isAdmin ? null : merchants;
    }, [isAdmin, merchants]);

    // Available cities for filter dropdown (null = no restrictions)
    const allowedCities = useMemo(() => {
        return isAdmin ? null : cities;
    }, [isAdmin, cities]);

    /**
   * Apply user context to filters with ENFORCEMENT:
   * - For non-admins: ALWAYS restrict to current merchant/city (ignores user selections)
   * - For admins: Pass through unchanged
   * 
   * SECURITY: Backend accepts any params, so we MUST enforce here
   */
    const applyUserContext = useCallback((filters: MetricsFilters): MetricsFilters => {
        console.log('[Analytics Filters] applyUserContext called, isAdmin:', isAdmin, 'currentMerchant:', currentMerchant, 'currentCity:', currentCity);

        // Admins get unrestricted access
        if (isAdmin) {
            console.log('[Analytics Filters] Admin user - no restrictions applied');
            return filters;
        }

        const restricted = { ...filters };
        const allowedCityNames = cities.map(c => c.name);
        const allowedMerchantShortIds = merchants.map(m => m.shortId);

        // VALIDATE and FILTER city selections
        // Backend expects city NAME, not ID
        if (restricted.city?.length) {
            // Keep only cities user has access to
            const validCities = restricted.city.filter(cityName => allowedCityNames.includes(cityName));
            if (validCities.length > 0) {
                restricted.city = validCities;
                console.log('[Analytics Filters] Using user-selected cities:', validCities);
            } else if (currentCity) {
                // User selected cities they don't have access to, default to current
                restricted.city = [currentCity.name];
                console.warn('[Analytics Filters] User selected unauthorized cities, defaulting to:', currentCity.name);
            }
        } else if (currentCity) {
            // No city selected, default to current
            restricted.city = [currentCity.name];
            console.log('[Analytics Filters] No city selected, defaulting to:', currentCity.name);
        }

        // VALIDATE and FILTER merchant selections based on login module
        if (loginModule === 'BAP') {
            if (restricted.bapMerchantId?.length) {
                const validMerchants = restricted.bapMerchantId.filter(mid => allowedMerchantShortIds.includes(mid));
                if (validMerchants.length > 0) {
                    restricted.bapMerchantId = validMerchants;
                    console.log('[Analytics Filters] Using user-selected BAP merchants:', validMerchants);
                } else if (currentMerchant) {
                    restricted.bapMerchantId = [currentMerchant.shortId];
                    console.warn('[Analytics Filters] User selected unauthorized merchants, defaulting to:', currentMerchant.shortId);
                }
            } else if (currentMerchant) {
                // No merchant selected, default to current
                restricted.bapMerchantId = [currentMerchant.shortId];
                console.log('[Analytics Filters] No BAP merchant selected, defaulting to:', currentMerchant.shortId);
            }
            delete restricted.bppMerchantId;
        } else if (loginModule === 'BPP' || loginModule === 'FLEET') {
            if (restricted.bppMerchantId?.length) {
                const validMerchants = restricted.bppMerchantId.filter(mid => allowedMerchantShortIds.includes(mid));
                if (validMerchants.length > 0) {
                    restricted.bppMerchantId = validMerchants;
                    console.log('[Analytics Filters] Using user-selected BPP merchants:', validMerchants);
                } else if (currentMerchant) {
                    restricted.bppMerchantId = [currentMerchant.shortId];
                    console.warn('[Analytics Filters] User selected unauthorized merchants, defaulting to:', currentMerchant.shortId);
                }
            } else if (currentMerchant) {
                // No merchant selected, default to current
                restricted.bppMerchantId = [currentMerchant.shortId];
                console.log('[Analytics Filters] No BPP merchant selected, defaulting to:', currentMerchant.shortId);
            }
            delete restricted.bapMerchantId;
        }

        console.log('[Analytics Filters] Final restricted filters:', restricted);
        return restricted;
    }, [isAdmin, currentMerchant, currentCity, loginModule, cities, merchants]);

    return {
        applyUserContext,
        isAdmin,
        allowedMerchants,
        allowedCities,
        merchantCityMap,
    };
}
