import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();
    const { title, date, time, type, priority, description, status } = body;

    let color: string | undefined = undefined;
    if (type) {
      if (type === 'SALES') color = 'bg-purple-100 text-purple-800 border-purple-200';
      else if (type === 'PROJECT') color = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      else if (type === 'FINANCE') color = 'bg-rose-100 text-rose-800 border-rose-200';
      else if (type === 'MARKETING') color = 'bg-amber-100 text-amber-800 border-amber-200';
      else if (type === 'CRM') color = 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(date ? { date: date.trim() } : {}),
        ...(time ? { time: time.trim() } : {}),
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(priority ? { priority: priority.toUpperCase() } : {}),
        ...(description !== undefined ? { description: description?.trim() || '' } : {}),
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(color ? { color } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
