import { NextRequest, NextResponse } from 'next/server';
import { getLessons, insertLessons, deleteLesson } from '@/lib/db';
import { validateLessonInput, validateLessonList } from '@/lib/lessonValidator';
import { LessonInput } from '@/types/index';

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

    const { validLessons, failedCount, errors } = validateLessonList(rawList);

    if (validLessons.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'فشل التحقق من صيغة الدروس المرسلة',
          details: errors,
        },
        { status: 422 }
      );
    }

    const result = await insertLessons(validLessons);

    return NextResponse.json(
      {
        success: true,
        inserted: result.inserted,
        failedCount,
        lessons: result.lessons,
        validationWarnings: errors.length > 0 ? errors : undefined,
        message:
          failedCount > 0
            ? `تم حفظ ${result.inserted} درس بنجاح مع تخطي ${failedCount} بسبب عدم توافق البيانات`
            : `تم حفظ وتحديث ${result.inserted} درس بنجاح`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /api/lessons POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء معالجة وحفظ الدروس في جدول smart_exam_engine.lessons',
        details: error.detail || error.message || String(error),
      },
      { status: 500 }
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
