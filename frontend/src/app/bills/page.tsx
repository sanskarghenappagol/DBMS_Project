'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Stethoscope, 
  FileText, 
  Filter, 
  Printer, 
  ArrowLeft,
  Calendar,
  DollarSign
} from 'lucide-react';
import { billsAPI, paymentsAPI } from '@/lib/api';
import { Bill } from '@/lib/types';

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid'>('All');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment Modal state
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash' | 'Net Banking'>('UPI');

  // Receipt Modal state
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);

  useEffect(() => {
    loadBills();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await billsAPI.getAll();
      if (res.data) {
        setBills(res.data);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    if (!payingBill) return;
    setLoading(true);
    try {
      const netPayable = payingBill.final_amount || (payingBill.amount - payingBill.discount);
      const payload = {
        bill_id: payingBill.bill_id,
        amount: netPayable,
        method: paymentMethod,
        status: 'Success'
      };

      const res = await paymentsAPI.create(payload);
      if (res.success) {
        showNotification('success', `Payment of ₹${netPayable} processed successfully! Bill #${payingBill.bill_id} marked as Paid.`);
        setPayingBill(null);
        loadBills();
      } else {
        showNotification('error', res.error || 'Payment failed');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesStatus = statusFilter === 'All' ? true : b.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      String(b.bill_id).includes(searchLower) ||
      (b.patient_name && b.patient_name.toLowerCase().includes(searchLower)) ||
      (b.doctor_name && b.doctor_name.toLowerCase().includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  const totalBilled = bills.reduce((sum, b) => sum + (Number(b.final_amount) || Number(b.amount - b.discount)), 0);
  const totalPaid = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (Number(b.final_amount) || Number(b.amount - b.discount)), 0);
  const totalPending = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (Number(b.final_amount) || Number(b.amount - b.discount)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-8 h-8 text-emerald-600" />
            Billing, Invoices &amp; Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View consultation invoices, settle outstanding dues with UPI or Cards, and print official receipts.
          </p>
        </div>

        <button
          onClick={loadBills}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          Refresh Invoices
        </button>
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

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹{totalBilled.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">{bills.length} Total Consultation Invoices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">₹{totalPaid.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">{bills.filter(b => b.status === 'Paid').length} Settled Transactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Dues</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">₹{totalPending.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">{bills.filter(b => b.status === 'Pending').length} Invoices Awaiting Settlement</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Bill ID, Patient name, or Doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['All', 'Pending', 'Paid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === status 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status} ({status === 'All' ? bills.length : bills.filter(b => b.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Invoice Records ({filteredBills.length})</h3>
          <span className="text-xs text-slate-400">All amounts in INR (₹)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Consulting Doctor</th>
                <th className="p-3">Gross Fee</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Net Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.bill_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-800">#{b.bill_id}</td>
                    <td className="p-3 text-slate-600">{b.bill_date}</td>
                    <td className="p-3 font-semibold text-slate-900">{b.patient_name || `Patient #${b.patient_id || ''}`}</td>
                    <td className="p-3 text-slate-700">{b.doctor_name || 'Consulting Physician'}</td>
                    <td className="p-3 text-slate-600">₹{b.amount}</td>
                    <td className="p-3 text-emerald-600">{b.discount > 0 ? `-₹${b.discount}` : '₹0'}</td>
                    <td className="p-3 font-bold text-slate-900">₹{b.final_amount || (b.amount - b.discount)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {b.payment_method || (b.status === 'Paid' ? 'Online' : '—')}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {b.status === 'Pending' ? (
                        <button
                          onClick={() => setPayingBill(b)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                        >
                          Pay Bill
                        </button>
                      ) : (
                        <button
                          onClick={() => setReceiptBill(b)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full">
            <h3 className="text-base font-bold text-slate-900 mb-1">Settle Medical Invoice</h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice #{payingBill.bill_id} • Net Payable: <strong className="text-slate-900">₹{payingBill.final_amount || (payingBill.amount - payingBill.discount)}</strong>
            </p>

            <div className="space-y-2.5 mb-5">
              <label className="block text-xs font-semibold text-slate-700">Choose Payment Method:</label>
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

      {/* Printable Receipt Modal */}
      {receiptBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 pb-4 mb-4 text-center">
              <h2 className="text-lg font-black text-slate-900">SmartCare Medical Center</h2>
              <p className="text-xs text-slate-500">Official Consultation Payment Receipt</p>
              <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                PAYMENT COMPLETED
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-bold text-slate-900">#{receiptBill.bill_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Invoice Date:</span>
                <span>{receiptBill.bill_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-800">{receiptBill.patient_name || 'Patient'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Physician:</span>
                <span className="font-semibold text-slate-800">{receiptBill.doctor_name || 'Consulting Doctor'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Gross Consultation Fee:</span>
                <span>₹{receiptBill.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                <span>Discount / Concession:</span>
                <span>-₹{receiptBill.discount}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-extrabold text-slate-900">
                <span>Total Amount Paid:</span>
                <span>₹{receiptBill.final_amount || (receiptBill.amount - receiptBill.discount)}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-slate-500">
                <span>Payment Mode:</span>
                <span>{receiptBill.payment_method || 'Digital Gateway / UPI'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReceiptBill(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

