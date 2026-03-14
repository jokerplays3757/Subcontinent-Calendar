
-- Create festivals table
CREATE TABLE public.festivals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    gregorian_date DATE NOT NULL,
    region TEXT,
    religion TEXT,
    is_national_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Festivals are viewable by everyone"
ON public.festivals FOR SELECT USING (true);

-- Create user_events table
CREATE TABLE public.user_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    color TEXT DEFAULT '#F97316',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
ON public.user_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.user_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.user_events FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_events_updated_at
BEFORE UPDATE ON public.user_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
