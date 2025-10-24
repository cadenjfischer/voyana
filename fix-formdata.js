const fs = require('fs');

const filePath = 'src/components/itinerary/ActivityFormModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all value={formData.xxx || ''} with value={String(formData.xxx || '')}
// This handles all form inputs that use formData
content = content.replace(/value=\{formData\.([a-zA-Z]+) \|\| ''\}/g, "value={String(formData.$1 || '')}");

// Also handle the special case with 'Automatic Timezone'
content = content.replace(/value=\{formData\.(timezone|arrivalTimezone) \|\| 'Automatic Timezone'\}/g, "value={String(formData.$1 || 'Automatic Timezone')}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ActivityFormModal.tsx');
