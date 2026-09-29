'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SalesInvoiceEditor } from '@/components/finance/sales-invoice-editor';
import { AuthGuard } from '@/components/auth-guard';
import { InvoiceItem } from '@/lib/types';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function EditSalesInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/finance/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invoice not found');
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-slate-500 text-xs font-semibold gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading Sales Invoice...</span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <h2 className="text-base font-bold text-slate-900">Invoice Not Found</h2>
        <p className="text-xs text-slate-500">Could not retrieve invoice details with reference: {id}</p>
        <button
          onClick={() => router.push('/finance/invoices')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Return to Invoices
        </button>
      </div>
    );
  }

  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <SalesInvoiceEditor
        initialInvoice={invoice}
        onSaved={() => router.push('/finance/invoices')}
        onCancel={() => router.push('/finance/invoices')}
      />
    </AuthGuard>
  );
}
