'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QuotationItem, QuotationLineItem } from '@/lib/types';
import { formatINR, formatINRPlain } from '@/lib/invoice-utils';
import { QuotationView } from './quotation-view';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Star,
  Search,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';

interface QuotationEditorProps {
  initialQuotation?: QuotationItem | null;
  onSaved?: (qtn: QuotationItem) => void;
  onCancel?: () => void;
}

const PRESET_CUSTOMERS = [
  {
    name: 'mr. Sunil',
    phone: '7528835379',
    email: 'sunil@jdleads.in',
    gstin: '04-CHANDIGARH',
    address: 'JD lead CHANDIGARH,\nState: 04-CHANDIGARH Country: India',
  },
  {
    name: 'M.S.I. GROUP OF INSTITUTE',
    phone: '9175288353',
    email: 'admissions@msigroup.edu.in',
    gstin: '03AEQPE9376K2ZY',
    address: 'SCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307',
  },
  {
    name: 'Glassfinity USA',
    phone: '18005550199',
    email: 'contact@glassfinity.com',
    gstin: '',
    address: 'Glass finity usa, VIRGINIA, United States',
  },
  {
    name: 'Jeevansphere Technologies',
    phone: '9811002233',
    email: 'info@jeevansphere.com',
    gstin: '07AABCU9603R1ZX',
    address: 'Connaught Place, New Delhi, India 110001',
  },
];

const PRESET_SERVICES = [
  {
    desc: 'Website & Android App Development',
    hsn: '998314',
    rate: 110169.49,
    unit: 'NOS',
    deliverables: [
      'Custom Premium Website Development with Android Mobile Application including UI/UX Design, Admin Panel, Backend Development, API Integration, Database, Responsive Design, QR Integration, Source Code Handover, Testing, Deployment and 30 Days Technical Support.',
    ],
  },
  {
    desc: 'Digital Marketing & Lead Generation Retainer',
    hsn: '998314',
    rate: 42372.88,
    unit: 'MTH',
    deliverables: [
      'Weekly Targeted Campaigns Setup & Optimization',
      'Creative Graphic Ad Sets (15 Creatives)',
      'Conversion Tracking & Weekly ROAS Analysis',
    ],
  },
  {
    desc: 'Social Media Management & Branding',
    hsn: '998314',
    rate: 25000,
    unit: 'MTH',
    deliverables: ['12 High-Engagement Creatives', 'Reels Strategy & Scripting', 'Hashtags & Community Management'],
  },
  {
    desc: 'On-Page & Technical SEO Optimization',
    hsn: '998365',
    rate: 15000,
    unit: 'MTH',
    deliverables: ['Core Web Vitals Boost', 'Keyword Rank Tracking', 'Structured Data Schema Markup'],
  },
];

export function QuotationEditor({ initialQuotation, onSaved, onCancel }: QuotationEditorProps) {
  const router = useRouter();

  // Meta Info
  const [customerName, setCustomerName] = useState(initialQuotation?.clientName || '');
  const [customerPhone, setCustomerPhone] = useState(initialQuotation?.clientPhone || '');
  const [customerEmail, setCustomerEmail] = useState(initialQuotation?.clientEmail || '');
  const [customerGstin, setCustomerGstin] = useState(initialQuotation?.clientGstin || '');
  const [billingAddress, setBillingAddress] = useState(
    initialQuotation?.billingAddress || ''
  );

  const [prefix, setPrefix] = useState(initialQuotation?.prefix || 'Q');
  const [qNumPart, setQNumPart] = useState(
    initialQuotation?.quotationNumber
      ? initialQuotation.quotationNumber.replace(/^[A-Za-z]+-?/, '')
      : '0004'
  );
  const [suffix, setSuffix] = useState(initialQuotation?.suffix || '');
  const [quotationDate, setQuotationDate] = useState(
    initialQuotation?.date || '2026-09-26'
  );
  const [validTill, setValidTill] = useState(
    initialQuotation?.validUntil || '2026-10-26'
  );

  // Items State (defaulting to the item from the user's PDF or screenshot)
  const defaultItems: QuotationLineItem[] = [
    {
      srNo: 1,
      desc: 'Website & Android App Development',
      deliverables: [
        'Custom Premium Website Development with Android Mobile Application including UI/UX Design, Admin Panel, Backend Development, API Integration, Database, Responsive Design, QR Integration, Source Code Handover, Testing, Deployment and 30 Days Technical Support.',
      ],
      hsn: '998314',
      qty: 1,
      unit: 'NOS',
      rate: 110169.49,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 110169.49,
      gstRate: 18,
      gstAmount: 19830.51,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: 130000.0,
    },
  ];

  const [items, setItems] = useState<QuotationLineItem[]>(() => {
    if (initialQuotation?.itemsJson) {
      try {
        const parsed = JSON.parse(initialQuotation.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return defaultItems;
  });

  const [globalRateType, setGlobalRateType] = useState<'EXCLUSIVE_GST' | 'INCLUSIVE_GST'>('EXCLUSIVE_GST');
  const [isInterState, setIsInterState] = useState(
    initialQuotation ? (initialQuotation.igst || 0) > 0 : false
  );

  // Summary Modifiers
  const [discountBeforeTaxType, setDiscountBeforeTaxType] = useState<'%' | '₹'>('%');
  const [discountBeforeTaxVal, setDiscountBeforeTaxVal] = useState<number>(0);

  const [serviceCharge, setServiceCharge] = useState<number>(initialQuotation?.serviceCharge || 0);
  const [showServiceCharge, setShowServiceCharge] = useState(false);

  const [otherCharges, setOtherCharges] = useState<number>(initialQuotation?.otherCharges || 0);
  const [showOtherCharges, setShowOtherCharges] = useState(false);

  const [discountAfterTaxType, setDiscountAfterTaxType] = useState<'%' | '₹'>('%');
  const [discountAfterTaxVal, setDiscountAfterTaxVal] = useState<number>(0);

  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [specialNotes, setSpecialNotes] = useState(
    initialQuotation?.notes || 'Write your special notes for this quotation.'
  );

  // Modals & States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-fill customer
  const handleSelectCustomer = (name: string) => {
    setCustomerName(name);
    const found = PRESET_CUSTOMERS.find((c) => c.name === name);
    if (found) {
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email);
      setCustomerGstin(found.gstin);
      setBillingAddress(found.address);
    }
  };

  // Row update helpers
  const updateRow = (index: number, updates: Partial<QuotationLineItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = { ...copy[index], ...updates };
      const qty = Number(cur.qty) || 1;
      const rate = Number(cur.rate) || 0;
      const gstRate = Number(cur.gstRate) || 0;

      let taxable = qty * rate;
      if (cur.rateType === 'INCLUSIVE_GST' && gstRate > 0) {
        taxable = Number(((qty * rate) / (1 + gstRate / 100)).toFixed(2));
      }
      const discAmt = cur.discountPercent
        ? Number(((taxable * cur.discountPercent) / 100).toFixed(2))
        : cur.discountAmount || 0;
      const taxableAfterDisc = Math.max(0, taxable - discAmt);
      const gstAmt = Number(((taxableAfterDisc * gstRate) / 100).toFixed(2));
      const total = Number((taxableAfterDisc + gstAmt).toFixed(2));

      copy[index] = {
        ...cur,
        taxableAmount: taxableAfterDisc,
        discountAmount: discAmt,
        gstAmount: gstAmt,
        totalAmount: total,
      };
      return copy;
    });
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        srNo: prev.length + 1,
        desc: 'Please select goods/service',
        hsn: '998314',
        qty: 1,
        unit: 'NOS',
        rate: 10000,
        rateType: globalRateType,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 10000,
        gstRate: 18,
        gstAmount: 1800,
        cessRate: 0,
        cessAmount: 0,
        totalAmount: 11800,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 })));
  };

  // Calculations
  const subtotalSum = items.reduce((acc, it) => acc + (it.taxableAmount || it.qty * it.rate), 0);
  const totalItemsCount = items.length;

  const discBeforeTaxAmt =
    discountBeforeTaxType === '%'
      ? Number(((subtotalSum * (Number(discountBeforeTaxVal) || 0)) / 100).toFixed(2))
      : Number(discountBeforeTaxVal) || 0;

  const totalTaxableAmt = Math.max(0, Number((subtotalSum - discBeforeTaxAmt).toFixed(2)));

  const totalTaxAmt = items.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const igstAmt = isInterState ? totalTaxAmt : 0;
  const cgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;
  const sgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;

  const subTotalCalculated = totalTaxableAmt + totalTaxAmt;

  const discAfterTaxAmt =
    discountAfterTaxType === '%'
      ? Number(((subTotalCalculated * (Number(discountAfterTaxVal) || 0)) / 100).toFixed(2))
      : Number(discountAfterTaxVal) || 0;

  const totalBeforeRound =
    subTotalCalculated +
    (showServiceCharge ? Number(serviceCharge) || 0 : 0) +
    (showOtherCharges ? Number(otherCharges) || 0 : 0) -
    discAfterTaxAmt;

  let roundOffVal = 0;
  let finalGrandTotal = totalBeforeRound;
  if (autoRoundOff) {
    finalGrandTotal = Math.round(totalBeforeRound);
    roundOffVal = Number((finalGrandTotal - totalBeforeRound).toFixed(2));
  }

  const quotationNumberFull = `${prefix}${qNumPart}${suffix}`;

  const currentQuotationData: QuotationItem = {
    id: initialQuotation?.id || `qtn_${Date.now()}`,
    quotationNumber: quotationNumberFull,
    prefix,
    suffix,
    date: quotationDate,
    validUntil: validTill,
    clientId: initialQuotation?.clientId || `cli_${Date.now()}`,
    clientName: customerName || 'Valued Client',
    clientPhone: customerPhone ? `+91 ${customerPhone}` : null,
    clientEmail: customerEmail || null,
    clientGstin: customerGstin || null,
    billingAddress: billingAddress || `${customerName}\n${customerGstin ? `GSTIN: ${customerGstin}` : ''}`,
    itemsJson: JSON.stringify(items),
    subtotal: subtotalSum,
    taxableAmount: totalTaxableAmt,
    cgst: cgstAmt,
    sgst: sgstAmt,
    igst: igstAmt,
    taxAmount: totalTaxAmt,
    discountBeforeTax: discBeforeTaxAmt,
    discountAfterTax: discAfterTaxAmt,
    serviceCharge: showServiceCharge ? serviceCharge : 0,
    otherCharges: showOtherCharges ? otherCharges : 0,
    roundOff: roundOffVal,
    autoRoundOff,
    totalAmount: finalGrandTotal,
    currency: 'INR',
    status: initialQuotation?.status || 'DRAFT',
    notes: specialNotes,
    bankDetails: JSON.stringify({
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200112201868',
      ifscCode: 'HDFC0002684',
      accountHolderName: 'CODEKAPS DIGITAL INNOVATIONS PVT LTD',
    }),
    terms: `1. Monthly services are billed in advance per cycle.
2. CGI/Walkthrough charges are payable in advance before execution.
3. Ad budget is to be paid directly by the client to ad platforms.
4. 50% advance on monthly package, remaining 50% before cycle completion.
5. Client must provide required content/references timely to avoid delay.
6. Reports & reviews will be shared weekly.`,
    createdAt: initialQuotation?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSaveQuotation = async (andPrint = false) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const url = initialQuotation?.id
        ? `/api/finance/quotations/${initialQuotation.id}`
        : '/api/finance/quotations';
      const method = initialQuotation?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentQuotationData,
          items,
          isInterState,
          rateType: globalRateType,
        }),
      });

      if (res.ok) {
        const savedData = await res.json();
        setStatusMessage({ type: 'success', text: `Quotation ${quotationNumberFull} saved successfully!` });
        if (onSaved) onSaved(savedData);
        if (andPrint) {
          setShowPreviewModal(true);
        } else {
          setTimeout(() => {
            router.push('/finance/quotations');
          }, 600);
        }
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.error || 'Failed to save quotation.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-20">
      {/* Top Header Bar (matching screenshot) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/finance/quotations"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Back to Quotations"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {initialQuotation ? 'Edit Quotation' : 'Create Quotation'}
              </h1>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                ({quotationNumberFull})
              </span>
              <Star className="w-4 h-4 text-slate-300 hover:text-amber-400 cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Field</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer btn-press"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF Preview</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuotation(false)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer btn-press disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Quotation'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Customer Info Card (matching Screenshot) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 card-lift">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Customer Info.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Please select customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  list="customer-suggestions"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <datalist id="customer-suggestions">
                  {PRESET_CUSTOMERS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.gstin || 'Standard'})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Mobile No. */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mobile No.</label>
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-700">
                  <span>🇮🇳</span> +91
                </span>
                <input
                  type="text"
                  placeholder="Mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="example@domain.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Quotation No */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quotation No. <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-12 px-2 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-700"
                />
                <input
                  type="text"
                  value={qNumPart}
                  onChange={(e) => setQNumPart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center text-slate-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Quotation Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quotation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Valid Till */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Valid Till</label>
              <input
                type="date"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Goods / Service Multi-Row Dynamic Table (matching Screenshot) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden card-lift">
          <div className="p-4 px-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Goods / Service Items</h2>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Rate Mode:</label>
              <select
                value={globalRateType}
                onChange={(e) => setGlobalRateType(e.target.value as any)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
              >
                <option value="EXCLUSIVE_GST">Exclusive GST</option>
                <option value="INCLUSIVE_GST">Inclusive GST</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12">SR.NO.</th>
                  <th className="py-3 px-4 min-w-[280px]">GOODS/SERVICE</th>
                  <th className="py-3 px-3 text-center w-24">HSN/SAC</th>
                  <th className="py-3 px-3 text-center w-24">QTY</th>
                  <th className="py-3 px-3 text-right min-w-[140px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>RATE (₹)</span>
                      <span className="text-[9px] text-blue-600 font-semibold">({globalRateType === 'EXCLUSIVE_GST' ? 'Excl' : 'Incl'})</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-24">GST RATE(%)</th>
                  <th className="py-3 px-4 text-right w-32">AMOUNT (₹)</th>
                  <th className="py-3 px-2 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Service Name & Deliverables */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => updateRow(idx, { desc: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                          placeholder="Please select goods/service"
                          list={`service-presets-${idx}`}
                        />
                        <datalist id={`service-presets-${idx}`}>
                          {PRESET_SERVICES.map((s) => (
                            <option key={s.desc} value={s.desc} />
                          ))}
                        </datalist>

                        {/* Deliverables sub-list */}
                        {item.deliverables && item.deliverables.length > 0 && (
                          <div className="pl-2 border-l-2 border-slate-200 space-y-1">
                            {item.deliverables.map((del, dIdx) => (
                              <input
                                key={dIdx}
                                type="text"
                                value={del}
                                onChange={(e) => {
                                  const updatedDels = [...(item.deliverables || [])];
                                  updatedDels[dIdx] = e.target.value;
                                  updateRow(idx, { deliverables: updatedDels });
                                }}
                                className="w-full px-2 py-0.5 text-[11px] text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* HSN/SAC */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="text"
                        placeholder="4 to 8 digit"
                        value={item.hsn}
                        onChange={(e) => updateRow(idx, { hsn: e.target.value })}
                        className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* QTY & Unit */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateRow(idx, { qty: Number(e.target.value) || 1 })}
                          className="w-12 text-center px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.unit || 'NOS'}</span>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateRow(idx, { rate: Number(e.target.value) || 0 })}
                        className="w-full text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* GST Rate */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={item.gstRate}
                        onChange={(e) => updateRow(idx, { gstRate: Number(e.target.value) })}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                      >
                        <option value="18">18%</option>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>

                    {/* Row Amount */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-xs">
                      {formatINRPlain(item.totalAmount)}
                    </td>

                    {/* Delete Icon */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Add Row & Subtotal (matching Screenshot) */}
          <div className="p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer shadow-2xs btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Add Row</span>
            </button>

            <div className="flex items-center gap-8 text-xs font-bold text-slate-700">
              <span className="text-slate-500 font-semibold">Subtotal</span>
              <span className="font-mono bg-slate-200/70 px-2.5 py-1 rounded-lg text-slate-800">{totalItemsCount}</span>
              <span className="font-mono text-sm font-black text-slate-900">{formatINRPlain(subTotalCalculated)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Notes on Left & Summary on Right (matching Screenshot) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Special Notes (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3 card-lift">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Special Notes</label>
                <span className="text-[10px] text-blue-600 font-bold font-mono">1000</span>
              </div>
              <textarea
                rows={6}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Write your special notes for this quotation."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Summary Box (6 cols) (matching Screenshot) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 card-lift">
              <div className="space-y-3 text-xs border-b border-slate-200 pb-4">
                {/* Discount Before Tax */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-600">Discount Before Tax</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountBeforeTaxType}
                      onChange={(e) => setDiscountBeforeTaxType(e.target.value as any)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="%">%</option>
                      <option value="₹">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountBeforeTaxVal}
                      onChange={(e) => setDiscountBeforeTaxVal(Number(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                    />
                    <span className="font-mono text-slate-500 w-16 text-right">
                      {formatINRPlain(discBeforeTaxAmt)}
                    </span>
                  </div>
                </div>

                {/* Taxable Amount */}
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold">Taxable Amt.</span>
                  <span className="font-mono font-bold">₹{formatINRPlain(totalTaxableAmt)}</span>
                </div>

                {/* Service Charge with tax */}
                {showServiceCharge ? (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">Service Charge</span>
                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                      className="w-24 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowServiceCharge(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add service charge with tax</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-100">
                  <span className="font-bold">Total Taxable Amt.</span>
                  <span className="font-mono font-bold">₹{formatINRPlain(totalTaxableAmt)}</span>
                </div>

                {/* Taxes: SGST & CGST (or IGST) */}
                <div className="space-y-1.5 pt-1">
                  {!isInterState ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>SGST (9%)</span>
                        <span className="font-mono font-bold">₹{formatINRPlain(sgstAmt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>CGST (9%)</span>
                        <span className="font-mono font-bold">₹{formatINRPlain(cgstAmt)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>IGST (18%)</span>
                      <span className="font-mono font-bold">₹{formatINRPlain(igstAmt)}</span>
                    </div>
                  )}
                </div>

                {/* Sub Total */}
                <div className="flex items-center justify-between text-slate-900 font-extrabold pt-2 border-t border-slate-200">
                  <span>Sub Total</span>
                  <span className="font-mono">₹{formatINRPlain(subTotalCalculated)}</span>
                </div>

                {/* Select Charges / Add Another Charge */}
                {showOtherCharges ? (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">Other Charges</span>
                    <input
                      type="number"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                      className="w-24 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOtherCharges(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Charge</span>
                  </button>
                )}

                {/* Discount After Tax */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">Discount After Tax</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountAfterTaxType}
                      onChange={(e) => setDiscountAfterTaxType(e.target.value as any)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="%">%</option>
                      <option value="₹">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountAfterTaxVal}
                      onChange={(e) => setDiscountAfterTaxVal(Number(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                    />
                    <span className="font-mono text-slate-500 w-16 text-right">
                      {formatINRPlain(discAfterTaxAmt)}
                    </span>
                  </div>
                </div>

                {/* Auto Round Off */}
                <div className="flex items-center justify-between text-slate-700 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={autoRoundOff}
                      onChange={(e) => setAutoRoundOff(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Auto Round Off</span>
                  </label>
                  <span className="font-mono font-bold">₹{formatINRPlain(roundOffVal)}</span>
                </div>
              </div>

              {/* Total Quotation Amount */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Total Quotation Estimation</span>
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  ₹{formatINRPlain(finalGrandTotal)}
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                  <span>Proposal Status:</span>
                  <span className="text-amber-400 font-bold uppercase">{currentQuotationData.status}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveQuotation(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer btn-press"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Preview Quotation (PDF)</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveQuotation(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer btn-press"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Fullscreen Print Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center">
          <div className="max-w-4xl w-full">
            <QuotationView
              quotation={currentQuotationData}
              onClose={() => setShowPreviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
