// City code to name mapping for STD codes
export const CITY_NAME_MAP: Record<string, string> = {
    'std:080': 'Bangalore',
    'std:033': 'Kolkata',
    'std:001': 'Paris',
    'std:484': 'Kochi',
    'std:0484': 'Kochi',
    'std:011': 'Delhi',
    'std:040': 'Hyderabad',
    'std:022': 'Mumbai',
    'std:044': 'Chennai',
    'std:0422': 'Coimbatore',
    'std:0413': 'Pondicherry',
    'std:08342': 'Goa',
    'std:020': 'Pune',
    'std:0821': 'Mysore',
    'std:0816': 'Tumakuru',
    'std:01189': 'Noida',
    'std:0124': 'Gurugram',
    'std:0353': 'Siliguri',
    'std:0471': 'Trivandrum',
    'std:0487': 'Thrissur',
    'std:0495': 'Kozhikode',
    'std:0416': 'Vellore',
    'std:04344': 'Hosur',
    'std:0452': 'Madurai',
    'std:04362': 'Thanjavur',
    'std:0462': 'Tirunelveli',
    'std:0427': 'Salem',
    'std:0431': 'Trichy',
    'std:08192': 'Davanagere',
    'std:08182': 'Shivamogga',
    'std:0836': 'Hubli',
    'std:0824': 'Mangalore',
    'std:08472': 'Gulbarga',
    'std:08200': 'Udupi',
    'std:0674': 'Bhubaneswar',
    'std:0671': 'Cuttack',
    'std:08682': 'Nalgonda',
    'std:06752': 'Puri',
    'std:04322': 'Pudukkottai',
    'std:8482': 'Bidar',
    'std:0341': 'Asansol',
    'std:0342': 'Durgapur',
    'std:03215': 'Petrapole',
    'std:0194': 'Srinagar',
};

/**
 * Get the display name for a city code.
 * Falls back to the code with 'std:' prefix removed if not found.
 */
export function getCityName(cityCode: string): string {
    return CITY_NAME_MAP[cityCode] || cityCode.replace('std:', '');
}
