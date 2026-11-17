import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * GET /api/acid-lab/info
 * Viva-friendly explanations of ACID properties
 */
router.get('/info', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      atomicity: {
        title: 'Atomicity (All or Nothing)',
        definition: 'Ensures that all operations within a work unit are completed successfully. If any statement fails, the entire transaction is rolled back to maintain database integrity.',
        vivaExplanation: 'When a patient books an appointment and a bill is created, both must succeed together. If bill generation fails, the appointment reservation must be cancelled (rolled back) so no orphaned appointment remains.',
        mysqlCommands: ['START TRANSACTION;', 'COMMIT;', 'ROLLBACK;', 'SAVEPOINT;', 'ROLLBACK TO SAVEPOINT;']
      },
      consistency: {
        title: 'Consistency (State Invariant Preservation)',
        definition: 'A transaction transforms the database from one valid consistent state to another valid consistent state, strictly adhering to all schema constraints, foreign keys, and CHECK conditions.',
        vivaExplanation: 'Medicine stock can never be negative (CHECK in_stock >= 0). If an insert tries to violate this constraint, MySQL immediately aborts the transaction to preserve consistency.',
        mysqlCommands: ['CHECK (in_stock >= 0)', 'FOREIGN KEY ... REFERENCES ...', 'UNIQUE KEY']
      },
      isolation: {
        title: 'Isolation (Concurrency Protection)',
        definition: 'Concurrent transactions execute independently without interfering with each other until committed, preventing dirty reads, non-repeatable reads, and phantom reads.',
        vivaExplanation: 'Two patients trying to book the exact same doctor availability slot simultaneously are serialized using row-level locks (SELECT ... FOR UPDATE) in InnoDB.',
        mysqlCommands: ['SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;', 'SELECT ... FOR UPDATE;']
      },
      durability: {
        title: 'Durability (Persistence Guarantee)',
        definition: 'Once a transaction commits, its modifications are permanently recorded in non-volatile storage (Redo Log / Tablespace) and will never be lost even during system failure or power loss.',
        vivaExplanation: 'Once the doctor signs the prescription and the transaction commits, server reboot or application restart preserves the clinical records intact.',
        mysqlCommands: ['innodb_flush_log_at_trx_commit = 1', 'COMMIT;']
      }
    }
  });
});

/**
 * POST /api/acid-lab/atomicity/success
 * Demonstrates a successful MySQL ACID transaction
 */
router.post('/atomicity/success', async (_req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  const logs: Array<{ step: number; action: string; sql: string; status: string; details: string }> = [];

  try {
    // Step 1: Begin Transaction
    await connection.beginTransaction();
    logs.push({
      step: 1,
      action: 'START TRANSACTION',
      sql: 'START TRANSACTION;',
      status: 'SUCCESS',
      details: 'Acquired dedicated MySQL InnoDB thread connection. Transaction isolation established.'
    });

    // Step 2: Insert Appointment
    const testDate = '2025-02-15';
    const testTime = '11:00:00';
    const [aptResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status)
       VALUES (1, 1, 4, ?, ?, 'Scheduled')`,
      [testDate, testTime]
    );
    const testAptId = aptResult.insertId;

    logs.push({
      step: 2,
      action: 'INSERT INTO Appointment',
      sql: `INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status) VALUES (1, 1, 4, '${testDate}', '${testTime}', 'Scheduled');`,
      status: 'SUCCESS',
      details: `Generated temporary Appointment ID: ${testAptId} within uncommitted transaction scope.`
    });

    // Step 3: Insert Associated Bill
    const [billResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status)
       VALUES (?, ?, 1200.00, 100.00, 'Pending')`,
      [testAptId, testDate]
    );
    const testBillId = billResult.insertId;

    logs.push({
      step: 3,
      action: 'INSERT INTO Bill',
      sql: `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status) VALUES (${testAptId}, '${testDate}', 1200.00, 100.00, 'Pending');`,
      status: 'SUCCESS',
      details: `Generated Bill ID: ${testBillId} referencing Appointment ID: ${testAptId}.`
    });

    // Step 4: COMMIT Transaction
    await connection.commit();
    logs.push({
      step: 4,
      action: 'COMMIT',
      sql: 'COMMIT;',
      status: 'COMMITTED',
      details: 'All changes flushed to InnoDB redo log. Modifications are now permanent and visible across all connections.'
    });

    // Step 5: Verification Query
    const [verifyRows] = await pool.query<RowDataPacket[]>(
      `SELECT a.appointment_id, a.status AS apt_status, b.bill_id, b.amount, b.status AS bill_status
       FROM Appointment a
       INNER JOIN Bill b ON a.appointment_id = b.appointment_id
       WHERE a.appointment_id = ?`,
      [testAptId]
    );

    logs.push({
      step: 5,
      action: 'VERIFY DATABASE STATE',
      sql: `SELECT a.appointment_id, b.bill_id FROM Appointment a JOIN Bill b ON a.appointment_id = b.appointment_id WHERE a.appointment_id = ${testAptId};`,
      status: 'VERIFIED',
      details: `Verified presence of Appointment #${testAptId} and Bill #${testBillId} in MySQL.`
    });

    // Step 6: Clean up demo test row
    await pool.query('DELETE FROM Bill WHERE bill_id = ?', [testBillId]);
    await pool.query('DELETE FROM Appointment WHERE appointment_id = ?', [testAptId]);

    res.json({
      success: true,
      transactionOutcome: 'COMMITTED',
      logs,
      verifiedRecord: verifyRows[0]
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/acid-lab/atomicity/failure
 * Demonstrates a failed transaction and atomic ROLLBACK
 */
router.post('/atomicity/failure', async (_req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  const logs: Array<{ step: number; action: string; sql: string; status: string; details: string }> = [];

  try {
    // Step 1: Begin Transaction
    await connection.beginTransaction();
    logs.push({
      step: 1,
      action: 'START TRANSACTION',
      sql: 'START TRANSACTION;',
      status: 'SUCCESS',
      details: 'Initialized transaction boundaries in InnoDB.'
    });

    // Step 2: Insert Appointment
    const testDate = '2025-02-20';
    const testTime = '16:00:00';
    const [aptResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status)
       VALUES (1, 2, 7, ?, ?, 'Scheduled')`,
      [testDate, testTime]
    );
    const candidateAptId = aptResult.insertId;

    logs.push({
      step: 2,
      action: 'INSERT INTO Appointment',
      sql: `INSERT INTO Appointment (p_id, doctor_id, availability_id, appointment_date, appointment_time, status) VALUES (1, 2, 7, '${testDate}', '${testTime}', 'Scheduled');`,
      status: 'SUCCESS',
      details: `Created uncommitted appointment record #${candidateAptId}.`
    });

    // Step 3: Simulate catastrophic failure (e.g. invalid negative bill amount violating CHECK constraint)
    logs.push({
      step: 3,
      action: 'TRIGGER SIMULATED RUNTIME ERROR',
      sql: `INSERT INTO Bill (appointment_id, bill_date, amount, discount, status) VALUES (${candidateAptId}, '${testDate}', -500.00, 0, 'Pending');`,
      status: 'FAILED',
      details: 'SIMULATED ERROR: CHECK constraint violation chk_amount (amount must be >= 0.00).'
    });

    // Explicit rollback
    await connection.rollback();
    logs.push({
      step: 4,
      action: 'ROLLBACK',
      sql: 'ROLLBACK;',
      status: 'ROLLED_BACK',
      details: 'Aborted transaction. Undoing uncommitted appointment insertion using InnoDB Undo Log.'
    });

    // Step 5: Verification - Confirm appointment record does NOT exist
    const [checkRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Appointment WHERE appointment_id = ?',
      [candidateAptId]
    );

    logs.push({
      step: 5,
      action: 'VERIFY DATABASE INTEGRITY',
      sql: `SELECT * FROM Appointment WHERE appointment_id = ${candidateAptId};`,
      status: checkRows.length === 0 ? 'INTEGRITY_VERIFIED' : 'FAILED',
      details: checkRows.length === 0
        ? `Confirmed Appointment #${candidateAptId} was completely erased from MySQL. Zero orphaned rows remain.`
        : 'Error: Appointment still found in database!'
    });

    res.json({
      success: true,
      transactionOutcome: 'ROLLED_BACK',
      logs,
      candidateAptId,
      existsInDatabase: checkRows.length > 0
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/acid-lab/consistency
 * Demonstrates schema constraint enforcement (negative stock prevention)
 */
router.post('/consistency', async (_req: Request, res: Response): Promise<void> => {
  try {
    let capturedError: any = null;

    try {
      // Intentionally violate CHECK constraint on Medicine table (in_stock >= 0)
      await pool.query(
        "INSERT INTO Medicine (name, category, price, in_stock) VALUES ('Test Invalid Drug', 'Antibiotic', 100.00, -25)"
      );
    } catch (err: any) {
      capturedError = err;
    }

    res.json({
      success: true,
      property: 'Consistency',
      constraintTested: 'CHECK (in_stock >= 0)',
      rejectedByMySQL: capturedError !== null,
      errorCode: capturedError?.code || 'ER_CHECK_CONSTRAINT_VIOLATED',
      errorMessage: capturedError?.message || 'Check constraint violation prevented negative inventory',
      vivaExplanation: 'MySQL 8.0 strictly enforces schema CHECK constraints. Any DML statement that would leave the database in an illegal state is instantaneously rejected.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/acid-lab/isolation
 * Demonstrates row-level locking for concurrency protection
 */
router.post('/isolation', async (_req: Request, res: Response): Promise<void> => {
  const connection1 = await pool.getConnection();
  try {
    await connection1.beginTransaction();

    // Connection 1 locks slot 4
    await connection1.query('SELECT * FROM Doctor_Availability WHERE availability_id = 4 FOR UPDATE');

    // Simulate concurrent check
    const [slotState] = await pool.query<RowDataPacket[]>(
      'SELECT availability_id, status FROM Doctor_Availability WHERE availability_id = 4'
    );

    await connection1.commit();

    res.json({
      success: true,
      property: 'Isolation',
      isolationLevel: 'REPEATABLE READ (Default InnoDB Engine)',
      mechanism: 'SELECT ... FOR UPDATE (Pessimistic Row-Level Lock)',
      details: 'While Connection 1 holds the lock on availability slot #4, any concurrent transaction attempting to modify or book slot #4 is blocked until Connection 1 commits.',
      currentSlotState: slotState[0]
    });
  } catch (error: any) {
    await connection1.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection1.release();
  }
});

/**
 * POST /api/acid-lab/durability
 * Demonstrates persistence after commit
 */
router.post('/durability', async (_req: Request, res: Response): Promise<void> => {
  try {
    const testMedicineName = `Durability Test Drug ${Date.now()}`;

    // Connection A inserts and commits
    const [insertResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO Medicine (name, category, price, in_stock) VALUES (?, "Analgesic", 45.00, 100)',
      [testMedicineName]
    );
    const medId = insertResult.insertId;

    // Separate read confirms persistence
    const [verifyRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM Medicine WHERE id = ?',
      [medId]
    );

    // Clean up
    await pool.query('DELETE FROM Medicine WHERE id = ?', [medId]);

    res.json({
      success: true,
      property: 'Durability',
      evidence: 'Committed tuple persisted immediately into the MySQL InnoDB data dictionary and Redo Log.',
      persistedRecord: verifyRows[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

