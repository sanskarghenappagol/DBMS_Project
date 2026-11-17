'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Play, 
  Copy, 
  Check, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  Search,
  Layers,
  ChevronRight,
  Code
} from 'lucide-react';
import { sqlExplorerAPI } from '@/lib/api';

interface PredefinedQuery {
  id: string;
  title: string;
  category: string;
  purpose: string;
  query: string;
  explanation: Record<string, string>;
  expectedOutput: string;
  realWorldUse: string;
}

export default function SQLExplorerPage() {
  const [queries, setQueries] = useState<PredefinedQuery[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeQuery, setActiveQuery] = useState<PredefinedQuery | null>(null);
  
  // Execution results
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    sqlExplorerAPI.getQueries()
      .then((res) => {
        if (res.data) {
          setQueries(res.data);
          setActiveQuery(res.data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load SQL queries', err);
      });
  }, []);

  const categories = ['All', 'Joins', 'Nested', 'Correlated', 'CTE', 'Recursive CTE', 'Functions', 'DDL'];

  const filteredQueries = queries.filter(q => {
    const matchCategory = selectedCategory === 'All' ? true : q.category === selectedCategory;
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.purpose.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleSelectQuery = (q: PredefinedQuery) => {
    setActiveQuery(q);
    setQueryResult(null);
  };

  const handleExecuteQuery = async () => {
    if (!activeQuery) return;
    setExecuting(true);
    setQueryResult(null);

    try {
      const res = await sqlExplorerAPI.execute(activeQuery.id);
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({
        success: false,
        error: err.message || 'Execution error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopySQL = () => {
    if (!activeQuery) return;
    navigator.clipboard.writeText(activeQuery.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Database Query Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Database className="w-8 h-8 text-emerald-600" />
            Interactive MySQL SQL Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Execute real predefined queries against the MySQL 8.0 engine with line-by-line pedagogical explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/acid-lab"
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-amber-600" />
            Go to ACID Lab
          </Link>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Query Selector & Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search concepts, Joins, CTEs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    selectedCategory === cat 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Queries List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>SQL Queries ({filteredQueries.length})</span>
              <span>Category</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredQueries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuery(q)}
                  className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                    activeQuery?.id === q.id 
                      ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {q.category}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{q.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{q.purpose}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Active Query Showcase & Execution (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeQuery ? (
            <>
              {/* Query Detail Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                
                {/* Title & Category Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {activeQuery.category}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">{activeQuery.title}</h2>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySQL}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy SQL'}
                    </button>

                    <button
                      disabled={executing}
                      onClick={handleExecuteQuery}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {executing ? 'Executing...' : 'Execute SQL on MySQL'}
                    </button>
                  </div>
                </div>

                {/* Purpose Section */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Purpose / Problem Statement
                  </span>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{activeQuery.purpose}</p>
                </div>

                {/* SQL Code Block */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5" /> Actual MySQL Statement:</span>
                    <span>MySQL 8.0 / InnoDB</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner border border-slate-800">
                    <code>{activeQuery.query}</code>
                  </pre>
                </div>

                {/* Line-by-Line Pedagogical Explanation */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Line-by-Line Query Explanation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(activeQuery.explanation).map(([clause, desc]) => (
                      <div key={clause} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-mono text-xs font-bold text-indigo-700 block mb-0.5">{clause}:</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-World Use */}
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900">
                  <strong>Real-World Application in this Healthcare Project:</strong> {activeQuery.realWorldUse}
                </div>

              </div>

              {/* Execution Result Output Table */}
              {queryResult && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> MySQL Query Output
                      </span>
                      {queryResult.executionTimeMs !== undefined && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Execution Time: {queryResult.executionTimeMs} ms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">Returned Rows: {queryResult.rowCount || queryResult.data?.length || 0}</span>
                      <button
                        onClick={() => setQueryResult(null)}
                        className="text-slate-400 hover:text-white text-xs font-semibold"
                      >
                        Clear Output
                      </button>
                    </div>
                  </div>

                  {queryResult.success === false ? (
                    <div className="p-4 bg-red-50 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{queryResult.error}</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                          <tr>
                            {queryResult.columns?.map((col: string) => (
                              <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {queryResult.data?.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50 transition font-mono text-[11px]">
                              {queryResult.columns?.map((col: string) => (
                                <td key={col} className="p-3 text-slate-800 whitespace-nowrap">
                                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-300 italic">NULL</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Select an SQL concept query from the catalog on the left to begin.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

