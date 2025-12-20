-- First, ensure the parent tasks exist and get their IDs
-- We'll use a temporary script approach to match titles

DO $$
DECLARE
    dep_id uuid;
    mabet_id uuid;
BEGIN
    -- 1. Find or create the main groups
    SELECT id INTO dep_id FROM roadmap_tasks WHERE title = 'Dependencies' LIMIT 1;
    IF dep_id IS NULL THEN
        INSERT INTO roadmap_tasks (title, start_date, end_date, progress)
        VALUES ('Dependencies', '2025-11-12', '2026-01-01', 18)
        RETURNING id INTO dep_id;
    END IF;

    SELECT id INTO mabet_id FROM roadmap_tasks WHERE title = 'Integration with MABET' LIMIT 1;
    IF mabet_id IS NULL THEN
        INSERT INTO roadmap_tasks (title, start_date, end_date, progress, assigned_to)
        VALUES ('Integration with MABET', '2025-12-01', '2026-01-27', 0, 'Mabet')
        RETURNING id INTO mabet_id;
    END IF;

    -- 2. Insert sub-tasks for Dependencies
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

    -- 3. Insert sub-tasks for MABET
    INSERT INTO roadmap_tasks (parent_id, title, start_date, end_date, assigned_to, progress) VALUES
    (mabet_id, 'Retake the conversation with them', '2025-12-01', '2025-12-02', 'Gustavo', 100),
    (mabet_id, 'Perform Integration', '2026-01-19', '2026-01-26', 'Amitava', 0),
    (mabet_id, 'Go Live MABET HOME and Al Etihad', '2026-01-27', '2026-01-27', 'Amitava', 0);

END $$;
