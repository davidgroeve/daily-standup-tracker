-- Add parent_id column to roadmap_tasks
alter table public.roadmap_tasks 
add column if not exists parent_id uuid references public.roadmap_tasks(id) on delete cascade;

-- Verify columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roadmap_tasks';
