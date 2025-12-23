-- Create roadmap_markers table
CREATE TABLE IF NOT EXISTS public.roadmap_markers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    label text NOT NULL,
    date date NOT NULL,
    color_type text DEFAULT 'default', -- 'default' or 'success'
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roadmap_markers ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all authenticated" ON public.roadmap_markers FOR ALL USING (auth.role() = 'authenticated');

-- Grant access
GRANT ALL ON public.roadmap_markers TO authenticated;
GRANT ALL ON public.roadmap_markers TO service_role;

-- Insert initial markers
INSERT INTO public.roadmap_markers (label, date, color_type)
VALUES 
('1st Review to Go2Market', '2025-12-22', 'default'),
('Go2Market', '2026-01-15', 'success')
ON CONFLICT DO NOTHING;
