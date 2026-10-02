import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;

    const quotation = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: id }, { quotationNumber: id }],
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error('[Quotation GET by ID Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: id }, { quotationNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    const updateData: any = {};
    const allowedFields = [
      'clientName',
      'clientPhone',
      'clientEmail',
      'clientGstin',
      'billingAddress',
      'prefix',
      'quotationNumber',
      'suffix',
      'date',
      'validUntil',
      'subtotal',
      'taxableAmount',
      'cgst',
      'sgst',
      'igst',
      'taxAmount',
      'discountBeforeTax',
      'discountAfterTax',
      'serviceCharge',
      'otherCharges',
      'roundOff',
      'autoRoundOff',
      'totalAmount',
      'currency',
      'status',
      'notes',
      'terms',
      'bankDetails',
    ];

    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        updateData[f] = body[f];
      }
    }

    if (body.items && Array.isArray(body.items)) {
      updateData.itemsJson = JSON.stringify(body.items);
    }
    if (body.bankDetails && typeof body.bankDetails === 'object') {
      updateData.bankDetails = JSON.stringify(body.bankDetails);
    }

    const updated = await prisma.quotation.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Quotation PATCH Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const existing = await prisma.quotation.findFirst({
      where: {
        OR: [{ id: id }, { quotationNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    if (permanent) {
      await prisma.quotation.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, permanent: true, message: 'Quotation permanently deleted.' });
    } else {
      const updated = await prisma.quotation.update({
        where: { id: existing.id },
        data: { status: 'DELETED' },
      });
      return NextResponse.json({ success: true, permanent: false, quotation: updated, message: 'Quotation moved to Deleted section.' });
    }
  } catch (error: any) {
    console.error('[Quotation DELETE Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
