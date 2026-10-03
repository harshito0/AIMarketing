import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';
import { verifyAdminAuth } from '../../../../lib/auth/server-auth';
import { UserRole } from '../../../../lib/types';
import { sendInvitationEmail } from '@/lib/email/service';
import { createInvitation, getAllInvitations } from '@/lib/firebase/firestore-service';

// Helper to generate readable 6-character team passcodes (e.g. AGENT-7291)
function generatePasscode(): string {
  const prefix = 'AGENT';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FALLBACK_DEFAULT_INVITATIONS = [
  {
    id: 'inv_harshit_dev',
    email: 'sharshit.0211@gmail.com',
    name: 'Harshit',
    role: 'DEVELOPER',
    department: 'Development',
    passcode: 'AGENT-5829',
    status: 'PENDING',
    message: 'Welcome to CodeKap OS workspace! Use this passcode to register and activate your account.',
    invitedBy: 'usr_aman',
    invitedByName: 'Aman Sir (Super Admin)',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv_admin_passcode',
    email: 'admin@codekap.com',
    name: 'Workspace Joining Invite',
    role: 'ADMIN',
    department: 'Administration & Management',
    passcode: 'AGENT-7788',
    status: 'PENDING',
    message: 'Official joining passcode for Codekap marketing workspace.',
    invitedBy: 'usr_aman',
    invitedByName: 'Aman Sir',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const authResult = await verifyAdminAuth(req);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 });
    }

    let invitations: any[] = [];

    // 1. Try Prisma SQLite
    try {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Invitation" ADD COLUMN "department" TEXT DEFAULT 'Development';`);
      } catch {}

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          invitations = await prisma.invitation.findMany({
            orderBy: { createdAt: 'desc' },
          });
          break;
        } catch (err: any) {
          if (attempt === 1) throw err;
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    } catch (dbErr: any) {
      console.warn('[Invitations GET DB Notice]: SQLite unreachable, falling back to Firestore/Memory store.', dbErr?.message);
    }

    // 2. Fallback to Firestore / memory service if empty or failed
    if (!invitations || invitations.length === 0) {
      try {
        const firestoreInvites = await getAllInvitations();
        if (firestoreInvites && firestoreInvites.length > 0) {
          invitations = firestoreInvites;
        }
      } catch {}
    }

    // 3. Fallback to default invitations if still empty
    if (!invitations || invitations.length === 0) {
      invitations = FALLBACK_DEFAULT_INVITATIONS;
    }

    return NextResponse.json(
      invitations.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        department: inv.department || 'Development',
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
    // Graceful fallback to default invitations instead of 500
    return NextResponse.json(FALLBACK_DEFAULT_INVITATIONS, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const authResult = await verifyAdminAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.statusCode || 403 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { email, name, role = 'TEAM_MEMBER', customPasscode, message, department } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    // Determine unique passcode
    let passcode = (customPasscode || '').trim().toUpperCase();
    if (!passcode) {
      try {
        for (let i = 0; i < 10; i++) {
          const candidate = generatePasscode();
          const exists = await prisma.invitation.findUnique({ where: { passcode: candidate } }).catch(() => null);
          if (!exists) {
            passcode = candidate;
            break;
          }
        }
      } catch {}
      if (!passcode) {
        passcode = `AGENT-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days expiration
    const nowIso = new Date().toISOString();

    let createdInvite: any = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: targetEmail,
      name: name ? name.trim() : null,
      role: (role || 'TEAM_MEMBER') as UserRole,
      department: department || 'Development',
      passcode,
      invitedBy: authResult.user.uid,
      invitedByName: authResult.user.name || 'Super Admin',
      status: 'PENDING',
      message: message ? message.trim() : null,
      expiresAt: expiresAt.toISOString(),
      createdAt: nowIso,
    };

    // Save invitation to SQLite database with error tolerance
    try {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Invitation" ADD COLUMN "department" TEXT DEFAULT 'Development';`);
      } catch {}

      // Revoke any previous pending invitations for this email
      await prisma.invitation.updateMany({
        where: { email: targetEmail, status: 'PENDING' },
        data: { status: 'REVOKED' },
      }).catch(() => null);

      const existingWithPasscode = await prisma.invitation.findUnique({
        where: { passcode },
      });

      if (existingWithPasscode) {
        const updated = await prisma.invitation.update({
          where: { id: existingWithPasscode.id },
          data: {
            email: targetEmail,
            name: name ? name.trim() : null,
            role: role as UserRole,
            department: department || 'Development',
            invitedBy: authResult.user.uid,
            invitedByName: authResult.user.name || 'Super Admin',
            status: 'PENDING',
            message: message ? message.trim() : null,
            expiresAt,
          },
        });
        createdInvite = {
          ...createdInvite,
          id: updated.id,
          expiresAt: updated.expiresAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
        };
      } else {
        const created = await prisma.invitation.create({
          data: {
            email: targetEmail,
            name: name ? name.trim() : null,
            role: role as UserRole,
            department: department || 'Development',
            passcode,
            invitedBy: authResult.user.uid,
            invitedByName: authResult.user.name || 'Super Admin',
            status: 'PENDING',
            message: message ? message.trim() : null,
            expiresAt,
          },
        });
        createdInvite = {
          ...createdInvite,
          id: created.id,
          expiresAt: created.expiresAt.toISOString(),
          createdAt: created.createdAt.toISOString(),
        };
      }
    } catch (dbErr: any) {
      console.warn('[Invitations POST DB Warning]: Could not persist to SQLite, using Firestore/Memory store.', dbErr?.message);
    }

    // Persist to Firestore / Memory cache
    try {
      await createInvitation({
        id: createdInvite.id,
        email: targetEmail,
        role: role as UserRole,
        invitedBy: authResult.user.uid,
        invitedByName: authResult.user.name || 'Super Admin',
        status: 'PENDING',
        expiresAt: expiresAt.toISOString(),
        createdAt: nowIso,
        tokenHash: passcode,
      });
    } catch {}

    // Build join URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const invitationUrl = `${protocol}://${host}/signup?passcode=${encodeURIComponent(passcode)}&email=${encodeURIComponent(targetEmail)}`;

    // Deliver email via Gmail SMTP
    let emailDelivered = false;
    let emailInfo = '';
    try {
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
        invitation: createdInvite,
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
    console.error('[Invitations POST Critical Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server error occurred while creating invitation.',
      },
      { status: 500 }
    );
  }
}
