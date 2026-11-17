-- ============================================================
-- Smart Healthcare – Triggers
-- ============================================================

USE smart_healthcare;

DELIMITER $$

-- ------------------------------------------------------------
-- 1. trg_prevent_negative_stock
--    BEFORE INSERT on Prescription_Medicine
--    Prevents prescribing a medicine if available stock is
--    insufficient (stock < duration_days).
-- ------------------------------------------------------------
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
            SET MESSAGE_TEXT = 'Insufficient medicine stock to fulfill this prescription.';
    END IF;
END$$

-- ------------------------------------------------------------
-- 2. trg_reduce_stock
--    AFTER INSERT on Prescription_Medicine
--    Automatically reduces medicine stock by the prescribed
--    duration_days when a prescription-medicine mapping is added.
-- ------------------------------------------------------------
CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON Prescription_Medicine
FOR EACH ROW
BEGIN
    UPDATE Medicine
    SET in_stock = in_stock - NEW.duration_days
    WHERE id = NEW.medicine_id;
END$$

-- ------------------------------------------------------------
-- 3. trg_update_bill_on_payment
--    AFTER INSERT on Payment
--    When a payment with status 'Success' is recorded, the
--    corresponding bill is automatically marked as 'Paid'.
-- ------------------------------------------------------------
CREATE TRIGGER trg_update_bill_on_payment
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Success' THEN
        UPDATE Bill
        SET status = 'Paid'
        WHERE bill_id = NEW.bill_id;
    END IF;
END$$

-- ------------------------------------------------------------
-- 4. trg_log_appointment_changes
--    AFTER UPDATE on Appointment
--    Logs appointment status changes. In a production setup the
--    audit record is written to the MongoDB audit_logs collection
--    via an application-level hook or UDF bridge. This trigger
--    serves as a placeholder / documentation point.
-- ------------------------------------------------------------
CREATE TRIGGER trg_log_appointment_changes
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN
    -- NOTE: Actual audit logging is handled by the application layer
    -- which writes to MongoDB's audit_logs collection with the
    -- following payload:
    --   {
    --     action        : "UPDATE",
    --     entity_type   : "Appointment",
    --     entity_id     : NEW.appointment_id,
    --     user_id       : <session_user>,
    --     changes       : {
    --         old_status : OLD.status,
    --         new_status : NEW.status
    --     },
    --     timestamp     : ISODate()
    --   }
    --
    -- This trigger is intentionally left as a no-op in MySQL.
    -- If you wish to log within MySQL, uncomment and create an
    -- audit table, then INSERT into it here.

    BEGIN
    END;
END$$

DELIMITER ;
