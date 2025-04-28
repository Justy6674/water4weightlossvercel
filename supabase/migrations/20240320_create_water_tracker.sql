-- Create water_tracker table
CREATE TABLE IF NOT EXISTS public.water_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_amount INTEGER NOT NULL CHECK (intake_amount >= 0),
    intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_date UNIQUE (user_id, intake_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS water_tracker_user_id_idx ON public.water_tracker(user_id);
CREATE INDEX IF NOT EXISTS water_tracker_intake_date_idx ON public.water_tracker(intake_date);
CREATE INDEX IF NOT EXISTS water_tracker_user_date_idx ON public.water_tracker(user_id, intake_date);

-- Add RLS policies
ALTER TABLE public.water_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water tracking data"
    ON public.water_tracker
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water tracking data"
    ON public.water_tracker
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water tracking data"
    ON public.water_tracker
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_water_tracker_updated_at
    BEFORE UPDATE ON public.water_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 