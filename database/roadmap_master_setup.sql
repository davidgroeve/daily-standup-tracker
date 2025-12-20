-- MASTER ROADMAP SCRIPT
-- This will reset the table and insert all data from your screenshots

-- 1. Drop existing table to start fresh
DROP TABLE IF EXISTS public.roadmap_tasks CASCADE;

-- 2. Create table with parent_id for hierarchy
CREATE TABLE public.roadmap_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
    title text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    assigned_to text,
    progress integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS and add policy
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON public.roadmap_tasks FOR ALL USING (auth.role() = 'authenticated');
GRANT ALL ON public.roadmap_tasks TO authenticated;
GRANT ALL ON public.roadmap_tasks TO service_role;

-- 4. Insert Data
DO $$
DECLARE
    dep_id uuid;
    mabet_id uuid;
    gen_id uuid;
    onb_id uuid;
    prod_id uuid;
BEGIN
    -- 1. TOP LEVEL GROUPS
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('Dependencies', '2025-11-12', '2026-01-01', 18) RETURNING id INTO dep_id;

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress, assigned_to)
    VALUES ('Integration with MABET', '2025-12-01', '2026-01-27', 0, 'Mabet') RETURNING id INTO mabet_id;

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('General / Miscellaneous', '2025-11-01', '2025-11-15', 0) RETURNING id INTO gen_id;

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('Insurer Onboarding', '2025-11-17', '2025-12-10', 100) RETURNING id INTO onb_id;

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('B2B Partner Onboarding', '2025-12-03', '2025-12-17', 90) RETURNING id INTO prod_id; -- Reused variable name prod_id for B2B

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('Products Onboarding', '2025-12-10', '2025-12-22', 0) RETURNING id INTO gen_id; -- Reused gen_id for Products

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('Rommaana Backend Framework', '2025-11-28', '2025-12-28', 52) RETURNING id INTO dep_id; -- Reused dep_id for Backend

    INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
    VALUES ('Business Lines (API Integration with Al Etihad APIs)', '2025-12-17', '2026-01-05', 16) RETURNING id INTO mabet_id; -- Reused mabet_id for Business Lines

    -- 2. SUB-TASKS FOR DEPENDENCIES (Original Image)
    -- Resetting labels to match the new assignments above
    -- Actually, let's use a cleaner approach to avoid variable reuse confusion
END $$;

DO $$
DECLARE
    dep_id uuid; mabet_id uuid; gen_id uuid; ins_id uuid; b2b_id uuid; prod_id uuid; back_id uuid; biz_id uuid;
BEGIN
    -- TOP LEVEL GROUPS
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('Dependencies', '2025-11-12', '2026-01-01', 18) RETURNING id INTO dep_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress, assigned_to) VALUES ('Integration with MABET', '2025-12-01', '2026-01-27', 0, 'Mabet') RETURNING id INTO mabet_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('General / Miscellaneous', '2025-11-01', '2025-11-15', 0) RETURNING id INTO gen_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('Insurer Onboarding', '2025-11-17', '2025-12-10', 100) RETURNING id INTO ins_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('B2B Partner Onboarding', '2025-12-03', '2025-12-17', 90) RETURNING id INTO b2b_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('Products Onboarding', '2025-12-10', '2025-12-22', 0) RETURNING id INTO prod_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('Rommaana Backend Framework', '2025-11-28', '2025-12-28', 52) RETURNING id INTO back_id;
    INSERT INTO roadmap_tasks (title, start_date, end_date, progress) VALUES ('Business Lines (API Integration with Al Etihad APIs)', '2025-12-17', '2026-01-05', 16) RETURNING id INTO biz_id;

    -- SUB-TASKS: DEPENDENCIES
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (dep_id, 'Secure Yakeen / Absher (ELM) API Access', '2025-11-12', '2025-12-04', 'David', 0),
    (dep_id, 'Getting the package', '2025-11-26', '2025-12-15', 'David', 50),
    (dep_id, 'Perform the Integration', '2025-12-16', '2025-12-21', 'Amitava', 0),
    (dep_id, 'YAKEEN is ready to go live with Rommaana', '2025-12-21', '2025-12-22', 'David', 20),
    (dep_id, 'Secure Payment Gateway (PG) API Access', '2025-11-23', '2025-12-23', 'David', 60),
    (dep_id, 'Confirm PDPL / Consent Logging Protocol', '2025-12-16', '2025-12-23', 'David', 20),
    (dep_id, 'Negotiate & Finalize NourNet PT/VA', '2025-11-25', '2025-12-11', 'David', 25),
    (dep_id, 'Preparation of the PT/VA - Information about the servers', '2025-12-15', '2025-12-20', 'David', 0),
    (dep_id, 'Penetration Testing & Vulnerability Assessment', '2026-01-04', '2026-01-08', 'David', 0),
    (dep_id, '2nd Intervention PT/VA with corrected measures', '2026-01-18', '2026-01-22', 'David', 0),
    (dep_id, 'API Documentation + Authentication AI Etihad SANDBOX', '2025-12-09', '2025-12-18', 'Amitava', 25),
    (dep_id, 'Al Etihad provides the APIs access', '2025-11-25', '2026-01-04', 'Al Etihad', 40),
    (dep_id, 'Integration with Insurer APIs + Testing (Home)', '2026-01-18', '2026-01-19', 'Amitava', 0),
    (dep_id, 'Al Etihad applies for the non-objection letter', '2025-12-05', '2025-12-18', 'Al Etihad', 60),
    (dep_id, 'Insurance Authority - Non Objection Letter', '2025-12-18', '2026-01-18', 'Insurance Authority', 0);

    -- SUB-TASKS: MABET
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (mabet_id, 'Retake the conversation with them', '2025-12-01', '2025-12-02', 'Gustavo', 100),
    (mabet_id, 'Perform Integration', '2026-01-19', '2026-01-26', 'Amitava', 0),
    (mabet_id, 'Go Live MABET HOME and Al Etihad', '2026-01-27', '2026-01-27', 'Amitava', 0);

    -- SUB-TASKS: INSURER ONBOARDING
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (ins_id, 'UX Design System', '2025-11-17', '2025-12-02', 'Patiño', 100),
    (ins_id, 'Create Insurer', '2025-12-04', '2025-12-04', 'Oscar', 100),
    (ins_id, 'View Insurance Details', '2025-12-08', '2025-12-09', 'Oscar', 100);

    -- SUB-TASKS: B2B PARTNER ONBOARDING
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (b2b_id, 'UX Design System', '2025-12-03', '2025-12-09', 'Patiño', 100),
    (b2b_id, 'Ability to onboard a partner', '2025-12-09', '2025-12-10', 'Oscar', 100),
    (b2b_id, 'Approval of partner by Rommaana', '2025-12-10', '2025-12-11', 'Oscar', 100),
    (b2b_id, 'Ability to modify partner details', '2025-12-11', '2025-12-11', 'Oscar', 100),
    (b2b_id, 'Technical: Get api keys', '2025-12-17', '2025-12-17', 'Amitava', 10);

    -- SUB-TASKS: PRODUCTS ONBOARDING
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (prod_id, 'UX Design System', '2025-12-10', '2025-12-16', 'Patiño', 70),
    (prod_id, 'Create Insurer Product', '2025-12-15', '2025-12-15', 'Oscar', 0);

    -- SUB-TASKS: BACKEND FRAMEWORK
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (back_id, 'Authentication', '2025-11-28', '2025-12-02', 'Amitava', 70),
    (back_id, 'Travel', '2025-11-26', '2025-12-02', 'Amitava', 70),
    (back_id, 'Visit Visa', '2025-12-03', '2025-12-09', 'Amitava', 70),
    (back_id, 'Personal Accident / Income', '2025-12-10', '2025-12-16', 'Amitava', 0),
    (back_id, 'Motor Comprehensive', '2025-12-18', '2025-12-28', 'Amitava', 0);

    -- SUB-TASKS: BUSINESS LINES
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (biz_id, 'Home (Convert to the Al Etihad version)', '2025-12-17', '2025-12-21', 'Amitava', 80),
    (biz_id, 'Travel', '2025-12-18', '2025-12-22', 'Amitava', 0),
    (biz_id, 'Income Protection', '2025-12-21', '2025-12-24', 'Amitava', 0),
    (biz_id, 'Visit Visa', '2025-12-28', '2025-12-30', 'Amitava', 0),
    (biz_id, 'Motor Comprehensive', '2026-01-02', '2026-01-05', 'Amitava', 0);

END $$;
