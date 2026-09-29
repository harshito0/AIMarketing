import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerAuth } from '@/lib/auth/server-auth';
import { ensureSeedData } from '@/lib/seed';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    const authResult = await verifyServerAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required to inspect database.' },
        { status: authResult.statusCode || 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const exportAll = searchParams.get('export') === 'true';

    // Model list and counts
    const [
      usersCount,
      clientsCount,
      projectsCount,
      tasksCount,
      workLogsCount,
      campaignsCount,
      creativesCount,
      proposalsCount,
      leadsCount,
      invoicesCount,
      quotationsCount,
      expensesCount,
      employeesCount,
      departmentsCount,
      sopsCount,
      auditLogsCount,
      screenTimeCount,
      invitationsCount,
      socialAccountsCount,
      socialPostsCount,
      conversationsCount,
      messagesCount,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.client.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.task.count().catch(() => 0),
      prisma.workLog.count().catch(() => 0),
      prisma.campaign.count().catch(() => 0),
      prisma.creative.count().catch(() => 0),
      prisma.campaignProposal.count().catch(() => 0),
      prisma.lead.count().catch(() => 0),
      prisma.invoice.count().catch(() => 0),
      prisma.quotation.count().catch(() => 0),
      prisma.expense.count().catch(() => 0),
      prisma.employee.count().catch(() => 0),
      prisma.department.count().catch(() => 0),
      prisma.sOP.count().catch(() => 0),
      prisma.auditLog.count().catch(() => 0),
      prisma.screenTimeLog.count().catch(() => 0),
      prisma.invitation.count().catch(() => 0),
      prisma.socialAccount.count().catch(() => 0),
      prisma.socialPost.count().catch(() => 0),
      prisma.conversation.count().catch(() => 0),
      prisma.message.count().catch(() => 0),
    ]);

    const totalRecords =
      usersCount +
      clientsCount +
      projectsCount +
      tasksCount +
      workLogsCount +
      campaignsCount +
      creativesCount +
      proposalsCount +
      leadsCount +
      invoicesCount +
      quotationsCount +
      expensesCount +
      employeesCount +
      departmentsCount +
      sopsCount +
      auditLogsCount +
      screenTimeCount +
      invitationsCount +
      socialAccountsCount +
      socialPostsCount +
      conversationsCount +
      messagesCount;

    // Database file stats
    let dbSizeKb = 0;
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    try {
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        dbSizeKb = Math.round(stats.size / 1024);
      }
    } catch {}

    const tablesSummary = [
      { id: 'clients', name: 'Clients & Businesses', model: 'client', count: clientsCount, icon: 'Building2', category: 'Core CRM' },
      { id: 'projects', name: 'Client Projects', model: 'project', count: projectsCount, icon: 'Briefcase', category: 'Operations' },
      { id: 'tasks', name: 'Tasks & Action Items', model: 'task', count: tasksCount, icon: 'CheckSquare', category: 'Operations' },
      { id: 'workLogs', name: 'Daily Work Logs', model: 'workLog', count: workLogsCount, icon: 'FileCheck2', category: 'Operations' },
      { id: 'users', name: 'Users & Admins', model: 'user', count: usersCount, icon: 'Users', category: 'Team & Auth' },
      { id: 'employees', name: 'Company Employees', model: 'employee', count: employeesCount, icon: 'UserCheck', category: 'Team & Auth' },
      { id: 'departments', name: 'Departments', model: 'department', count: departmentsCount, icon: 'Layers', category: 'Team & Auth' },
      { id: 'invitations', name: 'Passcodes & Invites', model: 'invitation', count: invitationsCount, icon: 'Shield', category: 'Team & Auth' },
      { id: 'campaigns', name: 'Marketing Campaigns', model: 'campaign', count: campaignsCount, icon: 'Megaphone', category: 'Growth & Ads' },
      { id: 'creatives', name: 'AI Banner Creatives', model: 'creative', count: creativesCount, icon: 'Sparkles', category: 'Growth & Ads' },
      { id: 'proposals', name: 'AI Proposals', model: 'campaignProposal', count: proposalsCount, icon: 'FileText', category: 'Growth & Ads' },
      { id: 'socialAccounts', name: 'Connected Social Accounts', model: 'socialAccount', count: socialAccountsCount, icon: 'Globe', category: 'KAIRO Social' },
      { id: 'socialPosts', name: 'Social Posts & Schedules', model: 'socialPost', count: socialPostsCount, icon: 'Share2', category: 'KAIRO Social' },
      { id: 'leads', name: 'CRM Sales Leads', model: 'lead', count: leadsCount, icon: 'TrendingUp', category: 'Sales & CRM' },
      { id: 'invoices', name: 'GST Invoices', model: 'invoice', count: invoicesCount, icon: 'Receipt', category: 'Finance' },
      { id: 'quotations', name: 'Client Quotations', model: 'quotation', count: quotationsCount, icon: 'FileSpreadsheet', category: 'Finance' },
      { id: 'expenses', name: 'Company Expenses', model: 'expense', count: expensesCount, icon: 'Wallet', category: 'Finance' },
      { id: 'sops', name: 'SOPs & Checklists', model: 'sOP', count: sopsCount, icon: 'BookOpen', category: 'Knowledge' },
      { id: 'screenTime', name: 'Screen Time & Activity', model: 'screenTimeLog', count: screenTimeCount, icon: 'Clock', category: 'Analytics' },
      { id: 'conversations', name: 'Chat Channels', model: 'conversation', count: conversationsCount, icon: 'MessageSquare', category: 'Chat' },
      { id: 'messages', name: 'Chat Messages', model: 'message', count: messagesCount, icon: 'Send', category: 'Chat' },
      { id: 'auditLogs', name: 'Audit & Activity Logs', model: 'auditLog', count: auditLogsCount, icon: 'Activity', category: 'System' },
    ];

    // If exporting full database snapshot
    if (exportAll) {
      const [
        users,
        clients,
        projects,
        tasks,
        workLogs,
        campaigns,
        creatives,
        leads,
        invoices,
        quotations,
        expenses,
        employees,
        departments,
        sops,
        auditLogs,
        screenTime,
        socialAccounts,
        socialPosts,
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.client.findMany(),
        prisma.project.findMany(),
        prisma.task.findMany(),
        prisma.workLog.findMany(),
        prisma.campaign.findMany(),
        prisma.creative.findMany(),
        prisma.lead.findMany(),
        prisma.invoice.findMany(),
        prisma.quotation.findMany(),
        prisma.expense.findMany(),
        prisma.employee.findMany(),
        prisma.department.findMany(),
        prisma.sOP.findMany(),
        prisma.auditLog.findMany({ take: 200, orderBy: { timestamp: 'desc' } }),
        prisma.screenTimeLog.findMany(),
        prisma.socialAccount.findMany(),
        prisma.socialPost.findMany(),
      ]);

      const fullBackup = {
        exportedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        totalRecords,
        database: {
          users,
          clients,
          projects,
          tasks,
          workLogs,
          campaigns,
          creatives,
          leads,
          invoices,
          quotations,
          expenses,
          employees,
          departments,
          sops,
          auditLogs,
          screenTime,
          socialAccounts,
          socialPosts,
        },
      };

      return NextResponse.json(fullBackup);
    }

    // If specific table query
    if (table) {
      let rows: any[] = [];
      const limit = 50;

      switch (table.toLowerCase()) {
        case 'clients':
        case 'client':
          rows = await prisma.client.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'projects':
        case 'project':
          rows = await prisma.project.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'tasks':
        case 'task':
          rows = await prisma.task.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'worklogs':
        case 'worklog':
          rows = await prisma.workLog.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'users':
        case 'user':
          rows = await prisma.user.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'employees':
        case 'employee':
          rows = await prisma.employee.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'departments':
        case 'department':
          rows = await prisma.department.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'campaigns':
        case 'campaign':
          rows = await prisma.campaign.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'creatives':
        case 'creative':
          rows = await prisma.creative.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'leads':
        case 'lead':
          rows = await prisma.lead.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'invoices':
        case 'invoice':
          rows = await prisma.invoice.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'quotations':
        case 'quotation':
          rows = await prisma.quotation.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'expenses':
        case 'expense':
          rows = await prisma.expense.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'sops':
        case 'sop':
          rows = await prisma.sOP.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'auditlogs':
        case 'auditlog':
          rows = await prisma.auditLog.findMany({ take: limit, orderBy: { timestamp: 'desc' } });
          break;
        case 'screentime':
        case 'screentimelog':
          rows = await prisma.screenTimeLog.findMany({ take: limit, orderBy: { lastActiveAt: 'desc' } });
          break;
        case 'invitations':
        case 'invitation':
          rows = await prisma.invitation.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'socialaccounts':
        case 'socialaccount':
          rows = await prisma.socialAccount.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'socialposts':
        case 'socialpost':
          rows = await prisma.socialPost.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        case 'conversations':
        case 'conversation':
          rows = await prisma.conversation.findMany({ take: limit, orderBy: { updatedAt: 'desc' } });
          break;
        case 'messages':
        case 'message':
          rows = await prisma.message.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
          break;
        default:
          return NextResponse.json({ error: `Table '${table}' not found in database schema.` }, { status: 404 });
      }

      return NextResponse.json({
        table,
        count: rows.length,
        rows,
      });
    }

    return NextResponse.json({
      status: 'ONLINE',
      engine: 'SQLite + Prisma ORM',
      databaseFile: 'prisma/dev.db',
      sizeKb: dbSizeKb,
      totalTables: tablesSummary.length,
      totalRecords,
      lastSync: new Date().toISOString(),
      tables: tablesSummary,
    });
  } catch (error: any) {
    console.error('[Database API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to inspect database.' },
      { status: 500 }
    );
  }
}
