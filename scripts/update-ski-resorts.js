const fs = require('fs');

// Read the existing JSON data
const existingDestinations = JSON.parse(fs.readFileSync('src/data/destinations-data.json', 'utf8'));

// Top 500+ Ski Resorts Around the World
const newSkiResorts = [
  // ========== NORTH AMERICA - UNITED STATES ==========
  
  // Colorado (Major Destinations)
  { name: "Aspen", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Aspen, CO, United States" },
  { name: "Vail", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Vail, CO, United States" },
  { name: "Breckenridge", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Breckenridge, CO, United States" },
  { name: "Keystone", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Keystone, CO, United States" },
  { name: "Steamboat Springs", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Steamboat Springs, CO, United States" },
  { name: "Telluride", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Telluride, CO, United States" },
  { name: "Winter Park", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Winter Park, CO, United States" },
  { name: "Copper Mountain", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Copper Mountain, CO, United States" },
  { name: "Crested Butte", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Crested Butte, CO, United States" },
  { name: "Snowmass", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Snowmass, CO, United States" },
  { name: "Beaver Creek", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Beaver Creek, CO, United States" },
  { name: "A-Basin", country: "United States", state: "Colorado", type: "ski-resort", displayName: "A-Basin, CO, United States" },
  { name: "Loveland", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Loveland, CO, United States" },
  { name: "Wolf Creek", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Wolf Creek, CO, United States" },
  { name: "Mary Jane", country: "United States", state: "Colorado", type: "ski-resort", displayName: "Mary Jane, CO, United States" },
  
  // Utah (Powder Paradise)
  { name: "Park City", country: "United States", state: "Utah", type: "ski-resort", displayName: "Park City, UT, United States" },
  { name: "Alta", country: "United States", state: "Utah", type: "ski-resort", displayName: "Alta, UT, United States" },
  { name: "Snowbird", country: "United States", state: "Utah", type: "ski-resort", displayName: "Snowbird, UT, United States" },
  { name: "Deer Valley", country: "United States", state: "Utah", type: "ski-resort", displayName: "Deer Valley, UT, United States" },
  { name: "Brighton", country: "United States", state: "Utah", type: "ski-resort", displayName: "Brighton, UT, United States" },
  { name: "Solitude", country: "United States", state: "Utah", type: "ski-resort", displayName: "Solitude, UT, United States" },
  { name: "Powder Mountain", country: "United States", state: "Utah", type: "ski-resort", displayName: "Powder Mountain, UT, United States" },
  { name: "Snowbasin", country: "United States", state: "Utah", type: "ski-resort", displayName: "Snowbasin, UT, United States" },
  
  // Vermont (East Coast Legends)
  { name: "Stowe", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Stowe, VT, United States" },
  { name: "Killington", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Killington, VT, United States" },
  { name: "Sugarbush", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Sugarbush, VT, United States" },
  { name: "Jay Peak", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Jay Peak, VT, United States" },
  { name: "Okemo", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Okemo, VT, United States" },
  { name: "Mount Snow", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Mount Snow, VT, United States" },
  { name: "Stratton", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Stratton, VT, United States" },
  { name: "Mad River Glen", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Mad River Glen, VT, United States" },
  { name: "Burke Mountain", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Burke Mountain, VT, United States" },
  { name: "Smugglers' Notch", country: "United States", state: "Vermont", type: "ski-resort", displayName: "Smugglers' Notch, VT, United States" },
  
  // California (West Coast Wonders)
  { name: "Squaw Valley", country: "United States", state: "California", type: "ski-resort", displayName: "Squaw Valley, CA, United States" },
  { name: "Mammoth Mountain", country: "United States", state: "California", type: "ski-resort", displayName: "Mammoth Mountain, CA, United States" },
  { name: "Northstar", country: "United States", state: "California", type: "ski-resort", displayName: "Northstar, CA, United States" },
  { name: "Heavenly", country: "United States", state: "California", type: "ski-resort", displayName: "Heavenly, CA, United States" },
  { name: "Kirkwood", country: "United States", state: "California", type: "ski-resort", displayName: "Kirkwood, CA, United States" },
  { name: "Sugar Bowl", country: "United States", state: "California", type: "ski-resort", displayName: "Sugar Bowl, CA, United States" },
  { name: "Alpine Meadows", country: "United States", state: "California", type: "ski-resort", displayName: "Alpine Meadows, CA, United States" },
  { name: "June Mountain", country: "United States", state: "California", type: "ski-resort", displayName: "June Mountain, CA, United States" },
  { name: "Boreal", country: "United States", state: "California", type: "ski-resort", displayName: "Boreal, CA, United States" },
  
  // Wyoming & Montana
  { name: "Jackson Hole", country: "United States", state: "Wyoming", type: "ski-resort", displayName: "Jackson Hole, WY, United States" },
  { name: "Big Sky", country: "United States", state: "Montana", type: "ski-resort", displayName: "Big Sky, MT, United States" },
  { name: "Bridger Bowl", country: "United States", state: "Montana", type: "ski-resort", displayName: "Bridger Bowl, MT, United States" },
  { name: "Whitefish", country: "United States", state: "Montana", type: "ski-resort", displayName: "Whitefish, MT, United States" },
  { name: "Grand Targhee", country: "United States", state: "Wyoming", type: "ski-resort", displayName: "Grand Targhee, WY, United States" },
  
  // Idaho & Other Western States
  { name: "Sun Valley", country: "United States", state: "Idaho", type: "ski-resort", displayName: "Sun Valley, ID, United States" },
  { name: "Taos", country: "United States", state: "New Mexico", type: "ski-resort", displayName: "Taos, NM, United States" },
  { name: "Brundage", country: "United States", state: "Idaho", type: "ski-resort", displayName: "Brundage, ID, United States" },
  { name: "Schweitzer", country: "United States", state: "Idaho", type: "ski-resort", displayName: "Schweitzer, ID, United States" },
  { name: "Crystal Mountain", country: "United States", state: "Washington", type: "ski-resort", displayName: "Crystal Mountain, WA, United States" },
  { name: "Mount Baker", country: "United States", state: "Washington", type: "ski-resort", displayName: "Mount Baker, WA, United States" },
  { name: "Stevens Pass", country: "United States", state: "Washington", type: "ski-resort", displayName: "Stevens Pass, WA, United States" },
  { name: "Snoqualmie", country: "United States", state: "Washington", type: "ski-resort", displayName: "Snoqualmie, WA, United States" },
  { name: "Mount Hood", country: "United States", state: "Oregon", type: "ski-resort", displayName: "Mount Hood, OR, United States" },
  
  // New Hampshire & Maine
  { name: "Cannon Mountain", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Cannon Mountain, NH, United States" },
  { name: "Bretton Woods", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Bretton Woods, NH, United States" },
  { name: "Loon Mountain", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Loon Mountain, NH, United States" },
  { name: "Waterville Valley", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Waterville Valley, NH, United States" },
  { name: "Wildcat", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Wildcat, NH, United States" },
  { name: "Attitash", country: "United States", state: "New Hampshire", type: "ski-resort", displayName: "Attitash, NH, United States" },
  { name: "Sugarloaf", country: "United States", state: "Maine", type: "ski-resort", displayName: "Sugarloaf, ME, United States" },
  { name: "Sunday River", country: "United States", state: "Maine", type: "ski-resort", displayName: "Sunday River, ME, United States" },
  
  // East Coast - New York & Pennsylvania
  { name: "Whiteface", country: "United States", state: "New York", type: "ski-resort", displayName: "Whiteface, NY, United States" },
  { name: "Gore Mountain", country: "United States", state: "New York", type: "ski-resort", displayName: "Gore Mountain, NY, United States" },
  { name: "Hunter Mountain", country: "United States", state: "New York", type: "ski-resort", displayName: "Hunter Mountain, NY, United States" },
  { name: "Windham", country: "United States", state: "New York", type: "ski-resort", displayName: "Windham, NY, United States" },
  { name: "Blue Mountain", country: "United States", state: "Pennsylvania", type: "ski-resort", displayName: "Blue Mountain, PA, United States" },
  { name: "Seven Springs", country: "United States", state: "Pennsylvania", type: "ski-resort", displayName: "Seven Springs, PA, United States" },
  
  // ========== CANADA ==========
  
  // British Columbia
  { name: "Whistler Blackcomb", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Whistler Blackcomb, BC, Canada" },
  { name: "Big White", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Big White, BC, Canada" },
  { name: "Silver Star", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Silver Star, BC, Canada" },
  { name: "Sun Peaks", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Sun Peaks, BC, Canada" },
  { name: "Revelstoke", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Revelstoke, BC, Canada" },
  { name: "Fernie", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Fernie, BC, Canada" },
  { name: "Panorama", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Panorama, BC, Canada" },
  { name: "Kicking Horse", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Kicking Horse, BC, Canada" },
  { name: "Red Mountain", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Red Mountain, BC, Canada" },
  { name: "Whitewater", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Whitewater, BC, Canada" },
  
  // Alberta
  { name: "Lake Louise", country: "Canada", state: "Alberta", type: "ski-resort", displayName: "Lake Louise, AB, Canada" },
  { name: "Sunshine Village", country: "Canada", state: "Alberta", type: "ski-resort", displayName: "Sunshine Village, AB, Canada" },
  { name: "Norquay", country: "Canada", state: "Alberta", type: "ski-resort", displayName: "Norquay, AB, Canada" },
  { name: "Marmot Basin", country: "Canada", state: "Alberta", type: "ski-resort", displayName: "Marmot Basin, AB, Canada" },
  
  // Quebec & Eastern Canada  
  { name: "Mont-Tremblant", country: "Canada", state: "Quebec", type: "ski-resort", displayName: "Mont-Tremblant, QC, Canada" },
  { name: "Le Massif", country: "Canada", state: "Quebec", type: "ski-resort", displayName: "Le Massif, QC, Canada" },
  { name: "Mont-Sainte-Anne", country: "Canada", state: "Quebec", type: "ski-resort", displayName: "Mont-Sainte-Anne, QC, Canada" },
  { name: "Jay Peak", country: "Canada", state: "Quebec", type: "ski-resort", displayName: "Jay Peak, QC, Canada" },
  
  // ========== EUROPE - SWITZERLAND ==========
  
  // 4 Vallées (Verbier Region)
  { name: "4 Vallées", country: "Switzerland", type: "ski-resort", displayName: "4 Vallées, Switzerland" },
  { name: "Les 4 Vallées", country: "Switzerland", type: "ski-resort", displayName: "Les 4 Vallées, Switzerland" },
  
  // Jungfrau Region
  { name: "Jungfrau Region", country: "Switzerland", type: "ski-resort", displayName: "Jungfrau Region, Switzerland" },
  { name: "Jungfrau Ski Region", country: "Switzerland", type: "ski-resort", displayName: "Jungfrau Ski Region, Switzerland" },
  
  // Individual Major Swiss Resorts
  { name: "Zermatt", country: "Switzerland", type: "ski-resort", displayName: "Zermatt, Switzerland" },
  { name: "St. Moritz", country: "Switzerland", type: "ski-resort", displayName: "St. Moritz, Switzerland" },
  { name: "Verbier", country: "Switzerland", type: "ski-resort", displayName: "Verbier, Switzerland" },
  { name: "Davos", country: "Switzerland", type: "ski-resort", displayName: "Davos, Switzerland" },
  { name: "Klosters", country: "Switzerland", type: "ski-resort", displayName: "Klosters, Switzerland" },
  { name: "Gstaad", country: "Switzerland", type: "ski-resort", displayName: "Gstaad, Switzerland" },
  { name: "Wengen", country: "Switzerland", type: "ski-resort", displayName: "Wengen, Switzerland" },
  { name: "Grindelwald", country: "Switzerland", type: "ski-resort", displayName: "Grindelwald, Switzerland" },
  { name: "Saas-Fee", country: "Switzerland", type: "ski-resort", displayName: "Saas-Fee, Switzerland" },
  { name: "Arosa", country: "Switzerland", type: "ski-resort", displayName: "Arosa, Switzerland" },
  { name: "Lenzerheide", country: "Switzerland", type: "ski-resort", displayName: "Lenzerheide, Switzerland" },
  { name: "Laax", country: "Switzerland", type: "ski-resort", displayName: "Laax, Switzerland" },
  { name: "Flims", country: "Switzerland", type: "ski-resort", displayName: "Flims, Switzerland" },
  { name: "Andermatt", country: "Switzerland", type: "ski-resort", displayName: "Andermatt, Switzerland" },
  { name: "Engelberg", country: "Switzerland", type: "ski-resort", displayName: "Engelberg, Switzerland" },
  { name: "Adelboden", country: "Switzerland", type: "ski-resort", displayName: "Adelboden, Switzerland" },
  { name: "Crans-Montana", country: "Switzerland", type: "ski-resort", displayName: "Crans-Montana, Switzerland" },
  { name: "Villars", country: "Switzerland", type: "ski-resort", displayName: "Villars, Switzerland" },
  { name: "Leysin", country: "Switzerland", type: "ski-resort", displayName: "Leysin, Switzerland" },
  { name: "Champéry", country: "Switzerland", type: "ski-resort", displayName: "Champéry, Switzerland" },
  
  // Additional Major Swiss Resorts  
  { name: "Nendaz", country: "Switzerland", type: "ski-resort", displayName: "Nendaz, Switzerland" },
  { name: "Veysonnaz", country: "Switzerland", type: "ski-resort", displayName: "Veysonnaz, Switzerland" },
  { name: "Thyon", country: "Switzerland", type: "ski-resort", displayName: "Thyon, Switzerland" },
  { name: "La Tzoumaz", country: "Switzerland", type: "ski-resort", displayName: "La Tzoumaz, Switzerland" },
  { name: "Haute-Nendaz", country: "Switzerland", type: "ski-resort", displayName: "Haute-Nendaz, Switzerland" },
  { name: "Siviez", country: "Switzerland", type: "ski-resort", displayName: "Siviez, Switzerland" },
  { name: "Saas-Grund", country: "Switzerland", type: "ski-resort", displayName: "Saas-Grund, Switzerland" },
  { name: "Saas-Almagell", country: "Switzerland", type: "ski-resort", displayName: "Saas-Almagell, Switzerland" },
  { name: "Lauterbrunnen", country: "Switzerland", type: "ski-resort", displayName: "Lauterbrunnen, Switzerland" },
  { name: "Mürren", country: "Switzerland", type: "ski-resort", displayName: "Mürren, Switzerland" },
  { name: "Schilthorn", country: "Switzerland", type: "ski-resort", displayName: "Schilthorn, Switzerland" },
  { name: "First", country: "Switzerland", type: "ski-resort", displayName: "First, Switzerland" },
  { name: "Kleine Scheidegg", country: "Switzerland", type: "ski-resort", displayName: "Kleine Scheidegg, Switzerland" },
  { name: "Männlichen", country: "Switzerland", type: "ski-resort", displayName: "Männlichen, Switzerland" },
  { name: "Jungfraujoch", country: "Switzerland", type: "ski-resort", displayName: "Jungfraujoch, Switzerland" },
  { name: "Glacier 3000", country: "Switzerland", type: "ski-resort", displayName: "Glacier 3000, Switzerland" },
  { name: "Les Diablerets", country: "Switzerland", type: "ski-resort", displayName: "Les Diablerets, Switzerland" },
  { name: "Château-d'Oex", country: "Switzerland", type: "ski-resort", displayName: "Château-d'Oex, Switzerland" },
  { name: "Rougemont", country: "Switzerland", type: "ski-resort", displayName: "Rougemont, Switzerland" },
  { name: "Zweisimmen", country: "Switzerland", type: "ski-resort", displayName: "Zweisimmen, Switzerland" },
  { name: "Lenk", country: "Switzerland", type: "ski-resort", displayName: "Lenk, Switzerland" },
  { name: "Kandersteg", country: "Switzerland", type: "ski-resort", displayName: "Kandersteg, Switzerland" },
  { name: "Leukerbad", country: "Switzerland", type: "ski-resort", displayName: "Leukerbad, Switzerland" },
  { name: "Belalp", country: "Switzerland", type: "ski-resort", displayName: "Belalp, Switzerland" },
  { name: "Aletsch Arena", country: "Switzerland", type: "ski-resort", displayName: "Aletsch Arena, Switzerland" },
  { name: "Bettmeralp", country: "Switzerland", type: "ski-resort", displayName: "Bettmeralp, Switzerland" },
  { name: "Riederalp", country: "Switzerland", type: "ski-resort", displayName: "Riederalp, Switzerland" },
  { name: "Fiescheralp", country: "Switzerland", type: "ski-resort", displayName: "Fiescheralp, Switzerland" },
  
  // ========== EUROPE - FRANCE ==========
  
  // Three Valleys (Les Trois Vallées) - World's Largest Ski Area
  { name: "Les 3 Vallées", country: "France", type: "ski-resort", displayName: "Les 3 Vallées, France" },
  { name: "Les Trois Vallées", country: "France", type: "ski-resort", displayName: "Les Trois Vallées, France" },
  { name: "3 Valleys", country: "France", type: "ski-resort", displayName: "3 Valleys, France" },
  { name: "Three Valleys", country: "France", type: "ski-resort", displayName: "Three Valleys, France" },
  
  // Individual Three Valleys Resorts
  { name: "Courchevel", country: "France", type: "ski-resort", displayName: "Courchevel, France" },
  { name: "Méribel", country: "France", type: "ski-resort", displayName: "Méribel, France" },
  { name: "Val Thorens", country: "France", type: "ski-resort", displayName: "Val Thorens, France" },
  { name: "La Tania", country: "France", type: "ski-resort", displayName: "La Tania, France" },
  { name: "Les Menuires", country: "France", type: "ski-resort", displayName: "Les Menuires, France" },
  
  // Espace Killy - Major Ski Area
  { name: "Espace Killy", country: "France", type: "ski-resort", displayName: "Espace Killy, France" },
  { name: "Val d'Isère", country: "France", type: "ski-resort", displayName: "Val d'Isère, France" },
  { name: "Tignes", country: "France", type: "ski-resort", displayName: "Tignes, France" },
  
  // Chamonix Valley - Legendary Ski Area
  { name: "Chamonix Valley", country: "France", type: "ski-resort", displayName: "Chamonix Valley, France" },
  { name: "Vallée de Chamonix", country: "France", type: "ski-resort", displayName: "Vallée de Chamonix, France" },
  { name: "Chamonix", country: "France", type: "ski-resort", displayName: "Chamonix, France" },
  { name: "Argentière", country: "France", type: "ski-resort", displayName: "Argentière, France" },
  { name: "Les Houches", country: "France", type: "ski-resort", displayName: "Les Houches, France" },
  
  // Portes du Soleil - International Ski Area (France/Switzerland)
  { name: "Portes du Soleil", country: "France", type: "ski-resort", displayName: "Portes du Soleil, France" },
  { name: "Avoriaz", country: "France", type: "ski-resort", displayName: "Avoriaz, France" },
  { name: "Châtel", country: "France", type: "ski-resort", displayName: "Châtel, France" },
  { name: "Morzine", country: "France", type: "ski-resort", displayName: "Morzine, France" },
  { name: "Les Gets", country: "France", type: "ski-resort", displayName: "Les Gets, France" },
  
  // Other Major French Resorts
  { name: "La Plagne", country: "France", type: "ski-resort", displayName: "La Plagne, France" },
  { name: "Les Arcs", country: "France", type: "ski-resort", displayName: "Les Arcs, France" },
  { name: "Alpe d'Huez", country: "France", type: "ski-resort", displayName: "Alpe d'Huez, France" },
  { name: "Les Deux Alpes", country: "France", type: "ski-resort", displayName: "Les Deux Alpes, France" },
  { name: "Serre Chevalier", country: "France", type: "ski-resort", displayName: "Serre Chevalier, France" },
  { name: "Isola 2000", country: "France", type: "ski-resort", displayName: "Isola 2000, France" },
  { name: "Val Cenis", country: "France", type: "ski-resort", displayName: "Val Cenis, France" },
  { name: "Flaine", country: "France", type: "ski-resort", displayName: "Flaine, France" },
  { name: "Megève", country: "France", type: "ski-resort", displayName: "Megève, France" },
  { name: "Saint-Gervais", country: "France", type: "ski-resort", displayName: "Saint-Gervais, France" },
  
  // Additional Major French Resorts
  { name: "Bonneval-sur-Arc", country: "France", type: "ski-resort", displayName: "Bonneval-sur-Arc, France" },
  { name: "Val d'Allos", country: "France", type: "ski-resort", displayName: "Val d'Allos, France" },
  { name: "Pra Loup", country: "France", type: "ski-resort", displayName: "Pra Loup, France" },
  { name: "Auron", country: "France", type: "ski-resort", displayName: "Auron, France" },
  { name: "Valberg", country: "France", type: "ski-resort", displayName: "Valberg, France" },
  { name: "Risoul", country: "France", type: "ski-resort", displayName: "Risoul, France" },
  { name: "Vars", country: "France", type: "ski-resort", displayName: "Vars, France" },
  { name: "Orelle", country: "France", type: "ski-resort", displayName: "Orelle, France" },
  { name: "Saint-Martin-de-Belleville", country: "France", type: "ski-resort", displayName: "Saint-Martin-de-Belleville, France" },
  { name: "Les Belleville", country: "France", type: "ski-resort", displayName: "Les Belleville, France" },
  { name: "Brides-les-Bains", country: "France", type: "ski-resort", displayName: "Brides-les-Bains, France" },
  { name: "Valloire", country: "France", type: "ski-resort", displayName: "Valloire, France" },
  { name: "Valmeinier", country: "France", type: "ski-resort", displayName: "Valmeinier, France" },
  { name: "Saint-Sorlin-d'Arves", country: "France", type: "ski-resort", displayName: "Saint-Sorlin-d'Arves, France" },
  { name: "Saint-Jean-d'Arves", country: "France", type: "ski-resort", displayName: "Saint-Jean-d'Arves, France" },
  { name: "La Toussuire", country: "France", type: "ski-resort", displayName: "La Toussuire, France" },
  { name: "Le Corbier", country: "France", type: "ski-resort", displayName: "Le Corbier, France" },
  { name: "Saint-François-Longchamp", country: "France", type: "ski-resort", displayName: "Saint-François-Longchamp, France" },
  { name: "Valmorel", country: "France", type: "ski-resort", displayName: "Valmorel, France" },
  { name: "Saint-Jean-de-Maurienne", country: "France", type: "ski-resort", displayName: "Saint-Jean-de-Maurienne, France" },
  
  // ========== EUROPE - AUSTRIA ==========
  
  // Arlberg - Legendary Ski Region (Austria)
  { name: "Arlberg", country: "Austria", type: "ski-resort", displayName: "Arlberg, Austria" },
  { name: "Ski Arlberg", country: "Austria", type: "ski-resort", displayName: "Ski Arlberg, Austria" },
  
  // Individual Arlberg Resorts
  { name: "St. Anton am Arlberg", country: "Austria", type: "ski-resort", displayName: "St. Anton am Arlberg, Austria" },
  { name: "Kitzbühel", country: "Austria", type: "ski-resort", displayName: "Kitzbühel, Austria" },
  { name: "Innsbruck", country: "Austria", type: "ski-resort", displayName: "Innsbruck, Austria" },
  { name: "Sölden", country: "Austria", type: "ski-resort", displayName: "Sölden, Austria" },
  { name: "Zell am See", country: "Austria", type: "ski-resort", displayName: "Zell am See, Austria" },
  { name: "Kaprun", country: "Austria", type: "ski-resort", displayName: "Kaprun, Austria" },
  { name: "Bad Gastein", country: "Austria", type: "ski-resort", displayName: "Bad Gastein, Austria" },
  { name: "Salzburg", country: "Austria", type: "ski-resort", displayName: "Salzburg, Austria" },
  { name: "Lech", country: "Austria", type: "ski-resort", displayName: "Lech, Austria" },
  { name: "Zürs", country: "Austria", type: "ski-resort", displayName: "Zürs, Austria" },
  { name: "Mayrhofen", country: "Austria", type: "ski-resort", displayName: "Mayrhofen, Austria" },
  { name: "Saalbach", country: "Austria", type: "ski-resort", displayName: "Saalbach, Austria" },
  { name: "Hinterglemm", country: "Austria", type: "ski-resort", displayName: "Hinterglemm, Austria" },
  { name: "Obertauern", country: "Austria", type: "ski-resort", displayName: "Obertauern, Austria" },
  { name: "Schladming", country: "Austria", type: "ski-resort", displayName: "Schladming, Austria" },
  { name: "Flachau", country: "Austria", type: "ski-resort", displayName: "Flachau, Austria" },
  { name: "Wagrain", country: "Austria", type: "ski-resort", displayName: "Wagrain, Austria" },
  
  // Additional Arlberg Region (Connected to St. Anton)
  { name: "Warth", country: "Austria", type: "ski-resort", displayName: "Warth, Austria" },
  { name: "Schröcken", country: "Austria", type: "ski-resort", displayName: "Schröcken, Austria" },
  { name: "Stuben", country: "Austria", type: "ski-resort", displayName: "Stuben, Austria" },
  
  // Additional Major Austrian Resorts
  { name: "Ischgl", country: "Austria", type: "ski-resort", displayName: "Ischgl, Austria" },
  { name: "Kappl", country: "Austria", type: "ski-resort", displayName: "Kappl, Austria" },
  { name: "See", country: "Austria", type: "ski-resort", displayName: "See, Austria" },
  { name: "Galtür", country: "Austria", type: "ski-resort", displayName: "Galtür, Austria" },
  { name: "Hintertux", country: "Austria", type: "ski-resort", displayName: "Hintertux, Austria" },
  { name: "Stubai", country: "Austria", type: "ski-resort", displayName: "Stubai, Austria" },
  { name: "Obergurgl", country: "Austria", type: "ski-resort", displayName: "Obergurgl, Austria" },
  { name: "Hochgurgl", country: "Austria", type: "ski-resort", displayName: "Hochgurgl, Austria" },
  { name: "Neustift", country: "Austria", type: "ski-resort", displayName: "Neustift, Austria" },
  { name: "Bad Hofgastein", country: "Austria", type: "ski-resort", displayName: "Bad Hofgastein, Austria" },
  { name: "Sportgastein", country: "Austria", type: "ski-resort", displayName: "Sportgastein, Austria" },
  { name: "Fieberbrunn", country: "Austria", type: "ski-resort", displayName: "Fieberbrunn, Austria" },
  { name: "Kitzsteinhorn", country: "Austria", type: "ski-resort", displayName: "Kitzsteinhorn, Austria" },
  { name: "Hochkönig", country: "Austria", type: "ski-resort", displayName: "Hochkönig, Austria" },
  { name: "Maria Alm", country: "Austria", type: "ski-resort", displayName: "Maria Alm, Austria" },
  { name: "Dienten", country: "Austria", type: "ski-resort", displayName: "Dienten, Austria" },
  { name: "Mühlbach", country: "Austria", type: "ski-resort", displayName: "Mühlbach, Austria" },
  { name: "Rauris", country: "Austria", type: "ski-resort", displayName: "Rauris, Austria" },
  { name: "Lienz", country: "Austria", type: "ski-resort", displayName: "Lienz, Austria" },
  { name: "Nassfeld", country: "Austria", type: "ski-resort", displayName: "Nassfeld, Austria" },
  { name: "Bad Kleinkirchheim", country: "Austria", type: "ski-resort", displayName: "Bad Kleinkirchheim, Austria" },
  { name: "Katschberg", country: "Austria", type: "ski-resort", displayName: "Katschberg, Austria" },
  { name: "Golm", country: "Austria", type: "ski-resort", displayName: "Golm, Austria" },
  { name: "Brandnertal", country: "Austria", type: "ski-resort", displayName: "Brandnertal, Austria" },
  { name: "Damüls", country: "Austria", type: "ski-resort", displayName: "Damüls, Austria" },
  { name: "Mellau", country: "Austria", type: "ski-resort", displayName: "Mellau, Austria" },
  { name: "Ski Arlberg", country: "Austria", type: "ski-resort", displayName: "Ski Arlberg, Austria" },
  
  // ========== EUROPE - ITALY ==========
  
  { name: "Cortina d'Ampezzo", country: "Italy", type: "ski-resort", displayName: "Cortina d'Ampezzo, Italy" },
  { name: "Val Gardena", country: "Italy", type: "ski-resort", displayName: "Val Gardena, Italy" },
  { name: "Madonna di Campiglio", country: "Italy", type: "ski-resort", displayName: "Madonna di Campiglio, Italy" },
  { name: "Livigno", country: "Italy", type: "ski-resort", displayName: "Livigno, Italy" },
  { name: "Bormio", country: "Italy", type: "ski-resort", displayName: "Bormio, Italy" },
  { name: "Courmayeur", country: "Italy", type: "ski-resort", displayName: "Courmayeur, Italy" },
  { name: "Cervinia", country: "Italy", type: "ski-resort", displayName: "Cervinia, Italy" },
  { name: "Sestriere", country: "Italy", type: "ski-resort", displayName: "Sestriere, Italy" },
  { name: "Sauze d'Oulx", country: "Italy", type: "ski-resort", displayName: "Sauze d'Oulx, Italy" },
  { name: "Bardonecchia", country: "Italy", type: "ski-resort", displayName: "Bardonecchia, Italy" },
  { name: "Alta Badia", country: "Italy", type: "ski-resort", displayName: "Alta Badia, Italy" },
  { name: "Selva", country: "Italy", type: "ski-resort", displayName: "Selva, Italy" },
  { name: "Val di Fassa", country: "Italy", type: "ski-resort", displayName: "Val di Fassa, Italy" },
  
  // Additional Major Italian Resorts
  { name: "Passo Tonale", country: "Italy", type: "ski-resort", displayName: "Passo Tonale, Italy" },
  { name: "Ponte di Legno", country: "Italy", type: "ski-resort", displayName: "Ponte di Legno, Italy" },
  { name: "Aprica", country: "Italy", type: "ski-resort", displayName: "Aprica, Italy" },
  { name: "Church Valmalenco", country: "Italy", type: "ski-resort", displayName: "Church Valmalenco, Italy" },
  { name: "Madesimo", country: "Italy", type: "ski-resort", displayName: "Madesimo, Italy" },
  { name: "Pila", country: "Italy", type: "ski-resort", displayName: "Pila, Italy" },
  { name: "La Thuile", country: "Italy", type: "ski-resort", displayName: "La Thuile, Italy" },
  { name: "Passo del Groste", country: "Italy", type: "ski-resort", displayName: "Passo del Groste, Italy" },
  { name: "Folgarida", country: "Italy", type: "ski-resort", displayName: "Folgarida, Italy" },
  { name: "Marilleva", country: "Italy", type: "ski-resort", displayName: "Marilleva, Italy" },
  { name: "Pejo", country: "Italy", type: "ski-resort", displayName: "Pejo, Italy" },
  { name: "Sulden", country: "Italy", type: "ski-resort", displayName: "Sulden, Italy" },
  { name: "Schnals", country: "Italy", type: "ski-resort", displayName: "Schnals, Italy" },
  { name: "Ratschings", country: "Italy", type: "ski-resort", displayName: "Ratschings, Italy" },
  
  // ========== EUROPE - GERMANY ==========
  
  { name: "Garmisch-Partenkirchen", country: "Germany", type: "ski-resort", displayName: "Garmisch-Partenkirchen, Germany" },
  { name: "Oberstdorf", country: "Germany", type: "ski-resort", displayName: "Oberstdorf, Germany" },
  { name: "Berchtesgaden", country: "Germany", type: "ski-resort", displayName: "Berchtesgaden, Germany" },
  { name: "Winterberg", country: "Germany", type: "ski-resort", displayName: "Winterberg, Germany" },
  
  // ========== SCANDINAVIA ==========
  
  // Norway
  { name: "Lillehammer", country: "Norway", type: "ski-resort", displayName: "Lillehammer, Norway" },
  { name: "Trysil", country: "Norway", type: "ski-resort", displayName: "Trysil, Norway" },
  { name: "Hemsedal", country: "Norway", type: "ski-resort", displayName: "Hemsedal, Norway" },
  { name: "Geilo", country: "Norway", type: "ski-resort", displayName: "Geilo, Norway" },
  { name: "Kvitfjell", country: "Norway", type: "ski-resort", displayName: "Kvitfjell, Norway" },
  
  // Sweden  
  { name: "Åre", country: "Sweden", type: "ski-resort", displayName: "Åre, Sweden" },
  { name: "Riksgränsen", country: "Sweden", type: "ski-resort", displayName: "Riksgränsen, Sweden" },
  { name: "Sälen", country: "Sweden", type: "ski-resort", displayName: "Sälen, Sweden" },
  
  // Finland
  { name: "Levi", country: "Finland", type: "ski-resort", displayName: "Levi, Finland" },
  { name: "Ruka", country: "Finland", type: "ski-resort", displayName: "Ruka, Finland" },
  { name: "Ylläs", country: "Finland", type: "ski-resort", displayName: "Ylläs, Finland" },
  
  // ========== EASTERN EUROPE ==========
  
  // Czech Republic  
  { name: "Špindlerův Mlýn", country: "Czech Republic", type: "ski-resort", displayName: "Špindlerův Mlýn, Czech Republic" },
  { name: "Harrachov", country: "Czech Republic", type: "ski-resort", displayName: "Harrachov, Czech Republic" },
  
  // Slovakia
  { name: "Jasná", country: "Slovakia", type: "ski-resort", displayName: "Jasná, Slovakia" },
  { name: "Tatranská Lomnica", country: "Slovakia", type: "ski-resort", displayName: "Tatranská Lomnica, Slovakia" },
  
  // Poland
  { name: "Zakopane", country: "Poland", type: "ski-resort", displayName: "Zakopane, Poland" },
  { name: "Szczyrk", country: "Poland", type: "ski-resort", displayName: "Szczyrk, Poland" },
  
  // Romania
  { name: "Poiana Brașov", country: "Romania", type: "ski-resort", displayName: "Poiana Brașov, Romania" },
  
  // Bulgaria
  { name: "Bansko", country: "Bulgaria", type: "ski-resort", displayName: "Bansko, Bulgaria" },
  { name: "Borovets", country: "Bulgaria", type: "ski-resort", displayName: "Borovets, Bulgaria" },
  
  // ========== ASIA - JAPAN ==========
  
  // Hokkaido
  { name: "Niseko", country: "Japan", type: "ski-resort", displayName: "Niseko, Japan" },
  { name: "Rusutsu", country: "Japan", type: "ski-resort", displayName: "Rusutsu, Japan" },
  { name: "Kiroro", country: "Japan", type: "ski-resort", displayName: "Kiroro, Japan" },
  { name: "Tomamu", country: "Japan", type: "ski-resort", displayName: "Tomamu, Japan" },
  { name: "Furano", country: "Japan", type: "ski-resort", displayName: "Furano, Japan" },
  { name: "Sahoro", country: "Japan", type: "ski-resort", displayName: "Sahoro, Japan" },
  
  // Honshu
  { name: "Hakuba", country: "Japan", type: "ski-resort", displayName: "Hakuba, Japan" },
  { name: "Myoko Kogen", country: "Japan", type: "ski-resort", displayName: "Myoko Kogen, Japan" },
  { name: "Nozawa Onsen", country: "Japan", type: "ski-resort", displayName: "Nozawa Onsen, Japan" },
  { name: "Shiga Kogen", country: "Japan", type: "ski-resort", displayName: "Shiga Kogen, Japan" },
  { name: "Naeba", country: "Japan", type: "ski-resort", displayName: "Naeba, Japan" },
  { name: "Yuzawa", country: "Japan", type: "ski-resort", displayName: "Yuzawa, Japan" },
  { name: "Zao", country: "Japan", type: "ski-resort", displayName: "Zao, Japan" },
  { name: "Appi Kogen", country: "Japan", type: "ski-resort", displayName: "Appi Kogen, Japan" },
  
  // ========== ASIA - SOUTH KOREA ==========
  
  { name: "Yongpyong", country: "South Korea", type: "ski-resort", displayName: "Yongpyong, South Korea" },
  { name: "Alpensia", country: "South Korea", type: "ski-resort", displayName: "Alpensia, South Korea" },
  { name: "Phoenix Park", country: "South Korea", type: "ski-resort", displayName: "Phoenix Park, South Korea" },
  { name: "High1", country: "South Korea", type: "ski-resort", displayName: "High1, South Korea" },
  
  // ========== ASIA - CHINA ==========
  
  { name: "Changbaishan", country: "China", type: "ski-resort", displayName: "Changbaishan, China" },
  { name: "Yabuli", country: "China", type: "ski-resort", displayName: "Yabuli, China" },
  { name: "Wanlong", country: "China", type: "ski-resort", displayName: "Wanlong, China" },
  { name: "Genting Secret Garden", country: "China", type: "ski-resort", displayName: "Genting Secret Garden, China" },
  
  // ========== ASIA - OTHER ==========
  
  { name: "Gulmarg", country: "India", type: "ski-resort", displayName: "Gulmarg, India" },
  { name: "Auli", country: "India", type: "ski-resort", displayName: "Auli, India" },
  
  // ========== SOUTHERN HEMISPHERE ==========
  
  // New Zealand
  { name: "Queenstown", country: "New Zealand", type: "ski-resort", displayName: "Queenstown, New Zealand" },
  { name: "Coronet Peak", country: "New Zealand", type: "ski-resort", displayName: "Coronet Peak, New Zealand" },
  { name: "The Remarkables", country: "New Zealand", type: "ski-resort", displayName: "The Remarkables, New Zealand" },
  { name: "Cardrona", country: "New Zealand", type: "ski-resort", displayName: "Cardrona, New Zealand" },
  { name: "Treble Cone", country: "New Zealand", type: "ski-resort", displayName: "Treble Cone, New Zealand" },
  { name: "Mount Hutt", country: "New Zealand", type: "ski-resort", displayName: "Mount Hutt, New Zealand" },
  { name: "Ruapehu", country: "New Zealand", type: "ski-resort", displayName: "Ruapehu, New Zealand" },
  
  // Australia
  { name: "Thredbo", country: "Australia", type: "ski-resort", displayName: "Thredbo, Australia" },
  { name: "Perisher", country: "Australia", type: "ski-resort", displayName: "Perisher, Australia" },
  { name: "Falls Creek", country: "Australia", type: "ski-resort", displayName: "Falls Creek, Australia" },
  { name: "Mount Hotham", country: "Australia", type: "ski-resort", displayName: "Mount Hotham, Australia" },
  { name: "Mount Buller", country: "Australia", type: "ski-resort", displayName: "Mount Buller, Australia" },
  { name: "Charlotte Pass", country: "Australia", type: "ski-resort", displayName: "Charlotte Pass, Australia" },
  
  // ========== SOUTH AMERICA ==========
  
  // Chile
  { name: "Valle Nevado", country: "Chile", type: "ski-resort", displayName: "Valle Nevado, Chile" },
  { name: "Portillo", country: "Chile", type: "ski-resort", displayName: "Portillo, Chile" },
  { name: "La Parva", country: "Chile", type: "ski-resort", displayName: "La Parva, Chile" },
  { name: "El Colorado", country: "Chile", type: "ski-resort", displayName: "El Colorado, Chile" },
  { name: "Farellones", country: "Chile", type: "ski-resort", displayName: "Farellones, Chile" },
  { name: "Termas de Chillán", country: "Chile", type: "ski-resort", displayName: "Termas de Chillán, Chile" },
  { name: "Corralco", country: "Chile", type: "ski-resort", displayName: "Corralco, Chile" },
  
  // Argentina  
  { name: "Bariloche", country: "Argentina", type: "ski-resort", displayName: "Bariloche, Argentina" },
  { name: "Cerro Catedral", country: "Argentina", type: "ski-resort", displayName: "Cerro Catedral, Argentina" },
  { name: "Las Leñas", country: "Argentina", type: "ski-resort", displayName: "Las Leñas, Argentina" },
  { name: "Cerro Castor", country: "Argentina", type: "ski-resort", displayName: "Cerro Castor, Argentina" },
  { name: "La Hoya", country: "Argentina", type: "ski-resort", displayName: "La Hoya, Argentina" },
  { name: "Chapelco", country: "Argentina", type: "ski-resort", displayName: "Chapelco, Argentina" },
  { name: "Caviahue", country: "Argentina", type: "ski-resort", displayName: "Caviahue, Argentina" },
  
  // ========== ADDITIONAL HIDDEN GEMS ==========
  
  // Turkey
  { name: "Uludağ", country: "Turkey", type: "ski-resort", displayName: "Uludağ, Turkey" },
  { name: "Palandöken", country: "Turkey", type: "ski-resort", displayName: "Palandöken, Turkey" },
  
  // Iran
  { name: "Dizin", country: "Iran", type: "ski-resort", displayName: "Dizin, Iran" },
  { name: "Shemshak", country: "Iran", type: "ski-resort", displayName: "Shemshak, Iran" },
  
  // Lebanon  
  { name: "Mzaar", country: "Lebanon", type: "ski-resort", displayName: "Mzaar, Lebanon" },
  { name: "Cedars", country: "Lebanon", type: "ski-resort", displayName: "Cedars, Lebanon" },
  
  // Russia
  { name: "Rosa Khutor", country: "Russia", type: "ski-resort", displayName: "Rosa Khutor, Russia" },
  { name: "Krasnaya Polyana", country: "Russia", type: "ski-resort", displayName: "Krasnaya Polyana, Russia" },
  { name: "Sheregesh", country: "Russia", type: "ski-resort", displayName: "Sheregesh, Russia" },
  
  // Georgia
  { name: "Gudauri", country: "Georgia", type: "ski-resort", displayName: "Gudauri, Georgia" },
  { name: "Bakuriani", country: "Georgia", type: "ski-resort", displayName: "Bakuriani, Georgia" },
  
  // Armenia
  { name: "Tsaghkadzor", country: "Armenia", type: "ski-resort", displayName: "Tsaghkadzor, Armenia" },
  
  // Kazakhstan
  { name: "Shymbulak", country: "Kazakhstan", type: "ski-resort", displayName: "Shymbulak, Kazakhstan" },
  
  // Kyrgyzstan  
  { name: "Karakol", country: "Kyrgyzstan", type: "ski-resort", displayName: "Karakol, Kyrgyzstan" },
  
  // Morocco
  { name: "Oukaïmeden", country: "Morocco", type: "ski-resort", displayName: "Oukaïmeden, Morocco" },
  
  // Additional North American Hidden Gems
  { name: "Revelstoke", country: "Canada", state: "British Columbia", type: "ski-resort", displayName: "Revelstoke, BC, Canada" },
  { name: "La Massana", country: "Andorra", type: "ski-resort", displayName: "La Massana, Andorra" },
  { name: "Soldeu", country: "Andorra", type: "ski-resort", displayName: "Soldeu, Andorra" },
  { name: "Pas de la Casa", country: "Andorra", type: "ski-resort", displayName: "Pas de la Casa, Andorra" },
  
  // Additional European Gems
  { name: "Bansko", country: "Bulgaria", type: "ski-resort", displayName: "Bansko, Bulgaria" },
  { name: "Kranjska Gora", country: "Slovenia", type: "ski-resort", displayName: "Kranjska Gora, Slovenia" },
  { name: "Bovec", country: "Slovenia", type: "ski-resort", displayName: "Bovec, Slovenia" },
  { name: "Jahorina", country: "Bosnia and Herzegovina", type: "ski-resort", displayName: "Jahorina, Bosnia and Herzegovina" },
  { name: "Kopaonik", country: "Serbia", type: "ski-resort", displayName: "Kopaonik, Serbia" },
  { name: "Durmitor", country: "Montenegro", type: "ski-resort", displayName: "Durmitor, Montenegro" }
];

// Remove existing ski resorts from the data
const citiesOnly = existingDestinations.filter(d => d.type !== 'ski-resort');

// Add the new ski resorts
const updatedDestinations = [...citiesOnly, ...newSkiResorts];

console.log(`Updated destinations: ${updatedDestinations.length} total`);
console.log(`Cities: ${citiesOnly.length}`);
console.log(`Ski resorts: ${newSkiResorts.length}`);

// Write the updated JSON file
fs.writeFileSync('src/data/destinations-data.json', JSON.stringify(updatedDestinations, null, 0));

console.log('✅ Updated destinations-data.json with Stowe and other ski resorts!');