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

      const available = await isUsernameAvailable(newUsername);
      if (!available) {
        return NextResponse.json({ error: `Username "${newUsername}" is already taken.` }, { status: 400 });
      }

      // Release old username & claim new username
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
    }

    updatedProfile.updatedAt = new Date().toISOString();
    await saveUserProfile(updatedProfile);

    // Sync with Prisma SQLite User Table
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
            department: updatedProfile.department || 'Development',
          },
          update: {
            name: updatedProfile.name,
            avatar: updatedProfile.avatar || '',
            title: updatedProfile.title || '',
            department: updatedProfile.department || 'Development',
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Prisma Profile Sync notice]:', dbErr);
    }

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('[Profile Update Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}
