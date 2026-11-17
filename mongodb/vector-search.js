/**
 * Smart Healthcare Management System - MongoDB Vector Search
 * Implements:
 * 1. Semantic Embedding generation (Domain vocabulary based vectorizer)
 * 2. MongoDB Atlas Vector Search configuration
 * 3. Local In-Memory Cosine Similarity Fallback
 * 4. Hybrid Search (Vector Similarity + Metadata Filtering)
 */

// Controlled clinical vocabulary for domain-specific embedding generation
const MEDICAL_VOCABULARY = [
  'cardiac', 'chest', 'pain', 'heart', 'angina', 'hypertension', 'ecg', 'blood',
  'pressure', 'cholesterol', 'tachycardia', 'infarction', 'stroke', 'vessel',
  'skin', 'rash', 'dermatitis', 'psoriasis', 'eczema', 'allergy', 'itching', 'lesion',
  'bone', 'joint', 'knee', 'fracture', 'arthritis', 'osteoarthritis', 'spine', 'orthopedic',
  'cough', 'fever', 'respiratory', 'lungs', 'viral', 'pneumonia', 'tonsil', 'throat',
  'headache', 'migraine', 'brain', 'neurology', 'aura', 'dizziness', 'seizure', 'nerve',
  'stomach', 'acid', 'gerd', 'reflux', 'gastric', 'heartburn', 'abdomen', 'digestive',
  'diabetes', 'glucose', 'insulin', 'sugar', 'hba1c', 'pancreas', 'thyroid', 'hormone',
  'surgery', 'operation', 'biopsy', 'scan', 'mri', 'ct', 'xray', 'ultrasound', 'pathology'
];

/**
 * Calculates Cosine Similarity between two numeric vectors of identical dimension.
 * Cosine Similarity = (A . B) / (||A|| * ||B||)
 * Range: -1.0 to 1.0 (typically 0.0 to 1.0 for term vectors)
 * 
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vectors must be non-null and of identical dimensionality');
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a normalized term-frequency embedding vector from unstructured medical text.
 * 
 * @param {string} text - Raw clinical notes or query
 * @returns {number[]} Normalized embedding vector
 */
function generateSimpleEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(MEDICAL_VOCABULARY.length).fill(0.0);
  }

  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  // Build raw term counts against controlled medical lexicon
  const vector = MEDICAL_VOCABULARY.map(term => {
    const matches = words.filter(w => w === term || w.startsWith(term) || term.startsWith(w));
    return matches.length / wordCount;
  });

  // Calculate L2 norm for normalization
  const sumSquares = vector.reduce((sum, val) => sum + val * val, 0);
  const magnitude = Math.sqrt(sumSquares);

  if (magnitude === 0) {
    // If no vocabulary matches, create a sparse uniform distribution based on character hashes
    return vector.map((_, idx) => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
      return Math.abs(Math.sin(hash + idx)) * 0.01;
    });
  }

  // Unit normalize
  return vector.map(val => val / magnitude);
}

/**
 * Performs Semantic Vector Search across medical_embeddings collection.
 * Uses local Cosine Similarity fallback when MongoDB Atlas Vector Search index is not present.
 * 
 * @param {Db} db - Connected MongoDB database instance
 * @param {string} queryText - Natural language search phrase (e.g. "severe cardiac palpitations")
 * @param {object} options - Options including topK and patient_id filter
 * @returns {Promise<Array>} Ranked search results with similarity scores
 */
async function searchSimilarReports(db, queryText, options = {}) {
  const { topK = 5, patientId = null } = options;
  const queryEmbedding = generateSimpleEmbedding(queryText);

  // Check if MongoDB Atlas Vector Search pipeline can be used
  try {
    const atlasPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index_reports',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: topK
        }
      },
      {
        $project: {
          report_id: 1,
          patient_id: 1,
          doctor_id: 1,
          text_content: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    if (patientId) {
      atlasPipeline[0].$vectorSearch.filter = { patient_id: patientId };
    }

    const results = await db.collection('medical_embeddings').aggregate(atlasPipeline).toArray();
    if (results && results.length > 0) {
      return results;
    }
  } catch (err) {
    // Atlas Vector Search not configured in local environment; proceed to local fallback
  }

  // --- LOCAL FALLBACK ENGINE ---
  const queryFilter = {};
  if (patientId) {
    queryFilter.patient_id = Number(patientId);
  }

  const allEmbeddings = await db.collection('medical_embeddings').find(queryFilter).toArray();

  if (!allEmbeddings || allEmbeddings.length === 0) {
    return [];
  }

  // Compute similarity score for each document
  const scoredReports = allEmbeddings.map(doc => {
    let score = 0.0;
    try {
      score = cosineSimilarity(queryEmbedding, doc.embedding);
    } catch {
      score = 0.0;
    }
    return {
      report_id: doc.report_id,
      patient_id: doc.patient_id,
      doctor_id: doc.doctor_id,
      text_content: doc.text_content,
      similarity_score: Math.round(score * 1000) / 1000,
      created_at: doc.created_at
    };
  });

  // Sort descending by similarity score and return top K
  scoredReports.sort((a, b) => b.similarity_score - a.similarity_score);
  return scoredReports.slice(0, topK);
}

module.exports = {
  MEDICAL_VOCABULARY,
  cosineSimilarity,
  generateSimpleEmbedding,
  searchSimilarReports
};

