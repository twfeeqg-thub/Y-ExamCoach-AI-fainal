import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedQuestion, listQuestions } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 'adaptive-student-1';
    const subject = searchParams.get('subject') || searchParams.get('subjectCode') || 'الرياضيات';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Try recommended adaptive question first
    const recommended = await getRecommendedQuestion(studentId, subject);

    if (recommended) {
      const qText = recommended.questionText || (recommended as any).question_text || '';
      return NextResponse.json({
        success: true,
        data: {
          ...recommended,
          questionText: qText,
          question_text: qText,
        },
      });
    }

    // Fallback: list questions for this subject
    const allQuestions = await listQuestions(undefined, limit);
    const filtered = allQuestions.filter(
      (q) => !subject || q.subject === subject || q.subject === 'عام'
    );

    const mapped = (filtered.length > 0 ? filtered : allQuestions).map((q) => {
      const qText = q.questionText || (q as any).question_text || '';
      return {
        ...q,
        questionText: qText,
        question_text: qText,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped.length === 1 ? mapped[0] : mapped,
      total: mapped.length,
    });
  } catch (error: any) {
    console.error('API /api/adaptive-test GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve adaptive test questions' },
      { status: 500 }
    );
  }
}
