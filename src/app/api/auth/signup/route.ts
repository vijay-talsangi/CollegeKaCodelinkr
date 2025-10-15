import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabaseServer';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, prn, rollNumber } = body;

    if (!name || !email || !password || !prn || !rollNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser.data) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const existingPRN = await supabaseServer
      .from('students')
      .select('id')
      .eq('prn', prn)
      .maybeSingle();

    if (existingPRN.data) {
      return NextResponse.json(
        { error: 'PRN already exists' },
        { status: 400 }
      );
    }

    const existingRollNumber = await supabaseServer
      .from('students')
      .select('id')
      .eq('roll_number', rollNumber)
      .maybeSingle();

    if (existingRollNumber.data) {
      return NextResponse.json(
        { error: 'Roll number already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role: 'student',
      })
      .select()
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const { error: studentError } = await supabaseServer
      .from('students')
      .insert({
        id: user.id,
        prn,
        roll_number: rollNumber,
      });

    if (studentError) {
      await supabaseServer.from('users').delete().eq('id', user.id);
      return NextResponse.json(
        { error: 'Failed to create student profile' },
        { status: 500 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: 'student',
      name: user.name,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
