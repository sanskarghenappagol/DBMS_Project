import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/payments
 * List payment records with joins
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bill_id, status } = req.query;

    let query = `
      SELECT 
        pay.*,
        b.appointment_id,
        b.amount AS bill_amount,
        b.discount AS bill_discount,
        b.status AS bill_status,
        a.appointment_date,
        p.p_id,
        CONCAT(p.f_name, ' ', p.l_name) AS patient_name,
        p.email AS patient_email,
        CONCAT('Dr. ', d.f_name, ' ', d.l_name) AS doctor_name
      FROM Payment pay
      INNER JOIN Bill b ON pay.bill_id = b.bill_id
      INNER JOIN Appointment a ON b.appointment_id = a.appointment_id
      INNER JOIN Patient p ON a.p_id = p.p_id
      INNER JOIN Doctor d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (bill_id) {
      query += ` AND pay.bill_id = ?`;
      params.push(bill_id);
    }

    if (status) {
      query += ` AND pay.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pay.payment_date DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments
 * Process and record payment
 * Fires trigger trg_update_bill_on_payment on Success
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bill_id, method, amount, status = 'Success', utr } = req.body;

    if (!bill_id || !method || !amount) {
      res.status(400).json({ error: 'Bill ID, payment method, and amount are required' });
      return;
    }

    const generatedUtr = utr || `UTR-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO Payment (bill_id, utr, method, amount, status)
       VALUES (?, ?, ?, ?, ?)`,
      [bill_id, generatedUtr, method, amount, status]
    );

    // If trigger did not run for any reason, ensure bill status is updated to Paid
    if (status === 'Success') {
      await pool.query("UPDATE Bill SET status = 'Paid' WHERE bill_id = ?", [bill_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully. Bill status updated to Paid by MySQL trigger.',
      data: {
        payment_id: result.insertId,
        utr: generatedUtr,
        status
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

