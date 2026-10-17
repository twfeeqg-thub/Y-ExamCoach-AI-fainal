import { NextRequest, NextResponse } from 'next/server';
import { getStudentMasteryStates } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectCode = searchParams.get('subjectCode') || undefined;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const list = await getStudentMasteryStates(studentId, subjectCode);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    console.error('API /api/student/mastery GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch student mastery states' },
      { status: 500 }
    );
  }
}
