'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { InvoiceItem } from '../../../lib/types';
import { formatINR } from '../../../lib/invoice-utils';
import { TaxInvoiceView } from '../../../components/finance/tax-invoice-view';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Printer,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Building2,
  Layers,
  Eye,
} from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<InvoiceItem | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/invoices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setInvoices(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id && inv.invoiceNumber !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.clientGstin && inv.clientGstin.toLowerCase().includes(search.toLowerCase()));

    const st = (inv.status || 'DRAFT').toUpperCase();
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RECEIVED' && (st === 'RECEIVED' || st === 'PAID')) ||
      (statusFilter === 'SENT' && st === 'SENT') ||
      (statusFilter === 'DRAFT' && st === 'DRAFT');

    return matchSearch && matchStatus;
  });

  // Analytics Metrics
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalReceived = invoices.reduce(
    (acc, inv) =>
      acc + (inv.status === 'RECEIVED' || inv.status === 'PAID' ? inv.totalAmount : inv.amountPaid || 0),
    0
  );
  const totalPending = Math.max(0, totalBilled - totalReceived);
  const totalTax = invoices.reduce((acc, inv) => acc + ((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0)), 0);

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>Invoices & Billing Hub</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              GST-compliant tax invoices, receipts, payment allocations, and PDF print generator with CodeKap watermark.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/finance/invoices/create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Invoice</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatINR(totalBilled)}</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{invoices.length} Invoices generated</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Received Collections</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">{formatINR(totalReceived)}</div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Cleared in Bank / IMPS</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Receivables</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-600 font-mono">{formatINR(totalPending)}</div>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Payment due</span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs card-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GST Output Tax</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-extrabold text-purple-700 font-mono">{formatINR(totalTax)}</div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">IGST / CGST / SGST</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice #, client, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center">
            {['ALL', 'RECEIVED', 'SENT', 'DRAFT'].map((tab) => (
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

        {/* Invoices Directory Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer / Buyer</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3 text-right">Taxable</th>
                  <th className="py-3.5 px-3 text-right">GST</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Loading invoices directory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const st = (inv.status || 'DRAFT').toUpperCase();
                    const isReceived = st === 'RECEIVED' || st === 'PAID';
                    const taxVal = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/finance/invoices/edit/${inv.id}`)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                          <Link
                            href={`/finance/invoices/edit/${inv.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{inv.invoiceNumber}</span>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            href={`/finance/invoices/edit/${inv.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors block"
                          >
                            {inv.clientName}
                          </Link>
                          {inv.clientGstin ? (
                            <span className="text-[10px] text-slate-500 font-mono block">
                              GSTIN: {inv.clientGstin}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Export / Non-GST</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          <div>{inv.date}</div>
                          <span className="text-[10px] text-slate-400 block">Due: {inv.dueDate}</span>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                          {formatINR(inv.taxableAmount || inv.subtotal)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                          {formatINR(taxVal)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {formatINR(inv.totalAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : st === 'SENT'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isReceived ? 'Received' : inv.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer btn-press"
                              title="View Tax Invoice Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => router.push(`/finance/invoices/edit/${inv.id}`)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer btn-press"
                              title="Edit Sales Invoice"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors cursor-pointer btn-press"
                              title="Print / Save PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDelete(inv.id, e)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Invoice"
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

        {/* Fullscreen Tax Invoice View Modal with Watermark */}
        {selectedInvoiceForPrint && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center">
            <div className="max-w-4xl w-full">
              <TaxInvoiceView
                invoice={selectedInvoiceForPrint}
                onClose={() => setSelectedInvoiceForPrint(null)}
              />
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
