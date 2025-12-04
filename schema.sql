-- Supabase SQL Schema for Daily Standup Tracker
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updates Table
CREATE TABLE IF NOT EXISTS updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner TEXT DEFAULT '',
  status TEXT DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'blocked')),
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_updates_member_id ON updates(member_id);
CREATE INDEX IF NOT EXISTS idx_updates_date ON updates(date);
CREATE INDEX IF NOT EXISTS idx_goals_week_start ON goals(week_start);

-- Enable Row Level Security (RLS) - Optional, for public access disable these
-- For now, we'll allow public access for simplicity
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anon key can read/write)
CREATE POLICY "Allow public access to team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to updates" ON updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to goals" ON goals FOR ALL USING (true) WITH CHECK (true);
