-- ============================================================
-- Smart Healthcare – Stored Procedures
-- ============================================================

USE smart_healthcare;

DELIMITER $$

-- ------------------------------------------------------------
-- 1. book_appointment
--    Atomically books an appointment for a patient with a doctor.
--    Checks availability, inserts the appointment, and marks the
--    availability slot as 'Booked'. Rolls back on any error.
-- ------------------------------------------------------------
CREATE PROCEDURE book_appointment(
    IN  p_patient_id      INT,
    IN  p_doctor_id       INT,
    IN  p_availability_id INT,
    IN  p_date            DATE,
    IN  p_time            TIME,
    OUT p_appointment_id  INT
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_appointment_id = NULL;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error occurred while booking the appointment. Transaction rolled back.';
    END;

    START TRANSACTION;

    -- Verify the availability slot exists and is available
    SELECT status INTO v_status
    FROM Doctor_Availability
    WHERE availability_id = p_availability_id
      AND doctor_id = p_doctor_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Availability slot not found for the given doctor.';
    END IF;

    IF v_status != 'Available' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'The selected availability slot is not available.';
    END IF;

    -- Insert the appointment
    INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status)
    VALUES (p_patient_id, p_doctor_id, p_availability_id, p_date, p_time, 'Scheduled');

    SET p_appointment_id = LAST_INSERT_ID();

    -- Mark the slot as booked
    UPDATE Doctor_Availability
    SET status = 'Booked'
    WHERE availability_id = p_availability_id;

    COMMIT;
END$$

-- ------------------------------------------------------------
-- 2. complete_appointment
--    Marks an appointment as 'Completed'.
-- ------------------------------------------------------------
CREATE PROCEDURE complete_appointment(
    IN p_appointment_id INT
)
BEGIN
    UPDATE Appointment
    SET status = 'Completed'
    WHERE appointment_id = p_appointment_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Appointment not found or already in the desired state.';
    END IF;
END$$

-- ------------------------------------------------------------
-- 3. generate_bill
--    Creates a bill for a completed appointment.
-- ------------------------------------------------------------
CREATE PROCEDURE generate_bill(
    IN  p_appointment_id INT,
    IN  p_amount         DECIMAL(10,2),
    IN  p_discount       DECIMAL(10,2),
    OUT p_bill_id        INT
)
BEGIN
    INSERT INTO Bill (appointment_id, bill_date, amount, discount, status)
    VALUES (p_appointment_id, CURDATE(), p_amount, p_discount, 'Pending');

    SET p_bill_id = LAST_INSERT_ID();
END$$

-- ------------------------------------------------------------
-- 4. update_medicine_stock
--    Adjusts medicine stock by the given quantity.
--    Positive values add stock; negative values reduce stock.
-- ------------------------------------------------------------
CREATE PROCEDURE update_medicine_stock(
    IN p_medicine_id INT,
    IN p_quantity    INT
)
BEGIN
    DECLARE v_current_stock INT;

    SELECT in_stock INTO v_current_stock
    FROM Medicine
    WHERE id = p_medicine_id;

    IF v_current_stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Medicine not found.';
    END IF;

    IF (v_current_stock + p_quantity) < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock. Cannot reduce below zero.';
    END IF;

    UPDATE Medicine
    SET in_stock = in_stock + p_quantity
    WHERE id = p_medicine_id;
END$$

-- ------------------------------------------------------------
-- 5. get_patient_appointment_history
--    Returns the full appointment history of a patient including
--    doctor details, status, and timestamps.
-- ------------------------------------------------------------
CREATE PROCEDURE get_patient_appointment_history(
    IN p_patient_id INT
)
BEGIN
    SELECT
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status           AS appointment_status,
        d.id               AS doctor_id,
        CONCAT(d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        d.consult_fee,
        a.created_at       AS booked_on
    FROM Appointment a
    INNER JOIN Doctor d ON a.doctor_id = d.id
    WHERE a.p_id = p_patient_id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC;
END$$

DELIMITER ;
