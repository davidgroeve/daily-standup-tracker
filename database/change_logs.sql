-- Create change_logs table
create table if not exists change_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz default now(),
  user_email text not null,
  entity_type text not null, -- 'update', 'goal', 'leave', 'team_member'
  entity_id text,
  action text not null, -- 'create', 'update', 'delete'
  description text
);

-- Enable RLS
alter table change_logs enable row level security;

-- Policy: Allow authenticated users to read all logs
create policy "Allow authenticated users to read change logs"
on change_logs for select
to authenticated
using (true);

-- Policy: Allow authenticated users to insert logs
create policy "Allow authenticated users to insert change logs"
on change_logs for insert
to authenticated
with check (true);
