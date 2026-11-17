-- ============================================================
-- Smart Healthcare – User-Defined Functions
-- ============================================================

USE smart_healthcare;

DELIMITER $$

-- ------------------------------------------------------------
-- 1. calculate_patient_age
--    Returns the age of a patient in years based on their DOB.
-- ------------------------------------------------------------
CREATE FUNCTION calculate_patient_age(p_dob DATE)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END$$

-- ------------------------------------------------------------
-- 2. calculate_final_bill
--    Returns the final payable amount after subtracting discount.
-- ------------------------------------------------------------
CREATE FUNCTION calculate_final_bill(
    p_amount   DECIMAL(10,2),
    p_discount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    RETURN p_amount - p_discount;
END$$

-- ------------------------------------------------------------
-- 3. get_doctor_experience_category
--    Classifies a doctor's seniority based on years of experience.
--    0-3   → Junior
--    4-7   → Mid-Level
--    8-15  → Senior
--    16+   → Expert
-- ------------------------------------------------------------
CREATE FUNCTION get_doctor_experience_category(p_experience INT)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    IF p_experience <= 3 THEN
        RETURN 'Junior';
    ELSEIF p_experience <= 7 THEN
        RETURN 'Mid-Level';
    ELSEIF p_experience <= 15 THEN
        RETURN 'Senior';
    ELSE
        RETURN 'Expert';
    END IF;
END$$

DELIMITER ;
