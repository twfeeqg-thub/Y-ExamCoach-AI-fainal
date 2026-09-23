import { NextRequest, NextResponse } from 'next/server';
import { recordStudentResponse } from '@/lib/db';
import { CorrectOption } from '@/types/index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, questionId, selectedOption, isCorrect, timeTakenSeconds, hintUsed } = body;

    if (!studentId || !questionId || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'studentId, questionId and isCorrect are required' },
        { status: 400 }
      );
    }

    const result = await recordStudentResponse(studentId, questionId, {
      selectedOption: (selectedOption as CorrectOption | null) ?? null,
      isCorrect,
      timeTakenSeconds: typeof timeTakenSeconds === 'number' ? timeTakenSeconds : null,
      hintUsed: typeof hintUsed === 'boolean' ? hintUsed : false,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/student/response POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record student response' },
      { status: 500 }
    );
  }
}