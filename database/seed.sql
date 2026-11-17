-- ============================================================
-- Smart Healthcare Database Seed Data
-- 15 Patients, 10 Doctors, Phone Numbers, Availability,
-- Appointments, Prescriptions, Medicines, Prescription_Medicine,
-- Bills, Payments, user_roles
-- ============================================================

USE smart_healthcare;

-- ------------------------------------------------------------
-- 1. Demo User Roles & Profiles
-- ------------------------------------------------------------
-- Clear existing data if re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Payment;
TRUNCATE TABLE Bill;
TRUNCATE TABLE Prescription_Medicine;
TRUNCATE TABLE Medicine;
TRUNCATE TABLE Prescription;
TRUNCATE TABLE Appointment;
TRUNCATE TABLE Doctor_Availability;
TRUNCATE TABLE Doctor_Phone;
TRUNCATE TABLE Doctor;
TRUNCATE TABLE Patient;
TRUNCATE TABLE user_roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 2. Insert 15 Patients
-- ------------------------------------------------------------
INSERT INTO Patient (p_id, supabase_user_id, f_name, l_name, email, gender, blood_group, dob, street, city, pincode) VALUES
(1, 'demo-patient-uuid', 'Aarav', 'Sharma', 'aarav.sharma@example.com', 'Male', 'O+', '1990-05-15', '42 Park Street', 'Mumbai', '400001'),
(2, 'patient-uuid-002', 'Priya', 'Patel', 'priya.patel@example.com', 'Female', 'A+', '1985-08-22', '12 MG Road', 'Ahmedabad', '380001'),
(3, 'patient-uuid-003', 'Rohan', 'Verma', 'rohan.verma@example.com', 'Male', 'B+', '1995-12-10', '78 Brigade Road', 'Bangalore', '560001'),
(4, 'patient-uuid-004', 'Ananya', 'Iyer', 'ananya.iyer@example.com', 'Female', 'AB+', '1992-03-30', '15 Anna Salai', 'Chennai', '600002'),
(5, 'patient-uuid-005', 'Vikram', 'Singh', 'vikram.singh@example.com', 'Male', 'O-', '1980-07-18', '99 Connaught Place', 'Delhi', '110001'),
(6, 'patient-uuid-006', 'Sneha', 'Kulkarni', 'sneha.kulkarni@example.com', 'Female', 'A-', '1998-11-05', '23 FC Road', 'Pune', '411004'),
(7, 'patient-uuid-007', 'Rahul', 'Nair', 'rahul.nair@example.com', 'Male', 'B-', '1988-01-25', '67 Marine Drive', 'Kochi', '682011'),
(8, 'patient-uuid-008', 'Kavita', 'Reddy', 'kavita.reddy@example.com', 'Female', 'O+', '1993-09-14', '34 Banjara Hills', 'Hyderabad', '500034'),
(9, 'patient-uuid-009', 'Aditya', 'Chopra', 'aditya.chopra@example.com', 'Male', 'AB-', '1975-04-02', '88 Sector 17', 'Chandigarh', '160017'),
(10, 'patient-uuid-010', 'Neha', 'Gupta', 'neha.gupta@example.com', 'Female', 'B+', '2000-06-20', '101 Civil Lines', 'Jaipur', '302006'),
(11, 'patient-uuid-011', 'Arjun', 'Mehta', 'arjun.mehta@example.com', 'Male', 'A+', '1983-10-12', '55 Salt Lake', 'Kolkata', '700064'),
(12, 'patient-uuid-012', 'Pooja', 'Deshmukh', 'pooja.deshmukh@example.com', 'Female', 'O+', '1996-02-28', '19 Law College Road', 'Pune', '411004'),
(13, 'patient-uuid-013', 'Siddharth', 'Bose', 'siddharth.bose@example.com', 'Male', 'B+', '1991-07-07', '4 Ballygunge', 'Kolkata', '700019'),
(14, 'patient-uuid-014', 'Divya', 'Menon', 'divya.menon@example.com', 'Female', 'A+', '1987-05-19', '8 Panampilly Nagar', 'Kochi', '682036'),
(15, 'patient-uuid-015', 'Karan', 'Malhotra', 'karan.malhotra@example.com', 'Male', 'O+', '1994-09-08', '14 Rajpur Road', 'Dehradun', '248001');

-- ------------------------------------------------------------
-- 3. Insert 10 Doctors
-- ------------------------------------------------------------
INSERT INTO Doctor (id, supabase_user_id, f_name, l_name, email, qualification, experience, consult_fee, city, pincode) VALUES
(1, 'demo-doctor-uuid', 'Rajesh', 'Sen', 'dr.rajesh.sen@example.com', 'MBBS, MD (Cardiology)', 15, 1200.00, 'Mumbai', '400001'),
(2, 'doctor-uuid-002', 'Sunita', 'Rao', 'dr.sunita.rao@example.com', 'MBBS, MD (Dermatology)', 10, 800.00, 'Bangalore', '560001'),
(3, 'doctor-uuid-003', 'Amit', 'Kapoor', 'dr.amit.kapoor@example.com', 'MBBS, MS (Orthopedics)', 12, 1000.00, 'Delhi', '110001'),
(4, 'doctor-uuid-004', 'Meera', 'Nambiar', 'dr.meera.nambiar@example.com', 'MBBS, MD (Pediatrics)', 8, 700.00, 'Chennai', '600002'),
(5, 'doctor-uuid-005', 'Harish', 'Bhat', 'dr.harish.bhat@example.com', 'MBBS, DM (Neurology)', 18, 1500.00, 'Hyderabad', '500034'),
(6, 'doctor-uuid-006', 'Shalini', 'Joshi', 'dr.shalini.joshi@example.com', 'MBBS, MD (General Medicine)', 6, 500.00, 'Pune', '411004'),
(7, 'doctor-uuid-007', 'Manoj', 'Trivedi', 'dr.manoj.trivedi@example.com', 'MBBS, MS (ENT)', 9, 650.00, 'Ahmedabad', '380001'),
(8, 'doctor-uuid-008', 'Deepika', 'Chatterjee', 'dr.deepika.chatterjee@example.com', 'MBBS, MS (Ophthalmology)', 14, 900.00, 'Kolkata', '700064'),
(9, 'doctor-uuid-009', 'Sanjay', 'Vaidya', 'dr.sanjay.vaidya@example.com', 'MBBS, MD (Psychiatry)', 11, 1100.00, 'Mumbai', '400050'),
(10, 'doctor-uuid-010', 'Anjali', 'Kaur', 'dr.anjali.kaur@example.com', 'MBBS, MS (Gynecology)', 16, 1300.00, 'Chandigarh', '160017');

-- ------------------------------------------------------------
-- 4. Doctor Phone Numbers
-- ------------------------------------------------------------
INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES
(1, '+91-9820011223'),
(1, '+91-9820099887'),
(2, '+91-9845012345'),
(3, '+91-9811023456'),
(3, '+91-9811098765'),
(4, '+91-9844034567'),
(5, '+91-9849045678'),
(6, '+91-9822056789'),
(7, '+91-9825067890'),
(8, '+91-9830078901'),
(8, '+91-9830011122'),
(9, '+91-9821089012'),
(10, '+91-9814090123');

-- ------------------------------------------------------------
-- 5. User Roles (Including Demo Accounts)
-- ------------------------------------------------------------
INSERT INTO user_roles (supabase_user_id, role, mysql_ref_id) VALUES
('demo-admin-uuid', 'admin', 1),
('demo-patient-uuid', 'patient', 1),
('demo-doctor-uuid', 'doctor', 1),
('patient-uuid-002', 'patient', 2),
('patient-uuid-003', 'patient', 3),
('patient-uuid-004', 'patient', 4),
('patient-uuid-005', 'patient', 5),
('doctor-uuid-002', 'doctor', 2),
('doctor-uuid-003', 'doctor', 3),
('doctor-uuid-004', 'doctor', 4),
('doctor-uuid-005', 'doctor', 5);

-- ------------------------------------------------------------
-- 6. Doctor Availability Slots (30+ slots)
-- ------------------------------------------------------------
INSERT INTO Doctor_Availability (availability_id, doctor_id, date, st_time, end_time, status) VALUES
(1, 1, '2025-01-10', '09:00:00', '10:00:00', 'Booked'),
(2, 1, '2025-01-10', '10:30:00', '11:30:00', 'Booked'),
(3, 1, '2025-01-11', '09:00:00', '10:00:00', 'Booked'),
(4, 1, '2025-01-12', '14:00:00', '15:00:00', 'Available'),
(5, 2, '2025-01-10', '11:00:00', '12:00:00', 'Booked'),
(6, 2, '2025-01-11', '10:00:00', '11:00:00', 'Booked'),
(7, 2, '2025-01-12', '16:00:00', '17:00:00', 'Available'),
(8, 3, '2025-01-10', '14:00:00', '15:00:00', 'Booked'),
(9, 3, '2025-01-11', '15:00:00', '16:00:00', 'Booked'),
(10, 3, '2025-01-13', '09:00:00', '10:00:00', 'Available'),
(11, 4, '2025-01-10', '09:30:00', '10:30:00', 'Booked'),
(12, 4, '2025-01-11', '11:00:00', '12:00:00', 'Booked'),
(13, 4, '2025-01-14', '15:00:00', '16:00:00', 'Available'),
(14, 5, '2025-01-10', '16:00:00', '17:00:00', 'Booked'),
(15, 5, '2025-01-12', '10:00:00', '11:00:00', 'Booked'),
(16, 5, '2025-01-15', '11:30:00', '12:30:00', 'Available'),
(17, 6, '2025-01-10', '08:30:00', '09:30:00', 'Booked'),
(18, 6, '2025-01-11', '09:30:00', '10:30:00', 'Booked'),
(19, 6, '2025-01-13', '14:00:00', '15:00:00', 'Available'),
(20, 7, '2025-01-10', '10:00:00', '11:00:00', 'Booked'),
(21, 7, '2025-01-12', '11:00:00', '12:00:00', 'Booked'),
(22, 7, '2025-01-14', '16:00:00', '17:00:00', 'Available'),
(23, 8, '2025-01-11', '14:00:00', '15:00:00', 'Booked'),
(24, 8, '2025-01-13', '15:00:00', '16:00:00', 'Booked'),
(25, 8, '2025-01-15', '09:00:00', '10:00:00', 'Available'),
(26, 9, '2025-01-11', '16:00:00', '17:00:00', 'Booked'),
(27, 9, '2025-01-12', '17:00:00', '18:00:00', 'Booked'),
(28, 9, '2025-01-16', '10:00:00', '11:00:00', 'Available'),
(29, 10, '2025-01-11', '11:00:00', '12:00:00', 'Booked'),
(30, 10, '2025-01-13', '12:00:00', '13:00:00', 'Booked'),
(31, 10, '2025-01-16', '14:00:00', '15:00:00', 'Available'),
(32, 1, '2025-01-18', '09:00:00', '10:00:00', 'Available'),
(33, 2, '2025-01-18', '11:00:00', '12:00:00', 'Available'),
(34, 3, '2025-01-19', '14:00:00', '15:00:00', 'Available');

-- ------------------------------------------------------------
-- 7. Appointments (22 appointments)
-- ------------------------------------------------------------
INSERT INTO Appointment (appointment_id, p_id, doctor_id, availability_id, appointment_date, appointment_time, status) VALUES
(1, 1, 1, 1, '2025-01-10', '09:00:00', 'Completed'),
(2, 2, 1, 2, '2025-01-10', '10:30:00', 'Completed'),
(3, 3, 2, 5, '2025-01-10', '11:00:00', 'Completed'),
(4, 4, 3, 8, '2025-01-10', '14:00:00', 'Completed'),
(5, 5, 4, 11, '2025-01-10', '09:30:00', 'Completed'),
(6, 6, 5, 14, '2025-01-10', '16:00:00', 'Completed'),
(7, 7, 6, 17, '2025-01-10', '08:30:00', 'Completed'),
(8, 8, 7, 20, '2025-01-10', '10:00:00', 'Completed'),
(9, 1, 1, 3, '2025-01-11', '09:00:00', 'Scheduled'),
(10, 9, 2, 6, '2025-01-11', '10:00:00', 'Scheduled'),
(11, 10, 3, 9, '2025-01-11', '15:00:00', 'Scheduled'),
(12, 11, 4, 12, '2025-01-11', '11:00:00', 'Scheduled'),
(13, 12, 6, 18, '2025-01-11', '09:30:00', 'Scheduled'),
(14, 13, 8, 23, '2025-01-11', '14:00:00', 'Scheduled'),
(15, 14, 9, 26, '2025-01-11', '16:00:00', 'Cancelled'),
(16, 15, 10, 29, '2025-01-11', '11:00:00', 'Scheduled'),
(17, 2, 5, 15, '2025-01-12', '10:00:00', 'Scheduled'),
(18, 3, 7, 21, '2025-01-12', '11:00:00', 'Scheduled'),
(19, 4, 9, 27, '2025-01-12', '17:00:00', 'Scheduled'),
(20, 5, 8, 24, '2025-01-13', '15:00:00', 'Scheduled'),
(21, 6, 10, 30, '2025-01-13', '12:00:00', 'Scheduled'),
(22, 1, 2, 7, '2025-01-14', '16:00:00', 'Cancelled');

-- ------------------------------------------------------------
-- 8. Prescriptions (for completed appointments)
-- ------------------------------------------------------------
INSERT INTO Prescription (pers_id, appointment_id, symptoms, diagnosis, prescribed_date, follow_up_date) VALUES
(1, 1, 'Chest pain and shortness of breath upon exertion', 'Mild Angina Pectoris; Hypertension Stage 1', '2025-01-10', '2025-01-24'),
(2, 2, 'Irregular heartbeat sensations, fatigue', 'Sinus Tachycardia due to stress', '2025-01-10', '2025-01-25'),
(3, 3, 'Redness and dry scaly patches on elbows and scalp', 'Plaque Psoriasis', '2025-01-10', '2025-01-31'),
(4, 4, 'Severe knee joint pain, stiffness in morning', 'Osteoarthritis Grade 2', '2025-01-10', '2025-02-10'),
(5, 5, 'High fever (102 F), runny nose, persistent cough', 'Viral Upper Respiratory Infection', '2025-01-10', '2025-01-17'),
(6, 6, 'Recurrent unilateral throbbing headache with aura', 'Classic Migraine', '2025-01-10', '2025-02-14'),
(7, 7, 'Acidity, heartburn after meals, bloating', 'Gastroesophageal Reflux Disease (GERD)', '2025-01-10', '2025-01-24'),
(8, 8, 'Throat pain, difficulty swallowing, mild fever', 'Acute Tonsillitis', '2025-01-10', '2025-01-18');

-- ------------------------------------------------------------
-- 9. Medicines (16 Medicines)
-- ------------------------------------------------------------
INSERT INTO Medicine (id, name, category, price, in_stock) VALUES
(1, 'Aspirin 75mg', 'Antiplatelet', 35.00, 150),
(2, 'Atorvastatin 10mg', 'Lipid-lowering', 120.00, 80),
(3, 'Metoprolol 25mg', 'Beta Blocker', 85.00, 95),
(4, 'Clobetasol Propionate Cream', 'Topical Corticosteroid', 145.00, 45),
(5, 'Cetirizine 10mg', 'Antihistamine', 25.00, 200),
(6, 'Glucosamine Sulfate 500mg', 'Joint Supplement', 350.00, 30),
(7, 'Paracetamol 650mg (Dolo)', 'Analgesic/Antipyretic', 30.00, 300),
(8, 'Amoxicillin + Clavulanate 625mg', 'Antibiotic', 180.00, 60),
(9, 'Sumatriptan 50mg', 'Antimigraine', 210.00, 25),
(10, 'Naproxen 500mg', 'NSAID', 90.00, 75),
(11, 'Pantoprazole 40mg', 'Proton Pump Inhibitor', 110.00, 120),
(12, 'Domperidone 10mg', 'Antiemetic', 45.00, 110),
(13, 'Azithromycin 500mg', 'Antibiotic', 135.00, 85),
(14, 'Vitamin D3 60K UI', 'Supplement', 220.00, 90),
(15, 'Metformin 500mg', 'Antidiabetic', 40.00, 250),
(16, 'Montelukast + Levocetirizine', 'Antiallergic', 160.00, 5); -- Low stock (< 10) for analytics

-- ------------------------------------------------------------
-- 10. Prescription_Medicine Mappings
-- ------------------------------------------------------------
INSERT INTO Prescription_Medicine (pers_id, medicine_id, dosage, frequency, duration_days, instruction) VALUES
(1, 1, '75mg', 'Once daily', 30, 'Take after dinner with water'),
(1, 2, '10mg', 'Once daily at bedtime', 30, 'Avoid grapefruit juice'),
(1, 3, '25mg', 'Twice daily', 15, 'Monitor pulse before taking'),
(2, 3, '25mg', 'Once daily in morning', 14, 'Take after breakfast'),
(3, 4, 'Apply thin layer', 'Twice daily', 14, 'Apply on affected areas only'),
(3, 5, '10mg', 'Once daily at night', 10, 'May cause drowsiness'),
(4, 6, '500mg', 'Twice daily with meals', 30, 'Consistent daily intake recommended'),
(4, 10, '500mg', 'Twice daily as needed', 7, 'Take strictly after food'),
(5, 7, '650mg', 'Every 6-8 hours if fever > 100 F', 5, 'Do not exceed 4 tablets per day'),
(5, 8, '625mg', 'Twice daily after food', 5, 'Complete the full antibiotic course'),
(6, 9, '50mg', 'At onset of migraine attack', 3, 'Max 2 tablets in 24 hours'),
(6, 10, '500mg', 'Once if needed with Sumatriptan', 3, 'Take with plenty of water'),
(7, 11, '40mg', 'Once daily 30 min before breakfast', 14, 'Empty stomach with plain water'),
(7, 12, '10mg', 'Twice daily before meals', 7, 'Before breakfast and dinner'),
(8, 13, '500mg', 'Once daily 1 hour before meal', 3, 'Complete full 3-day course'),
(8, 7, '650mg', 'Twice daily for pain relief', 4, 'After food');

-- ------------------------------------------------------------
-- 11. Bills
-- ------------------------------------------------------------
INSERT INTO Bill (bill_id, appointment_id, bill_date, amount, discount, status) VALUES
(1, 1, '2025-01-10', 1440.00, 100.00, 'Paid'),
(2, 2, '2025-01-10', 1285.00, 50.00, 'Paid'),
(3, 3, '2025-01-10', 970.00, 0.00, 'Paid'),
(4, 4, '2025-01-10', 1440.00, 150.00, 'Paid'),
(5, 5, '2025-01-10', 910.00, 50.00, 'Paid'),
(6, 6, '2025-01-10', 1800.00, 100.00, 'Paid'),
(7, 7, '2025-01-10', 655.00, 0.00, 'Paid'),
(8, 8, '2025-01-10', 815.00, 0.00, 'Paid'),
(9, 9, '2025-01-11', 1200.00, 0.00, 'Pending'),
(10, 10, '2025-01-11', 800.00, 50.00, 'Pending'),
(11, 11, '2025-01-11', 1000.00, 0.00, 'Pending'),
(12, 12, '2025-01-11', 700.00, 0.00, 'Pending'),
(13, 13, '2025-01-11', 500.00, 0.00, 'Pending'),
(14, 14, '2025-01-11', 900.00, 0.00, 'Pending'),
(15, 15, '2025-01-11', 1100.00, 0.00, 'Cancelled');

-- ------------------------------------------------------------
-- 12. Payments
-- ------------------------------------------------------------
INSERT INTO Payment (payment_id, bill_id, utr, method, amount, status, payment_date) VALUES
(1, 1, 'UTR-20250110-001928374', 'UPI', 1340.00, 'Success', '2025-01-10 10:15:00'),
(2, 2, 'UTR-20250110-002938475', 'Card', 1235.00, 'Success', '2025-01-10 11:45:00'),
(3, 3, 'UTR-20250110-003847586', 'UPI', 970.00, 'Success', '2025-01-10 12:15:00'),
(4, 4, 'UTR-20250110-004758697', 'Net Banking', 1290.00, 'Success', '2025-01-10 15:30:00'),
(5, 5, 'UTR-20250110-005669708', 'Cash', 860.00, 'Success', '2025-01-10 10:45:00'),
(6, 6, 'UTR-20250110-006570819', 'Card', 1700.00, 'Success', '2025-01-10 17:15:00'),
(7, 7, 'UTR-20250110-007481920', 'UPI', 655.00, 'Success', '2025-01-10 09:45:00'),
(8, 8, 'UTR-20250110-008392031', 'UPI', 815.00, 'Success', '2025-01-10 11:00:00');

