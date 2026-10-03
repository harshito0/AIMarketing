import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { DEFAULT_BANK_DETAILS } from '@/lib/bank-details';

const DEFAULT_TERMS = `Scope of Work: Services delivered as per the agreed scope, proposal, or service agreement.
Invoice Validity: This invoice is valid for 15 days from the date of issue unless otherwise stated.
Nature of Supply: This is a B2B service transaction. No physical goods are delivered.
GST: GST charged as applicable or exempt export.
Currency: All amounts are quoted and payable in INR (₹), unless specified otherwise.`;

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    const { searchParams } = new URL(req.url);
    if (searchParams.get('nextNumber') === 'true') {
      const allInvoices = await prisma.invoice.findMany({
        select: { invoiceNumber: true },
      });
      let maxNum = 0;
      for (const inv of allInvoices) {
        const match = inv.invoiceNumber.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      const nextNumPart = String(maxNum + 1).padStart(4, '0');
      return NextResponse.json(
        {
          prefix: 'INV',
          nextNumPart,
          suffix: '',
          nextInvoiceNumber: `INV${nextNumPart}`,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    let invoices: any[] = [];
    try {
      invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.warn('[Invoices GET retry]:', dbErr);
      await new Promise((r) => setTimeout(r, 200));
      invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(invoices, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('[Invoices GET Error]:', error);
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();

    const {
      clientName,
      clientGstin,
      billingAddress,
      shippingAddress,
      seriesName = 'Sales Invoice',
      invoicePrefix = 'INV',
      invoiceNumber: customInvoiceNumber,
      invoiceSuffix = '',
      bookName = 'Sales Taxable',
      quotationNo = '',
      placeOfSupply = '',
      date,
      dueDate,
      items = [],
      isInterState = true,
      rateType = 'EXCLUSIVE_GST',
      discountType = 'PERCENTAGE',
      discountValue = 0,
      discountAmount = 0,
      serviceCharge = 0,
      otherCharges = 0,
      roundOff = 0,
      bankDetails = DEFAULT_BANK_DETAILS,
      paymentDetails = null,
      notes = '',
      terms = DEFAULT_TERMS,
      status = 'DRAFT',
    } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }

    // Determine invoice number safely avoiding unique collisions
    const allInvoices = await prisma.invoice.findMany({ select: { invoiceNumber: true } });
    let maxNum = 0;
    for (const inv of allInvoices) {
      const match = inv.invoiceNumber.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextAutoNum = `${invoicePrefix}${String(maxNum + 1).padStart(4, '0')}${invoiceSuffix}`;

    let finalInvNumber = customInvoiceNumber ? customInvoiceNumber.trim() : '';
    if (finalInvNumber) {
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNumber: finalInvNumber },
      });
      if (existing) {
        finalInvNumber = nextAutoNum;
      }
    } else {
      finalInvNumber = nextAutoNum;
    }

    // Calculate subtotal, taxable, and taxes
    let subtotal = 0;
    const computedItems = items.map((it: any, idx: number) => {
      const qty = Number(it.qty) || 1;
      const rate = Number(it.rate) || 0;
      const gstRate = Number(it.gstRate) || 0;
      let taxable = qty * rate;

      if (it.rateType === 'INCLUSIVE_GST' && gstRate > 0) {
        taxable = Number(((qty * rate) / (1 + gstRate / 100)).toFixed(2));
      }

      const rowTax = Number(((taxable * gstRate) / 100).toFixed(2));
      const total = Number((taxable + rowTax).toFixed(2));

      subtotal += taxable;

      return {
        srNo: idx + 1,
        desc: it.desc || 'Service Item',
        deliverables: it.deliverables || [],
        hsn: it.hsn || '998314',
        qty,
        unit: it.unit || 'MTH',
        rate,
        rateType: it.rateType || rateType,
        discountPercent: Number(it.discountPercent) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxableAmount: taxable,
        gstRate,
        gstAmount: rowTax,
        totalAmount: total,
      };
    });

    const finalSubtotal = Number(subtotal.toFixed(2));
    const finalDiscountAmt = Number(discountAmount) || 0;
    const taxableAmt = Math.max(0, Number((finalSubtotal - finalDiscountAmt).toFixed(2)));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    // Sum taxes from items or apply standard rate
    if (isInterState) {
      igst = computedItems.reduce((acc: number, it: any) => acc + (it.gstAmount || 0), 0);
      if (igst === 0 && body.applyDefaultGST) {
        igst = Number((taxableAmt * 0.18).toFixed(2));
      }
    } else {
      const totalTax = computedItems.reduce((acc: number, it: any) => acc + (it.gstAmount || 0), 0);
      cgst = Number((totalTax / 2).toFixed(2));
      sgst = Number((totalTax / 2).toFixed(2));
    }

    const totalBeforeCharges = taxableAmt + cgst + sgst + igst;
    const totalAmount = Number(
      (totalBeforeCharges + (Number(serviceCharge) || 0) + (Number(otherCharges) || 0) + (Number(roundOff) || 0)).toFixed(
        2
      )
    );

    const isPaid = paymentDetails?.isReceived || status === 'RECEIVED' || status === 'PAID';
    const amountPaid = isPaid ? Number(paymentDetails?.amount || totalAmount) : 0;
    const balanceDue = Math.max(0, Number((totalAmount - amountPaid).toFixed(2)));

        const effectiveBankDetails = {
          ...DEFAULT_BANK_DETAILS,
          ...(typeof bankDetails === 'object' && bankDetails !== null ? bankDetails : {}),
          accountType: 'Current Account',
          branch: 'Neelam Cinema Road, Gandhi Chowk, Munger - 811201, Bihar',
          branchCode: '02684',
        };

        const created = await prisma.invoice.create({
          data: {
            invoiceNumber: finalInvNumber,
            seriesName,
            invoicePrefix,
            invoiceSuffix,
            bookName,
            date: date || new Date().toISOString().split('T')[0],
            dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
            clientId: body.clientId || `cli_${Date.now()}`,
            clientName: clientName.trim(),
            clientGstin: clientGstin?.trim() || null,
            billingAddress: billingAddress?.trim() || null,
            shippingAddress: shippingAddress?.trim() || billingAddress?.trim() || null,
            quotationNo: quotationNo?.trim() || null,
            placeOfSupply: placeOfSupply?.trim() || null,
            rateType,
            discountType,
            discountValue: Number(discountValue) || 0,
            discountAmount: finalDiscountAmt,
            itemsJson: JSON.stringify(computedItems),
            subtotal: finalSubtotal,
            taxableAmount: taxableAmt,
            cgst,
            sgst,
            igst,
            serviceCharge: Number(serviceCharge) || 0,
            otherCharges: Number(otherCharges) || 0,
            roundOff: Number(roundOff) || 0,
            totalAmount,
            amountPaid,
            balanceDue,
            currency: 'INR',
            status: isPaid ? 'RECEIVED' : status,
            paymentMethod: paymentDetails?.paymentMode || 'IMPS',
            bankDetailsJson: JSON.stringify(effectiveBankDetails),
            paymentDetailsJson: paymentDetails ? JSON.stringify(paymentDetails) : null,
            notes: notes?.trim() || null,
            terms: terms?.trim() || DEFAULT_TERMS,
          },
        });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[Invoices POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
