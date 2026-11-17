import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * GET /api/roles
 * Retrieve defined MySQL roles and privileges
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    let rolesInfo: any[] = [];

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT user, host FROM mysql.user WHERE user LIKE 'healthcare_%'`
      );
      rolesInfo = rows;
    } catch {
      // If mysql.user read is restricted for the pool user, return standard definition
      rolesInfo = [
        { role_name: 'healthcare_admin', scope: 'smart_healthcare.*', privileges: 'ALL PRIVILEGES' },
        { role_name: 'healthcare_doctor', scope: 'smart_healthcare.Prescription, Appointment, Doctor_Availability', privileges: 'SELECT, INSERT, UPDATE' },
        { role_name: 'healthcare_patient', scope: 'smart_healthcare.Appointment, Payment, Doctor', privileges: 'SELECT, INSERT' }
      ];
    }

    res.json({
      success: true,
      roles: rolesInfo,
      documentation: {
        admin: 'healthcare_admin: Full DDL/DML privileges across all tables and stored procedures.',
        doctor: 'healthcare_doctor: Read patient demographics, write clinical prescriptions, manage availability slots.',
        patient: 'healthcare_patient: Read public doctor directories, insert appointments, record payments.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/roles/app-vs-db
 * Educational viva breakdown of Application Authorization vs MySQL Database RBAC
 */
router.get('/app-vs-db', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      title: 'Application-Level Authorization vs. Database-Level Privileges',
      comparison: [
        {
          aspect: 'Enforcement Point',
          applicationLevel: 'Node.js/Express Middleware (authenticateUser, requireDoctor, requireAdmin)',
          databaseLevel: 'MySQL Engine (GRANT SELECT, INSERT ON smart_healthcare.* TO role)'
        },
        {
          aspect: 'Granularity',
          applicationLevel: 'Row-level & Tenant isolation (e.g. Doctor X can only view Patient Y if an active appointment links them)',
          databaseLevel: 'Table, Column, and Routine level (e.g. Doctor role can SELECT on Prescription table, but cannot drop tables)'
        },
        {
          aspect: 'Authentication Token',
          applicationLevel: 'JWT / Supabase Auth Bearer Tokens verified via cryptographic signature',
          databaseLevel: 'Database Connection Credentials (Username/Password or TLS Client Certificate)'
        },
        {
          aspect: 'Defense-in-Depth',
          applicationLevel: 'Filters malicious requests before they hit the database network socket',
          databaseLevel: 'Protects data even if backend code has a vulnerability or DBA connects via CLI tool'
        }
      ]
    }
  });
});

export default router;

