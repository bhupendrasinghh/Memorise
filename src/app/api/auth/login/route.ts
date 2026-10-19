import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/db';
import { verifyPassword, signToken, setSessionCookie } from '@/lib/auth';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = findUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({
        error: 'No account found with this email. Please check spelling or create an account.',
      }, { status: 404 });
    }

    // Special allowance for demo and primary account default
    const isDemo = cleanEmail === 'demo@memorise.app' && (password === 'password123' || cleanPassword === 'password123');
    const isPrimaryDefault = cleanEmail === 'bhupendrasingh952891@gmail.com' && (password === 'password123' || cleanPassword === 'password123');
    let isMatch = isDemo || isPrimaryDefault;

    if (!isMatch) {
      // Try exact password, then trimmed password
      isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch && cleanPassword !== password) {
        isMatch = await verifyPassword(cleanPassword, user.passwordHash);
      }
    }

    if (!isMatch) {
      return NextResponse.json({
        error: 'Incorrect password for this email. Use "Forgot / Reset Password" if you need to set a new one.',
      }, { status: 401 });
    }

    // Update streak if active today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let newStreak = user.streakDays || 1;

    if (user.lastActiveDate) {
      const diff = differenceInCalendarDays(new Date(), parseISO(user.lastActiveDate));
      if (diff === 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1;
      }
    }

    updateUser(user.id, {
      streakDays: newStreak,
      lastActiveDate: todayStr,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        streakDays: newStreak,
        dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
        lastActiveDate: todayStr,
        createdAt: user.createdAt,
      },
      token,
    });

    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
