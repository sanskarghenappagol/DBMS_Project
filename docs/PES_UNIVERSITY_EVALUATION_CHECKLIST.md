# PES UNIVERSITY - DBMS MINI-PROJECT (50-MARK RUBRIC)
## SMART HEALTHCARE & DOCTOR APPOINTMENT MANAGEMENT SYSTEM

---

### EVALUATION CRITERIA MAPPING

| Component | Max Marks | Implemented Features | File Reference | Status |
| :--- | :---: | :--- | :--- | :---: |
| **1. Conceptual Design & ER Modeling** | **8 Marks** | • 10 Core relational tables + supporting `user_roles`<br>• Real cardinalities (1:1, 1:N, M:N)<br>• Composite PKs on `Doctor_Phone` & `Prescription_Medicine`<br>• Foreign key cascading rules (`ON DELETE CASCADE`) | `database/schema.sql`<br>`docs/ER_DIAGRAM.md` | ✅ **100% Complete** |
| **2. Schema Normalization & Integrity** | **8 Marks** | • Decomposed to 3NF without transitive dependencies<br>• CHECK constraints: `in_stock >= 0`, `price >= 0`, `consult_fee >= 0`<br>• Multi-column B-Tree indexes for fast range scans<br>• Dynamic age via `calculate_patient_age()` | `database/schema.sql`<br>`database/functions.sql` | ✅ **100% Complete** |
| **3. Advanced SQL Concept Mastery** | **10 Marks** | • **DDL:** `CREATE`, `ALTER`, `DROP`, `CREATE INDEX`<br>• **DML:** `INSERT`, `SELECT`, `UPDATE`, `DELETE`<br>• **Joins:** `INNER`, `LEFT`, `RIGHT`, 6-Table Multi-Join<br>• **Nested Subqueries:** Above-avg visits, above-avg fees<br>• **Correlated Queries:** `EXISTS` doctor visits<br>• **CTE:** Monthly revenue, doctor KPI scorecard<br>• **Recursive CTE:** 20-day date series appointment trends | `database/advanced_queries.sql`<br>`backend/src/utils/sql-queries.ts`<br>`/admin/sql-explorer` | ✅ **100% Complete** |
| **4. Stored Procedures, Functions & Triggers** | **8 Marks** | • **5 Stored Procedures:** `book_appointment`, `complete_appointment`, `generate_bill`, `update_medicine_stock`, `get_patient_appointment_history`<br>• **3 Functions:** `calculate_patient_age`, `calculate_final_bill`, `get_doctor_experience_category`<br>• **3 Triggers:** Auto-decrement stock (`trg_reduce_stock`), reject negative inventory (`trg_prevent_negative_stock`), auto-update bill on payment (`trg_update_bill_on_payment`) | `database/procedures.sql`<br>`database/functions.sql`<br>`database/triggers.sql` | ✅ **100% Complete** |
| **5. ACID Transactions & Concurrency** | **8 Marks** | • Genuine MySQL `beginTransaction()`, `commit()`, `rollback()`<br>• Interactive Commit & Rollback demonstration<br>• Rollback verifies 0 orphaned records remain<br>• Pessimistic row locking via `SELECT ... FOR UPDATE`<br>• Redo log crash durability verification | `backend/src/routes/acid-lab.routes.ts`<br>`/admin/acid-lab` | ✅ **100% Complete** |
| **6. Full-Stack UI/UX, NoSQL & Viva** | **8 Marks** | • Next.js + Tailwind CSS SaaS UI with Lucide icons<br>• Supabase Auth + Private bucket document upload<br>• MongoDB NoSQL collections + Aggregation pipeline<br>• Cosine-similarity natural language vector search<br>• Exhaustive line-by-line viva guide for external examiner | `frontend/`<br>`mongodb/`<br>`docs/SQL_VIVA.md` | ✅ **100% Complete** |
| **TOTAL** | **50 Marks** | **Exhaustive DBMS Project Demonstration** | — | 🎯 **50 / 50 Marks** |

