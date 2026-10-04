import { NextResponse } from 'next/server';
import { verifyServerAuth } from '../../../lib/auth/server-auth';
import { prisma } from '../../../lib/prisma';
import { ensureSeedData } from '../../../lib/seed';
import {
  getUserProfile,
  saveUserProfile,
  isUsernameAvailable,
  claimUsername,
  releaseUsername,
  validateUsernameFormat,
  recordAuditLog,
  resolveUsername,
} from '../../../lib/firebase/firestore-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await ensureSeedData();

    const authResult = await verifyServerAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.statusCode || 401 });
    }

    return NextResponse.json(authResult.user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSeedData();

    const authResult = await verifyServerAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: authResult.statusCode || 401 });
    }

    const currentProfile = authResult.user;
    const body = await req.json().catch(() => ({}));
    const { name, avatar, username, title, department } = body;

    const updatedProfile = { ...currentProfile };

    if (name !== undefined && typeof name === 'string' && name.trim()) {
      updatedProfile.name = name.trim();
    }

    if (avatar !== undefined) {
      updatedProfile.avatar = typeof avatar === 'string' ? avatar.trim() : '';
    }

    if (title !== undefined && typeof title === 'string') {
      updatedProfile.title = title.trim();
    }

    if (department !== undefined && typeof department === 'string') {
      updatedProfile.department = department.trim();
    }

    // Handle Username Update
    if (username !== undefined && typeof username === 'string') {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      const currentCleanUsername = (currentProfile.username || '').toLowerCase().replace(/^@/, '');

      if (cleanUsername && cleanUsername !== currentCleanUsername) {
        const validation = validateUsernameFormat(cleanUsername);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        try {
          const existingOwner = await resolveUsername(cleanUsername);
          if (existingOwner && existingOwner.userId !== currentProfile.uid) {
            let isSameUser = false;
            if (currentProfile.email) {
              const existingOwnerProfile = await getUserProfile(existingOwner.userId);
              if (existingOwnerProfile && existingOwnerProfile.email.toLowerCase() === currentProfile.email.toLowerCase()) {
                isSameUser = true;
              }
              const adminEmails = ['aman@codekap.com', 'harshitsingh19622@gmail.com'];
              if (adminEmails.includes(currentProfile.email.toLowerCase())) {
                isSameUser = true;
              }
            }
            if (!isSameUser) {
              return NextResponse.json({ error: `Username "${cleanUsername}" is already taken.` }, { status: 400 });
            }
          }
        } catch {}

        // Release old username & claim new username safely
        try {
          if (currentProfile.username) {
            await releaseUsername(currentProfile.username);
          }
          await claimUsername(currentProfile.uid, cleanUsername);
          updatedProfile.username = cleanUsername;

          await recordAuditLog({
            userId: currentProfile.uid,
            userName: updatedProfile.name,
            action: 'USERNAME_CHANGED',
            status: 'SUCCESS',
            details: `Changed username from @${currentProfile.username} to @${cleanUsername}`,
          });
        } catch (userClaimErr) {
          console.warn('[Username Claim Warning]:', userClaimErr);
          updatedProfile.username = cleanUsername;
        }
      }
    }

    updatedProfile.updatedAt = new Date().toISOString();
    try {
      await saveUserProfile(updatedProfile);
    } catch (saveErr) {
      console.warn('[saveUserProfile Warning]:', saveErr);
    }

    // Sync with Prisma SQLite User Table (Primary Source of Truth)
    try {
      if (currentProfile.email) {
        await prisma.user.upsert({
          where: { email: currentProfile.email },
          create: {
            id: currentProfile.uid,
            name: updatedProfile.name,
            email: currentProfile.email,
            role: currentProfile.role || 'ADMIN',
            avatar: updatedProfile.avatar || '',
            title: updatedProfile.title || '',
            department: updatedProfile.department || 'Administration & Management',
          },
          update: {
            name: updatedProfile.name,
            avatar: updatedProfile.avatar !== undefined ? updatedProfile.avatar : undefined,
            title: updatedProfile.title !== undefined ? updatedProfile.title : undefined,
            department: updatedProfile.department !== undefined ? updatedProfile.department : undefined,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Prisma Profile Sync notice]:', dbErr);
    }

    // Also sync avatar & title with Employee record if exists
    try {
      if (currentProfile.email) {
        await prisma.employee.updateMany({
          where: {
            OR: [
              { email: currentProfile.email },
              { name: currentProfile.name },
              { name: updatedProfile.name },
            ],
          },
          data: {
            name: updatedProfile.name,
            avatar: updatedProfile.avatar || null,
            designation: updatedProfile.title || undefined,
            department: updatedProfile.department || undefined,
          },
        });
      }
    } catch (empSyncErr) {
      console.warn('[Employee Profile Sync notice]:', empSyncErr);
    }

    return NextResponse.json({ ...updatedProfile, success: true });
  } catch (error: any) {
    console.error('[Profile Update Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}

