import { MongoClient, Db, Collection, Document } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// In-memory fallback stores if MongoDB is offline in local eval environment
export const memoryStore: Record<string, any[]> = {
  medical_reports: [
    {
      report_id: 'REP-2025-001',
      patient_id: 1,
      doctor_id: 1,
      report_type: 'ECG',
      report_date: new Date('2025-01-10'),
      test_results: { heart_rate: 76, rhythm: 'Sinus', pr_interval: 160, qrs_duration: 90 },
      observations: 'Normal sinus rhythm. Mild ST elevation observed in V2-V3 requiring follow-up.',
      storage_path: 'reports/demo_ecg_001.pdf',
      file_name: 'demo_ecg_001.pdf',
      file_size_bytes: 245000,
      created_at: new Date('2025-01-10T10:30:00Z')
    },
    {
      report_id: 'REP-2025-002',
      patient_id: 4,
      doctor_id: 3,
      report_type: 'X-Ray',
      report_date: new Date('2025-01-10'),
      test_results: { joint_space: 'Reduced medial compartment', osteophytes: 'Present' },
      observations: 'Bilateral knee osteoarthritis grade 2. Marginal osteophyte formation along tibiofemoral joints.',
      storage_path: 'reports/knee_xray_002.pdf',
      file_name: 'knee_xray_002.pdf',
      file_size_bytes: 480000,
      created_at: new Date('2025-01-10T14:45:00Z')
    }
  ],
  patient_reviews: [
    {
      review_id: 'REV-001',
      patient_id: 1,
      doctor_id: 1,
      appointment_id: 1,
      rating: 5,
      review_text: 'Dr. Rajesh Sen is extremely attentive and diagnosed my cardiac concern with immense clarity.',
      tags: ['Thorough', 'Polite', 'Punctual'],
      created_at: new Date('2025-01-10T12:00:00Z')
    },
    {
      review_id: 'REV-002',
      patient_id: 4,
      doctor_id: 3,
      appointment_id: 4,
      rating: 5,
      review_text: 'Excellent orthopedic surgeon. The joint treatment gave prompt relief.',
      tags: ['Caring', 'Expert'],
      created_at: new Date('2025-01-10T16:00:00Z')
    }
  ],
  audit_logs: [
    {
      action: 'SYSTEM_STARTUP',
      entity_type: 'System',
      entity_id: 'SYS-001',
      user_id: 'system',
      changes: { status: 'Database layer initialized' },
      timestamp: new Date()
    }
  ],
  medical_embeddings: [
    {
      report_id: 'REP-2025-001',
      patient_id: 1,
      doctor_id: 1,
      text_content: 'Normal sinus rhythm ECG report with chest discomfort evaluation for heart condition.',
      embedding: [0.12, 0.45, 0.78, 0.05, 0.62],
      created_at: new Date('2025-01-10T10:30:00Z')
    },
    {
      report_id: 'REP-2025-002',
      patient_id: 4,
      doctor_id: 3,
      text_content: 'Bilateral knee joint X-Ray examination indicating osteoarthritis and bone spur formation.',
      embedding: [0.02, 0.05, 0.11, 0.89, 0.04],
      created_at: new Date('2025-01-10T14:45:00Z')
    }
  ]
};

export const connectMongoDB = async (): Promise<boolean> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DATABASE || 'smart_healthcare_nosql';

    client = new MongoClient(uri, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    db = client.db(dbName);

    await db.command({ ping: 1 });
    isConnected = true;
    console.log('✅ MongoDB connected successfully to', dbName);
    return true;
  } catch (error: any) {
    console.warn('⚠️ MongoDB connection not available (' + error.message + '). Operating with in-memory NoSQL engine.');
    isConnected = false;
    return false;
  }
};

export const getDb = (): Db | null => {
  return db;
};

export const getIsConnected = (): boolean => {
  return isConnected;
};

export const getCollection = <T extends Document = Document>(name: string): Collection<T> => {
  if (!db) {
    throw new Error('MongoDB not initialized.');
  }
  return db.collection<T>(name);
};

export const closeMongoDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

export { client, db };
