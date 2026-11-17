-- ============================================================
-- Smart Healthcare Management System
-- Advanced SQL Queries File
-- Covers: DDL, DML, JOINS, NESTED QUERIES, CORRELATED QUERIES,
-- CTE, RECURSIVE CTE, STORED PROCEDURES, FUNCTIONS, TRIGGERS,
-- INDEXES, TRANSACTIONS
-- ============================================================

USE smart_healthcare;

-- ============================================================
-- SECTION A: DDL (Data Definition Language)
-- ============================================================

-- TITLE: Create an Audit Table
-- PURPOSE: Create a specialized audit table for appointment cancellations
-- EXPLANATION:
--   CREATE TABLE: Defines a new relation in the database catalog.
--   audit_id: Primary key with auto-increment surrogate key.
--   appointment_id: Stores the cancelled appointment's identifier.
--   cancelled_by: Captures who initiated the cancellation.
--   reason: Textual justification for hospital audits.
--   cancelled_at: Automatic timestamp when the record is written.
-- REAL-WORLD USE: Hospitals need audit trails for canceled slots to identify no-shows or physician unavailability.
CREATE TABLE IF NOT EXISTS Appointment_Cancellation_Audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    cancelled_by VARCHAR(50) DEFAULT 'System',
    reason VARCHAR(255),
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TITLE: Add Constraint for Mobile Phone Format
-- PURPOSE: Ensure doctor phone numbers follow standard conventions
-- EXPLANATION:
--   ALTER TABLE: Modifies the schema of an existing table without dropping data.
--   ADD CONSTRAINT: Attaches a new integrity rule.
--   CHECK: Evaluates an expression before any INSERT/UPDATE; rejects if FALSE.
--   REGEXP_LIKE: Regular expression check enforcing country code or digit patterns.
-- REAL-WORLD USE: Guarantees that communication services (SMS/WhatsApp) receive clean phone numbers.
-- Note: MySQL 8.0.16+ enforces CHECK constraints.
ALTER TABLE Doctor_Phone
ADD CONSTRAINT chk_phone_format CHECK (LENGTH(phone_no) >= 10);

-- TITLE: Create Multi-Column Covering Index
-- PURPOSE: Accelerate searches for doctor availability by date and status
-- EXPLANATION:
--   CREATE INDEX: Constructs a B-tree search structure on specified columns.
--   idx_doc_avail_search: Meaningful name for the index.
--   ON Doctor_Availability(doctor_id, date, status): Composite key ordered for range scans.
-- REAL-WORLD USE: Speeds up the patient dashboard when checking open slots for a specific doctor on a chosen day.
CREATE INDEX idx_doc_avail_search ON Doctor_Availability(doctor_id, date, status);


-- ============================================================
-- SECTION B: DML (Data Manipulation Language)
-- ============================================================

-- TITLE: Insert New Medicine With Duplicate Check
-- PURPOSE: Safely insert or update medicine stock without raising fatal errors
-- EXPLANATION:
--   INSERT INTO ... VALUES: Adds a new tuple into the relation.
--   ON DUPLICATE KEY UPDATE: If primary/unique key matches, updates the stock count instead.
-- REAL-WORLD USE: Used by pharmacy staff when restocking existing batches of medicine.
INSERT INTO Medicine (name, category, price, in_stock)
VALUES ('Cetirizine 10mg', 'Antihistamine', 25.00, 50)
ON DUPLICATE KEY UPDATE in_stock = in_stock + VALUES(in_stock);

-- TITLE: Update Consultation Fee Based on Experience
-- PURPOSE: Increase consultation fees by 10% for doctors with over 15 years experience
-- EXPLANATION:
--   UPDATE: Modifies existing tuples in the target table.
--   SET: Defines the assignment expression for consult_fee.
--   WHERE: Predicate restricting updates strictly to doctors with experience > 15.
-- REAL-WORLD USE: Hospital periodic revision of specialist fees based on clinical tenure.
UPDATE Doctor
SET consult_fee = consult_fee * 1.10
WHERE experience > 15;

-- TITLE: Clean Up Expired Unbooked Availability Slots
-- PURPOSE: Delete historical availability slots that were never booked
-- EXPLANATION:
--   DELETE FROM: Removes tuples from Doctor_Availability.
--   WHERE: Restricts deletion to past dates and 'Available' status (unbooked).
-- REAL-WORLD USE: Keeps the calendar table clean by purging stale unbooked slots.
DELETE FROM Doctor_Availability
WHERE date < CURDATE() AND status = 'Available';


-- ============================================================
-- SECTION C: JOINS
-- ============================================================

-- TITLE: INNER JOIN - Appointments with Patient and Doctor Details
-- PURPOSE: Retrieve scheduled appointments with full patient and doctor names
-- EXPLANATION:
--   SELECT: Specifies projection attributes with column aliases.
--   FROM Appointment a: Main driver table.
--   INNER JOIN Patient p ON a.p_id = p.p_id: Matches only appointments with valid patient records.
--   INNER JOIN Doctor d ON a.doctor_id = d.id: Matches corresponding doctor records.
--   WHERE: Filters for only 'Scheduled' appointments.
--   ORDER BY: Orders results chronologically.
-- REAL-WORLD USE: Generates the daily hospital schedule display for reception staff.
SELECT 
    a.appointment_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.email AS patient_email,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    a.appointment_date,
    a.appointment_time,
    a.status
FROM Appointment a
INNER JOIN Patient p ON a.p_id = p.p_id
INNER JOIN Doctor d ON a.doctor_id = d.id
WHERE a.status = 'Scheduled'
ORDER BY a.appointment_date, a.appointment_time;

-- TITLE: LEFT JOIN - All Patients and Their Total Appointments
-- PURPOSE: Identify all registered patients and count their appointments, including zero counts
-- EXPLANATION:
--   FROM Patient p: Preserves all rows from Patient (outer table).
--   LEFT JOIN Appointment a: Matches appointments if present; fills NULL if absent.
--   COUNT(a.appointment_id): Counts non-null appointment IDs (evaluates to 0 if none).
--   GROUP BY: Groups by patient identifiers.
-- REAL-WORLD USE: Hospital marketing analysis to find active vs inactive registered users.
SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.city,
    COUNT(a.appointment_id) AS total_visits,
    MAX(a.appointment_date) AS last_visit_date
FROM Patient p
LEFT JOIN Appointment a ON p.p_id = a.p_id
GROUP BY p.p_id, p.f_name, p.l_name, p.city
ORDER BY total_visits DESC;

-- TITLE: RIGHT JOIN - All Doctors and Their Booked Consultation Counts
-- PURPOSE: Ensure every doctor is listed even if they have not yet received any appointments
-- EXPLANATION:
--   FROM Appointment a RIGHT JOIN Doctor d: Doctor is the preserved outer table.
--   COUNT(a.appointment_id): Evaluates total consultations received by doctor.
--   AVG(b.amount): Computes average bill amount generated per doctor.
-- REAL-WORLD USE: Physician performance review and appointment allocation fairness report.
SELECT 
    d.id AS doctor_id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    d.consult_fee,
    COUNT(a.appointment_id) AS total_appointments,
    COALESCE(SUM(b.amount - b.discount), 0.00) AS total_billed_revenue
FROM Appointment a
RIGHT JOIN Doctor d ON a.doctor_id = d.id
LEFT JOIN Bill b ON a.appointment_id = b.appointment_id AND b.status = 'Paid'
GROUP BY d.id, d.f_name, d.l_name, d.qualification, d.consult_fee
ORDER BY total_billed_revenue DESC;

-- TITLE: Multi-Table JOIN - Comprehensive Medical Encounter Overview
-- PURPOSE: Join 6 tables to produce an exhaustive clinical and billing encounter summary
-- EXPLANATION:
--   Joins Appointment, Patient, Doctor, Prescription, Bill, and Payment.
--   Uses LEFT JOIN for Prescription, Bill, Payment because some appointments may not yet have bills.
-- REAL-WORLD USE: Comprehensive hospital dashboard showing end-to-end patient care and billing status.
SELECT 
    a.appointment_id,
    a.appointment_date,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    pr.diagnosis,
    b.amount AS bill_amount,
    b.discount,
    (b.amount - b.discount) AS payable_amount,
    b.status AS bill_status,
    pay.method AS payment_method,
    pay.utr
FROM Appointment a
INNER JOIN Patient p ON a.p_id = p.p_id
INNER JOIN Doctor d ON a.doctor_id = d.id
LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
LEFT JOIN Payment pay ON b.bill_id = pay.bill_id
ORDER BY a.appointment_id;


-- ============================================================
-- SECTION D: NESTED QUERIES (Subqueries)
-- ============================================================

-- TITLE: Patients Having More Appointments Than Average
-- PURPOSE: Identify frequent hospital visitors whose visit count exceeds the cohort average
-- EXPLANATION:
--   Subquery: Calculates the average appointment count across all patients.
--   Outer Query: Groups appointments by patient and uses HAVING to filter exceeding patients.
-- REAL-WORLD USE: Enrolling frequent hospital visitors into chronic disease management programs.
SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.email,
    COUNT(a.appointment_id) AS appointment_count
FROM Patient p
JOIN Appointment a ON p.p_id = a.p_id
GROUP BY p.p_id, p.f_name, p.l_name, p.email
HAVING COUNT(a.appointment_id) > (
    SELECT AVG(patient_counts.total)
    FROM (
        SELECT COUNT(appointment_id) AS total
        FROM Appointment
        GROUP BY p_id
    ) AS patient_counts
);

-- TITLE: Doctors Charging Above Average Consultation Fee
-- PURPOSE: Find premium specialist doctors whose fee is higher than the clinic-wide average
-- EXPLANATION:
--   Subquery: (SELECT AVG(consult_fee) FROM Doctor) computes the overall mean fee.
--   Outer Query: Filters doctors whose consult_fee is strictly greater than that scalar average.
-- REAL-WORLD USE: Financial auditing and categorizing doctors into insurance tier bands.
SELECT 
    id,
    CONCAT('Dr. ', f_name, ' ', l_name) AS doctor_name,
    qualification,
    consult_fee,
    ROUND((SELECT AVG(consult_fee) FROM Doctor), 2) AS overall_avg_fee,
    ROUND(consult_fee - (SELECT AVG(consult_fee) FROM Doctor), 2) AS premium_difference
FROM Doctor
WHERE consult_fee > (SELECT AVG(consult_fee) FROM Doctor)
ORDER BY consult_fee DESC;

-- TITLE: Medicines That Have Never Been Prescribed
-- PURPOSE: Discover dormant inventory items that have never appeared on any prescription
-- EXPLANATION:
--   Subquery: SELECT DISTINCT medicine_id FROM Prescription_Medicine collects all prescribed IDs.
--   NOT IN: Filters medicine IDs that do not appear in the prescribed list.
-- REAL-WORLD USE: Pharmacy stock management to identify slow-moving capital and avoid expiry waste.
SELECT 
    m.id,
    m.name,
    m.category,
    m.price,
    m.in_stock
FROM Medicine m
WHERE m.id NOT IN (
    SELECT DISTINCT pm.medicine_id
    FROM Prescription_Medicine pm
    WHERE pm.medicine_id IS NOT NULL
)
ORDER BY m.in_stock DESC;


-- ============================================================
-- SECTION E: CORRELATED SUBQUERIES
-- ============================================================

-- TITLE: Doctors Having at Least One Appointment (EXISTS)
-- PURPOSE: Efficiently verify doctors who have active clinical engagements
-- EXPLANATION:
--   EXISTS: Tests for existence of rows in the correlated subquery; halts on first match.
--   Correlation: WHERE a.doctor_id = d.id binds the inner appointment lookup to the outer doctor row.
-- REAL-WORLD USE: Fast lookup for building doctor dropdowns with active booking histories.
SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    d.city
FROM Doctor d
WHERE EXISTS (
    SELECT 1 
    FROM Appointment a 
    WHERE a.doctor_id = d.id
);

-- TITLE: Patients Who Have Visited a Cardiologist (Dr. Rajesh Sen)
-- PURPOSE: Retrieve all patients who consulted a specific cardiologist
-- EXPLANATION:
--   Correlated EXISTS with multiple table condition:
--   Inner query joins Appointment to Doctor where d.f_name = 'Rajesh' AND a.p_id = p.p_id.
-- REAL-WORLD USE: Disease-specific patient recall campaigns (e.g. reminding cardiac patients of annual ECG).
SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.email,
    p.blood_group
FROM Patient p
WHERE EXISTS (
    SELECT 1 
    FROM Appointment a
    JOIN Doctor d ON a.doctor_id = d.id
    WHERE a.p_id = p.p_id 
      AND d.f_name = 'Rajesh' 
      AND d.l_name = 'Sen'
);

-- TITLE: Doctors Having Above-Average Appointment Counts Within Their City
-- PURPOSE: Correlated subquery calculating city-specific doctor workload benchmarks
-- EXPLANATION:
--   Outer query counts appointments per doctor.
--   Inner subquery calculates the average doctor appointment count in that specific doctor's city.
-- REAL-WORLD USE: Balancing doctor workloads across regional branches.
SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.city,
    COUNT(a.appointment_id) AS doc_appointments
FROM Doctor d
LEFT JOIN Appointment a ON d.id = a.doctor_id
GROUP BY d.id, d.f_name, d.l_name, d.city
HAVING COUNT(a.appointment_id) >= (
    SELECT AVG(city_doc_apts.total)
    FROM (
        SELECT d2.city, COUNT(a2.appointment_id) AS total
        FROM Doctor d2
        LEFT JOIN Appointment a2 ON d2.id = a2.doctor_id
        GROUP BY d2.id, d2.city
    ) AS city_doc_apts
    WHERE city_doc_apts.city = d.city
);


-- ============================================================
-- SECTION F: CTE (Common Table Expressions)
-- ============================================================

-- TITLE: Monthly Revenue Analysis CTE
-- PURPOSE: Break down hospital revenue, bill counts, and average ticket size month by month
-- EXPLANATION:
--   WITH MonthlyData AS (...): Defines an inline temporary named result set.
--   Aggregates payments grouped by Year and Month.
--   Main query selects from MonthlyData and computes month-over-month trends.
-- REAL-WORLD USE: Executive financial dashboard for CFO and revenue cycle management.
WITH MonthlyData AS (
    SELECT 
        DATE_FORMAT(p.payment_date, '%Y-%m') AS billing_month,
        COUNT(DISTINCT p.payment_id) AS transaction_count,
        SUM(p.amount) AS total_collected,
        AVG(p.amount) AS avg_transaction_value
    FROM Payment p
    WHERE p.status = 'Success'
    GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
)
SELECT 
    billing_month,
    transaction_count,
    ROUND(total_collected, 2) AS total_revenue_inr,
    ROUND(avg_transaction_value, 2) AS avg_ticket_inr
FROM MonthlyData
ORDER BY billing_month DESC;

-- TITLE: Doctor Performance and Utilization CTE
-- PURPOSE: Compute appointment completion rate and total billings per doctor
-- EXPLANATION:
--   CTE 1 (DoctorStats): Aggregates total, completed, and cancelled appointments.
--   CTE 2 (DoctorRevenue): Calculates total paid revenue attributed to each doctor.
--   Main query joins the two CTEs and computes performance percentages.
-- REAL-WORLD USE: Doctor KPI scorecard and incentive compensation calculations.
WITH DoctorStats AS (
    SELECT 
        doctor_id,
        COUNT(*) AS total_booked,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count
    FROM Appointment
    GROUP BY doctor_id
),
DoctorRevenue AS (
    SELECT 
        a.doctor_id,
        SUM(b.amount - b.discount) AS total_billed
    FROM Appointment a
    JOIN Bill b ON a.appointment_id = b.appointment_id
    WHERE b.status = 'Paid'
    GROUP BY a.doctor_id
)
SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    COALESCE(s.total_booked, 0) AS total_appointments,
    COALESCE(s.completed_count, 0) AS completed,
    COALESCE(s.cancelled_count, 0) AS cancelled,
    ROUND((COALESCE(s.completed_count, 0) / NULLIF(s.total_booked, 0)) * 100, 1) AS completion_rate_pct,
    COALESCE(r.total_billed, 0.00) AS total_revenue_generated
FROM Doctor d
LEFT JOIN DoctorStats s ON d.id = s.doctor_id
LEFT JOIN DoctorRevenue r ON d.id = r.doctor_id
ORDER BY total_revenue_generated DESC;

-- TITLE: Patient Longitudinal Visit Summary CTE
-- PURPOSE: Categorize patients by loyalty tiers based on their appointment count
-- EXPLANATION:
--   PatientTotals CTE aggregates visits and expenditures.
--   Main query applies CASE expression to segment patients into 'Platinum', 'Gold', 'Silver', 'Bronze'.
-- REAL-WORLD USE: Hospital relationship management and personalized healthcare plan eligibility.
WITH PatientTotals AS (
    SELECT 
        p.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email,
        COUNT(a.appointment_id) AS total_visits,
        COALESCE(SUM(b.amount - b.discount), 0.00) AS total_spent
    FROM Patient p
    LEFT JOIN Appointment a ON p.p_id = a.p_id
    LEFT JOIN Bill b ON a.appointment_id = b.appointment_id AND b.status = 'Paid'
    GROUP BY p.p_id, p.f_name, p.l_name, p.email
)
SELECT 
    p_id,
    patient_name,
    email,
    total_visits,
    total_spent,
    CASE 
        WHEN total_visits >= 5 THEN 'Platinum Patient'
        WHEN total_visits >= 3 THEN 'Gold Patient'
        WHEN total_visits >= 1 THEN 'Silver Patient'
        ELSE 'Registered - No Visits'
    END AS patient_tier
FROM PatientTotals
ORDER BY total_spent DESC;


-- ============================================================
-- SECTION G: RECURSIVE CTE
-- ============================================================

-- TITLE: Recursive Date Series Generator for Appointment Scheduling Trends
-- PURPOSE: Generate 30 consecutive calendar days and count appointments per day, showing 0 for empty days
-- EXPLANATION:
--   WITH RECURSIVE DateSeries AS (...):
--     Anchor member: SELECT '2025-01-01' AS calendar_date (starting date).
--     Recursive member: SELECT calendar_date + INTERVAL 1 DAY WHERE date < '2025-01-30'.
--   Main query: LEFT JOINs the generated date series with the Appointment table.
-- REAL-WORLD USE: Charting appointment load without gaps on dates where no appointments exist.
WITH RECURSIVE DateSeries AS (
    -- Anchor member: Starting date
    SELECT CAST('2025-01-01' AS DATE) AS calendar_date
    UNION ALL
    -- Recursive member: Increments by 1 day until upper bound
    SELECT calendar_date + INTERVAL 1 DAY
    FROM DateSeries
    WHERE calendar_date < '2025-01-20'
)
SELECT 
    ds.calendar_date,
    DAYNAME(ds.calendar_date) AS day_of_week,
    COUNT(a.appointment_id) AS appointments_booked,
    SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_count
FROM DateSeries ds
LEFT JOIN Appointment a ON ds.calendar_date = a.appointment_date
GROUP BY ds.calendar_date
ORDER BY ds.calendar_date;


-- ============================================================
-- SECTION H: STORED PROCEDURES DEMONSTRATION
-- ============================================================

-- TITLE: Demonstration of book_appointment Stored Procedure
-- PURPOSE: Atomic booking of appointment with slot status update
-- EXPLANATION:
--   CALL book_appointment(patient_id, doctor_id, availability_id, date, time, @out_id);
--   Selects the returned OUT parameter to verify creation.
-- REAL-WORLD USE: Backend booking endpoint executes this stored procedure.
-- CALL book_appointment(1, 1, 4, '2025-01-12', '14:00:00', @new_apt_id);
-- SELECT @new_apt_id AS newly_created_appointment_id;


-- ============================================================
-- SECTION I: FUNCTIONS DEMONSTRATION
-- ============================================================

-- TITLE: Demonstrate Custom SQL Functions
-- PURPOSE: Compute dynamic patient age, experience tier, and net bill amount
-- EXPLANATION:
--   calculate_patient_age(dob): Uses TIMESTAMPDIFF(YEAR, dob, CURDATE()).
--   get_doctor_experience_category(experience): Categorizes tenure into descriptive tiers.
--   calculate_final_bill(amount, discount): Evaluates net payable amount.
-- REAL-WORLD USE: Eliminates repeated math in application layer, centralizing business rules in the database.
SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.dob,
    calculate_patient_age(p.dob) AS calculated_age
FROM Patient p
LIMIT 5;

SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.experience AS years_experience,
    get_doctor_experience_category(d.experience) AS seniority_tier
FROM Doctor d;

SELECT 
    b.bill_id,
    b.amount AS gross_amount,
    b.discount,
    calculate_final_bill(b.amount, b.discount) AS net_payable
FROM Bill b
LIMIT 5;

