-- Supabase Database Schema for Voyana

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_photo TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own trips
CREATE POLICY "Users can view their own trips"
  ON trips
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Create policy: Users can insert their own trips
CREATE POLICY "Users can insert their own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Users can update their own trips
CREATE POLICY "Users can update their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Users can delete their own trips
CREATE POLICY "Users can delete their own trips"
  ON trips
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for trip summaries (without full day data)
CREATE OR REPLACE VIEW trip_summaries AS
SELECT 
  id,
  user_id,
  name,
  destination,
  destination_photo,
  start_date,
  end_date,
  jsonb_array_length(days) as day_count,
  created_at,
  updated_at
FROM trips;

-- Grant access to the view
GRANT SELECT ON trip_summaries TO authenticated;
