'use client';

import React from 'react';
import { InvoiceItem, InvoiceLineItem, InvoiceBankDetails } from '@/lib/types';
import { formatINR, formatINRPlain, numberToIndianWords } from '@/lib/invoice-utils';
import { Printer, Download, X, Check, ShieldCheck, Building2, Phone, Mail } from 'lucide-react';

interface TaxInvoiceViewProps {
  invoice: InvoiceItem;
  onClose?: () => void;
}

export function TaxInvoiceView({ invoice, onClose }: TaxInvoiceViewProps) {
  const items: InvoiceLineItem[] = React.useMemo(() => {
    try {
      return JSON.parse(invoice.itemsJson || '[]');
    } catch {
      return [];
    }
  }, [invoice.itemsJson]);

  const bankDetails: InvoiceBankDetails = React.useMemo(() => {
    try {
      if (invoice.bankDetailsJson) {
        return JSON.parse(invoice.bankDetailsJson);
      }
    } catch {}
    return {
      accountHolderName: 'CODEKAPS DIGITAL INNOVATIONS PVT LTD',
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200112201868',
      ifscCode: 'HDFC0002684',
      branch: 'Mohali, Punjab',
      outstandingAmount: 0.0,
    };
  }, [invoice.bankDetailsJson]);

  const paymentDetails = React.useMemo(() => {
    try {
      if (invoice.paymentDetailsJson) {
        return JSON.parse(invoice.paymentDetailsJson);
      }
    } catch {}
    return null;
  }, [invoice.paymentDetailsJson]);

  const totalDiscount = items.reduce((acc, it) => acc + (it.discountAmount || 0), 0) + (invoice.discountAmount || 0);
  const totalTaxable = invoice.taxableAmount || invoice.subtotal;
  const totalTax = (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0);
  const amountInWords = numberToIndianWords(invoice.totalAmount);

  // Group items by HSN for GST summary table
  const hsnMap: Record<string, { taxable: number; igstRate: number; igstAmt: number; cgstRate: number; cgstAmt: number; sgstRate: number; sgstAmt: number }> = {};
  items.forEach((it) => {
    const code = it.hsn || '998314';
    if (!hsnMap[code]) {
      hsnMap[code] = { taxable: 0, igstRate: 0, igstAmt: 0, cgstRate: 0, cgstAmt: 0, sgstRate: 0, sgstAmt: 0 };
    }
    const taxRow = it.taxableAmount || (it.qty * it.rate);
    hsnMap[code].taxable += taxRow;

    if ((invoice.igst || 0) > 0 || ((invoice.cgst || 0) === 0 && (invoice.sgst || 0) === 0 && it.gstRate > 0)) {
      hsnMap[code].igstRate = it.gstRate || 18;
      hsnMap[code].igstAmt += it.gstAmount || Number(((taxRow * hsnMap[code].igstRate) / 100).toFixed(2));
    } else if ((invoice.cgst || 0) > 0 || (invoice.sgst || 0) > 0) {
      hsnMap[code].cgstRate = (it.gstRate || 18) / 2;
      hsnMap[code].sgstRate = (it.gstRate || 18) / 2;
      hsnMap[code].cgstAmt += Number(((taxRow * hsnMap[code].cgstRate) / 100).toFixed(2));
      hsnMap[code].sgstAmt += Number(((taxRow * hsnMap[code].sgstRate) / 100).toFixed(2));
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative">
      {/* Action Bar (Hidden in Print) */}
      <div className="print:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 mb-6 rounded-2xl flex items-center justify-between shadow-xl text-white">
        <div className="flex items-center gap-3">
          <img
            src="/images/codekap-logo.png"
            alt="CodeKap"
            className="w-8 h-8 object-contain rounded-lg shrink-0"
          />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tax Invoice Preview — {invoice.invoiceNumber}
            </h4>
            <p className="text-[11px] text-slate-400">
              {invoice.clientName} • {formatINR(invoice.totalAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Actual A4 Printable Invoice Sheet */}
      <div
        id="tax-invoice-sheet"
        className="relative bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm max-w-[850px] mx-auto p-8 font-sans print:shadow-none print:border-none print:m-0 print:p-6 print:max-w-none print:w-full overflow-hidden"
      >
        {/* ============================================================== */}
        {/* PREMIUM WATERMARK LOGO IN BACKGROUND (User's audio requirement) */}
        {/* ============================================================== */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-0 overflow-hidden">
          <div className="relative opacity-[0.06] print:opacity-[0.07] flex flex-col items-center justify-center">
            {/* Elegant Official CodeKap Brand Watermark Logo */}
            <img
              src="/images/codekap-logo.png"
              alt="CodeKap"
              className="w-72 h-72 object-contain select-none"
            />
            <span className="text-3xl font-black uppercase tracking-[0.35em] text-slate-900 mt-4 select-none">
              CODEKAP
            </span>
            <span className="text-xs font-bold tracking-[0.4em] uppercase text-slate-700 mt-1 select-none">
              Digital Innovations Pvt Ltd
            </span>
          </div>
        </div>

        {/* Content Container (Layered above watermark) */}
        <div className="relative z-10 space-y-4 text-[12px] leading-relaxed">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">Tax Invoice</h1>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="w-3.5 h-3.5 border border-slate-900 rounded-xs flex items-center justify-center bg-slate-900 text-white text-[10px]">
                ✓
              </span>
              <span>Original</span>
            </div>
          </div>

          {/* Company Details & Invoice Meta Table */}
          <div className="grid grid-cols-12 border border-slate-900">
            {/* Left: CodeKap Company Identity */}
            <div className="col-span-7 p-3 border-r border-slate-900 flex items-start gap-3">
              {/* Official CodeKap Logo */}
              <img
                src="/images/codekap-logo.png"
                alt="CodeKap"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="space-y-0.5">
                <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight">
                  CODEKAPS DIGITAL INNOVATIONS PRIVATE LIMITED
                </h2>
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold">Email:</span> info@codekap.in
                </p>
                <p className="text-[11px] text-slate-700">
                  <span className="font-semibold">Phone no.:</span> 7528835379 / 917528835379
                </p>
                <p className="text-[11px] text-slate-900 font-bold font-mono">
                  <span>GSTIN: </span>03AAMCC6345B1Z0
                </p>
              </div>
            </div>

            {/* Right: Invoice Meta Grid */}
            <div className="col-span-5 grid grid-cols-3 divide-x divide-slate-900 text-center text-[11px]">
              <div className="p-2 flex flex-col justify-center">
                <span className="font-bold text-slate-600 block mb-0.5">Invoice Number</span>
                <span className="font-black text-slate-900 font-mono text-xs">{invoice.invoiceNumber}</span>
              </div>
              <div className="p-2 flex flex-col justify-center">
                <span className="font-bold text-slate-600 block mb-0.5">Invoice Date</span>
                <span className="font-bold text-slate-900">{invoice.date}</span>
              </div>
              <div className="p-2 flex flex-col justify-center">
                <span className="font-bold text-slate-600 block mb-0.5">Due date</span>
                <span className="font-bold text-slate-900">{invoice.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Buyer (Bill to) */}
          <div className="border border-slate-900 p-3 bg-slate-50/50">
            <span className="font-black uppercase text-[11px] text-slate-600 block mb-1">
              Buyer (Bill to):
            </span>
            <div className="font-extrabold text-sm text-slate-900">{invoice.clientName}</div>
            <div className="text-[11px] text-slate-700 whitespace-pre-line mt-0.5">
              {invoice.billingAddress || 'Corporate Office, Client Facility'}
            </div>
            {invoice.clientGstin && (
              <div className="text-[11px] font-bold font-mono text-slate-800 mt-1">
                GSTIN: {invoice.clientGstin}
              </div>
            )}
            {invoice.placeOfSupply && (
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Place of Supply: {invoice.placeOfSupply}
              </div>
            )}
          </div>

          {/* Goods & Services Table (Golden Accent as in PDF) */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6c344] text-slate-950 font-bold border-b border-slate-900 text-[11px]">
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-8">Sr no.</th>
                  <th className="py-2 px-3 border-r border-slate-900">Product/Service</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-16">HSN/SAC</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-14">Qty</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-16">Rate</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-16">Discount</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-20">Taxable Amt</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-16">Tax</th>
                  <th className="py-2 px-3 text-right w-20">Total(₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                {items.map((item, idx) => (
                  <tr key={idx} className="align-top hover:bg-slate-50/50">
                    <td className="py-2 px-2 border-r border-slate-900 text-center font-bold">
                      {item.srNo || idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-900">
                      <div className="font-extrabold text-slate-900">{item.desc}</div>
                      {item.deliverables && item.deliverables.length > 0 && (
                        <ul className="list-disc list-inside text-[10px] text-slate-600 mt-1 space-y-0.5">
                          {item.deliverables.map((del, dIdx) => (
                            <li key={dIdx} className="leading-tight">
                              {del}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-center font-mono text-[10px]">
                      {item.hsn || '998314'}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-center font-medium">
                      <div>{item.qty}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{item.unit || 'MTH'}</div>
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-right font-medium">
                      {formatINRPlain(item.rate)}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-right text-slate-600">
                      <div>{formatINRPlain(item.discountAmount || 0)}</div>
                      <div className="text-[9px] text-slate-400">({item.discountPercent || 0}%)</div>
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-right font-medium">
                      {formatINRPlain(item.taxableAmount || (item.qty * item.rate))}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-900 text-right text-slate-700">
                      <div>{formatINRPlain(item.gstAmount || 0)}</div>
                      <div className="text-[9px] text-slate-500">({item.gstRate || 0}%)</div>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatINRPlain(item.totalAmount)}
                    </td>
                  </tr>
                ))}

                {/* Sub Total Row */}
                <tr className="bg-slate-100/80 font-bold text-[11px] border-t-2 border-slate-900">
                  <td colSpan={3} className="py-2 px-3 border-r border-slate-900 text-left font-black uppercase">
                    Sub Total
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-black">
                    {items.reduce((acc, it) => acc + (it.qty || 1), 0)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right"></td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right">
                    {formatINRPlain(totalDiscount)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-black">
                    {formatINRPlain(totalTaxable)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-black">
                    {formatINRPlain(totalTax)}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-slate-950">
                    {formatINRPlain(invoice.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Middle Section: Bank Details on Left + Totals Summary on Right */}
          <div className="grid grid-cols-12 border border-slate-900">
            {/* Left Column: Bank Details */}
            <div className="col-span-7 p-3 border-r border-slate-900 space-y-1 text-[11px]">
              <span className="font-black uppercase text-slate-900 block mb-1">Bank Details</span>
              <div className="text-slate-800">
                <span className="font-bold">A/C Holder Name: </span>
                {bankDetails.accountHolderName}
              </div>
              <div className="text-slate-800">
                <span className="font-bold">Bank Name: </span>
                {bankDetails.bankName}
              </div>
              <div className="text-slate-800">
                <span className="font-bold">A/C No: </span>
                <span className="font-mono font-bold">{bankDetails.accountNo}</span>
              </div>
              <div className="text-slate-800">
                <span className="font-bold">IFSC Code: </span>
                <span className="font-mono font-bold">{bankDetails.ifscCode}</span>
              </div>
              <div className="text-slate-600 pt-1 text-[10px] flex items-center justify-between border-t border-slate-200 mt-1">
                <span>Outstanding Amt:</span>
                <span className="font-bold font-mono">₹0.00 Cr</span>
              </div>
            </div>

            {/* Right Column: Amount Summary */}
            <div className="col-span-5 p-3 space-y-1.5 text-[11px] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Taxable Amt:</span>
                  <span className="font-bold font-mono">{formatINRPlain(totalTaxable)}</span>
                </div>
                <div className="flex justify-between text-slate-950 font-black text-xs pt-1 border-t border-slate-300">
                  <span>Total Amount(₹):</span>
                  <span className="font-mono">{formatINRPlain(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Received Amount(₹):</span>
                  <span className="font-mono">{formatINRPlain(invoice.amountPaid || invoice.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Amount in Words</span>
                <p className="font-black text-slate-900 text-[11px] italic leading-tight mt-0.5">
                  {amountInWords}
                </p>
              </div>
            </div>
          </div>

          {/* GST Summary Table (Golden Header) */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-center border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#f6c344] text-slate-950 font-bold border-b border-slate-900">
                  <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-900 text-left">HSN/SAC</th>
                  <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-900 text-right">Taxable Amt(₹)</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900 border-b border-slate-900">IGST</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900 border-b border-slate-900">CGST</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900 border-b border-slate-900">SGST</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-slate-900 border-b border-slate-900">CESS</th>
                  <th rowSpan={2} className="py-1.5 px-2 text-right">Total Tax Amt(₹)</th>
                </tr>
                <tr className="bg-[#f6c344] text-slate-950 font-bold text-[9px] border-b border-slate-900">
                  <th className="py-1 px-1 border-r border-slate-900">Rate</th>
                  <th className="py-1 px-1 border-r border-slate-900 text-right">Amount(₹)</th>
                  <th className="py-1 px-1 border-r border-slate-900">Rate</th>
                  <th className="py-1 px-1 border-r border-slate-900 text-right">Amount(₹)</th>
                  <th className="py-1 px-1 border-r border-slate-900">Rate</th>
                  <th className="py-1 px-1 border-r border-slate-900 text-right">Amount(₹)</th>
                  <th className="py-1 px-1 border-r border-slate-900">Rate</th>
                  <th className="py-1 px-1 border-r border-slate-900 text-right">Amount(₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {Object.entries(hsnMap).map(([code, vals], hIdx) => {
                  const rowTaxTotal = vals.igstAmt + vals.cgstAmt + vals.sgstAmt;
                  return (
                    <tr key={hIdx}>
                      <td className="py-1.5 px-2 border-r border-slate-900 text-left font-mono font-bold">{code}</td>
                      <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">{formatINRPlain(vals.taxable)}</td>
                      <td className="py-1.5 px-1 border-r border-slate-900">{vals.igstRate}%</td>
                      <td className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(vals.igstAmt)}</td>
                      <td className="py-1.5 px-1 border-r border-slate-900">{vals.cgstRate}%</td>
                      <td className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(vals.cgstAmt)}</td>
                      <td className="py-1.5 px-1 border-r border-slate-900">{vals.sgstRate}%</td>
                      <td className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(vals.sgstAmt)}</td>
                      <td className="py-1.5 px-1 border-r border-slate-900">0%</td>
                      <td className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">0.00</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold">{formatINRPlain(rowTaxTotal)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td className="py-1.5 px-2 border-r border-slate-900 text-left uppercase">Total(₹)</td>
                  <td className="py-1.5 px-2 border-r border-slate-900 text-right font-mono">{formatINRPlain(totalTaxable)}</td>
                  <td colSpan={2} className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(invoice.igst || 0)}</td>
                  <td colSpan={2} className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(invoice.cgst || 0)}</td>
                  <td colSpan={2} className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">{formatINRPlain(invoice.sgst || 0)}</td>
                  <td colSpan={2} className="py-1.5 px-1 border-r border-slate-900 text-right font-mono">0.00</td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-950">{formatINRPlain(totalTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Conditions on Left + Authorized Signatory on Right */}
          <div className="grid grid-cols-12 border border-slate-900">
            {/* Terms & Conditions */}
            <div className="col-span-8 p-3 border-r border-slate-900 space-y-1 text-[10px] text-slate-700">
              <span className="font-black uppercase text-slate-900 text-[11px] block mb-1">
                Terms & Conditions:
              </span>
              <p>• Scope of Work: Services delivered as per the agreed scope, proposal, or service agreement.</p>
              <p>• Invoice Validity: This invoice is valid for 15 days from the date of issue unless otherwise stated.</p>
              <p>• Nature of Supply: This is a B2B service transaction. No physical goods are delivered.</p>
              <p>• GST: Currently registered under GST: 03AAMCC6345B1Z0. Applicable taxes charged above.</p>
              <p>• Currency: All amounts are quoted and payable in INR (₹), unless specified otherwise.</p>
            </div>

            {/* Signature Block */}
            <div className="col-span-4 p-3 flex flex-col justify-between text-right text-[11px]">
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">For,</span>
                <span className="font-black text-slate-900 text-[11px] uppercase leading-tight block">
                  CODEKAPS DIGITAL INNOVATIONS PRIVATE LIMITED
                </span>
              </div>

              {/* Handcrafted Digital Signature */}
              <div className="my-2 flex flex-col items-end">
                <span className="font-serif italic text-2xl font-bold tracking-wider text-slate-800 -rotate-2 select-none">
                  Aman Kapoor
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Authorized Signatory</span>
              </div>

              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Signature
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-200 italic">
            This is a computer generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
}
