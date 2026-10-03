import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Look up invite in database
    let invite = await prisma.invitation.findFirst({
      where: {
        OR: [
          { passcode: rawClean },
          { passcode: withHyphen },
          { passcode: `AGENT-${rawClean.replace(/^AGENT-?/i, '')}` },
        ],
      },
    });

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
      await prisma.invitation.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
        },
      }).catch(() => null);
    }

    // Create or update User record in SQLite
    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: {
        name: memberName,
        role: assignedRole,
        title: assignedRole === 'ADMIN' ? 'Admin' : assignedRole === 'MANAGER' ? 'Marketing Manager' : 'Team Member',
      },
      create: {
        id: userId,
        email: targetEmail,
        name: memberName,
        role: assignedRole,
        title: assignedRole === 'ADMIN' ? 'Admin' : assignedRole === 'MANAGER' ? 'Marketing Manager' : 'Team Member',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetEmail}`,
      },
    });

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
    });

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
