import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: id }, { invoiceNumber: id }],
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('[Invoice GET by ID Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: id }, { invoiceNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      'clientName',
      'clientGstin',
      'billingAddress',
      'shippingAddress',
      'seriesName',
      'invoicePrefix',
      'invoiceNumber',
      'invoiceSuffix',
      'bookName',
      'quotationNo',
      'placeOfSupply',
      'date',
      'dueDate',
      'itemsJson',
      'subtotal',
      'taxableAmount',
      'cgst',
      'sgst',
      'igst',
      'serviceCharge',
      'otherCharges',
      'roundOff',
      'totalAmount',
      'amountPaid',
      'balanceDue',
      'currency',
      'status',
      'paymentMethod',
      'bankDetailsJson',
      'paymentDetailsJson',
      'notes',
      'terms',
    ];

    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        updateData[f] = body[f];
      }
    }

    if (body.items && Array.isArray(body.items)) {
      updateData.itemsJson = JSON.stringify(body.items);
    }
    if (body.bankDetails) {
      updateData.bankDetailsJson = JSON.stringify(body.bankDetails);
    }
    if (body.paymentDetails) {
      updateData.paymentDetailsJson = JSON.stringify(body.paymentDetails);
    }

    const updated = await prisma.invoice.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Invoice PATCH Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;

    const existing = await prisma.invoice.findFirst({
      where: {
        OR: [{ id: id }, { invoiceNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error: any) {
    console.error('[Invoice DELETE Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
