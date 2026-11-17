import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Apply auth to all patient routes
router.use(authenticateUser);

/**
 * GET /api/patients
 * List patients with optional search by name, email, or city
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        p.*, 
        calculate_patient_age(p.dob) AS age,
        (SELECT COUNT(*) FROM Appointment a WHERE a.p_id = p.p_id) AS total_appointments
      FROM Patient p
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE p.f_name LIKE ? OR p.l_name LIKE ? OR p.email LIKE ? OR p.city LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY p.p_id ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:id
 * Get patient profile by p_id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, calculate_patient_age(p.dob) AS age FROM Patient p WHERE p.p_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/patients
 * Create new patient record
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      supabase_user_id,
      f_name,
      l_name,
      email,
      gender,
      blood_group,
      dob,
      street,
      city,
      pincode
    } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Patient (supabase_user_id, f_name, l_name, email, gender, blood_group, dob, street, city, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supabase_user_id || null, f_name, l_name, email, gender, blood_group, dob, street, city, pincode]
    );

    res.status(201).json({
      success: true,
      message: 'Patient profile created',
      data: { p_id: result.insertId }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/patients/:id
 * Update patient profile
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { f_name, l_name, email, gender, blood_group, dob, street, city, pincode } = req.body;

    await pool.query(
      `UPDATE Patient 
       SET f_name = ?, l_name = ?, email = ?, gender = ?, blood_group = ?, dob = ?, street = ?, city = ?, pincode = ?
       WHERE p_id = ?`,
      [f_name, l_name, email, gender, blood_group, dob, street, city, pincode, id]
    );

    res.json({ success: true, message: 'Patient profile updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/patients/:id
 * Delete patient profile (Admin only)
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Patient WHERE p_id = ?', [id]);
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:id/appointments
 * Get patient appointments with doctor details
 */
router.get('/:id/appointments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.appointment_id,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        a.appointment_time,
        a.status,
        d.id AS doctor_id,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        d.consult_fee,
        b.bill_id,
        b.amount AS bill_amount,
        b.status AS bill_status
       FROM Appointment a
       INNER JOIN Doctor d ON a.doctor_id = d.id
       LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
       WHERE a.p_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:id/prescriptions
 * Get patient's clinical prescriptions with doctor details
 */
router.get('/:id/prescriptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pr.pers_id,
        pr.appointment_id,
        pr.symptoms,
        pr.diagnosis,
        pr.prescribed_date,
        pr.follow_up_date,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        a.appointment_date
       FROM Prescription pr
       INNER JOIN Appointment a ON pr.appointment_id = a.appointment_id
       INNER JOIN Doctor d ON a.doctor_id = d.id
       WHERE a.p_id = ?
       ORDER BY pr.prescribed_date DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patients/:id/bills
 * Get billing and payment history
 */
router.get('/:id/bills', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id,
        b.appointment_id,
        b.bill_date,
        b.amount,
        b.discount,
        calculate_final_bill(b.amount, b.discount) AS final_amount,
        b.status AS bill_status,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        pay.payment_id,
        pay.utr,
        pay.method AS payment_method,
        pay.status AS payment_status,
        pay.payment_date
       FROM Bill b
       INNER JOIN Appointment a ON b.appointment_id = a.appointment_id
       INNER JOIN Doctor d ON a.doctor_id = d.id
       LEFT JOIN Payment pay ON b.bill_id = pay.bill_id
       WHERE a.p_id = ?
       ORDER BY b.bill_date DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

