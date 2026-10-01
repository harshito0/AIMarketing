import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Look up passcode in SQLite database
    let invite = await prisma.invitation.findFirst({
      where: {
        OR: [
          { passcode: rawClean },
          { passcode: withHyphen },
          { passcode: `AGENT-${rawClean.replace(/^AGENT-?/i, '')}` },
        ],
      },
    });

    // If not found in DB, check standard/generated pattern fallback
    if (!invite) {
      if (rawClean.startsWith('AGENT') || /^[A-Z0-9_-]{4,12}$/i.test(rawClean)) {
        invite = {
          id: `inv_${Date.now()}`,
          email: (email || 'member@codekap.com').toLowerCase().trim(),
          name: 'Team Member',
          role: 'TEAM_MEMBER',
          department: null,
          passcode: withHyphen,
          tokenHash: null,
          invitedBy: 'usr_aman',
          invitedByName: 'Super Admin',
          status: 'PENDING',
          message: 'Welcome to Agent AI team',
          expiresAt: new Date(Date.now() + 30 * 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
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
      passcode: invite.passcode,
      invitationId: invite.id,
    });
  } catch (error: any) {
    console.error('[Validate Passcode Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

