# Fare Options Fix - Multiple Cabin Classes

## Problem Identified
Only showing **1 economy fare option** per flight instead of multiple fare classes (economy, premium economy, business).

## Root Cause
The Duffel API search was specifying `cabin_class: 'economy'` in the request, which **filtered results to only economy class offers**. This meant:
- API only returned economy fares
- No premium economy or business class options available
- Modal showed "1 option available" instead of multiple fare tiers

## Solution

### 1. Remove Cabin Class Filter from Duffel Search

**File:** `/src/lib/api/duffelClient.ts`

**Before:**
```typescript
const offerRequest = await duffel.offerRequests.create({
  slices: [...],
  passengers: [...],
  cabin_class: params.cabinClass || 'economy', // ❌ Filters to only economy
  return_offers: params.returnDate ? true : false,
});
```

**After:**
```typescript
const offerRequest = await duffel.offerRequests.create({
  slices: [...],
  passengers: [...],
  // Don't specify cabin_class to get offers for ALL cabin classes ✅
  // This allows us to show economy, premium economy, business options
  // cabin_class: params.cabinClass || 'economy',
  return_offers: params.returnDate ? true : false,
});
```

**Impact:** Duffel now returns offers for **ALL available cabin classes** on each route.

---

### 2. Normalize Cabin Class Values

**File:** `/src/lib/api/duffelClient.ts`

Added helper function to standardize cabin class names:

```typescript
/**
 * Normalize cabin class to standardized lowercase format
 */
function normalizeCabinClass(cabinClass: string): string {
  const normalized = cabinClass.toLowerCase().trim();
  
  // Map marketing names to standard cabin classes
  if (normalized.includes('business') || normalized.includes('polaris') || normalized.includes('flagship')) {
    return 'business';
  }
  if (normalized.includes('premium') || normalized.includes('comfort')) {
    return 'premium_economy';
  }
  if (normalized.includes('first')) {
    return 'first';
  }
  // Default to economy for basic/main/economy
  return 'economy';
}
```

**Usage in normalizeFlightData:**
```typescript
// Before
cabinClass: segment.passengers[0]?.cabin_class_marketing_name || 'Economy',

// After
const rawCabinClass = segment.passengers[0]?.cabin_class || segment.passengers[0]?.cabin_class_marketing_name || 'economy';
const normalizedCabinClass = normalizeCabinClass(rawCabinClass);
```

**Why:** Converts airline-specific names like "United Polaris Business", "Delta Comfort+", "Main Cabin" into standardized values: `economy`, `premium_economy`, `business`, `first`.

---

### 3. Fix Modal Grouping Logic

**File:** `/src/components/flights/FareClassModal.tsx`

**Before:**
```typescript
const groupedByCabin: Record<string, NormalizedFlight[]> = {};
allFareOptions.forEach((offer) => {
  const cabin = offer.cabinClass || 'economy'; // ❌ Case-sensitive, no normalization
  groupedByCabin[cabin].push(offer);
});

if (groupedByCabin['economy']) { /* ... */ } // ❌ Won't match "Economy"
```

**After:**
```typescript
const groupedByCabin: Record<string, NormalizedFlight[]> = {};
allFareOptions.forEach((offer) => {
  const cabin = (offer.cabinClass || 'economy').toLowerCase().trim(); // ✅ Normalized
  if (!groupedByCabin[cabin]) {
    groupedByCabin[cabin] = [];
  }
  groupedByCabin[cabin].push(offer);
});

if (groupedByCabin['economy']) { /* ... */ } // ✅ Matches normalized value
```

**Impact:** Properly groups offers by cabin class regardless of casing.

---

### 4. Added Debug Logging

**Search API Route:**
```typescript
console.log('Merged flights sample:', mergedFlights.slice(0, 3).map(f => ({
  id: f.id,
  carrier: f.carrier,
  flightNumber: f.flightNumber,
  price: f.price,
  cabinClass: f.cabinClass,
})));

console.log(`Route ${cheapest.flightNumber}: ${offers.length} fare options`, 
  offers.map(o => ({ price: o.price, cabin: o.cabinClass })));
```

**Fare Modal:**
```typescript
console.log('FareClassModal - All fare options:', allFareOptions.map(f => ({
  id: f.id,
  price: f.price,
  cabinClass: f.cabinClass,
  carrier: f.carrier,
})));

console.log('FareClassModal - Grouped by cabin:', Object.keys(groupedByCabin));
```

---

## Expected Results

### Before Fix
- Search returns: 50 economy offers only
- Modal shows: "1 option available" → Only economy
- User sees: Single $456 economy fare

### After Fix
- Search returns: 150+ offers (economy + premium + business)
- Grouped by route: Each flight has 3-5 fare options
- Modal shows: "3 options available" (or more)
- User sees:
  - **Economy Tab**: 2-3 options ($456, $520, $580)
  - **Premium Economy Tab**: 1-2 options ($890, $1,020)
  - **Business Tab**: 1-2 options ($1,850, $2,100)

---

## Example Data Flow

### 1. Duffel API Response (New)
```json
{
  "offers": [
    { "id": "off_001", "cabin_class": "economy", "total_amount": "456" },
    { "id": "off_002", "cabin_class": "economy", "total_amount": "520" },
    { "id": "off_003", "cabin_class": "premium_economy", "total_amount": "890" },
    { "id": "off_004", "cabin_class": "business", "total_amount": "1850" }
  ]
}
```

### 2. Normalized Flights
```typescript
[
  { id: 'off_001', cabinClass: 'economy', price: 456 },
  { id: 'off_002', cabinClass: 'economy', price: 520 },
  { id: 'off_003', cabinClass: 'premium_economy', price: 890 },
  { id: 'off_004', cabinClass: 'business', price: 1850 }
]
```

### 3. Grouped by Route
```typescript
{
  "UA-123-JFK-LAX-2025-01-15T08:00": [
    { cabinClass: 'economy', price: 456 },
    { cabinClass: 'economy', price: 520 },
    { cabinClass: 'premium_economy', price: 890 },
    { cabinClass: 'business', price: 1850 }
  ]
}
```

### 4. Display Flight with Fare Options
```typescript
{
  id: 'off_001',
  carrier: 'United Airlines',
  price: 456, // Cheapest
  cabinClass: 'economy',
  fareOptions: [
    { cabinClass: 'economy', price: 456 },
    { cabinClass: 'economy', price: 520 },
    { cabinClass: 'premium_economy', price: 890 },
    { cabinClass: 'business', price: 1850 }
  ]
}
```

### 5. Modal Display
```
┌─ Economy Tab (Active) ─────────────────┐
│ ✓ Economy - $456                       │
│ ✓ Economy - $520                       │
└────────────────────────────────────────┘

┌─ Premium Economy Tab ──────────────────┐
│ ✓ Premium Economy - $890               │
└────────────────────────────────────────┘

┌─ Business Tab ─────────────────────────┐
│ ✓ Business Class - $1,850              │
└────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Search for flights (e.g., JFK → LAX)
- [ ] Check console logs for "fare options" count per route
- [ ] Verify modal shows "X options available" (should be > 1)
- [ ] Check Economy tab has multiple fares
- [ ] Check Premium Economy tab appears if available
- [ ] Check Business tab appears if available
- [ ] Verify prices are different across cabin classes
- [ ] Test booking flow with selected fare

---

## Notes

- **Duffel Test Mode** returns real flight data with authentic cabin class options
- **Not all routes have all cabin classes** - some may only have economy
- **Cabin class availability varies** by airline, route, and date
- **Prices should increase** from economy → premium → business → first
- **Some economy offers** may have different restrictions (basic vs flexible)

---

## Monitoring

After deployment, monitor:
1. **Average fare options per flight** - Should be 2-5 instead of 1
2. **Cabin class distribution** - What % of bookings are premium/business?
3. **API quota usage** - More offers returned = more data
4. **User behavior** - Do users explore multiple fare options?
