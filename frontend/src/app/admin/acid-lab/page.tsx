'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Lock, 
  HardDrive, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { acidLabAPI } from '@/lib/api';

export default function ACIDLabPage() {
  const [activeProperty, setActiveProperty] = useState<'atomicity' | 'consistency' | 'isolation' | 'durability'>('atomicity');
  const [running, setRunning] = useState(false);
  const [atomicityResult, setAtomicityResult] = useState<any | null>(null);
  const [consistencyResult, setConsistencyResult] = useState<any | null>(null);
  const [isolationResult, setIsolationResult] = useState<any | null>(null);
  const [durabilityResult, setDurabilityResult] = useState<any | null>(null);

  // Run Atomicity Success (Commit)
  const handleRunSuccess = async () => {
    setRunning(true);
    setAtomicityResult(null);
    try {
      const res = await acidLabAPI.runAtomicitySuccess();
      setAtomicityResult(res);
    } catch (err: any) {
      setAtomicityResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // Run Atomicity Failure (Rollback)
  const handleRunFailure = async () => {
    setRunning(true);
    setAtomicityResult(null);
    try {
      const res = await acidLabAPI.runAtomicityFailure();
      setAtomicityResult(res);
    } catch (err: any) {
      setAtomicityResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // Run Consistency Test
  const handleRunConsistency = async () => {
    setRunning(true);
    try {
      const res = await acidLabAPI.runConsistency();
      setConsistencyResult(res);
    } catch (err: any) {
      setConsistencyResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // Run Isolation Test
  const handleRunIsolation = async () => {
    setRunning(true);
    try {
      const res = await acidLabAPI.runIsolation();
      setIsolationResult(res);
    } catch (err: any) {
      setIsolationResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // Run Durability Test
  const handleRunDurability = async () => {
    setRunning(true);
    try {
      const res = await acidLabAPI.runDurability();
      setDurabilityResult(res);
    } catch (err: any) {
      setDurabilityResult({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Real MySQL Transaction Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-amber-600" />
            ACID Transaction Visualizer &amp; Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Demonstrates real InnoDB transaction execution, commit, atomic rollback, constraint consistency, and locking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/sql-explorer"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            Go to SQL Explorer
          </Link>
        </div>
      </div>

      {/* ACID Property Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        {/* A - Atomicity */}
        <button
          onClick={() => setActiveProperty('atomicity')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            activeProperty === 'atomicity' ? 'border-amber-500 bg-amber-50/60 shadow-sm ring-2 ring-amber-200' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center mb-2">
              A
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Atomicity</h3>
            <p className="text-xs text-slate-500 mt-0.5">All-or-Nothing Unit of Work</p>
          </div>
          <span className="text-[10px] text-amber-700 font-bold mt-3 block">COMMIT / ROLLBACK</span>
        </button>

        {/* C - Consistency */}
        <button
          onClick={() => setActiveProperty('consistency')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            activeProperty === 'consistency' ? 'border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center mb-2">
              C
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Consistency</h3>
            <p className="text-xs text-slate-500 mt-0.5">Schema Constraints Enforced</p>
          </div>
          <span className="text-[10px] text-blue-700 font-bold mt-3 block">CHECK Constraints</span>
        </button>

        {/* I - Isolation */}
        <button
          onClick={() => setActiveProperty('isolation')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            activeProperty === 'isolation' ? 'border-indigo-500 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center mb-2">
              I
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Isolation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Row-Level Locking Protection</p>
          </div>
          <span className="text-[10px] text-indigo-700 font-bold mt-3 block">SELECT ... FOR UPDATE</span>
        </button>

        {/* D - Durability */}
        <button
          onClick={() => setActiveProperty('durability')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            activeProperty === 'durability' ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center mb-2">
              D
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Durability</h3>
            <p className="text-xs text-slate-500 mt-0.5">Redo Log Crash Persistence</p>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold mt-3 block">Committed Persistence</span>
        </button>

      </div>

      {/* SECTION 1: ATOMICITY DEMO */}
      {activeProperty === 'atomicity' && (
        <div className="space-y-6">
          
          {/* Explanation Banner */}
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <h4 className="font-bold text-sm mb-1 text-amber-950">Atomicity Property:</h4>
            Atomicity guarantees that all statements in the transaction boundary (inserting an Appointment tuple and creating its accompanying Bill tuple) execute as an indivisible unit. If an error occurs (such as an illegal bill amount), <strong>ROLLBACK</strong> guarantees that neither tuple persists into MySQL.
          </div>

          {/* Interactive Trigger Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Execute Real MySQL Transaction</h3>
                <p className="text-xs text-slate-500">Uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-700">connection.beginTransaction()</code> on MySQL 8.0</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={running}
                  onClick={handleRunSuccess}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  1. Run Successful Transaction (COMMIT)
                </button>

                <button
                  disabled={running}
                  onClick={handleRunFailure}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  2. Run Failed Transaction (ROLLBACK)
                </button>
              </div>
            </div>

            {/* Live Step-by-Step Execution Log */}
            {atomicityResult && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Execution Log: Outcome = <span className={atomicityResult.transactionOutcome === 'COMMITTED' ? 'text-emerald-600' : 'text-red-600'}>{atomicityResult.transactionOutcome}</span>
                  </h4>
                  <span className="text-xs text-slate-400">Total Steps: {atomicityResult.logs?.length || 0}</span>
                </div>

                <div className="space-y-3">
                  {atomicityResult.logs?.map((step: any) => (
                    <div 
                      key={step.step}
                      className={`p-4 rounded-2xl border transition text-xs ${
                        step.status === 'COMMITTED' ? 'bg-emerald-50 border-emerald-200' :
                        step.status === 'ROLLED_BACK' ? 'bg-red-50 border-red-200' :
                        step.status === 'FAILED' ? 'bg-amber-50 border-amber-200' :
                        'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                            {step.step}
                          </span>
                          <span className="font-bold text-slate-900">{step.action}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white border">
                          {step.status}
                        </span>
                      </div>

                      <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto my-2">
                        <code>{step.sql}</code>
                      </pre>

                      <p className="text-slate-600 font-medium">{step.details}</p>
                    </div>
                  ))}
                </div>

                {/* Final Verification Badge */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Database State Verification:</span>
                    <strong className="text-emerald-400 text-sm">
                      {atomicityResult.transactionOutcome === 'COMMITTED' 
                        ? '✔ Both Appointment and Bill persist in MySQL'
                        : '✔ Atomic Rollback confirmed: 0 orphaned rows exist in MySQL'}
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400">Engine: InnoDB Undo Log</span>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 2: CONSISTENCY DEMO */}
      {activeProperty === 'consistency' && (
        <div className="space-y-6">
          <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200 text-blue-900 text-xs leading-relaxed">
            <h4 className="font-bold text-sm mb-1 text-blue-950">Consistency Property:</h4>
            Consistency ensures the database transitions only through legal states defined by schema rules. In this project, the Medicine table enforces <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-bold">CHECK (in_stock &gt;= 0)</code> and <code className="bg-white px-1.5 py-0.5 rounded text-blue-700 font-bold">CHECK (price &gt;= 0)</code>.
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Test Schema Constraint Violation</h3>
            <p className="text-xs text-slate-500 mb-4">Attempts an INSERT into Medicine with a negative stock quantity (-25 units).</p>

            <button
              disabled={running}
              onClick={handleRunConsistency}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              Trigger Constraint Check
            </button>

            {consistencyResult && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  MySQL Rejected Illegal State Successfully
                </div>
                <p><strong>Constraint Tested:</strong> {consistencyResult.constraintTested}</p>
                <p><strong>MySQL Error Code:</strong> <code className="bg-red-50 text-red-700 px-1 py-0.5 rounded font-mono">{consistencyResult.errorCode}</code></p>
                <p><strong>Engine Verdict:</strong> {consistencyResult.vivaExplanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: ISOLATION DEMO */}
      {activeProperty === 'isolation' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
            <h4 className="font-bold text-sm mb-1 text-indigo-950">Isolation Property:</h4>
            Transactions executing concurrently must not interfere with each other. When a patient locks an availability slot to book, InnoDB executes <code className="bg-white px-1.5 py-0.5 rounded text-indigo-700 font-bold">SELECT ... FOR UPDATE</code>, placing an exclusive row-level lock on the slot so concurrent threads cannot double-book it.
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Demonstrate Concurrency Row-Level Locking</h3>
            <p className="text-xs text-slate-500 mb-4">Simulates pessimistic locking using InnoDB REPEATABLE READ isolation.</p>

            <button
              disabled={running}
              onClick={handleRunIsolation}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              Test Pessimistic Row Lock
            </button>

            {isolationResult && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Isolation Mechanism Active
                </div>
                <p><strong>Isolation Level:</strong> {isolationResult.isolationLevel}</p>
                <p><strong>Locking Statement:</strong> <code className="bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono">{isolationResult.mechanism}</code></p>
                <p><strong>Observation:</strong> {isolationResult.details}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: DURABILITY DEMO */}
      {activeProperty === 'durability' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
            <h4 className="font-bold text-sm mb-1 text-emerald-950">Durability Property:</h4>
            Once a transaction commits, all written tuples are permanently saved in the InnoDB tablespace and Redo Log (<code className="bg-white px-1.5 py-0.5 rounded text-emerald-700 font-bold">ib_logfile</code>). Even if the operating system crashes immediately after, the data will survive.
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Verify Crash Persistence</h3>
            <p className="text-xs text-slate-500 mb-4">Writes a committed tuple on Connection 1 and immediately verifies it via a separate disconnected thread.</p>

            <button
              disabled={running}
              onClick={handleRunDurability}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
            >
              <HardDrive className="w-4 h-4" />
              Verify Committed Durability
            </button>

            {durabilityResult && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Durability Verified
                </div>
                <p><strong>Evidence:</strong> {durabilityResult.evidence}</p>
                <p><strong>Persisted Record:</strong> {durabilityResult.persistedRecord?.name} (ID #{durabilityResult.persistedRecord?.id})</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

