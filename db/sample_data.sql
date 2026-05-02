-- Password for all sample users: Password@123
-- BCrypt hash generated for Spring Security

INSERT INTO users (id, name, email, password, role, created_at) VALUES
(1, 'Priya Sharma', 'priya.pm@ethara.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'PROJECT_MANAGER', CURRENT_TIMESTAMP),
(2, 'Aarav Singh', 'aarav.lead@ethara.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TEAM_LEAD', CURRENT_TIMESTAMP),
(3, 'Diya Patel', 'diya.employee@ethara.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLOYEE', CURRENT_TIMESTAMP),
(4, 'Karan Nair', 'karan.employee@ethara.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLOYEE', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, due_date, owner_id, created_at) VALUES
(1, 'Website Revamp', 'Redesign the public website and improve team task tracking.', CURRENT_DATE + INTERVAL '20 days', 1, CURRENT_TIMESTAMP),
(2, 'Mobile Launch Prep', 'Prepare launch assets, testing, and release tasks for mobile rollout.', CURRENT_DATE + INTERVAL '12 days', 1, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, created_at) VALUES
(1, 1, 1, CURRENT_TIMESTAMP),
(2, 1, 2, CURRENT_TIMESTAMP),
(3, 1, 3, CURRENT_TIMESTAMP),
(4, 1, 4, CURRENT_TIMESTAMP),
(5, 2, 1, CURRENT_TIMESTAMP),
(6, 2, 2, CURRENT_TIMESTAMP),
(7, 2, 4, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, due_date, project_id, parent_task_id, assignee_id, created_by_id, created_at, updated_at) VALUES
(1, 'Create landing page wireframes', 'PM assigned the landing page workstream to the team lead for task breakdown and delivery tracking.', 'IN_PROGRESS', CURRENT_DATE + INTERVAL '4 days', 1, NULL, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Homepage layout chunk', 'Build the responsive homepage structure from the approved wireframes.', 'DONE', CURRENT_DATE + INTERVAL '2 days', 1, 1, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Accessibility review chunk', 'Run accessibility checks and document fixes before sign-off.', 'IN_PROGRESS', CURRENT_DATE + INTERVAL '3 days', 1, 1, 4, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Implement auth screens', 'PM assigned the authentication feature to the team lead for sprint execution.', 'TODO', CURRENT_DATE + INTERVAL '5 days', 2, NULL, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Login screen UI chunk', 'Build login and signup UI for the mobile release.', 'TODO', CURRENT_DATE + INTERVAL '4 days', 2, 4, 4, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Prepare release checklist', 'Document launch checklist and QA sign-off items.', 'DONE', CURRENT_DATE - INTERVAL '1 day', 2, NULL, 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_comments (id, task_id, author_id, content, created_at) VALUES
(1, 1, 2, 'I split the landing page work into implementation and accessibility chunks for the team.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 2, 3, 'Homepage layout is complete and ready for review.', CURRENT_TIMESTAMP - INTERVAL '90 minutes'),
(3, 3, 4, 'Accessibility fixes are in progress and I will update again after testing.', CURRENT_TIMESTAMP - INTERVAL '50 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_messages (id, project_id, sender_id, content, created_at) VALUES
(1, 1, 1, 'Please keep this sprint focused on login flow and homepage structure.', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(2, 1, 2, 'Understood. I will split UI, review, and testing work for the team today.', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(3, 1, 4, 'I can take the accessibility pass after wireframes are approved.', CURRENT_TIMESTAMP - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO direct_messages (id, project_id, sender_id, recipient_id, content, created_at) VALUES
(1, 1, 1, 2, 'Please break the landing page assignment into chunks for the team today.', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
(2, 1, 2, 1, 'Done. I created child tasks so the board will roll up progress automatically.', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
(3, 2, 2, 4, 'Can you take the login screen UI chunk once I finish the main auth plan?', CURRENT_TIMESTAMP - INTERVAL '80 minutes')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true);
SELECT setval('projects_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM projects), 1), true);
SELECT setval('project_members_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM project_members), 1), true);
SELECT setval('tasks_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM tasks), 1), true);
SELECT setval('task_comments_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM task_comments), 1), true);
SELECT setval('project_messages_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM project_messages), 1), true);
SELECT setval('direct_messages_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM direct_messages), 1), true);
