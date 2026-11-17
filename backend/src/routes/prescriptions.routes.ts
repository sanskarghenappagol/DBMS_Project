import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/prescriptions
 * List prescriptions with filters (appointment_id, patient_id)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointment_id, patient_id, doctor_id } = req.query;

    let query = `
      SELECT 
        pr.*,
        a.appointment_date,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender AS patient_gender,
        calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification
      FROM Prescription pr
      INNER JOIN Appointment a ON pr.appointment_id = a.appointment_id
      INNER JOIN Patient p ON a.p_id = p.p_id
      INNER JOIN Doctor d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (appointment_id) {
      query += ` AND pr.appointment_id = ?`;
      params.push(appointment_id);
    }

    if (patient_id) {
      query += ` AND a.p_id = ?`;
      params.push(patient_id);
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctor_id);
    }

    query += ` ORDER BY pr.prescribed_date DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prescriptions/:id
 * Get single prescription with all prescribed medicines
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [presRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pr.*,
        a.appointment_date,
        a.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.gender AS patient_gender,
        p.blood_group,
        calculate_patient_age(p.dob) AS patient_age,
        a.doctor_id,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification
       FROM Prescription pr
       INNER JOIN Appointment a ON pr.appointment_id = a.appointment_id
       INNER JOIN Patient p ON a.p_id = p.p_id
       INNER JOIN Doctor d ON a.doctor_id = d.id
       WHERE pr.pers_id = ?`,
      [id]
    );

    if (presRows.length === 0) {
      res.status(404).json({ error: 'Prescription not found' });
      return;
    }

    const [medRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pm.*,
        m.name AS medicine_name,
        m.category,
        m.price,
        m.in_stock
       FROM Prescription_Medicine pm
       INNER JOIN Medicine m ON pm.medicine_id = m.id
       WHERE pm.pers_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...presRows[0],
        medicines: medRows
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/prescriptions
 * Create prescription with medicines
 * Triggers trg_prevent_negative_stock and trg_reduce_stock
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const { appointment_id, symptoms, diagnosis, prescribed_date, follow_up_date, medicines = [] } = req.body;

    if (!appointment_id || !diagnosis) {
      res.status(400).json({ error: 'Appointment ID and Diagnosis are required' });
      return;
    }

    await connection.beginTransaction();

    // Insert prescription
    const [presResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Prescription (appointment_id, symptoms, diagnosis, prescribed_date, follow_up_date)
       VALUES (?, ?, ?, ?, ?)`,
      [appointment_id, symptoms || '', diagnosis, prescribed_date || new Date(), follow_up_date || null]
    );

    const persId = presResult.insertId;

    // Insert medicines (Trigger executes here to check and deduct stock)
    for (const med of medicines) {
      if (med.medicine_id) {
        await connection.query(
          `INSERT INTO Prescription_Medicine (pers_id, medicine_id, dosage, frequency, duration_days, instruction)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            persId,
            med.medicine_id,
            med.dosage || '1 tablet',
            med.frequency || 'Once daily',
            med.duration_days || 5,
            med.instruction || 'Take after food'
          ]
        );
      }
    }

    // Automatically mark the appointment as Completed
    await connection.query(
      "UPDATE Appointment SET status = 'Completed' WHERE appointment_id = ?",
      [appointment_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Prescription created and medicine stock adjusted',
      data: { pers_id: persId }
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Prescription creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create prescription' });
  } finally {
    connection.release();
  }
});

/**
 * DELETE /api/prescriptions/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Prescription WHERE pers_id = ?', [id]);
    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

