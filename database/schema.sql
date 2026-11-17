-- ============================================================
-- Smart Healthcare Database Schema
-- MySQL / InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_healthcare;
USE smart_healthcare;

-- ------------------------------------------------------------
-- 1. Patient
-- ------------------------------------------------------------
CREATE TABLE Patient (
    p_id              INT            PRIMARY KEY AUTO_INCREMENT,
    supabase_user_id  VARCHAR(36)    UNIQUE,
    f_name            VARCHAR(50)    NOT NULL,
    l_name            VARCHAR(50)    NOT NULL,
    email             VARCHAR(100)   UNIQUE NOT NULL,
    gender            ENUM('Male', 'Female', 'Other'),
    blood_group       VARCHAR(5),
    dob               DATE,
    street            VARCHAR(150),
    city              VARCHAR(80),
    pincode           VARCHAR(10),
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Doctor
-- ------------------------------------------------------------
CREATE TABLE Doctor (
    id                INT            PRIMARY KEY AUTO_INCREMENT,
    supabase_user_id  VARCHAR(36)    UNIQUE,
    f_name            VARCHAR(50)    NOT NULL,
    l_name            VARCHAR(50)    NOT NULL,
    email             VARCHAR(100)   UNIQUE NOT NULL,
    qualification     VARCHAR(100),
    experience        INT            CHECK (experience >= 0),
    consult_fee       DECIMAL(10,2)  CHECK (consult_fee >= 0),
    city              VARCHAR(80),
    pincode           VARCHAR(10),
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. Doctor_Phone
-- ------------------------------------------------------------
CREATE TABLE Doctor_Phone (
    doctor_id   INT,
    phone_no    VARCHAR(15),
    PRIMARY KEY (doctor_id, phone_no),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. Doctor_Availability
-- ------------------------------------------------------------
CREATE TABLE Doctor_Availability (
    availability_id   INT            PRIMARY KEY AUTO_INCREMENT,
    doctor_id         INT,
    date              DATE           NOT NULL,
    st_time           TIME           NOT NULL,
    end_time          TIME           NOT NULL,
    status            ENUM('Available', 'Booked', 'Unavailable') DEFAULT 'Available',
    FOREIGN KEY (doctor_id) REFERENCES Doctor(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. Appointment
-- ------------------------------------------------------------
CREATE TABLE Appointment (
    appointment_id    INT            PRIMARY KEY AUTO_INCREMENT,
    p_id              INT,
    doctor_id         INT,
    availability_id   INT,
    appointment_date  DATE           NOT NULL,
    appointment_time  TIME           NOT NULL,
    status            ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (p_id)             REFERENCES Patient(p_id)                        ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)        REFERENCES Doctor(id)                           ON DELETE CASCADE,
    FOREIGN KEY (availability_id)  REFERENCES Doctor_Availability(availability_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. Prescription
-- ------------------------------------------------------------
CREATE TABLE Prescription (
    pers_id           INT            PRIMARY KEY AUTO_INCREMENT,
    appointment_id    INT            UNIQUE,
    symptoms          TEXT,
    diagnosis         TEXT,
    prescribed_date   DATE,
    follow_up_date    DATE,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. Medicine
-- ------------------------------------------------------------
CREATE TABLE Medicine (
    id        INT            PRIMARY KEY AUTO_INCREMENT,
    name      VARCHAR(100)   NOT NULL,
    category  VARCHAR(80),
    price     DECIMAL(10,2)  CHECK (price >= 0),
    in_stock  INT            DEFAULT 0 CHECK (in_stock >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. Prescription_Medicine
-- ------------------------------------------------------------
CREATE TABLE Prescription_Medicine (
    pers_id        INT,
    medicine_id    INT,
    dosage         VARCHAR(100),
    frequency      VARCHAR(100),
    duration_days  INT,
    instruction    TEXT,
    PRIMARY KEY (pers_id, medicine_id),
    FOREIGN KEY (pers_id)      REFERENCES Prescription(pers_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id)  REFERENCES Medicine(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. Bill
-- ------------------------------------------------------------
CREATE TABLE Bill (
    bill_id          INT            PRIMARY KEY AUTO_INCREMENT,
    appointment_id   INT            UNIQUE,
    bill_date        DATE,
    amount           DECIMAL(10,2)  CHECK (amount >= 0),
    discount         DECIMAL(10,2)  DEFAULT 0.00 CHECK (discount >= 0),
    status           ENUM('Pending', 'Paid', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. Payment
-- ------------------------------------------------------------
CREATE TABLE Payment (
    payment_id    INT            PRIMARY KEY AUTO_INCREMENT,
    bill_id       INT,
    utr           VARCHAR(100)   UNIQUE,
    method        ENUM('UPI', 'Card', 'Cash', 'Net Banking'),
    amount        DECIMAL(10,2)  CHECK (amount >= 0),
    status        ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    payment_date  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES Bill(bill_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. user_roles
-- ------------------------------------------------------------
CREATE TABLE user_roles (
    id                INT            PRIMARY KEY AUTO_INCREMENT,
    supabase_user_id  VARCHAR(36)    UNIQUE NOT NULL,
    role              ENUM('patient', 'doctor', 'admin') NOT NULL,
    mysql_ref_id      INT,
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- INDEXES
-- ============================================================

-- Patient indexes
CREATE INDEX idx_patient_email            ON Patient(email);
CREATE INDEX idx_patient_supabase_uid     ON Patient(supabase_user_id);

-- Doctor indexes
CREATE INDEX idx_doctor_email             ON Doctor(email);
CREATE INDEX idx_doctor_supabase_uid      ON Doctor(supabase_user_id);

-- Appointment indexes
CREATE INDEX idx_appointment_p_id         ON Appointment(p_id);
CREATE INDEX idx_appointment_doctor_id    ON Appointment(doctor_id);
CREATE INDEX idx_appointment_date         ON Appointment(appointment_date);
CREATE INDEX idx_appointment_status       ON Appointment(status);

-- Doctor_Availability composite index
CREATE INDEX idx_availability_doctor_date ON Doctor_Availability(doctor_id, date);

-- Bill index
CREATE INDEX idx_bill_status              ON Bill(status);

-- user_roles index
CREATE INDEX idx_user_roles_supabase_uid  ON user_roles(supabase_user_id);
