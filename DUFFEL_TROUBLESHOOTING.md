# Duffel Flight Search Troubleshooting

## ✅ What We Verified

1. **Duffel API is Working**
   - Tested with `node test-duffel.js` - Successfully returns 50+ test flights
   - API key is valid and loaded from `.env.local`
   - Test flight example: British Airways 0109, LHR → JFK, $285.71

2. **Environment Variable Exists**
   - `.env.local` file contains: `DUFFEL_API_KEY=duffel_test_...`
   - Next.js shows "Environments: .env.local" on startup

## 🔍 How to Debug Your Issue

### Step 1: Check Browser Console
1. Open your app at http://localhost:3000
2. Go to a trip's Flights tab
3. Try to search for a flight (e.g., LHR → JFK on 2025-12-15)
4. Open Developer Tools (F12) → Console tab
5. Look for these messages:
   - ✅ `DUFFEL_API_KEY is set: duffel_test_...`
   - `Duffel search params: { origin: 'LHR', destination: 'JFK', ...}`
   - `Duffel returned X offers`

### Step 2: Check Server Logs
In your terminal where `npm run dev` is running, you should see:
```
✅ DUFFEL_API_KEY is set: duffel_test_...
Duffel search params: { origin: 'LHR', destination: 'JFK', ... }
Duffel offer request created: orq_...
Duffel returned 50 offers
```

### Step 3: Test the API Directly
```bash
# From your terminal:
curl "http://localhost:3000/api/flights/search?origin=LHR&destination=JFK&departureDate=2025-12-15&adults=1&children=0&infantsLap=0&infantsSeat=0"
```

You should get JSON with flights array.

## 🐛 Common Issues & Solutions

### Issue 1: "No flights found" but API key is set
**Symptom**: Search completes but shows 0 results  
**Cause**: Date might be in the past or invalid airport codes  
**Solution**:
- Use future dates (e.g., 2025-12-15 or later)
- Use valid IATA codes: LHR, JFK, LAX, ORD, etc.
- Check server logs for error messages

### Issue 2: API key not loading
**Symptom**: Console shows `❌ DUFFEL_API_KEY is not set!`  
**Solution**:
```bash
# Stop the server (Ctrl+C)
# Restart it:
npm run dev
```

### Issue 3: Search never completes (loading forever)
**Symptom**: Loading spinner never stops  
**Cause**: API error or network issue  
**Solution**:
- Check browser Network tab for failed requests
- Check server logs for error messages
- Try the test script: `node test-duffel.js`

## 📝 Test Flight Search Parameters

Here are some combinations that definitely work with Duffel test API:

```
✈️  London to New York
origin=LHR
destination=JFK
departureDate=2025-12-15

✈️  Los Angeles to Tokyo
origin=LAX
destination=NRT
departureDate=2025-12-20

✈️  Paris to London
origin=CDG
destination=LHR
departureDate=2025-12-10

✈️  Dubai to Singapore
origin=DXB
destination=SIN
departureDate=2025-12-25
```

## 🔧 Quick Fixes

### If nothing is working:
```bash
# Kill all processes and clean cache
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
rm -rf .next

# Reinstall dependencies (if needed)
npm install

# Restart dev server
npm run dev
```

### Verify API key is correct:
```bash
cat .env.local | grep DUFFEL
```

Should output something like:
```
DUFFEL_API_KEY=duffel_test_[your_key_here]
```

## 📊 What Should Happen

1. **You search for a flight** in your trip's Flights tab
2. **Server logs show**: API key found, creating offer request
3. **Duffel returns** 20-50 test flights
4. **You see** a list of flights with prices, airlines, times
5. **You can click** "Book Now" to select fare class and enter passenger info

## ⚡ Test Right Now

Try this exact search in your app:
- **From**: London (LHR)
- **To**: New York (JFK)
- **Date**: December 15, 2025
- **Passengers**: 1 adult

This should return ~50 flights including British Airways, American Airlines, etc.

---

**Need More Help?**

If you're still not seeing flights, share:
1. Screenshot of browser console (F12 → Console)
2. Server terminal output after searching
3. The exact search parameters you're using
