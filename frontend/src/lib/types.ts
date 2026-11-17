export interface Patient {
  p_id: number;
  supabase_user_id?: string;
  f_name: string;
  l_name: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  dob: string;
  age?: number;
  street: string;
  city: string;
  pincode: string;
  created_at?: string;
}

export interface Doctor {
  id: number;
  supabase_user_id?: string;
  f_name: string;
  l_name: string;
  email: string;
  qualification: string;
  experience: number;
  experience_tier?: string;
  consult_fee: number;
  city: string;
  pincode: string;
  phone_numbers?: string;
  completed_consultations?: number;
}

export interface DoctorAvailability {
  availability_id: number;
  doctor_id: number;
  doctor_name?: string;
  qualification?: string;
  consult_fee?: number;
  date: string;
  st_time: string;
  end_time: string;
  status: 'Available' | 'Booked' | 'Unavailable';
}

export interface Appointment {
  appointment_id: number;
  p_id: number;
  doctor_id: number;
  availability_id?: number;
  appointment_date: string;
  appointment_time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  patient_name?: string;
  patient_email?: string;
  patient_gender?: string;
  blood_group?: string;
  patient_age?: number;
  patient_city?: string;
  doctor_name?: string;
  qualification?: string;
  consult_fee?: number;
  bill_id?: number;
  bill_amount?: number;
  bill_status?: string;
  pers_id?: number;
  diagnosis?: string;
}

export interface PrescriptionMedicine {
  pers_id: number;
  medicine_id: number;
  medicine_name?: string;
  category?: string;
  price?: number;
  in_stock?: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instruction: string;
}

export interface Prescription {
  pers_id: number;
  appointment_id: number;
  symptoms: string;
  diagnosis: string;
  prescribed_date: string;
  follow_up_date?: string;
  patient_name?: string;
  doctor_name?: string;
  qualification?: string;
  medicines?: PrescriptionMedicine[];
}

export interface Medicine {
  id: number;
  name: string;
  category: string;
  price: number;
  in_stock: number;
  times_prescribed?: number;
}

export interface Bill {
  bill_id: number;
  appointment_id: number;
  p_id?: number;
  patient_id?: number;
  bill_date: string;
  amount: number;
  discount: number;
  final_amount?: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  patient_name?: string;
  patient_email?: string;
  doctor_name?: string;
  payment_id?: number;
  utr?: string;
  payment_method?: string;
  payment_status?: string;
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  utr: string;
  method: 'UPI' | 'Card' | 'Cash' | 'Net Banking';
  amount: number;
  status: 'Pending' | 'Success' | 'Failed';
  payment_date: string;
  patient_name?: string;
  doctor_name?: string;
}

export interface MedicalReport {
  report_id: string;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  report_type: 'Blood Test' | 'X-Ray' | 'MRI Scan' | 'CT Scan' | 'Ultrasound' | 'ECG' | 'Pathology' | 'Other';
  report_date: string;
  test_results: Record<string, any>;
  observations: string;
  storage_path: string;
  file_name: string;
  file_size_bytes?: number;
  created_at: string;
}

export interface PatientReview {
  review_id: string;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  appointment_id?: number;
  rating: number;
  review_text: string;
  tags?: string[];
  created_at: string;
}

export interface AuditLog {
  action: string;
  entity_type: string;
  entity_id: string | number;
  user_id: string;
  changes: any;
  ip_address?: string;
  timestamp: string;
}

