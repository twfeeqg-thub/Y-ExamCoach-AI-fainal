import { NextRequest, NextResponse } from 'next/server';
import { syncGamificationWithDB, getStudentGamification } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
    }
    const data = await getStudentGamification(studentId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, state } = body;

    if (!studentId || !state) {
      return NextResponse.json(
        { success: false, error: 'Student ID and state are required' },
        { status: 400 }
      );
    }

    await syncGamificationWithDB(studentId, state);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync gamification' },
      { status: 500 }
    );
  }
}
