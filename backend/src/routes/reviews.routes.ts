import { Router, Request, Response } from 'express';
import { getDb, getIsConnected, memoryStore } from '../config/mongodb';
import { authenticateUser } from '../middleware/auth';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();

/**
 * GET /api/reviews
 * List reviews with optional doctor_id filter
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctor_id, patient_id } = req.query;
    let reviews: any[] = [];

    if (getIsConnected() && getDb()) {
      const filter: any = {};
      if (doctor_id) filter.doctor_id = Number(doctor_id);
      if (patient_id) filter.patient_id = Number(patient_id);

      reviews = await getDb()!.collection('patient_reviews')
        .find(filter)
        .sort({ created_at: -1 })
        .toArray();
    } else {
      reviews = memoryStore.patient_reviews.filter(r => {
        if (doctor_id && r.doctor_id !== Number(doctor_id)) return false;
        if (patient_id && r.patient_id !== Number(patient_id)) return false;
        return true;
      });
    }

    // Attach patient and doctor names
    const enriched = await Promise.all(
      reviews.map(async (rev) => {
        let patient_name = 'Patient #' + rev.patient_id;
        let doctor_name = 'Dr. Specialist #' + rev.doctor_id;

        try {
          const [p] = await pool.query<RowDataPacket[]>('SELECT f_name, l_name FROM Patient WHERE p_id = ?', [rev.patient_id]);
          if (p.length > 0) patient_name = `${p[0].f_name} ${p[0].l_name}`;

          const [d] = await pool.query<RowDataPacket[]>('SELECT f_name, l_name FROM Doctor WHERE id = ?', [rev.doctor_id]);
          if (d.length > 0) doctor_name = `Dr. ${d[0].f_name} ${d[0].l_name}`;
        } catch {
          // ignore
        }

        return { ...rev, patient_name, doctor_name };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reviews/doctor/:doctorId/stats
 * Demonstrates MongoDB Aggregation Pipeline ($match, $group, $project)
 */
router.get('/doctor/:doctorId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = Number(req.params.doctorId);

    if (getIsConnected() && getDb()) {
      const pipeline = [
        { $match: { doctor_id: doctorId } },
        {
          $group: {
            _id: '$doctor_id',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            doctor_id: '$_id',
            averageRating: { $round: ['$averageRating', 1] },
            totalReviews: 1,
            breakdown: {
              5: '$fiveStars',
              4: '$fourStars',
              3: '$threeStars',
              2: '$twoStars',
              1: '$oneStar'
            }
          }
        }
      ];

      const stats = await getDb()!.collection('patient_reviews').aggregate(pipeline).toArray();

      if (stats.length === 0) {
        res.json({
          success: true,
          data: {
            doctor_id: doctorId,
            averageRating: 5.0,
            totalReviews: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          }
        });
        return;
      }

      res.json({ success: true, data: stats[0] });
    } else {
      // Memory fallback aggregation
      const docReviews = memoryStore.patient_reviews.filter(r => r.doctor_id === doctorId);
      const total = docReviews.length;
      const sum = docReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 5.0;

      res.json({
        success: true,
        data: {
          doctor_id: doctorId,
          averageRating: avg,
          totalReviews: total,
          breakdown: {
            5: docReviews.filter(r => r.rating === 5).length,
            4: docReviews.filter(r => r.rating === 4).length,
            3: docReviews.filter(r => r.rating === 3).length,
            2: docReviews.filter(r => r.rating === 2).length,
            1: docReviews.filter(r => r.rating === 1).length
          }
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reviews
 * Submit patient review
 */
router.post('/', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctor_id, appointment_id, rating, review_text, tags = [] } = req.body;
    const patient_id = req.user?.mysqlRefId || 1;

    const newReview = {
      review_id: `REV-${Date.now()}`,
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      appointment_id: appointment_id ? Number(appointment_id) : undefined,
      rating: Number(rating),
      review_text,
      tags: Array.isArray(tags) ? tags : [tags],
      created_at: new Date()
    };

    if (getIsConnected() && getDb()) {
      await getDb()!.collection('patient_reviews').insertOne(newReview);
    } else {
      memoryStore.patient_reviews.unshift(newReview);
    }

    res.status(201).json({
      success: true,
      message: 'Review recorded in MongoDB NoSQL layer',
      data: newReview
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

