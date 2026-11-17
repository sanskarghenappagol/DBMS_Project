import { Router, Request, Response } from 'express';
import { getDb, getIsConnected, memoryStore } from '../config/mongodb';
import { authenticateUser } from '../middleware/auth';

const router = Router();
router.use(authenticateUser);

/**
 * Helper to record audit events in MongoDB
 */
export async function recordAuditLog(
  action: string,
  entityType: string,
  entityId: string | number,
  userId: string,
  changes: any,
  ipAddress?: string
) {
  const auditDoc = {
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    changes,
    ip_address: ipAddress || '127.0.0.1',
    timestamp: new Date()
  };

  try {
    if (getIsConnected() && getDb()) {
      await getDb()!.collection('audit_logs').insertOne(auditDoc);
    } else {
      memoryStore.audit_logs.unshift(auditDoc);
    }
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

/**
 * GET /api/audit
 * Retrieve security and database transaction audit logs
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entity_type, limit = 50 } = req.query;
    let logs: any[] = [];

    if (getIsConnected() && getDb()) {
      const filter: any = {};
      if (action) filter.action = action;
      if (entity_type) filter.entity_type = entity_type;

      logs = await getDb()!.collection('audit_logs')
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(Number(limit))
        .toArray();
    } else {
      logs = memoryStore.audit_logs
        .filter(l => {
          if (action && l.action !== action) return false;
          if (entity_type && l.entity_type !== entity_type) return false;
          return true;
        })
        .slice(0, Number(limit));
    }

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

