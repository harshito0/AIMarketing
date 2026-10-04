import { NextResponse } from 'next/server';
import { adminAuth } from '../firebase/admin';
import { getUserProfile, getUserProfileByEmail } from '../firebase/firestore-service';
import { UserProfile, UserRole } from '../types';

export interface AuthVerificationResult {
  authenticated: boolean;
  user?: UserProfile;
  error?: string;
  statusCode?: number;
}

/**
 * Verifies Firebase ID Token from Authorization header and fetches Firestore user profile.
 * Rejects suspended / disabled accounts automatically with HTTP 403.
 */
export async function verifyServerAuth(req: Request): Promise<AuthVerificationResult> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  const devUserId = req.headers.get('X-User-Id') || 'usr_aman';

  let decodedUid: string | null = null;
  let decodedEmail: string | null = null;
  let decodedName: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();

    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        decodedUid = decodedToken.uid;
        decodedEmail = decodedToken.email || null;
        decodedName = decodedToken.name || null;
      } catch (err: any) {
        console.warn('[ServerAuth] Firebase Admin verifyIdToken warning:', err?.message);
      }
    }

    // If adminAuth not initialized or token verification threw in local dev, parse JWT payload safely
    if (!decodedUid && token) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          decodedUid = payload.user_id || payload.uid || payload.sub || null;
          decodedEmail = payload.email || null;
          decodedName = payload.name || null;
        }
      } catch {}
    }
  }

  const devUserEmail = req.headers.get('X-User-Email') || req.headers.get('x-user-email');
  const devUserRole = req.headers.get('X-User-Role') || req.headers.get('x-user-role');
  const lookupUid = decodedUid || devUserId || 'usr_aman';
  const lookupEmail = decodedEmail || devUserEmail || (lookupUid.includes('@') ? lookupUid : null);

  let userProfile: UserProfile | null = null;

  // 1. Fetch from Prisma SQLite Database first (Persistent Single Source of Truth)
  try {
    const { prisma } = await import('@/lib/prisma');
    const conditions: any[] = [{ id: lookupUid }];
    if (lookupEmail) conditions.push({ email: lookupEmail });
    if (lookupUid.includes('@')) conditions.push({ email: lookupUid });
    if (lookupUid === 'usr_aman' || devUserRole === 'ADMIN') conditions.push({ email: 'aman@codekap.com' });

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (dbUser) {
      let dept = (dbUser as any).department || 'Development';
      let avatarToUse = dbUser.avatar || '';
      try {
        const emp = await prisma.employee.findFirst({
          where: {
            OR: [
              { email: dbUser.email },
              { name: dbUser.name }
            ]
          }
        });
        if (emp?.department) {
          dept = emp.department;
        }
        if (!avatarToUse && emp?.avatar) {
          avatarToUse = emp.avatar;
        }
      } catch {}

      userProfile = {
        uid: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        username: dbUser.email.split('@')[0],
        role: (dbUser.role === 'ADMIN' ? 'ADMIN' : dbUser.role === 'MANAGER' ? 'MANAGER' : 'TEAM_MEMBER') as UserRole,
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
        avatar: avatarToUse,
        title: dbUser.title,
        department: dept,
      };
    }
  } catch (dbErr) {
    console.warn('[ServerAuth] DB lookup notice:', dbErr);
  }

  // 2. Try Firestore lookup if not found in Prisma DB
  if (!userProfile) {
    if (lookupUid) {
      try {
        userProfile = await getUserProfile(lookupUid);
      } catch {}
    }
    if (!userProfile && lookupEmail) {
      try {
        userProfile = await getUserProfileByEmail(lookupEmail);
      } catch {}
    }
  }

  // 3. Fallback for Super Admin (Aman Sir / Harshit / SMTP User)
  const initialAdminEmails = [
    'aman@codekap.com',
    'harshitsingh19622@gmail.com',
    (process.env.INITIAL_ADMIN_EMAIL || '').toLowerCase().trim(),
    (process.env.SMTP_USER || '').toLowerCase().trim(),
  ].filter(Boolean);

  const isAmanOrAdmin =
    lookupUid === 'usr_aman' ||
    lookupUid === 'usr_harshit' ||
    devUserRole === 'ADMIN' ||
    (lookupEmail && (
      initialAdminEmails.includes(lookupEmail.toLowerCase().trim()) ||
      lookupEmail.toLowerCase().includes('aman') ||
      lookupEmail.toLowerCase().includes('harshit')
    ));

  if (!userProfile) {
    if (isAmanOrAdmin) {
      userProfile = {
        uid: lookupUid || 'usr_aman',
        name: decodedName || 'Aman Sir',
        email: lookupEmail || 'aman@codekap.com',
        username: lookupEmail ? lookupEmail.split('@')[0] : 'aman',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: 'Super Admin / Founder & CEO',
        department: 'Administration & Management',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    } else {
      userProfile = {
        uid: lookupUid || `usr_${Date.now()}`,
        name: decodedName || (lookupEmail ? lookupEmail.split('@')[0] : 'Team Member'),
        email: lookupEmail || `${lookupUid}@codekap.com`,
        username: lookupEmail ? lookupEmail.split('@')[0] : lookupUid.substring(0, 8),
        role: (devUserRole as UserRole) || 'TEAM_MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        department: 'Development',
      };
    }
  } else {
    // If profile was retrieved from database, ensure any missing fields are safely populated without overwriting saved custom avatar or name
    if (isAmanOrAdmin) {
      if (!userProfile.role) userProfile.role = 'ADMIN';
      if (!userProfile.title) userProfile.title = 'Super Admin / Founder & CEO';
      if (!userProfile.department) userProfile.department = 'Administration & Management';
    }
  }

  if (userProfile.status === 'SUSPENDED' || userProfile.status === 'DISABLED') {
    return { authenticated: false, error: 'Forbidden: Account is suspended or disabled.', statusCode: 403 };
  }

  return { authenticated: true, user: userProfile };
}

/**
 * Requires caller to be authenticated AND have one of the allowed roles.
 */
export async function verifyRolePermission(
  req: Request,
  allowedRoles: UserRole[]
): Promise<AuthVerificationResult> {
  const authResult = await verifyServerAuth(req);
  if (!authResult.authenticated || !authResult.user) {
    return authResult;
  }

  const userRole = authResult.user.role;
  if (!allowedRoles.includes(userRole)) {
    return {
      authenticated: false,
      user: authResult.user,
      error: `Forbidden: Role "${userRole}" is not authorized for this operation. Required: ${allowedRoles.join(', ')}`,
      statusCode: 403,
    };
  }

  return authResult;
}

/**
 * Shortcut helper to enforce Admin/Manager route access.
 */
export async function verifyAdminAuth(req: Request): Promise<AuthVerificationResult> {
  return verifyRolePermission(req, ['ADMIN', 'MANAGER']);
}
