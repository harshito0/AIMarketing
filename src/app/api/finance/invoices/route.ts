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

async function seedDefaultInvoicesIfEmpty() {
  const count = await prisma.invoice.count();
  if (count > 0) return;

  // Invoice 1: INV0001 (From Screenshots)
  const inv1Items = [
    {
      srNo: 1,
      desc: 'Social Media Management',
      deliverables: ['Weekly Content Scheduling', 'Community Engagement & Monitoring', 'Hashtag Research'],
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
      deliverables: ['12 Creative Post Creatives', 'Reels & Short Video Scripts', 'Caption Copywriting'],
      hsn: '998361',
      qty: 1,
      unit: 'MTH',
      rate: 4200,
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
      deliverables: ['High-Intent Search Ads', 'Keyword Bidding & Negative Keywords', 'Conversion Tracking Setup'],
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
      deliverables: ['Weekly GMB Posts & Photo Updates', 'Review Response Automation', 'Local Map Citation Updates'],
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
      deliverables: ['Digital Press Release Distribution', 'Brand Authority Outreach', 'Media Mention Tracking'],
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

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV0001',
      seriesName: 'Sales Invoice',
      invoicePrefix: 'INV',
      invoiceSuffix: '',
      bookName: 'Sales Taxable',
      date: '2026-04-28',
      dueDate: '2026-05-13',
      clientId: 'cli_msi_group',
      clientName: 'M.S.I. GROUP OF INSTITUTE',
      clientGstin: '03AEQPE9376K2ZY',
      billingAddress:
        'SCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307\nGSTIN: 03AEQPE9376K2ZY',
      shippingAddress:
        'M.S.I. GROUP OF INSTITUTE (GSTIN: 03AEQPE9376K2ZY)\nSCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307',
      quotationNo: 'QUO-2026-004',
      placeOfSupply: 'PUNJAB (03)',
      itemsJson: JSON.stringify(inv1Items),
      subtotal: 12711.87,
      taxableAmount: 12711.87,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 2288.13,
      serviceCharge: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 15000.0,
      amountPaid: 15000.0,
      balanceDue: 0.0,
      currency: 'INR',
      status: 'RECEIVED',
      paymentMethod: 'IMPS',
      bankDetailsJson: JSON.stringify(DEFAULT_BANK_DETAILS),
      paymentDetailsJson: JSON.stringify({
        isReceived: true,
        paymentMode: 'IMPS',
        refNo: 'AD/0102',
        depositTo: 'CODEKAP',
        amount: 15000.0,
        receivedDate: '2026-04-28',
      }),
      notes:
        'If receipt against this invoice was created, then it will be auto unadjusted this invoice from that receipt entry!',
      terms: DEFAULT_TERMS,
    },
  });

  // Invoice 2: INV0012 (From PDF)
  const inv2Items = [
    {
      srNo: 1,
      desc: 'On-Page SEO Optimization (Ongoing Monthly)',
      deliverables: [
        'Metadata & title optimization',
        'Internal linking improvements',
        'Website speed tweaks & technical hygiene',
        'Mobile-friendliness check',
      ],
      hsn: '998365',
      qty: 1,
      unit: 'MTH',
      rate: 6000,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 6000.0,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 6000.0,
    },
    {
      srNo: 2,
      desc: 'Local SEO (Google My Business + Local Citations)',
      deliverables: [
        'GMB optimization (categories, services, posts)',
        'NAP consistency (Name, Address, Phone)',
        'Local directory listings (Canada/Surrey BC focused)',
      ],
      hsn: '998365',
      qty: 1,
      unit: 'MTH',
      rate: 3300,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 3300.0,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 3300.0,
    },
    {
      srNo: 3,
      desc: 'Monthly SEO Reporting (Basic)',
      deliverables: [
        'Keyword ranking summary',
        'Google Analytics 4 traffic overview',
        'Technical issues & recommendations',
      ],
      hsn: '998365',
      qty: 1,
      unit: 'MTH',
      rate: 700,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 700.0,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 700.0,
    },
  ];

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV0012',
      seriesName: 'Sales Invoice',
      invoicePrefix: 'INV',
      invoiceSuffix: '',
      bookName: 'Export Non-GST',
      date: '2025-10-10',
      dueDate: '2025-10-10',
      clientId: 'cli_glassfinity_usa',
      clientName: 'Glassfinity USA',
      clientGstin: null,
      billingAddress: 'Glass finity usa, VIRGINIA\nCountry: United States',
      shippingAddress: 'Glass finity usa, VIRGINIA\nCountry: United States',
      quotationNo: '',
      placeOfSupply: 'Export / Overseas',
      itemsJson: JSON.stringify(inv2Items),
      subtotal: 10000.0,
      taxableAmount: 10000.0,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      serviceCharge: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 10000.0,
      amountPaid: 10000.0,
      balanceDue: 0.0,
      currency: 'INR',
      status: 'PAID',
      paymentMethod: 'Bank Wire Transfer',
      bankDetailsJson: JSON.stringify(DEFAULT_BANK_DETAILS),
      paymentDetailsJson: JSON.stringify({
        isReceived: true,
        paymentMode: 'Wire Transfer',
        refNo: 'WT/99120',
        depositTo: 'CODEKAP',
        amount: 10000.0,
        receivedDate: '2025-10-10',
      }),
      notes: 'Monthly international retainer invoice for SEO deliverables.',
      terms: `Scope of Work: Services delivered as per the agreed scope, proposal, or service agreement.
Invoice Validity: This invoice is valid for 15 days from the date of issue unless otherwise stated.
Nature of Supply: This is a B2B service transaction. No physical goods are delivered.
GST: Currently unregistered for GST. No GST is charged on this invoice.
Currency: All amounts are quoted and payable in INR (₹), unless specified otherwise.`,
    },
  });
}

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
      return NextResponse.json({
        prefix: 'INV',
        nextNumPart,
        suffix: '',
        nextInvoiceNumber: `INV${nextNumPart}`,
      });
    }

    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('[Invoices GET Error]:', error);
    return NextResponse.json([]);
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
