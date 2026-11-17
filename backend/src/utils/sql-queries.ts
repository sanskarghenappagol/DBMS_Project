export interface PredefinedQuery {
  id: string;
  title: string;
  category: 'DDL' | 'DML' | 'Joins' | 'Nested' | 'Correlated' | 'CTE' | 'Recursive CTE' | 'Procedures' | 'Functions' | 'Triggers' | 'Transactions';
  purpose: string;
  query: string;
  explanation: Record<string, string>;
  expectedOutput: string;
  realWorldUse: string;
}

export const PREDEFINED_QUERIES: PredefinedQuery[] = [
  // ------------------------------------------------------------
  // JOINS
  // ------------------------------------------------------------
  {
    id: 'join-inner-appointments',
    title: 'INNER JOIN: Scheduled Appointments with Patient and Doctor Details',
    category: 'Joins',
    purpose: 'Retrieve all confirmed scheduled appointments combined with the respective patient and doctor names.',
    query: `SELECT 
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
ORDER BY a.appointment_date, a.appointment_time;`,
    explanation: {
      'SELECT': 'Specifies projection columns with aliased names for UI clarity.',
      'FROM Appointment a': 'Primary driving table containing appointment schedule records.',
      'INNER JOIN Patient p ON a.p_id = p.p_id': 'Matches appointment records strictly to corresponding patients.',
      'INNER JOIN Doctor d ON a.doctor_id = d.id': 'Combines appointment tuples with the assigned physician data.',
      'WHERE a.status = \'Scheduled\'': 'Filters out cancelled and historical completed visits.',
      'ORDER BY': 'Sorts records chronologically so the front desk sees upcoming slots first.'
    },
    expectedOutput: 'Table of scheduled appointments displaying patient names, doctor names, qualifications, and date/time.',
    realWorldUse: 'Used in hospital reception and nurse triage stations for live appointment tracking.'
  },
  {
    id: 'join-left-patient-history',
    title: 'LEFT JOIN: All Patients with Their Consultation Frequency',
    category: 'Joins',
    purpose: 'List every registered patient and their total visit count, ensuring patients with zero visits are still included.',
    query: `SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.city,
    COUNT(a.appointment_id) AS total_visits,
    MAX(a.appointment_date) AS last_visit_date
FROM Patient p
LEFT JOIN Appointment a ON p.p_id = a.p_id
GROUP BY p.p_id, p.f_name, p.l_name, p.city
ORDER BY total_visits DESC;`,
    explanation: {
      'FROM Patient p': 'Outer table: preserves all registered patient records.',
      'LEFT JOIN Appointment a': 'Includes matching appointments if available; evaluates to NULL if patient has not booked yet.',
      'COUNT(a.appointment_id)': 'Counts non-null appointment IDs, correctly displaying 0 for new signups.',
      'GROUP BY': 'Aggregates statistics by unique patient identifiers.'
    },
    expectedOutput: 'List of all patients with total consultation visits and most recent visit date.',
    realWorldUse: 'Identifies dormant patients for automated health checkup reminders.'
  },
  {
    id: 'join-right-doctor-revenue',
    title: 'RIGHT JOIN: Doctor Consultation & Revenue Attribution',
    category: 'Joins',
    purpose: 'Display every doctor in the hospital and aggregate their consultations and billings.',
    query: `SELECT 
    d.id AS doctor_id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    d.consult_fee,
    COUNT(a.appointment_id) AS total_appointments,
    COALESCE(SUM(b.amount - b.discount), 0.00) AS total_revenue_inr
FROM Appointment a
RIGHT JOIN Doctor d ON a.doctor_id = d.id
LEFT JOIN Bill b ON a.appointment_id = b.appointment_id AND b.status = 'Paid'
GROUP BY d.id, d.f_name, d.l_name, d.qualification, d.consult_fee
ORDER BY total_revenue_inr DESC;`,
    explanation: {
      'RIGHT JOIN Doctor d': 'Ensures every physician is displayed even if newly recruited with zero consultations.',
      'LEFT JOIN Bill b': 'Attaches paid invoices to compute financial revenue.',
      'COALESCE(...)': 'Substitutes 0.00 in place of NULL for doctors who have not billed any revenue yet.'
    },
    expectedOutput: 'Comprehensive doctor revenue table showing total appointments and collected fees.',
    realWorldUse: 'Physician performance reviews and payroll incentive calculations.'
  },
  {
    id: 'join-multi-encounter',
    title: 'Multi-Table JOIN: 6-Table Complete Clinical & Billing Encounter',
    category: 'Joins',
    purpose: 'Demonstrates multi-table relational navigation joining Appointment, Patient, Doctor, Prescription, Bill, and Payment.',
    query: `SELECT 
    a.appointment_id,
    a.appointment_date,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    pr.diagnosis,
    b.amount AS gross_bill,
    b.discount,
    (b.amount - b.discount) AS net_payable,
    b.status AS bill_status,
    pay.method AS payment_method,
    pay.utr
FROM Appointment a
INNER JOIN Patient p ON a.p_id = p.p_id
INNER JOIN Doctor d ON a.doctor_id = d.id
LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
LEFT JOIN Payment pay ON b.bill_id = pay.bill_id
ORDER BY a.appointment_id;`,
    explanation: {
      'INNER JOIN Patient & Doctor': 'Every appointment must strictly reference a valid patient and physician.',
      'LEFT JOIN Prescription': 'Includes diagnosis if the consultation was completed and prescribed.',
      'LEFT JOIN Bill & Payment': 'Navigates relational cascade from Appointment -> Bill -> Payment.'
    },
    expectedOutput: 'Full clinical journey showing patient, doctor, diagnosis, billing, and payment method.',
    realWorldUse: 'Master audit log for medical insurance claims and hospital administration.'
  },

  // ------------------------------------------------------------
  // NESTED QUERIES
  // ------------------------------------------------------------
  {
    id: 'nested-patients-above-avg',
    title: 'Nested Query: Patients with More Appointments Than Average',
    category: 'Nested',
    purpose: 'Filter patients whose appointment count exceeds the average appointment frequency across all patients.',
    query: `SELECT 
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
);`,
    explanation: {
      'Inner Subquery': 'Groups appointments by patient to compute the distribution, then calculates the cohort mean.',
      'HAVING': 'Filters aggregated groups whose individual visit count strictly exceeds that inner scalar mean.',
      'GROUP BY': 'Aggregates appointments at the patient level.'
    },
    expectedOutput: 'Patients who visit the hospital more frequently than the average patient.',
    realWorldUse: 'Identifies chronic illness patients who qualify for coordinated care plans.'
  },
  {
    id: 'nested-doctors-above-avg-fee',
    title: 'Nested Query: Doctors Charging Above Average Consultation Fee',
    category: 'Nested',
    purpose: 'Find doctors whose consultation fee is higher than the mean hospital consultation fee.',
    query: `SELECT 
    id,
    CONCAT('Dr. ', f_name, ' ', l_name) AS doctor_name,
    qualification,
    consult_fee,
    ROUND((SELECT AVG(consult_fee) FROM Doctor), 2) AS hospital_avg_fee,
    ROUND(consult_fee - (SELECT AVG(consult_fee) FROM Doctor), 2) AS fee_difference
FROM Doctor
WHERE consult_fee > (SELECT AVG(consult_fee) FROM Doctor)
ORDER BY consult_fee DESC;`,
    explanation: {
      'Scalar Subquery': '(SELECT AVG(consult_fee) FROM Doctor) computes the hospital-wide fee benchmark.',
      'WHERE consult_fee > (...)': 'Filters records against the dynamically computed scalar average.',
      'ORDER BY consult_fee DESC': 'Sorts from highest premium specialist down to average.'
    },
    expectedOutput: 'List of senior specialists who command premium consultation charges.',
    realWorldUse: 'Hospital pricing strategy and insurance tier classification.'
  },
  {
    id: 'nested-medicines-never-prescribed',
    title: 'Nested Query: Medicines That Have Never Been Prescribed',
    category: 'Nested',
    purpose: 'Identify dormant pharmacy inventory items that have never appeared on any prescription.',
    query: `SELECT 
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
ORDER BY m.in_stock DESC;`,
    explanation: {
      'Inner Subquery': 'Gathers the set of all medicine IDs that have been written in prescriptions.',
      'NOT IN': 'Selects inventory records whose primary key does not exist in the prescribed set.',
      'WHERE pm.medicine_id IS NOT NULL': 'Safeguards against SQL NULL-propagation semantics in NOT IN.'
    },
    expectedOutput: 'List of medicines that have 0 historical prescriptions.',
    realWorldUse: 'Pharmacy inventory audits to liquidate unsold stock before expiration.'
  },

  // ------------------------------------------------------------
  // CORRELATED QUERIES
  // ------------------------------------------------------------
  {
    id: 'correlated-doctors-with-appointments',
    title: 'Correlated Query: Doctors with at Least One Appointment (EXISTS)',
    category: 'Correlated',
    purpose: 'Use correlated subquery with EXISTS to locate physicians who have had clinical bookings.',
    query: `SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.qualification,
    d.city
FROM Doctor d
WHERE EXISTS (
    SELECT 1 
    FROM Appointment a 
    WHERE a.doctor_id = d.id
);`,
    explanation: {
      'Correlated Reference': 'a.doctor_id = d.id binds the inner appointment lookup to the outer candidate doctor row.',
      'EXISTS': 'Short-circuits immediately upon encountering the first matching tuple, maximizing execution speed.',
      'SELECT 1': 'Standard convention inside EXISTS as column values are not retrieved.'
    },
    expectedOutput: 'All doctors who have handled at least one patient appointment.',
    realWorldUse: 'Populating active doctor directories on the patient booking portal.'
  },
  {
    id: 'correlated-patients-visited-doctor',
    title: 'Correlated Query: Patients Who Consulted Dr. Rajesh Sen (Cardiologist)',
    category: 'Correlated',
    purpose: 'Locate all patients who have consulted a specific specialist using correlated subquery.',
    query: `SELECT 
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
);`,
    explanation: {
      'WHERE a.p_id = p.p_id': 'Correlates patient tuple with appointment history.',
      'JOIN Doctor d': 'Verifies the appointment was with the specified physician.',
      'Filter': 'Restricts to Dr. Rajesh Sen.'
    },
    expectedOutput: 'List of cardiac patients who have appointments with Dr. Rajesh Sen.',
    realWorldUse: 'Targeted recall notifications for follow-up cardiology tests (ECG, Lipid Profile).'
  },
  {
    id: 'correlated-doctors-above-city-avg',
    title: 'Correlated Query: Doctors Exceeding City Appointment Average',
    category: 'Correlated',
    purpose: 'Find doctors whose workload is higher than the average for doctors in their specific city.',
    query: `SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.city,
    COUNT(a.appointment_id) AS doc_appointments
FROM Doctor d
LEFT JOIN Appointment a ON d.id = a.doctor_id
GROUP BY d.id, d.f_name, d.l_name, d.city
HAVING COUNT(a.appointment_id) >= (
    SELECT AVG(city_counts.total)
    FROM (
        SELECT d2.city, COUNT(a2.appointment_id) AS total
        FROM Doctor d2
        LEFT JOIN Appointment a2 ON d2.id = a2.doctor_id
        GROUP BY d2.id, d2.city
    ) AS city_counts
    WHERE city_counts.city = d.city
);`,
    explanation: {
      'Correlated City Filter': 'city_counts.city = d.city evaluates the benchmark specific to each doctor\'s city.',
      'HAVING >=': 'Compares doctor appointment count with that regional average.',
      'LEFT JOIN': 'Accounts for doctors with zero appointments in the denominator.'
    },
    expectedOutput: 'Doctors who are handling above-average patient loads in their geographical branch.',
    realWorldUse: 'Balancing doctor workload across hospital network branches.'
  },

  // ------------------------------------------------------------
  // COMMON TABLE EXPRESSIONS (CTE)
  // ------------------------------------------------------------
  {
    id: 'cte-monthly-revenue',
    title: 'CTE: Monthly Hospital Revenue & Transaction Analytics',
    category: 'CTE',
    purpose: 'Demonstrate Common Table Expressions to calculate monthly financial performance metrics.',
    query: `WITH MonthlyData AS (
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
ORDER BY billing_month DESC;`,
    explanation: {
      'WITH MonthlyData AS (...)': 'Encapsulates complex aggregation into an isolated, readable temporary result set.',
      'DATE_FORMAT(p.payment_date, \'%Y-%m\')': 'Groups transactions by Year-Month string.',
      'SUM(p.amount)': 'Aggregates total gross collected revenue.',
      'Main SELECT': 'Consumes the CTE to format currency and round figures.'
    },
    expectedOutput: 'Chronological breakdown of hospital revenue and average invoice size per month.',
    realWorldUse: 'CFO monthly revenue reporting and financial forecasting.'
  },
  {
    id: 'cte-doctor-stats',
    title: 'CTE: Doctor Workload, Completion Rate & Revenue Breakdown',
    category: 'CTE',
    purpose: 'Multi-CTE construct joining clinical workload with billing performance.',
    query: `WITH DoctorStats AS (
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
ORDER BY total_revenue_generated DESC;`,
    explanation: {
      'DoctorStats CTE': 'Aggregates appointment statuses per doctor.',
      'DoctorRevenue CTE': 'Aggregates collected revenue for paid bills.',
      'Main Query': 'Combines both CTEs and computes completion rate percentage.'
    },
    expectedOutput: 'Doctor KPI scorecard with completion percentages and total billing.',
    realWorldUse: 'Annual hospital medical staff appraisal and productivity review.'
  },
  {
    id: 'cte-patient-tiers',
    title: 'CTE: Patient Healthcare Loyalty & Expenditure Tiers',
    category: 'CTE',
    purpose: 'Classify patients into loyalty tiers using CTE aggregation and conditional expressions.',
    query: `WITH PatientTotals AS (
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
ORDER BY total_spent DESC;`,
    explanation: {
      'PatientTotals CTE': 'Aggregates visits and paid invoices for each patient.',
      'CASE WHEN expression': 'Categorizes patients into Platinum, Gold, Silver tiers based on visit count.',
      'LEFT JOINs': 'Ensures registered patients with zero spend are captured.'
    },
    expectedOutput: 'Ranked list of patients with tiered classifications.',
    realWorldUse: 'Offering priority slot booking or discounts to regular hospital patients.'
  },

  // ------------------------------------------------------------
  // RECURSIVE CTE
  // ------------------------------------------------------------
  {
    id: 'recursive-cte-calendar',
    title: 'RECURSIVE CTE: 20-Day Continuous Appointment Trend Generator',
    category: 'Recursive CTE',
    purpose: 'Generate an unbroken sequence of consecutive dates and count appointments, displaying 0 for quiet days.',
    query: `WITH RECURSIVE DateSeries AS (
    SELECT CAST('2025-01-01' AS DATE) AS calendar_date
    UNION ALL
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
ORDER BY ds.calendar_date;`,
    explanation: {
      'Anchor Member': 'SELECT CAST(\'2025-01-01\' AS DATE) establishes the starting base tuple.',
      'Recursive Member': 'Increments calendar_date by 1 day until reaching the termination predicate < 2025-01-20.',
      'UNION ALL': 'Appends each recursive iteration to the virtual table.',
      'LEFT JOIN Appointment': 'Ensures days with 0 appointments appear with count 0 rather than being skipped.'
    },
    expectedOutput: 'Continuous calendar table displaying daily appointments without missing dates.',
    realWorldUse: 'Used in analytical line charts to avoid irregular date gaps in trend visualization.'
  },

  // ------------------------------------------------------------
  // FUNCTIONS
  // ------------------------------------------------------------
  {
    id: 'function-patient-age',
    title: 'Stored Function: calculate_patient_age(dob)',
    category: 'Functions',
    purpose: 'Demonstrate MySQL user-defined function computing dynamic age via TIMESTAMPDIFF.',
    query: `SELECT 
    p.p_id,
    CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
    p.dob,
    calculate_patient_age(p.dob) AS calculated_age
FROM Patient p
LIMIT 5;`,
    explanation: {
      'calculate_patient_age(p.dob)': 'Invokes custom stored function defined with TIMESTAMPDIFF(YEAR, p_dob, CURDATE()).',
      'DETERMINISTIC / Safe': 'Encapsulates business logic directly inside the database engine.'
    },
    expectedOutput: 'Patient profiles with dynamic age calculated on-the-fly.',
    realWorldUse: 'Ensures age is never stored as a static column which becomes outdated every year.'
  },
  {
    id: 'function-doctor-experience-tier',
    title: 'Stored Function: get_doctor_experience_category(experience)',
    category: 'Functions',
    purpose: 'Demonstrate function categorizing doctor years into Junior, Mid-Level, Senior, Expert.',
    query: `SELECT 
    d.id,
    CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
    d.experience AS years_experience,
    get_doctor_experience_category(d.experience) AS seniority_tier
FROM Doctor d;`,
    explanation: {
      'Function Call': 'Evaluates experience integer and branches through CASE logic inside MySQL.',
      'Clean Code': 'Avoids duplicate IF-ELSE branching in the client application.'
    },
    expectedOutput: 'Doctor records with their seniority classification.',
    realWorldUse: 'Displaying experience badges in doctor search results.'
  },
  {
    id: 'function-final-bill',
    title: 'Stored Function: calculate_final_bill(amount, discount)',
    category: 'Functions',
    purpose: 'Demonstrate function returning net payable bill amount.',
    query: `SELECT 
    b.bill_id,
    b.amount AS gross_amount,
    b.discount,
    calculate_final_bill(b.amount, b.discount) AS net_payable,
    b.status
FROM Bill b
LIMIT 5;`,
    explanation: {
      'calculate_final_bill': 'Subtracts discount from total amount and ensures non-negative return value.',
      'Single Source of Truth': 'Ensures net calculation consistency across accounting reports.'
    },
    expectedOutput: 'Bills showing gross, discount, and computed net payable.',
    realWorldUse: 'Billing counter checkout receipts.'
  },

  // ------------------------------------------------------------
  // DDL & INDEXES
  // ------------------------------------------------------------
  {
    id: 'ddl-show-indexes',
    title: 'DDL: Inspect Database Indexes on Appointment Table',
    category: 'DDL',
    purpose: 'Examine active indexes and constraints configured on the Appointment table.',
    query: `SHOW INDEX FROM Appointment;`,
    explanation: {
      'SHOW INDEX': 'Displays all B-Tree indexes, column mappings, and uniqueness properties.',
      'Key_name': 'Includes primary key and secondary indexes created for foreign keys and queries.'
    },
    expectedOutput: 'Index table including idx_appointment_p_id, idx_appointment_doctor_id, etc.',
    realWorldUse: 'Database tuning and query optimization during DBA reviews.'
  },
  {
    id: 'ddl-table-status',
    title: 'DDL: Inspect InnoDB Storage Engine & Table Status',
    category: 'DDL',
    purpose: 'Verify that all 10 core healthcare tables utilize InnoDB storage engine for ACID support.',
    query: `SELECT 
    table_name,
    engine,
    table_rows,
    data_length,
    index_length
FROM information_schema.tables
WHERE table_schema = 'smart_healthcare'
ORDER BY table_name;`,
    explanation: {
      'information_schema.tables': 'MySQL data dictionary exposing catalog metadata.',
      'engine = InnoDB': 'Confirms ACID transaction support and row-level locking.'
    },
    expectedOutput: 'List of all 10+ tables showing InnoDB engine and storage allocations.',
    realWorldUse: 'Database administrative monitoring and capacity planning.'
  }
];

