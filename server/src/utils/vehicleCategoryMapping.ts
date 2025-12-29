/**
 * Vehicle Category Mapping
 * Maps service_tier values to vehicle_category and vehicle_sub_category
 */

export type VehicleCategory = 'Bike' | 'Auto' | 'Cab' | 'Others' | 'All' | 'BookAny';

export interface VehicleCategoryMapping {
    category: VehicleCategory;
    subCategories: string[];
}

/**
 * Maps a service_tier value to its vehicle_category
 */
export function getVehicleCategory(serviceTier: string): VehicleCategory {
    const normalized = serviceTier.toLowerCase();
    
    // Bike category
    if (
        normalized.includes('2w parcel') ||
        normalized.includes('bike metro') ||
        normalized.includes('bike taxi')
    ) {
        return 'Bike';
    }
    
    // Auto category
    if (
        normalized === 'auto' ||
        normalized === 'auto priority' ||
        normalized === 'auto_rickshaw' ||
        normalized === 'auto rickshaw' ||
        normalized === 'eco auto'
    ) {
        return 'Auto';
    }
    
    // Special cases: All and BookAny (handled separately, not Cab)
    if (normalized === 'all') {
        return 'All';
    }
    if (normalized === 'bookany') {
        return 'BookAny';
    }
    
    // Others category (ambulance only)
    if (normalized.includes('ambulance')) {
        return 'Others';
    }
    
    // Everything else is Cab
    return 'Cab';
}

/**
 * Gets all service_tier values that belong to a vehicle_category
 */
export function getServiceTiersByCategory(category: VehicleCategory): string[] {
    const allServiceTiers = [
        '2W Parcel',
        'AC Cab',
        'AC Mini',
        'AC SUV',
        'AMBULANCE_AC',
        'AMBULANCE_AC_OXY',
        'AMBULANCE_TAXI',
        'AMBULANCE_TAXI_OXY',
        'AMBULANCE_VENTILATOR',
        'AUTO_RICKSHAW',
        'All',
        'Ambulance: AC',
        'Ambulance: AC + O2',
        'Ambulance: Non AC',
        'Ambulance: O2',
        'Ambulance: Ventilator',
        'Auto',
        'Auto Priority',
        'Basic Support - AC Economy',
        'Basic Support - Premium',
        'Bike Metro',
        'Bike Taxi',
        'BookAny',
        'COMFY',
        'ECO',
        'ECO Auto',
        'Eco',
        'HATCHBACK',
        'HERITAGE_CAB',
        'Hatchback',
        'Heritage Cab',
        'Mini AC Cab',
        'Non-AC Cab',
        'Non-AC Mini',
        'PREMIUM_SEDAN',
        'SEDAN',
        'SUV',
        'SUV Plus',
        'SUV_PLUS',
        'Sedan',
        'Sedan AC Cab',
        'Sedan Cab',
        'Sedan Premium',
        'TAXI',
        'XL Cab',
        'XL Plus Cab',
        'XL Premium',
    ];

    return allServiceTiers.filter(tier => getVehicleCategory(tier) === category);
}

/**
 * Gets vehicle_sub_category values for a given vehicle_category
 */
export function getVehicleSubCategories(category: VehicleCategory): string[] {
    switch (category) {
        case 'Bike':
            return ['2W Parcel', 'Bike Metro', 'Bike Taxi'];
        case 'Auto':
            return ['Auto Priority', 'Auto_Rickshaw', 'ECO Auto', 'Auto'];
        case 'Cab':
            return [
                'AC Cab',
                'AC Mini',
                'AC SUV',
                'Mini AC Cab',
                'Non-AC Cab',
                'Non-AC Mini',
                'SEDAN',
                'HATCHBACK',
                'Hatchback',
                'Sedan',
                'Sedan AC Cab',
                'Sedan Cab',
                'Sedan Premium',
                'TAXI',
                'XL Cab',
                'XL Plus Cab',
                'XL Premium',
                'COMFY',
                'ECO',
                'Eco',
                'HERITAGE_CAB',
                'Heritage Cab',
                'PREMIUM_SEDAN',
                'SUV',
                'SUV Plus',
                'SUV_PLUS',
                'Basic Support - AC Economy',
                'Basic Support - Premium',
            ];
        case 'Others':
            return [
                'AMBULANCE_AC',
                'AMBULANCE_AC_OXY',
                'AMBULANCE_TAXI',
                'AMBULANCE_TAXI_OXY',
                'AMBULANCE_VENTILATOR',
                'Ambulance: AC',
                'Ambulance: AC + O2',
                'Ambulance: Non AC',
                'Ambulance: O2',
                'Ambulance: Ventilator',
            ];
        case 'All':
            return ['All'];
        case 'BookAny':
            return ['BookAny'];
        default:
            return [];
    }
}

/**
 * Converts vehicle_category and vehicle_sub_category filters to service_tier filters
 */
export function convertVehicleFiltersToServiceTiers(
    vehicleCategory?: VehicleCategory,
    vehicleSubCategory?: string
): string[] {
    if (vehicleSubCategory) {
        // If sub-category is selected, use that specific service_tier
        return [vehicleSubCategory];
    }
    
    if (vehicleCategory) {
        // Handle special categories
        if (vehicleCategory === 'All') {
            return ['All'];
        }
        if (vehicleCategory === 'BookAny') {
            return ['BookAny'];
        }
        // If only category is selected, get all service_tiers for that category
        return getServiceTiersByCategory(vehicleCategory);
    }
    
    return [];
}

