'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeartPulse, User, Stethoscope, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '@/lib/api';

const ALL_DOCTORS = [
  { id: 1, name: 'Dr. Rajesh Sen', specialty: 'Cardiology', email: 'dr.rajesh.sen@example.com' },
  { id: 2, name: 'Dr. Sunita Rao', specialty: 'Dermatology', email: 'dr.sunita.rao@example.com' },
  { id: 3, name: 'Dr. Amit Kapoor', specialty: 'Orthopedics', email: 'dr.amit.kapoor@example.com' },
  { id: 4, name: 'Dr. Meera Nambiar', specialty: 'Pediatrics', email: 'dr.meera.nambiar@example.com' },
  { id: 5, name: 'Dr. Harish Bhat', specialty: 'Neurology', email: 'dr.harish.bhat@example.com' },
  { id: 6, name: 'Dr. Shalini Joshi', specialty: 'General Medicine', email: 'dr.shalini.joshi@example.com' },
  { id: 7, name: 'Dr. Manoj Trivedi', specialty: 'ENT', email: 'dr.manoj.trivedi@example.com' },
  { id: 8, name: 'Dr. Deepika Chatterjee', specialty: 'Ophthalmology', email: 'dr.deepika.chatterjee@example.com' },
  { id: 9, name: 'Dr. Sanjay Vaidya', specialty: 'Psychiatry', email: 'dr.sanjay.vaidya@example.com' },
  { id: 10, name: 'Dr. Anjali Kaur', specialty: 'Gynecology', email: 'dr.anjali.kaur@example.com' }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = (user: any, token: string, redirectPath: string) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    
    // Notify other components (e.g. Navbar)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    router.push(redirectPath);
    setTimeout(() => {
      if (window.location.pathname !== redirectPath) {
        window.location.href = redirectPath;
      }
    }, 200);
  };

  const handleDemoLogin = (role: 'patient' | 'doctor' | 'admin') => {
    const demoMap = {
      patient: { id: 'patient-1', role: 'patient', name: 'Aarav Sharma', refId: 1, email: 'aarav.sharma@example.com' },
      doctor: { id: 'doctor-1', role: 'doctor', name: 'Dr. Rajesh Sen', refId: 1, email: 'dr.rajesh.sen@example.com' },
      admin: { id: 'admin-1', role: 'admin', name: 'Hospital Administrator', refId: 1, email: 'admin@healthcare.com' }
    };

    const user = demoMap[role];
    const path = role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/admin';
    performLogin(user, `token-${role}-${user.refId}`, path);
  };

  const handleQuickDoctorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = Number(e.target.value);
    if (!docId) return;
    const doc = ALL_DOCTORS.find(d => d.id === docId);
    if (!doc) return;

    performLogin(
      {
        id: `doctor-${doc.id}`,
        role: 'doctor',
        name: doc.name,
        refId: doc.id,
        email: doc.email
      },
      `token-doctor-${doc.id}`,
      '/doctor'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanInput = email.toLowerCase().trim();

    try {
      const res = await authAPI.login(cleanInput, password || 'Doctor@123');
      if (res && res.success && res.user) {
        const dest = res.user.role === 'patient' ? '/patient' : res.user.role === 'doctor' ? '/doctor' : '/admin';
        performLogin(res.user, res.token || `token-${res.user.role}-${res.user.refId}`, dest);
        return;
      } else {
        // Fallback match against known doctor list
        const matched = ALL_DOCTORS.find(d => 
          d.email.toLowerCase() === cleanInput ||
          d.name.toLowerCase().includes(cleanInput) ||
          d.specialty.toLowerCase().includes(cleanInput) ||
          String(d.id) === cleanInput
        );
        if (matched) {
          performLogin(
            { id: `doctor-${matched.id}`, role: 'doctor', name: matched.name, refId: matched.id, email: matched.email },
            `token-doctor-${matched.id}`,
            '/doctor'
          );
          return;
        }
        setError(res?.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      // Fallback match against known doctor list
      const matched = ALL_DOCTORS.find(d => 
        d.email.toLowerCase() === cleanInput ||
        d.name.toLowerCase().includes(cleanInput) ||
        d.specialty.toLowerCase().includes(cleanInput) ||
        String(d.id) === cleanInput
      );
      if (matched) {
        performLogin(
          { id: `doctor-${matched.id}`, role: 'doctor', name: matched.name, refId: matched.id, email: matched.email },
          `token-doctor-${matched.id}`,
          '/doctor'
        );
        return;
      }
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to SmartCare</h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your patient health records, physician dashboard, or hospital operations
          </p>
        </div>

        {/* 1-Click Quick Login Cards */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            One-Click Instant Access
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('patient')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 text-center transition flex flex-col items-center shadow-sm"
            >
              <User className="w-4 h-4 text-cyan-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">Patient</span>
              <span className="text-[10px] text-slate-400">Aarav</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('doctor')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-center transition flex flex-col items-center shadow-sm"
            >
              <Stethoscope className="w-4 h-4 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">Doctor</span>
              <span className="text-[10px] text-slate-400">Dr. Sen</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-center transition flex flex-col items-center shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">Admin</span>
              <span className="text-[10px] text-slate-400">Control</span>
            </button>
          </div>

          {/* Quick Doctor Selector Dropdown */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 text-center">
              Switch &amp; Log In as Any Physician:
            </label>
            <select
              defaultValue=""
              onChange={handleQuickDoctorSelect}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="" disabled>-- Select Doctor to Log in Directly --</option>
              {ALL_DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Regular Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email, Name, or Doctor ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sunita, amit, dr.rajesh.sen@example.com, or admin"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tip: You can type doctor first name (e.g. &quot;sunita&quot;) or admin</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Doctor@123 (or leave blank for demo)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
