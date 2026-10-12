-- ============================================================
--  Amhara Jobs Portal — Initial Super Admin Seed
--  Run AFTER schema.sql
--
--  Default credentials:
--    Email    : admin@amharajobs.gov.et
--    Password : Admin@1234
--
--  The must_change_pw flag forces a password change on first login.
-- ============================================================

USE amhara_jobs_portal;

-- Remove any previous bad insert first
DELETE FROM users WHERE email = 'admin@amharajobs.gov.et';

INSERT INTO users
  (full_name, email, password_hash, role, is_active, must_change_pw)
VALUES
  (
    'System Administrator',
    'admin@amharajobs.gov.et',
    '$2a$12$JZbaH1q71MMls0KiKNexeOHGaiWnwdgQMhTt2xAS3RNFI0qYojR3.',
    'super_admin',
    1,
    1
  );

SELECT CONCAT(
  'Super admin ready. ',
  'Email: admin@amharajobs.gov.et | ',
  'Password: Admin@1234'
) AS setup_message;
