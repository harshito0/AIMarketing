import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';
import { verifyAdminAuth } from '../../../../lib/auth/server-auth';
import { UserRole } from '../../../../lib/types';

// Helper to generate readable 6-character team passcodes (e.g. AGENT-7291 or CODE-4819)
function generatePasscode(): string {
  const prefix = 'AGENT';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const authResult = await verifyAdminAuth(req);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 });
    }

    let invitations: any[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        invitations = await prisma.invitation.findMany({
          orderBy: { createdAt: 'desc' },
        });
        break;
      } catch (err: any) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }

    return NextResponse.json(
      invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        passcode: inv.passcode,
        status: inv.status,
        message: inv.message || null,
        invitedBy: inv.invitedBy,
        invitedByName: inv.invitedByName,
        expiresAt: inv.expiresAt ? new Date(inv.expiresAt).toISOString() : new Date().toISOString(),
        createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
      })),
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[Invitations GET Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const authResult = await verifyAdminAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 });
    }

    const body = await req.json();
    const { email, name, role = 'TEAM_MEMBER', customPasscode, message } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Determine unique passcode
    let passcode = (customPasscode || '').trim().toUpperCase();
    if (!passcode) {
      for (let i = 0; i < 10; i++) {
        const candidate = generatePasscode();
        const exists = await prisma.invitation.findUnique({ where: { passcode: candidate } });
        if (!exists) {
          passcode = candidate;
          break;
        }
      }
      if (!passcode) {
        passcode = `AGENT-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days expiration

    // Revoke any previous pending invitations for this email
    await prisma.invitation.updateMany({
      where: { email: targetEmail, status: 'PENDING' },
      data: { status: 'REVOKED' },
    }).catch(() => null);

    // Save invitation to SQLite database
    let createdInvite: any = null;
    const existingWithPasscode = await prisma.invitation.findUnique({
      where: { passcode },
    });

    if (existingWithPasscode) {
      createdInvite = await prisma.invitation.update({
        where: { id: existingWithPasscode.id },
        data: {
          email: targetEmail,
          name: name ? name.trim() : null,
          role: role as UserRole,
          invitedBy: authResult.user.uid,
          invitedByName: authResult.user.name || 'Super Admin',
          status: 'PENDING',
          message: message ? message.trim() : null,
          expiresAt,
        },
      });
    } else {
      createdInvite = await prisma.invitation.create({
        data: {
          email: targetEmail,
          name: name ? name.trim() : null,
          role: role as UserRole,
          passcode,
          invitedBy: authResult.user.uid,
          invitedByName: authResult.user.name || 'Super Admin',
          status: 'PENDING',
          message: message ? message.trim() : null,
          expiresAt,
        },
      });
    }

    // Build join URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const invitationUrl = `${protocol}://${host}/signup?passcode=${encodeURIComponent(passcode)}&email=${encodeURIComponent(targetEmail)}`;

    // Deliver email via Gmail SMTP
    let emailDelivered = false;
    let emailInfo = '';
    try {
      const { sendInvitationEmail } = await import('@/lib/email/service');
      const emailRes = await sendInvitationEmail({
        toEmail: targetEmail,
        role: role,
        invitedByName: authResult.user?.name || 'Super Admin',
        passcode,
        invitationUrl,
        message: message ? message.trim() : undefined,
      });
      emailDelivered = emailRes.delivered;
      emailInfo = emailRes.info || '';
    } catch (err: any) {
      console.warn('[Email Dispatch Warning]:', err?.message);
      emailInfo = err?.message || 'Failed to dispatch email';
    }

    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: createdInvite.id,
          email: createdInvite.email,
          name: createdInvite.name,
          role: createdInvite.role,
          passcode: createdInvite.passcode,
          status: createdInvite.status,
          message: createdInvite.message || (message ? message.trim() : null),
          expiresAt: createdInvite.expiresAt ? new Date(createdInvite.expiresAt).toISOString() : expiresAt.toISOString(),
          createdAt: createdInvite.createdAt ? new Date(createdInvite.createdAt).toISOString() : new Date().toISOString(),
        },
        emailDelivered,
        message: emailDelivered
          ? `Invitation email & passcode successfully sent to ${targetEmail} via Gmail!`
          : `Passcode [${passcode}] generated for ${targetEmail}. (Email notice: ${emailInfo || 'Delivery pending'})`,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[Invitations POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
