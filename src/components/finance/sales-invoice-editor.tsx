'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InvoiceItem, InvoiceLineItem, InvoiceBankDetails, InvoicePaymentEntry } from '@/lib/types';
import { formatINR, formatINRPlain } from '@/lib/invoice-utils';
import { TaxInvoiceView } from './tax-invoice-view';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Info,
  Calendar,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  HelpCircle,
  FileText,
  Share2,
  Sliders,
  Check,
  X,
} from 'lucide-react';

interface SalesInvoiceEditorProps {
  initialInvoice?: InvoiceItem | null;
  onSaved?: (invoice: InvoiceItem) => void;
  onCancel?: () => void;
}

const PRESET_CUSTOMERS = [
  {
    name: 'M.S.I. GROUP OF INSTITUTE',
    balance: '₹0.00 Cr',
    gstin: '03AEQPE9376K2ZY',
    address:
      'SCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307',
    placeOfSupply: 'PUNJAB (03)',
  },
  {
    name: 'Glassfinity USA',
    balance: '₹0.00 Cr',
    gstin: '',
    address: 'Glass finity usa, VIRGINIA, United States',
    placeOfSupply: 'Export / Overseas',
  },
  {
    name: 'Jeevansphere Technologies',
    balance: '₹0.00 Cr',
    gstin: '07AABCU9603R1ZX',
    address: 'Connaught Place, New Delhi, India 110001',
    placeOfSupply: 'DELHI (07)',
  },
];

const PRESET_SERVICES = [
  { desc: 'Social Media Management', hsn: '998314', defaultRate: 3200, unit: 'MTH' },
  { desc: 'Content Creation', hsn: '998361', defaultRate: 4200, unit: 'MTH' },
  { desc: 'Google Ads Management (Search Campaigns)', hsn: '998361', defaultRate: 1800, unit: 'MTH' },
  { desc: 'Google My Business Optimization', hsn: '998361', defaultRate: 1200.01, unit: 'MTH' },
  { desc: 'PR & Brand Promotion (Basic)', hsn: '998397', defaultRate: 2311.86, unit: 'MTH' },
  { desc: 'On-Page SEO Optimization (Ongoing Monthly)', hsn: '998365', defaultRate: 6000, unit: 'MTH' },
  { desc: 'Local SEO (Google My Business + Local Citations)', hsn: '998365', defaultRate: 3300, unit: 'MTH' },
  { desc: 'Monthly SEO Reporting (Basic)', hsn: '998365', defaultRate: 700, unit: 'MTH' },
];

export function SalesInvoiceEditor({ initialInvoice, onSaved, onCancel }: SalesInvoiceEditorProps) {
  const router = useRouter();

  // Invoice Meta
  const [customerName, setCustomerName] = useState(
    initialInvoice?.clientName || 'M.S.I. GROUP OF INSTITUTE'
  );
  const [seriesName, setSeriesName] = useState(initialInvoice?.seriesName || 'Sales Invoice');
  const [invoicePrefix, setInvoicePrefix] = useState(initialInvoice?.invoicePrefix || 'INV');
  const [invoiceNumPart, setInvoiceNumPart] = useState(
    initialInvoice?.invoiceNumber
      ? initialInvoice.invoiceNumber.replace(/^[A-Za-z]+-?/, '')
      : '0001'
  );
  const [invoiceSuffix, setInvoiceSuffix] = useState(initialInvoice?.invoiceSuffix || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.date || '2026-04-28'
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate || '2026-05-13'
  );
  const [bookName, setBookName] = useState(initialInvoice?.bookName || 'Sales Taxable');
  const [billingAddress, setBillingAddress] = useState(
    initialInvoice?.billingAddress ||
      'SCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307\nGSTIN: 03AEQPE9376K2ZY'
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialInvoice?.shippingAddress ||
      'M.S.I. GROUP OF INSTITUTE (GSTIN: 03AEQPE9376K2ZY)\nSCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307'
  );
  const [placeOfSupplyChecked, setPlaceOfSupplyChecked] = useState(true);
  const [placeOfSupply, setPlaceOfSupply] = useState(
    initialInvoice?.placeOfSupply || 'PUNJAB (03)'
  );

  // Custom Fields
  const [quotationNo, setQuotationNo] = useState(initialInvoice?.quotationNo || '');
  const [transporterDetails, setTransporterDetails] = useState(false);

  // Items List
  const defaultItems: InvoiceLineItem[] = [
    {
      srNo: 1,
      desc: 'Social Media Management',
      hsn: '998314',
      qty: 1,
      unit: 'MTH',
      rate: 3200,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 3200,
      gstRate: 18,
      gstAmount: 576,
      totalAmount: 3776.0,
    },
    {
      srNo: 2,
      desc: 'Content Creation',
      hsn: '998361',
      qty: 1,
      unit: 'MTH',
      rate: 4200,
      unit: 'MTH',
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 4200,
      gstRate: 18,
      gstAmount: 756,
      totalAmount: 4956.0,
    },
    {
      srNo: 3,
      desc: 'Google Ads Management (Search Campaigns)',
      hsn: '998361',
      qty: 1,
      unit: 'MTH',
      rate: 1800,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1800,
      gstRate: 18,
      gstAmount: 324,
      totalAmount: 2124.0,
    },
    {
      srNo: 4,
      desc: 'Google My Business Optimization',
      hsn: '998361',
      qty: 1,
      unit: 'MTH',
      rate: 1200.01,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 1200.01,
      gstRate: 18,
      gstAmount: 216.0,
      totalAmount: 1416.01,
    },
    {
      srNo: 5,
      desc: 'PR & Brand Promotion (Basic)',
      hsn: '998397',
      qty: 1,
      unit: 'MTH',
      rate: 2311.86,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 2311.86,
      gstRate: 18,
      gstAmount: 416.13,
      totalAmount: 2727.99,
    },
  ];

  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (initialInvoice?.itemsJson) {
      try {
        const parsed = JSON.parse(initialInvoice.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return defaultItems;
  });

  // Rates & Taxes Mode
  const [globalRateType, setGlobalRateType] = useState<'EXCLUSIVE_GST' | 'INCLUSIVE_GST'>('EXCLUSIVE_GST');
  const [isInterState, setIsInterState] = useState(
    initialInvoice ? initialInvoice.igst > 0 : true
  );

  // Discount & Charges
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(initialInvoice?.serviceCharge || 0);
  const [showServiceCharge, setShowServiceCharge] = useState(false);
  const [otherCharges, setOtherCharges] = useState<number>(initialInvoice?.otherCharges || 0);
  const [showOtherCharges, setShowOtherCharges] = useState(false);

  // Special Notes & Attachments
  const [specialNotes, setSpecialNotes] = useState(initialInvoice?.notes || '');
  const [wantAdditionalDetails, setWantAdditionalDetails] = useState(false);
  const [bankAccount, setBankAccount] = useState('CODEKAP');

  // Payment Received
  const [isPaymentReceived, setIsPaymentReceived] = useState(
    initialInvoice?.status === 'RECEIVED' || initialInvoice?.status === 'PAID' || true
  );
  const [paymentMode, setPaymentMode] = useState('IMPS');
  const [paymentRefNo, setPaymentRefNo] = useState('AD/0102');
  const [depositTo, setDepositTo] = useState('CODEKAP');
  const [paymentAmount, setPaymentAmount] = useState<number>(15000);

  // Preview & Printing Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-fill customer details when changing customer
  const handleCustomerChange = (cName: string) => {
    setCustomerName(cName);
    const found = PRESET_CUSTOMERS.find((c) => c.name === cName);
    if (found) {
      const gstinLine = found.gstin ? `\nGSTIN: ${found.gstin}` : '';
      setBillingAddress(`${found.address}${gstinLine}`);
      setShippingAddress(`${found.name} ${found.gstin ? `(GSTIN: ${found.gstin})` : ''}\n${found.address}`);
      setPlaceOfSupply(found.placeOfSupply);
    }
  };

  // Row update helpers
  const updateRow = (index: number, updates: Partial<InvoiceLineItem>) => {
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
      const discAmt = cur.discountPercent ? Number(((taxable * cur.discountPercent) / 100).toFixed(2)) : (cur.discountAmount || 0);
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
        desc: 'New Service Item',
        hsn: '998314',
        qty: 1,
        unit: 'MTH',
        rate: 2000,
        rateType: globalRateType,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 2000,
        gstRate: 18,
        gstAmount: 360,
        totalAmount: 2360,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 })));
  };

  // Calculations
  const subtotalSum = items.reduce((acc, it) => acc + (it.taxableAmount || (it.qty * it.rate)), 0);
  const totalItemsCount = items.length;

  const discountAmountCalc =
    discountType === 'PERCENTAGE'
      ? Number(((subtotalSum * (Number(discountValue) || 0)) / 100).toFixed(2))
      : Number(discountValue) || 0;

  const totalTaxableAmt = Math.max(0, Number((subtotalSum - discountAmountCalc).toFixed(2)));

  const totalTaxAmt = items.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const igstAmt = isInterState ? totalTaxAmt : 0;
  const cgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;
  const sgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;

  const calculatedSubTotal = totalTaxableAmt + totalTaxAmt;
  const grandTotal = Number(
    (
      calculatedSubTotal +
      (showServiceCharge ? Number(serviceCharge) || 0 : 0) +
      (showOtherCharges ? Number(otherCharges) || 0 : 0)
    ).toFixed(2)
  );

  // Sync payment amount with grand total when paid in full
  const handlePayFull = () => {
    setPaymentAmount(grandTotal);
  };

  // Build the complete InvoiceItem representation for saving and previewing
  const invoiceNumberFull = `${invoicePrefix}${invoiceNumPart}${invoiceSuffix}`;

  const currentInvoiceData: InvoiceItem = {
    id: initialInvoice?.id || `inv_${Date.now()}`,
    invoiceNumber: invoiceNumberFull,
    seriesName,
    invoicePrefix,
    invoiceSuffix,
    bookName,
    date: invoiceDate,
    dueDate,
    clientId: initialInvoice?.clientId || `cli_${Date.now()}`,
    clientName: customerName,
    clientGstin: customerName === 'M.S.I. GROUP OF INSTITUTE' ? '03AEQPE9376K2ZY' : null,
    billingAddress,
    shippingAddress,
    quotationNo: quotationNo || null,
    placeOfSupply: placeOfSupplyChecked ? placeOfSupply : null,
    itemsJson: JSON.stringify(items),
    subtotal: subtotalSum,
    taxableAmount: totalTaxableAmt,
    discountType,
    discountValue,
    discountAmount: discountAmountCalc,
    cgst: cgstAmt,
    sgst: sgstAmt,
    igst: igstAmt,
    serviceCharge: showServiceCharge ? serviceCharge : 0,
    otherCharges: showOtherCharges ? otherCharges : 0,
    roundOff: 0,
    totalAmount: grandTotal,
    amountPaid: isPaymentReceived ? paymentAmount : 0,
    balanceDue: Math.max(0, grandTotal - (isPaymentReceived ? paymentAmount : 0)),
    currency: 'INR',
    status: isPaymentReceived ? 'RECEIVED' : 'DRAFT',
    paymentMethod: paymentMode,
    bankDetailsJson: JSON.stringify({
      accountHolderName: 'CODEKAPS DIGITAL INNOVATIONS PVT LTD',
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200112201868',
      ifscCode: 'HDFC0002684',
      branch: 'Mohali, Punjab',
      outstandingAmount: 0.0,
    }),
    paymentDetailsJson: isPaymentReceived
      ? JSON.stringify({
          isReceived: true,
          paymentMode,
          refNo: paymentRefNo,
          depositTo,
          amount: paymentAmount,
          receivedDate: invoiceDate,
        })
      : null,
    notes: specialNotes || 'If receipt against this invoice was created, then it will be auto unadjusted this invoice from that receipt entry!',
    terms: `Scope of Work: Services delivered as per the agreed scope, proposal, or service agreement.
Invoice Validity: This invoice is valid for 15 days from the date of issue unless otherwise stated.
Nature of Supply: This is a B2B service transaction. No physical goods are delivered.
GST: Currently registered under GST: 03AAMCC6345B1Z0.
Currency: All amounts are quoted and payable in INR (₹), unless specified otherwise.`,
    createdAt: initialInvoice?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSaveInvoice = async (andPrint = false) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const url = initialInvoice?.id
        ? `/api/finance/invoices/${initialInvoice.id}`
        : '/api/finance/invoices';
      const method = initialInvoice?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentInvoiceData,
          items,
          isInterState,
          rateType: globalRateType,
        }),
      });

      if (res.ok) {
        const savedData = await res.json();
        setStatusMessage({ type: 'success', text: `Invoice ${invoiceNumberFull} saved successfully!` });
        if (onSaved) onSaved(savedData);
        if (andPrint) {
          setShowPreviewModal(true);
        } else {
          setTimeout(() => {
            router.push('/finance/invoices');
          }, 600);
        }
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.error || 'Failed to save invoice.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/finance/invoices"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Back to Invoices"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {initialInvoice ? 'Edit Sales Invoice' : 'Create Sales Invoice'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isPaymentReceived ? 'Received' : 'Draft'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                ({invoiceNumberFull})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer btn-press"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Tax Invoice PDF Preview</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveInvoice(false)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer btn-press disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Warning Banner (matching Screenshot 1) */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            If receipt against this invoice was created, then it will be auto unadjusted this invoice from that receipt entry!
          </span>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Customer Info Card (matching Screenshot 1) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5 card-lift">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Customer Info.</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Customer Dropdown */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Customer <span className="text-slate-400 font-normal">(₹0.00 Cr)</span>
              </label>
              <div className="relative">
                <select
                  value={customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-2xs appearance-none"
                >
                  {PRESET_CUSTOMERS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Custom Customer">+ Add Custom Customer</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Series Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Series Name</label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-14 px-2 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-700"
                />
                <input
                  type="text"
                  value={invoiceNumPart}
                  onChange={(e) => setInvoiceNumPart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Suffix"
                  value={invoiceSuffix}
                  onChange={(e) => setInvoiceSuffix(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center text-slate-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Book Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Book Name</label>
              <select
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Sales Taxable">Sales Taxable</option>
                <option value="Export Non-GST">Export Non-GST</option>
                <option value="SEZ Zero-Rated">SEZ Zero-Rated</option>
              </select>
            </div>

            {/* Place of Supply */}
            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={placeOfSupplyChecked}
                  onChange={(e) => setPlaceOfSupplyChecked(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Place Of Supply</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              {placeOfSupplyChecked && (
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 w-48"
                  placeholder="e.g. PUNJAB (03)"
                />
              )}
            </div>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Billing Address</label>
              <textarea
                rows={3}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 block">Shipping Address</label>
                <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
                  Copy Billing Address
                </span>
              </div>
              <textarea
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Custom Fields Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 card-lift">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Custom Fields</h2>
            <button
              type="button"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Add Custom Fields ▾</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-72">
              <label className="text-xs font-bold text-slate-700 block mb-1">Quotation No</label>
              <input
                type="text"
                placeholder="Enter Quotation No"
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="transporterCheckbox"
                checked={transporterDetails}
                onChange={(e) => setTransporterDetails(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="transporterCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                Transporter Details
              </label>
            </div>
          </div>
        </div>

        {/* Goods / Service Multi-Row Dynamic Table (matching Screenshot 1 & 2) */}
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
                  <th className="py-3 px-4 min-w-[260px]">GOODS/SERVICE</th>
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

                    {/* Service Name Input + Quick Preset Selector */}
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(e) => updateRow(idx, { desc: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                            placeholder="Enter Service or Product Name"
                          />
                        </div>

                        {/* Deliverables / Sub bullets */}
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
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.unit || 'MTH'}</span>
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

                    {/* GST Rate Dropdown */}
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

          {/* Table Footer: Add Row & Subtotal (matching Screenshot 2) */}
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
              <span className="font-mono text-sm font-black text-slate-900">{formatINRPlain(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Notes, Bank Details, Payment Received & Summary (matching Screenshot 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Notes & Document Upload (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3 card-lift">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Special Notes</label>
                <span className="text-[10px] text-blue-600 font-bold font-mono">1000</span>
              </div>
              <textarea
                rows={4}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Type here your special notes for this invoice."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3 card-lift">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">Attach Document (Optional)</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-blue-600 block">Click to upload</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">JPEG, PDF, DOC, DOCX, PNG, or JPG & Size up to 2MB</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addDetailsCheck"
                  checked={wantAdditionalDetails}
                  onChange={(e) => setWantAdditionalDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="addDetailsCheck" className="text-xs font-semibold text-slate-600 cursor-pointer">
                  Want to add Additional Details
                </label>
              </div>
            </div>
          </div>

          {/* Middle Column: Bank Details & Payment Received (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3 card-lift">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Bank Details</label>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="CODEKAP">CODEKAP — HDFC Bank Ltd (50200112201868)</option>
              </select>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                <p><strong>A/C:</strong> CODEKAPS DIGITAL INNOVATIONS PVT LTD</p>
                <p><strong>IFSC:</strong> HDFC0002684 • Mohali, Punjab</p>
              </div>
            </div>

            {/* Is Payment Received Card (matching Screenshot 2) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 card-lift">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-900">
                <input
                  type="checkbox"
                  checked={isPaymentReceived}
                  onChange={(e) => setIsPaymentReceived(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Is Payment Received?</span>
              </label>

              {isPaymentReceived && (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      >
                        <option value="IMPS">IMPS</option>
                        <option value="UPI">UPI</option>
                        <option value="NEFT">NEFT</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Ref. No.</label>
                      <input
                        type="text"
                        value={paymentRefNo}
                        onChange={(e) => setPaymentRefNo(e.target.value)}
                        placeholder="e.g. AD/0102"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Deposit to</label>
                    <select
                      value={depositTo}
                      onChange={(e) => setDepositTo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="CODEKAP">CODEKAP</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600">Amount (₹)</label>
                      <button
                        type="button"
                        onClick={handlePayFull}
                        className="text-[10px] text-blue-600 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Pay full</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add More Payment</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Summary Box (4 cols) (matching Screenshot 2) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 card-lift">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Summary</h2>

              <div className="space-y-3 text-xs border-b border-slate-200 pb-4">
                {/* Discount Before Tax */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-600">Discount Before Tax</span>
                  <div className="flex items-center gap-1.5 w-32">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-mono"
                    />
                  </div>
                </div>

                {/* Taxable Amount */}
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold">Taxable Amt.</span>
                  <span className="font-mono font-bold">₹{formatINRPlain(totalTaxableAmt)}</span>
                </div>

                {/* Optional Service Charge */}
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

                {/* GST Breakdown (IGST or CGST/SGST) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{isInterState ? 'IGST' : 'CGST + SGST'}</span>
                      <button
                        type="button"
                        onClick={() => setIsInterState(!isInterState)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-blue-600 hover:bg-blue-50 font-bold uppercase"
                      >
                        {isInterState ? 'Switch Intra' : 'Switch Inter'}
                      </button>
                    </div>
                    <span className="font-mono font-bold">₹{formatINRPlain(totalTaxAmt)}</span>
                  </div>
                </div>

                {/* Sub Total */}
                <div className="flex items-center justify-between text-slate-900 font-extrabold pt-2 border-t border-slate-200">
                  <span>Sub Total</span>
                  <span className="font-mono">₹{formatINRPlain(calculatedSubTotal)}</span>
                </div>

                {/* Optional Other Charges */}
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
                    <span>Add another charges</span>
                  </button>
                )}
              </div>

              {/* Final Grand Total Display */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Total Invoice Value</span>
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  ₹{formatINRPlain(grandTotal)}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>Payment Status:</span>
                  <span className={isPaymentReceived ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isPaymentReceived ? '✓ Fully Received' : 'Draft / Unpaid'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveInvoice(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer btn-press"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save & Preview Tax Invoice (PDF)</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveInvoice(false)}
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

      {/* Tax Invoice Fullscreen Preview & Print Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center">
          <div className="max-w-4xl w-full">
            <TaxInvoiceView
              invoice={currentInvoiceData}
              onClose={() => setShowPreviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
