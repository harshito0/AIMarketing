'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QuotationItem,
  QuotationLineItem,
  SundryDebtorCustomer,
} from '@/lib/types';
import { DEFAULT_BANK_DETAILS } from '@/lib/bank-details';
import { formatINR, formatINRPlain } from '@/lib/invoice-utils';
import { QuotationView } from './quotation-view';
import { NewCustomerDrawer } from './new-customer-drawer';
import { CustomFieldsModal, CustomFieldItem } from './custom-fields-modal';
import { ItemTuneModal } from './item-tune-modal';
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
  Building2,
  Sliders,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  HelpCircle,
  Download,
} from 'lucide-react';

interface QuotationEditorProps {
  initialQuotation?: QuotationItem | null;
  onSaved?: (qtn: QuotationItem) => void;
  onCancel?: () => void;
}

const PRESET_CUSTOMERS: SundryDebtorCustomer[] = [];

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

  // Meta Info matching Screenshot 4
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
      : ''
  );
  const [suffix, setSuffix] = useState(initialQuotation?.suffix || '');
  const [quotationDate, setQuotationDate] = useState(
    initialQuotation?.date || new Date().toISOString().split('T')[0]
  );
  const [validTill, setValidTill] = useState(
    initialQuotation?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  // Items List
  const defaultItems: QuotationLineItem[] = [
    {
      srNo: 1,
      desc: '',
      deliverables: [],
      hsn: '998314',
      qty: 1,
      unit: 'NOS',
      rate: 0,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 0,
      gstRate: 18,
      gstAmount: 0,
      totalAmount: 0,
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

  // Rates & Taxes Mode
  const [globalRateType, setGlobalRateType] = useState<'EXCLUSIVE_GST' | 'INCLUSIVE_GST'>('EXCLUSIVE_GST');
  const [isInterState, setIsInterState] = useState(
    initialQuotation ? (initialQuotation.igst || 0) > 0 : false
  );

  // Discount & Charges matching Screenshot 4
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(initialQuotation?.discountBeforeTax || 0);
  const [serviceCharge, setServiceCharge] = useState<number>(initialQuotation?.serviceCharge || 0);
  const [showServiceCharge, setShowServiceCharge] = useState(Boolean(initialQuotation?.serviceCharge));
  
  // Another charges row matching Screenshot 4 ("Select charges v", + - ₹ %, value, trash)
  const [chargeName, setChargeName] = useState('Select charges');
  const [chargeType, setChargeType] = useState<'+' | '-'>('+');
  const [chargeUnit, setChargeUnit] = useState<'₹' | '%'>('₹');
  const [chargeValue, setChargeValue] = useState<number>(initialQuotation?.otherCharges || 0);
  const [showOtherChargeRow, setShowOtherChargeRow] = useState(Boolean(initialQuotation?.otherCharges));

  const [discountAfterTaxType, setDiscountAfterTaxType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountAfterTaxValue, setDiscountAfterTaxValue] = useState<number>(initialQuotation?.discountAfterTax || 0);
  const [autoRoundOff, setAutoRoundOff] = useState(true);

  // Special Notes
  const [specialNotes, setSpecialNotes] = useState(initialQuotation?.notes || '');

  // Fetch next quotation number when creating new quotation
  useEffect(() => {
    if (!initialQuotation) {
      fetch('/api/finance/quotations?nextNumber=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.nextNumPart) {
            setQNumPart(data.nextNumPart);
          }
        })
        .catch(() => {});
    }
  }, [initialQuotation]);

  // Sync state if initialQuotation arrives or updates
  useEffect(() => {
    if (initialQuotation) {
      if (initialQuotation.clientName) setCustomerName(initialQuotation.clientName);
      if (initialQuotation.clientPhone) setCustomerPhone(initialQuotation.clientPhone);
      if (initialQuotation.clientEmail) setCustomerEmail(initialQuotation.clientEmail);
      if (initialQuotation.clientGstin) setCustomerGstin(initialQuotation.clientGstin);
      if (initialQuotation.billingAddress) setBillingAddress(initialQuotation.billingAddress);
      if (initialQuotation.prefix) setPrefix(initialQuotation.prefix);
      if (initialQuotation.quotationNumber) {
        setQNumPart(initialQuotation.quotationNumber.replace(/^[A-Za-z]+-?/, ''));
      }
      if (initialQuotation.suffix !== undefined) setSuffix(initialQuotation.suffix || '');
      if (initialQuotation.date) setQuotationDate(initialQuotation.date);
      if (initialQuotation.validUntil) setValidTill(initialQuotation.validUntil);
      if (initialQuotation.notes) setSpecialNotes(initialQuotation.notes);
      if (initialQuotation.itemsJson) {
        try {
          const parsed = JSON.parse(initialQuotation.itemsJson);
          if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
        } catch {}
      }
    }
  }, [initialQuotation]);

  // Modals & Drawers
  const [customerList, setCustomerList] = useState<SundryDebtorCustomer[]>([]);

  // Load real clients from database
  useEffect(() => {
    async function loadRealClients() {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const clientsData = await res.json();
          if (Array.isArray(clientsData) && clientsData.length > 0) {
            const mapped: SundryDebtorCustomer[] = clientsData.map((c: any) => ({
              accountDisplayName: c.name || c.businessName || 'Client',
              legalName: c.businessName || c.name || 'Client',
              registrationType: c.country === 'India' ? 'Registered Regular' : 'Overseas / Export',
              partyType: 'Not Applicable',
              gstin: c.clientGstin || '',
              addressLine1: c.city ? `${c.city}, ${c.province || ''}` : (c.addressLine1 || ''),
              city: c.city || '',
              state: c.province || '',
              country: c.country || 'India',
              pincode: c.pincode || '',
              mobileNo: c.contactPhone || '',
              email: c.contactEmail || '',
              openingBalance: 0,
              balanceType: 'Cr',
              balanceFormatted: '₹0.00 Cr',
            }));
            setCustomerList(mapped);
          }
        }
      } catch (err) {
        console.warn('Failed to load registered clients:', err);
      }
    }
    loadRealClients();
  }, []);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [customFieldsList, setCustomFieldsList] = useState<CustomFieldItem[]>([]);
  const [showItemTuneModal, setShowItemTuneModal] = useState(false);
  const [tuneItemIndex, setTuneItemIndex] = useState<number>(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keyboard shortcut listeners (ALT+S, ALT+P, CTRL+SHIFT+L, ALT+D, ALT+A, ALT+R)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (showCustomerDrawer || showCustomFieldsModal || showItemTuneModal) return;

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveQuotation(false);
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowPreviewModal(true);
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setShowPreviewModal(true);
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (onCancel) onCancel();
        else router.push('/finance/quotations');
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        addRow();
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (items.length > 1) removeRow(items.length - 1);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [items, showCustomerDrawer, showCustomFieldsModal, showItemTuneModal]);

  // Customer selection helper
  const handleSelectCustomer = (cName: string) => {
    if (cName === '__ADD_NEW__') {
      setShowCustomerDrawer(true);
      return;
    }
    setCustomerName(cName);
    const found = customerList.find((c) => c.accountDisplayName === cName || c.legalName === cName);
    if (found) {
      setCustomerPhone([found.dialCode, found.mobileNo].filter(Boolean).join(' ') || found.mobileNo || '');
      setCustomerEmail(found.email || '');
      setCustomerGstin(found.gstin || found.foreignTaxId || found.panItTanNo || '');
      const addr = [found.addressLine1, found.addressLine2, found.city, found.state, found.pincode, found.country && found.country !== 'India' ? found.country : '']
        .filter(Boolean)
        .join(', ');
      setBillingAddress(addr);
    }
  };

  // Customer saved from drawer
  const handleCustomerSaved = async (newCust: SundryDebtorCustomer) => {
    setCustomerList((prev) => [newCust, ...prev]);
    setCustomerName(newCust.accountDisplayName);
    setCustomerPhone([newCust.dialCode, newCust.mobileNo].filter(Boolean).join(' ') || newCust.mobileNo || '');
    setCustomerEmail(newCust.email || '');
    setCustomerGstin(newCust.gstin || newCust.foreignTaxId || newCust.panItTanNo || '');
    const addr = [newCust.addressLine1, newCust.addressLine2, newCust.city, newCust.state, newCust.pincode, newCust.country && newCust.country !== 'India' ? newCust.country : '']
      .filter(Boolean)
      .join(', ');
    setBillingAddress(addr);

    // Persist to /api/clients in background
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCust.accountDisplayName,
          businessName: newCust.legalName || newCust.accountDisplayName,
          country: newCust.country || (newCust.isForeign ? 'Canada' : 'India'),
          province: newCust.state || '',
          city: newCust.city || '',
          contactName: newCust.contactPersonName || '',
          contactEmail: newCust.email || '',
          contactPhone: [newCust.dialCode, newCust.mobileNo].filter(Boolean).join(' '),
          description: `Customer added via Quotations (${newCust.isForeign ? 'Foreign Client' : 'Domestic Client'})`,
        }),
      });
    } catch (e) {
      console.warn('Note on auto-saving customer to /api/clients:', e);
    }
  };

  // Row update helpers
  const updateRow = (index: number, updates: Partial<QuotationLineItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = { ...copy[index], ...updates };
      const qty = Number(cur.qty) || 0;
      const rate = Number(cur.rate) || 0;
      const gstRate = Number(cur.gstRate) || 0;

      let taxable = qty * rate;
      if (globalRateType === 'INCLUSIVE_GST' && gstRate > 0) {
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
        desc: '',
        deliverables: [],
        hsn: '998314',
        qty: 1,
        unit: 'NOS',
        rate: 0,
        rateType: globalRateType,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 0,
        gstRate: 0,
        gstAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 })));
  };

  // Calculations matching Screenshot 4
  const subtotalSum = items.reduce((acc, it) => acc + (it.taxableAmount || (it.qty * it.rate)), 0);
  const totalQtySum = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  const discountBeforeTaxCalc =
    discountType === 'PERCENTAGE'
      ? Number(((subtotalSum * (Number(discountValue) || 0)) / 100).toFixed(2))
      : Number(discountValue) || 0;

  const totalTaxableAmt = Math.max(0, Number((subtotalSum - discountBeforeTaxCalc).toFixed(2)));

  const totalTaxAmt = items.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const igstAmt = isInterState ? totalTaxAmt : 0;
  const cgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;
  const sgstAmt = !isInterState ? Number((totalTaxAmt / 2).toFixed(2)) : 0;

  const calculatedSubTotal = totalTaxableAmt + totalTaxAmt;

  const additionalChargesCalc = showOtherChargeRow
    ? (chargeType === '+' ? 1 : -1) *
      (chargeUnit === '₹' ? Number(chargeValue) || 0 : ((calculatedSubTotal * (Number(chargeValue) || 0)) / 100))
    : 0;

  const discountAfterTaxCalc =
    discountAfterTaxType === 'PERCENTAGE'
      ? Number(((calculatedSubTotal * (Number(discountAfterTaxValue) || 0)) / 100).toFixed(2))
      : Number(discountAfterTaxValue) || 0;

  const unroundedTotal =
    calculatedSubTotal +
    (showServiceCharge ? Number(serviceCharge) || 0 : 0) +
    additionalChargesCalc -
    discountAfterTaxCalc;

  const grandTotal = autoRoundOff ? Math.round(unroundedTotal) : Number(unroundedTotal.toFixed(2));
  const roundOffDiff = Number((grandTotal - unroundedTotal).toFixed(2));

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
    clientPhone: customerPhone,
    clientEmail: customerEmail,
    clientGstin: customerGstin,
    billingAddress,
    itemsJson: JSON.stringify(items),
    subtotal: subtotalSum,
    taxableAmount: totalTaxableAmt,
    cgst: cgstAmt,
    sgst: sgstAmt,
    igst: igstAmt,
    taxAmount: totalTaxAmt,
    discountBeforeTax: discountBeforeTaxCalc,
    discountAfterTax: discountAfterTaxCalc,
    serviceCharge: showServiceCharge ? serviceCharge : 0,
    otherCharges: additionalChargesCalc,
    roundOff: roundOffDiff,
    autoRoundOff,
    totalAmount: grandTotal,
    currency: 'INR',
    status: initialQuotation?.status === 'DELETED' ? 'DRAFT' : initialQuotation?.status || 'DRAFT',
    notes: specialNotes,
    bankDetails: JSON.stringify(DEFAULT_BANK_DETAILS),
    terms: `1. Payment: 50% advance along with work order, 50% on project milestone delivery.
2. Validity: Quotation valid for 30 days from date of issue.
3. GST: Registered under GST: 03AAMCC6345B1Z0.
4. Support: Includes 30 days post-launch technical support.`,
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
        }),
      });

      if (res.ok) {
        const savedData = await res.json();
        // Immediately sync to localStorage cache
        try {
          const cached = localStorage.getItem('codekap_cached_quotations');
          let list: QuotationItem[] = cached ? JSON.parse(cached) : [];
          if (!Array.isArray(list)) list = [];
          const existsIdx = list.findIndex((q) => q.id === savedData.id || q.quotationNumber === savedData.quotationNumber);
          if (existsIdx >= 0) {
            list[existsIdx] = savedData;
          } else {
            list.unshift(savedData);
          }
          localStorage.setItem('codekap_cached_quotations', JSON.stringify(list));
        } catch {}

        setStatusMessage({ type: 'success', text: `Quotation ${quotationNumberFull} saved successfully!` });
        if (onSaved) onSaved(savedData);
        if (andPrint) {
          setShowPreviewModal(true);
        } else {
          setTimeout(() => {
            router.push('/finance/quotations');
          }, 400);
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
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-20 font-sans">
      {/* Editor Content (Hidden when preview/print modal is open) */}
      <div className={showPreviewModal ? 'print:hidden' : ''}>
        {/* Top Header Bar matching Screenshot 4 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/finance/quotations"
              className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-800">
                Create Quotation ({quotationNumberFull})
              </h1>
              <Star className="w-4 h-4 text-slate-400 hover:text-amber-500 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomFieldsModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Custom Field</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Customer Info Card matching Screenshot 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800">Customer Info.</h2>

          {/* Row 1: Customer Search, Mobile No., Email */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Search */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Customer<span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerDrawer(true)}
                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                  title="Add / Edit Customer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Please select customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomerDrawer(true)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-600"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile No. with Flag */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile No.</label>
              <div className="flex">
                <span className="inline-flex items-center gap-1 px-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-medium text-slate-600">
                  <span>🇮🇳</span> +91
                </span>
                <input
                  type="text"
                  placeholder="e.g. 7528835379"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="example@domain.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Quotation No., Quotation Date, Valid Till */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Quotation No. */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quotation No.<span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-14 px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-center text-slate-700"
                />
                <input
                  type="text"
                  value={qNumPart}
                  onChange={(e) => setQNumPart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center text-slate-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Quotation Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quotation Date<span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Valid Till */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Valid Till</label>
              <div className="relative">
                <input
                  type="date"
                  value={validTill}
                  onChange={(e) => setValidTill(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Goods / Service Table matching Screenshot 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#EEF2F9] text-slate-600 font-bold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">SR.NO.</th>
                  <th className="py-2.5 px-4 min-w-[300px]">GOODS/SERVICE</th>
                  <th className="py-2.5 px-3 text-center w-28">HSN/SAC</th>
                  <th className="py-2.5 px-3 text-center w-24">QTY</th>
                  <th className="py-2.5 px-3 text-right min-w-[150px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>RATE (₹)</span>
                      <select
                        value={globalRateType}
                        onChange={(e) => setGlobalRateType(e.target.value as any)}
                        className="bg-transparent border border-slate-300 rounded px-1 py-0.5 text-[10px] font-medium text-slate-700 cursor-pointer"
                      >
                        <option value="EXCLUSIVE_GST">Exclusive GST</option>
                        <option value="INCLUSIVE_GST">Inclusive GST</option>
                      </select>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center w-24">GST RATE(%)</th>
                  <th className="py-2.5 px-4 text-right w-32">AMOUNT (₹)</th>
                  <th className="py-2.5 px-2 text-center w-10">🎵</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                      {idx + 1}
                    </td>

                    {/* Service Name with preset dropdown & pencil */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(e) => updateRow(idx, { desc: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                            placeholder="Please select goods/service"
                          />
                        </div>

                        {/* Quick Presets selector dropdown */}
                        <div className="relative shrink-0">
                          <select
                            onChange={(e) => {
                              const found = PRESET_SERVICES.find((s) => s.desc === e.target.value);
                              if (found) {
                                updateRow(idx, {
                                  desc: found.desc,
                                  hsn: found.hsn,
                                  rate: found.rate,
                                  unit: found.unit,
                                  deliverables: found.deliverables,
                                });
                              }
                            }}
                            className="w-5 h-7 opacity-0 absolute inset-0 cursor-pointer"
                            title="Pick from standard presets"
                          >
                            <option value="">Select Service Catalog</option>
                            {PRESET_SERVICES.map((s) => (
                              <option key={s.desc} value={s.desc}>
                                {s.desc}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTuneItemIndex(idx);
                            setShowItemTuneModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Edit Line Details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* HSN/SAC */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => updateRow(idx, { hsn: e.target.value })}
                        placeholder="4 to 8 digit"
                        className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* QTY & Unit underneath */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateRow(idx, { qty: Number(e.target.value) || 0 })}
                          className="w-16 text-center px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                          {item.unit || 'NOS'}
                        </span>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateRow(idx, { rate: Number(e.target.value) || 0 })}
                        className="w-full text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* GST Rate Dropdown */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="relative">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateRow(idx, { gstRate: Number(e.target.value) })}
                          className="w-full pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none appearance-none"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Row Amount */}
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800 text-xs">
                      {formatINRPlain(item.totalAmount)}
                    </td>

                    {/* Tune / Notes button 🎵 */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTuneItemIndex(idx);
                          setShowItemTuneModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Deliverables & Scope"
                      >
                        🎵
                      </button>
                    </td>

                    {/* Delete Icon */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
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

          {/* Table Footer: Add Row & Subtotal matching Screenshot 4 */}
          <div className="p-3 px-6 border-t border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
              <span className="text-xs font-semibold text-slate-700">Subtotal</span>
            </div>

            <div className="flex items-center gap-16 text-xs font-semibold text-slate-700 pr-12">
              <span className="font-mono text-center w-12">{totalQtySum}</span>
              <span className="font-mono text-right w-28 font-bold text-slate-900">
                {formatINRPlain(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom 2-Column Section matching Screenshot 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Special Notes (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Special Notes</h3>
                  <span className="text-[11px] text-slate-400">Write your special notes for this quotation.</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold font-mono">1000</span>
              </div>
              <textarea
                rows={4}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Write your special notes for this quotation."
                maxLength={1000}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Bank Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bank Details (Printed on Quotation)</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Current A/C
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Bank:</span>
                  <span className="font-bold text-slate-900">{DEFAULT_BANK_DETAILS.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">A/C No:</span>
                  <span className="font-mono font-bold text-slate-900">{DEFAULT_BANK_DETAILS.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-900">{DEFAULT_BANK_DETAILS.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Account Type:</span>
                  <span className="font-bold text-blue-700">{DEFAULT_BANK_DETAILS.accountType}</span>
                </div>
                <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200 mt-1">
                  <span>Branch: </span>
                  <span className="text-slate-800">{DEFAULT_BANK_DETAILS.branch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary matching Screenshot 4 (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="space-y-2.5 text-xs">
                {/* Discount Before Tax */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discount Before Tax</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono"
                    />
                    <span className="w-16 text-right font-mono font-medium text-slate-700">
                      {formatINRPlain(discountBeforeTaxCalc)}
                    </span>
                  </div>
                </div>

                {/* Taxable Amount */}
                <div className="flex items-center justify-between text-slate-700">
                  <span>Taxable Amt.</span>
                  <span className="font-mono font-semibold">₹{formatINRPlain(totalTaxableAmt)}</span>
                </div>

                {/* Add service charge with tax */}
                {showServiceCharge ? (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[11px]">Service Charge</span>
                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                      className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowServiceCharge(true)}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add service charge with tax</span>
                  </button>
                )}

                {/* Total Taxable Amt. */}
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-100">
                  <span>Total Taxable Amt.</span>
                  <span className="font-mono font-semibold">₹{formatINRPlain(totalTaxableAmt)}</span>
                </div>

                {/* SGST & CGST (matching Screenshot 4) */}
                <div className="flex items-center justify-between text-slate-700">
                  <span>SGST</span>
                  <span className="font-mono font-semibold">₹{formatINRPlain(sgstAmt)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>CGST</span>
                  <span className="font-mono font-semibold">₹{formatINRPlain(cgstAmt)}</span>
                </div>

                {/* Sub Total */}
                <div className="flex items-center justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                  <span>Sub Total</span>
                  <span className="font-mono">₹{formatINRPlain(calculatedSubTotal)}</span>
                </div>

                {/* Select Charges Row matching Screenshot 4 */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="relative flex-1">
                    <select
                      value={chargeName}
                      onChange={(e) => {
                        setChargeName(e.target.value);
                        setShowOtherChargeRow(true);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600"
                    >
                      <option value="Select charges">Select charges</option>
                      <option value="Packaging & Handling">Packaging & Handling</option>
                      <option value="Freight & Courier">Freight & Courier</option>
                      <option value="Installation Support">Installation Support</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setChargeType(chargeType === '+' ? '-' : '+')}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-xs"
                    >
                      {chargeType}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChargeUnit(chargeUnit === '₹' ? '%' : '₹')}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-xs"
                    >
                      {chargeUnit}
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={chargeValue}
                      onChange={(e) => {
                        setChargeValue(Number(e.target.value) || 0);
                        setShowOtherChargeRow(true);
                      }}
                      className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setChargeValue(0);
                        setShowOtherChargeRow(false);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* + Add Another Charge */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowOtherChargeRow(true)}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add Another Charge</span>
                  </button>
                </div>

                {/* Discount After Tax */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Discount After Tax</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={discountAfterTaxType}
                      onChange={(e) => setDiscountAfterTaxType(e.target.value as any)}
                      className="px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountAfterTaxValue}
                      onChange={(e) => setDiscountAfterTaxValue(Number(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono"
                    />
                    <span className="w-16 text-right font-mono font-medium text-slate-700">
                      {formatINRPlain(discountAfterTaxCalc)}
                    </span>
                  </div>
                </div>

                {/* Auto Round Off Checkbox */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoRoundOff}
                      onChange={(e) => setAutoRoundOff(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Auto Round Off</span>
                  </label>
                  <span className="font-mono text-slate-500 text-xs">
                    {roundOffDiff !== 0 ? `₹${roundOffDiff > 0 ? '+' : ''}${roundOffDiff.toFixed(2)}` : '₹0.00'}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="font-mono text-base font-bold">₹{formatINRPlain(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions matching Screenshot 3 & 4 */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.push('/finance/quotations'))}
            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveQuotation(false)}
            className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Sticky Bottom Shortcuts Bar matching Screenshot 4 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-6 z-30 shadow-lg text-[10px] text-slate-600 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Shortcuts:</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + S</kbd> Save</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + P</kbd> Print</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">CTRL + SHIFT + L</kbd> Download Quotation</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + D</kbd> Discard</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + A</kbd> Add New Row</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + R</kbd> Remove Row</span>
          </div>
        </div>
      </div>

      {/* New Customer Drawer (Screenshot 5) */}
      <NewCustomerDrawer
        isOpen={showCustomerDrawer}
        onClose={() => setShowCustomerDrawer(false)}
        onSave={handleCustomerSaved}
        initialData={{
          accountDisplayName: customerName,
          legalName: customerName,
          mobileNo: customerPhone,
          email: customerEmail,
        }}
      />

      {/* Custom Fields Modal */}
      <CustomFieldsModal
        isOpen={showCustomFieldsModal}
        onClose={() => setShowCustomFieldsModal(false)}
        customFields={customFieldsList}
        onSave={(fields) => setCustomFieldsList(fields)}
      />

      {/* Item Tune Modal (Deliverables & Scope) */}
      <ItemTuneModal
        isOpen={showItemTuneModal}
        onClose={() => setShowItemTuneModal(false)}
        item={items[tuneItemIndex] as any}
        rowIndex={tuneItemIndex}
        onSave={(idx, updates) => updateRow(idx, updates)}
      />
      </div>

      {/* Quotation Fullscreen Preview & Print Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center print:static print:bg-white print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:backdrop-blur-none">
          <div className="max-w-4xl w-full print:max-w-none print:w-full print:m-0 print:p-0">
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
