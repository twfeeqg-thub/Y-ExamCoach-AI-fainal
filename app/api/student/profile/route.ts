import { NextRequest, NextResponse } from 'next/server';
import { saveStudentProfile } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, grade, section, governorate, targetSubject } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'student id is required' },
        { status: 400 }
      );
    }

    const profile = await saveStudentProfile({
      id,
      grade: grade ?? 12,
      section: section ?? null,
      governorate: governorate ?? null,
      targetSubject: targetSubject ?? null,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('API /api/student/profile POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save student profile' },
      { status: 500 }
    );
  }
}
