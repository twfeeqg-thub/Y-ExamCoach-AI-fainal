import { NextRequest, NextResponse } from 'next/server';
import {
  listQuestions,
  insertQuestion,
  deleteQuestion,
  deleteAllQuestions,
  validateStrictQuestionFields,
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

    let rawList: any[] = [];
    if (Array.isArray(body)) {
      rawList = body;
    } else if (Array.isArray(body.questions)) {
      rawList = body.questions;
    } else if (body.question && typeof body.question === 'object') {
      rawList = [body.question];
    } else if (typeof body === 'object') {
      rawList = [body];
    }

    if (rawList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم إرسال أي أسئلة في الطلب' },
        { status: 400 }
      );
    }

    // Strict validation without silent defaults
    for (let i = 0; i < rawList.length; i++) {
      const q = rawList[i];
      const validationError = validateStrictQuestionFields(q, rawList.length > 1 ? i + 1 : undefined);
      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: validationError,
            fieldError: validationError,
            itemIndex: i + 1,
          },
          { status: 400 }
        );
      }
    }

    // Direct injection into smart_exam_engine.questions
    const results = [];
    for (const q of rawList as QuestionInput[]) {
      const item = await insertQuestion(fileId, q);
      results.push(item);
    }

    return NextResponse.json(
      {
        success: true,
        count: results.length,
        data: results.length === 1 ? results[0] : results,
        message: `تم إدراج وحقن ${results.length} سؤال بنجاح في جدول smart_exam_engine.questions`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /api/questions POST error:', error);
    const status = error.message && error.message.includes('الحقل مفقود') ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل في إدراج وحفظ السؤال في جدول smart_exam_engine.questions',
      },
      { status }
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
