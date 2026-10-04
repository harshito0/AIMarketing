import { NextResponse } from 'next/server';
import { verifyServerAuth } from '../../../lib/auth/server-auth';
import { prisma } from '../../../lib/prisma';
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
    const authResult = await verifyServerAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 401 });
    }

    return NextResponse.json(authResult.user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyServerAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 401 });
    }

    const currentProfile = authResult.user;
    const body = await req.json().catch(() => ({}));
    const { name, avatar, username, title, department } = body;

    const updatedProfile = { ...currentProfile };

    if (name && name.trim()) {
      updatedProfile.name = name.trim();
    }

    if (avatar !== undefined) {
      updatedProfile.avatar = avatar.trim();
    }

    if (title !== undefined) {
      updatedProfile.title = title.trim();
    }

    if (department !== undefined) {
      updatedProfile.department = department.trim();
    }

    // Handle Username Update
    if (username && username.trim().toLowerCase() !== (currentProfile.username || '').toLowerCase()) {
      const newUsername = username.trim().toLowerCase();
      const validation = validateUsernameFormat(newUsername);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      try {
        const existingOwner = await resolveUsername(newUsername);
        if (existingOwner && existingOwner.userId !== currentProfile.uid) {
          return NextResponse.json({ error: `Username "${newUsername}" is already taken.` }, { status: 400 });
        }
      } catch {}

      // Release old username & claim new username safely
      try {
        if (currentProfile.username) {
          await releaseUsername(currentProfile.username);
        }
        await claimUsername(currentProfile.uid, newUsername);
        updatedProfile.username = newUsername;

        await recordAuditLog({
          userId: currentProfile.uid,
          userName: updatedProfile.name,
          action: 'USERNAME_CHANGED',
          status: 'SUCCESS',
          details: `Changed username from @${currentProfile.username} to @${newUsername}`,
        });
      } catch (userClaimErr) {
        console.warn('[Username Claim Warning]:', userClaimErr);
        updatedProfile.username = newUsername;
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

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('[Profile Update Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}
