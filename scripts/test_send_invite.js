const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'sharshit.0211@gmail.com';
  const role = 'DEVELOPER';
  const name = 'Harshit';
  const passcode = 'AGENT-5829';
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const host = 'localhost:3000';
  const invitationUrl = `http://${host}/signup?passcode=${encodeURIComponent(passcode)}&email=${encodeURIComponent(targetEmail)}`;

  console.log(`[1/3] Upserting invitation in SQLite database for ${targetEmail}...`);
  // Revoke any previous pending invites for this email
  await prisma.invitation.updateMany({
    where: { email: targetEmail, status: 'PENDING' },
    data: { status: 'REVOKED' },
  }).catch(() => null);

  const existingWithPasscode = await prisma.invitation.findUnique({
    where: { passcode },
  });

  let invite;
  if (existingWithPasscode) {
    invite = await prisma.invitation.update({
      where: { id: existingWithPasscode.id },
      data: {
        email: targetEmail,
        name,
        role,
        status: 'PENDING',
        expiresAt,
      },
    });
  } else {
    invite = await prisma.invitation.create({
      data: {
        email: targetEmail,
        name,
        role,
        passcode,
        invitedBy: 'usr_aman',
        invitedByName: 'Aman Sir (Super Admin)',
        status: 'PENDING',
        message: 'Welcome to CodeKap OS workspace! Use this passcode to register and activate your account.',
        expiresAt,
      },
    });
  }

  console.log(`[2/3] Saved invitation to database! ID: ${invite.id}, Passcode: ${invite.passcode}`);

  console.log(`[3/3] Sending invitation email via Gmail SMTP to ${targetEmail}...`);
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; color: #0f172a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #2563eb; color: #ffffff; width: 54px; height: 54px; line-height: 54px; border-radius: 16px; font-weight: 900; font-size: 26px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">C</div>
        <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CodeKap OS</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 0; font-weight: 600;">Super Admin Workspace Invitation</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #1e293b; margin-top: 0; font-size: 16px; font-weight: 700;">You've been invited to join CodeKap OS</h3>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Invited by:</strong> Aman Sir (Super Admin)</p>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Assigned Role:</strong> <span style="background-color: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">${role}</span></p>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
        <p style="color: #475569; font-size: 13px; font-style: italic; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">"Welcome to CodeKap OS workspace! Use this passcode to register and activate your account."</p>
      </div>

      <div style="background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 14px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #1e40af; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">Your Official Team Access Passcode</p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #1d4ed8; background: #ffffff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 20px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          ${passcode}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0; font-weight: 500;">Enter this passcode on the sign-up page or click the button below to join directly.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; margin-bottom: 28px;">
        <a href="${invitationUrl}" style="background-color: #2563eb; color: #ffffff; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
          ACCEPT INVITATION & REGISTER &rarr;
        </a>
      </div>

      <div style="background-color: #fafafa; border-radius: 10px; padding: 12px; text-align: center; margin-top: 20px;">
        <p style="color: #64748b; font-size: 11px; margin: 0;">
          Direct Join Link: <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all; font-weight: 600;">${invitationUrl}</a>
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `CodeKap OS <${smtpUser}>`,
    to: targetEmail,
    subject: `CodeKap OS Workspace Invitation: You've been invited by Aman Sir [Passcode: ${passcode}]`,
    html: htmlContent,
  });

  console.log(`\n========================================`);
  console.log(`EMAIL DELIVERED TO GMAIL SUCCESSFULLY!`);
  console.log(`Target: ${targetEmail}`);
  console.log(`Passcode: ${passcode}`);
  console.log(`Message ID: ${info.messageId}`);
  console.log(`Join URL: ${invitationUrl}`);
  console.log(`========================================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
