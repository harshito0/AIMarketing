'use client';

import React from 'react';
import { QuotationItem, QuotationLineItem } from '@/lib/types';
import { formatINR, formatINRPlain, numberToIndianWords } from '@/lib/invoice-utils';
import { Printer, X } from 'lucide-react';

interface QuotationViewProps {
  quotation: QuotationItem;
  onClose?: () => void;
}

export function QuotationView({ quotation, onClose }: QuotationViewProps) {
  const items: QuotationLineItem[] = React.useMemo(() => {
    try {
      return JSON.parse(quotation.itemsJson || '[]');
    } catch {
      return [];
    }
  }, [quotation.itemsJson]);

  const bankDetails = React.useMemo(() => {
    try {
      if (quotation.bankDetails) {
        return JSON.parse(quotation.bankDetails);
      }
    } catch {}
    return {
      bankName: 'HDFC Bank Ltd',
      accountNo: '50200112201868',
      ifscCode: 'HDFC0002684',
    };
  }, [quotation.bankDetails]);

  const termsList = React.useMemo(() => {
    if (quotation.terms) {
      return quotation.terms.split('\n').filter((t) => t.trim().length > 0);
    }
    return [
      '1. Monthly services are billed in advance per cycle.',
      '2. CGI/Walkthrough charges are payable in advance before execution.',
      '3. Ad budget is to be paid directly by the client to ad platforms.',
      '4. 50% advance on monthly package, remaining 50% before cycle completion.',
      '5. Client must provide required content/references timely to avoid delay.',
      '6. Reports & reviews will be shared weekly.',
    ];
  }, [quotation.terms]);

  const totalQty = items.reduce((acc, it) => acc + (it.qty || 1), 0);
  const totalDiscount = items.reduce((acc, it) => acc + (it.discountAmount || 0), 0) + (quotation.discountBeforeTax || 0);
  const totalTax = quotation.taxAmount || items.reduce((acc, it) => acc + (it.gstAmount || 0), 0);
  const totalCess = items.reduce((acc, it) => acc + (it.cessAmount || 0), 0);
  const taxableAmt = quotation.taxableAmount || quotation.subtotal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 mb-6 rounded-2xl flex items-center justify-between shadow-xl text-white">
        <div className="flex items-center gap-3">
          <img
            src="/images/codekap-logo.png"
            alt="CodeKap"
            className="w-8 h-8 object-contain rounded-lg shrink-0"
          />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quotation / Estimation Preview — {quotation.quotationNumber}
            </h4>
            <p className="text-[11px] text-slate-400">
              {quotation.clientName} • {formatINR(quotation.totalAmount)}
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

      {/* Actual A4 Printable Quotation Sheet */}
      <div
        id="quotation-sheet"
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

        {/* Content Container */}
        <div className="relative z-10 space-y-3.5 text-[11px] leading-relaxed">
          {/* Top Title: Quotation / Estimation */}
          <div className="text-center pb-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Quotation / Estimation
            </h1>
          </div>

          {/* Company Details Box */}
          <div className="border border-slate-900 p-3 flex items-start gap-4">
            {/* Official CodeKap Logo */}
            <img
              src="/images/codekap-logo.png"
              alt="CodeKap"
              className="w-14 h-14 object-contain shrink-0"
            />
            <div className="space-y-0.5">
              <h2 className="text-xs font-black uppercase tracking-tight text-slate-900">
                CODEKAPS DIGITAL INNOVATIONS PRIVATE LIMITED
              </h2>
              <p className="text-[10px] text-slate-800 font-bold font-mono">
                GSTIN: 03AAMCC6345B1Z0
              </p>
              <p className="text-[10px] text-slate-700">
                Email: info@codekap.in
              </p>
              <p className="text-[10px] text-slate-700">
                Phone no.: 7528835379 / 917528835379
              </p>
            </div>
          </div>

          {/* Quotation Meta Grid */}
          <div className="grid grid-cols-3 border border-slate-900 divide-x divide-slate-900 text-center text-[10px] py-2 bg-slate-50/40">
            <div>
              <span className="font-bold text-slate-700">Quotation No.: </span>
              <span className="font-black font-mono text-slate-900">{quotation.quotationNumber}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Quotation Date: </span>
              <span className="font-bold text-slate-900">{quotation.date}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Valid Till: </span>
              <span className="font-bold text-slate-900">{quotation.validUntil || '—'}</span>
            </div>
          </div>

          {/* Bill to */}
          <div className="border border-slate-900 p-3 bg-slate-50/30 text-[11px]">
            <span className="font-bold text-slate-700 block mb-0.5">Bill to:</span>
            <div className="font-extrabold text-slate-900">{quotation.clientName}</div>
            <div className="text-slate-700 whitespace-pre-line mt-0.5 text-[10px]">
              {quotation.billingAddress || 'JD lead CHANDIGARH,\nState: 04-CHANDIGARH Country: India'}
            </div>
          </div>

          {/* Items Table (Matching PDF format) */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-8">Sr no.</th>
                  <th className="py-2 px-3 border-r border-slate-900">Product/Service</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-16">HSN/SAC</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-10">MRP</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-center w-12">Qty</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-18">Rate(₹)</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-16">Discount</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-18">GST</th>
                  <th className="py-2 px-2 border-r border-slate-900 text-right w-12">CESS</th>
                  <th className="py-2 px-3 text-right w-22">Amount(₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {items.map((item, idx) => (
                  <tr key={idx} className="align-top hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 border-r border-slate-900 text-center font-bold">
                      {item.srNo || idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-900">
                      <div className="font-extrabold text-slate-900">{item.desc}</div>
                      {item.deliverables && item.deliverables.length > 0 && (
                        <div className="text-[9.5px] text-slate-600 mt-1 leading-snug">
                          {item.deliverables.map((del, dIdx) => (
                            <p key={dIdx}>{del}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono text-[9px]">
                      {item.hsn || '998314'}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-center text-slate-400">
                      {item.mrp ? formatINRPlain(item.mrp) : ''}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-center font-medium">
                      <div>{item.qty}</div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase">{item.unit || 'NOS'}</div>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-right font-medium">
                      {formatINRPlain(item.rate)}
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-right text-slate-600">
                      <div>{formatINRPlain(item.discountAmount || 0)}</div>
                      <div className="text-[8px] text-slate-400">({item.discountPercent || 0}%)</div>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-right text-slate-700">
                      <div>{formatINRPlain(item.gstAmount || 0)}</div>
                      <div className="text-[8px] text-slate-500">({item.gstRate || 0}%)</div>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-900 text-right text-slate-600">
                      <div>{formatINRPlain(item.cessAmount || 0)}</div>
                      <div className="text-[8px] text-slate-400">({item.cessRate || 0}%)</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatINRPlain(item.totalAmount)}
                    </td>
                  </tr>
                ))}

                {/* TOTAL Row */}
                <tr className="bg-slate-100/90 font-bold text-[10px] border-t-2 border-slate-900">
                  <td colSpan={4} className="py-2 px-3 border-r border-slate-900 text-left font-black uppercase">
                    TOTAL
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-black">
                    {totalQty}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right"></td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right">
                    {formatINRPlain(totalDiscount)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-black">
                    {formatINRPlain(totalTax)}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right">
                    {formatINRPlain(totalCess)}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-slate-950">
                    {formatINRPlain(quotation.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Middle: Bank Details on Left + Totals on Right */}
          <div className="grid grid-cols-12 border border-slate-900">
            {/* Left: Bank Details */}
            <div className="col-span-6 p-3 border-r border-slate-900 space-y-1 text-[10px]">
              <span className="font-bold text-slate-900 block mb-0.5">Bank Details</span>
              <div className="text-slate-800">
                <span className="font-medium">Bank Name: </span>
                <span className="font-bold">{bankDetails.bankName || 'HDFC Bank Ltd'}</span>
              </div>
              <div className="text-slate-800">
                <span className="font-medium">A/C No: </span>
                <span className="font-mono font-bold">{bankDetails.accountNo || '50200112201868'}</span>
              </div>
              <div className="text-slate-800">
                <span className="font-medium">IFSC Code: </span>
                <span className="font-mono font-bold">{bankDetails.ifscCode || 'HDFC0002684'}</span>
              </div>
            </div>

            {/* Right: Taxable Amt & Total Amount */}
            <div className="col-span-6 p-3 space-y-1.5 text-[11px] flex flex-col justify-center">
              <div className="flex justify-between text-slate-700">
                <span className="font-bold">Taxable Amt</span>
                <span className="font-bold font-mono">{formatINRPlain(taxableAmt)}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-black text-xs pt-1.5 border-t border-slate-900">
                <span>Total Amount(₹)</span>
                <span className="font-mono">{formatINRPlain(quotation.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions + Signature */}
          <div className="grid grid-cols-12 border border-slate-900">
            {/* Terms & Conditions (Left 8 cols) */}
            <div className="col-span-8 p-3 border-r border-slate-900 space-y-1 text-[9.5px] text-slate-800">
              <span className="font-bold text-slate-900 text-[10px] block mb-1">
                Terms & Conditions:
              </span>
              {termsList.map((term, tIdx) => (
                <p key={tIdx} className="leading-tight">
                  {term}
                </p>
              ))}
            </div>

            {/* Signature Block (Right 4 cols) */}
            <div className="col-span-4 p-3 flex flex-col justify-between text-right text-[10px]">
              <div>
                <span className="font-medium text-slate-600 block text-[9px]">For,</span>
                <span className="font-black text-slate-900 text-[10px] uppercase leading-tight block">
                  CODEKAPS DIGITAL INNOVATIONS PRIVATE LIMITED
                </span>
              </div>

              {/* Handcrafted Digital Signature */}
              <div className="my-2 flex flex-col items-end">
                <span className="font-serif italic text-2xl font-bold tracking-wider text-slate-800 -rotate-2 select-none">
                  Aman Kapoor
                </span>
                <span className="text-[9px] text-slate-500 font-medium">Authorized Signatory</span>
              </div>

              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500">
                Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
