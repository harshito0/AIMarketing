import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id },
          { employeeId: id },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, department, designation, role, status, workloadScore, avatar, managerName } = body;

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { id },
          { employeeId: id },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { id: existing.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.toLowerCase().trim() } : {}),
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        ...(department ? { department: department.trim() } : {}),
        ...(designation ? { designation: designation.trim() } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(workloadScore !== undefined ? { workloadScore: Number(workloadScore) } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
        ...(managerName !== undefined ? { managerName: managerName?.trim() || null } : {}),
      },
    });

    try {
      if (updated.email) {
        await prisma.user.updateMany({
          where: { email: updated.email },
          data: {
            name: updated.name,
            title: updated.designation,
            department: updated.department,
            ...(updated.avatar ? { avatar: updated.avatar } : {}),
          },
        });
      }
    } catch {}

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { id },
          { employeeId: id },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    await prisma.employee.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: 'Employee permanently removed.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
