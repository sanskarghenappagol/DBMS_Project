'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Server, 
  Search, 
  Sparkles, 
  Star, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Layers,
  Database
} from 'lucide-react';
import { vectorSearchAPI, reportsAPI, reviewsAPI, auditAPI } from '@/lib/api';

export default function MongoDBExplorerPage() {
  const [activeTab, setActiveTab] = useState<'vector' | 'reports' | 'reviews' | 'audit'>('vector');
  
  // Vector search state
  const [searchQuery, setSearchQuery] = useState('cardiac chest discomfort with shortness of breath');
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Collections state
  const [reports, setReports] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    handleVectorSearch();
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const repRes = await reportsAPI.getAll();
      if (repRes.data) setReports(repRes.data);

      const revRes = await reviewsAPI.getAll();
      if (revRes.data) setReviews(revRes.data);

      const audRes = await auditAPI.getAll();
      if (audRes.data) setAuditLogs(audRes.data);
    } catch {
      // fallback
    }
  };

  const handleVectorSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await vectorSearchAPI.search(searchQuery);
      if (res.data) setVectorResults(res.data);
    } catch (err: any) {
      console.error('Vector search error', err);
    } finally {
      setSearching(false);
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
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              MongoDB NoSQL + Vector Search
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Server className="w-8 h-8 text-cyan-600" />
            MongoDB Secondary NoSQL &amp; Vector Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Database: <code className="bg-slate-100 px-1 py-0.5 rounded text-cyan-800 font-mono">smart_healthcare_nosql</code> • Medical reports, reviews aggregation, audit trails, and Cosine Vector Search.
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 sm:space-x-6 mb-6 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('vector')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'vector' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-600" />
          Semantic Vector Search (Cosine Similarity)
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reports' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          medical_reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reviews' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          patient_reviews (Aggregation)
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit' ? 'border-cyan-600 text-cyan-700' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          audit_logs (TTL Index)
        </button>
      </div>

      {/* TAB 1: VECTOR SEARCH */}
      {activeTab === 'vector' && (
        <div className="space-y-6">
          
          {/* Explanation Banner */}
          <div className="bg-cyan-50/70 p-5 rounded-2xl border border-cyan-200 text-cyan-900 text-xs leading-relaxed">
            <h4 className="font-bold text-sm mb-1 text-cyan-950 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-700" />
              Vector Search vs Keyword Search:
            </h4>
            Standard SQL <code className="bg-white px-1.5 py-0.5 rounded text-cyan-800 font-bold">LIKE %query%</code> searches for exact textual characters. 
            <strong> Vector Similarity Search</strong> maps medical terms into high-dimensional geometric embedding vectors and evaluates the angular proximity using 
            <strong> Cosine Similarity:</strong>
            <div className="font-mono mt-1 text-[11px] bg-white p-2 rounded-lg border border-cyan-200 inline-block">
              Cosine Similarity(A, B) = (A · B) / (||A|| × ||B||)
            </div>
            This enables doctors to search for &quot;chest tightness&quot; and retrieve records mentioning &quot;angina pectoris&quot; or &quot;cardiac arrhythmia&quot;.
          </div>

          {/* Search Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-slate-800">
              Natural Language Clinical Query:
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. knee joint pain osteoarthritis or high fever respiratory"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>
              <button
                disabled={searching}
                onClick={handleVectorSearch}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {searching ? 'Computing Embeddings...' : 'Semantic Search'}
              </button>
            </div>

            {/* Quick Query Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <span className="text-slate-400 text-[11px] mr-1">Try Samples:</span>
              <button
                onClick={() => { setSearchQuery('cardiac palpitations chest tightness'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 text-[11px]"
              >
                Cardiac Chest Pain
              </button>
              <button
                onClick={() => { setSearchQuery('severe knee joint bone pain cartilage'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 text-[11px]"
              >
                Knee Osteoarthritis
              </button>
              <button
                onClick={() => { setSearchQuery('high fever acute respiratory cough lungs'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 text-[11px]"
              >
                Pediatric Fever
              </button>
              <button
                onClick={() => { setSearchQuery('chronic migraine neurological headache with aura'); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 text-[11px]"
              >
                Migraine Aura
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Semantic Matches Ranked by Cosine Similarity Score ({vectorResults.length})
            </h3>

            {vectorResults.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-400 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Report #{item.report_id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600">{item.patient_name || `Patient #${item.patient_id}`}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-cyan-700 font-semibold">{item.doctor_name || `Doctor #${item.doctor_id}`}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    &ldquo;{item.text_content}&rdquo;
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Similarity Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-cyan-600 rounded-full"
                        style={{ width: `${Math.min(100, item.similarity_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-700">
                      {(item.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: MEDICAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => (
            <div key={rep.report_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-700 px-2 py-0.5 rounded bg-cyan-50">
                  {rep.report_type}
                </span>
                <span className="text-[11px] text-slate-400">{rep.report_id}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{rep.file_name}</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {rep.observations}
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Patient ID: #{rep.patient_id}</span>
                <span className="font-mono">{rep.storage_path}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PATIENT REVIEWS (MongoDB Aggregation) */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4">
            <h3 className="font-bold text-slate-900 text-sm mb-1">MongoDB Aggregation Pipeline</h3>
            <p className="text-xs text-slate-500">
              Uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-cyan-800">$match, $group, $avg, $project</code> to compute real-time physician satisfaction ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{rev.review_id}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium italic">&ldquo;{rev.review_text}&rdquo;</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {rev.tags?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-semibold">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS (TTL Index) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Security &amp; Transaction Audit Trail</h3>
              <p className="text-xs text-slate-400">Protected by MongoDB TTL index: expireAfterSeconds: 7776000 (90 Days)</p>
            </div>
            <span className="text-xs text-slate-400">{auditLogs.length} Events</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <div>
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-400 ml-2">[{log.entity_type}: #{log.entity_id}]</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{JSON.stringify(log.changes)}</p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

