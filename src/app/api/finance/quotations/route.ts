import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { DEFAULT_BANK_DETAILS } from '@/lib/bank-details';

const DEFAULT_TERMS = `1. Monthly services are billed in advance per cycle.
2. CGI/Walkthrough charges are payable in advance before execution.
3. Ad budget is to be paid directly by the client to ad platforms.
4. 50% advance on monthly package, remaining 50% before cycle completion.
5. Client must provide required content/references timely to avoid delay.
6. Reports & reviews will be shared weekly.`;

async function seedDefaultQuotationsIfEmpty() {
  const count = await prisma.quotation.count();
  if (count > 0) return;

  // Quotation 1: Q0003 (From User's PDF)
  const q3Items = [
    {
      srNo: 1,
      desc: 'Website & Android App Development',
      deliverables: [
        'Custom Premium Website Development with Android Mobile Application including UI/UX Design, Admin Panel, Backend Development, API Integration, Database, Responsive Design, QR Integration, Source Code Handover, Testing, Deployment and 30 Days Technical Support.',
      ],
      hsn: '998314',
      qty: 1,
      unit: 'NOS',
      rate: 110169.492,
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

  await prisma.quotation.create({
    data: {
      quotationNumber: 'Q0003',
      prefix: 'Q',
      suffix: '',
      date: '2026-07-09',
      validUntil: '2026-08-09',
      clientId: 'cli_sunil_jd',
      clientName: 'mr. Sunil',
      clientPhone: '+91 7528835379',
      clientEmail: 'sunil@jdleads.in',
      clientGstin: '04-CHANDIGARH',
      billingAddress: 'JD lead CHANDIGARH,\nState: 04-CHANDIGARH Country: India',
      itemsJson: JSON.stringify(q3Items),
      subtotal: 110169.49,
      taxableAmount: 110169.49,
      cgst: 9915.255,
      sgst: 9915.255,
      igst: 0,
      taxAmount: 19830.51,
      discountBeforeTax: 0,
      discountAfterTax: 0,
      serviceCharge: 0,
      otherCharges: 0,
      roundOff: 0,
      autoRoundOff: true,
      totalAmount: 130000.0,
      currency: 'INR',
      status: 'SENT',
      notes: 'Initial technical and commercial estimation for Web & Android App delivery.',
      bankDetails: JSON.stringify(DEFAULT_BANK_DETAILS),
      terms: DEFAULT_TERMS,
    },
  });

  // Quotation 2: Q0004 (From User's Screenshot default state)
  const q4Items = [
    {
      srNo: 1,
      desc: 'Digital Marketing & Lead Generation Retainer',
      deliverables: [
        'Weekly Targeted Campaigns Setup & Optimization',
        'Creative Graphic Ad Sets (15 Creatives)',
        'Conversion Tracking & Weekly ROAS Analysis',
      ],
      hsn: '998314',
      qty: 1,
      unit: 'MTH',
      rate: 42372.88,
      rateType: 'EXCLUSIVE_GST',
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: 42372.88,
      gstRate: 18,
      gstAmount: 7627.12,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: 50000.0,
    },
  ];

  await prisma.quotation.create({
    data: {
      quotationNumber: 'Q0004',
      prefix: 'Q',
      suffix: '',
      date: '2026-09-26',
      validUntil: '2026-10-26',
      clientId: 'cli_msi_group',
      clientName: 'M.S.I. GROUP OF INSTITUTE',
      clientPhone: '+91 9175288353',
      clientEmail: 'admissions@msigroup.edu.in',
      clientGstin: '03AEQPE9376K2ZY',
      billingAddress:
        'SCO NO 12 & 13, FIRST, SECOND & THIRD FLOOR, MONGA CITY CENTRE, Mohali, S.A.S Nagar, PUNJAB 140307',
      itemsJson: JSON.stringify(q4Items),
      subtotal: 42372.88,
      taxableAmount: 42372.88,
      cgst: 0,
      sgst: 0,
      igst: 7627.12,
      taxAmount: 7627.12,
      discountBeforeTax: 0,
      discountAfterTax: 0,
      serviceCharge: 0,
      otherCharges: 0,
      roundOff: 0,
      autoRoundOff: true,
      totalAmount: 50000.0,
      currency: 'INR',
      status: 'DRAFT',
      notes: 'Write your special notes for this quotation.',
      bankDetails: JSON.stringify(DEFAULT_BANK_DETAILS),
      terms: DEFAULT_TERMS,
    },
  });
}

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    const { searchParams } = new URL(req.url);
    if (searchParams.get('nextNumber') === 'true') {
      const allQuotations = await prisma.quotation.findMany({
        select: { quotationNumber: true },
      });
      let maxNum = 0;
      for (const q of allQuotations) {
        const match = q.quotationNumber.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      const nextNumPart = String(maxNum + 1).padStart(4, '0');
      return NextResponse.json({
        prefix: 'Q',
        nextNumPart,
        suffix: '',
        nextQuotationNumber: `Q${nextNumPart}`,
      });
    }

    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error('[Quotations GET Error]:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();

    const {
      clientName,
      clientPhone = '',
      clientEmail = '',
      clientGstin = '',
      billingAddress = '',
      prefix = 'Q',
      quotationNumber: customQNumber,
      suffix = '',
      date,
      validUntil,
      items = [],
      isInterState = false,
      rateType = 'EXCLUSIVE_GST',
      discountBeforeTax = 0,
      discountAfterTax = 0,
      serviceCharge = 0,
      otherCharges = 0,
      autoRoundOff = true,
      notes = '',
      bankDetails = DEFAULT_BANK_DETAILS,
      terms = DEFAULT_TERMS,
      status = 'DRAFT',
    } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }

    // Determine quotation number safely avoiding unique collisions
    const allQuotations = await prisma.quotation.findMany({ select: { quotationNumber: true } });
    let maxNum = 0;
    for (const q of allQuotations) {
      const match = q.quotationNumber.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextAutoNum = `${prefix}${String(maxNum + 1).padStart(4, '0')}${suffix}`;

    let finalQNumber = customQNumber ? customQNumber.trim() : '';
    if (finalQNumber) {
      const existing = await prisma.quotation.findUnique({
        where: { quotationNumber: finalQNumber },
      });
      if (existing) {
        finalQNumber = nextAutoNum;
      }
    } else {
      finalQNumber = nextAutoNum;
    }

    let subtotal = 0;
    const computedItems = items.map((it: any, idx: number) => {
      const qty = Number(it.qty) || 1;
      const rate = Number(it.rate) || 0;
      const gstRate = Number(it.gstRate) || 0;
      let taxable = qty * rate;

      if (it.rateType === 'INCLUSIVE_GST' && gstRate > 0) {
        taxable = Number(((qty * rate) / (1 + gstRate / 100)).toFixed(2));
      }

      const discAmt = it.discountPercent
        ? Number(((taxable * it.discountPercent) / 100).toFixed(2))
        : Number(it.discountAmount) || 0;
      const taxableAfterDisc = Math.max(0, taxable - discAmt);
      const rowTax = Number(((taxableAfterDisc * gstRate) / 100).toFixed(2));
      const total = Number((taxableAfterDisc + rowTax).toFixed(2));

      subtotal += taxableAfterDisc;

      return {
        srNo: idx + 1,
        desc: it.desc || 'Service Item',
        deliverables: it.deliverables || [],
        hsn: it.hsn || '998314',
        mrp: Number(it.mrp) || undefined,
        qty,
        unit: it.unit || 'NOS',
        rate,
        rateType: it.rateType || rateType,
        discountPercent: Number(it.discountPercent) || 0,
        discountAmount: discAmt,
        taxableAmount: taxableAfterDisc,
        gstRate,
        gstAmount: rowTax,
        cessRate: Number(it.cessRate) || 0,
        cessAmount: Number(it.cessAmount) || 0,
        totalAmount: total,
      };
    });

    const finalSubtotal = Number(subtotal.toFixed(2));
    const discBeforeTaxAmt = Number(discountBeforeTax) || 0;
    const taxableAmt = Math.max(0, Number((finalSubtotal - discBeforeTaxAmt).toFixed(2)));

    const totalTax = computedItems.reduce((acc: number, it: any) => acc + (it.gstAmount || 0), 0);
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = totalTax;
    } else {
      cgst = Number((totalTax / 2).toFixed(2));
      sgst = Number((totalTax / 2).toFixed(2));
    }

    const totalBeforeExtra = taxableAmt + totalTax + (Number(serviceCharge) || 0) + (Number(otherCharges) || 0) - (Number(discountAfterTax) || 0);

    let roundOff = 0;
    let grandTotal = totalBeforeExtra;
    if (autoRoundOff) {
      grandTotal = Math.round(totalBeforeExtra);
      roundOff = Number((grandTotal - totalBeforeExtra).toFixed(2));
    }

    const effectiveBankDetails = {
      ...DEFAULT_BANK_DETAILS,
      ...(typeof bankDetails === 'object' && bankDetails !== null ? bankDetails : {}),
      accountType: 'Current Account',
      branch: 'Neelam Cinema Road, Gandhi Chowk, Munger - 811201, Bihar',
      branchCode: '02684',
    };

    const created = await prisma.quotation.create({
      data: {
        quotationNumber: finalQNumber,
        prefix,
        suffix,
        date: date || new Date().toISOString().split('T')[0],
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        clientId: body.clientId || `cli_${Date.now()}`,
        clientName: clientName.trim(),
        clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        clientGstin: clientGstin?.trim() || null,
        billingAddress: billingAddress?.trim() || null,
        itemsJson: JSON.stringify(computedItems),
        subtotal: finalSubtotal,
        taxableAmount: taxableAmt,
        cgst,
        sgst,
        igst,
        taxAmount: totalTax,
        discountBeforeTax: discBeforeTaxAmt,
        discountAfterTax: Number(discountAfterTax) || 0,
        serviceCharge: Number(serviceCharge) || 0,
        otherCharges: Number(otherCharges) || 0,
        roundOff,
        autoRoundOff,
        totalAmount: grandTotal,
        currency: 'INR',
        status,
        notes: notes?.trim() || null,
        bankDetails: JSON.stringify(effectiveBankDetails),
        terms: terms?.trim() || DEFAULT_TERMS,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[Quotations POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
