'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HeartPulse, 
  User, 
  Stethoscope, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  CreditCard,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentUser(null);
    router.push('/');
  };

  const handleQuickLogin = (role: 'patient' | 'doctor' | 'admin') => {
    const demoMap = {
      patient: { id: 'demo-patient-uuid', role: 'patient', name: 'Aarav Sharma', refId: 1, email: 'patient@healthcare.com' },
      doctor: { id: 'demo-doctor-uuid', role: 'doctor', name: 'Dr. Rajesh Sen', refId: 1, email: 'doctor@healthcare.com' },
      admin: { id: 'demo-admin-uuid', role: 'admin', name: 'Hospital Administrator', refId: 1, email: 'admin@healthcare.com' }
    };

    const user = demoMap[role];
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', `demo-${role}-token`);
    setCurrentUser(user);

    if (role === 'patient') router.push('/patient');
    else if (role === 'doctor') router.push('/doctor');
    else router.push('/admin');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                SmartCare
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link 
              href="/patient" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/patient') ? 'bg-cyan-50 text-cyan-700 font-semibold' : 'hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-cyan-600" />
              Patient Portal
            </Link>

            <Link 
              href="/doctor" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/doctor') ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Doctor Portal
            </Link>

            <Link 
              href="/admin" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === '/admin' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Admin Portal
            </Link>

            <Link 
              href="/bills" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/bills') ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Bills &amp; Payments
            </Link>
          </nav>

          {/* Right Action / Auth State */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{currentUser.name}</span>
                  <span className="text-[10px] uppercase font-bold text-cyan-600 tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* One-click quick demo switchers */}
                <div className="hidden lg:flex items-center gap-1 text-xs">
                  <span className="text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Access:
                  </span>
                  <button
                    onClick={() => handleQuickLogin('patient')}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 transition"
                  >
                    Patient
                  </button>
                  <button
                    onClick={() => handleQuickLogin('doctor')}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition"
                  >
                    Doctor
                  </button>
                  <button
                    onClick={() => handleQuickLogin('admin')}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 transition"
                  >
                    Admin
                  </button>
                </div>

                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
