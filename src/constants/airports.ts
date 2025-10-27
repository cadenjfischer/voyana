/**
 * Major commercial airports by city code
 * Used to filter flight search results to only show flights from major airports
 */
export const majorAirports: Record<string, string[]> = {
  // 🇪🇺 Europe
  PAR: ["CDG", "ORY", "BVA"],                 // Paris
  LON: ["LHR", "LGW", "LTN", "STN", "LCY"],   // London
  ROM: ["FCO", "CIA"],                        // Rome
  MIL: ["MXP", "LIN", "BGY"],                 // Milan
  MAD: ["MAD"],                               // Madrid
  BCN: ["BCN"],                               // Barcelona
  AMS: ["AMS"],                               // Amsterdam
  FRA: ["FRA"],                               // Frankfurt
  MUC: ["MUC"],                               // Munich
  VIE: ["VIE"],                               // Vienna
  ZRH: ["ZRH"],                               // Zurich
  LIS: ["LIS"],                               // Lisbon
  DUB: ["DUB"],                               // Dublin
  IST: ["IST", "SAW"],                        // Istanbul
  ATH: ["ATH"],                               // Athens
  OSL: ["OSL"],                               // Oslo
  CPH: ["CPH"],                               // Copenhagen
  STO: ["ARN", "BMA"],                        // Stockholm
  BRU: ["BRU"],                               // Brussels
  PRG: ["PRG"],                               // Prague
  HEL: ["HEL"],                               // Helsinki
  WAW: ["WAW"],                               // Warsaw
  BUD: ["BUD"],                               // Budapest

  // 🇺🇸 North America
  NYC: ["JFK", "LGA", "EWR"],                 // New York
  WAS: ["DCA", "IAD", "BWI"],                 // Washington DC
  CHI: ["ORD", "MDW"],                        // Chicago
  LAX: ["LAX"],                               // Los Angeles
  SFO: ["SFO"],                               // San Francisco
  MIA: ["MIA", "FLL"],                        // Miami
  DFW: ["DFW", "DAL"],                        // Dallas
  HOU: ["IAH", "HOU"],                        // Houston
  ATL: ["ATL"],                               // Atlanta
  BOS: ["BOS"],                               // Boston
  SEA: ["SEA"],                               // Seattle
  DEN: ["DEN"],                               // Denver
  LAS: ["LAS"],                               // Las Vegas
  PHX: ["PHX"],                               // Phoenix
  YTO: ["YYZ", "YTZ"],                        // Toronto
  YMQ: ["YUL"],                               // Montreal
  YVR: ["YVR"],                               // Vancouver

  // 🌍 Asia
  TYO: ["HND", "NRT"],                        // Tokyo
  OSA: ["KIX", "ITM"],                        // Osaka
  SEL: ["ICN", "GMP"],                        // Seoul
  BKK: ["BKK", "DMK"],                        // Bangkok
  SIN: ["SIN"],                               // Singapore
  HKG: ["HKG"],                               // Hong Kong
  DEL: ["DEL"],                               // Delhi
  BOM: ["BOM"],                               // Mumbai
  DXB: ["DXB"],                               // Dubai
  DOH: ["DOH"],                               // Doha
  KUL: ["KUL"],                               // Kuala Lumpur
  MNL: ["MNL"],                               // Manila
  SHA: ["PVG", "SHA"],                        // Shanghai
  BJS: ["PEK", "PKX"],                        // Beijing
  HKT: ["HKT"],                               // Phuket
  HAN: ["HAN"],                               // Hanoi
  SGN: ["SGN"],                               // Ho Chi Minh

  // 🇦🇺 Oceania
  SYD: ["SYD"],                               // Sydney
  MEL: ["MEL"],                               // Melbourne
  BNE: ["BNE"],                               // Brisbane
  AKL: ["AKL"],                               // Auckland

  // 🇧🇷 South America
  SAO: ["GRU", "CGH", "VCP"],                 // São Paulo
  RIO: ["GIG", "SDU"],                        // Rio de Janeiro
  BUE: ["EZE", "AEP"],                        // Buenos Aires
  LIM: ["LIM"],                               // Lima
  SCL: ["SCL"],                               // Santiago
  BOG: ["BOG"],                               // Bogotá

  // 🇿🇦 Africa / Middle East
  CAI: ["CAI"],                               // Cairo
  JNB: ["JNB"],                               // Johannesburg
  CPT: ["CPT"],                               // Cape Town
  NBO: ["NBO"],                               // Nairobi
  ADD: ["ADD"],                               // Addis Ababa
  RUH: ["RUH"],                               // Riyadh
  JED: ["JED"],                               // Jeddah
  TLV: ["TLV"],                               // Tel Aviv
};
