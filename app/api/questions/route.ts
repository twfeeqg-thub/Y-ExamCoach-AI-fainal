import { NextRequest, NextResponse } from 'next/server';
import {
  listQuestions,
  insertQuestion,
  deleteQuestion,
  deleteAllQuestions,
} from '@/lib/db';
import { QuestionInput } from '@/types/index';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const questions = await listQuestions(fileId, limit, offset);
    return NextResponse.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error: any) {
    console.error('API /api/questions GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fileId = body.fileId || null;

    if (Array.isArray(body.questions)) {
      const results = [];
      for (const q of body.questions as QuestionInput[]) {
        const item = await insertQuestion(fileId, q);
        results.push(item);
      }
      return NextResponse.json(
        { success: true, count: results.length, data: results },
        { status: 201 }
      );
    } else {
      const qInput: QuestionInput = body.question || body;
      if (!qInput.questionText || !qInput.optionA || !qInput.optionB || !qInput.correctOption) {
        return NextResponse.json(
          { success: false, error: 'Missing required question fields' },
          { status: 400 }
        );
      }
      const item = await insertQuestion(fileId, qInput);
      return NextResponse.json({ success: true, data: item }, { status: 201 });
    }
  } catch (error: any) {
    console.error('API /api/questions POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to insert question(s)' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      await deleteAllQuestions();
      return NextResponse.json({
        success: true,
        message: 'All questions deleted successfully',
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required unless all=true' },
        { status: 400 }
      );
    }

    const deleted = await deleteQuestion(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('API /api/questions DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete question(s)' },
      { status: 500 }
    );
  }
}
