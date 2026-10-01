'use client';

import React from 'react';
import { SalesInvoiceEditor } from '@/components/finance/sales-invoice-editor';
import { AuthGuard } from '@/components/auth-guard';

export default function CreateSalesInvoicePage() {
  return (
    <AuthGuard>
      <SalesInvoiceEditor />
    </AuthGuard>
  );
}
