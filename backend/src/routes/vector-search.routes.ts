import { Router, Request, Response } from 'express';
import { getDb, getIsConnected, memoryStore } from '../config/mongodb';
import { authenticateUser } from '../middleware/auth';
import { generateSimpleEmbedding, cosineSimilarity } from '../utils/embeddings';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = Router();
router.use(authenticateUser);

/**
 * POST /api/vector-search/search
 * Natural language semantic search across clinical records
 */
router.post('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, patient_id, topK = 5 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Search query string is required' });
      return;
    }

    const queryVector = generateSimpleEmbedding(query);
    let allEmbeddings: any[] = [];

    if (getIsConnected() && getDb()) {
      const filter: any = {};
      if (patient_id) filter.patient_id = Number(patient_id);
      allEmbeddings = await getDb()!.collection('medical_embeddings').find(filter).toArray();
    } else {
      allEmbeddings = memoryStore.medical_embeddings.filter(e => {
        if (patient_id && e.patient_id !== Number(patient_id)) return false;
        return true;
      });
    }

    // If embeddings store is empty, seed with demo clinical reports
    if (allEmbeddings.length === 0) {
      const demoSamples = [
        {
          report_id: 'REP-2025-001',
          patient_id: 1,
          doctor_id: 1,
          text_content: 'ECG Report: Cardiac sinus tachycardia, chest tightness, elevated ST segment indicative of acute coronary condition.',
          embedding: generateSimpleEmbedding('Cardiac sinus tachycardia, chest tightness, elevated ST segment indicative of acute coronary condition.')
        },
        {
          report_id: 'REP-2025-002',
          patient_id: 4,
          doctor_id: 3,
          text_content: 'X-Ray Knee: Bilateral severe osteoarthritis, knee joint space reduction, bone spurs and degenerative cartilage.',
          embedding: generateSimpleEmbedding('Bilateral severe osteoarthritis, knee joint space reduction, bone spurs and degenerative cartilage.')
        },
        {
          report_id: 'REP-2025-003',
          patient_id: 5,
          doctor_id: 4,
          text_content: 'Pediatric Blood Test: Acute viral respiratory infection, fever 102F, high leukocyte count with inflammation markers.',
          embedding: generateSimpleEmbedding('Acute viral respiratory infection, fever 102F, high leukocyte count with inflammation markers.')
        },
        {
          report_id: 'REP-2025-004',
          patient_id: 6,
          doctor_id: 5,
          text_content: 'Brain MRI Scan: Neurological evaluation for chronic migraine with visual aura, no cerebral aneurysm detected.',
          embedding: generateSimpleEmbedding('Neurological evaluation for chronic migraine with visual aura, no cerebral aneurysm detected.')
        },
        {
          report_id: 'REP-2025-005',
          patient_id: 3,
          doctor_id: 2,
          text_content: 'Dermatology Biopsy: Plaque psoriasis with epidermal hyperkeratosis and erythematous scaly cutaneous plaques.',
          embedding: generateSimpleEmbedding('Plaque psoriasis with epidermal hyperkeratosis and erythematous scaly cutaneous plaques.')
        }
      ];

      allEmbeddings = demoSamples;
    }

    // Rank by Cosine Similarity
    const scoredResults = allEmbeddings.map(doc => {
      let score = 0.0;
      try {
        score = cosineSimilarity(queryVector, doc.embedding);
      } catch {
        score = 0.0;
      }

      return {
        report_id: doc.report_id,
        patient_id: doc.patient_id,
        doctor_id: doc.doctor_id,
        text_content: doc.text_content,
        similarity_score: Math.round(score * 1000) / 1000
      };
    });

    scoredResults.sort((a, b) => b.similarity_score - a.similarity_score);
    const topResults = scoredResults.slice(0, Number(topK));

    // Enrich with patient and doctor names
    const enriched = await Promise.all(
      topResults.map(async (item) => {
        let patient_name = 'Patient #' + item.patient_id;
        let doctor_name = 'Dr. Assigned #' + item.doctor_id;

        try {
          const [p] = await pool.query<RowDataPacket[]>('SELECT f_name, l_name FROM Patient WHERE p_id = ?', [item.patient_id]);
          if (p.length > 0) patient_name = `${p[0].f_name} ${p[0].l_name}`;

          const [d] = await pool.query<RowDataPacket[]>('SELECT f_name, l_name FROM Doctor WHERE id = ?', [item.doctor_id]);
          if (d.length > 0) doctor_name = `Dr. ${d[0].f_name} ${d[0].l_name}`;
        } catch {
          // ignore
        }

        return { ...item, patient_name, doctor_name };
      })
    );

    res.json({
      success: true,
      query,
      vector_engine: getIsConnected() ? 'MongoDB Atlas / Local Fallback' : 'Cosine Similarity Engine (Local Fallback)',
      count: enriched.length,
      data: enriched
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/vector-search/embed
 * Generate and store embedding for a medical report
 */
router.post('/embed', async (req: Request, res: Response): Promise<void> => {
  try {
    const { report_id, patient_id, doctor_id, text_content } = req.body;

    const embedding = generateSimpleEmbedding(text_content);

    const doc = {
      report_id,
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      text_content,
      embedding,
      created_at: new Date()
    };

    if (getIsConnected() && getDb()) {
      await getDb()!.collection('medical_embeddings').updateOne(
        { report_id },
        { $set: doc },
        { upsert: true }
      );
    } else {
      const idx = memoryStore.medical_embeddings.findIndex(e => e.report_id === report_id);
      if (idx !== -1) {
        memoryStore.medical_embeddings[idx] = doc;
      } else {
        memoryStore.medical_embeddings.push(doc);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Vector embedding stored successfully',
      data: { report_id, vector_dimensions: embedding.length }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

