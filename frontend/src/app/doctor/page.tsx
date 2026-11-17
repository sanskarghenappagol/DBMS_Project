'use client';

import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Pill, 
  User, 
  Activity, 
  UploadCloud, 
  ChevronRight 
} from 'lucide-react';
import { 
  doctorsAPI, 
  appointmentsAPI, 
  prescriptionsAPI, 
  medicinesAPI, 
  availabilityAPI, 
  reportsAPI 
} from '@/lib/api';
import { Appointment, Medicine, MedicalReport } from '@/lib/types';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescribe' | 'slots' | 'reports'>('appointments');

  const [doctor, setDoctor] = useState<any>({
    id: 1,
    f_name: 'Rajesh',
    l_name: 'Sen',
    email: 'dr.rajesh.sen@example.com',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 15,
    experience_tier: 'Senior Specialist',
    consult_fee: 1200,
    city: 'Mumbai',
    completed_consultations: 8
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Prescription Form State
  const [prescribingApt, setPrescribingApt] = useState<Appointment | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescribedMeds, setPrescribedMeds] = useState<Array<{
    medicine_id: number;
    dosage: string;
    frequency: string;
    duration_days: number;
    instruction: string;
  }>>([
    { medicine_id: 1, dosage: '75mg', frequency: 'Once daily after dinner', duration_days: 15, instruction: 'Take with warm water' }
  ]);

  // Active Doctor ID from session
  const [activeDoctorId, setActiveDoctorId] = useState<number>(1);

  // New Slot Form State
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('10:00:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00:00');

  useEffect(() => {
    setNewSlotDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    let dId = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.refId) {
            dId = Number(u.refId);
          }
        } catch {}
      }
    }
    setActiveDoctorId(dId);
    loadDoctorProfile(dId);
    loadAppointments(dId);
    loadMedicines();
    loadSlots(dId);
    loadReports();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadDoctorProfile = async (id = activeDoctorId) => {
    try {
      const res = await doctorsAPI.getById(id);
      if (res.data) setDoctor(res.data);
    } catch {
      // fallback
    }
  };

  const loadAppointments = async (id = activeDoctorId) => {
    try {
      const res = await doctorsAPI.getAppointments(id);
      if (res.data) setAppointments(res.data);
    } catch {
      // fallback
    }
  };

  const loadMedicines = async () => {
    try {
      const res = await medicinesAPI.getAll();
      if (res.data) setMedicines(res.data);
    } catch {
      // fallback
    }
  };

  const loadSlots = async (id = activeDoctorId) => {
    try {
      const res = await doctorsAPI.getAvailability(id);
      if (res.data) setSlots(res.data);
    } catch {
      // fallback
    }
  };

  const loadReports = async () => {
    try {
      const res = await reportsAPI.getAll();
      if (res.data) setReports(res.data);
    } catch {
      // fallback
    }
  };

  const handleCompleteAppointment = async (aptId: number) => {
    try {
      const res = await appointmentsAPI.complete(aptId);
      if (res.success) {
        showNotification('success', 'Appointment marked as Completed.');
        loadAppointments();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleAddMedicineRow = () => {
    setPrescribedMeds([
      ...prescribedMeds,
      { medicine_id: medicines[0]?.id || 1, dosage: '1 tablet', frequency: 'Twice daily', duration_days: 7, instruction: 'After food' }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setPrescribedMeds(prescribedMeds.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribingApt) return;
    setLoading(true);

    try {
      const payload = {
        appointment_id: prescribingApt.appointment_id,
        symptoms,
        diagnosis,
        prescribed_date: new Date().toISOString().split('T')[0],
        follow_up_date: followUpDate || null,
        medicines: prescribedMeds
      };

      const res = await prescriptionsAPI.create(payload);
      if (res.success) {
        showNotification('success', 'Prescription saved and pharmacy inventory updated successfully.');
        setPrescribingApt(null);
        setSymptoms('');
        setDiagnosis('');
        loadAppointments();
        loadMedicines();
        setActiveTab('appointments');
      } else {
        showNotification('error', res.error || 'Failed to create prescription');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Trigger or database error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        doctor_id: Number(doctor?.id || activeDoctorId || 1),
        date: newSlotDate,
        st_time: newSlotStart,
        end_time: newSlotEnd,
        status: 'Available'
      };

      const res = await availabilityAPI.create(payload);
      if (res.success) {
        showNotification('success', 'Availability slot added successfully.');
        loadSlots(activeDoctorId);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Doctor Header Profile */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-inner">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Dr. {doctor.f_name} {doctor.l_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {doctor.experience_tier || 'Senior Specialist'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
              <span><strong>Specialization:</strong> {doctor.qualification}</span>
              <span>•</span>
              <span><strong>Experience:</strong> {doctor.experience} Years</span>
              <span>•</span>
              <span><strong>Consultation Fee:</strong> ₹{doctor.consult_fee}</span>
              <span>•</span>
              <span><strong>Location:</strong> {doctor.city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('slots')} 
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            + Add Availability Slot
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
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'appointments' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Assigned Consultations ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'slots' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Availability Calendar ({slots.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reports' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Patient Medical Reports ({reports.length})
        </button>
      </div>

      {/* TAB 1: ASSIGNED APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Patient Clinical Encounters</h3>
            <span className="text-xs text-slate-400">{appointments.length} Consultations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Apt ID</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Demographics</th>
                  <th className="p-3">Date &amp; Time</th>
                  <th className="p-3">Encounter Status</th>
                  <th className="p-3 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.appointment_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-700">#{apt.appointment_id}</td>
                    <td className="p-3 font-bold text-slate-900">{apt.patient_name}</td>
                    <td className="p-3 text-slate-600">
                      {apt.patient_age} yrs • {apt.patient_gender} • {apt.blood_group}
                    </td>
                    <td className="p-3 text-slate-600">{apt.appointment_date} at {apt.appointment_time}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        apt.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {apt.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => {
                              setPrescribingApt(apt);
                              setActiveTab('prescribe');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm"
                          >
                            + Prescribe Rx
                          </button>
                          <button
                            onClick={() => handleCompleteAppointment(apt.appointment_id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {apt.status === 'Completed' && (
                        <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Encounter Prescribed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WRITE PRESCRIPTION */}
      {activeTab === 'prescribe' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Digital Prescription</h3>
              <p className="text-xs text-slate-500">
                {prescribingApt ? `Patient: ${prescribingApt.patient_name} • Apt #${prescribingApt.appointment_id}` : 'Select an appointment to prescribe'}
              </p>
            </div>
            <button onClick={() => setActiveTab('appointments')} className="text-xs text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>

          {!prescribingApt ? (
            <div className="text-center py-10">
              <p className="text-xs text-slate-500 mb-3">Please choose an active scheduled appointment to write a prescription.</p>
              <button 
                onClick={() => setActiveTab('appointments')} 
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Go to Appointments
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePrescription} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms Reported</label>
                  <textarea
                    rows={2}
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Shortness of breath on exertion, fatigue..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
                  <textarea
                    rows={2}
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Mild Angina Pectoris; Stage 1 Hypertension..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              {/* Prescribed Medicines Repeater */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Prescribed Medicines &amp; Pharmacy Dispensation
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {prescribedMeds.map((med, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Medicine &amp; In-Stock</label>
                        <select
                          value={med.medicine_id}
                          onChange={(e) => {
                            const updated = [...prescribedMeds];
                            updated[idx].medicine_id = Number(e.target.value);
                            setPrescribedMeds(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Stock: {m.in_stock} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => {
                            const updated = [...prescribedMeds];
                            updated[idx].dosage = e.target.value;
                            setPrescribedMeds(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Duration (Days)</label>
                        <input
                          type="number"
                          value={med.duration_days}
                          onChange={(e) => {
                            const updated = [...prescribedMeds];
                            updated[idx].duration_days = Number(e.target.value);
                            setPrescribedMeds(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="flex items-end justify-between gap-1">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Instructions</label>
                          <input
                            type="text"
                            value={med.instruction}
                            onChange={(e) => {
                              const updated = [...prescribedMeds];
                              updated[idx].instruction = e.target.value;
                              setPrescribedMeds(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        {prescribedMeds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
                >
                  {loading ? 'Deducting Stock & Signing...' : 'Sign & Complete Prescription'}
                </button>
              </div>

            </form>
          )}
        </div>
      )}

      {/* TAB 3: SLOTS */}
      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add slot widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Create Availability Slot</h3>
            <p className="text-xs text-slate-500 mb-4">Set your available consultation hours.</p>

            <form onSubmit={handleCreateSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
              >
                + Add Slot
              </button>
            </form>
          </div>

          {/* Slots list */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Configured Doctor Availability Slots</h3>
              <span className="text-xs text-slate-400">Total: {slots.length} Slots</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {slots.map((s) => (
                <div key={s.availability_id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{s.date}</span>
                    <span className="text-slate-500 ml-2">{s.st_time} - {s.end_time}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    s.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                    s.status === 'Booked' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => (
            <div key={rep.report_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50">
                    {rep.report_type}
                  </span>
                  <span className="text-[11px] text-slate-400">{rep.report_date?.toString().slice(0, 10)}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{rep.file_name}</h4>
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {rep.observations}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Patient ID: #{rep.patient_id}</span>
                <span className="text-blue-600 font-semibold">Verified Medical Record</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

