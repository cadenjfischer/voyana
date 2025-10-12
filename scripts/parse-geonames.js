const fs = require('fs');
const path = require('path');

// First, let's extract ski resorts from our existing data to preserve them
const existingDestinations = `// This file will be auto-generated from GeoNames data
export interface Destination {
  name: string;
  country: string;
  state?: string;
  type: 'city' | 'ski-resort';
  displayName: string;
}

export const destinations: Destination[] = [`;

// Country code to full country name mapping
const countryNames = {
  'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan', 'AG': 'Antigua and Barbuda',
  'AI': 'Anguilla', 'AL': 'Albania', 'AM': 'Armenia', 'AO': 'Angola', 'AQ': 'Antarctica',
  'AR': 'Argentina', 'AS': 'American Samoa', 'AT': 'Austria', 'AU': 'Australia', 'AW': 'Aruba',
  'AX': 'Åland Islands', 'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados',
  'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso', 'BG': 'Bulgaria', 'BH': 'Bahrain',
  'BI': 'Burundi', 'BJ': 'Benin', 'BL': 'Saint Barthélemy', 'BM': 'Bermuda', 'BN': 'Brunei',
  'BO': 'Bolivia', 'BQ': 'Caribbean Netherlands', 'BR': 'Brazil', 'BS': 'Bahamas', 'BT': 'Bhutan',
  'BV': 'Bouvet Island', 'BW': 'Botswana', 'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
  'CC': 'Cocos Islands', 'CD': 'Democratic Republic of Congo', 'CF': 'Central African Republic',
  'CG': 'Republic of Congo', 'CH': 'Switzerland', 'CI': 'Côte d\'Ivoire', 'CK': 'Cook Islands',
  'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China', 'CO': 'Colombia', 'CR': 'Costa Rica',
  'CU': 'Cuba', 'CV': 'Cape Verde', 'CW': 'Curaçao', 'CX': 'Christmas Island', 'CY': 'Cyprus',
  'CZ': 'Czech Republic', 'DE': 'Germany', 'DJ': 'Djibouti', 'DK': 'Denmark', 'DM': 'Dominica',
  'DO': 'Dominican Republic', 'DZ': 'Algeria', 'EC': 'Ecuador', 'EE': 'Estonia', 'EG': 'Egypt',
  'EH': 'Western Sahara', 'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia', 'FI': 'Finland',
  'FJ': 'Fiji', 'FK': 'Falkland Islands', 'FM': 'Micronesia', 'FO': 'Faroe Islands', 'FR': 'France',
  'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada', 'GE': 'Georgia', 'GF': 'French Guiana',
  'GG': 'Guernsey', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GL': 'Greenland', 'GM': 'Gambia',
  'GN': 'Guinea', 'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea', 'GR': 'Greece', 'GS': 'South Georgia',
  'GT': 'Guatemala', 'GU': 'Guam', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong',
  'HM': 'Heard Island', 'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary',
  'ID': 'Indonesia', 'IE': 'Ireland', 'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India',
  'IO': 'British Indian Ocean Territory', 'IQ': 'Iraq', 'IR': 'Iran', 'IS': 'Iceland', 'IT': 'Italy',
  'JE': 'Jersey', 'JM': 'Jamaica', 'JO': 'Jordan', 'JP': 'Japan', 'KE': 'Kenya', 'KG': 'Kyrgyzstan',
  'KH': 'Cambodia', 'KI': 'Kiribati', 'KM': 'Comoros', 'KN': 'Saint Kitts and Nevis', 'KP': 'North Korea',
  'KR': 'South Korea', 'KW': 'Kuwait', 'KY': 'Cayman Islands', 'KZ': 'Kazakhstan', 'LA': 'Laos',
  'LB': 'Lebanon', 'LC': 'Saint Lucia', 'LI': 'Liechtenstein', 'LK': 'Sri Lanka', 'LR': 'Liberia',
  'LS': 'Lesotho', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya',
  'MA': 'Morocco', 'MC': 'Monaco', 'MD': 'Moldova', 'ME': 'Montenegro', 'MF': 'Saint Martin',
  'MG': 'Madagascar', 'MH': 'Marshall Islands', 'MK': 'North Macedonia', 'ML': 'Mali', 'MM': 'Myanmar',
  'MN': 'Mongolia', 'MO': 'Macau', 'MP': 'Northern Mariana Islands', 'MQ': 'Martinique', 'MR': 'Mauritania',
  'MS': 'Montserrat', 'MT': 'Malta', 'MU': 'Mauritius', 'MV': 'Maldives', 'MW': 'Malawi',
  'MX': 'Mexico', 'MY': 'Malaysia', 'MZ': 'Mozambique', 'NA': 'Namibia', 'NC': 'New Caledonia',
  'NE': 'Niger', 'NF': 'Norfolk Island', 'NG': 'Nigeria', 'NI': 'Nicaragua', 'NL': 'Netherlands',
  'NO': 'Norway', 'NP': 'Nepal', 'NR': 'Nauru', 'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman',
  'PA': 'Panama', 'PE': 'Peru', 'PF': 'French Polynesia', 'PG': 'Papua New Guinea', 'PH': 'Philippines',
  'PK': 'Pakistan', 'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'PN': 'Pitcairn Islands',
  'PR': 'Puerto Rico', 'PS': 'Palestine', 'PT': 'Portugal', 'PW': 'Palau', 'PY': 'Paraguay',
  'QA': 'Qatar', 'RE': 'Réunion', 'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia', 'RW': 'Rwanda',
  'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles', 'SD': 'Sudan', 'SE': 'Sweden',
  'SG': 'Singapore', 'SH': 'Saint Helena', 'SI': 'Slovenia', 'SJ': 'Svalbard', 'SK': 'Slovakia',
  'SL': 'Sierra Leone', 'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia', 'SR': 'Suriname',
  'SS': 'South Sudan', 'ST': 'São Tomé and Príncipe', 'SV': 'El Salvador', 'SX': 'Sint Maarten',
  'SY': 'Syria', 'SZ': 'Eswatini', 'TC': 'Turks and Caicos Islands', 'TD': 'Chad', 'TF': 'French Southern Territories',
  'TG': 'Togo', 'TH': 'Thailand', 'TJ': 'Tajikistan', 'TK': 'Tokelau', 'TL': 'Timor-Leste',
  'TM': 'Turkmenistan', 'TN': 'Tunisia', 'TO': 'Tonga', 'TR': 'Turkey', 'TT': 'Trinidad and Tobago',
  'TV': 'Tuvalu', 'TW': 'Taiwan', 'TZ': 'Tanzania', 'UA': 'Ukraine', 'UG': 'Uganda', 'UM': 'US Minor Outlying Islands',
  'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VA': 'Vatican City', 'VC': 'Saint Vincent and the Grenadines',
  'VE': 'Venezuela', 'VG': 'British Virgin Islands', 'VI': 'US Virgin Islands', 'VN': 'Vietnam',
  'VU': 'Vanuatu', 'WF': 'Wallis and Futuna', 'WS': 'Samoa', 'YE': 'Yemen', 'YT': 'Mayotte',
  'ZA': 'South Africa', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

// US state codes mapping (admin1 codes for US)
const usStates = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Extract existing ski resorts from current destinations file
const skiResorts = [
  // North America
  { name: "Aspen", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Aspen, CO, United States" },
  { name: "Vail", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Vail, CO, United States" },
  { name: "Whistler", country: "Canada", type: "ski-resort", displayName: "Whistler, Canada" },
  { name: "Park City", country: "United States", state: "Utah", type: "ski-resort", displayName: "Park City, UT, United States" },
  { name: "Jackson Hole", country: "United States", state: "Wyoming", type: "ski-resort", displayName: "Jackson Hole, WY, United States" },
  { name: "Steamboat Springs", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Steamboat Springs, CO, United States" },
  { name: "Breckenridge", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Breckenridge, CO, United States" },
  { name: "Telluride", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Telluride, CO, United States" },
  { name: "Alta", country: "United States", state: "Utah", type: "ski-resort", displayName: "Alta, UT, United States" },
  { name: "Deer Valley", country: "United States", state: "Utah", type: "ski-resort", displayName: "Deer Valley, UT, United States" },
  { name: "Stowe", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Stowe, VT, United States" },
  { name: "Killington", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Killington, VT, United States" },
  { name: "Sugarbush", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Sugarbush, VT, United States" },
  { name: "Sun Valley", country: "United States", state: "Idaho", type: "ski-resort", displayName: "Sun Valley, ID, United States" },
  { name: "Big Sky", country: "United States", state: "Montana", type: "ski-resort", displayName: "Big Sky, MT, United States" },
  { name: "Snowbird", country: "United States", state: "Utah", type: "ski-resort", displayName: "Snowbird, UT, United States" },
  { name: "Squaw Valley", country: "United States", state: "California", type: "ski-resort", displayName: "Squaw Valley, CA, United States" },
  { name: "Mammoth Lakes", country: "United States", state: "California", type: "ski-resort", displayName: "Mammoth Lakes, CA, United States" },
  { name: "Taos", country: "United States", state: "New Mexico", type: "ski-resort", displayName: "Taos, NM, United States" },

  // Europe
  { name: "St. Moritz", country: "Switzerland", type: "ski-resort", displayName: "St. Moritz, Switzerland" },
  { name: "Zermatt", country: "Switzerland", type: "ski-resort", displayName: "Zermatt, Switzerland" },
  { name: "Chamonix", country: "France", type: "ski-resort", displayName: "Chamonix, France" },
  { name: "Courchevel", country: "France", type: "ski-resort", displayName: "Courchevel, France" },
  { name: "Val d'Isère", country: "France", type: "ski-resort", displayName: "Val d'Isère, France" },
  { name: "Verbier", country: "Switzerland", type: "ski-resort", displayName: "Verbier, Switzerland" },
  { name: "Davos", country: "Switzerland", type: "ski-resort", displayName: "Davos, Switzerland" },
  { name: "Gstaad", country: "Switzerland", type: "ski-resort", displayName: "Gstaad, Switzerland" },
  { name: "Cortina d'Ampezzo", country: "Italy", type: "ski-resort", displayName: "Cortina d'Ampezzo, Italy" },
  { name: "St. Anton", country: "Austria", type: "ski-resort", displayName: "St. Anton, Austria" },
  { name: "Kitzbühel", country: "Austria", type: "ski-resort", displayName: "Kitzbühel, Austria" },
  { name: "Innsbruck", country: "Austria", type: "ski-resort", displayName: "Innsbruck, Austria" },
  { name: "Méribel", country: "France", type: "ski-resort", displayName: "Méribel, France" },
  { name: "Val Thorens", country: "France", type: "ski-resort", displayName: "Val Thorens, France" },
  { name: "Avoriaz", country: "France", type: "ski-resort", displayName: "Avoriaz, France" },
  { name: "Wengen", country: "Switzerland", type: "ski-resort", displayName: "Wengen, Switzerland" },
  { name: "Grindelwald", country: "Switzerland", type: "ski-resort", displayName: "Grindelwald, Switzerland" },
  { name: "Saas-Fee", country: "Switzerland", type: "ski-resort", displayName: "Saas-Fee, Switzerland" },
  { name: "Val Gardena", country: "Italy", type: "ski-resort", displayName: "Val Gardena, Italy" },
  { name: "Madonna di Campiglio", country: "Italy", type: "ski-resort", displayName: "Madonna di Campiglio, Italy" },
  { name: "Banff", country: "Canada", type: "ski-resort", displayName: "Banff, Canada" },
  { name: "Lake Louise", country: "Canada", type: "ski-resort", displayName: "Lake Louise, Canada" },
  { name: "Mont-Tremblant", country: "Canada", type: "ski-resort", displayName: "Mont-Tremblant, Canada" },

  // Asia
  { name: "Niseko", country: "Japan", type: "ski-resort", displayName: "Niseko, Japan" },
  { name: "Hakuba", country: "Japan", type: "ski-resort", displayName: "Hakuba, Japan" },
  { name: "Rusutsu", country: "Japan", type: "ski-resort", displayName: "Rusutsu, Japan" },
  { name: "Myoko Kogen", country: "Japan", type: "ski-resort", displayName: "Myoko Kogen, Japan" },
  { name: "Yongpyong", country: "South Korea", type: "ski-resort", displayName: "Yongpyong, South Korea" },

  // Southern Hemisphere & Other
  { name: "Queenstown", country: "New Zealand", type: "ski-resort", displayName: "Queenstown, New Zealand" },
  { name: "Thredbo", country: "Australia", type: "ski-resort", displayName: "Thredbo, Australia" },
  { name: "Perisher", country: "Australia", type: "ski-resort", displayName: "Perisher, Australia" },
  { name: "Valle Nevado", country: "Chile", type: "ski-resort", displayName: "Valle Nevado, Chile" },
  { name: "Portillo", country: "Chile", type: "ski-resort", displayName: "Portillo, Chile" },
  { name: "Bariloche", country: "Argentina", type: "ski-resort", displayName: "Bariloche, Argentina" },
  { name: "Gulmarg", country: "India", type: "ski-resort", displayName: "Gulmarg, India" }
];

function parseGeoNamesLine(line) {
  const fields = line.split('\t');
  
  // GeoNames format:
  // 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude,
  // 6: feature class, 7: feature code, 8: country code, 9: cc2, 10: admin1 code,
  // 11: admin2 code, 12: admin3 code, 13: admin4 code, 14: population, 15: elevation,
  // 16: dem, 17: timezone, 18: modification date
  
  const [
    geonameid, name, asciiname, alternatenames, latitude, longitude,
    featureClass, featureCode, countryCode, cc2, admin1Code,
    admin2Code, admin3Code, admin4Code, population, elevation,
    dem, timezone, modificationDate
  ] = fields;
  
  return {
    geonameid: parseInt(geonameid),
    name: name || asciiname,
    asciiname,
    alternatenames,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    featureClass,
    featureCode,
    countryCode,
    cc2,
    admin1Code,
    admin2Code,
    admin3Code,
    admin4Code,
    population: parseInt(population) || 0,
    elevation: parseInt(elevation) || 0,
    dem: parseInt(dem) || 0,
    timezone,
    modificationDate
  };
}

function createDestination(geoData) {
  const country = countryNames[geoData.countryCode] || geoData.countryCode;
  let displayName;
  
  // Special handling for US cities with states
  if (geoData.countryCode === 'US' && geoData.admin1Code) {
    const state = usStates[geoData.admin1Code] || geoData.admin1Code;
    const stateAbbr = geoData.admin1Code;
    displayName = `${geoData.name}, ${stateAbbr}, United States`;
    
    return {
      name: geoData.name,
      country: 'United States',
      state: state,
      type: 'city',
      displayName
    };
  } else {
    // For all other countries
    displayName = `${geoData.name}, ${country}`;
    
    return {
      name: geoData.name,
      country,
      type: 'city',
      displayName
    };
  }
}

function isValidCity(geoData) {
  // Feature classes: P = city, village, etc.
  // Feature codes: PPL = populated place, PPLA = seat of admin div, etc.
  const validFeatureClasses = ['P'];
  const validFeatureCodes = [
    'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', // populated places
    'PPLF', 'PPLG', 'PPLL', 'PPLR', 'PPLS', 'STLMT'   // other settlements
  ];
  
  return validFeatureClasses.includes(geoData.featureClass) && 
         validFeatureCodes.includes(geoData.featureCode);
}

async function parseGeoNamesFile() {
  console.log('Reading GeoNames file...');
  const fileContent = fs.readFileSync('cities15000.txt', 'utf8');
  const lines = fileContent.trim().split('\n');
  
  console.log(`Processing ${lines.length} cities...`);
  
  const destinations = [];
  let processed = 0;
  let skipped = 0;
  
  for (const line of lines) {
    try {
      const geoData = parseGeoNamesLine(line);
      
      if (isValidCity(geoData)) {
        const destination = createDestination(geoData);
        destinations.push(destination);
        processed++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error parsing line: ${line.substring(0, 100)}...`);
      skipped++;
    }
  }
  
  // Add ski resorts at the end
  destinations.push(...skiResorts);
  
  console.log(`Processed: ${processed} cities`);
  console.log(`Skipped: ${skipped} entries`);
  console.log(`Added: ${skiResorts.length} ski resorts`);
  console.log(`Total destinations: ${destinations.length}`);
  
  return destinations;
}

async function generateDestinationsFile() {
  try {
    const destinations = await parseGeoNamesFile();
    
    // Generate TypeScript file
    let fileContent = `// Auto-generated from GeoNames data (cities15000)
// Contains ${destinations.length} destinations including cities and ski resorts
// Last updated: ${new Date().toISOString()}

export interface Destination {
  name: string;
  country: string;
  state?: string;
  type: 'city' | 'ski-resort';
  displayName: string;
}

export const destinations: Destination[] = [`;

    // Add destinations in batches to avoid memory issues
    for (let i = 0; i < destinations.length; i += 1000) {
      const batch = destinations.slice(i, i + 1000);
      for (const dest of batch) {
        const stateField = dest.state ? `, state: "${dest.state}"` : '';
        fileContent += `\n  { name: "${dest.name.replace(/"/g, '\\"')}", country: "${dest.country.replace(/"/g, '\\"')}"${stateField}, type: "${dest.type}", displayName: "${dest.displayName.replace(/"/g, '\\"')}" },`;
      }
      
      // Log progress
      console.log(`Generated ${Math.min(i + 1000, destinations.length)}/${destinations.length} destinations...`);
    }
    
    fileContent += '\n];\n';
    
    // Write to destinations file
    fs.writeFileSync('src/data/destinations.ts', fileContent);
    console.log('✅ Generated new destinations.ts file with GeoNames data!');
    
  } catch (error) {
    console.error('❌ Error generating destinations file:', error);
  }
}

// Run the script
generateDestinationsFile();