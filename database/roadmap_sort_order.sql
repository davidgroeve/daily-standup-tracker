-- Migration to add sort_order to roadmap_tasks
ALTER TABLE public.roadmap_tasks 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on current start_date order
WITH OrderedTasks AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY start_date, created_at) as row_num
    FROM public.roadmap_tasks
)
UPDATE public.roadmap_tasks
SET sort_order = OrderedTasks.row_num
FROM OrderedTasks
WHERE public.roadmap_tasks.id = OrderedTasks.id;
