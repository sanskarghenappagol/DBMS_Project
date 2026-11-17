/**
 * Smart Healthcare Management System - MongoDB Setup
 * Secondary NoSQL Database: smart_healthcare_nosql
 * Collections:
 * 1. medical_reports
 * 2. patient_reviews
 * 3. audit_logs
 * 4. medical_embeddings
 */

// Switch to secondary NoSQL database
const dbName = 'smart_healthcare_nosql';
const db = db.getSiblingDB(dbName);

print(`Setting up collections in ${dbName}...`);

// ------------------------------------------------------------
// 1. medical_reports collection with JSON Schema Validation
// ------------------------------------------------------------
db.createCollection('medical_reports', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['patient_id', 'doctor_id', 'report_type', 'report_date'],
      properties: {
        report_id: {
          bsonType: 'string',
          description: 'Unique custom report ID (e.g., REP-2025-001)'
        },
        patient_id: {
          bsonType: 'int',
          description: 'Reference to MySQL Patient(p_id) - required integer'
        },
        doctor_id: {
          bsonType: 'int',
          description: 'Reference to MySQL Doctor(id) - required integer'
        },
        report_type: {
          enum: ['Blood Test', 'X-Ray', 'MRI Scan', 'CT Scan', 'Ultrasound', 'ECG', 'Pathology', 'Other'],
          description: 'Must be one of the specified clinical report categories'
        },
        report_date: {
          bsonType: 'date',
          description: 'Date when the diagnostic test was performed'
        },
        test_results: {
          bsonType: 'object',
          description: 'Dynamic schema-less object storing varied biometric test parameters'
        },
        observations: {
          bsonType: 'string',
          description: 'Physician or radiologist clinical notes'
        },
        storage_path: {
          bsonType: 'string',
          description: 'Relative storage path in Supabase Storage private bucket (medical-reports)'
        },
        file_name: {
          bsonType: 'string',
          description: 'Original uploaded file name'
        },
        file_size_bytes: {
          bsonType: 'int',
          description: 'Size of file in bytes'
        },
        created_at: {
          bsonType: 'date',
          description: 'Timestamp when document was created'
        }
      }
    }
  }
});
print('Created collection: medical_reports');

// ------------------------------------------------------------
// 2. patient_reviews collection with JSON Schema Validation
// ------------------------------------------------------------
db.createCollection('patient_reviews', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['patient_id', 'doctor_id', 'rating', 'review_text'],
      properties: {
        patient_id: {
          bsonType: 'int',
          description: 'Reference to MySQL Patient(p_id)'
        },
        doctor_id: {
          bsonType: 'int',
          description: 'Reference to MySQL Doctor(id)'
        },
        appointment_id: {
          bsonType: 'int',
          description: 'Optional reference to MySQL Appointment(appointment_id)'
        },
        rating: {
          bsonType: 'int',
          minimum: 1,
          maximum: 5,
          description: 'Integer rating between 1 and 5 stars'
        },
        review_text: {
          bsonType: 'string',
          description: 'Detailed patient feedback'
        },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'E.g., ["punctual", "caring", "clear explanation"]'
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});
print('Created collection: patient_reviews');

// ------------------------------------------------------------
// 3. audit_logs collection (with TTL index)
// ------------------------------------------------------------
db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['action', 'entity_type', 'timestamp'],
      properties: {
        action: {
          bsonType: 'string',
          description: 'INSERT, UPDATE, DELETE, LOGIN, TRANSACTION_ROLLBACK, etc.'
        },
        entity_type: {
          bsonType: 'string',
          description: 'Appointment, Prescription, Payment, User, Report'
        },
        entity_id: {
          bsonType: ['string', 'int'],
          description: 'Identifier of modified entity'
        },
        user_id: {
          bsonType: 'string',
          description: 'Supabase user UUID or actor'
        },
        changes: {
          bsonType: 'object',
          description: 'Snapshot of before/after state or event payload'
        },
        ip_address: {
          bsonType: 'string'
        },
        timestamp: {
          bsonType: 'date'
        }
      }
    }
  }
});
print('Created collection: audit_logs');

// ------------------------------------------------------------
// 4. medical_embeddings collection (for vector similarity search)
// ------------------------------------------------------------
db.createCollection('medical_embeddings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['report_id', 'text_content', 'embedding'],
      properties: {
        report_id: {
          bsonType: 'string',
          description: 'Reference to report_id in medical_reports'
        },
        patient_id: {
          bsonType: 'int'
        },
        doctor_id: {
          bsonType: 'int'
        },
        text_content: {
          bsonType: 'string',
          description: 'Extracted text/clinical notes summary'
        },
        embedding: {
          bsonType: 'array',
          items: { bsonType: 'double' },
          description: 'Dense vector representation of clinical text'
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});
print('Created collection: medical_embeddings');

print('MongoDB collections created successfully.');

