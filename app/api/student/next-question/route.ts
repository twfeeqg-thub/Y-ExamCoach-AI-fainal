import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedQuestion } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectCode = searchParams.get('subjectCode');

    if (!studentId || !subjectCode) {
      return NextResponse.json(
        { success: false, error: 'studentId and subjectCode are required' },
        { status: 400 }
      );
    }

    const question = await getRecommendedQuestion(studentId, subjectCode);

    if (!question) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No recommended question available. The student has mastered all targeted objectives or has no tracked mastery yet.',
      });
    }

    const qText = question.questionText || (question as any).question_text || '';
    return NextResponse.json({
      success: true,
      data: {
        ...question,
        questionText: qText,
        question_text: qText,
      },
    });
  } catch (error: any) {
    console.error('API /api/student/next-question GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch recommended question' },
      { status: 500 }
    );
  }
}