import { NextRequest, NextResponse } from 'next/server';
import { syncGamificationWithDB } from '@/lib/db';

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

    const success = await syncGamificationWithDB(studentId, state);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('API /api/student/gamification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync gamification' },
      { status: 500 }
    );
  }
}
