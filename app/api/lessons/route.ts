import { NextRequest, NextResponse } from 'next/server';
import {
  getLessons,
  insertLessons,
  deleteLesson,
  validateStrictLessonFields,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const gradeParam = searchParams.get('grade');
    const grade = gradeParam ? parseInt(gradeParam, 10) : undefined;
    const section = searchParams.get('section') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const lessons = await getLessons({
      subject,
      grade,
      section,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: lessons.length,
      lessons,
    });
  } catch (error: any) {
    console.error('API /api/lessons GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل في استرجاع الدروس',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let rawList: any[] = [];
    if (Array.isArray(body)) {
      rawList = body;
    } else if (Array.isArray(body.lessons)) {
      rawList = body.lessons;
    } else if (body.lesson && typeof body.lesson === 'object') {
      rawList = [body.lesson];
    } else if (typeof body === 'object') {
      rawList = [body];
    }

    if (rawList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لم يتم إرسال أي محتوى للدرس',
        },
        { status: 400 }
      );
    }

    // Strict validation without silent defaults
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const validationError = validateStrictLessonFields(item, rawList.length > 1 ? i + 1 : undefined);
      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: validationError,
            fieldError: validationError,
            lessonIndex: i + 1,
          },
          { status: 400 }
        );
      }
    }

    // Direct clean fields mapping without synthesizing fake defaults
    const cleanLessons = rawList.map((raw) => ({
      id: raw.id ? String(raw.id).trim() : undefined,
      subject: String(raw.subject).trim(),
      grade: Number(raw.grade),
      section: raw.section ? String(raw.section).trim() : null,
      unit_title: raw.unit_title ?? raw.unitTitle ? String(raw.unit_title ?? raw.unitTitle).trim() : null,
      unit_order: Number(raw.unit_order ?? raw.unitOrder) || 1,
      lesson_title: String(raw.lesson_title ?? raw.lessonTitle).trim(),
      lesson_order: Number(raw.lesson_order ?? raw.lessonOrder) || 1,
      learning_objective_codes: Array.isArray(raw.learning_objective_codes ?? raw.learningObjectiveCodes)
        ? (raw.learning_objective_codes ?? raw.learningObjectiveCodes)
        : (raw.learning_objective_codes ?? raw.learningObjectiveCodes ? String(raw.learning_objective_codes ?? raw.learningObjectiveCodes).split(',').map((s: string) => s.trim()) : []),
      estimated_reading_time_minutes: Number(raw.estimated_reading_time_minutes ?? raw.estimatedReadingTimeMinutes) || 10,
      content_json: raw.content_json ?? raw.content,
      media_resources: raw.media_resources ?? raw.mediaResources ?? { audio: [], video: [], attachments: [] },
    }));

    const result = await insertLessons(cleanLessons);

    return NextResponse.json(
      {
        success: true,
        inserted: result.inserted,
        lessons: result.lessons,
        message: `تم حفظ وحقن ${result.inserted} درس بنجاح في جدول smart_exam_engine.lessons`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /api/lessons POST error:', error);
    const status = error.message && error.message.includes('الحقل مفقود') ? 400 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء معالجة وحفظ الدروس في جدول smart_exam_engine.lessons',
        details: error.detail || error.message || String(error),
      },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الدرس (id) مطلوب للحذف' },
        { status: 400 }
      );
    }

    const success = await deleteLesson(id);
    return NextResponse.json({
      success,
      message: success ? 'تم حذف الدرس بنجاح' : 'الدرس غير موجود',
    });
  } catch (error: any) {
    console.error('API /api/lessons DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'فشل في حذف الدرس' },
      { status: 500 }
    );
  }
}
