'use client';

import React from 'react';
import { SalesInvoiceEditor } from '@/components/finance/sales-invoice-editor';
import { AuthGuard } from '@/components/auth-guard';

export default function CreateSalesInvoicePage() {
  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <SalesInvoiceEditor />
    </AuthGuard>
  );
}
