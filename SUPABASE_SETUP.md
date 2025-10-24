# Supabase Integration - Next Steps

## ✅ Completed

1. **Installed Supabase packages**
   - `@supabase/supabase-js`
   - `@supabase/ssr`

2. **Created Supabase client utilities**
   - `src/lib/supabase/client.ts` - For client-side usage
   - `src/lib/supabase/server.ts` - For server-side usage (API routes)
   - `src/lib/supabase/database.types.ts` - TypeScript types

3. **Created database schema**
   - `supabase/schema.sql` - SQL migration for trips table

4. **Created API routes**
   - `GET /api/trips` - Fetch all user trips
   - `POST /api/trips` - Create a new trip
   - `GET /api/trips/[id]` - Fetch single trip
   - `PATCH /api/trips/[id]` - Update trip
   - `DELETE /api/trips/[id]` - Delete trip

5. **Created API utility**
   - `src/lib/api/trips.ts` - Helper functions for API calls

---

## 🚀 What You Need To Do

### Step 1: Set Up Supabase Project (5-10 minutes)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project called "voyana"
3. Save your database password securely
4. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key

### Step 2: Add Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Existing variables (copy from your current .env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
GOOGLE_PLACES_API_KEY=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
UNSPLASH_ACCESS_KEY=...
```

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy contents from `supabase/schema.sql`
4. Paste and click **Run**
5. You should see success messages

### Step 4: Update RLS Policies (Important!)

Since we're using Clerk authentication (not Supabase Auth), run this SQL:

```sql
-- Disable default policies
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

-- Allow all authenticated requests (we validate user_id in API routes)
CREATE POLICY "Enable all for authenticated users" ON trips
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 📝 Next: Update Your App Code

You need to update these files to use Supabase instead of localStorage:

### Files to Update:

1. **`src/app/itinerary/page.tsx`** - Dashboard page
   - Replace localStorage with API calls
   - Use `tripsApi.getAll()`, `tripsApi.create()`, `tripsApi.delete()`

2. **`src/app/itinerary/[id]/page.tsx`** - Trip detail page
   - Replace localStorage with API calls  
   - Use `tripsApi.getById()`, `tripsApi.update()`

### Example Changes:

**Before (localStorage):**
```typescript
const savedTrips = localStorage.getItem(`voyana_trips_${user.id}`)
const trips = savedTrips ? JSON.parse(savedTrips) : []
```

**After (Supabase):**
```typescript
import { tripsApi } from '@/lib/api/trips'

const trips = await tripsApi.getAll()
```

---

## 🔄 Optional: Migrate Existing Data

Want to keep trips users already created in localStorage? Create a migration utility:

```typescript
// src/lib/migrations/localStorage-to-supabase.ts
export async function migrateLocalStorageToSupabase(userId: string) {
  const localTrips = localStorage.getItem(`voyana_trips_${userId}`)
  if (!localTrips) return
  
  const trips = JSON.parse(localTrips)
  
  // Upload each trip to Supabase
  for (const trip of trips) {
    try {
      await tripsApi.create(trip)
    } catch (error) {
      console.error('Migration error:', error)
    }
  }
  
  // Clear localStorage after successful migration
  localStorage.removeItem(`voyana_trips_${userId}`)
}
```

---

## 🎯 Testing Checklist

After integration:

- [ ] Create a new trip → Check Supabase dashboard
- [ ] Edit trip details → Verify updates in database
- [ ] Delete a trip → Confirm deletion in database
- [ ] Log out and log in → Data persists
- [ ] Open in different browser → Same data appears
- [ ] Check API routes return correct user's trips only

---

## 📚 Documentation

- Full setup guide: `supabase/README.md`
- Database schema: `supabase/schema.sql`
- API reference: `src/lib/api/trips.ts`

---

## ⚡ Benefits After Integration

✅ **Cloud storage** - No data loss if browser cache cleared
✅ **Cross-device sync** - Access trips from phone, tablet, desktop
✅ **Better performance** - Indexed queries, optimized storage
✅ **Scalability** - Handle thousands of trips
✅ **Backup & recovery** - Automatic backups
✅ **Analytics ready** - Query trip data for insights
✅ **Future features** - Real-time collaboration, sharing trips

---

Need help? Check the detailed setup guide in `supabase/README.md`!
