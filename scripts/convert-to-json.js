const fs = require('fs');

// Read the TypeScript destinations file
const tsContent = fs.readFileSync('src/data/destinations.ts', 'utf8');

// Extract just the array data (everything between [ and ] satisfies)
const arrayStart = tsContent.indexOf('export const destinations = [') + 'export const destinations = ['.length;
const arrayEnd = tsContent.lastIndexOf('] satisfies');
const arrayContent = tsContent.substring(arrayStart, arrayEnd);

// Create a valid JavaScript expression to evaluate the array
const arrayExpression = '[' + arrayContent + ']';

// Evaluate the array (this is safe since we generated the data ourselves)
const destinations = eval(arrayExpression);

console.log(`Converting ${destinations.length} destinations to JSON format...`);

// Write to JSON file
fs.writeFileSync('src/data/destinations-data.json', JSON.stringify(destinations, null, 0));

console.log('✅ Created destinations-data.json successfully!');