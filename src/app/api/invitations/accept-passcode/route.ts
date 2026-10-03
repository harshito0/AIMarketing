import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';
import { getInvitationByTokenHash, updateInvitationStatus, saveUserProfile } from '@/lib/firebase/firestore-service';

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
    const { passcode, name, email, uid } = body;

    if (!passcode || !passcode.toString().trim()) {
      return NextResponse.json({ error: 'Passcode is required to join the team.' }, { status: 400 });
    }

    const rawClean = passcode.toString().replace(/\s+/g, '').toUpperCase();
    const withHyphen = rawClean.startsWith('AGENT') && !rawClean.includes('-')
      ? rawClean.replace('AGENT', 'AGENT-')
      : rawClean;

    // 1. Look up invite in SQLite database
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
      console.warn('[Accept Passcode DB Notice]: Falling back to Firestore/Memory store.', dbErr);
    }

    // 2. Look up in Firestore / memory store
    if (!invite) {
      try {
        const firestoreInvite = await getInvitationByTokenHash(withHyphen) || await getInvitationByTokenHash(rawClean);
        if (firestoreInvite) {
          invite = firestoreInvite;
        }
      } catch {}
    }

    // 3. Fallback to hardcoded list
    if (!invite) {
      invite = FALLBACK_PASSCODES[withHyphen] || FALLBACK_PASSCODES[rawClean] || null;
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation passcode. Please verify the code with your Super Admin.' },
        { status: 400 }
      );
    }

    const targetEmail = (email || invite.email).toLowerCase().trim();
    const memberName = (name || invite.name || targetEmail.split('@')[0]).trim();
    const assignedRole = invite.role || 'TEAM_MEMBER';
    const userId = uid || `usr_${Date.now()}`;

    // Mark invitation as ACCEPTED in SQLite
    if (invite.id && !invite.id.startsWith('inv_')) {
      try {
        await prisma.invitation.update({
          where: { id: invite.id },
          data: {
            status: 'ACCEPTED',
          },
        });
      } catch {}
    }

    // Update in Firestore / memory
    try {
      if (invite.id) {
        await updateInvitationStatus(invite.id, 'ACCEPTED', new Date().toISOString());
      }
    } catch {}

    let user: any = {
      id: userId,
      name: memberName,
      email: targetEmail,
      role: assignedRole,
      title: assignedRole === 'ADMIN' ? 'Admin' : assignedRole === 'MANAGER' ? 'Marketing Manager' : assignedRole === 'DEVELOPER' ? 'Developer' : 'Team Member',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetEmail}`,
    };

    // Create or update User record in SQLite
    try {
      const dbUser = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
          name: memberName,
          role: assignedRole,
          title: user.title,
        },
        create: {
          id: userId,
          email: targetEmail,
          name: memberName,
          role: assignedRole,
          title: user.title,
          avatar: user.avatar,
        },
      });
      user = { ...user, ...dbUser };

      // Record audit trail
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: `Team Member Joined via Passcode: [${withHyphen}]`,
          apiOperation: 'POST /api/invitations/accept-passcode (Prisma Engine)',
          status: 'SUCCESS',
          details: `Assigned Role: ${assignedRole}, Invited By: ${invite.invitedByName || 'Super Admin'}`,
        },
      }).catch(() => null);
    } catch (dbErr) {
      console.warn('[Accept Passcode DB Upsert Warning]: Saving user to Firestore/memory fallback.', dbErr);
    }

    // Also persist user profile in Firestore service
    try {
      await saveUserProfile({
        uid: user.id || userId,
        name: memberName,
        email: targetEmail,
        username: targetEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'member',
        role: assignedRole,
        title: user.title,
        avatar: user.avatar,
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar,
      },
      message: `Welcome to the team! Joined successfully with role: ${assignedRole}`,
    });
  } catch (error: any) {
    console.error('[Accept Passcode Error]:', error);
    return NextResponse.json({ error: error?.message || 'Server error while accepting passcode.' }, { status: 500 });
  }
}
