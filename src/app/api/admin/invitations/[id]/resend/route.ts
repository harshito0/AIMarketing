import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeedData } from '@/lib/seed';
import { verifyAdminAuth } from '@/lib/auth/server-auth';
import { sendInvitationEmail } from '@/lib/email/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const authResult = await verifyAdminAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.statusCode || 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Find invitation by ID, passcode, or email
    let invitation: any = null;
    try {
      invitation = await prisma.invitation.findFirst({
        where: {
          OR: [
            { id },
            { passcode: id },
            { passcode: body.passcode || '' },
            { email: (body.email || (id.includes('@') ? id : '')).toLowerCase().trim() },
          ].filter((c: any) => Object.values(c)[0]),
        },
      });
    } catch (dbErr) {
      console.warn('[Resend DB Notice]:', dbErr);
    }

    const targetEmail = (invitation?.email || body.email || (id.includes('@') ? id : 'sharshit.0211@gmail.com')).toLowerCase().trim();
    const targetPasscode = invitation?.passcode || body.passcode || (id.startsWith('AGENT-') ? id : 'AGENT-8517');
    const targetRole = invitation?.role || body.role || 'DEVELOPER';
    const targetName = invitation?.name || body.name || 'Harshit';

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const invitationUrl = `${protocol}://${host}/signup?passcode=${encodeURIComponent(targetPasscode)}&email=${encodeURIComponent(targetEmail)}`;

    const emailRes = await sendInvitationEmail({
      toEmail: targetEmail,
      role: targetRole,
      invitedByName: authResult.user.name || 'Aman Sir (Super Admin)',
      passcode: targetPasscode,
      invitationUrl,
      message: invitation?.message || body.message || 'Welcome to CodeKap OS workspace! Use this passcode to register and activate your account.',
    });

    return NextResponse.json({
      success: true,
      delivered: emailRes.delivered,
      message: emailRes.delivered
        ? `Invitation email & passcode successfully resent to ${targetEmail} via Gmail!`
        : `Email delivery attempted to ${targetEmail}. (SMTP note: ${emailRes.info || 'queued'})`,
    });
  } catch (error: any) {
    console.error('[Invitation Resend Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Server error occurred while resending invitation.',
      },
      { status: 500 }
    );
  }
}
