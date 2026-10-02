import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const userEmail = searchParams.get('userEmail') || '';

    // Parallel fetch real database metrics
    const [
      activeProjectsCount,
      openLeadsCount,
      wonLeadsCount,
      pendingTasksCount,
      allEmployeesCount,
      invoices,
      expenses,
      recentProjects,
      recentTasks,
      recentLogs,
      recentSops,
      // Team Member specific metrics
      myTasks,
      myWorkLogs,
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.lead.count({ where: { status: { notIn: ['WON', 'LOST'] } } }).catch(() => 0),
      prisma.lead.count({ where: { status: 'WON' } }).catch(() => 0),
      prisma.task.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.invoice.findMany({ where: { status: { not: 'DELETED' } }, select: { totalAmount: true, amountPaid: true, balanceDue: true, status: true } }).catch(() => []),
      prisma.expense.findMany({ select: { amount: true } }).catch(() => []),
      prisma.project.findMany({ take: 5, orderBy: { updatedAt: 'desc' } }).catch(() => []),
      prisma.task.findMany({ take: 6, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.auditLog.findMany({ take: 6, orderBy: { timestamp: 'desc' } }).catch(() => []),
      prisma.sOP.findMany({ take: 4, orderBy: { updatedAt: 'desc' } }).catch(() => []),
      // Member specific tasks if query params provided
      (userId || userEmail)
        ? prisma.task.findMany({
            where: {
              OR: [
                ...(userId ? [{ assignedToId: userId }] : []),
                ...(userEmail ? [{ assignedToEmail: userEmail }] : []),
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }).catch(() => [])
        : Promise.resolve([]),
      // Member specific work logs if query params provided
      (userId || userEmail)
        ? prisma.workLog.findMany({
            where: {
              OR: [
                ...(userId ? [{ employeeId: userId }] : []),
                ...(userEmail ? [{ employeeEmail: userEmail }] : []),
              ],
            },
            orderBy: { date: 'desc' },
            take: 7,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Real financial calculations (0 if empty database)
    const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const operatingSurplus = totalRevenue - totalExpenses;

    // Member specific calculations
    const myPendingTasksCount = myTasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
    const myCompletedTasksCount = myTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const myTotalHoursLogged = myWorkLogs.reduce((acc: number, log: any) => acc + (log.timeSpentHours || 0), 0);

    return NextResponse.json({
      // Executive Owner Metrics
      revenue: totalRevenue,
      collections: totalCollected,
      outstanding: totalOutstanding,
      expenses: totalExpenses,
      operatingSurplus,
      activeProjects: activeProjectsCount,
      openLeads: openLeadsCount,
      wonDeals: wonLeadsCount,
      pendingTasks: pendingTasksCount,
      teamSize: allEmployeesCount,
      recentProjects,
      recentTasks,
      recentLogs,
      recentSops,
      // Team Member Metrics
      myTasks,
      myWorkLogs,
      myPendingTasksCount,
      myCompletedTasksCount,
      myTotalHoursLogged,
    });
  } catch (error: any) {
    console.error('[Dashboard Overview API Error]:', error);
    return NextResponse.json({
      revenue: 0,
      collections: 0,
      outstanding: 0,
      expenses: 0,
      operatingSurplus: 0,
      activeProjects: 0,
      openLeads: 0,
      wonDeals: 0,
      pendingTasks: 0,
      teamSize: 0,
      recentProjects: [],
      recentTasks: [],
      recentLogs: [],
      recentSops: [],
      myTasks: [],
      myWorkLogs: [],
      myPendingTasksCount: 0,
      myCompletedTasksCount: 0,
      myTotalHoursLogged: 0,
    });
  }
}
