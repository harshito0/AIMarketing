import nodemailer from 'nodemailer';

export interface SendInvitationEmailParams {
  toEmail: string;
  role: string;
  invitedByName: string;
  passcode?: string;
  invitationUrl: string;
  message?: string;
}

/**
 * Real Email Delivery Service for CodeKap OS.
 * Delivers invitation emails with secure passcodes and join links via Gmail SMTP.
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: boolean; delivered: boolean; messageId?: string; info?: string }> {
  const smtpUser = process.env.SMTP_USER || 'harshitsingh19622@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'gbvqcaojszvhuvei';
  const emailFrom = `"CodeKap OS" <${smtpUser}>`;

  const { toEmail, role, invitedByName, passcode, invitationUrl, message } = params;

  const plainTextContent = `Hello,

You have been invited to join the CodeKap OS workspace as ${role} by ${invitedByName}.

Your Team Access Passcode: ${passcode || 'AGENT-5829'}

Click the link below to accept the invitation and complete your registration:
${invitationUrl}

${message ? `Note from Admin: "${message}"\n` : ''}
If you did not expect this invitation from CodeKap OS Super Admin, you can disregard this email.
`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; color: #0f172a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #2563eb; color: #ffffff; width: 54px; height: 54px; line-height: 54px; border-radius: 16px; font-weight: 900; font-size: 26px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">C</div>
        <h2 style="color: #0f172a; margin-top: 14px; margin-bottom: 4px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CodeKap OS</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 0; font-weight: 600;">Super Admin Workspace Invitation</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #1e293b; margin-top: 0; font-size: 16px; font-weight: 700;">You've been invited to join CodeKap OS</h3>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Invited by:</strong> ${invitedByName}</p>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Assigned Role:</strong> <span style="background-color: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 6px; font-weight: bold; font-size: 12px;">${role}</span></p>
        <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Recipient:</strong> ${toEmail}</p>
        ${message ? `<p style="color: #475569; font-size: 13px; font-style: italic; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">"${message}"</p>` : ''}
      </div>

      ${passcode ? `
      <div style="background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 14px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #1e40af; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">Your Official Team Access Passcode</p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #1d4ed8; background: #ffffff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 20px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          ${passcode}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0; font-weight: 500;">Enter this passcode on the sign-up page or click the button below to join directly.</p>
      </div>
      ` : ''}

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

      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        If you did not expect this invitation from CodeKap OS Super Admin, you can disregard this email.
      </p>
    </div>
  `;

  // Try Gmail Service first (direct SSL on port 465)
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: emailFrom,
      to: toEmail,
      subject: `CodeKap OS Workspace Invitation: You've been invited by ${invitedByName} [Passcode: ${passcode || 'INVITE'}]`,
      text: plainTextContent,
      html: htmlContent,
    });

    console.log(`[Gmail Success]: Invitation sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn(`[Gmail Service Warning]: Trying host fallback for ${toEmail}:`, error.message);

    // Fallback to smtp.gmail.com host
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await fallbackTransporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject: `CodeKap OS Workspace Invitation: You've been invited by ${invitedByName} [Passcode: ${passcode || 'INVITE'}]`,
        text: plainTextContent,
        html: htmlContent,
      });

      console.log(`[Gmail Fallback Success]: Invitation sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, delivered: true, messageId: info.messageId };
    } catch (fallbackError: any) {
      console.error(`[Gmail Final Delivery Error]: Failed to send to ${toEmail}:`, fallbackError.message || fallbackError);
      return {
        success: false,
        delivered: false,
        info: fallbackError.message || 'SMTP transmission error',
      };
    }
  }
}
