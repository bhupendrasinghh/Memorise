import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/db';
import { hashPassword, signToken, setSessionCookie } from '@/lib/auth';
import { User } from '@/lib/types';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      dailyStudyTargetMinutes: 120,
      streakDays: 1,
      lastActiveDate: todayStr,
      createdAt: todayStr,
    };

    createUser(newUser);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        streakDays: newUser.streakDays,
        dailyStudyTargetMinutes: newUser.dailyStudyTargetMinutes,
        lastActiveDate: newUser.lastActiveDate,
        createdAt: newUser.createdAt,
      },
      token,
    }, { status: 201 });

    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
