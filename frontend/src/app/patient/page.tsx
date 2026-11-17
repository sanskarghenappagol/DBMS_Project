'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Stethoscope, 
  Calendar, 
  FileText, 
  CreditCard, 
  UploadCloud, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  XCircle,
  Pill,
  ShieldCheck,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { 
  patientsAPI, 
  doctorsAPI, 
  availabilityAPI, 
  appointmentsAPI, 
  prescriptionsAPI, 
  billsAPI, 
  paymentsAPI, 
  reportsAPI, 
  reviewsAPI 
} from '@/lib/api';
import { Doctor, Appointment, Prescription, Bill, MedicalReport } from '@/lib/types';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'book' | 'appointments' | 'prescriptions' | 'bills' | 'reports' | 'reviews'>('book');
  
  // Patient Profile state
  const [patient, setPatient] = useState<any>({
    p_id: 1,
    f_name: 'Aarav',
    l_name: 'Sharma',
    email: 'aarav.sharma@example.com',
    gender: 'Male',
    blood_group: 'O+',
    dob: '1990-05-15',
    age: 34,
    city: 'Mumbai'
  });

  // Data states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters for doctor search
  const [searchDoc, setSearchDoc] = useState('');
  const [selectedQualification, setSelectedQualification] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorSlots, setDoctorSlots] = useState<any[]>([]);

  // Payment modal state
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash' | 'Net Banking'>('UPI');

  // Review modal state
  const [reviewDoctorId, setReviewDoctorId] = useState<number>(1);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');

  // Report upload state
  const [reportType, setReportType] = useState('Blood Test');
  const [observations, setObservations] = useState('');
  const [fileName, setFileName] = useState('test_report.pdf');

  // Active Patient ID from authentication
  const [activePatientId, setActivePatientId] = useState<number>(1);
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('10:00:00');

  // Load patient data on mount
  useEffect(() => {
    setCustomDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    let pId = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.refId) {
            pId = Number(u.refId);
          }
        } catch {}
      }
    }
    setActivePatientId(pId);
    loadPatientProfile(pId);
    loadDoctors();
    loadAppointments(pId);
    loadPrescriptions(pId);
    loadBills(pId);
    loadReports(pId);
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadPatientProfile = async (id = activePatientId) => {
    try {
      const res = await patientsAPI.getById(id);
      if (res.data) setPatient(res.data);
    } catch {
      // fallback
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      if (res.data) setDoctors(res.data);
    } catch {
      // fallback
    }
  };

  const loadAppointments = async (id = activePatientId) => {
    try {
      const res = await patientsAPI.getAppointments(id);
      if (res.data) setAppointments(res.data);
    } catch {
      // fallback
    }
  };

  const loadPrescriptions = async (id = activePatientId) => {
    try {
      const res = await patientsAPI.getPrescriptions(id);
      if (res.data) setPrescriptions(res.data);
    } catch {
      // fallback
    }
  };

  const loadBills = async (id = activePatientId) => {
    try {
      const res = await patientsAPI.getBills(id);
      if (res.data) setBills(res.data);
    } catch {
      // fallback
    }
  };

  const loadReports = async (id = activePatientId) => {
    try {
      const res = await reportsAPI.getAll(undefined, { patient_id: String(id) });
      if (res.data) setReports(res.data);
    } catch {
      // fallback
    }
  };

  const handleSelectDoctor = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    try {
      const res = await doctorsAPI.getAvailability(doc.id, undefined, undefined);
      if (res.data) setDoctorSlots(res.data.filter((s: any) => s.status === 'Available'));
    } catch {
      setDoctorSlots([]);
    }
  };

  const handleBookAppointment = async (slot: any) => {
    setLoading(true);
    try {
      let cleanDate = String(slot.date);
      if (cleanDate.includes('T')) {
        cleanDate = cleanDate.split('T')[0];
      } else if (cleanDate.length > 10) {
        cleanDate = cleanDate.slice(0, 10);
      }

      let cleanTime = String(slot.st_time);
      if (cleanTime.length > 8) {
        cleanTime = cleanTime.slice(0, 8);
      }

      const payload = {
        p_id: Number(patient?.p_id || activePatientId || 1),
        doctor_id: Number(slot.doctor_id),
        availability_id: Number(slot.availability_id),
        appointment_date: cleanDate,
        appointment_time: cleanTime
      };

      const res = await appointmentsAPI.book(payload);
      if (res.success) {
        showNotification('success', 'Appointment confirmed successfully! Bill automatically generated.');
        setSelectedDoctor(null);
        setDoctorSlots([]);
        loadAppointments(activePatientId);
        loadBills(activePatientId);
        setActiveTab('appointments');
      } else {
        showNotification('error', res.error || 'Failed to book slot');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBookCustomAppointment = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      const payload = {
        p_id: Number(patient?.p_id || activePatientId || 1),
        doctor_id: Number(selectedDoctor.id),
        appointment_date: customDate,
        appointment_time: customTime
      };

      const res = await appointmentsAPI.book(payload);
      if (res.success) {
        showNotification('success', `Appointment confirmed with Dr. ${selectedDoctor.f_name} ${selectedDoctor.l_name}! Bill created.`);
        setSelectedDoctor(null);
        setDoctorSlots([]);
        loadAppointments(activePatientId);
        loadBills(activePatientId);
        setActiveTab('appointments');
      } else {
        showNotification('error', res.error || 'Failed to book appointment');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment? The doctor slot will be freed.')) return;
    try {
      const res = await appointmentsAPI.cancel(appointmentId);
      if (res.success) {
        showNotification('success', 'Appointment cancelled and doctor slot released.');
        loadAppointments(activePatientId);
        loadBills(activePatientId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handlePayBill = async () => {
    if (!payingBill) return;
    setLoading(true);
    try {
      const payload = {
        bill_id: payingBill.bill_id,
        amount: payingBill.final_amount || (payingBill.amount - payingBill.discount),
        method: paymentMethod,
        status: 'Success'
      };

      const res = await paymentsAPI.create(payload);
      if (res.success) {
        showNotification('success', 'Payment successful! Bill status updated to Paid.');
        setPayingBill(null);
        loadBills(activePatientId);
        loadAppointments(activePatientId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: patient?.p_id || activePatientId || 1,
        doctor_id: 1,
        report_type: reportType,
        report_date: new Date().toISOString().split('T')[0],
        test_results: { parameter: 'Normal', notes: 'Uploaded from patient dashboard' },
        observations,
        file_name: fileName,
        storage_path: `reports/${fileName}`
      };

      const res = await reportsAPI.create(payload);
      if (res.success) {
        showNotification('success', 'Medical report uploaded successfully.');
        setObservations('');
        loadReports(activePatientId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        doctor_id: reviewDoctorId,
        rating: reviewRating,
        review_text: reviewText,
        tags: ['Punctual', 'Polite', 'Accurate Diagnosis']
      };

      const res = await reviewsAPI.create(payload);
      if (res.success) {
        showNotification('success', 'Thank you! Your doctor review has been recorded.');
        setReviewText('');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-2xl shadow-inner">
            {patient.f_name?.[0]}{patient.l_name?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{patient.f_name} {patient.l_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                Patient #00{patient.p_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
              <span><strong>Email:</strong> {patient.email}</span>
              <span>•</span>
              <span><strong>Blood Group:</strong> {patient.blood_group}</span>
              <span>•</span>
              <span><strong>Age:</strong> {patient.age || 34} years</span>
              <span>•</span>
              <span><strong>City:</strong> {patient.city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('bills')} 
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition shadow-sm flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            Bills &amp; Payments ({bills.filter(b => b.status === 'Pending').length} Pending)
          </button>
          <button 
            onClick={() => setActiveTab('book')} 
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            + Book Appointment
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 mb-6 rounded-2xl flex items-center gap-3 border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          <span className="text-xs font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-6 mb-6 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('book')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'book' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          Find &amp; Book Doctors
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'appointments' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          My Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'prescriptions' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Prescriptions ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'bills' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Bills &amp; Payments ({bills.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reports' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Medical Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reviews' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          Review Doctors
        </button>
      </div>

      {/* TAB 1: FIND & BOOK DOCTORS */}
      {activeTab === 'book' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by doctor name or specialty..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Specializations</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
            </select>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors
              .filter(d => {
                const matchSearch = (d.f_name + ' ' + d.l_name + ' ' + d.qualification).toLowerCase().includes(searchDoc.toLowerCase());
                const matchQual = selectedQualification ? d.qualification.includes(selectedQualification) : true;
                return matchSearch && matchQual;
              })
              .map(doc => (
                <div 
                  key={doc.id}
                  className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                    selectedDoctor?.id === doc.id ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Dr. {doc.f_name} {doc.l_name}</h3>
                        <p className="text-xs text-cyan-700 font-semibold mt-0.5">{doc.qualification}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100">
                        ₹{doc.consult_fee}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p><strong>Experience:</strong> {doc.experience} Years ({doc.experience_tier || 'Senior'})</p>
                      <p><strong>Location:</strong> {doc.city}</p>
                      <p><strong>Phones:</strong> {doc.phone_numbers || '+91-9820011223'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleSelectDoctor(doc)}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      View Available Slots
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Slot Selection Drawer/Section */}
          {selectedDoctor && (
            <div className="bg-white p-6 rounded-3xl border-2 border-cyan-400 shadow-lg mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Open Availability Slots for Dr. {selectedDoctor.f_name} {selectedDoctor.l_name}
                  </h3>
                  <p className="text-xs text-slate-500">Consultation Fee: ₹{selectedDoctor.consult_fee} (Billed automatically)</p>
                </div>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>

              {/* Pre-existing slots */}
              {doctorSlots.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Available Time Slots:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {doctorSlots.map((slot) => (
                      <div 
                        key={slot.availability_id}
                        className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{String(slot.date).slice(0, 10)}</div>
                          <div className="text-xs text-cyan-800 font-semibold mt-0.5">{slot.st_time} - {slot.end_time}</div>
                        </div>
                        <button
                          disabled={loading}
                          onClick={() => handleBookAppointment(slot)}
                          className="mt-3 w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          {loading ? 'Booking...' : 'Book Slot'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instant Custom Booking */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-1">
                  {doctorSlots.length === 0 ? 'No pre-set slots open. Pick your preferred appointment schedule:' : 'Or Select a Custom Date & Time:'}
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Instantly book an appointment with Dr. {selectedDoctor.f_name} {selectedDoctor.l_name} on your chosen date.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Appointment Date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Appointment Time</label>
                    <select
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="09:00:00">09:00 AM</option>
                      <option value="10:00:00">10:00 AM</option>
                      <option value="11:00:00">11:00 AM</option>
                      <option value="12:00:00">12:00 PM</option>
                      <option value="14:00:00">02:00 PM</option>
                      <option value="15:00:00">03:00 PM</option>
                      <option value="16:00:00">04:00 PM</option>
                      <option value="17:00:00">05:00 PM</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleBookCustomAppointment}
                      className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      {loading ? 'Booking...' : `Confirm Appointment (₹${selectedDoctor.consult_fee})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Consultation Encounter History</h3>
            <span className="text-xs text-slate-400">{appointments.length} Consultations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date &amp; Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Bill Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.appointment_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-700">#{apt.appointment_id}</td>
                    <td className="p-3 font-medium text-slate-900">{apt.doctor_name || 'Dr. Specialist'}</td>
                    <td className="p-3 text-slate-600">{apt.appointment_date} at {apt.appointment_time}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        apt.status === 'Scheduled' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        apt.bill_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {apt.bill_status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {apt.bill_status === 'Pending' && (
                        <button
                          onClick={() => {
                            const matchingBill = bills.find(b => b.appointment_id === apt.appointment_id) || bills.find(b => b.status === 'Pending');
                            if (matchingBill) {
                              setPayingBill(matchingBill);
                            } else {
                              setActiveTab('bills');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                        >
                          Pay Bill
                        </button>
                      )}
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(apt.appointment_id)}
                          className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map((p) => (
            <div key={p.pers_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-xs font-bold text-cyan-700">Prescription #{p.pers_id}</span>
                  <h4 className="text-sm font-bold text-slate-900">{p.doctor_name}</h4>
                </div>
                <div className="text-xs text-slate-500">
                  <span>Prescribed Date: {p.prescribed_date}</span>
                  {p.follow_up_date && <span className="ml-3 font-semibold text-blue-600">• Follow-up: {p.follow_up_date}</span>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Symptoms:</span>
                  <p className="text-slate-700">{p.symptoms || 'General malaise and routine consultation'}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100">
                  <span className="font-bold text-cyan-700 uppercase tracking-wider block mb-1">Clinical Diagnosis:</span>
                  <p className="text-slate-800 font-semibold">{p.diagnosis}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: BILLS & PAYMENTS */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Invoices &amp; Online Payment</h3>
            <span className="text-xs text-slate-500">Secure Online Payments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Gross Amount</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Net Payable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.bill_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-700">#{b.bill_id}</td>
                    <td className="p-3 text-slate-600">{b.bill_date}</td>
                    <td className="p-3 font-medium text-slate-900">{b.doctor_name || 'Dr. Specialist'}</td>
                    <td className="p-3">₹{b.amount}</td>
                    <td className="p-3 text-emerald-600">-₹{b.discount}</td>
                    <td className="p-3 font-bold text-slate-900">₹{b.final_amount || (b.amount - b.discount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status === 'Pending' ? (
                        <button
                          onClick={() => setPayingBill(b)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold">UTR Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Process Settle Payment</h3>
            <p className="text-xs text-slate-500 mb-4">Invoice #{payingBill.bill_id} • Amount: ₹{payingBill.final_amount || (payingBill.amount - payingBill.discount)}</p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-slate-700">Select Payment Instrument:</label>
              {(['UPI', 'Card', 'Net Banking', 'Cash'] as const).map((method) => (
                <label 
                  key={method} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                    paymentMethod === method ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium text-slate-800">{method}</span>
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPayingBill(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handlePayBill}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                {loading ? 'Processing...' : 'Confirm ₹' + (payingBill.final_amount || (payingBill.amount - payingBill.discount))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MEDICAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* Upload Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Upload New Diagnostic Report</h3>
            <p className="text-xs text-slate-500 mb-4">Securely upload diagnostic test results, lab reports, and imaging scans.</p>

            <form onSubmit={handleUploadReport} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                >
                  <option value="Blood Test">Blood Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI Scan">MRI Scan</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="ECG">ECG</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes</label>
                <input
                  type="text"
                  placeholder="Routine test..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition"
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep) => (
              <div key={rep.report_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-700 px-2 py-0.5 rounded bg-cyan-50">
                      {rep.report_type}
                    </span>
                    <span className="text-[11px] text-slate-400">{rep.report_date?.toString().slice(0, 10)}</span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">{rep.file_name}</h4>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {rep.observations || 'Normal diagnostic review recorded.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>File: {rep.file_name}</span>
                  <span className="text-cyan-600 font-semibold">Verified Report</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 6: DOCTOR REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">Submit Doctor Review</h3>
          <p className="text-xs text-slate-500 mb-5">Share your feedback to help improve clinical care and assist other patients.</p>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
              <select
                value={reviewDoctorId}
                onChange={(e) => setReviewDoctorId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.f_name} {d.l_name} ({d.qualification})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback &amp; Experience</label>
              <textarea
                rows={3}
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Dr. Sen was very polite and explained my condition thoroughly..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
            >
              Submit Doctor Review
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

