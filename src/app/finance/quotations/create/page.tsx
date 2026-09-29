'use client';

import React from 'react';
import { QuotationEditor } from '@/components/finance/quotation-editor';
import { AuthGuard } from '@/components/auth-guard';

export default function CreateQuotationPage() {
  return (
    <AuthGuard allowedDepartments={['Sales & Business Development', 'Sales', 'CRM', 'Administration & Management']}>
      <QuotationEditor />
    </AuthGuard>
  );
}
