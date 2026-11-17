import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

/**
 * GET /api/doctors
 * Public / Authenticated search and filter for doctors
 * Filters: qualification, experience_min, experience_max, city, search
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { qualification, experience_min, experience_max, city, search } = req.query;

    let query = `
      SELECT 
        d.*,
        get_doctor_experience_category(d.experience) AS experience_tier,
        (SELECT GROUP_CONCAT(phone_no SEPARATOR ', ') FROM Doctor_Phone dp WHERE dp.doctor_id = d.id) AS phone_numbers,
        (SELECT COUNT(*) FROM Appointment a WHERE a.doctor_id = d.id AND a.status = 'Completed') AS completed_consultations
      FROM Doctor d
      WHERE 1=1
    `;
    const params: any[] = [];

    if (qualification) {
      query += ` AND d.qualification LIKE ?`;
      params.push(`%${qualification}%`);
    }

    if (experience_min) {
      query += ` AND d.experience >= ?`;
      params.push(Number(experience_min));
    }

    if (experience_max) {
      query += ` AND d.experience <= ?`;
      params.push(Number(experience_max));
    }

    if (city) {
      query += ` AND d.city LIKE ?`;
      params.push(`%${city}%`);
    }

    if (search) {
      query += ` AND (d.f_name LIKE ? OR d.l_name LIKE ? OR d.qualification LIKE ? OR d.city LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY d.experience DESC, d.consult_fee ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctors/:id
 * Get doctor profile with phones and availability
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [doctorRows] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, get_doctor_experience_category(d.experience) AS experience_tier FROM Doctor d WHERE d.id = ?`,
      [id]
    );

    if (doctorRows.length === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    const [phoneRows] = await pool.query<RowDataPacket[]>(
      `SELECT phone_no FROM Doctor_Phone WHERE doctor_id = ?`,
      [id]
    );

    const doctor = {
      ...doctorRows[0],
      phone_numbers: phoneRows.map(p => p.phone_no)
    };

    res.json({ success: true, data: doctor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/doctors
 * Add doctor (Admin only)
 */
router.post('/', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const {
      supabase_user_id,
      f_name,
      l_name,
      email,
      password,
      qualification,
      experience,
      consult_fee,
      city,
      pincode,
      phones = []
    } = req.body;

    if (!f_name || !l_name || !email) {
      res.status(400).json({ error: 'First name, last name, and email are required' });
      return;
    }

    const doctorUid = supabase_user_id || `doctor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const doctorPass = password && password.trim() ? password.trim() : 'Doctor@123';

    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO Doctor (supabase_user_id, f_name, l_name, email, password, qualification, experience, consult_fee, city, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doctorUid, f_name, l_name, email, doctorPass, qualification || 'MBBS', experience || 0, consult_fee || 500, city || '', pincode || '']
    );

    const docId = result.insertId;

    // Insert phone numbers
    for (const phone of phones) {
      if (phone && phone.trim()) {
        await connection.query(
          `INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES (?, ?)`,
          [docId, phone.trim()]
        );
      }
    }

    // Insert user role mapping for RBAC
    await connection.query(
      `INSERT INTO user_roles (supabase_user_id, role, mysql_ref_id) VALUES (?, 'doctor', ?)`,
      [doctorUid, docId]
    );

    // Auto-generate 3 availability slots for the new doctor for immediate patient booking
    const today = new Date();
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);
      const dateStr = slotDate.toISOString().split('T')[0];

      await connection.query(
        `INSERT INTO Doctor_Availability (doctor_id, date, st_time, end_time, status) VALUES 
         (?, ?, '10:00:00', '11:00:00', 'Available'),
         (?, ?, '11:00:00', '12:00:00', 'Available'),
         (?, ?, '14:00:00', '15:00:00', 'Available')`,
        [docId, dateStr, docId, dateStr, docId, dateStr]
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Doctor Dr. ${f_name} ${l_name} added successfully with default availability slots.`,
      data: { id: docId, email, role: 'doctor' }
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Add doctor error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A doctor with this email address already exists.' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create doctor' });
    }
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/doctors/:id
 * Update/modify doctor details (Admin only)
 */
router.put('/:id', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { f_name, l_name, email, password, qualification, experience, consult_fee, city, pincode, phone } = req.body;

    // 1. Fetch current doctor
    const [existingRows] = await connection.query<RowDataPacket[]>('SELECT * FROM Doctor WHERE id = ?', [id]);
    if (!existingRows || existingRows.length === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    const current = existingRows[0];

    const new_f_name = f_name !== undefined && f_name !== null ? f_name : current.f_name;
    const new_l_name = l_name !== undefined && l_name !== null ? l_name : current.l_name;
    const new_email = email !== undefined && email !== null ? email : current.email;
    const new_qualification = qualification !== undefined && qualification !== null ? qualification : current.qualification;
    const new_experience = experience !== undefined && experience !== null ? Number(experience) : current.experience;
    const new_consult_fee = consult_fee !== undefined && consult_fee !== null ? Number(consult_fee) : current.consult_fee;
    const new_city = city !== undefined && city !== null ? city : current.city;
    const new_pincode = pincode !== undefined && pincode !== null ? pincode : current.pincode;

    await connection.beginTransaction();

    let updateSql = `
      UPDATE Doctor 
      SET f_name = ?, l_name = ?, email = ?, qualification = ?, experience = ?, consult_fee = ?, city = ?, pincode = ?
    `;
    const params: any[] = [
      new_f_name, 
      new_l_name, 
      new_email, 
      new_qualification, 
      new_experience, 
      new_consult_fee, 
      new_city, 
      new_pincode
    ];

    if (password && password.trim()) {
      updateSql += `, password = ?`;
      params.push(password.trim());
    }

    updateSql += ` WHERE id = ?`;
    params.push(id);

    await connection.query(updateSql, params);

    // Update phone number if provided
    if (phone && phone.trim()) {
      await connection.query('DELETE FROM Doctor_Phone WHERE doctor_id = ?', [id]);
      await connection.query('INSERT INTO Doctor_Phone (doctor_id, phone_no) VALUES (?, ?)', [id, phone.trim()]);
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: `Doctor Dr. ${new_f_name} ${new_l_name} details updated successfully.` 
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Update doctor error:', error);
    res.status(500).json({ error: error.message || 'Failed to update doctor details' });
  } finally {
    connection.release();
  }
});

/**
 * DELETE /api/doctors/:id
 * Delete doctor (Admin only)
 */
router.delete('/:id', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    // 1. Remove prescribed medicines under this doctor's appointments
    await connection.query(`
      DELETE FROM prescription_medicine 
      WHERE pers_id IN (
        SELECT pers_id FROM prescription 
        WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)
      )
    `, [id]);

    // 2. Remove prescriptions
    await connection.query(`
      DELETE FROM prescription 
      WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)
    `, [id]);

    // 3. Remove payments for bills generated under this doctor
    await connection.query(`
      DELETE FROM payment 
      WHERE bill_id IN (
        SELECT bill_id FROM bill 
        WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)
      )
    `, [id]);

    // 4. Remove bills under this doctor
    await connection.query(`
      DELETE FROM bill 
      WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)
    `, [id]);

    // 5. Remove appointments
    await connection.query('DELETE FROM appointment WHERE doctor_id = ?', [id]);

    // 6. Remove availability slots
    await connection.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [id]);

    // 7. Remove doctor phone records
    await connection.query('DELETE FROM doctor_phone WHERE doctor_id = ?', [id]);

    // 8. Remove user roles mapping
    await connection.query('DELETE FROM user_roles WHERE mysql_ref_id = ? AND role = "doctor"', [id]);

    // 9. Delete the doctor record
    await connection.query('DELETE FROM doctor WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true, message: 'Doctor record, appointments, schedule, and credentials deleted successfully.' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete doctor' });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/doctors/:id/availability
 * Get doctor's availability slots
 */
router.get('/:id/availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, status } = req.query;

    let query = `
      SELECT 
        availability_id,
        doctor_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        st_time,
        end_time,
        status
      FROM Doctor_Availability 
      WHERE doctor_id = ?
    `;
    const params: any[] = [id];

    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY date ASC, st_time ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctors/:id/appointments
 * Get doctor's assigned appointments
 */
router.get('/:id/appointments', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, date } = req.query;

    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        p.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender,
        p.blood_group,
        calculate_patient_age(p.dob) AS patient_age,
        p.city AS patient_city,
        pr.pers_id,
        pr.diagnosis,
        b.bill_id,
        b.status AS bill_status
      FROM Appointment a
      INNER JOIN Patient p ON a.p_id = p.p_id
      LEFT JOIN Prescription pr ON a.appointment_id = pr.appointment_id
      LEFT JOIN Bill b ON a.appointment_id = b.appointment_id
      WHERE a.doctor_id = ?
    `;
    const params: any[] = [id];

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

