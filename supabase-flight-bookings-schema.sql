-- Create flight_bookings table in Supabase
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.flight_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  carrier TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  origin_name TEXT,
  destination TEXT NOT NULL,
  destination_name TEXT,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  cabin_class TEXT,
  stops INTEGER DEFAULT 0,
  duration TEXT,
  source TEXT NOT NULL CHECK (source IN ('duffel', 'amadeus')),
  booking_reference TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_flight_bookings_user_id ON public.flight_bookings(user_id);

-- Create index on departure_time for sorting
CREATE INDEX IF NOT EXISTS idx_flight_bookings_departure_time ON public.flight_bookings(departure_time);

-- Enable Row Level Security
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.flight_bookings
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Create policy: Users can insert their own bookings
CREATE POLICY "Users can insert their own bookings"
  ON public.flight_bookings
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON public.flight_bookings
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Create policy: Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
  ON public.flight_bookings
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_flight_bookings_updated_at
  BEFORE UPDATE ON public.flight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant access to authenticated users
GRANT ALL ON public.flight_bookings TO authenticated;
GRANT ALL ON public.flight_bookings TO service_role;
