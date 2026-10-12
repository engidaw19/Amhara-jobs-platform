-- ============================================================
--  Amhara Regional Jobs & Skills Portal — Database Schema
--  Engine: MySQL 8.0+  |  Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS amhara_jobs_portal
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE amhara_jobs_portal;

-- ── Roles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          TINYINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)       NOT NULL,
  label_en    VARCHAR(100)      NOT NULL,
  label_am    VARCHAR(100)      NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (name, label_en, label_am) VALUES
  ('super_admin',    'Super Administrator',  'ሱፐር አስተዳዳሪ'),
  ('regional_admin', 'Regional Administrator','ክልላዊ አስተዳዳሪ'),
  ('bureau_admin',   'Bureau Administrator', 'ቢሮ አስተዳዳሪ'),
  ('bureau_staff',   'Bureau Staff',         'የቢሮ ሠራተኛ'),
  ('employer',       'Employer',             'ቀጣሪ'),
  ('job_seeker',     'Job Seeker',           'ሥራ ፈላጊ');

-- ── Zones ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_en    VARCHAR(150)      NOT NULL,
  name_am    VARCHAR(150)      NOT NULL,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_name_en (name_en)
) ENGINE=InnoDB;

INSERT IGNORE INTO zones (name_en, name_am) VALUES
  ('North Gondar',       'ሰሜን ጎንደር'),
  ('Central Gondar',     'መካከለኛ ጎንደር'),
  ('West Gondar',        'ምዕራብ ጎንደር'),
  ('South Gondar',       'ደቡብ ጎንደር'),
  ('North Wollo',        'ሰሜን ወሎ'),
  ('South Wollo',        'ደቡብ ወሎ'),
  ('North Shewa',        'ሰሜን ሸዋ'),
  ('Oromia (Amhara)',    'ኦሮሚያ (አማራ)'),
  ('Awi',                'አዊ'),
  ('East Gojjam',        'ምሥራቅ ጎጃም'),
  ('West Gojjam',        'ምዕራብ ጎጃም'),
  ('Wag Himra',          'ዋግ ህምራ'),
  ('Bahir Dar Special',  'ባህር ዳር ልዩ');

-- ── Woredas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS woredas (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zone_id    SMALLINT UNSIGNED NOT NULL,
  name_en    VARCHAR(150)      NOT NULL,
  name_am    VARCHAR(150)      NOT NULL,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_woredas_zone (zone_id),
  CONSTRAINT fk_woredas_zone FOREIGN KEY (zone_id) REFERENCES zones (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Cities / Towns ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  woreda_id  SMALLINT UNSIGNED NULL,
  zone_id    SMALLINT UNSIGNED NOT NULL,
  name_en    VARCHAR(150)      NOT NULL,
  name_am    VARCHAR(150)      NOT NULL,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_cities_woreda (woreda_id),
  KEY idx_cities_zone   (zone_id),
  CONSTRAINT fk_cities_woreda FOREIGN KEY (woreda_id) REFERENCES woredas (id) ON DELETE SET NULL,
  CONSTRAINT fk_cities_zone   FOREIGN KEY (zone_id)   REFERENCES zones   (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Bureaus ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bureaus (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_en     VARCHAR(200)      NOT NULL,
  name_am     VARCHAR(200)      NOT NULL,
  short_code  VARCHAR(20)       NULL,
  description TEXT              NULL,
  logo_url    VARCHAR(255)      NULL,
  website     VARCHAR(255)      NULL,
  email       VARCHAR(150)      NULL,
  phone       VARCHAR(30)       NULL,
  address     VARCHAR(255)      NULL,
  is_active   TINYINT(1)        NOT NULL DEFAULT 1,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bureaus_name_en (name_en)
) ENGINE=InnoDB;

INSERT IGNORE INTO bureaus (name_en, name_am, short_code) VALUES
  ('Amhara Regional Jobs & Skills Bureau', 'የአማራ ክልል ሥራና ክህሎት ቢሮ', 'ARJSB'),
  ('Bureau of Finance & Economic Development', 'የፋይናንስና ኢኮኖሚ ልማት ቢሮ', 'BOFED'),
  ('Bureau of Education', 'የትምህርት ቢሮ', 'BOE'),
  ('Bureau of Health', 'የጤና ቢሮ', 'BOH'),
  ('Bureau of Agriculture', 'የግብርና ቢሮ', 'BOA'),
  ('Bureau of Water, Irrigation & Energy', 'የውሃ፤ መስኖ እና ኢነርጂ ቢሮ', 'BOWIE'),
  ('Bureau of Trade & Industry', 'የንግድና ኢንደስትሪ ቢሮ', 'BOTI'),
  ('Bureau of Urban Development', 'የከተማ ልማት ቢሮ', 'BOUD'),
  ('Bureau of Roads & Transport', 'የመንገድና ትራንስፖርት ቢሮ', 'BORT'),
  ('Bureau of Women & Social Affairs', 'የሴቶችና ማህበራዊ ጉዳይ ቢሮ', 'BOWSA');

-- ── Departments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bureau_id  SMALLINT UNSIGNED NOT NULL,
  name_en    VARCHAR(200)      NOT NULL,
  name_am    VARCHAR(200)      NOT NULL,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_departments_bureau (bureau_id),
  CONSTRAINT fk_departments_bureau FOREIGN KEY (bureau_id) REFERENCES bureaus (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(200)      NOT NULL,
  email         VARCHAR(200)      NOT NULL,
  password_hash VARCHAR(255)      NOT NULL,
  phone         VARCHAR(30)       NULL,
  role          ENUM('super_admin','regional_admin','bureau_admin','bureau_staff','employer','job_seeker')
                                  NOT NULL DEFAULT 'job_seeker',
  bureau_id     SMALLINT UNSIGNED NULL,          -- set for bureau_admin / bureau_staff
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  must_change_pw TINYINT(1)       NOT NULL DEFAULT 0,
  last_login    TIMESTAMP         NULL,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role      (role),
  KEY idx_users_bureau    (bureau_id),
  CONSTRAINT fk_users_bureau FOREIGN KEY (bureau_id) REFERENCES bureaus (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Job Seeker Profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS seeker_profiles (
  id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED   NOT NULL,
  headline     VARCHAR(255)      NULL,
  summary      TEXT              NULL,
  date_of_birth DATE             NULL,
  gender       ENUM('male','female','other') NULL,
  city_id      SMALLINT UNSIGNED NULL,
  address      VARCHAR(255)      NULL,
  photo_url    VARCHAR(255)      NULL,
  cv_url       VARCHAR(255)      NULL,
  linkedin_url VARCHAR(255)      NULL,
  created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_seeker_user (user_id),
  CONSTRAINT fk_seeker_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Education ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS education (
  id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED   NOT NULL,
  institution  VARCHAR(255)      NOT NULL,
  degree       VARCHAR(100)      NULL,
  field        VARCHAR(150)      NULL,
  start_year   SMALLINT          NULL,
  end_year     SMALLINT          NULL,
  is_current   TINYINT(1)        NOT NULL DEFAULT 0,
  description  TEXT              NULL,
  created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_edu_user (user_id),
  CONSTRAINT fk_edu_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Work Experience ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_experience (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED   NOT NULL,
  title       VARCHAR(200)      NOT NULL,
  company     VARCHAR(200)      NULL,
  location    VARCHAR(150)      NULL,
  start_date  DATE              NULL,
  end_date    DATE              NULL,
  is_current  TINYINT(1)        NOT NULL DEFAULT 0,
  description TEXT              NULL,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_user (user_id),
  CONSTRAINT fk_work_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Skills ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_en    VARCHAR(100)      NOT NULL,
  name_am    VARCHAR(100)      NOT NULL DEFAULT '',
  category   VARCHAR(100)      NULL,
  is_active  TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_name (name_en)
) ENGINE=InnoDB;

-- ── User Skills (many-to-many) ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_skills (
  user_id   BIGINT UNSIGNED   NOT NULL,
  skill_id  SMALLINT UNSIGNED NOT NULL,
  level     ENUM('beginner','intermediate','advanced','expert') NULL,
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_uskill_user  FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE CASCADE,
  CONSTRAINT fk_uskill_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Organizations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  owner_id    BIGINT UNSIGNED   NOT NULL,           -- employer user
  bureau_id   SMALLINT UNSIGNED NULL,
  name        VARCHAR(200)      NOT NULL,
  description TEXT              NULL,
  industry    VARCHAR(100)      NULL,
  website     VARCHAR(255)      NULL,
  email       VARCHAR(150)      NULL,
  phone       VARCHAR(30)       NULL,
  logo_url    VARCHAR(255)      NULL,
  zone_id     SMALLINT UNSIGNED NULL,
  woreda_id   SMALLINT UNSIGNED NULL,
  city_id     SMALLINT UNSIGNED NULL,
  is_verified TINYINT(1)        NOT NULL DEFAULT 0,
  is_active   TINYINT(1)        NOT NULL DEFAULT 1,
  created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_org_owner  (owner_id),
  KEY idx_org_bureau (bureau_id),
  KEY idx_org_zone   (zone_id),
  CONSTRAINT fk_org_owner  FOREIGN KEY (owner_id)  REFERENCES users   (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_bureau FOREIGN KEY (bureau_id) REFERENCES bureaus (id) ON DELETE SET NULL,
  CONSTRAINT fk_org_zone   FOREIGN KEY (zone_id)   REFERENCES zones   (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Job Categories ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_categories (
  id        SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_en   VARCHAR(100)      NOT NULL,
  name_am   VARCHAR(100)      NOT NULL DEFAULT '',
  icon      VARCHAR(10)       NULL,
  is_active TINYINT(1)        NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_jobcat_name (name_en)
) ENGINE=InnoDB;

INSERT IGNORE INTO job_categories (name_en, name_am, icon) VALUES
  ('Accounting & Finance',     'ሒሳብ እና ፋይናንስ',     '💰'),
  ('Agriculture',              'ግብርና',               '🌾'),
  ('Construction & Engineering','ግንባታ እና ምህንድስና',  '🏗️'),
  ('Education & Teaching',     'ትምህርት',             '📚'),
  ('Health & Medicine',        'ጤና እና ህክምና',         '🏥'),
  ('ICT & Technology',         'ቴክኖሎጂ',             '💻'),
  ('Legal & Compliance',       'ህግ',                '⚖️'),
  ('Management & Leadership',  'አመራር',              '🏢'),
  ('NGO & Social Services',    'ማህበራዊ አገልግሎት',     '🤝'),
  ('Transport & Logistics',    'ትራንስፖርት',           '🚛'),
  ('Water & Environment',      'ውሃ እና አካባቢ',        '💧'),
  ('Other',                    'ሌላ',                '📋');

-- ── Jobs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id               BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  bureau_id        SMALLINT UNSIGNED NOT NULL,
  organization_id  BIGINT UNSIGNED   NULL,
  posted_by        BIGINT UNSIGNED   NOT NULL,
  category_id      SMALLINT UNSIGNED NULL,
  zone_id          SMALLINT UNSIGNED NULL,
  woreda_id        SMALLINT UNSIGNED NULL,
  city_id          SMALLINT UNSIGNED NULL,
  title_en         VARCHAR(250)      NOT NULL,
  title_am         VARCHAR(250)      NOT NULL DEFAULT '',
  description      TEXT              NOT NULL,
  requirements     TEXT              NULL,
  responsibilities TEXT              NULL,
  education_level  VARCHAR(100)      NULL,
  experience_years TINYINT UNSIGNED  NULL,
  employment_type  ENUM('full_time','part_time','contract','internship','temporary','volunteer')
                                     NOT NULL DEFAULT 'full_time',
  salary_min       DECIMAL(12,2)     NULL,
  salary_max       DECIMAL(12,2)     NULL,
  salary_currency  VARCHAR(5)        NOT NULL DEFAULT 'ETB',
  positions        TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  gender_pref      ENUM('any','male','female') NOT NULL DEFAULT 'any',
  status           ENUM('draft','pending','published','closed','expired','rejected')
                                     NOT NULL DEFAULT 'draft',
  rejection_reason TEXT              NULL,
  deadline         DATE              NULL,
  published_at     TIMESTAMP         NULL,
  created_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_jobs_bureau   (bureau_id),
  KEY idx_jobs_zone     (zone_id),
  KEY idx_jobs_woreda   (woreda_id),
  KEY idx_jobs_status   (status),
  KEY idx_jobs_deadline (deadline),
  KEY idx_jobs_posted   (posted_by),
  CONSTRAINT fk_jobs_bureau  FOREIGN KEY (bureau_id) REFERENCES bureaus (id),
  CONSTRAINT fk_jobs_poster  FOREIGN KEY (posted_by) REFERENCES users   (id),
  CONSTRAINT fk_jobs_zone    FOREIGN KEY (zone_id)   REFERENCES zones   (id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_woreda  FOREIGN KEY (woreda_id) REFERENCES woredas (id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_cat     FOREIGN KEY (category_id) REFERENCES job_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Job Skills (many-to-many) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS job_skills (
  job_id   BIGINT UNSIGNED   NOT NULL,
  skill_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_jskill_job   FOREIGN KEY (job_id)   REFERENCES jobs   (id) ON DELETE CASCADE,
  CONSTRAINT fk_jskill_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Applications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  job_id       BIGINT UNSIGNED   NOT NULL,
  applicant_id BIGINT UNSIGNED   NOT NULL,
  cover_letter TEXT              NULL,
  cv_url       VARCHAR(255)      NULL,
  status       ENUM('applied','under_review','shortlisted','interview','accepted','rejected')
                                 NOT NULL DEFAULT 'applied',
  status_note  TEXT              NULL,
  applied_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_application (job_id, applicant_id),
  KEY idx_app_job       (job_id),
  KEY idx_app_applicant (applicant_id),
  KEY idx_app_status    (status),
  CONSTRAINT fk_app_job       FOREIGN KEY (job_id)       REFERENCES jobs  (id) ON DELETE CASCADE,
  CONSTRAINT fk_app_applicant FOREIGN KEY (applicant_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Job Seeker Documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_seeker_documents (
  document_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_seeker_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('CV','GRADE_8','GRADE_12','DEGREE') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id),
  UNIQUE KEY unique_jobseeker_document (job_seeker_id, document_type),
  KEY idx_job_seeker_documents_user (job_seeker_id),
  CONSTRAINT fk_job_seeker_documents_user
    FOREIGN KEY (job_seeker_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Saved Jobs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id    BIGINT UNSIGNED NOT NULL,
  job_id     BIGINT UNSIGNED NOT NULL,
  saved_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id),
  CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job  FOREIGN KEY (job_id)  REFERENCES jobs  (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  title_en   VARCHAR(255)    NOT NULL,
  title_am   VARCHAR(255)    NOT NULL DEFAULT '',
  message    TEXT            NOT NULL,
  type       VARCHAR(50)     NOT NULL DEFAULT 'info',
  link       VARCHAR(255)    NULL,
  is_read    TINYINT(1)      NOT NULL DEFAULT 0,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id),
  KEY idx_notif_read (is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  bureau_id    SMALLINT UNSIGNED NULL,            -- NULL = regional/all bureaus
  posted_by    BIGINT UNSIGNED   NOT NULL,
  title_en     VARCHAR(255)      NOT NULL,
  title_am     VARCHAR(255)      NOT NULL DEFAULT '',
  content      TEXT              NOT NULL,
  is_published TINYINT(1)        NOT NULL DEFAULT 1,
  expires_at   DATE              NULL,
  created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ann_bureau (bureau_id),
  CONSTRAINT fk_ann_bureau FOREIGN KEY (bureau_id) REFERENCES bureaus (id) ON DELETE SET NULL,
  CONSTRAINT fk_ann_poster FOREIGN KEY (posted_by) REFERENCES users   (id)
) ENGINE=InnoDB;

-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id             BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED   NULL,
  action         VARCHAR(100)      NOT NULL,
  entity_type    VARCHAR(50)       NULL,
  entity_id      BIGINT UNSIGNED   NULL,
  details        JSON              NULL,
  ip_address     VARCHAR(45)       NULL,
  created_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_user   (user_id),
  KEY idx_audit_action (action),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;
