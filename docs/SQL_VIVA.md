# SMART HEALTHCARE & DOCTOR APPOINTMENT MANAGEMENT SYSTEM
## COMPREHENSIVE SQL VIVA PREPARATION GUIDE (LINE-BY-LINE EXPLANATIONS)

This guide provides exhaustive line-by-line explanations for every critical SQL statement and advanced relational database concept implemented in the **Smart Healthcare Management System**.

---

### TABLE OF CONTENTS
1. [Core Relational Schema & 3NF Normalization](#1-core-relational-schema)
2. [Data Definition Language (DDL) & Indexing](#2-ddl--indexing)
3. [Relational Joins (INNER, LEFT, RIGHT, Multi-Table)](#3-relational-joins)
4. [Nested Subqueries](#4-nested-subqueries)
5. [Correlated Subqueries](#5-correlated-subqueries)
6. [Common Table Expressions (CTE)](#6-common-table-expressions-cte)
7. [Recursive CTE (Date Series Generator)](#7-recursive-cte)
8. [MySQL Stored Procedures (ACID Transactions)](#8-stored-procedures)
9. [User-Defined Functions (UDF)](#9-user-defined-functions)
10. [Database Triggers (Stock Management & Invoicing)](#10-database-triggers)
11. [ACID Transaction Lab Deep Dive](#11-acid-transaction-lab)
12. [Role-Based Access Control (RBAC)](#12-role-based-access-control)

---

## 1. CORE RELATIONAL SCHEMA

### The 10 Primary Relational Tables:
1. `Patient`: Stores patient demographics, contact details, date of birth, and unique email.
2. `Doctor`: Stores physician credentials, clinical qualification, experience tenure, and consultation fee.
3. `Doctor_Phone`: Multi-valued attribute table resolving 1NF decomposition (Composite PK: `doctor_id, phone_no`).
4. `Doctor_Availability`: Stores calendar date, slot time interval, and slot booking status (`Available`, `Booked`, `Unavailable`).
5. `Appointment`: Bridge entity linking Patient and Doctor to a booked slot.
6. `Prescription`: Clinical encounter notes containing symptoms, diagnosis, and follow-up timeline.
7. `Medicine`: Pharmacy inventory with drug catalog, unit price, and on-hand stock (`CHECK in_stock >= 0`).
8. `Prescription_Medicine`: M:N resolution table mapping prescriptions to multiple drugs with dosage, frequency, and duration.
9. `Bill`: Financial invoice generated per consultation with amount and discount.
10. `Payment`: Transaction settlement record capturing payment mode (UPI, Card, Cash, Net Banking) and unique UTR.

Supporting Role Entity:
11. `user_roles`: Maps Supabase Auth UUID to application roles (`patient`, `doctor`, `admin`) and MySQL reference IDs.

---

## 2. DDL & INDEXING

### Composite B-Tree Index on Doctor Availability
```sql
CREATE INDEX idx_doc_avail_search ON Doctor_Availability(doctor_id, date, status);
```
- **Line 1 (`CREATE INDEX ...`):** Tells the MySQL query optimizer to construct a multi-column B-Tree index structure named `idx_doc_avail_search` on the `Doctor_Availability` table.
- **Why composite?** When patients browse slots, the query predicate filters by `WHERE doctor_id = ? AND date = ? AND status = 'Available'`. A composite index covering all three columns satisfies the predicate directly in index leaf nodes without full table scan (*Index Range Scan*), reducing query I/O from $O(N)$ to $O(\log N)$.

---

## 3. RELATIONAL JOINS

### Query 1: INNER JOIN - Scheduled Consultations
```sql
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
```

#### Line-by-Line Viva Breakdown:
- **`SELECT ...`**: Specifies the exact projection columns to return to the application layer. Column aliases (`AS patient_name`) rename composite expressions for clean frontend consumption.
- **`CONCAT(p.f_name, ' ', p.l_name)`**: Concatenates first and last name separated by a space into a unified string.
- **`FROM Appointment a`**: Designates `Appointment` as the primary driver relation, aliased as `a` for brevity.
- **`INNER JOIN Patient p ON a.p_id = p.p_id`**: Joins the `Patient` relation where the foreign key `a.p_id` matches the primary key `p.p_id`. Tuples that lack a matching patient are discarded from the output.
- **`INNER JOIN Doctor d ON a.doctor_id = d.id`**: Navigates the relationship from `Appointment` to `Doctor`, binding the doctor's name and clinical credentials.
- **`WHERE a.status = 'Scheduled'`**: Horizontal selection predicate that filters out historical (`Completed`) and voided (`Cancelled`) appointments.
- **`ORDER BY a.appointment_date, a.appointment_time`**: Sorts tuples chronologically so upcoming consultations appear first on hospital reception monitors.

---

### Query 2: LEFT JOIN - Patient Consultation Frequency
```sql
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
```

#### Line-by-Line Viva Breakdown:
- **`FROM Patient p`**: `Patient` is the left outer relation. All rows from `Patient` are preserved in the result set regardless of whether they have booked an appointment.
- **`LEFT JOIN Appointment a ON p.p_id = a.p_id`**: For patients with no appointments, attributes from `Appointment` are padded with `NULL`.
- **`COUNT(a.appointment_id)`**: *Crucial Viva Distinction:* We count `a.appointment_id` rather than `COUNT(*)`. `COUNT(*)` counts rows (and would incorrectly evaluate to `1` for NULL padded rows). `COUNT(column)` counts only non-null values, correctly returning `0` for new patients.
- **`MAX(a.appointment_date)`**: Identifies the most recent consultation date for each patient cohort.
- **`GROUP BY p.p_id, ...`**: Aggregates records by unique patient identity, satisfying the SQL-92/99 `ONLY_FULL_GROUP_BY` standard.

---

## 4. NESTED SUBQUERIES

### Query 3: Patients Having Above-Average Appointment Counts
```sql
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
```

#### Line-by-Line Viva Breakdown:
- **Innermost Subquery `(SELECT COUNT(appointment_id) ... GROUP BY p_id)`**: Computes the distribution of appointments per patient across the hospital.
- **Middle Subquery `(SELECT AVG(patient_counts.total) ...)`**: Computes the mean scalar appointment frequency across all active patients.
- **`HAVING COUNT(...) > (...)`**: The `HAVING` clause filters aggregated groups. It discards patients whose individual consultation count does not strictly exceed the scalar hospital average.
- **Real-World Healthcare Use:** Identifies high-utilization patients with chronic conditions for coordinated care programs.

---

## 5. CORRELATED SUBQUERIES

### Query 4: Doctors with at Least One Appointment (EXISTS)
```sql
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
```

#### Line-by-Line Viva Breakdown:
- **`WHERE EXISTS (...)`**: Evaluates to `TRUE` if the subquery returns at least one row.
- **Correlation Predicate `WHERE a.doctor_id = d.id`**: Binds the inner subquery to the current tuple being evaluated in the outer `Doctor` loop.
- **`SELECT 1`**: Convention in `EXISTS` clauses because column projection is ignored; the engine checks solely for presence of matching index records.
- **Why is `EXISTS` faster than `IN`?** `EXISTS` halts evaluation (*short-circuits*) on the very first matching tuple found in index leaf nodes, whereas `IN` can require constructing an intermediate materialized set.

---

## 6. COMMON TABLE EXPRESSIONS (CTE)

### Query 5: Doctor Workload & Revenue Performance CTE
```sql
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
```

#### Line-by-Line Viva Breakdown:
- **`WITH DoctorStats AS (...)`**: Defines an isolated named temporary result set residing in memory for the duration of the query.
- **`CASE WHEN status = 'Completed' THEN 1 ELSE 0 END`**: Conditional aggregation counting completed consultations without requiring separate queries.
- **`DoctorRevenue AS (...)`**: Defines a second CTE computing total net billing revenue for invoices with `status = 'Paid'`.
- **`NULLIF(s.total_booked, 0)`**: Prevents fatal division-by-zero errors (`1 / 0 = NULL`) when computing completion percentage for newly onboarded physicians with zero bookings.
- **`COALESCE(..., 0.00)`**: Replaces `NULL` values with formatted zeros for doctors who have not billed revenue yet.

---

## 7. RECURSIVE CTE

### Query 6: Date Series Generator for Appointment Scheduling
```sql
WITH RECURSIVE DateSeries AS (
    -- Anchor Member
    SELECT CAST('2025-01-01' AS DATE) AS calendar_date
    UNION ALL
    -- Recursive Member
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
```

#### Line-by-Line Viva Breakdown:
- **`WITH RECURSIVE DateSeries AS`**: Informs MySQL that the CTE refers to itself iteratively.
- **Anchor Member (`SELECT CAST('2025-01-01' AS DATE)`):** Base case that initializes the virtual table with the starting date.
- **Recursive Member (`SELECT calendar_date + INTERVAL 1 DAY ...`):** Iteratively reads the previous date in the virtual table, increments it by 1 calendar day, and outputs the next row.
- **Termination Predicate (`WHERE calendar_date < '2025-01-20'`):** Halts the recursion once the 20-day horizon is reached, preventing infinite recursion loops.
- **`LEFT JOIN Appointment a`**: Guarantees that quiet clinic days (e.g. Sundays or holidays) still appear in the analytical trend table with an appointment count of `0` instead of disappearing.

---

## 8. STORED PROCEDURES

### `book_appointment` Stored Procedure
```sql
DELIMITER $$
CREATE PROCEDURE book_appointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_availability_id INT,
    IN p_date DATE,
    IN p_time TIME,
    OUT p_appointment_id INT
)
BEGIN
    DECLARE v_slot_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT status INTO v_slot_status
    FROM Doctor_Availability
    WHERE availability_id = p_availability_id
    FOR UPDATE;

    IF v_slot_status != 'Available' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: The requested availability slot is already booked or unavailable';
    END IF;

    INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status)
    VALUES (p_patient_id, p_doctor_id, p_availability_id, p_date, p_time, 'Scheduled');

    SET p_appointment_id = LAST_INSERT_ID();

    UPDATE Doctor_Availability
    SET status = 'Booked'
    WHERE availability_id = p_availability_id;

    COMMIT;
END $$
DELIMITER ;
```

#### Line-by-Line Viva Breakdown:
- **`DELIMITER $$`**: Changes the statement delimiter from `;` to `$$` so internal semi-colons do not terminate procedure compilation prematurely.
- **`IN` vs `OUT` parameters**: `IN` accepts values from the application layer; `OUT` returns generated surrogate IDs back to the caller.
- **`DECLARE EXIT HANDLER FOR SQLEXCEPTION`**: Exception handler that automatically intercepts any runtime error, executes `ROLLBACK`, and re-signals the exception to the client.
- **`START TRANSACTION`**: Establishes ACID transaction boundary in InnoDB.
- **`FOR UPDATE`**: Places an exclusive row-level lock on the availability tuple, preventing race conditions (double bookings) when two users click "Book" at the same sub-second.
- **`SIGNAL SQLSTATE '45000'`**: Raises a custom user-defined database exception if slot is unavailable.
- **`LAST_INSERT_ID()`**: Captures the newly generated `appointment_id` auto-increment value.
- **`COMMIT`**: Flushes all changes to redo log and releases locks.

---

## 9. USER-DEFINED FUNCTIONS (UDF)

### `calculate_patient_age(dob)`
```sql
DELIMITER $$
CREATE FUNCTION calculate_patient_age(p_dob DATE) 
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    IF p_dob IS NULL THEN
        RETURN 0;
    END IF;
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END $$
DELIMITER ;
```

#### Viva Explanation:
- Storing `age` directly in the `Patient` table violates relational design best practices because age is a time-dependent derived attribute that becomes stale every 365 days.
- `calculate_patient_age` computes current age dynamically on-the-fly using `TIMESTAMPDIFF(YEAR, p_dob, CURDATE())`.
- Marked `DETERMINISTIC` to allow optimizer caching.

---

## 10. DATABASE TRIGGERS

### Trigger 1: Stock Deduction upon Prescription Creation
```sql
DELIMITER $$
CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON Prescription_Medicine
FOR EACH ROW
BEGIN
    UPDATE Medicine
    SET in_stock = in_stock - NEW.duration_days
    WHERE id = NEW.medicine_id;
END $$
DELIMITER ;
```
- **`AFTER INSERT ON Prescription_Medicine`**: Automatically fires whenever a doctor prescribes a drug.
- **`NEW.duration_days`**: Accesses the inserted row's duration attribute (used as a unit quantity proxy).
- Automatically reduces inventory in the `Medicine` table without requiring explicit backend update code.

### Trigger 2: Prevent Negative Medicine Stock
```sql
DELIMITER $$
CREATE TRIGGER trg_prevent_negative_stock
BEFORE INSERT ON Prescription_Medicine
FOR EACH ROW
BEGIN
    DECLARE v_current_stock INT;
    SELECT in_stock INTO v_current_stock
    FROM Medicine
    WHERE id = NEW.medicine_id;

    IF v_current_stock < NEW.duration_days THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Prescription rejected: Insufficient medicine stock in hospital pharmacy';
    END IF;
END $$
DELIMITER ;
```
- **`BEFORE INSERT`**: Fires *prior* to tuple insertion so the operation can be aborted before modifying tables.
- Raises `SQLSTATE '45000'` to reject the operation if inventory is insufficient.

### Trigger 3: Automatic Bill Status Update on Successful Payment
```sql
DELIMITER $$
CREATE TRIGGER trg_update_bill_on_payment
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Success' THEN
        UPDATE Bill
        SET status = 'Paid'
        WHERE bill_id = NEW.bill_id;
    END IF;
END $$
DELIMITER ;
```
- Synchronizes invoice settlement state between the `Payment` and `Bill` tables.

---

## 11. ACID TRANSACTION LAB

| Property | Meaning | Hospital Project Demonstration |
| :--- | :--- | :--- |
| **Atomicity** | All statements complete successfully or all are rolled back. | Inserting an Appointment + its accompanying Bill. If an error occurs, `ROLLBACK` removes both so no orphaned appointment remains. |
| **Consistency** | The database transitions only through valid schema states. | Schema rejects inserting medicine with negative price or negative stock via `CHECK (in_stock >= 0)`. |
| **Isolation** | Concurrent transactions cannot see or corrupt each other's uncommitted data. | `SELECT ... FOR UPDATE` row locks on availability slots prevent simultaneous double-booking. |
| **Durability** | Committed data is permanently written to non-volatile disk. | Data written to InnoDB Redo Log (`ib_logfile`) survives server crashes and application restarts. |

---

## 12. ROLE-BASED ACCESS CONTROL (RBAC)

### Database Level vs Application Level:
- **Application Level (Node.js/Express):** JWT verification in `authenticateUser`, checking tenant ownership (e.g. Doctor A can only view their own patients).
- **Database Level (MySQL Native Privileges):** `GRANT SELECT, INSERT ON smart_healthcare.Appointment TO 'healthcare_patient'@'%'`. Prevents destructive operations (`DROP TABLE`, `ALTER TABLE`) even if the backend application is compromised.

