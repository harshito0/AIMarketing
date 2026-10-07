'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  InvoiceItem,
  InvoiceLineItem,
  InvoiceBankDetails,
  SundryDebtorCustomer,
} from '@/lib/types';
import { DEFAULT_BANK_DETAILS } from '@/lib/bank-details';
import { formatINR, formatINRPlain } from '@/lib/invoice-utils';
import { TaxInvoiceView } from './tax-invoice-view';
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
  Upload,
  Info,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  FileText,
  Sliders,
  Check,
  X,
  Edit2,
  MoreVertical,
  Download,
  Copy,
} from 'lucide-react';

interface SalesInvoiceEditorProps {
  initialInvoice?: InvoiceItem | null;
  onSaved?: (invoice: InvoiceItem) => void;
  onCancel?: () => void;
}

interface PaymentRow {
  id: string;
  mode: string;
  refNo: string;
  depositTo: string;
  amount: number;
}

const PRESET_CUSTOMERS: SundryDebtorCustomer[] = [];

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

  // Customer & Meta
  const [customerName, setCustomerName] = useState(initialInvoice?.clientName || '');
  const [customerGstin, setCustomerGstin] = useState(initialInvoice?.clientGstin || '');
  const [customerBalance, setCustomerBalance] = useState('₹0.00 Cr');
  const [seriesName, setSeriesName] = useState(initialInvoice?.seriesName || 'Sales Invoice');
  const [invoicePrefix, setInvoicePrefix] = useState(initialInvoice?.invoicePrefix || 'INV');
  const [invoiceNumPart, setInvoiceNumPart] = useState(
    initialInvoice?.invoiceNumber
      ? initialInvoice.invoiceNumber.replace(/^[A-Za-z]+-?/, '')
      : ''
  );
  const [invoiceSuffix, setInvoiceSuffix] = useState(initialInvoice?.invoiceSuffix || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    if (!initialInvoice) return defaultDue;
    const invDate = initialInvoice.date || today;
    if (initialInvoice.dueDate && initialInvoice.dueDate >= invDate) {
      return initialInvoice.dueDate;
    }
    const d = new Date(invDate);
    d.setDate(d.getDate() + 15);
    return isNaN(d.getTime()) ? defaultDue : d.toISOString().split('T')[0];
  });

  const handleInvoiceDateChange = (val: string) => {
    setInvoiceDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 15);
        setDueDate(d.toISOString().split('T')[0]);
      }
    }
  };
  const [bookName, setBookName] = useState(initialInvoice?.bookName || 'Sales Taxable');
  const [billingAddress, setBillingAddress] = useState(initialInvoice?.billingAddress || '');
  const [shippingAddress, setShippingAddress] = useState(
    initialInvoice?.shippingAddress || initialInvoice?.billingAddress || ''
  );
  const [placeOfSupplyChecked, setPlaceOfSupplyChecked] = useState(Boolean(initialInvoice?.placeOfSupply));
  const [placeOfSupply, setPlaceOfSupply] = useState(initialInvoice?.placeOfSupply || '');

  // Custom Fields
  const [quotationNo, setQuotationNo] = useState(initialInvoice?.quotationNo || '');
  const [transporterDetails, setTransporterDetails] = useState(false);
  const [transporterInfo, setTransporterInfo] = useState({
    transporterName: '',
    transporterId: '',
    docNo: '',
    vehicleNo: '',
  });

  const emptyLineItem: InvoiceLineItem = {
    srNo: 1,
    desc: '',
    deliverables: [],
    hsn: '998314',
    qty: 1,
    unit: 'MTH',
    rate: 0,
    rateType: 'EXCLUSIVE_GST',
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstRate: 18,
    gstAmount: 0,
    totalAmount: 0,
  };

  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (initialInvoice?.itemsJson) {
      try {
        const parsed = JSON.parse(initialInvoice.itemsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [emptyLineItem];
  });

  // Rates & Taxes Mode
  const [globalRateType, setGlobalRateType] = useState<'EXCLUSIVE_GST' | 'INCLUSIVE_GST'>('EXCLUSIVE_GST');
  const [isInterState, setIsInterState] = useState<boolean>(
    initialInvoice ? (initialInvoice.igst || 0) > 0 : true
  );

  // Discount & Charges
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(initialInvoice?.discountValue || 0);
  const [serviceCharge, setServiceCharge] = useState<number>(initialInvoice?.serviceCharge || 0);
  const [showServiceCharge, setShowServiceCharge] = useState(Boolean(initialInvoice?.serviceCharge));
  const [otherCharges, setOtherCharges] = useState<number>(initialInvoice?.otherCharges || 0);
  const [showOtherCharges, setShowOtherCharges] = useState(Boolean(initialInvoice?.otherCharges));
  const [discountAfterTaxType, setDiscountAfterTaxType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountAfterTaxValue, setDiscountAfterTaxValue] = useState<number>(0);
  const [autoRoundOff, setAutoRoundOff] = useState(true);

  // Special Notes & Attachments
  const [specialNotes, setSpecialNotes] = useState(initialInvoice?.notes || '');
  const [wantAdditionalDetails, setWantAdditionalDetails] = useState(false);
  const [bankAccount, setBankAccount] = useState('HDFC');

  // Payment Received
  const [isPaymentReceived, setIsPaymentReceived] = useState<boolean>(() => {
    if (!initialInvoice) return false;
    return initialInvoice.status === 'RECEIVED' || initialInvoice.status === 'PAID';
  });

  const [payments, setPayments] = useState<PaymentRow[]>(() => {
    if (initialInvoice?.paymentDetailsJson) {
      try {
        const parsed = JSON.parse(initialInvoice.paymentDetailsJson);
        if (Array.isArray(parsed.payments) && parsed.payments.length > 0) {
          return parsed.payments;
        }
        if (parsed.amount) {
          return [
            {
              id: 'pay_1',
              mode: parsed.paymentMode || initialInvoice.paymentMethod || 'IMPS',
              refNo: parsed.refNo || '',
              depositTo: parsed.depositTo || 'HDFC Bank',
              amount: Number(parsed.amount) || 0,
            },
          ];
        }
      } catch {}
    }
    if (initialInvoice && (initialInvoice.status === 'RECEIVED' || initialInvoice.status === 'PAID')) {
      return [
        {
          id: 'pay_1',
          mode: initialInvoice.paymentMethod || 'IMPS',
          refNo: '',
          depositTo: 'HDFC Bank',
          amount: initialInvoice.amountPaid || initialInvoice.totalAmount || 0,
        },
      ];
    }
    return [
      {
        id: 'pay_1',
        mode: 'IMPS',
        refNo: '',
        depositTo: 'HDFC Bank',
        amount: 0,
      },
    ];
  });

  // Fetch next invoice number if creating new invoice
  useEffect(() => {
    if (!initialInvoice) {
      fetch('/api/finance/invoices?nextNumber=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.nextNumPart) {
            setInvoiceNumPart(data.nextNumPart);
          }
        })
        .catch(() => {});
    }
  }, [initialInvoice]);

  // Sync state if initialInvoice arrives or updates
  useEffect(() => {
    if (initialInvoice) {
      if (initialInvoice.clientName) setCustomerName(initialInvoice.clientName);
      if (initialInvoice.clientGstin) setCustomerGstin(initialInvoice.clientGstin);
      if (initialInvoice.invoiceNumber) {
        setInvoiceNumPart(initialInvoice.invoiceNumber.replace(/^[A-Za-z]+-?/, ''));
      }
      if (initialInvoice.seriesName) setSeriesName(initialInvoice.seriesName);
      if (initialInvoice.invoicePrefix) setInvoicePrefix(initialInvoice.invoicePrefix);
      if (initialInvoice.invoiceSuffix !== undefined) setInvoiceSuffix(initialInvoice.invoiceSuffix || '');
      if (initialInvoice.date) setInvoiceDate(initialInvoice.date);
      if (initialInvoice.dueDate) {
        if (initialInvoice.date && initialInvoice.dueDate < initialInvoice.date) {
          const d = new Date(initialInvoice.date);
          d.setDate(d.getDate() + 15);
          setDueDate(!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : initialInvoice.dueDate);
        } else {
          setDueDate(initialInvoice.dueDate);
        }
      }
      if (initialInvoice.bookName) setBookName(initialInvoice.bookName);
      if (initialInvoice.billingAddress) setBillingAddress(initialInvoice.billingAddress);
      if (initialInvoice.shippingAddress) setShippingAddress(initialInvoice.shippingAddress);
      if (initialInvoice.placeOfSupply) {
        setPlaceOfSupply(initialInvoice.placeOfSupply);
        setPlaceOfSupplyChecked(true);
      }
      if (initialInvoice.quotationNo) setQuotationNo(initialInvoice.quotationNo);
      if (initialInvoice.notes) setSpecialNotes(initialInvoice.notes);
      if (initialInvoice.itemsJson) {
        try {
          const parsed = JSON.parse(initialInvoice.itemsJson);
          if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
        } catch {}
      }
      const isPaid = initialInvoice.status === 'RECEIVED' || initialInvoice.status === 'PAID';
      setIsPaymentReceived(isPaid);
    }
  }, [initialInvoice]);

  // Modals & Drawers state
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
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
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(false);
  const [customFieldsList, setCustomFieldsList] = useState<CustomFieldItem[]>([]);
  const [showItemTuneModal, setShowItemTuneModal] = useState(false);
  const [tuneItemIndex, setTuneItemIndex] = useState<number>(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keyboard shortcut listeners (ALT+S, ALT+P, CTRL+SHIFT+L, ALT+D, ALT+A, ALT+R)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if drawers or modals are active
      if (showCustomerDrawer || showCustomFieldsModal || showItemTuneModal) return;

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveInvoice(false);
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowPreviewModal(true);
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setShowPreviewModal(true);
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (onCancel) onCancel();
        else router.push('/finance/invoices');
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

  // Auto-fill customer details when changing customer
  const handleCustomerChange = (cName: string) => {
    if (cName === '__ADD_NEW__') {
      setShowCustomerDrawer(true);
      return;
    }

    setCustomerName(cName);
    const found = customerList.find((c) => c.accountDisplayName === cName || c.legalName === cName);
    if (found) {
      setCustomerBalance(found.balanceFormatted || '₹0.00 Cr');
      setCustomerGstin(found.gstin || found.foreignTaxId || '');
      const taxLine = found.gstin
        ? `\nGSTIN: ${found.gstin}`
        : (found.foreignTaxId ? `\nForeign Tax ID / BN: ${found.foreignTaxId}` : (found.panItTanNo ? `\nTax ID/PAN: ${found.panItTanNo}` : ''));
      const addr = [found.addressLine1, found.addressLine2, found.city, found.state, found.pincode, found.country && found.country !== 'India' ? found.country : '']
        .filter(Boolean)
        .join(', ');
      setBillingAddress(`${addr}${taxLine}`);
      setShippingAddress(`${found.accountDisplayName} ${found.gstin ? `(GSTIN: ${found.gstin})` : ''}\n${addr}`);
      if (found.isForeign || (found.country && found.country !== 'India')) {
        setPlaceOfSupply(found.country ? `Other Territory (96) - Export (${found.country})` : 'Other Territory (96) - Export');
        setPlaceOfSupplyChecked(true);
      } else {
        setPlaceOfSupply(found.state || 'PUNJAB (03)');
      }
    }
  };

  // When a new customer is saved from drawer
  const handleCustomerSaved = async (newCust: SundryDebtorCustomer) => {
    setCustomerList((prev) => [newCust, ...prev]);
    setCustomerName(newCust.accountDisplayName);
    setCustomerGstin(newCust.gstin || newCust.foreignTaxId || '');
    setCustomerBalance(newCust.balanceFormatted || '₹0.00 Cr');
    const taxLine = newCust.gstin
      ? `\nGSTIN: ${newCust.gstin}`
      : (newCust.foreignTaxId ? `\nForeign Tax ID / BN: ${newCust.foreignTaxId}` : (newCust.panItTanNo ? `\nTax ID/PAN: ${newCust.panItTanNo}` : ''));
    const addr = [newCust.addressLine1, newCust.addressLine2, newCust.city, newCust.state, newCust.pincode, newCust.country && newCust.country !== 'India' ? newCust.country : '']
      .filter(Boolean)
      .join(', ');
    setBillingAddress(`${addr}${taxLine}`);
    setShippingAddress(`${newCust.accountDisplayName} ${newCust.gstin ? `(GSTIN: ${newCust.gstin})` : ''}\n${addr}`);
    if (newCust.isForeign || (newCust.country && newCust.country !== 'India')) {
      setPlaceOfSupply(newCust.country ? `Other Territory (96) - Export (${newCust.country})` : 'Other Territory (96) - Export');
      setPlaceOfSupplyChecked(true);
    } else if (newCust.state) {
      setPlaceOfSupply(newCust.state);
    }

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
          description: `Customer added via Finance (${newCust.isForeign ? 'Foreign Client' : 'Domestic Client'})`,
        }),
      });
    } catch (e) {
      console.warn('Note on auto-saving customer to /api/clients:', e);
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
        desc: 'New Service / Deliverable',
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

  // Add more payment row
  const addPaymentRow = () => {
    const unallocated = Math.max(0, grandTotal - totalAmountReceived);
    setPayments((prev) => [
      ...prev,
      {
        id: `pay_${Date.now()}`,
        mode: 'UPI',
        refNo: '',
        depositTo: 'CODEKAP',
        amount: unallocated > 0 ? unallocated : 0,
      },
    ]);
  };

  const removePaymentRow = (id: string) => {
    if (payments.length <= 1) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePaymentRow = (id: string, updates: Partial<PaymentRow>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Calculations
  const subtotalSum = items.reduce((acc, it) => acc + (it.taxableAmount || (it.qty * it.rate)), 0);
  const totalQtySum = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

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

  const discountAfterTaxCalc =
    discountAfterTaxType === 'PERCENTAGE'
      ? Number(((calculatedSubTotal * (Number(discountAfterTaxValue) || 0)) / 100).toFixed(2))
      : Number(discountAfterTaxValue) || 0;

  const unroundedTotal =
    calculatedSubTotal +
    (showServiceCharge ? Number(serviceCharge) || 0 : 0) +
    (showOtherCharges ? Number(otherCharges) || 0 : 0) -
    discountAfterTaxCalc;

  const grandTotal = autoRoundOff ? Math.round(unroundedTotal) : Number(unroundedTotal.toFixed(2));
  const roundOffDifference = Number((grandTotal - unroundedTotal).toFixed(2));

  // Payment totals
  const totalAmountReceived = isPaymentReceived
    ? payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
    : 0;
  const balanceDue = Math.max(0, Number((grandTotal - totalAmountReceived).toFixed(2)));

  // Sync first payment amount with grand total when paid in full
  const handlePayFull = (pId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === pId ? { ...p, amount: grandTotal } : p))
    );
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
    clientGstin: customerGstin?.trim() || null,
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
    roundOff: roundOffDifference,
    totalAmount: grandTotal,
    amountPaid: totalAmountReceived,
    balanceDue: balanceDue,
    currency: 'INR',
    status: isPaymentReceived ? 'RECEIVED' : 'DRAFT',
    paymentMethod: payments[0]?.mode || 'IMPS',
    bankDetailsJson: JSON.stringify(DEFAULT_BANK_DETAILS),
    paymentDetailsJson: isPaymentReceived
      ? JSON.stringify({
          isReceived: true,
          payments,
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
        // Immediately sync to localStorage cache
        try {
          const cached = localStorage.getItem('codekap_cached_invoices');
          let list: InvoiceItem[] = cached ? JSON.parse(cached) : [];
          if (!Array.isArray(list)) list = [];
          const existsIdx = list.findIndex((i) => i.id === savedData.id || i.invoiceNumber === savedData.invoiceNumber);
          if (existsIdx >= 0) {
            list[existsIdx] = savedData;
          } else {
            list.unshift(savedData);
          }
          localStorage.setItem('codekap_cached_invoices', JSON.stringify(list));
        } catch {}

        setStatusMessage({ type: 'success', text: `Invoice ${invoiceNumberFull} saved successfully!` });
        if (onSaved) onSaved(savedData);
        if (andPrint) {
          setShowPreviewModal(true);
        } else {
          setTimeout(() => {
            router.push('/finance/invoices');
          }, 400);
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
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-20 font-sans">
      {/* Editor Content (Hidden when preview/print modal is open) */}
      <div className={showPreviewModal ? 'print:hidden' : ''}>
        {/* Top Header Bar matching Screenshot 1 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <Link
              href="/finance/invoices"
              className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-800">
                {initialInvoice ? 'Edit Sales Invoice' : 'Create Sales Invoice'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                {isPaymentReceived ? 'Received' : 'Draft'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({invoiceNumberFull})
              </span>
            </div>
          </div>

          {/* Right Action Buttons matching Screenshot 1 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomFieldsModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Custom Field</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>More actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 text-xs animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      setShowPreviewModal(true);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      setShowPreviewModal(true);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      setIsInterState(!isInterState);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isInterState ? 'Switch to Intra-State (CGST+SGST)' : 'Switch to Inter-State (IGST)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      setShowCustomerDrawer(true);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-blue-600 font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Customer Info</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                className="p-1.5 hover:bg-slate-50 text-slate-500 border-r border-slate-300"
                title="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-slate-50 text-slate-500"
                title="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Warning Banner (matching Screenshot 1) */}
        <div className="p-3 rounded-xl bg-[#FEF7E0] border border-[#FEEFC3] text-[#7A4B04] text-xs font-medium flex items-center gap-2 shadow-2xs">
          <Info className="w-4 h-4 text-[#E37400] shrink-0" />
          <span>
            If receipt against this invoice was created, then it will be auto unadjusted this invoice from that receipt entry!
          </span>
        </div>

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

        {/* Customer Info Card (matching Screenshot 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800">Customer Info.</h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Customer Dropdown with Pencil Icon */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Customer <span className="text-slate-400 font-normal">({customerBalance})</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerDrawer(true)}
                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                  title="Edit Customer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <div className="relative">
                <select
                  value={customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none appearance-none"
                >
                  {customerList.map((c) => (
                    <option key={c.accountDisplayName} value={c.accountDisplayName}>
                      {c.accountDisplayName}
                    </option>
                  ))}
                  <option value="__ADD_NEW__">+ Add Custom Customer...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Series Name with Pencil Icon */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Series Name</label>
                <Edit2 className="w-3 h-3 text-slate-400" />
              </div>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Invoice Number<span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-14 px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-center text-slate-700"
                />
                <input
                  type="text"
                  value={invoiceNumPart}
                  onChange={(e) => setInvoiceNumPart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Suffix"
                  value={invoiceSuffix}
                  onChange={(e) => setInvoiceSuffix(e.target.value)}
                  className="w-16 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center text-slate-500 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Invoice Date<span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => handleInvoiceDateChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Due Date<span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  min={invoiceDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Book Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Book Name</label>
              <div className="relative">
                <select
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none appearance-none"
                >
                  <option value="Sales Taxable">Sales Taxable</option>
                  <option value="Export Non-GST">Export Non-GST</option>
                  <option value="SEZ Zero-Rated">SEZ Zero-Rated</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Customer GSTIN / PAN */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Customer GSTIN / Tax ID</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="e.g. 03AEQPE9376K2ZY"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Billing Address */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Billing Address</label>
              <textarea
                rows={3}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Enter complete billing address and GSTIN..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:bg-white focus:border-blue-600 focus:outline-none resize-none font-sans"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="posCheckbox"
                  checked={placeOfSupplyChecked}
                  onChange={(e) => setPlaceOfSupplyChecked(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="posCheckbox" className="text-xs text-slate-600 cursor-pointer flex items-center gap-1">
                  <span>Place Of Supply</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </label>
                {placeOfSupplyChecked && (
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    placeholder="e.g. PUNJAB (03)"
                    className="ml-2 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 w-36"
                  />
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Shipping Address</label>
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => setShippingAddress(billingAddress)}
                    className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Copy Billing Address
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomerDrawer(true)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter shipping address (optional)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:bg-white focus:border-blue-600 focus:outline-none resize-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* Custom Fields Card matching Screenshot 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800">Custom Fields</h2>
            <button
              type="button"
              onClick={() => setShowCustomFieldsModal(true)}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Add Custom Fields ▾</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-64">
              <label className="text-xs text-slate-600 block mb-1">Quotation No</label>
              <input
                type="text"
                placeholder="Enter Quotation No"
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="transporterCheck"
                checked={transporterDetails}
                onChange={(e) => setTransporterDetails(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="transporterCheck" className="text-xs text-slate-700 cursor-pointer">
                Transporter Details
              </label>
            </div>
          </div>

          {transporterDetails && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 animate-fade-in text-xs">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Transporter Name</label>
                <input
                  type="text"
                  value={transporterInfo.transporterName}
                  onChange={(e) => setTransporterInfo({ ...transporterInfo, transporterName: e.target.value })}
                  placeholder="e.g. VRL Logistics"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Transporter ID</label>
                <input
                  type="text"
                  value={transporterInfo.transporterId}
                  onChange={(e) => setTransporterInfo({ ...transporterInfo, transporterId: e.target.value })}
                  placeholder="e.g. 03AAAAA0000A1Z5"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Doc / Challan No.</label>
                <input
                  type="text"
                  value={transporterInfo.docNo}
                  onChange={(e) => setTransporterInfo({ ...transporterInfo, docNo: e.target.value })}
                  placeholder="e.g. DC-1094"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={transporterInfo.vehicleNo}
                  onChange={(e) => setTransporterInfo({ ...transporterInfo, vehicleNo: e.target.value })}
                  placeholder="e.g. PB65AB1234"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                />
              </div>
            </div>
          )}
        </div>

        {/* Goods / Service Items Table matching Screenshot 1 & 2 */}
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

                    {/* Service Name with preset dropdown & pencil icon */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={item.desc}
                            onChange={(e) => updateRow(idx, { desc: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
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
                                  rate: found.defaultRate,
                                  unit: found.unit,
                                });
                              }
                            }}
                            className="w-5 h-7 opacity-0 absolute inset-0 cursor-pointer"
                            title="Pick from standard catalog"
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
                        className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* QTY & Unit underneath matching Screenshot 1 */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateRow(idx, { qty: Number(e.target.value) || 1 })}
                          className="w-16 text-center px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                          {item.unit || 'MTH'}
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
                          <option value="18">18%</option>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
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
                        title="Line item deliverables & notes"
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

          {/* Table Footer: Add Row & Subtotal matching Screenshot 2 */}
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

        {/* Bottom 3-Column Layout matching Screenshot 2 & 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Special Notes & Attach Document (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Special Notes Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Special Notes</h3>
                  <span className="text-[11px] text-slate-400">Write Notes or Instructions</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold font-mono">1000</span>
              </div>
              <textarea
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Type here your special notes for this invoice."
                maxLength={1000}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Attach Document Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Attach Document (Optional)</h3>
              <div className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/40">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-blue-600 block">Click to upload</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  JPEG, PDF, DOC, DOCX, PNG, or JPG & Size up to 2MB
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addDetailsCheck"
                  checked={wantAdditionalDetails}
                  onChange={(e) => setWantAdditionalDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="addDetailsCheck" className="text-xs text-slate-600 cursor-pointer">
                  Want to add Additional Details
                </label>
              </div>
            </div>
          </div>

          {/* Center Column: Bank Details & Payment Received (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Bank Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bank Details (Printed on Invoice)</span>
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

            {/* Is Payment Received Card matching Screenshot 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isPaymentReceived}
                  onChange={(e) => setIsPaymentReceived(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Is Payment Received?</span>
              </label>

              {isPaymentReceived && (
                <div className="space-y-3 pt-1 text-xs">
                  {payments.map((p, pIdx) => (
                    <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Payment Mode</label>
                          <div className="relative">
                            <select
                              value={p.mode}
                              onChange={(e) => updatePaymentRow(p.id, { mode: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none appearance-none"
                            >
                              <option value="IMPS">IMPS</option>
                              <option value="UPI">UPI</option>
                              <option value="NEFT">NEFT</option>
                              <option value="RTGS">RTGS</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Cash">Cash</option>
                              <option value="Net Banking">Net Banking</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Ref. No.</label>
                          <input
                            type="text"
                            value={p.refNo}
                            onChange={(e) => updatePaymentRow(p.id, { refNo: e.target.value })}
                            placeholder="AD/0102"
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Deposit to</label>
                          <div className="relative">
                            <select
                              value={p.depositTo}
                              onChange={(e) => updatePaymentRow(p.id, { depositTo: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 focus:outline-none appearance-none"
                            >
                              <option value="CODEKAP">CODEKAP</option>
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="Cash in Hand">Cash in Hand</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-semibold text-slate-600">Amount (₹)</label>
                            <button
                              type="button"
                              onClick={() => handlePayFull(p.id)}
                              className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 hover:underline"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Pay full</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={p.amount}
                              onChange={(e) => updatePaymentRow(p.id, { amount: Number(e.target.value) || 0 })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
                            />
                            {payments.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePaymentRow(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPaymentRow}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add More Payment</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Summary Card matching Screenshot 2 & 3 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold text-slate-800">Summary</h2>

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
                      {formatINRPlain(discountAmountCalc)}
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

                {/* IGST or CGST/SGST */}
                {isInterState ? (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>IGST</span>
                    <span className="font-mono font-semibold">₹{formatINRPlain(igstAmt)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>SGST</span>
                      <span className="font-mono font-semibold">₹{formatINRPlain(sgstAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>CGST</span>
                      <span className="font-mono font-semibold">₹{formatINRPlain(cgstAmt)}</span>
                    </div>
                  </>
                )}

                {/* Sub Total */}
                <div className="flex items-center justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                  <span>Sub Total</span>
                  <span className="font-mono">₹{formatINRPlain(calculatedSubTotal)}</span>
                </div>

                {/* Add another charges */}
                {showOtherCharges ? (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-[11px]">Other Charges</span>
                    <input
                      type="number"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                      className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOtherCharges(true)}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add another charges</span>
                  </button>
                )}

                {/* Discount After Tax */}
                <div className="flex items-center justify-between pt-1">
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
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="checkbox"
                    id="roundOffCheck"
                    checked={autoRoundOff}
                    onChange={(e) => setAutoRoundOff(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="roundOffCheck" className="text-xs text-slate-700 cursor-pointer">
                    Auto Round Off
                  </label>
                </div>

                {/* Total Amount matching Screenshot 3 */}
                <div className="flex items-center justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="font-mono text-base font-bold">₹{formatINRPlain(grandTotal)}</span>
                </div>

                {/* Amount Received */}
                <div className="flex items-center justify-between text-slate-700">
                  <span>Amount Received</span>
                  <span className="font-mono font-semibold">₹{formatINRPlain(totalAmountReceived)}</span>
                </div>

                {/* Balance Amount */}
                <div className="flex items-center justify-between text-slate-700 font-semibold pb-1">
                  <span>Balance Amount</span>
                  <span className={`font-mono ${balanceDue > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    ₹{formatINRPlain(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions matching Screenshot 3 */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => (onCancel ? onCancel() : router.push('/finance/invoices'))}
            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveInvoice(false)}
            className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Sticky Bottom Shortcuts Bar matching Screenshot 3 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-6 z-30 shadow-lg text-[10px] text-slate-600 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Shortcuts:</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + S</kbd> Save</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">ALT + P</kbd> Print</span>
            <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold">CTRL + SHIFT + L</kbd> Download Invoice</span>
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
        }}
      />

      {/* Custom Fields Modal */}
      <CustomFieldsModal
        isOpen={showCustomFieldsModal}
        onClose={() => setShowCustomFieldsModal(false)}
        customFields={customFieldsList}
        onSave={(fields) => setCustomFieldsList(fields)}
      />

      {/* Item Tune Modal (Row details / Deliverables) */}
      <ItemTuneModal
        isOpen={showItemTuneModal}
        onClose={() => setShowItemTuneModal(false)}
        item={items[tuneItemIndex] || null}
        rowIndex={tuneItemIndex}
        onSave={(idx, updates) => updateRow(idx, updates)}
      />
      </div>

      {/* Tax Invoice Fullscreen Preview & Print Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 animate-fade-in flex flex-col items-center print:static print:bg-white print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:backdrop-blur-none">
          <div className="max-w-4xl w-full print:max-w-none print:w-full print:m-0 print:p-0">
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
