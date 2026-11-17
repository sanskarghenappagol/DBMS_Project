/**
 * Smart Healthcare Management System - MongoDB Indexes
 * Defines secondary indexes, composite indexes, text indexes,
 * and TTL indexes for high-throughput queries.
 */

const dbName = 'smart_healthcare_nosql';
const db = db.getSiblingDB(dbName);

print(`Creating indexes in ${dbName}...`);

// ------------------------------------------------------------
// 1. Indexes on medical_reports
// ------------------------------------------------------------
// Look up all reports for a specific patient (Patient Dashboard)
db.medical_reports.createIndex(
  { patient_id: 1, report_date: -1 },
  { name: 'idx_patient_reports_chronological' }
);

// Look up reports ordered by doctor (Doctor Dashboard)
db.medical_reports.createIndex(
  { doctor_id: 1, report_date: -1 },
  { name: 'idx_doctor_reports' }
);

// Filter by report type (e.g. all X-Rays or Blood Tests)
db.medical_reports.createIndex(
  { report_type: 1 },
  { name: 'idx_report_type' }
);

// Unique index on custom report identifier
db.medical_reports.createIndex(
  { report_id: 1 },
  { unique: true, name: 'idx_unique_report_id' }
);

// Text index for full-text search fallback over clinical observations
db.medical_reports.createIndex(
  { observations: 'text', report_type: 'text' },
  { name: 'idx_medical_reports_text_search' }
);

// ------------------------------------------------------------
// 2. Indexes on patient_reviews
// ------------------------------------------------------------
// Lookup reviews and calculate average rating for a doctor
db.patient_reviews.createIndex(
  { doctor_id: 1, rating: -1 },
  { name: 'idx_doctor_reviews_rating' }
);

// Lookup reviews submitted by a specific patient
db.patient_reviews.createIndex(
  { patient_id: 1 },
  { name: 'idx_patient_reviews' }
);

// ------------------------------------------------------------
// 3. Indexes on audit_logs
// ------------------------------------------------------------
// Chronological lookup for security audit page
db.audit_logs.createIndex(
  { timestamp: -1 },
  { name: 'idx_audit_timestamp_desc' }
);

// Filter by action and entity type
db.audit_logs.createIndex(
  { action: 1, entity_type: 1 },
  { name: 'idx_audit_action_entity' }
);

// Filter by user UUID
db.audit_logs.createIndex(
  { user_id: 1 },
  { name: 'idx_audit_user' }
);

// TTL (Time-To-Live) index: Automatically purge audit logs older than 90 days (7,776,000 seconds)
db.audit_logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 7776000, name: 'idx_audit_ttl_90days' }
);

// ------------------------------------------------------------
// 4. Indexes on medical_embeddings
// ------------------------------------------------------------
db.medical_embeddings.createIndex(
  { report_id: 1 },
  { unique: true, name: 'idx_embeddings_report_id' }
);

db.medical_embeddings.createIndex(
  { patient_id: 1 },
  { name: 'idx_embeddings_patient' }
);

print('All MongoDB indexes created successfully.');

