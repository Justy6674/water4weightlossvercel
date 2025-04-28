-- Create water_tracker table
CREATE TABLE IF NOT EXISTS water_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_logs JSONB NOT NULL DEFAULT '{}'::jsonb,
  streak INTEGER NOT NULL DEFAULT 0,
  completed_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS water_tracker_user_id_idx ON water_tracker(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_water_tracker_updated_at
  BEFORE UPDATE ON water_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE water_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water tracker data"
  ON water_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water tracker data"
  ON water_tracker FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water tracker data"
  ON water_tracker FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water tracker data"
  ON water_tracker FOR DELETE
  USING (auth.uid() = user_id); 