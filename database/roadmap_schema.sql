-- Create roadmap_tasks table
create table if not exists public.roadmap_tasks (
    id uuid default gen_random_uuid() primary key,
    parent_id uuid references public.roadmap_tasks(id) on delete cascade,
    title text not null,
    start_date date not null,
    end_date date not null,
    assigned_to text,
    progress integer default 0,
    created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.roadmap_tasks enable row level security;

-- Create policy to allow all authenticated users to read/write (matching existing app pattern)
create policy "Allow all authenticated" on public.roadmap_tasks
    for all using (auth.role() = 'authenticated');

-- Grant access to service role and anon for dev purposes (if needed)
grant all on public.roadmap_tasks to authenticated;
grant all on public.roadmap_tasks to service_role;
