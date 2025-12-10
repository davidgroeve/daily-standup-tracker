-- Migration to enhance updates table for structured items
-- Run this in Supabase SQL Editor

ALTER TABLE updates ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
