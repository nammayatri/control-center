import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    getDriverPoolConfig,
    getCommonConfig,
    getVehicleServiceTierConfig,
    getServiceUsageConfig
} from '../../../services/config';
import { getDriverSpecialLocationList } from '../../../services/geospatial';
import { getMerchantCities } from '../../../services/metadata';
import { VEHICLE_VARIANTS } from '../../../types/issueContent';
import type { LogicNode, Predicate } from '../types/JsonLogicTypes';

// Static trip categories
const TRIP_CATEGORIES = [
    'OneWay',
    'Rental',
    'InterCity',
    'Ambulance',
    'Delivery',
    'RoundTrip',
    'Schedule'
];

export interface LogicBuilderData {
    loading: boolean;
    parameterOptions: string[];
    filterOptions: {
        merchants: { label: string; value: string }[];
        cities: { label: string; value: string }[];
        vehicles: { label: string; value: string }[];
        areas: { label: string; value: string }[];
        tripCategories: { label: string; value: string }[];
        allObservedFilters: string[];
    };
}

export function useLogicBuilderData(
    domainTag: string,
    clonedLogic: LogicNode[]
): LogicBuilderData {
    const { merchants, currentMerchant, currentCity, cities } = useAuth();
    const [loading, setLoading] = useState(false);

    // Discovered Data
    const [apiParameters, setApiParameters] = useState<string[]>([]);
    const [vehicleVariants, setVehicleVariants] = useState<string[]>([]);
    const [areas, setAreas] = useState<{ name: string; id: string }[]>([]);

    const [clonedParameters, setClonedParameters] = useState<string[]>([]);
    const [clonedFilters, setClonedFilters] = useState<string[]>([]);
    const [cityUuidMap, setCityUuidMap] = useState<Record<string, string>>({});
    const [observedValues, setObservedValues] = useState<Record<string, Set<any>>>({});

    // 1. Fetch Standard Data (Vehicles, Areas)
    useEffect(() => {
        async function fetchStandardData() {
            if (!currentMerchant?.id || !cities || cities.length === 0) return;

            const cityId = currentCity?.id || 'all';

            try {
                // Fetch Vehicle Configs (use current city context)
                const vehicles = await getVehicleServiceTierConfig(currentMerchant.id, cityId);
                const distinctVariants = new Set<string>();
                vehicles.forEach(v => {
                    v.allowedVehicleVariant.forEach(variant => distinctVariants.add(variant));
                });
                if (distinctVariants.size > 0) {
                    setVehicleVariants(Array.from(distinctVariants));
                } else {
                    setVehicleVariants([...VEHICLE_VARIANTS]);
                }

                // Fetch Areas & City UUIDs for ALL cities
                const allCityUuidMap: Record<string, string> = {};
                let currentCityAreas: { name: string; id: string }[] = [];

                // 2. Fetch City UUIDs in Bulk (New Logic: Clickhouse Lookup)
                const merchantCities = await getMerchantCities(currentMerchant.shortId);
                merchantCities.forEach(mc => {
                    if (mc.city && mc.id) {
                        allCityUuidMap[mc.city] = mc.id;
                    }
                });

                // 3. Fetch Areas for CURRENT city specifically (Legacy Logic kept)
                await Promise.all(cities.map(async (c) => {
                    try {
                        if (c.id === currentCity?.id) {
                            let locs = await getDriverSpecialLocationList(currentMerchant.shortId, c.name, { limit: 50 });

                            if (!locs || locs.length === 0) {
                                try {
                                    locs = await getDriverSpecialLocationList(currentMerchant.shortId, c.id, { limit: 50 });
                                } catch (retryErr) {
                                    console.warn(`Retry failed for areas in ${c.id}`, retryErr);
                                }
                            }

                            if (locs && locs.length > 0) {
                                currentCityAreas = locs.map(l => ({ name: l.locationName, id: l.id }));
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch areas for city ${c.name}`, e);
                    }
                }));

                setCityUuidMap(allCityUuidMap);
                setAreas(currentCityAreas);

            } catch (err) {
                console.warn("Failed to fetch standard logic data, using fallback", err);
                setVehicleVariants([...VEHICLE_VARIANTS]);
            }
        }
        fetchStandardData();
    }, [currentMerchant, cities, currentCity]);

    // 2. Parameter Discovery (Heuristic API Mapping)
    useEffect(() => {
        async function discoverParameters() {
            if (!currentMerchant?.id || !domainTag) return;

            setLoading(true);
            try {
                let params: string[] = [];

                // HEURISTIC MAPPING
                if (domainTag.includes('driver_pool') || domainTag.includes('radius')) {
                    const config = await getDriverPoolConfig(currentMerchant.id);
                    params = Object.keys(config);
                } else if (domainTag.includes('common')) {
                    const config = await getCommonConfig(currentMerchant.id);
                    params = Object.keys(config);
                } else if (domainTag.includes('service_usage')) {
                    const config = await getServiceUsageConfig(currentMerchant.id);
                    params = Object.keys(config);
                }
                console.log(`Discovered params for ${domainTag}:`, params);
                setApiParameters(params);
            } catch (err) {
                console.warn(`Failed to discover parameters for domain ${domainTag}`, err);
            } finally {
                setLoading(false);
            }
        }
        discoverParameters();
    }, [domainTag, currentMerchant]);

    // 3. Logic Analysis (Fallback parameters + Filter discovery)
    useEffect(() => {
        if (!clonedLogic || clonedLogic.length === 0) return;

        const foundParams = new Set<string>();
        const foundFilters = new Set<string>();
        const foundValues: Record<string, Set<any>> = {};

        function extractFiltersFromPredicate(p: Predicate) {
            if ('groupOperator' in p) {
                p.predicates.forEach(extractFiltersFromPredicate);
            } else {
                foundFilters.add(p.variable);
                if (p.value !== null && p.value !== undefined && p.value !== '') {
                    if (!foundValues[p.variable]) foundValues[p.variable] = new Set();
                    if (Array.isArray(p.value)) {
                        p.value.forEach(v => foundValues[p.variable].add(v));
                    } else {
                        foundValues[p.variable].add(p.value);
                    }
                }
            }
        }

        function traverse(node: LogicNode) {
            if (node.type === 'parameter') {
                foundParams.add(node.key);
            } else if (node.type === 'condition') {
                extractFiltersFromPredicate(node.predicate);
                node.thenBlock.forEach(traverse);
                node.elseBlock.forEach(traverse);
            }
        }

        clonedLogic.forEach(traverse);

        setClonedParameters(Array.from(foundParams));
        setClonedFilters(Array.from(foundFilters));
        setObservedValues(foundValues);
    }, [clonedLogic]);


    // Combined Options
    const parameterOptions = useMemo(() => {
        return Array.from(new Set([...apiParameters, ...clonedParameters]));
    }, [apiParameters, clonedParameters]);

    const filterOptions = useMemo(() => {
        // Use user-friendly names (label) with values (id)
        const merchantOpts = merchants.map(m => ({ label: m.name, value: m.id }));
        // Cities: Integrate discovered UUIDs (STRICT: Only show cities with UUIDs)
        const cityOpts = (cities || []).map(c => {
            const uuid = cityUuidMap[c.name];
            if (!uuid) return null;
            return {
                label: `${c.name} (${uuid.substring(0, 8)}...)`,
                value: uuid
            };
        }).filter((c): c is { label: string; value: string } => c !== null);
        // Vehicle: show friendly name (e.g., "Auto Rickshaw") but use value (AUTO_RICKSHAW)
        const vehicleOpts = vehicleVariants.map(v => ({
            label: v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: v
        }));
        // Areas: show user-friendly name, use tag as value
        const areaOpts = areas.map(a => ({ label: a.name, value: a.id }));
        // Trip categories
        const tripCategoryOpts = TRIP_CATEGORIES.map(t => ({ label: t, value: t }));

        // Add observed values from logic to corresponding options
        if (observedValues['config.merchantOperatingCityId']) {
            observedValues['config.merchantOperatingCityId'].forEach(v => {
                if (typeof v === 'string' && !cityOpts.some(o => o.value === v)) {
                    cityOpts.push({ label: `City ID: ${v.substring(0, 8)}...`, value: v });
                }
            });
        }

        const standardFilters = [
            'config.merchantId',
            'config.merchantOperatingCityId',
            'extraDimensions.serviceTier',
            'extraDimensions.tripDistance',
            'config.tripCategory',
            'config.area.tag',
            'config.area.contents'
        ];

        return {
            merchants: merchantOpts,
            cities: cityOpts,
            vehicles: vehicleOpts,
            areas: areaOpts,
            areaNames: areas.map(a => ({ label: a.name, value: a.name })), // For config.area.tag
            tripCategories: tripCategoryOpts,
            allObservedFilters: Array.from(new Set([...standardFilters, ...clonedFilters]))
        };
    }, [merchants, cities, vehicleVariants, areas, clonedFilters, cityUuidMap, observedValues]);

    return {
        loading,
        parameterOptions,
        filterOptions
    };
}
