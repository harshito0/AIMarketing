'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/dashboard-layout';
import { AuthGuard } from '../../../components/auth-guard';
import { InvoiceItem } from '../../../lib/types';
import { PieChart, Download, FileText, CheckCircle2, ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';

export default function GSTReportsPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/finance/invoices');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setInvoices(data.filter((inv) => (inv.status || '').toUpperCase() !== 'DELETED'));
          }
        }
      } catch (e) {
        console.warn('Failed to load invoices for GST report:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const totalTaxable = invoices.reduce((acc, inv) => acc + (inv.taxableAmount || inv.subtotal || 0), 0);
  const totalCgst = invoices.reduce((acc, inv) => acc + (inv.cgst || 0), 0);
  const totalSgst = invoices.reduce((acc, inv) => acc + (inv.sgst || 0), 0);
  const totalIgst = invoices.reduce((acc, inv) => acc + (inv.igst || 0), 0);
  const totalGst = totalCgst + totalSgst + totalIgst;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <PieChart className="w-6 h-6 text-emerald-600" />
              <span>GST & Management Tax Reports</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Statutory workings, GSTR-1 outward supply breakdown, GSTR-3B net tax liability & monthly sales register.
            </p>
          </div>

          <button
            onClick={() => alert(`GSTR-1 data prepared for ${invoices.length} active invoices.`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export GSTR-1 Data</span>
          </button>
        </div>

        {/* GST Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Taxable Value</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">{formatINR(totalTaxable)}</div>
            <p className="text-xs text-slate-400 mt-1">SAC 9983 (IT & Dev Services)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Output GST (Collected)</span>
            <div className="text-2xl font-extrabold text-blue-600 font-mono">{formatINR(totalGst)}</div>
            <p className="text-xs text-slate-400 mt-1">
              CGST: {formatINR(totalCgst)} + SGST: {formatINR(totalSgst)} {totalIgst > 0 ? `+ IGST: ${formatINR(totalIgst)}` : ''}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Supplies</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">{invoices.length}</div>
            <p className="text-xs text-slate-400 mt-1">Filed & ready invoices</p>
          </div>
        </div>

        {/* GSTR-1 Sales Register Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              B2B Outward Supplies (GSTR-1 Working Table)
            </h2>
            <span className="text-[11px] text-emerald-600 font-semibold">Active Invoices ({invoices.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Receiver GSTIN</th>
                  <th className="py-3 px-4">Trade Name</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Total Invoice Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Loading GST report...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No active invoices recorded yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.clientGstin || 'Unregistered / Export'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.clientName}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(inv.taxableAmount || inv.subtotal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(inv.cgst || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(inv.sgst || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(inv.igst || 0)}</td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">{formatINR(inv.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Statutory Notice:</strong> Reports are compiled for internal working and audit review. Final statutory GST returns are subject to validation by CodeKap's designated Chartered Accountant.
          </span>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
