import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INITIAL_CALENDAR_EVENTS = [
  {
    id: 'evt_01',
    title: 'Follow-up with Ananya Roy (Royale Jewels)',
    date: '2026-08-26',
    time: '11:00 AM',
    type: 'CRM',
    priority: 'HIGH',
    description: 'Review lead requirements and schedule product demo call.',
    status: 'COMPLETED',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'evt_02',
    title: 'Quotation Review for Aura Fitness & Wellness',
    date: '2026-08-28',
    time: '02:30 PM',
    type: 'SALES',
    priority: 'MEDIUM',
    description: 'Finalize quotation revisions and terms of engagement.',
    status: 'COMPLETED',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'evt_03',
    title: 'Milestone 2 Signoff — Jeevansphere Eye Care Portal',
    date: '2026-08-30',
    time: '04:00 PM',
    type: 'PROJECT',
    priority: 'HIGH',
    description: 'Sign off milestone 2 deliverables with Dr. Deepak Yadav.',
    status: 'COMPLETED',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'evt_04',
    title: 'Tax & GST Invoicing for August Cycle',
    date: '2026-09-02',
    time: '10:00 AM',
    type: 'FINANCE',
    priority: 'HIGH',
    description: 'Prepare GST returns and consolidate client payments for August.',
    status: 'COMPLETED',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'evt_05',
    title: 'Project Delivery & Production Launch for Jeevansphere',
    date: '2026-09-15',
    time: '05:00 PM',
    type: 'PROJECT',
    priority: 'HIGH',
    description: 'Deploy full production release to live production servers.',
    status: 'COMPLETED',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'evt_06',
    title: 'Weekly Sprint Planning & Client Reviews',
    date: '2026-10-06',
    time: '10:00 AM',
    type: 'PROJECT',
    priority: 'HIGH',
    description: 'Sprint alignment meeting for engineering and digital marketing teams.',
    status: 'PENDING',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'evt_07',
    title: 'Aura Vital Star Ads Campaign Audit',
    date: '2026-10-10',
    time: '03:00 PM',
    type: 'MARKETING',
    priority: 'HIGH',
    description: 'Review Meta and Google Ads performance metrics and ROAS in Brampton.',
    status: 'PENDING',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'evt_08',
    title: 'GST & Quarterly Invoice Reconciliation',
    date: '2026-10-15',
    time: '11:30 AM',
    type: 'FINANCE',
    priority: 'MEDIUM',
    description: 'Audit outstanding client balances and generate mid-month invoices.',
    status: 'PENDING',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'evt_09',
    title: 'Monthly Organization Review & Retrospective',
    date: '2026-10-24',
    time: '04:30 PM',
    type: 'CRM',
    priority: 'MEDIUM',
    description: 'Staff workload distribution and monthly milestone retrospective.',
    status: 'PENDING',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
];

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    // Ensure initial calendar events exist
    const count = await prisma.calendarEvent.count();
    if (count === 0) {
      await prisma.calendarEvent.createMany({
        data: INITIAL_CALENDAR_EVENTS,
      });
    }

    const events = await prisma.calendarEvent.findMany({
      orderBy: { date: 'asc' },
    });

    // Also pull Task and Milestone deadlines if available
    try {
      const tasks = await prisma.task.findMany({
        where: { dueDate: { not: null } },
        take: 20,
      });

      const taskEvents = tasks.map((t) => ({
        id: `task_${t.id}`,
        title: `Task: ${t.title} (${t.assignedToName || 'Team'})`,
        date: t.dueDate!,
        time: '05:00 PM',
        type: 'PROJECT',
        priority: t.priority || 'MEDIUM',
        description: t.description || `Assigned to ${t.assignedToName}`,
        status: t.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isSynced: true,
      }));

      // Combine and eliminate duplicate titles on the same date
      const combined = [...events];
      for (const te of taskEvents) {
        if (!combined.some((e) => e.title === te.title && e.date === te.date)) {
          combined.push(te as any);
        }
      }

      combined.sort((a, b) => a.date.localeCompare(b.date));
      return NextResponse.json(combined);
    } catch {
      return NextResponse.json(events);
    }
  } catch (error: any) {
    console.error('[Calendar GET Error]:', error);
    return NextResponse.json(INITIAL_CALENDAR_EVENTS);
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { title, date, time = '10:00 AM', type = 'PROJECT', priority = 'MEDIUM', description = '', status = 'PENDING' } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 });
    }

    let color = 'bg-blue-100 text-blue-800 border-blue-200';
    if (type === 'SALES') color = 'bg-purple-100 text-purple-800 border-purple-200';
    else if (type === 'PROJECT') color = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (type === 'FINANCE') color = 'bg-rose-100 text-rose-800 border-rose-200';
    else if (type === 'MARKETING') color = 'bg-amber-100 text-amber-800 border-amber-200';
    else if (type === 'CRM') color = 'bg-indigo-100 text-indigo-800 border-indigo-200';

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title: title.trim(),
        date: date.trim(),
        time: time?.trim() || '10:00 AM',
        type: type.toUpperCase(),
        priority: priority.toUpperCase(),
        description: description?.trim() || '',
        status: status.toUpperCase(),
        color,
      },
    });

    return NextResponse.json(newEvent);
  } catch (error: any) {
    console.error('[Calendar POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { id, title, date, time, type, priority, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required for update.' }, { status: 400 });
    }

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
    console.error('[Calendar PUT Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSeedData();
    const url = new URL(req.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required for deletion.' }, { status: 400 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Calendar event removed.' });
  } catch (error: any) {
    console.error('[Calendar DELETE Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
