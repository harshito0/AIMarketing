import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';
import { getInvitationByTokenHash, getAllInvitations } from '@/lib/firebase/firestore-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FALLBACK_PASSCODES: Record<string, any> = {
  'AGENT-5829': {
    email: 'sharshit.0211@gmail.com',
    name: 'Harshit',
    role: 'DEVELOPER',
    department: 'Development',
    passcode: 'AGENT-5829',
    invitedByName: 'Aman Sir (Super Admin)',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    id: 'inv_harshit_dev',
  },
  'AGENT-7788': {
    email: 'admin@codekap.com',
    name: 'Workspace Joining Invite',
    role: 'ADMIN',
    department: 'Administration & Management',
    passcode: 'AGENT-7788',
    invitedByName: 'Aman Sir',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    id: 'inv_admin_passcode',
  },
};

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { passcode, email } = body;

    if (!passcode || !passcode.toString().trim()) {
      return NextResponse.json({ error: 'Passcode is required.' }, { status: 400 });
    }

    // Normalize passcode: strip internal/external spaces (e.g. "AGENT - 2667" -> "AGENT-2667")
    const rawClean = passcode.toString().replace(/\s+/g, '').toUpperCase();
    const withHyphen = rawClean.startsWith('AGENT') && !rawClean.includes('-')
      ? rawClean.replace('AGENT', 'AGENT-')
      : rawClean;

    // 1. Look up passcode in SQLite database
    let invite: any = null;
    try {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Invitation" ADD COLUMN "department" TEXT DEFAULT 'Development';`);
      } catch {}

      invite = await prisma.invitation.findFirst({
        where: {
          OR: [
            { passcode: rawClean },
            { passcode: withHyphen },
            { passcode: `AGENT-${rawClean.replace(/^AGENT-?/i, '')}` },
          ],
        },
      });
    } catch (dbErr) {
      console.warn('[Validate Passcode DB Notice]: Falling back to Firestore/Memory store.', dbErr);
    }

    // 2. Look up in Firestore / memory store
    if (!invite) {
      try {
        const firestoreInvite = await getInvitationByTokenHash(withHyphen) || await getInvitationByTokenHash(rawClean);
        if (firestoreInvite) {
          invite = firestoreInvite;
        } else {
          const all = await getAllInvitations();
          invite = all.find(i => (i.tokenHash || '').toUpperCase() === withHyphen || (i.tokenHash || '').toUpperCase() === rawClean) || null;
        }
      } catch {}
    }

    // 3. Look up in hardcoded fallback
    if (!invite) {
      invite = FALLBACK_PASSCODES[withHyphen] || FALLBACK_PASSCODES[rawClean] || null;
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite passcode. Please verify the code with your Super Admin.' },
        { status: 404 }
      );
    }

    if (invite.status === 'REVOKED') {
      return NextResponse.json(
        { error: 'This invitation passcode has been revoked by the Super Admin.' },
        { status: 403 }
      );
    }

    if (invite.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'This invitation passcode has already been used to join the team.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json(
        { error: 'This invitation passcode has expired. Please ask your Super Admin to generate a new one.' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      invitedByName: invite.invitedByName || 'Super Admin',
      passcode: invite.passcode || withHyphen,
      invitationId: invite.id,
    });
  } catch (error: any) {
    console.error('[Validate Passcode Error]:', error);
    return NextResponse.json({ error: error?.message || 'Server error occurred during passcode validation.' }, { status: 500 });
  }
}
