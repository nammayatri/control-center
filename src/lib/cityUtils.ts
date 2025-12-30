// City code to name mapping for STD codes
export const CITY_NAME_MAP: Record<string, string> = {
    // Major cities
    'std:080': 'Bangalore',
    'std:033': 'Kolkata',
    'std:001': 'Paris',
    'std:484': 'Kochi',
    'std:0484': 'Kochi',
    'std:011': 'Delhi',
    'std:040': 'Hyderabad',
    'std:022': 'Mumbai',
    'std:044': 'Chennai',
    'std:020': 'Pune',
    // Tamil Nadu
    'std:0422': 'TamilNaduCities',
    'std:0413': 'Pondicherry',
    'std:0462': 'Tirunelveli',
    'std:04362': 'Thanjavur',
    'std:0416': 'Vellore',
    'std:0452': 'Madurai',
    'std:0427': 'Salem',
    'std:04344': 'Hosur',
    'std:0431': 'Trichy',
    'std:04322': 'Pudukkottai',
    'std:04364': 'Mayiladuthurai',
    // Karnataka
    'std:0821': 'Mysore',
    'std:0816': 'Tumakuru',
    'std:08192': 'Davanagere',
    'std:08182': 'Shivamogga',
    'std:0836': 'Hubli',
    'std:0824': 'Mangalore',
    'std:08472': 'Gulbarga',
    'std:08200': 'Udupi',
    'std:8482': 'Bidar',
    'std:08392': 'Ballari',
    // North India
    'std:01189': 'Noida',
    'std:0124': 'Gurugram',
    'std:0172': 'Chandigarh',
    'std:0141': 'Jaipur',
    'std:0194': 'Srinagar',
    'std:0191': 'Jammu',
    'std:01933': 'Pulwama',
    'std:01932': 'Anantnag',
    // West Bengal & East India
    'std:0353': 'Siliguri',
    'std:0341': 'Asansol',
    'std:0342': 'Durgapur',
    'std:03215': 'Petrapole',
    'std:03592': 'Gangtok',
    'std:0354': 'Darjeeling',
    'std:0343': 'Bardhaman',
    'std:03216': 'Digha',
    'std:03462': 'Birbhum',
    // Odisha
    'std:0674': 'Bhubaneswar',
    'std:0671': 'Cuttack',
    'std:06752': 'Puri',
    'std:0661': 'Rourkela',
    'std:0680': 'Berhampur',
    'std:06645': 'Jharsuguda',
    'std:0663': 'Sambalpur',
    // Kerala
    'std:0471': 'Trivandrum',
    'std:0487': 'Thrissur',
    'std:0495': 'Kozhikode',
    'std:0477': 'Alapuzha',
    'std:0486': 'Idukki',
    'std:04994': 'Kasaragod',
    'std:04936': 'Wayanad',
    'std:0497': 'Kannur',
    'std:0481': 'Kottayam',
    'std:0491': 'Palakkad',
    'std:0474': 'Kollam',
    'std:0468': 'Pathanamthitta',
    'std:0483': 'Malappuram',
    // Andhra Pradesh
    'std:0866': 'Vijayawada',
    'std:0891': 'Vishakapatnam',
    'std:0863': 'Guntur',
    'std:0877': 'Tirupati',
    'std:08518': 'Kurnool',
    // Telangana
    'std:0870': 'Warangal',
    'std:08742': 'Khammam',
    'std:08722': 'Karimnagar',
    'std:08463': 'Nizamabad',
    'std:08542': 'Mahbubnagar',
    'std:08684': 'Suryapet',
    'std:08682': 'Nalgonda',
    'std:08457': 'Siddipet',
    // Meghalaya
    'std:0364': 'Shillong',
    'std:03637': 'Cherrapunji',
    // Gujarat
    'std:0281': 'Rajkot',
    'std:02871': 'Somnath',
    'std:02892': 'Dwarka',
    // International
    'usa:0820': 'Minneapolis',
    'nld:020': 'Amsterdam',
    'fin:009': 'Helsinki',
};

/**
 * Get the display name for a city code.
 * Falls back to the code with 'std:' prefix removed if not found.
 */
export function getCityName(cityCode: string): string {
    return CITY_NAME_MAP[cityCode] || cityCode.replace('std:', '');
}
