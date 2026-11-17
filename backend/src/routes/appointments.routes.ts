import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/appointments
 * List appointments with filters (patient_id, doctor_id, status, date)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, doctor_id, status, date } = req.query;

    let query = `
      SELECT 
        a.appointment_id,
        a.p_id,
        a.doctor_id,
        a.availability_id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        a.appointment_time,
        a.status,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        p.blood_group,
        calculate_patient_age(p.dob) AS patient_age,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        d.consult_fee,
        b.bill_id,
        b.amount AS bill_amount,
        b.status AS bill_status,
        pr.pers_id
      FROM Appointment a
      INNER JOIN Patient p ON a.p_id = p.p_id
      INNER JOIN Doctor d ON a.doctor_id = d.id
      LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
      LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (patient_id) {
      query += ` AND a.p_id = ?`;
      params.push(patient_id);
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctor_id);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/appointments/:id
 * Get single appointment with complete encounter metadata
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.*,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        p.gender AS patient_gender,
        p.blood_group,
        calculate_patient_age(p.dob) AS patient_age,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        d.consult_fee,
        b.bill_id,
        b.amount AS bill_amount,
        b.discount AS bill_discount,
        calculate_final_bill(b.amount, b.discount) AS final_bill_amount,
        b.status AS bill_status,
        pr.pers_id,
        pr.symptoms,
        pr.diagnosis
       FROM Appointment a
       INNER JOIN Patient p ON a.p_id = p.p_id
       INNER JOIN Doctor d ON a.doctor_id = d.id
       LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
       LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/appointments
 * Book appointment - Demonstrates ACID transaction and Stored Procedure
 * Prevents double-booking using SELECT ... FOR UPDATE or stored procedure
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    let { p_id, doctor_id, availability_id, appointment_date, appointment_time } = req.body;

    if (!p_id || !doctor_id || !appointment_date || !appointment_time) {
      res.status(400).json({ error: 'Patient, doctor, appointment date, and time are required' });
      return;
    }

    // Ensure clean YYYY-MM-DD date format for MySQL
    let cleanDate = String(appointment_date);
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    } else if (cleanDate.length > 10) {
      cleanDate = cleanDate.slice(0, 10);
    }

    // Ensure clean HH:MM:SS time format for MySQL
    let cleanTime = String(appointment_time);
    if (cleanTime.length > 8) {
      cleanTime = cleanTime.slice(0, 8);
    } else if (cleanTime.length === 5) {
      cleanTime = `${cleanTime}:00`;
    }

    const patientId = Number(p_id);
    const doctorId = Number(doctor_id);

    // If no availability slot provided, dynamically create an available slot for this doctor
    if (!availability_id) {
      const parts = cleanTime.split(':');
      const nextHour = String((Number(parts[0]) + 1) % 24).padStart(2, '0');
      const endTime = `${nextHour}:${parts[1] || '00'}:00`;

      const [slotRes] = await connection.query<ResultSetHeader>(
        'INSERT INTO Doctor_Availability (doctor_id, date, st_time, end_time, status) VALUES (?, ?, ?, ?, "Available")',
        [doctorId, cleanDate, cleanTime, endTime]
      );
      availability_id = slotRes.insertId;
    }

    const availabilityId = Number(availability_id);

    // Try calling MySQL stored procedure book_appointment first
    try {
      const [procResult]: any = await connection.query(
        'CALL book_appointment(?, ?, ?, ?, ?, @new_apt_id)',
        [patientId, doctorId, availabilityId, cleanDate, cleanTime]
      );
      const [outResult]: any = await connection.query('SELECT @new_apt_id AS appointment_id');
      const newAptId = outResult[0]?.appointment_id;

      if (newAptId) {
        // Also automatically generate a pending bill based on doctor's consultation fee
        const [docRows] = await connection.query<RowDataPacket[]>(
          'SELECT consult_fee FROM Doctor WHERE id = ?',
          [doctorId]
        );
        const fee = docRows[0]?.consult_fee || 500.00;

        await connection.query(
          'INSERT INTO Bill (appointment_id, bill_date, amount, discount, status) VALUES (?, ?, ?, 0.00, "Pending")',
          [newAptId, cleanDate, fee]
        );

        res.status(201).json({
          success: true,
          message: 'Appointment booked successfully via stored procedure',
          data: { appointment_id: newAptId }
        });
        return;
      }
    } catch (procErr: any) {
      console.log('Stored procedure notice, falling back to manual InnoDB transaction:', procErr.message);
    }

    // Manual ACID transaction fallback with row-level locking
    await connection.beginTransaction();

    // Row-level lock on availability slot to prevent race condition double-booking
    const [availRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM Doctor_Availability WHERE availability_id = ? FOR UPDATE',
      [availabilityId]
    );

    if (availRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Availability slot not found' });
      return;
    }

    if (availRows[0].status !== 'Available') {
      await connection.rollback();
      res.status(409).json({ error: 'Slot is already booked or unavailable' });
      return;
    }

    // Insert Appointment
    const [aptResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status)
       VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
      [patientId, doctorId, availabilityId, cleanDate, cleanTime]
    );

    const appointmentId = aptResult.insertId;

    // Update availability slot to Booked
    await connection.query(
      `UPDATE Doctor_Availability SET status = 'Booked' WHERE availability_id = ?`,
      [availabilityId]
    );

    // Create pending bill
    const [doc] = await connection.query<RowDataPacket[]>(
      'SELECT consult_fee FROM Doctor WHERE id = ?',
      [doctorId]
    );
    const consultFee = doc[0]?.consult_fee || 500.00;

    await connection.query(
      `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status)
       VALUES (?, ?, ?, 0.00, 'Pending')`,
      [appointmentId, cleanDate, consultFee]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully via ACID transaction',
      data: { appointment_id: appointmentId }
    });
    return;
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message || 'Failed to book appointment' });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/appointments/:id/reschedule
 * Reschedule appointment to another slot
 */
router.put('/:id/reschedule', async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { new_availability_id, new_date, new_time } = req.body;

    await connection.beginTransaction();

    const [current] = await connection.query<RowDataPacket[]>(
      'SELECT availability_id FROM Appointment WHERE appointment_id = ?',
      [id]
    );

    if (current.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const oldAvailabilityId = current[0].availability_id;

    // Release old slot
    if (oldAvailabilityId) {
      await connection.query(
        "UPDATE Doctor_Availability SET status = 'Available' WHERE availability_id = ?",
        [oldAvailabilityId]
      );
    }

    // Reserve new slot
    await connection.query(
      "UPDATE Doctor_Availability SET status = 'Booked' WHERE availability_id = ?",
      [new_availability_id]
    );

    // Update appointment
    await connection.query(
      `UPDATE Appointment 
       SET availability_id = ?, appointment_date = ?, appointment_time = ?, status = 'Scheduled' 
       WHERE appointment_id = ?`,
      [new_availability_id, new_date, new_time, id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Appointment rescheduled successfully' });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/appointments/:id/cancel
 * Cancel appointment and free up the availability slot
 */
router.put('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [current] = await connection.query<RowDataPacket[]>(
      'SELECT availability_id FROM Appointment WHERE appointment_id = ?',
      [id]
    );

    if (current.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const availId = current[0].availability_id;

    // Free availability slot
    if (availId) {
      await connection.query(
        "UPDATE Doctor_Availability SET status = 'Available' WHERE availability_id = ?",
        [availId]
      );
    }

    // Mark appointment Cancelled
    await connection.query(
      "UPDATE Appointment SET status = 'Cancelled' WHERE appointment_id = ?",
      [id]
    );

    // Mark Bill cancelled if pending
    await connection.query(
      "UPDATE Bill SET status = 'Cancelled' WHERE appointment_id = ? AND status = 'Pending'",
      [id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Appointment cancelled and slot released' });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/appointments/:id/complete
 * Complete appointment using stored procedure complete_appointment
 */
router.put('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    try {
      await pool.query('CALL complete_appointment(?)', [id]);
    } catch {
      await pool.query("UPDATE Appointment SET status = 'Completed' WHERE appointment_id = ?", [id]);
    }

    res.json({ success: true, message: 'Appointment marked as Completed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

