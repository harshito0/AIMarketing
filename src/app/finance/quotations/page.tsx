'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { QuotationItem } from '../../../lib/types';
import { formatINR } from '../../../lib/invoice-utils';
import { QuotationView } from '../../../components/finance/quotation-view';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Eye,
} from 'lucide-react';

export default function QuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<QuotationItem | null>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/quotations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setQuotations(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await fetch(`/api/finance/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuotations((prev) => prev.filter((q) => q.id !== id && q.quotationNumber !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (q.clientGstin && q.clientGstin.toLowerCase().includes(search.toLowerCase()));

    const st = (q.status || 'DRAFT').toUpperCase();
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACCEPTED' && st === 'ACCEPTED') ||
      (statusFilter === 'SENT' && st === 'SENT') ||
      (statusFilter === 'DRAFT' && st === 'DRAFT');

    return matchSearch && matchStatus;
  });

  const totalQuoted = quotations.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
  const acceptedValue = quotations
    .filter((q) => (q.status || 'DRAFT').toUpperCase() === 'ACCEPTED')
    .reduce((acc, q) => acc + (q.totalAmount || 0), 0);
  const pendingValue = totalQuoted - acceptedValue;
  const avgDeal = quotations.length > 0 ? totalQuoted / quotations.length : 0;

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-purple-600" />
              <span>Quotations & Estimations Hub</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Create commercial proposals, technical milestone estimations, and print official quotation sheets with CodeKap watermark.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/finance/quotations/create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Create Quotation</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Quoted Value</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatINR(totalQuoted)}</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{quotations.length} Active proposals</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accepted Deals</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">{formatINR(acceptedValue)}</div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Approved by client</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Under Negotiation</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-600 font-mono">{formatINR(pendingValue)}</div>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Pending conversion</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Deal Size</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-blue-700 font-mono">{formatINR(avgDeal)}</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Per proposal</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by quote #, client, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-purple-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center">
            {['ALL', 'SENT', 'ACCEPTED', 'DRAFT'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Quote #</th>
                  <th className="py-3.5 px-4">Client / Prospect</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3 text-right">Taxable</th>
                  <th className="py-3.5 px-3 text-right">Tax</th>
                  <th className="py-3.5 px-4 text-right">Total Estimation</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Loading commercial quotations...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No quotations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => {
                    const st = (q.status || 'DRAFT').toUpperCase();
                    const isAccepted = st === 'ACCEPTED';
                    return (
                      <tr
                        key={q.id}
                        onClick={() => router.push(`/finance/quotations/edit/${q.id}`)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                          <Link
                            href={`/finance/quotations/edit/${q.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-purple-700 hover:text-purple-900 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{q.quotationNumber}</span>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href={`/finance/quotations/edit/${q.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors block"
                          >
                            {q.clientName}
                          </Link>
                          {q.clientGstin ? (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              State/GSTIN: {q.clientGstin}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Standard Prospect</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          <div>{q.date}</div>
                          {q.validUntil && (
                            <span className="text-[10px] text-slate-400 block">Valid: {q.validUntil}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                          {formatINR(q.taxableAmount || q.subtotal)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                          {formatINR(q.taxAmount || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {formatINR(q.totalAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : st === 'SENT'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedQuotationForPrint(q)}
                              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer btn-press"
                              title="View Quotation Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-600" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => router.push(`/finance/quotations/edit/${q.id}`)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer btn-press"
                              title="Edit Quotation"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedQuotationForPrint(q)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors cursor-pointer btn-press"
                              title="Print / Save PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDelete(q.id, e)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Quotation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quotation Fullscreen Print Preview Modal */}
        {selectedQuotationForPrint && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center">
            <div className="max-w-4xl w-full">
              <QuotationView
                quotation={selectedQuotationForPrint}
                onClose={() => setSelectedQuotationForPrint(null)}
              />
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
