import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

/**
 * GET /api/medicines
 * List medicines with search and category filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, low_stock } = req.query;

    let query = `
      SELECT 
        m.*,
        (SELECT COUNT(*) FROM Prescription_Medicine pm WHERE pm.medicine_id = m.id) AS times_prescribed
      FROM Medicine m
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      query += ` AND m.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (m.name LIKE ? OR m.category LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (low_stock === 'true') {
      query += ` AND m.in_stock <= 10`;
    }

    query += ` ORDER BY m.name ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/medicines/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM Medicine WHERE id = ?', [id]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/medicines
 * Create medicine (Admin)
 */
router.post('/', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, price, in_stock = 0 } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO Medicine (name, category, price, in_stock) VALUES (?, ?, ?, ?)',
      [name, category, price, in_stock]
    );

    res.status(201).json({
      success: true,
      message: 'Medicine added to inventory',
      data: { id: result.insertId }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/medicines/:id
 * Update medicine details
 */
router.put('/:id', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, price, in_stock } = req.body;

    await pool.query(
      'UPDATE Medicine SET name = ?, category = ?, price = ?, in_stock = ? WHERE id = ?',
      [name, category, price, in_stock, id]
    );

    res.json({ success: true, message: 'Medicine updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/medicines/:id/stock
 * Adjust stock using stored procedure update_medicine_stock
 */
router.put('/:id/stock', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body; // can be positive (restock) or negative (deduct)

    try {
      await pool.query('CALL update_medicine_stock(?, ?)', [id, quantity]);
    } catch {
      await pool.query('UPDATE Medicine SET in_stock = in_stock + ? WHERE id = ?', [quantity, id]);
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT in_stock FROM Medicine WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { new_stock: rows[0]?.in_stock }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/medicines/:id
 */
router.delete('/:id', authenticateUser, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Medicine WHERE id = ?', [id]);
    res.json({ success: true, message: 'Medicine deleted from inventory' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

