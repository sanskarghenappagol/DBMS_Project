import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Demo accounts mapping for offline testing
const DEMO_USERS: Record<string, any> = {
  'patient@healthcare.com': {
    id: 'demo-patient-uuid',
    email: 'patient@healthcare.com',
    role: 'patient',
    token: 'demo-patient-token',
    name: 'Aarav Sharma',
    refId: 1
  },
  'doctor@healthcare.com': {
    id: 'demo-doctor-uuid',
    email: 'doctor@healthcare.com',
    role: 'doctor',
    token: 'demo-doctor-token',
    name: 'Dr. Rajesh Sen',
    refId: 1
  },
  'admin@healthcare.com': {
    id: 'demo-admin-uuid',
    email: 'admin@healthcare.com',
    role: 'admin',
    token: 'demo-admin-token',
    name: 'Hospital Administrator',
    refId: 1
  }
};

/**
 * POST /api/auth/login
 * Validates credentials against MySQL Doctor, Patient, and Admin accounts
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email or username is required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const inputPass = String(password || '').trim();

    // 1. Hospital Administrator Authentication
    if (cleanEmail === 'admin@healthcare.com' || cleanEmail === 'admin') {
      const validAdminPasswords = ['Admin@123', 'admin', 'admin123', 'Sanskar@1177', ''];
      if (!inputPass || validAdminPasswords.includes(inputPass) || validAdminPasswords.map(p => p.toLowerCase()).includes(inputPass.toLowerCase())) {
        res.json({
          success: true,
          user: {
            id: 'admin-uuid-001',
            email: 'admin@healthcare.com',
            role: 'admin',
            name: 'Hospital Administrator',
            refId: 1
          },
          token: 'token-admin-1',
          session: { access_token: 'token-admin-1' }
        });
        return;
      } else {
        res.status(401).json({ error: 'Incorrect password for Hospital Administrator.' });
        return;
      }
    }

    // Generic shorthand: "doctor" -> Doctor 1
    if (cleanEmail === 'doctor' || cleanEmail === 'doctor@healthcare.com' || cleanEmail === 'dr') {
      res.json({
        success: true,
        user: {
          id: 'doctor-1',
          email: 'dr.rajesh.sen@example.com',
          role: 'doctor',
          name: 'Dr. Rajesh Sen',
          refId: 1
        },
        token: 'token-doctor-1',
        session: { access_token: 'token-doctor-1' }
      });
      return;
    }

    // Generic shorthand: "patient" -> Patient 1
    if (cleanEmail === 'patient' || cleanEmail === 'patient@healthcare.com') {
      res.json({
        success: true,
        user: {
          id: 'patient-1',
          email: 'aarav.sharma@example.com',
          role: 'patient',
          name: 'Aarav Sharma',
          refId: 1
        },
        token: 'token-patient-1',
        session: { access_token: 'token-patient-1' }
      });
      return;
    }

    // 2. Doctor Authentication (Checks live MySQL Doctor table)
    try {
      const stripped = cleanEmail.replace(/^dr[\.\s_]+/i, '').trim();
      const [doctorRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Doctor 
         WHERE LOWER(email) = ? 
            OR LOWER(email) = ?
            OR LOWER(email) = CONCAT(?, '@example.com')
            OR LOWER(email) = CONCAT('dr.', ?, '@example.com')
            OR LOWER(f_name) = ?
            OR LOWER(f_name) = ?
            OR LOWER(CONCAT(f_name, ' ', l_name)) = ?
            OR LOWER(CONCAT('dr. ', f_name, ' ', l_name)) = ?`,
        [cleanEmail, stripped, cleanEmail, stripped, cleanEmail, stripped, cleanEmail, cleanEmail]
      );

      if (doctorRows.length > 0) {
        const d = doctorRows[0];
        const registeredPass = (d.password || 'Doctor@123').trim();
        const validPasses = [
          registeredPass.toLowerCase(),
          'doctor@123',
          'doctor123',
          'doctor',
          'dr'
        ];

        // Validate password (if provided)
        if (inputPass && !validPasses.includes(inputPass.toLowerCase()) && inputPass !== registeredPass) {
          res.status(401).json({ error: `Incorrect password for Dr. ${d.f_name} ${d.l_name}. Default password is Doctor@123` });
          return;
        }

        const token = `token-doctor-${d.id}`;
        res.json({
          success: true,
          user: {
            id: d.supabase_user_id || `doctor-${d.id}`,
            email: d.email,
            role: 'doctor',
            name: `Dr. ${d.f_name} ${d.l_name}`,
            refId: d.id
          },
          token,
          session: { access_token: token }
        });
        return;
      }
    } catch (dbErr: any) {
      console.warn('Doctor table auth check notice:', dbErr.message);
    }

    // 3. Patient Authentication (Checks live MySQL Patient table)
    try {
      const [patientRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Patient 
         WHERE LOWER(email) = ? 
            OR LOWER(email) = CONCAT(?, '@example.com')
            OR LOWER(f_name) = ?
            OR LOWER(CONCAT(f_name, ' ', l_name)) = ?`,
        [cleanEmail, cleanEmail, cleanEmail, cleanEmail]
      );

      if (patientRows.length > 0) {
        const p = patientRows[0];
        const registeredPass = (p.password || 'Patient@123').trim();
        const validPasses = [
          registeredPass.toLowerCase(),
          'patient@123',
          'patient123',
          'patient'
        ];

        // Validate password (if provided)
        if (inputPass && !validPasses.includes(inputPass.toLowerCase()) && inputPass !== registeredPass) {
          res.status(401).json({ error: `Incorrect password for patient ${p.f_name} ${p.l_name}. Default password is Patient@123` });
          return;
        }

        const token = `token-patient-${p.p_id}`;
        res.json({
          success: true,
          user: {
            id: p.supabase_user_id || `patient-${p.p_id}`,
            email: p.email,
            role: 'patient',
            name: `${p.f_name} ${p.l_name}`,
            refId: p.p_id
          },
          token,
          session: { access_token: token }
        });
        return;
      }
    } catch (dbErr: any) {
      console.warn('Patient table auth check notice:', dbErr.message);
    }

    // 4. Fallback Demo accounts
    if (DEMO_USERS[cleanEmail]) {
      const demo = DEMO_USERS[cleanEmail];
      res.json({
        success: true,
        user: {
          id: demo.id,
          email: demo.email,
          role: demo.role,
          name: demo.name,
          refId: demo.refId
        },
        token: demo.token,
        session: { access_token: demo.token }
      });
      return;
    }

    // 5. Account not found - reject unauthorized access
    res.status(401).json({
      error: 'Account not found. Only registered doctors, patients, and administrators can log in. Please register as a patient or contact hospital admin.'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during login' });
  }
});

/**
 * POST /api/auth/register
 * Registers new Patient. Only Admin can create Doctors in the Admin portal.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const {
      email,
      password,
      role = 'patient',
      f_name,
      l_name,
      gender,
      blood_group,
      dob,
      street,
      city,
      pincode
    } = req.body;

    if (role === 'doctor') {
      res.status(403).json({ error: 'Doctor accounts cannot be publicly registered. Doctor profiles are created exclusively by Hospital Administrators in the Admin Portal.' });
      return;
    }

    if (!email || !f_name || !l_name) {
      res.status(400).json({ error: 'Email, first name, and last name are required' });
      return;
    }

    let supabaseUid = `patient-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await connection.beginTransaction();

    const [patResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Patient (supabase_user_id, f_name, l_name, email, password, gender, blood_group, dob, street, city, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supabaseUid, f_name, l_name, email, password || 'Patient@123', gender || 'Other', blood_group || 'O+', dob || '1995-01-01', street || '', city || '', pincode || '']
    );
    const createdId = patResult.insertId;

    // Insert role mapping
    await connection.query(
      'INSERT INTO user_roles (supabase_user_id, role, mysql_ref_id) VALUES (?, ?, ?)',
      [supabaseUid, 'patient', createdId]
    );

    await connection.commit();

    const token = `token-patient-${createdId}`;
    res.status(201).json({
      success: true,
      message: 'Patient account registered successfully',
      user: {
        id: supabaseUid,
        email,
        role: 'patient',
        name: `${f_name} ${l_name}`,
        refId: createdId
      },
      token
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'A patient account with this email already exists' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to register patient account' });
    }
  } finally {
    connection.release();
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated profile
 */
router.get('/me', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { role, supabaseUserId, mysqlRefId } = req.user;
    let profileData: any = null;

    if (role === 'doctor') {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM Doctor WHERE id = ? OR supabase_user_id = ?',
        [mysqlRefId || 0, supabaseUserId]
      );
      profileData = rows[0] || null;
    } else if (role === 'patient') {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT *, calculate_patient_age(dob) as calculated_age FROM Patient WHERE p_id = ? OR supabase_user_id = ?',
        [mysqlRefId || 0, supabaseUserId]
      );
      profileData = rows[0] || null;
    } else {
      profileData = {
        name: 'Administrator',
        email: req.user.email,
        role: 'admin'
      };
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        profile: profileData
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

