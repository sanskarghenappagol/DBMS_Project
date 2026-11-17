'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HeartPulse, 
  User, 
  Stethoscope, 
  ShieldCheck, 
  Database, 
  Layers, 
  Server, 
  Search, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Activity, 
  Pill, 
  CreditCard 
} from 'lucide-react';
import { analyticsAPI } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({
    totalPatients: 15,
    totalDoctors: 10,
    totalAppointments: 22,
    totalRevenue: 8965
  });

  useEffect(() => {
    analyticsAPI.getStats()
      .then(res => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {
        // fallback
      });
  }, []);

  const handleQuickDemo = (role: 'patient' | 'doctor' | 'admin') => {
    const demoMap = {
      patient: { id: 'demo-patient-uuid', role: 'patient', name: 'Aarav Sharma', refId: 1, email: 'patient@healthcare.com' },
      doctor: { id: 'demo-doctor-uuid', role: 'doctor', name: 'Dr. Rajesh Sen', refId: 1, email: 'doctor@healthcare.com' },
      admin: { id: 'demo-admin-uuid', role: 'admin', name: 'Hospital Administrator', refId: 1, email: 'admin@healthcare.com' }
    };

    const user = demoMap[role];
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', `demo-${role}-token`);

    if (role === 'patient') router.push('/patient');
    else if (role === 'doctor') router.push('/doctor');
    else router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold border border-cyan-300 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
              <span>SmartCare Healthcare Platform • Modern Clinical Management &amp; Scheduling</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smart Healthcare &amp; <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
                Doctor Appointment Management System
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A complete clinical encounter, appointment scheduling, digital prescription, instant invoice billing, and medical records management platform designed for patients, doctors, and hospitals.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => handleQuickDemo('patient')}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition"
              >
                <User className="w-4 h-4" />
                Patient Portal
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleQuickDemo('doctor')}
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition"
              >
                <Stethoscope className="w-4 h-4" />
                Doctor Portal
              </button>

              <Link
                href="/bills"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 font-semibold text-sm border border-emerald-300 shadow-sm flex items-center gap-2 transition"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Bills &amp; Payments
              </Link>
            </div>
          </div>

          {/* Real Live Database Metrics Cards */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-blue-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Patients</span>
                <User className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.totalPatients}</div>
              <div className="text-xs text-slate-500 mt-1">Active Patient Profiles</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-cyan-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Doctors</span>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.totalDoctors}</div>
              <div className="text-xs text-slate-500 mt-1">Specialized Physicians</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Consultations</span>
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.totalAppointments}</div>
              <div className="text-xs text-slate-500 mt-1">Scheduled &amp; Completed Encounters</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Collected Revenue</span>
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Real-time Invoicing &amp; Settlement</div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-600">Enterprise Healthcare Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            Comprehensive Clinical &amp; Hospital Management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Scheduling & Consultations */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Smart Doctor Scheduling</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Seamless appointment booking with real-time slot availability, double-booking prevention, and instant confirmation for patients and specialists.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Real-time doctor calendar &amp; slots</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Automated slot reservation &amp; cancellation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Complete clinical encounter logs</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/patient" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Book Consultation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Billing & Pharmacy */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Billing, Invoices &amp; Pharmacy</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automated invoice generation, multi-method payment processing (UPI, Card, Cash), digital prescription signing, and pharmacy inventory synchronization.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant invoice creation upon appointment</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital payments via UPI, Cards &amp; Net Banking</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated pharmacy stock decrement</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/bills" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View Invoices &amp; Pay <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Reports & Administration */}
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Diagnostics &amp; Administration</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Medical report uploads, verified patient feedback reviews, comprehensive revenue analytics, and hospital administration controls.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Secure diagnostic reports &amp; lab results</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Verified doctor ratings &amp; reviews</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Financial revenue trends &amp; inventory alerts</li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/admin" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Hospital Administration <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Role Navigation Quick Launch */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Portal Access</h3>
            <p className="text-sm text-slate-500 mt-1">Select your portal to manage appointments, clinical care, or hospital operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Patient Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-cyan-50/50 hover:border-cyan-300 transition">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mb-3">
                <User className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">Patient Dashboard</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">Book doctors, view prescriptions, settle bills via UPI, upload test reports</p>
              <button
                onClick={() => handleQuickDemo('patient')}
                className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Access Patient Portal
              </button>
            </div>

            {/* Doctor Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-blue-50/50 hover:border-blue-300 transition">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">Doctor Dashboard</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">Manage availability slots, complete appointments, prescribe medications</p>
              <button
                onClick={() => handleQuickDemo('doctor')}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Access Doctor Portal
              </button>
            </div>

            {/* Admin Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-indigo-50/50 hover:border-indigo-300 transition">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">Administrator Portal</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">Live analytics, inventory stock, bill settlement, staff &amp; patient records</p>
              <button
                onClick={() => handleQuickDemo('admin')}
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Access Admin Portal
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300 font-medium">SmartCare Healthcare &amp; Doctor Appointment Management System</p>
          <p className="mt-1 text-slate-500">Comprehensive Clinical encounters, Scheduling, Pharmacy Inventory &amp; Online Invoicing</p>
        </div>
      </footer>

    </div>
  );
}
