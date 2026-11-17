import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { PREDEFINED_QUERIES, PredefinedQuery } from '../utils/sql-queries';
import { authenticateUser } from '../middleware/auth';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/sql-explorer/queries
 * Retrieve all educational SQL concept queries
 */
router.get('/queries', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    count: PREDEFINED_QUERIES.length,
    data: PREDEFINED_QUERIES
  });
});

/**
 * POST /api/sql-explorer/execute/:queryId
 * Safely executes a predefined query on MySQL and returns real result set
 */
router.post('/execute/:queryId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { queryId } = req.params;
    const item = PREDEFINED_QUERIES.find(q => q.id === queryId);

    if (!item) {
      res.status(404).json({ error: 'Predefined query not found' });
      return;
    }

    const startTime = Date.now();
    const [rows, fields]: any = await pool.query(item.query);
    const executionTimeMs = Date.now() - startTime;

    const columns = Array.isArray(fields)
      ? fields.map((f: any) => f.name)
      : (Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : []);

    res.json({
      success: true,
      queryId: item.id,
      title: item.title,
      category: item.category,
      purpose: item.purpose,
      sql: item.query,
      explanation: item.explanation,
      realWorldUse: item.realWorldUse,
      executionTimeMs,
      rowCount: Array.isArray(rows) ? rows.length : 1,
      columns,
      data: rows
    });
  } catch (error: any) {
    console.error('SQL Explorer query execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
});

export default router;

