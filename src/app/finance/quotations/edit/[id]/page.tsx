'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuotationEditor } from '@/components/finance/quotation-editor';
import { AuthGuard } from '@/components/auth-guard';
import { QuotationItem } from '@/lib/types';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<QuotationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/finance/quotations/${id}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Quotation not found');
        return res.json();
      })
      .then((data) => {
        setQuotation(data);
      })
      .catch((err) => {
        try {
          const cached = localStorage.getItem('codekap_cached_quotations');
          if (cached) {
            const list = JSON.parse(cached);
            const found = list.find((q: any) => q.id === id || q.quotationNumber === id);
            if (found) {
              setQuotation(found);
              return;
            }
          }
        } catch (_) {}
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
        <span>Loading Quotation Estimation...</span>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <h2 className="text-base font-bold text-slate-900">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">Could not retrieve quotation details with reference: {id}</p>
        <button
          onClick={() => router.push('/finance/quotations')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Return to Quotations
        </button>
      </div>
    );
  }

  return (
    <AuthGuard>
      <QuotationEditor
        initialQuotation={quotation}
        onSaved={() => router.push('/finance/quotations')}
        onCancel={() => router.push('/finance/quotations')}
      />
    </AuthGuard>
  );
}
