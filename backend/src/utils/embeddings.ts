// Controlled clinical vocabulary for domain-specific embedding generation
export const MEDICAL_VOCABULARY = [
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

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function generateSimpleEmbedding(text: string): number[] {
  if (!text || typeof text !== 'string') {
    return new Array(MEDICAL_VOCABULARY.length).fill(0.0);
  }

  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  const vector = MEDICAL_VOCABULARY.map(term => {
    const matches = words.filter(w => w === term || w.startsWith(term) || term.startsWith(w));
    return matches.length / wordCount;
  });

  const sumSquares = vector.reduce((sum, val) => sum + val * val, 0);
  const magnitude = Math.sqrt(sumSquares);

  if (magnitude === 0) {
    return vector.map((_, idx) => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
      return Math.abs(Math.sin(hash + idx)) * 0.01;
    });
  }

  return vector.map(val => val / magnitude);
}

