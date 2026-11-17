# SMART HEALTHCARE MANAGEMENT SYSTEM
## ENTITY-RELATIONSHIP (ER) DIAGRAM & RELATIONAL SCHEMA SPECIFICATION

---

### 1. MERMAID ER DIAGRAM

```mermaid
erDiagram
    Patient ||--o{ Appointment : "books"
    Doctor ||--|{ Doctor_Phone : "has"
    Doctor ||--o{ Doctor_Availability : "schedules"
    Doctor ||--o{ Appointment : "attends"
    Doctor_Availability ||--o| Appointment : "allocated_to"
    Appointment ||--o| Prescription : "results_in"
    Appointment ||--o| Bill : "generates"
    Prescription ||--|{ Prescription_Medicine : "contains"
    Medicine ||--o{ Prescription_Medicine : "prescribed_in"
    Bill ||--o{ Payment : "settled_via"

    Patient {
        int p_id PK
        string supabase_user_id UK
        string f_name
        string l_name
        string email UK
        enum gender
        string blood_group
        date dob
        string street
        string city
        string pincode
        timestamp created_at
    }

    Doctor {
        int id PK
        string supabase_user_id UK
        string f_name
        string l_name
        string email UK
        string qualification
        int experience
        decimal consult_fee
        string city
        string pincode
        timestamp created_at
    }

    Doctor_Phone {
        int doctor_id PK, FK
        string phone_no PK
    }

    Doctor_Availability {
        int availability_id PK
        int doctor_id FK
        date date
        time st_time
        time end_time
        enum status
    }

    Appointment {
        int appointment_id PK
        int p_id FK
        int doctor_id FK
        int availability_id FK
        date appointment_date
        time appointment_time
        enum status
        timestamp created_at
    }

    Prescription {
        int pers_id PK
        int appointment_id UK, FK
        text symptoms
        text diagnosis
        date prescribed_date
        date follow_up_date
    }

    Medicine {
        int id PK
        string name
        string category
        decimal price
        int in_stock
    }

    Prescription_Medicine {
        int pers_id PK, FK
        int medicine_id PK, FK
        string dosage
        string frequency
        int duration_days
        text instruction
    }

    Bill {
        int bill_id PK
        int appointment_id UK, FK
        date bill_date
        decimal amount
        decimal discount
        enum status
    }

    Payment {
        int payment_id PK
        int bill_id FK
        string utr UK
        enum method
        decimal amount
        enum status
        timestamp payment_date
    }
```

---

### 2. RELATIONAL NORMALIZATION (3NF) PROOF

1. **First Normal Form (1NF):**
   - Every column contains atomic (indivisible) values.
   - Doctor contact numbers are decomposed into the specialized `Doctor_Phone` relation with composite key `(doctor_id, phone_no)`.

2. **Second Normal Form (2NF):**
   - The schema is in 1NF.
   - No non-prime attribute is partially dependent on any candidate key.
   - In `Prescription_Medicine(pers_id, medicine_id)`, attributes such as `dosage`, `frequency`, `duration_days`, and `instruction` depend fully on the complete composite key `(pers_id, medicine_id)`.

3. **Third Normal Form (3NF):**
   - The schema is in 2NF.
   - No non-prime attribute exhibits transitive functional dependency on the primary key ($X \rightarrow Y \rightarrow Z$).
   - Derived attributes like patient age are calculated dynamically via stored function `calculate_patient_age(dob)` using `TIMESTAMPDIFF(YEAR, dob, CURDATE())` rather than being stored redundantly in the relation.

