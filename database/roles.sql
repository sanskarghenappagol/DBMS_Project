-- ============================================================
-- Smart Healthcare Database Role-Based Access Control (RBAC)
-- MySQL 8.0+ Native Roles and Privileges
-- ============================================================

USE smart_healthcare;

-- ------------------------------------------------------------
-- 1. Create Roles
-- ------------------------------------------------------------
-- Healthcare Administrator Role (Full schema control)
CREATE ROLE IF NOT EXISTS 'healthcare_admin'@'%';

-- Healthcare Doctor Role (Clinical data access, availability & prescription management)
CREATE ROLE IF NOT EXISTS 'healthcare_doctor'@'%';

-- Healthcare Patient Role (Personal appointment and history access)
CREATE ROLE IF NOT EXISTS 'healthcare_patient'@'%';

-- ------------------------------------------------------------
-- 2. Grant Privileges to Admin Role
-- ------------------------------------------------------------
-- Full DDL and DML access across all smart_healthcare tables and procedures
GRANT ALL PRIVILEGES ON smart_healthcare.* TO 'healthcare_admin'@'%';

-- ------------------------------------------------------------
-- 3. Grant Privileges to Doctor Role
-- ------------------------------------------------------------
-- Read access to patients, doctors, medicines
GRANT SELECT ON smart_healthcare.Patient TO 'healthcare_doctor'@'%';
GRANT SELECT ON smart_healthcare.Doctor TO 'healthcare_doctor'@'%';
GRANT SELECT ON smart_healthcare.Doctor_Phone TO 'healthcare_doctor'@'%';
GRANT SELECT ON smart_healthcare.Medicine TO 'healthcare_doctor'@'%';

-- Full control over own availability
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_healthcare.Doctor_Availability TO 'healthcare_doctor'@'%';

-- Read and update appointments (e.g. mark completed)
GRANT SELECT, UPDATE ON smart_healthcare.Appointment TO 'healthcare_doctor'@'%';

-- Full control over clinical prescriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_healthcare.Prescription TO 'healthcare_doctor'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_healthcare.Prescription_Medicine TO 'healthcare_doctor'@'%';

-- Read-only access to bills for own consultations
GRANT SELECT ON smart_healthcare.Bill TO 'healthcare_doctor'@'%';

-- Execute clinical stored procedures and functions
GRANT EXECUTE ON PROCEDURE smart_healthcare.complete_appointment TO 'healthcare_doctor'@'%';
GRANT EXECUTE ON PROCEDURE smart_healthcare.get_patient_appointment_history TO 'healthcare_doctor'@'%';
GRANT EXECUTE ON FUNCTION smart_healthcare.calculate_patient_age TO 'healthcare_doctor'@'%';
GRANT EXECUTE ON FUNCTION smart_healthcare.get_doctor_experience_category TO 'healthcare_doctor'@'%';

-- ------------------------------------------------------------
-- 4. Grant Privileges to Patient Role
-- ------------------------------------------------------------
-- Read doctor profiles and public availability
GRANT SELECT ON smart_healthcare.Doctor TO 'healthcare_patient'@'%';
GRANT SELECT ON smart_healthcare.Doctor_Phone TO 'healthcare_patient'@'%';
GRANT SELECT ON smart_healthcare.Doctor_Availability TO 'healthcare_patient'@'%';

-- Read and create own appointments
GRANT SELECT, INSERT, UPDATE ON smart_healthcare.Appointment TO 'healthcare_patient'@'%';

-- Read own prescriptions and medicine info
GRANT SELECT ON smart_healthcare.Prescription TO 'healthcare_patient'@'%';
GRANT SELECT ON smart_healthcare.Prescription_Medicine TO 'healthcare_patient'@'%';
GRANT SELECT ON smart_healthcare.Medicine TO 'healthcare_patient'@'%';

-- Read own bills and create payments
GRANT SELECT ON smart_healthcare.Bill TO 'healthcare_patient'@'%';
GRANT SELECT, INSERT ON smart_healthcare.Payment TO 'healthcare_patient'@'%';

-- Execute booking procedure and billing functions
GRANT EXECUTE ON PROCEDURE smart_healthcare.book_appointment TO 'healthcare_patient'@'%';
GRANT EXECUTE ON PROCEDURE smart_healthcare.get_patient_appointment_history TO 'healthcare_patient'@'%';
GRANT EXECUTE ON FUNCTION smart_healthcare.calculate_final_bill TO 'healthcare_patient'@'%';

-- ------------------------------------------------------------
-- 5. Create Sample Database Users and Assign Roles
-- ------------------------------------------------------------
CREATE USER IF NOT EXISTS 'db_admin_user'@'%' IDENTIFIED BY 'AdminPass#2025';
CREATE USER IF NOT EXISTS 'db_doctor_user'@'%' IDENTIFIED BY 'DoctorPass#2025';
CREATE USER IF NOT EXISTS 'db_patient_user'@'%' IDENTIFIED BY 'PatientPass#2025';

-- Grant roles to respective database users
GRANT 'healthcare_admin'@'%' TO 'db_admin_user'@'%';
GRANT 'healthcare_doctor'@'%' TO 'db_doctor_user'@'%';
GRANT 'healthcare_patient'@'%' TO 'db_patient_user'@'%';

-- Set default active roles
SET DEFAULT ROLE 'healthcare_admin'@'%' TO 'db_admin_user'@'%';
SET DEFAULT ROLE 'healthcare_doctor'@'%' TO 'db_doctor_user'@'%';
SET DEFAULT ROLE 'healthcare_patient'@'%' TO 'db_patient_user'@'%';

-- ------------------------------------------------------------
-- 6. Verification Queries (For DBMS Viva Demonstration)
-- ------------------------------------------------------------
-- SHOW GRANTS FOR 'healthcare_admin'@'%';
-- SHOW GRANTS FOR 'healthcare_doctor'@'%';
-- SHOW GRANTS FOR 'healthcare_patient'@'%';
-- SHOW GRANTS FOR 'db_doctor_user'@'%';

