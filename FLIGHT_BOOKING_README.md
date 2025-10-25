# Voyana Flight Booking System

## Overview

The Voyana flight booking system integrates with **Duffel** and **Amadeus** APIs to provide comprehensive flight search and booking capabilities. The system automatically merges and deduplicates results from both providers, offering users the best available flights at competitive prices.

## Features

✅ **Dual API Integration** - Search flights from both Duffel and Amadeus simultaneously
✅ **Smart Deduplication** - Automatically removes duplicate flights and keeps the lowest price
✅ **Real-time Search** - Parallel API queries for fast results
✅ **Booking Management** - Save confirmed bookings to Supabase
✅ **User Dashboard** - View all your flight bookings in one place
✅ **Responsive UI** - Beautiful, modern interface with Tailwind CSS

## Architecture

### API Clients

**`src/lib/api/duffelClient.ts`**
- Duffel API integration
- Search flights with offer requests
- Normalize flight data to common schema
- Handle flight bookings

**`src/lib/api/amadeusClient.ts`**
- Amadeus Self-Service API integration
- Flight offers search
- Normalize flight data to common schema
- Handle flight bookings

### Utilities

**`src/lib/utils/mergeFlights.ts`**
- Merge results from multiple APIs
- Remove duplicates based on flight details
- Keep lowest price for duplicate flights
- Filter and group flights by various criteria

### API Routes

**`src/app/api/flights/search/route.ts`**
- Accepts: origin, destination, departureDate, returnDate, passengers, cabinClass
- Queries both Duffel and Amadeus APIs in parallel
- Merges and deduplicates results
- Returns unified flight list sorted by price

**`src/app/api/flights/book/route.ts`**
- Accepts: flight object, passengers, userId
- Routes to correct API based on flight source
- Confirms booking with API
- Saves booking to Supabase

**`src/app/api/flights/bookings/route.ts`**
- Fetches all bookings for a user
- Returns bookings sorted by departure time

### Database

**`supabase-flight-bookings-schema.sql`**
- Creates `flight_bookings` table with full schema
- Row Level Security (RLS) policies
- Automatic timestamp updates
- Indexes for performance

### Components

**`src/app/flights/page.tsx`**
- Main flights page with tabs
- Search flights tab
- My bookings tab

**`src/components/flights/FlightSearch.tsx`**
- Flight search form
- Origin/destination inputs (IATA codes)
- Date pickers for departure/return
- Passenger count and cabin class selectors
- Round-trip / One-way toggle

**`src/components/flights/FlightResults.tsx`**
- Display flight search results
- Show carrier, times, duration, stops, price
- "Book Now" button for each flight
- Expandable details section
- Source badges (Duffel / Amadeus)

**`src/components/flights/MyBookings.tsx`**
- Display user's confirmed bookings
- Show booking reference
- Flight timeline with origin → destination
- Booking details and price

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @duffel/api amadeus axios date-fns
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Duffel API
DUFFEL_API_KEY=your_duffel_api_key_here

# Amadeus API
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Get API Keys

**Duffel API:**
1. Sign up at https://duffel.com
2. Navigate to Dashboard → API Keys
3. Create a new API key
4. Copy the key to `DUFFEL_API_KEY`

**Amadeus API:**
1. Sign up at https://developers.amadeus.com
2. Create a new app in the dashboard
3. Copy the Client ID and Client Secret
4. Add to `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`

Note: Both APIs offer test credentials for development.

### 4. Set Up Supabase Table

Run the SQL script in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy contents of supabase-flight-bookings-schema.sql
# Run the script
```

This will create:
- `flight_bookings` table
- Indexes for performance
- Row Level Security policies
- Automatic updated_at trigger

### 5. Test the System

1. Start the development server:
```bash
npm run dev
```

2. Sign in to your account

3. Navigate to **Flights** in the header

4. Search for flights:
   - Origin: JFK (New York)
   - Destination: LAX (Los Angeles)
   - Select dates
   - Click "Search Flights"

5. View results from both APIs merged together

6. Click "Book Now" on any flight (requires proper API credentials)

7. View your bookings in the "My Bookings" tab

## Data Flow

```
User Input (FlightSearch)
    ↓
/api/flights/search
    ↓
[Duffel API] + [Amadeus API] (parallel)
    ↓
mergeFlights() → deduplicate → sort by price
    ↓
FlightResults (display)
    ↓
User clicks "Book Now"
    ↓
/api/flights/book
    ↓
Duffel/Amadeus booking API
    ↓
Save to Supabase (itineraryService)
    ↓
Show success + refresh bookings
```

## Common Flight Search Parameters

### Airport Codes (IATA)
- **New York**: JFK, LGA, EWR
- **Los Angeles**: LAX
- **Chicago**: ORD, MDW
- **London**: LHR, LGW
- **Paris**: CDG, ORY
- **Tokyo**: NRT, HND

### Cabin Classes
- **economy** - Standard economy seating
- **premium_economy** - Extra legroom and amenities
- **business** - Business class
- **first** - First class

## API Response Schema

All flights are normalized to this common schema:

```typescript
interface NormalizedFlight {
  id: string;
  carrier: string;
  carrierLogo?: string;
  flightNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departure: string;  // ISO 8601 datetime
  arrival: string;    // ISO 8601 datetime
  duration: string;   // ISO 8601 duration (PT2H30M)
  price: number;
  currency: string;
  cabinClass: string;
  stops: number;
  apiSource: 'duffel' | 'amadeus';
  rawData: any;       // Original API response
}
```

## Troubleshooting

### No Results Found

- **Check API keys** - Ensure both APIs are configured correctly
- **Verify airport codes** - Use valid 3-letter IATA codes
- **Check date format** - Use YYYY-MM-DD format
- **API rate limits** - Free tiers may have limited requests

### Booking Fails

- **Test vs Production** - Use test credentials for development
- **Passenger data** - Ensure passenger information is complete
- **Payment** - Booking requires valid payment method in production
- **Availability** - Flight may have sold out between search and booking

### Database Errors

- **Check RLS policies** - Ensure user is authenticated
- **Verify table exists** - Run the SQL schema script
- **Check permissions** - User must have access to flight_bookings table

## Future Enhancements

- 🔄 Add Redis caching for popular routes
- 💺 Support baggage and seat selection
- 📧 Email confirmations with booking details
- 📅 Export bookings to Google Calendar / Apple Wallet
- 🏨 Integrate hotel search via Amadeus Hotel API
- 🚗 Add car rental search
- 💰 Price alerts and tracking
- 🔔 Flight status notifications

## API Documentation

- **Duffel API Docs**: https://duffel.com/docs/api
- **Amadeus API Docs**: https://developers.amadeus.com/self-service

## Support

For issues or questions:
1. Check API documentation
2. Review error logs in browser console
3. Verify environment variables are set
4. Ensure Supabase table is created properly

## License

This flight booking system is part of the Voyana travel planning application.
