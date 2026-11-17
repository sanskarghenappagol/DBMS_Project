import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

/**
 * GET /api/availability
 * List availability slots with filters (doctor_id, date, status)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctor_id, date, status } = req.query;

    let query = `
      SELECT 
        da.availability_id,
        da.doctor_id,
        DATE_FORMAT(da.date, '%Y-%m-%d') AS date,
        da.st_time,
        da.end_time,
        da.status,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        d.consult_fee
      FROM Doctor_Availability da
      INNER JOIN Doctor d ON da.doctor_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (doctor_id) {
      query += ` AND da.doctor_id = ?`;
      params.push(doctor_id);
    }

    if (date) {
      query += ` AND da.date = ?`;
      params.push(date);
    }

    if (status) {
      query += ` AND da.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY da.date ASC, da.st_time ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/availability
 * Add doctor availability slot
 */
router.post('/', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctor_id, date, st_time, end_time, status = 'Available' } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Doctor_Availability (doctor_id, date, st_time, end_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, date, st_time, end_time, status]
    );

    res.status(201).json({
      success: true,
      message: 'Availability slot created',
      data: { availability_id: result.insertId }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/availability/:id
 * Update availability slot status or timing
 */
router.put('/:id', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, st_time, end_time, status } = req.body;

    await pool.query(
      `UPDATE Doctor_Availability SET date = COALESCE(?, date), st_time = COALESCE(?, st_time), end_time = COALESCE(?, end_time), status = COALESCE(?, status) WHERE availability_id = ?`,
      [date, st_time, end_time, status, id]
    );

    res.json({ success: true, message: 'Availability slot updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/availability/:id
 * Delete availability slot
 */
router.delete('/:id', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Doctor_Availability WHERE availability_id = ?', [id]);
    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

