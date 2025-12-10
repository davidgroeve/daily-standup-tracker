-- Migration to enhance goals table
-- Run this in Supabase SQL Editor

ALTER TABLE goals ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS block_reason TEXT;
