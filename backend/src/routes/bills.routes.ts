import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/bills
 * List bills with filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, patient_id } = req.query;

    let query = `
      SELECT 
        b.bill_id,
        b.appointment_id,
        b.bill_date,
        b.amount,
        b.discount,
        calculate_final_bill(b.amount, b.discount) AS final_amount,
        b.status AS bill_status,
        a.appointment_date,
        p.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        d.id AS doctor_id,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name,
        d.qualification,
        pay.payment_id,
        pay.utr,
        pay.method AS payment_method,
        pay.status AS payment_status
      FROM Bill b
      INNER JOIN Appointment a ON b.appointment_id = a.appointment_id
      INNER JOIN Patient p ON a.p_id = p.p_id
      INNER JOIN Doctor d ON a.doctor_id = d.id
      LEFT JOIN Payment pay ON b.bill_id = pay.bill_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (patient_id) {
      query += ` AND a.p_id = ?`;
      params.push(patient_id);
    }

    query += ` ORDER BY b.bill_date DESC, b.bill_id DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bills/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.*,
        calculate_final_bill(b.amount, b.discount) AS final_amount,
        a.appointment_date,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name
       FROM Bill b
       INNER JOIN Appointment a ON b.appointment_id = a.appointment_id
       INNER JOIN Patient p ON a.p_id = p.p_id
       INNER JOIN Doctor d ON a.doctor_id = d.id
       WHERE b.bill_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bills
 * Generate bill using stored procedure or direct insert
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointment_id, amount, discount = 0, bill_date } = req.body;

    try {
      await pool.query('CALL generate_bill(?, ?, ?, @out_bill_id)', [
        appointment_id,
        amount,
        discount
      ]);
      const [outResult]: any = await pool.query('SELECT @out_bill_id AS bill_id');
      const newBillId = outResult[0]?.bill_id;

      res.status(201).json({
        success: true,
        message: 'Bill generated via stored procedure',
        data: { bill_id: newBillId }
      });
      return;
    } catch {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status)
         VALUES (?, ?, ?, ?, 'Pending')`,
        [appointment_id, bill_date || new Date(), amount, discount]
      );

      res.status(201).json({
        success: true,
        message: 'Bill generated successfully',
        data: { bill_id: result.insertId }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/bills/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, discount, status } = req.body;

    await pool.query(
      'UPDATE Bill SET amount = COALESCE(?, amount), discount = COALESCE(?, discount), status = COALESCE(?, status) WHERE bill_id = ?',
      [amount, discount, status, id]
    );

    res.json({ success: true, message: 'Bill updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

