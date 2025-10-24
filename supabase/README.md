# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose an organization and enter:
   - Project name: `voyana`
   - Database password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"

## 2. Get Your API Keys

1. Go to Project Settings > API
2. Copy these values to your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `anon` `public` key

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the contents of `supabase/schema.sql`
4. Paste and click "Run"

This will create:
- `trips` table with all necessary columns
- Row Level Security (RLS) policies to ensure users only see their own data
- Indexes for performance
- Auto-updating `updated_at` timestamp

## 4. Configure Authentication (Optional)

Since you're using Clerk for authentication, you need to sync user IDs:

### Option A: Use Clerk User IDs (Recommended)
- Your current implementation stores trips with Clerk user IDs
- In the database, `user_id` will be the Clerk user ID
- RLS policies will need to be adjusted to use Clerk IDs instead of Supabase auth

### Option B: Sync Clerk with Supabase Auth
- Set up Clerk webhooks to create Supabase auth users
- More complex but allows using Supabase RLS with `auth.uid()`

**For now, we'll use Option A** (Clerk user IDs directly)

## 5. Update Environment Variables

Create or update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret

# Other APIs (existing)
GOOGLE_PLACES_API_KEY=your-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-token
UNSPLASH_ACCESS_KEY=your-key
```

## 6. Modify RLS Policies for Clerk

Since we're using Clerk user IDs, update the RLS policies in Supabase SQL Editor:

```sql
-- Disable existing policies
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

-- Create new policies that allow authenticated requests
-- (We'll validate user_id in API routes instead)
CREATE POLICY "Enable read access for authenticated users"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON trips FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON trips FOR DELETE
  TO authenticated
  USING (true);
```

**Note**: We validate user_id in our API routes using Clerk's authentication.

## 7. Test Your Setup

After completing the setup:
1. Restart your Next.js dev server: `npm run dev`
2. Create a new trip
3. Check your Supabase dashboard > Table Editor > trips
4. You should see your trip data!

## Database Schema

```
trips
├── id (text, primary key)
├── user_id (text, indexed)
├── name (text)
├── destination (text)
├── destination_photo (text)
├── start_date (text)
├── end_date (text)
├── days (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

## Benefits

✅ Cloud-based storage (no data loss on browser clear)
✅ Cross-device sync
✅ Automatic backups
✅ Scalable infrastructure
✅ Real-time subscriptions (future feature)
✅ Better data management and analytics
