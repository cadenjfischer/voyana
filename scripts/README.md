# GeoNames Integration Scripts

This folder contains scripts for processing GeoNames data to create our comprehensive global destinations database.

## Files

- **parse-geonames.js** - Converts GeoNames cities15000.txt to TypeScript format with 30,600+ cities and ski resorts
- **convert-to-json.js** - Converts the large TypeScript array to JSON format for better build performance

## Usage

1. Download GeoNames cities15000.zip
2. Extract cities15000.txt  
3. Run `node scripts/parse-geonames.js` to generate TypeScript data
4. Run `node scripts/convert-to-json.js` to create JSON version

## Data Source

- **GeoNames**: https://download.geonames.org/export/dump/
- **cities15000.txt**: Cities with population > 15,000 (32,687 entries)
- **Filtered to**: Valid populated places (30,609 cities + 25 ski resorts = 30,634 destinations)

## Coverage

- ✅ All major global cities
- ✅ US cities with state abbreviations  
- ✅ International destinations
- ✅ Premium ski resorts
- ✅ Remote locations (Faroe Islands, Seychelles, etc.)
- ✅ TypeScript type safety
- ✅ Optimized for autocomplete search