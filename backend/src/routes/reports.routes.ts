import { Router, Request, Response } from 'express';
import { getDb, getIsConnected, memoryStore } from '../config/mongodb';
import { authenticateUser } from '../middleware/auth';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/reports
 * List medical reports (from MongoDB or memory fallback) with patient and doctor details
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id, doctor_id, report_type } = req.query;
    let reports: any[] = [];

    if (getIsConnected() && getDb()) {
      const filter: any = {};
      if (patient_id) filter.patient_id = Number(patient_id);
      if (doctor_id) filter.doctor_id = Number(doctor_id);
      if (report_type) filter.report_type = report_type;

      reports = await getDb()!.collection('medical_reports')
        .find(filter)
        .sort({ report_date: -1 })
        .toArray();
    } else {
      // Memory fallback
      reports = memoryStore.medical_reports.filter(r => {
        if (patient_id && r.patient_id !== Number(patient_id)) return false;
        if (doctor_id && r.doctor_id !== Number(doctor_id)) return false;
        if (report_type && r.report_type !== report_type) return false;
        return true;
      });
    }

    // Enrich with MySQL patient and doctor names
    const enriched = await Promise.all(
      reports.map(async (r) => {
        let patient_name = 'Patient #' + r.patient_id;
        let doctor_name = 'Dr. Assigned #' + r.doctor_id;

        try {
          const [pRows] = await pool.query<RowDataPacket[]>(
            'SELECT f_name, l_name FROM Patient WHERE p_id = ?',
            [r.patient_id]
          );
          if (pRows.length > 0) patient_name = `${pRows[0].f_name} ${pRows[0].l_name}`;

          const [dRows] = await pool.query<RowDataPacket[]>(
            'SELECT f_name, l_name FROM Doctor WHERE id = ?',
            [r.doctor_id]
          );
          if (dRows.length > 0) doctor_name = `Dr. ${dRows[0].f_name} ${dRows[0].l_name}`;
        } catch {
          // ignore
        }

        return {
          ...r,
          patient_name,
          doctor_name
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let report: any = null;

    if (getIsConnected() && getDb()) {
      report = await getDb()!.collection('medical_reports').findOne({ report_id: id });
    } else {
      report = memoryStore.medical_reports.find(r => r.report_id === id);
    }

    if (!report) {
      res.status(404).json({ error: 'Medical report not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports
 * Create medical report in MongoDB
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patient_id,
      doctor_id,
      report_type,
      report_date,
      test_results,
      observations,
      storage_path,
      file_name,
      file_size_bytes
    } = req.body;

    const reportId = `REP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newReport = {
      report_id: reportId,
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      report_type: report_type || 'Blood Test',
      report_date: report_date ? new Date(report_date) : new Date(),
      test_results: test_results || {},
      observations: observations || '',
      storage_path: storage_path || `reports/${file_name || 'doc.pdf'}`,
      file_name: file_name || 'report.pdf',
      file_size_bytes: file_size_bytes || 120000,
      created_at: new Date()
    };

    if (getIsConnected() && getDb()) {
      await getDb()!.collection('medical_reports').insertOne(newReport);
    } else {
      memoryStore.medical_reports.unshift(newReport);
    }

    res.status(201).json({
      success: true,
      message: 'Medical report stored in MongoDB NoSQL layer',
      data: newReport
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/reports/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected() && getDb()) {
      await getDb()!.collection('medical_reports').deleteOne({ report_id: id });
    } else {
      const idx = memoryStore.medical_reports.findIndex(r => r.report_id === id);
      if (idx !== -1) memoryStore.medical_reports.splice(idx, 1);
    }

    res.json({ success: true, message: 'Report removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

