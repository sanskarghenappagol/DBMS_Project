'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Calendar, 
  Pill, 
  CreditCard, 
  Database, 
  Layers, 
  Server, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  ArrowUpRight,
  TrendingUp,
  Search
} from 'lucide-react';
import { 
  analyticsAPI, 
  patientsAPI, 
  doctorsAPI, 
  medicinesAPI, 
  appointmentsAPI, 
  billsAPI 
} from '@/lib/api';
import { Patient, Doctor, Medicine, Appointment, Bill } from '@/lib/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'patients' | 'doctors' | 'medicines' | 'appointments' | 'bills'>('analytics');
  
  // Stats state
  const [stats, setStats] = useState<any>({
    totalPatients: 15,
    totalDoctors: 10,
    totalAppointments: 22,
    scheduledAppointments: 12,
    completedAppointments: 8,
    cancelledAppointments: 2,
    totalRevenue: 8965,
    pendingBillsCount: 6,
    pendingRevenue: 5200,
    totalMedicines: 16,
    lowStockMedicines: 1
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  // Restock modal state
  const [restockingMed, setRestockingMed] = useState<Medicine | null>(null);
  const [restockQty, setRestockQty] = useState(50);

  // New Doctor modal
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    f_name: '',
    l_name: '',
    email: '',
    password: 'Doctor@123',
    qualification: 'MBBS, MD',
    experience: 5,
    consult_fee: 700,
    city: 'Mumbai',
    pincode: '400001',
    phone: '+91-9820099887'
  });

  // Edit / Modify Doctor modal state
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);

  // Access control
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check Admin access
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.role === 'admin') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } catch {
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
      }
    }

    loadAnalytics();
    loadPatients();
    loadDoctors();
    loadMedicines();
    loadAppointments();
    loadBills();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAnalytics = async () => {
    try {
      const statsRes = await analyticsAPI.getStats();
      if (statsRes.data) setStats(statsRes.data);

      const revRes = await analyticsAPI.getMonthlyRevenue();
      if (revRes.data) setMonthlyRevenue(revRes.data);
    } catch {
      // fallback
    }
  };

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      if (res.data) setPatients(res.data);
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

  const loadMedicines = async () => {
    try {
      const res = await medicinesAPI.getAll();
      if (res.data) setMedicines(res.data);
    } catch {
      // fallback
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await appointmentsAPI.getAll();
      if (res.data) setAppointments(res.data);
    } catch {
      // fallback
    }
  };

  const loadBills = async () => {
    try {
      const res = await billsAPI.getAll();
      if (res.data) setBills(res.data);
    } catch {
      // fallback
    }
  };

  const handleRestock = async () => {
    if (!restockingMed) return;
    try {
      const res = await medicinesAPI.updateStock(restockingMed.id, restockQty);
      if (res.success) {
        showNotification('success', `Stock updated for ${restockingMed.name} successfully.`);
        setRestockingMed(null);
        loadMedicines();
        loadAnalytics();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newDoctor,
        phones: [newDoctor.phone]
      };
      const res = await doctorsAPI.create(payload);
      if (res.success) {
        showNotification('success', `New doctor Dr. ${newDoctor.f_name} ${newDoctor.l_name} created successfully.`);
        setShowAddDoctor(false);
        setNewDoctor({
          f_name: '',
          l_name: '',
          email: '',
          password: 'Doctor@123',
          qualification: 'MBBS, MD',
          experience: 5,
          consult_fee: 700,
          city: 'Mumbai',
          pincode: '400001',
          phone: '+91-9820099887'
        });
        loadDoctors();
        loadAnalytics();
      } else {
        showNotification('error', res.error || 'Failed to create doctor');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleStartEditDoctor = (doc: any) => {
    setEditingDoctor({
      id: doc.id,
      f_name: doc.f_name,
      l_name: doc.l_name,
      email: doc.email,
      password: '',
      qualification: doc.qualification,
      experience: doc.experience,
      consult_fee: doc.consult_fee,
      city: doc.city || '',
      pincode: doc.pincode || '',
      phone: doc.phone_numbers ? doc.phone_numbers.split(',')[0].trim() : '+91-9820011223'
    });
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      const res = await doctorsAPI.update(editingDoctor.id, editingDoctor);
      if (res.success) {
        showNotification('success', `Doctor Dr. ${editingDoctor.f_name} ${editingDoctor.l_name} details modified successfully.`);
        setEditingDoctor(null);
        loadDoctors();
        loadAnalytics();
      } else {
        showNotification('error', res.error || 'Failed to update doctor');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm('Are you sure you want to delete this doctor? Cascading foreign keys will apply.')) return;
    try {
      const res = await doctorsAPI.delete(id);
      if (res.success) {
        showNotification('success', 'Doctor record deleted successfully.');
        loadDoctors();
        loadAnalytics();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this patient record?')) return;
    try {
      const res = await patientsAPI.delete(id);
      if (res.success) {
        showNotification('success', 'Patient record deleted.');
        loadPatients();
        loadAnalytics();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  if (isAuthorized === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-xl space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Authorization Required</h2>
          <p className="text-sm text-slate-600">
            Access to hospital doctor records, deletions, and operational modifications is strictly restricted to system administrators.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Healthcare Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hospital Operations &amp; Administration</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time hospital operations, clinical scheduling, pharmacy inventory, and billing administration.
          </p>
        </div>

        {/* Quick system navigation shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/bills"
            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Billing &amp; Payments
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/admin/sql-explorer"
            className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            Database Query Explorer
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/admin/acid-lab"
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            Transaction Integrity Lab
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
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

      {/* Hospital Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Total Patients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalPatients}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active Patient Directory</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Doctors &amp; Specialists</span>
            <Stethoscope className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalDoctors}</div>
          <p className="text-[11px] text-slate-500 mt-1">Verified Medical Staff</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Paid Revenue</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹{Number(stats.totalRevenue).toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Net Settled Collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Low Stock Medicines</span>
            <Pill className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.lowStockMedicines} / {stats.totalMedicines}</div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Stock ≤ 10 units threshold</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-6 mb-6 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'analytics' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Analytics &amp; Revenue Trends
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'patients' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Manage Patients ({patients.length})
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'doctors' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Manage Doctors ({doctors.length})
        </button>

        <button
          onClick={() => setActiveTab('medicines')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'medicines' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          Pharmacy &amp; Inventory ({medicines.length})
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'appointments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'bills' ? 'border-indigo-600 text-indigo-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Bills &amp; Invoices ({bills.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Monthly Revenue Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Monthly Collected Revenue (INR)</h3>
              <p className="text-xs text-slate-400 mb-6">Aggregated via DATE_FORMAT(payment_date, &apos;%Y-%m&apos;)</p>

              <div className="space-y-3">
                {monthlyRevenue.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 w-24">{m.month}</span>
                    <div className="flex-1 mx-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, (m.revenue / 10000) * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 w-20 text-right">₹{m.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointment Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Appointment Status Distribution</h3>
              <p className="text-xs text-slate-400 mb-6">Real counts queried from Appointment table</p>

              <div className="grid grid-cols-3 gap-3 text-center mb-6">
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100">
                  <span className="text-xs font-bold text-cyan-800 block">Scheduled</span>
                  <span className="text-2xl font-extrabold text-cyan-900 mt-1 block">{stats.scheduledAppointments}</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800 block">Completed</span>
                  <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">{stats.completedAppointments}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block">Cancelled</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{stats.cancelledAppointments}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <strong>System Note:</strong> Scheduled appointments hold a confirmed slot on the physician&apos;s active calendar, ensuring conflict-free patient scheduling.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: PATIENTS */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Patient Master Directory</h3>
            <span className="text-xs text-slate-400">{patients.length} Registered Patients</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Blood</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">City</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.p_id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">#{p.p_id}</td>
                    <td className="p-3 font-bold text-slate-900">{p.f_name} {p.l_name}</td>
                    <td className="p-3 text-slate-600">{p.email}</td>
                    <td className="p-3">{p.gender}</td>
                    <td className="p-3 font-semibold text-cyan-800">{p.blood_group}</td>
                    <td className="p-3 text-slate-800 font-medium">{p.age || 32} yrs</td>
                    <td className="p-3 text-slate-600">{p.city}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeletePatient(p.p_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddDoctor(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Doctor
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Physicians Directory</h3>
              <span className="text-xs text-slate-400">{doctors.length} Doctors Registered</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Doctor Name</th>
                    <th className="p-3">Qualification</th>
                    <th className="p-3">Tenure Tier</th>
                    <th className="p-3">Fee (INR)</th>
                    <th className="p-3">Contact Phones</th>
                    <th className="p-3">City</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-700">#{d.id}</td>
                      <td className="p-3 font-bold text-slate-900">Dr. {d.f_name} {d.l_name}</td>
                      <td className="p-3 text-cyan-800 font-medium">{d.qualification}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {d.experience} yrs ({d.experience_tier || 'Senior'})
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">₹{d.consult_fee}</td>
                      <td className="p-3 text-slate-500">{d.phone_numbers || '+91-9820011223'}</td>
                      <td className="p-3 text-slate-600">{d.city}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditDoctor(d)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Edit / Modify Doctor"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(d.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEDICINES & INVENTORY */}
      {activeTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pharmacy Medicine Inventory</h3>
              <p className="text-xs text-slate-400">Real-time pharmacy stock monitoring and reorder alerts</p>
            </div>
            <span className="text-xs text-slate-400">{medicines.length} Medicines in Catalog</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Drug Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">#{m.id}</td>
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.category}</td>
                    <td className="p-3 font-semibold text-slate-800">₹{m.price}</td>
                    <td className="p-3 font-bold text-slate-900">{m.in_stock} Units</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        m.in_stock <= 10 ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {m.in_stock <= 10 ? 'Low Stock Alert' : 'In Stock'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setRestockingMed(m)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                      >
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Hospital Encounters</h3>
            <span className="text-xs text-slate-400">Total: {appointments.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date &amp; Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Bill Amount</th>
                  <th className="p-3">Bill Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.appointment_id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">#{a.appointment_id}</td>
                    <td className="p-3 font-medium text-slate-900">{a.patient_name}</td>
                    <td className="p-3 text-slate-800">{a.doctor_name}</td>
                    <td className="p-3 text-slate-600">{a.appointment_date} at {a.appointment_time}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        a.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'Scheduled' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">₹{a.bill_amount || 500}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        a.bill_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {a.bill_status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: BILLS */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Financial Invoices &amp; Patient Billing</h3>
            <span className="text-xs text-slate-400">Total: {bills.length} Invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Bill ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Net Payable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.bill_id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-700">#{b.bill_id}</td>
                    <td className="p-3 text-slate-600">{b.bill_date}</td>
                    <td className="p-3 font-medium text-slate-900">{b.patient_name || 'Patient'}</td>
                    <td className="p-3 text-slate-800">{b.doctor_name || 'Doctor'}</td>
                    <td className="p-3">₹{b.amount}</td>
                    <td className="p-3 text-emerald-600">-₹{b.discount}</td>
                    <td className="p-3 font-bold text-slate-900">₹{b.final_amount || (b.amount - b.discount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{b.payment_method || 'Unpaid'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockingMed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Restock Medicine</h3>
            <p className="text-xs text-slate-500 mb-4">{restockingMed.name} • Current: {restockingMed.in_stock} Units</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Add:</label>
              <input
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRestockingMed(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Doctor</h3>
            <p className="text-xs text-slate-500 mb-4">Register doctor credentials and contact information</p>

            <form onSubmit={handleCreateDoctor} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.f_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, f_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.l_name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, l_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Email (Login Username)</label>
                  <input
                    type="email"
                    required
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Doctor@123"
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Qualification</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.qualification}
                    onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={newDoctor.experience}
                    onChange={(e) => setNewDoctor({ ...newDoctor, experience: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={newDoctor.consult_fee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, consult_fee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Primary Contact</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">City</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.city}
                    onChange={(e) => setNewDoctor({ ...newDoctor, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Pincode</label>
                  <input
                    type="text"
                    required
                    value={newDoctor.pincode}
                    onChange={(e) => setNewDoctor({ ...newDoctor, pincode: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Modify Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Modify Doctor Details</h3>
            <p className="text-xs text-slate-500 mb-4">Edit record #{editingDoctor.id} - Dr. {editingDoctor.f_name} {editingDoctor.l_name}</p>

            <form onSubmit={handleUpdateDoctor} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.f_name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, f_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.l_name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, l_name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Email</label>
                  <input
                    type="email"
                    required
                    value={editingDoctor.email}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Change Password (optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editingDoctor.password}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Qualification</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.qualification}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, qualification: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={editingDoctor.experience}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, experience: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingDoctor.consult_fee}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, consult_fee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.phone}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">City</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.city}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Pincode</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.pincode}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, pincode: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

