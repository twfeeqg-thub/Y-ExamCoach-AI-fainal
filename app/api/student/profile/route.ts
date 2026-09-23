import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { StudentProfile, StudentProfileRow } from '@/types/index';

function mapRowToProfile(row: StudentProfileRow): StudentProfile {
  return {
    id: row.id,
    grade: row.grade,
    section: row.section,
    governorate: row.governorate,
    targetSubject: row.target_subject,
    createdAt: row.created_at,
  };
}

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

    const sql = `
      INSERT INTO smart_exam_engine.student_profiles (
        id, grade, section, governorate, target_subject
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        grade = EXCLUDED.grade,
        section = COALESCE(EXCLUDED.section, smart_exam_engine.student_profiles.section),
        governorate = COALESCE(EXCLUDED.governorate, smart_exam_engine.student_profiles.governorate),
        target_subject = COALESCE(EXCLUDED.target_subject, smart_exam_engine.student_profiles.target_subject)
      RETURNING *;
    `;

    const res = await query(sql, [
      id,
      grade ?? 12,
      section ?? null,
      governorate ?? null,
      targetSubject ?? null,
    ]);

    return NextResponse.json({
      success: true,
      data: mapRowToProfile(res.rows[0] as StudentProfileRow),
    });
  } catch (error: any) {
    console.error('API /api/student/profile POST error:', error);
    if (String(error.message).includes('DATABASE_IN_MEMORY_FALLBACK')) {
      const body = await request.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        data: {
          id: body.id || null,
          grade: body.grade ?? 12,
          section: body.section ?? null,
          governorate: body.governorate ?? null,
          targetSubject: body.targetSubject ?? null,
        },
      });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save student profile' },
      { status: 500 }
    );
  }
}