import { Pool, QueryResult } from 'pg';
import { createHash } from 'crypto';
import {
  Question,
  QuestionRow,
  UploadedFile,
  UploadedFileRow,
  FileInput,
  QuestionInput,
  CorrectOption,
  MasteryState,
  MasteryStateRow,
  StudentResponse,
  StudentResponseRow,
  StudentProfile,
  StudentProfileRow,
  Grade,
  Section,
  QuestionType,
  Difficulty,
  AssessmentContext,
  Lesson,
  LessonRow,
  LessonInput,
  LessonContent,
  LessonMediaResources,
  mapQuestionRowToQuestion,
  mapUploadedFileRowToFile,
  mapLessonRowToLesson,
  StudentGamificationState,
} from '../types/index';

// ---------------------------------------------------------------------------
// 1. PostgreSQL Connection Pool Setup
// ---------------------------------------------------------------------------

const rawDbUrl = process.env.DATABASE_URL?.trim();
const isLocalhost = !rawDbUrl || rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1');

export const pool: Pool | null = !isLocalhost && rawDbUrl
  ? new Pool({
      connectionString: rawDbUrl,
      ssl: process.env.NODE_ENV === 'production' || rawDbUrl.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 3000,
    })
  : null;

let isInMemoryFallback = !pool;

// ---------------------------------------------------------------------------
// In-Memory Database Storage Fallback
// ---------------------------------------------------------------------------

const memFiles: UploadedFile[] = [
  {
    id: 'f101-sample-uuid',
    name: 'اختبار_الرياضيات_النموذجي_الثانوية_العامة_2024.pdf',
    size: 2458000,
    fileType: 'pdf',
    previewUrl: null,
    grade: '12',
    section: 'علمي',
    subject: 'الرياضيات',
    status: 'completed',
    progress: 100,
    step: 'completed',
    examYear: 2024,
    governorate: 'المركزية',
    extractedQuestionsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const memMasteryStates: MasteryState[] = [];

const memStudentResponses: StudentResponse[] = [];

const memStudentProfiles: StudentProfile[] = [];

const memStudentGamification: Record<string, StudentGamificationState> = {};

const memQuestions: Question[] = [
  {
    id: 'q101-math-sample',
    fileId: 'f101-sample-uuid',
    fileName: 'اختبار_الرياضيات_النموذجي_الثانوية_العامة_2024.pdf',
    questionText: 'ما هي قيمة النهاية lim (x -> 0) [sin(3x) / x] ؟',
    questionType: 'multiple_choice',
    optionA: '0',
    optionB: '1',
    optionC: '3',
    optionD: 'غير موجودة',
    correctOption: 'C',
    grade: 12,
    section: 'علمي',
    subject: 'الرياضيات',
    unit: 'التفاضل والتكامل',
    lesson: 'نهايات الدوال المثلثية',
    learningObjectiveCode: 'MATH-12-CALC-01',
    estimatedDifficulty: 'medium',
    pValue: 0.65,
    discriminationIndex: 0.42,
    distractorEfficiency: {
      A: 'مشتت ضعيف اختيار من لم ينتبه للمكافئ',
      B: 'مشتت شائك يفترض الخلط بين القانون الأساسي والمضاعف',
      D: 'مشتت ينجم عن عدم استكمال حل المسألة',
    },
    expectedTime: 90,
    averageSolveTime: 85,
    enemyQuestions: [],
    relativeQuestions: [],
    assessmentContext: 'summative',
    hint: 'استخدم النظرية الخاصة بنهاية sin(ax)/x عندما x تؤول إلى صفر.',
    correctExplanation: 'بتطبيق نظرية نهايات الدوال المثلثية: lim (x -> 0) sin(ax)/x = a. وبالتالي مع a = 3 تكون القيمة مساوية 3.',
    wrongExplanations: {
      A: 'إجابة خاطئة. التعويض المباشر يعطي صيغة غير معينة (0/0) ولا تعطي 0.',
      B: 'إجابة خاطئة. قد تكون افترضت أن القيمة هي 1 بناء على lim sin(x)/x دون ضرب المعامل 3.',
      D: 'إجابة خاطئة. النهاية موجودة وتساوي 3 طبقاً للنظرية المباشرة.',
    },
    source: 'امتحان الثانوية العامة 2024',
    examYear: 2024,
    governorate: 'المركزية',
    reviewStatus: 'approved',
    contentVersion: 1,
    normalizedTextHash: 'hash-sample-101',
    repetitionCount: 3,
    examYears: [2018, 2021, 2024],
    isDuplicate: false,
    status: 'inserted',
  },
  {
    id: 'q102-phys-sample',
    fileId: 'f101-sample-uuid',
    fileName: 'اختبار_الرياضيات_النموذجي_الثانوية_العامة_2024.pdf',
    questionText: 'إذا تضاعفت شدة التيار الكهربائي المار في موصل أومي ثابت المقاومة، فإن القدرة المستهلكة فيه تتضاعف بمقدار:',
    questionType: 'multiple_choice',
    optionA: 'مرتين (2)',
    optionB: 'ثلاث مرات (3)',
    optionC: 'أربع مرات (4)',
    optionD: 'تبقى ثابتة',
    correctOption: 'C',
    grade: 12,
    section: 'علمي',
    subject: 'الفيزياء',
    unit: 'التيار الكهربائي والمقاومة',
    lesson: 'قانون أوم والقدرة الكهربائية',
    learningObjectiveCode: 'PHYS-12-ELEC-04',
    estimatedDifficulty: 'easy',
    pValue: 0.82,
    discriminationIndex: 0.51,
    distractorEfficiency: {
      A: 'مشتت خطي خطأ ناتج عن افتراض التناسب الخطي المباشر مع شدة التيار',
      B: 'عنصر عشوائي',
      D: 'مشتت ينجم عن الخلط بين المقاومة الثابتة والقدرة',
    },
    expectedTime: 60,
    averageSolveTime: 52,
    enemyQuestions: [],
    relativeQuestions: [],
    assessmentContext: 'formative',
    hint: 'تذكر قانون القدرة المستهلكة في المقاومة الأومية بدلالة شدة التيار والمقاومة P = I^2 * R.',
    correctExplanation: 'العلاقة بين القدرة وشدة التيار هي علاقة تربيعية (P = I^2 * R). عند مضاعفة I إلى 2I، فإن القدرة الجديدة P\' = (2I)^2 * R = 4 * I^2 * R = 4P.',
    wrongExplanations: {
      A: 'إجابة خاطئة. هذا الاعتقاد يسقط التناسب التربيعي لشدة التيار في قانون القدرة.',
      B: 'إجابة خاطئة. لا توجد علاقة تكعيبية في هذا القانون.',
      D: 'إجابة خاطئة. المقاومة هي الثابتة وليست القدرة المستهلكة.',
    },
    source: 'المدرب الذكي - بنك الأسئلة المعياري',
    examYear: 2024,
    governorate: 'المركزية',
    reviewStatus: 'approved',
    contentVersion: 1,
    normalizedTextHash: 'hash-sample-102',
    repetitionCount: 1,
    examYears: [2024],
    isDuplicate: false,
    status: 'inserted',
  },
  {
    id: 'q103-chem-sample',
    fileId: 'f101-sample-uuid',
    fileName: 'اختبار_الرياضيات_النموذجي_الثانوية_العامة_2024.pdf',
    questionText: 'أي من العناصر التالية يمتلك أعلى طاقة تأين أولى في الدورة الثالثة من الجدول الدوري؟',
    questionType: 'multiple_choice',
    optionA: 'الصوديوم (Na)',
    optionB: 'الألومنيوم (Al)',
    optionC: 'السيليكون (Si)',
    optionD: 'الأرجون (Ar)',
    correctOption: 'D',
    grade: 12,
    section: 'علمي',
    subject: 'الكيمياء',
    unit: 'البناء الإلكتروني والجدول الدوري',
    lesson: 'الخواص الدورية للعناصر',
    learningObjectiveCode: 'CHEM-12-PER-02',
    estimatedDifficulty: 'medium',
    pValue: 0.71,
    discriminationIndex: 0.38,
    distractorEfficiency: {
      A: 'مشتت عكسي بسبب التخليط بين نصف القطر وطاقة التأين',
    },
    expectedTime: 60,
    averageSolveTime: 58,
    enemyQuestions: [],
    relativeQuestions: [],
    assessmentContext: 'summative',
    hint: 'تزداد طاقة التأين بشكل عام عبر الدورة الواحدة من اليسار إلى اليمين بسبب زيادة الشحنة الموجبة النواة الفعالة.',
    correctExplanation: 'الأرجون (Ar) غاز خامل يقع في نهاية الدورة الثالثة، ويمتلك غلافاً إلكترونياً مكتملاً وشحنة نواة فعالة عالية، مما يمنحه أعلى طاقة تأين أولى في دورته.',
    wrongExplanations: {
      A: 'إجابة خاطئة. الصوديوم يمتلك أدنى طاقة تأين أولى في الدورة الثالثة لأنه يفقد إلكترونه بسهولة.',
      B: 'إجابة خاطئة. الألومنيوم طاقة تأينه أعلى من الصوديوم لكنها أقل بكثير من الأرجون.',
      C: 'إجابة خاطئة. السيليكون شبه فلز في منتصف الدورة، طاقة تأينه متوسطة.',
    },
    source: 'الوزاري الموحد 2024',
    examYear: 2024,
    governorate: 'المركزية',
    reviewStatus: 'approved',
    contentVersion: 1,
    normalizedTextHash: 'hash-sample-103',
    repetitionCount: 2,
    examYears: [2022, 2024],
    isDuplicate: false,
    status: 'inserted',
  },
];

/**
 * Safe SQL Query runner with direct PostgreSQL execution and graceful fallback.
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  if (!pool || isInMemoryFallback) {
    throw new Error('DATABASE_IN_MEMORY_FALLBACK');
  }

  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error: any) {
    console.warn(`[Database] PostgreSQL query error (${error.message || 'connection failed'}). Switching to in-memory fallback.`);
    isInMemoryFallback = true;
    throw error;
  }
}

let isSchemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (isSchemaInitialized || !pool || isInMemoryFallback) return;

  const schemaSql = `
    CREATE SCHEMA IF NOT EXISTS smart_exam_engine;

    CREATE TABLE IF NOT EXISTS smart_exam_engine.uploaded_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      size BIGINT NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      preview_url TEXT,
      grade VARCHAR(10),
      section VARCHAR(50),
      subject VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      progress INT NOT NULL DEFAULT 0,
      step VARCHAR(100) DEFAULT 'ready',
      exam_year INT,
      governorate VARCHAR(100),
      extracted_questions_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS smart_exam_engine.questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID REFERENCES smart_exam_engine.uploaded_files(id) ON DELETE SET NULL,
      file_name VARCHAR(255),
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT,
      option_d TEXT,
      correct_option VARCHAR(10) NOT NULL,
      grade INT NOT NULL DEFAULT 12,
      section VARCHAR(50) NOT NULL DEFAULT 'علمي',
      subject VARCHAR(100) NOT NULL DEFAULT 'عام',
      unit VARCHAR(100) NOT NULL DEFAULT 'الوحدة الأولى',
      lesson VARCHAR(100) NOT NULL DEFAULT 'الدرس الأول',
      learning_objective_code VARCHAR(100),
      estimated_difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
      p_value NUMERIC(5, 2),
      discrimination_index NUMERIC(5, 2),
      distractor_efficiency JSONB,
      expected_time INT NOT NULL DEFAULT 60,
      average_solve_time NUMERIC(6, 2),
      enemy_questions TEXT[] DEFAULT '{}',
      relative_questions TEXT[] DEFAULT '{}',
      assessment_context VARCHAR(50) NOT NULL DEFAULT 'summative',
      hint TEXT,
      correct_explanation TEXT NOT NULL,
      wrong_explanations JSONB,
      source VARCHAR(255) DEFAULT 'تطبيق المدرب الذكي',
      exam_year INT NOT NULL DEFAULT 2026,
      governorate VARCHAR(100) DEFAULT 'المركزية',
      review_status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
      content_version INT NOT NULL DEFAULT 1,
      normalized_text_hash VARCHAR(64) UNIQUE,
      repetition_count INT NOT NULL DEFAULT 1,
      exam_years INT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE smart_exam_engine.questions ADD COLUMN IF NOT EXISTS repetition_count INT NOT NULL DEFAULT 1;
    ALTER TABLE smart_exam_engine.questions ADD COLUMN IF NOT EXISTS exam_years INT[] DEFAULT '{}';
    ALTER TABLE smart_exam_engine.questions ADD COLUMN IF NOT EXISTS bloom_taxonomy VARCHAR(100);

    CREATE TABLE IF NOT EXISTS smart_exam_engine.student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      grade INT NOT NULL CHECK (grade IN (9, 12)),
      section TEXT,
      governorate TEXT,
      target_subject TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS smart_exam_engine.student_gamification (
      student_id TEXT PRIMARY KEY,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      current_streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      unlocked_badges TEXT[] DEFAULT '{}',
      last_active_date DATE,
      total_correct INT DEFAULT 0,
      completed_lesson_ids TEXT[] DEFAULT '{}',
      subject_counts JSONB DEFAULT '{}'::jsonb,
      max_mastery_score NUMERIC(5, 2) DEFAULT 0.00,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS smart_exam_engine.mastery_states (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES smart_exam_engine.student_profiles(id) ON DELETE CASCADE,
      learning_objective_code TEXT NOT NULL,
      mastery_score NUMERIC(5, 2) DEFAULT 0.00,
      consecutive_correct INT DEFAULT 0,
      last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, learning_objective_code)
    );

    CREATE TABLE IF NOT EXISTS smart_exam_engine.student_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES smart_exam_engine.student_profiles(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES smart_exam_engine.questions(id) ON DELETE CASCADE,
      learning_objective_code TEXT,
      selected_option VARCHAR(1),
      is_correct BOOLEAN NOT NULL,
      time_taken_seconds INT,
      hint_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS smart_exam_engine.lessons (
      id TEXT PRIMARY KEY,
      grade INT NOT NULL CHECK (grade IN (9, 12)),
      section TEXT,
      subject TEXT NOT NULL,
      unit_title TEXT,
      unit_order INT DEFAULT 1,
      lesson_title TEXT NOT NULL,
      lesson_order INT DEFAULT 1,
      learning_objective_codes TEXT[],
      estimated_reading_time_minutes INT DEFAULT 10,
      content_json JSONB NOT NULL,
      media_resources JSONB DEFAULT '{"audio":[],"video":[],"attachments":[]}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'smart_exam_engine' 
          AND table_name = 'lessons' 
          AND column_name = 'id' 
          AND data_type = 'uuid'
      ) THEN
        ALTER TABLE smart_exam_engine.lessons ALTER COLUMN id TYPE TEXT;
      END IF;
    END $$;
  `;

  try {
    await query(schemaSql);
    isSchemaInitialized = true;
  } catch (err: any) {
    console.warn(`[ensureSchema] Notice: Database schema initialization skipped or failed (${err.message}). Using in-memory store.`);
    isInMemoryFallback = true;
  }
}

// Arabic Text Sanitization & SHA-256 Engine
export function sanitizeArabicText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text;
  sanitized = sanitized.replace(/[\u064B-\u065F]/g, ''); // Tashkeel
  sanitized = sanitized.replace(/\u0640/g, ''); // Tatweel
  sanitized = sanitized.replace(/[أإآ]/g, 'ا');
  sanitized = sanitized.replace(/[ىي]/g, 'ي');
  sanitized = sanitized.replace(/[ةه]/g, 'ه');
  sanitized = sanitized.replace(/[؟!?!.,،:;'"()\[\]\\/<>_-]/g, ' ');
  return sanitized.replace(/\s+/g, ' ').trim();
}

export function computeSHA256(input: string): string {
  if (!input) return '';
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// File Operations
// ---------------------------------------------------------------------------

export async function listFiles(limit: number = 50, offset: number = 0): Promise<UploadedFile[]> {
  if (isInMemoryFallback) {
    return memFiles.slice(offset, offset + limit);
  }
  try {
    await ensureSchema();
    const sql = `
      SELECT * FROM smart_exam_engine.uploaded_files
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const res = await query(sql, [limit, offset]);
    return res.rows.map((row: UploadedFileRow) => mapUploadedFileRowToFile(row));
  } catch {
    isInMemoryFallback = true;
    return memFiles.slice(offset, offset + limit);
  }
}

export async function getFileById(id: string): Promise<UploadedFile | null> {
  if (isInMemoryFallback) {
    return memFiles.find((f) => f.id === id) || null;
  }
  try {
    await ensureSchema();
    const sql = `SELECT * FROM smart_exam_engine.uploaded_files WHERE id = $1;`;
    const res = await query(sql, [id]);
    if (res.rowCount === 0) return null;
    return mapUploadedFileRowToFile(res.rows[0] as UploadedFileRow);
  } catch {
    isInMemoryFallback = true;
    return memFiles.find((f) => f.id === id) || null;
  }
}

export async function insertFile(fileData: FileInput): Promise<UploadedFile> {
  if (isInMemoryFallback) {
    const newFile: UploadedFile = {
      id: (fileData as any).id || 'f-' + Math.random().toString(36).substring(2, 9),
      name: fileData.name,
      size: fileData.size,
      fileType: fileData.fileType,
      previewUrl: fileData.previewUrl || null,
      grade: fileData.grade || '12',
      section: fileData.section || 'علمي',
      subject: fileData.subject || 'الرياضيات',
      status: 'pending',
      progress: 0,
      step: 'ready',
      examYear: fileData.examYear || 2024,
      governorate: fileData.governorate || 'المركزية',
      extractedQuestionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memFiles.unshift(newFile);
    return newFile;
  }
  try {
    await ensureSchema();
    const sql = `
      INSERT INTO smart_exam_engine.uploaded_files (
        name, size, file_type, grade, section, subject,
        exam_year, governorate, status, progress, step, preview_url, extracted_questions_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *;
    `;
    const values = [
      fileData.name,
      fileData.size,
      fileData.fileType,
      fileData.grade || null,
      fileData.section || null,
      fileData.subject || null,
      fileData.examYear || null,
      fileData.governorate || null,
      'pending',
      0,
      'ready',
      fileData.previewUrl || null,
      0,
    ];
    const res = await query(sql, values);
    return mapUploadedFileRowToFile(res.rows[0] as UploadedFileRow);
  } catch {
    isInMemoryFallback = true;
    return insertFile(fileData);
  }
}

export async function updateFileMetadata(
  id: string,
  data: Partial<UploadedFile>
): Promise<UploadedFile | null> {
  if (isInMemoryFallback) {
    const file = memFiles.find((f) => f.id === id);
    if (!file) return null;
    Object.assign(file, data, { updatedAt: new Date().toISOString() });
    return file;
  }
  try {
    await ensureSchema();
    const fields: string[] = [];
    const values: any[] = [id];
    let idx = 2;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
    if (data.progress !== undefined) { fields.push(`progress = $${idx++}`); values.push(data.progress); }
    if (data.step !== undefined) { fields.push(`step = $${idx++}`); values.push(data.step); }
    if (data.extractedQuestionsCount !== undefined) { fields.push(`extracted_questions_count = $${idx++}`); values.push(data.extractedQuestionsCount); }
    if (data.grade !== undefined) { fields.push(`grade = $${idx++}`); values.push(data.grade); }
    if (data.section !== undefined) { fields.push(`section = $${idx++}`); values.push(data.section); }
    if (data.subject !== undefined) { fields.push(`subject = $${idx++}`); values.push(data.subject); }
    if (data.examYear !== undefined) { fields.push(`exam_year = $${idx++}`); values.push(data.examYear); }
    if (data.governorate !== undefined) { fields.push(`governorate = $${idx++}`); values.push(data.governorate); }

    if (fields.length === 0) return getFileById(id);

    fields.push(`updated_at = NOW()`);
    const sql = `UPDATE smart_exam_engine.uploaded_files SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await query(sql, values);
    if (res.rowCount === 0) return null;
    return mapUploadedFileRowToFile(res.rows[0] as UploadedFileRow);
  } catch {
    isInMemoryFallback = true;
    return updateFileMetadata(id, data);
  }
}

export async function deleteFile(id: string): Promise<boolean> {
  if (isInMemoryFallback) {
    const idx = memFiles.findIndex((f) => f.id === id);
    if (idx !== -1) {
      memFiles.splice(idx, 1);
      return true;
    }
    return false;
  }
  try {
    await ensureSchema();
    const sql = `DELETE FROM smart_exam_engine.uploaded_files WHERE id = $1;`;
    const res = await query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  } catch {
    isInMemoryFallback = true;
    return deleteFile(id);
  }
}

// ---------------------------------------------------------------------------
// Question Operations
// ---------------------------------------------------------------------------

export async function listQuestions(
  fileId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Question[]> {
  if (isInMemoryFallback) {
    let result = fileId ? memQuestions.filter((q) => q.fileId === fileId) : memQuestions;
    return result.slice(offset, offset + limit);
  }
  try {
    await ensureSchema();
    let sql: string;
    let params: any[];

    if (fileId) {
      sql = `SELECT * FROM smart_exam_engine.questions WHERE file_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
      params = [fileId, limit, offset];
    } else {
      sql = `SELECT * FROM smart_exam_engine.questions ORDER BY created_at DESC LIMIT $1 OFFSET $2;`;
      params = [limit, offset];
    }

    const res = await query(sql, params);
    return res.rows.map((row: QuestionRow) => mapQuestionRowToQuestion(row));
  } catch {
    isInMemoryFallback = true;
    let result = fileId ? memQuestions.filter((q) => q.fileId === fileId) : memQuestions;
    return result.slice(offset, offset + limit);
  }
}

export function validateStrictQuestionFields(q: any, index?: number): string | null {
  const prefix = index !== undefined ? `السؤال رقم ${index}: ` : '';

  const text = q.question_text ?? q.questionText;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return `${prefix}الحقل مفقود: question_text (نص السؤال إلزامي)`;
  }

  const type = q.question_type ?? q.questionType;
  if (!type || typeof type !== 'string' || !type.trim()) {
    return `${prefix}الحقل مفقود: question_type (نوع السؤال إلزامي)`;
  }

  const optA = q.option_a ?? q.optionA;
  if (!optA || typeof optA !== 'string' || !optA.trim()) {
    return `${prefix}الحقل مفقود: option_a (الخيار أ إلزامي)`;
  }

  const optB = q.option_b ?? q.optionB;
  if (!optB || typeof optB !== 'string' || !optB.trim()) {
    return `${prefix}الحقل مفقود: option_b (الخيار ب إلزامي)`;
  }

  const rawCorrect = q.correct_option ?? q.correctOption;
  if (!rawCorrect || typeof rawCorrect !== 'string' || !rawCorrect.trim()) {
    return `${prefix}الحقل مفقود: correct_option (الخيار الصحيح إلزامي)`;
  }

  const normalizedCorrect = rawCorrect.trim().toUpperCase();
  const validOptions = ['A', 'B', 'C', 'D', 'أ', 'ب', 'ج', 'د'];
  if (!validOptions.includes(normalizedCorrect) && !validOptions.includes(rawCorrect.trim())) {
    return `${prefix}قيمة الحقل مخالفة للقيود: correct_option يجب أن يكون أحد الخيارات (A, B, C, D)`;
  }

  const explanation = q.correct_explanation ?? q.correctExplanation;
  if (!explanation || typeof explanation !== 'string' || !explanation.trim()) {
    return `${prefix}الحقل مفقود: correct_explanation (شرح الإجابة الصحيحة إلزامي)`;
  }

  const subject = q.subject;
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return `${prefix}الحقل مفقود: subject (المادة الدراسية إلزامية)`;
  }

  const grade = Number(q.grade);
  if (grade !== 9 && grade !== 12) {
    return `${prefix}قيمة الحقل مخالفة للقيود: grade يجب أن يكون الصف 9 أو 12`;
  }

  const section = q.section;
  if (!section || typeof section !== 'string' || !section.trim()) {
    return `${prefix}الحقل مفقود: section (القسم/الفرع إلزامي)`;
  }

  const unit = q.unit;
  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    return `${prefix}الحقل مفقود: unit (اسم أو رقم الوحدة إلزامي)`;
  }

  const lesson = q.lesson;
  if (!lesson || typeof lesson !== 'string' || !lesson.trim()) {
    return `${prefix}الحقل مفقود: lesson (اسم أو رقم الدرس إلزامي)`;
  }

  return null;
}

export async function insertQuestion(
  fileId: string | null,
  questionData: QuestionInput
): Promise<Question> {
  const validationError = validateStrictQuestionFields(questionData);
  if (validationError) {
    throw new Error(validationError);
  }

  const questionText = (questionData.question_text ?? questionData.questionText)!.trim();
  const cleanedText = sanitizeArabicText(questionText);
  const textHash = computeSHA256(cleanedText);

  const questionType = (questionData.question_type ?? questionData.questionType)!.trim();
  const optionA = (questionData.option_a ?? questionData.optionA)!.trim();
  const optionB = (questionData.option_b ?? questionData.optionB)!.trim();
  const optionC = (questionData.option_c ?? questionData.optionC)?.trim() || null;
  const optionD = (questionData.option_d ?? questionData.optionD)?.trim() || null;

  let rawCorrect = (questionData.correct_option ?? questionData.correctOption)!.trim().toUpperCase();
  if (rawCorrect === 'أ') rawCorrect = 'A';
  else if (rawCorrect === 'ب') rawCorrect = 'B';
  else if (rawCorrect === 'ج') rawCorrect = 'C';
  else if (rawCorrect === 'د') rawCorrect = 'D';
  const correctOption = rawCorrect as CorrectOption;

  const correctExplanation = (questionData.correct_explanation ?? questionData.correctExplanation)!.trim();
  const wrongExplanations = questionData.wrong_explanations ?? questionData.wrongExplanations ?? null;
  const subject = questionData.subject!.trim();
  const grade = Number(questionData.grade) as Grade;
  const section = questionData.section!.trim() as Section;
  const unit = questionData.unit!.trim();
  const lesson = questionData.lesson!.trim();

  const learningObjectiveCode = (questionData.learning_objective_code ?? questionData.learningObjectiveCode)?.trim() || null;
  const bloomTaxonomy = (questionData.bloom_taxonomy ?? questionData.bloomTaxonomy)?.trim() || null;
  const estimatedDifficulty = (questionData.estimated_difficulty ?? questionData.estimatedDifficulty)?.trim() || 'medium';
  const expectedTime = Number(questionData.expected_time ?? questionData.expectedTime) || 60;
  const source = (questionData.source)?.trim() || 'تطبيق المدرب الذكي';
  const assessmentContext = (questionData.assessment_context ?? questionData.assessmentContext)?.trim() || 'summative';
  const repetitionCount = Number(questionData.repetition_count ?? questionData.repetitionCount) || 1;

  const rawExamYears = questionData.exam_years ?? questionData.examYears;
  const incomingYears: number[] = Array.isArray(rawExamYears) && rawExamYears.length > 0
    ? Array.from(new Set(rawExamYears.map(Number))).sort((a, b) => a - b)
    : (questionData.exam_year || questionData.examYear ? [Number(questionData.exam_year || questionData.examYear)] : [new Date().getFullYear()]);
  const incomingYear = incomingYears[0] || new Date().getFullYear();

  const fileName = (questionData.file_name ?? questionData.fileName) || null;

  if (isInMemoryFallback || !pool) {
    const existingIndex = memQuestions.findIndex((q) => q.normalizedTextHash === textHash);
    if (existingIndex !== -1) {
      const existing = memQuestions[existingIndex];
      const prevYears = Array.isArray(existing.examYears) && existing.examYears.length > 0
        ? existing.examYears
        : (existing.examYear ? [existing.examYear] : []);
      const mergedYears = Array.from(new Set([...prevYears, ...incomingYears])).sort((a, b) => a - b);
      existing.repetitionCount = (existing.repetitionCount || 1) + 1;
      existing.examYears = mergedYears;
      existing.isDuplicate = true;
      existing.status = 'ignored';
      return { ...existing };
    }

    const targetFile = fileId ? memFiles.find((f) => f.id === fileId) : null;

    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      fileId,
      fileName: fileName || targetFile?.name || null,
      questionText,
      questionType: questionType as QuestionType,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      grade,
      section,
      subject,
      unit,
      lesson,
      learningObjectiveCode,
      bloomTaxonomy,
      bloom_taxonomy: bloomTaxonomy,
      estimatedDifficulty: estimatedDifficulty as Difficulty,
      pValue: questionData.pValue ?? questionData.p_value ?? null,
      discriminationIndex: questionData.discriminationIndex ?? questionData.discrimination_index ?? null,
      distractorEfficiency: (questionData.distractorEfficiency ?? questionData.distractor_efficiency) || null,
      expectedTime,
      averageSolveTime: questionData.averageSolveTime ?? questionData.average_solve_time ?? null,
      enemyQuestions: questionData.enemyQuestions ?? questionData.enemy_questions ?? [],
      relativeQuestions: questionData.relativeQuestions ?? questionData.relative_questions ?? [],
      assessmentContext: assessmentContext as AssessmentContext,
      hint: questionData.hint || null,
      correctExplanation,
      wrongExplanations: typeof wrongExplanations === 'object' ? wrongExplanations : null,
      source,
      examYear: incomingYear,
      governorate: questionData.governorate || 'المركزية',
      reviewStatus: (questionData.reviewStatus ?? questionData.review_status) || 'pending_review',
      contentVersion: questionData.contentVersion ?? questionData.content_version ?? 1,
      normalizedTextHash: textHash,
      repetitionCount,
      examYears: incomingYears,
      isDuplicate: false,
      status: 'inserted',
    };

    memQuestions.unshift(newQ);
    if (targetFile) {
      targetFile.extractedQuestionsCount = (targetFile.extractedQuestionsCount || 0) + 1;
    }
    return newQ;
  }

  try {
    await ensureSchema();
    const sql = `
      INSERT INTO smart_exam_engine.questions (
        file_id, file_name, question_text, question_type, option_a, option_b,
        option_c, option_d, correct_option, correct_explanation, wrong_explanations,
        subject, grade, section, unit, lesson, learning_objective_code,
        bloom_taxonomy, estimated_difficulty, p_value, discrimination_index,
        distractor_efficiency, expected_time, average_solve_time, enemy_questions,
        relative_questions, assessment_context, hint, source, exam_year,
        governorate, review_status, content_version, normalized_text_hash,
        repetition_count, exam_years
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29, $30,
        $31, $32, $33, $34,
        $35, $36
      )
      ON CONFLICT (normalized_text_hash) DO UPDATE SET
        repetition_count = smart_exam_engine.questions.repetition_count + 1,
        exam_years = ARRAY(
          SELECT DISTINCT val
          FROM unnest(smart_exam_engine.questions.exam_years || EXCLUDED.exam_years) AS val
          ORDER BY val ASC
        ),
        updated_at = NOW()
      RETURNING *, (xmax != 0) AS is_existing_duplicate;
    `;

    const values = [
      fileId,
      fileName,
      questionText,
      questionType,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      correctExplanation,
      wrongExplanations ? JSON.stringify(wrongExplanations) : null,
      subject,
      grade,
      section,
      unit,
      lesson,
      learningObjectiveCode,
      bloomTaxonomy,
      estimatedDifficulty,
      questionData.pValue ?? questionData.p_value ?? null,
      questionData.discriminationIndex ?? questionData.discrimination_index ?? null,
      (questionData.distractorEfficiency ?? questionData.distractor_efficiency) ? JSON.stringify(questionData.distractorEfficiency ?? questionData.distractor_efficiency) : null,
      expectedTime,
      questionData.averageSolveTime ?? questionData.average_solve_time ?? null,
      questionData.enemyQuestions ?? questionData.enemy_questions ?? [],
      questionData.relativeQuestions ?? questionData.relative_questions ?? [],
      assessmentContext,
      questionData.hint || null,
      source,
      incomingYear,
      questionData.governorate || 'المركزية',
      (questionData.reviewStatus ?? questionData.review_status) || 'pending_review',
      questionData.contentVersion ?? questionData.content_version ?? 1,
      textHash,
      repetitionCount,
      incomingYears,
    ];

    const res = await query(sql, values);
    const row = res.rows[0];
    const newQuestion = mapQuestionRowToQuestion(row as QuestionRow);
    const wasDuplicate = Boolean(row.is_existing_duplicate || (newQuestion.repetitionCount && newQuestion.repetitionCount > 1));

    return {
      ...newQuestion,
      isDuplicate: wasDuplicate,
      status: wasDuplicate ? 'ignored' : 'inserted',
    };
  } catch (err: any) {
    if (isInMemoryFallback || !pool) {
      return insertQuestion(fileId, questionData);
    }
    throw err;
  }
}

export async function insertQuestions(
  fileId: string | null,
  questionsData: QuestionInput[]
): Promise<Question[]> {
  const results: Question[] = [];
  for (const q of questionsData) {
    const item = await insertQuestion(fileId, q);
    results.push(item);
  }
  return results;
}

export async function updateQuestion(
  id: string,
  questionData: Partial<QuestionInput>
): Promise<Question | null> {
  if (isInMemoryFallback) {
    const q = memQuestions.find((item) => item.id === id);
    if (!q) return null;

    if (questionData.questionText) {
      const clean = sanitizeArabicText(questionData.questionText);
      q.normalizedTextHash = computeSHA256(clean);
    }
    Object.assign(q, questionData);
    return q;
  }

  try {
    await ensureSchema();
    const fields: string[] = [];
    const values: any[] = [id];
    let idx = 2;

    if (questionData.questionText !== undefined) {
      const cleanText = sanitizeArabicText(questionData.questionText);
      const hash = computeSHA256(cleanText);
      fields.push(`question_text = $${idx++}`);
      values.push(questionData.questionText);
      fields.push(`normalized_text_hash = $${idx++}`);
      values.push(hash);
    }

    if (questionData.questionType !== undefined) { fields.push(`question_type = $${idx++}`); values.push(questionData.questionType); }
    if (questionData.optionA !== undefined) { fields.push(`option_a = $${idx++}`); values.push(questionData.optionA); }
    if (questionData.optionB !== undefined) { fields.push(`option_b = $${idx++}`); values.push(questionData.optionB); }
    if (questionData.optionC !== undefined) { fields.push(`option_c = $${idx++}`); values.push(questionData.optionC); }
    if (questionData.optionD !== undefined) { fields.push(`option_d = $${idx++}`); values.push(questionData.optionD); }
    if (questionData.correctOption !== undefined) { fields.push(`correct_option = $${idx++}`); values.push(questionData.correctOption); }
    if (questionData.grade !== undefined) { fields.push(`grade = $${idx++}`); values.push(questionData.grade); }
    if (questionData.section !== undefined) { fields.push(`section = $${idx++}`); values.push(questionData.section); }
    if (questionData.subject !== undefined) { fields.push(`subject = $${idx++}`); values.push(questionData.subject); }
    if (questionData.unit !== undefined) { fields.push(`unit = $${idx++}`); values.push(questionData.unit); }
    if (questionData.lesson !== undefined) { fields.push(`lesson = $${idx++}`); values.push(questionData.lesson); }
    if (questionData.estimatedDifficulty !== undefined) { fields.push(`estimated_difficulty = $${idx++}`); values.push(questionData.estimatedDifficulty); }
    if (questionData.hint !== undefined) { fields.push(`hint = $${idx++}`); values.push(questionData.hint); }
    if (questionData.correctExplanation !== undefined) { fields.push(`correct_explanation = $${idx++}`); values.push(questionData.correctExplanation); }
    if (questionData.wrongExplanations !== undefined) { fields.push(`wrong_explanations = $${idx++}`); values.push(JSON.stringify(questionData.wrongExplanations)); }
    if (questionData.reviewStatus !== undefined) { fields.push(`review_status = $${idx++}`); values.push(questionData.reviewStatus); }

    if (fields.length === 0) {
      const listRes = await query(`SELECT * FROM smart_exam_engine.questions WHERE id = $1`, [id]);
      if (listRes.rowCount === 0) return null;
      return mapQuestionRowToQuestion(listRes.rows[0] as QuestionRow);
    }

    fields.push(`updated_at = NOW()`);
    const sql = `UPDATE smart_exam_engine.questions SET ${fields.join(', ')} WHERE id = $1 RETURNING *;`;
    const res = await query(sql, values);
    if (res.rowCount === 0) return null;
    return mapQuestionRowToQuestion(res.rows[0] as QuestionRow);
  } catch {
    isInMemoryFallback = true;
    return updateQuestion(id, questionData);
  }
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (isInMemoryFallback) {
    const idx = memQuestions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      memQuestions.splice(idx, 1);
      return true;
    }
    return false;
  }
  try {
    await ensureSchema();
    const sql = `DELETE FROM smart_exam_engine.questions WHERE id = $1;`;
    const res = await query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  } catch {
    isInMemoryFallback = true;
    return deleteQuestion(id);
  }
}

export async function deleteAllQuestions(): Promise<boolean> {
  if (isInMemoryFallback) {
    memQuestions.length = 0;
    memFiles.forEach((f) => (f.extractedQuestionsCount = 0));
    return true;
  }
  try {
    await ensureSchema();
    const sql = `DELETE FROM smart_exam_engine.questions;`;
    await query(sql);
    return true;
  } catch {
    isInMemoryFallback = true;
    memQuestions.length = 0;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Student Profile Management (Dual-Mode: PostgreSQL + In-Memory Fallback)
// ---------------------------------------------------------------------------

export async function saveStudentProfile(input: {
  id: string;
  grade: number;
  section?: string | null;
  governorate?: string | null;
  targetSubject?: string | null;
}): Promise<StudentProfile> {
  const grade = (input.grade === 9 ? 9 : 12) as Grade;
  const section = (input.section as Section) || null;
  const governorate = input.governorate || null;
  const targetSubject = input.targetSubject || null;

  if (isInMemoryFallback) {
    let existing = memStudentProfiles.find((p) => p.id === input.id);
    if (!existing) {
      existing = {
        id: input.id,
        grade,
        section,
        governorate,
        targetSubject,
        createdAt: new Date().toISOString(),
      };
      memStudentProfiles.push(existing);
    } else {
      existing.grade = grade;
      existing.section = section;
      existing.governorate = governorate;
      existing.targetSubject = targetSubject;
    }
    return existing;
  }

  try {
    await ensureSchema();
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
    const res = await query(sql, [input.id, grade, section, governorate, targetSubject]);
    const row = res.rows[0] as StudentProfileRow;
    return {
      id: row.id,
      grade: row.grade,
      section: row.section,
      governorate: row.governorate,
      targetSubject: row.target_subject,
      createdAt: row.created_at,
    };
  } catch {
    isInMemoryFallback = true;
    return saveStudentProfile(input);
  }
}

// ---------------------------------------------------------------------------
// Adaptive Engine - Student Response Recording & Mastery Update
// ---------------------------------------------------------------------------

export async function recordStudentResponse(
  studentId: string,
  questionId: string,
  data: {
    selectedOption?: CorrectOption | null;
    isCorrect: boolean;
    timeTakenSeconds?: number | null;
    hintUsed?: boolean;
  }
): Promise<{ response: StudentResponse; mastery: MasteryState | null }> {
  const selectedOption = data.selectedOption ?? null;
  const timeTakenSeconds = data.timeTakenSeconds ?? null;
  const hintUsed = data.hintUsed ?? false;

  if (isInMemoryFallback) {
    const objectiveCode = memQuestions.find((q) => q.id === questionId)?.learningObjectiveCode || null;

    const response: StudentResponse = {
      id: 'sr-' + Math.random().toString(36).substring(2, 9),
      studentId,
      questionId,
      learningObjectiveCode: objectiveCode,
      selectedOption,
      isCorrect: data.isCorrect,
      timeTakenSeconds,
      hintUsed,
      createdAt: new Date().toISOString(),
    };
    memStudentResponses.unshift(response);

    let mastery = objectiveCode
      ? memMasteryStates.find((m) => m.studentId === studentId && m.learningObjectiveCode === objectiveCode)
      : undefined;

    if (objectiveCode) {
      if (!mastery) {
        mastery = {
          id: 'ms-' + Math.random().toString(36).substring(2, 9),
          studentId,
          learningObjectiveCode: objectiveCode,
          masteryScore: 0,
          consecutiveCorrect: 0,
        };
        memMasteryStates.push(mastery);
      }
      if (data.isCorrect) {
        mastery.masteryScore = Math.min(100, mastery.masteryScore + 10);
        mastery.consecutiveCorrect += 1;
      } else {
        mastery.masteryScore = Math.max(0, mastery.masteryScore - 5);
        mastery.consecutiveCorrect = 0;
      }
      mastery.lastEvaluatedAt = new Date().toISOString();
    }

    return { response, mastery: mastery || null };
  }

  try {
    await ensureSchema();
    // Ensure student record exists to prevent FK violation
    await query(
      `INSERT INTO smart_exam_engine.student_profiles (id, grade) VALUES ($1, 12) ON CONFLICT (id) DO NOTHING;`,
      [studentId]
    );

    const insertSql = `
      WITH question_obj AS (
        SELECT learning_objective_code FROM smart_exam_engine.questions WHERE id = $1
      ),
      ins AS (
        INSERT INTO smart_exam_engine.student_responses (
          student_id, question_id, learning_objective_code,
          selected_option, is_correct, time_taken_seconds, hint_used
        )
        VALUES ($2, $1, (SELECT learning_objective_code FROM question_obj), $3, $4, $5, $6)
        RETURNING *
      )
      SELECT * FROM ins;
    `;
    const res = await query(insertSql, [questionId, studentId, selectedOption, data.isCorrect, timeTakenSeconds, hintUsed]);
    const responseRow = res.rows[0] as StudentResponseRow;
    const response: StudentResponse = {
      id: responseRow.id,
      studentId: responseRow.student_id,
      questionId: responseRow.question_id,
      learningObjectiveCode: responseRow.learning_objective_code,
      selectedOption: responseRow.selected_option,
      isCorrect: responseRow.is_correct,
      timeTakenSeconds: responseRow.time_taken_seconds,
      hintUsed: responseRow.hint_used,
      createdAt: responseRow.created_at,
    };

    let mastery: MasteryState | null = null;
    if (response.learningObjectiveCode) {
      const masterySql = `
        INSERT INTO smart_exam_engine.mastery_states (
          student_id, learning_objective_code, mastery_score, consecutive_correct, last_evaluated_at
        ) VALUES (
          $1, $2,
          CASE WHEN $3 THEN 10.00 ELSE 0.00 END,
          CASE WHEN $3 THEN 1 ELSE 0 END,
          NOW()
        )
        ON CONFLICT (student_id, learning_objective_code) DO UPDATE SET
          mastery_score = LEAST(100.00, GREATEST(0.00,
            mastery_states.mastery_score + CASE WHEN excluded.consecutive_correct > 0 THEN 10.00 ELSE -5.00 END)),
          consecutive_correct = CASE
            WHEN excluded.consecutive_correct > 0 THEN mastery_states.consecutive_correct + 1
            ELSE 0
          END,
          last_evaluated_at = NOW()
        RETURNING *;
      `;
      const masteryRes = await query(masterySql, [studentId, response.learningObjectiveCode, response.isCorrect]);
      const masteryRow = masteryRes.rows[0] as MasteryStateRow;
      mastery = {
        id: masteryRow.id,
        studentId: masteryRow.student_id,
        learningObjectiveCode: masteryRow.learning_objective_code,
        masteryScore: Number(masteryRow.mastery_score),
        consecutiveCorrect: masteryRow.consecutive_correct,
        lastEvaluatedAt: masteryRow.last_evaluated_at,
      };
    }

    return { response, mastery };
  } catch {
    isInMemoryFallback = true;
    return recordStudentResponse(studentId, questionId, data);
  }
}

// ---------------------------------------------------------------------------
// Adaptive Engine - Recommended Question Selection
// ---------------------------------------------------------------------------

export async function getRecommendedQuestion(
  studentId: string,
  subjectCode: string
): Promise<Question | null> {
  if (isInMemoryFallback) {
    const answeredIds = memStudentResponses
      .filter((r) => r.studentId === studentId)
      .map((r) => r.questionId);

    const targets = memMasteryStates
      .filter((m) => m.studentId === studentId && m.masteryScore < 80)
      .sort((a, b) => a.masteryScore - b.masteryScore);

    for (const target of targets) {
      const candidate = memQuestions.find(
        (q) =>
          q.subject === subjectCode &&
          q.learningObjectiveCode === target.learningObjectiveCode &&
          !answeredIds.includes(q.id)
      );
      if (candidate) return candidate;
    }

    // Cold-start fallback: return first un-answered question for this subject
    const unAnswered = memQuestions.find(
      (q) => q.subject === subjectCode && !answeredIds.includes(q.id)
    );
    if (unAnswered) return unAnswered;

    return null;
  }

  try {
    await ensureSchema();
    const sql = `
      SELECT q.*
      FROM smart_exam_engine.questions q
      JOIN smart_exam_engine.mastery_states m
        ON m.learning_objective_code = q.learning_objective_code
      WHERE m.student_id = $1
        AND q.subject = $2
        AND m.mastery_score < 80.00
        AND q.id NOT IN (
          SELECT question_id FROM smart_exam_engine.student_responses WHERE student_id = $1
        )
      ORDER BY m.mastery_score ASC, q.estimated_difficulty ASC
      LIMIT 1;
    `;
    const res = await query(sql, [studentId, subjectCode]);
    if (res.rowCount && res.rowCount > 0) {
      return mapQuestionRowToQuestion(res.rows[0] as QuestionRow);
    }

    // Cold start fallback in PostgreSQL mode:
    const fallbackSql = `
      SELECT q.*
      FROM smart_exam_engine.questions q
      WHERE q.subject = $2
        AND q.id NOT IN (
          SELECT question_id FROM smart_exam_engine.student_responses WHERE student_id = $1
        )
      ORDER BY q.estimated_difficulty ASC, q.created_at ASC
      LIMIT 1;
    `;
    const fallbackRes = await query(fallbackSql, [studentId, subjectCode]);
    if (fallbackRes.rowCount && fallbackRes.rowCount > 0) {
      return mapQuestionRowToQuestion(fallbackRes.rows[0] as QuestionRow);
    }

    return null;
  } catch {
    isInMemoryFallback = true;
    return getRecommendedQuestion(studentId, subjectCode);
  }
}

// ---------------------------------------------------------------------------
// 7. Hybrid Lessons Operations (Offline-First / In-Memory + PostgreSQL)
// ---------------------------------------------------------------------------

export const memLessons: Lesson[] = [
  {
    id: 'les-sample-12-math',
    grade: 12,
    section: 'علمي',
    subject: 'الرياضيات',
    unitTitle: 'حساب التفاضل والتكامل',
    unitOrder: 1,
    lessonTitle: 'نهايات الدوال المثلثية والاتصال',
    lessonOrder: 1,
    learningObjectiveCodes: ['MATH-12-CALC-01', 'MATH-12-CALC-02'],
    estimatedReadingTimeMinutes: 12,
    content: {
      introduction: 'تعد نهايات الدوال المثلثية من الركائز الأساسية لحساب التفاضل، حيث تمهد لاشتقاق الدوال الدائرية وفهم سلوك المنحنيات بالقرب من النقاط الحرجة.',
      coreConcepts: [
        {
          conceptTitle: 'النظرية الأساسية لنهاية الجيب',
          explanation: 'تنص النظرية على أن: $\\lim_{x \\to 0} \\frac{\\sin(ax)}{x} = a$. تعتمد هذه النتيجة على مبرهنة الحصر (الساندويتش) وتفترض قياس الزوايا بالراديان دائماً.',
          keyTakeaway: 'يجب التأكد من تطابق وسيط دالة الجيب مع المقام قبل تطبيق النتيجة المباشرة.'
        },
        {
          conceptTitle: 'نهاية دالة الظل',
          explanation: 'بالمثل بالنسبة لدالة الظل: $\\lim_{x \\to 0} \\frac{\\tan(bx)}{x} = b$، وتستنتج مباشرة بقسمة البسط والمقام على $\\cos(x)$.',
          keyTakeaway: 'دوال جيب التمام $\\cos(x)$ عند الصفر تساوي 1 ولا تولد صيغة غير معينة بمفردها.'
        },
        {
          conceptTitle: 'المرافق المثلثي لفك عدم التعيين',
          explanation: 'في الصيغ مثل $\\frac{1 - \\cos(x)}{x^2}$، نضرب بسطاً ومقاماً في المرافق $(1 + \\cos(x))$ لتحويل البسط إلى $\\sin^2(x)$.',
          keyTakeaway: 'المرافق المثلثي هو الأداة الأكثر فعالية لإزالة الصفر المزدوج في المقام.'
        }
      ],
      commonMistakes: [
        'التعويض المباشر بالدرجات بدلاً من القياس الدائري (الراديان).',
        'تطبيق نظرية $\\lim \\frac{\\sin(x)}{x} = 1$ عندما تؤول $x$ إلى $\\infty$ بدلاً من $0$.',
        'نسيان توزيع معاملات الزاوية الداخلية مثل $\\sin(3x)$ عند القسمة على $x$.'
      ],
      solvedExamples: [
        {
          exampleText: 'احسب قيمة النهاية: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(2x)}$',
          stepByStepSolution: '1) بقسمة كلاً من البسط والمقام على $x$:\n$$\\lim_{x \\to 0} \\frac{\\frac{\\sin(5x)}{x}}{\\frac{\\tan(2x)}{x}}$$\n2) تطبيق النظرية على البسط: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{x} = 5$.\n3) تطبيق النظرية على المقام: $\\lim_{x \\to 0} \\frac{\\tan(2x)}{x} = 2$.\n4) إذن النهاية تساوي الكسر الناتج.',
          finalAnswer: '$\\frac{5}{2}$'
        },
        {
          exampleText: 'احسب النهاية: $\\lim_{x \\to 0} \\frac{1 - \\cos(x)}{x^2}$',
          stepByStepSolution: '1) بالضرب في المرافق المثلثي $(1 + \\cos(x))$:\n$$\\lim_{x \\to 0} \\frac{(1 - \\cos(x))(1 + \\cos(x))}{x^2(1 + \\cos(x))} = \\lim_{x \\to 0} \\frac{\\sin^2(x)}{x^2 (1 + \\cos(x))}$$\n2) نفصل النهاية: $\\left(\\lim_{x \\to 0} \\frac{\\sin(x)}{x}\\right)^2 \\cdot \\lim_{x \\to 0} \\frac{1}{1 + \\cos(x)} = 1^2 \\cdot \\frac{1}{1 + 1}$.',
          finalAnswer: '$\\frac{1}{2}$'
        }
      ],
      activeRecallSummary: 'سؤال الاسترجاع السريع: ما الشرط الأساسي الذي لا غنى عنه لتطبيق نتيجة $\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$؟ الإجابة: أن تؤول الزاوية إلى الصفر، وأن تكون الزاوية مقاسة بالراديان حصراً.'
    },
    mediaResources: {
      audio: [],
      video: [
        {
          sourceType: 'youtube_url',
          url: 'https://www.youtube.com/watch?v=sampleMathLimits',
          title: 'شرح مرئي: نهايات الدوال المثلثية وتطبيقات مبرهنة الحصر',
          durationSeconds: 720
        }
      ],
      attachments: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'les-sample-12-phys',
    grade: 12,
    section: 'علمي',
    subject: 'الفيزياء',
    unitTitle: 'الكهرباء المتحركة',
    unitOrder: 1,
    lessonTitle: 'قانون أوم وتوصيل المقاومات',
    lessonOrder: 2,
    learningObjectiveCodes: ['PHYS-12-ELEC-04', 'PHYS-12-ELEC-05'],
    estimatedReadingTimeMinutes: 10,
    content: {
      introduction: 'يشكل قانون أوم الأساس النظري والتطبيقي لتحليل كافة الدوائر الكهربائية البسيطة والمعقدة، ويربط بين فرق الجهد، شدة التيار، والمقاومة الأومية.',
      coreConcepts: [
        {
          conceptTitle: 'نص قانون أوم الرياضي',
          explanation: 'عند ثبوت درجة الحرارة، يتناسب فرق الجهد بين طرفي موصل طردياً مع شدة التيار المار فيه: $V = I \\cdot R$.',
          keyTakeaway: 'المقاومة $R$ للموصل ثابتة طالما بقيت درجة الحرارة والعوامل الهندسية ثابتة.'
        },
        {
          conceptTitle: 'التوصيل على التوالي',
          explanation: 'في التوصيل على التوالي يمر نفس التيار في جميع المقاومات، ويتجزأ فرق الجهد الكلي: $R_{eq} = R_1 + R_2 + R_3$. المقاومة المكافئة أكبر من أكبر مقاومة.',
          keyTakeaway: 'التيار ثابت والجهد يتجزأ بنسبة طردية مع قيم المقاومات.'
        },
        {
          conceptTitle: 'التوصيل على التوازي',
          explanation: 'في التوصيل على التوازي يكون فرق الجهد ثابتاً عبر كل فرع، وتتجزأ شدة التيار: $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}$. المقاومة المكافئة أصغر من أصغر مقاومة.',
          keyTakeaway: 'الجهد ثابت والتيار يتجزأ بنسبة عكسية مع قيم المقاومات.'
        }
      ],
      commonMistakes: [
        'جمع المقاومات جمعاً خطياً في دوائر التوازي.',
        'افتراض أن قدرة المصباح تزداد دائماً بزيادة المقاومة دون مراعاة نوع التوصيل (ثبوت الجهد أم التيار).',
        'إهمال المقاومة الداخلية للمصدر الكهربائي ($r$).'
      ],
      solvedExamples: [
        {
          exampleText: 'وصلت مقاومتان $R_1 = 6\\,\\Omega$ و $R_2 = 3\\,\\Omega$ على التوازي بمصدر جهده $12\\,\\text{V}$. احسب شدة التيار الكلي.',
          stepByStepSolution: '1) حساب المقاومة المكافئة:\n$$R_{eq} = \\frac{R_1 \\cdot R_2}{R_1 + R_2} = \\frac{6 \\times 3}{6 + 3} = \\frac{18}{9} = 2\\,\\Omega$$\n2) حساب التيار الكلي من قانون أوم:\n$$I_{total} = \\frac{V}{R_{eq}} = \\frac{12}{2} = 6\\,\\text{A}$$',
          finalAnswer: '$6\\,\\text{A}$'
        }
      ],
      activeRecallSummary: 'سؤال التثبيت: لماذا توصل الأجهزة المنزلية على التوازي وليس على التوالي؟ الإجابة: لضمان ثبوت الجهد التشغيلي القياسي (220V) لكل جهاز، ولكي يعمل كل جهاز باستقلالية دون انقطاع الدائرة عند إيقاف جهاز آخر.'
    },
    mediaResources: {
      audio: [],
      video: [],
      attachments: [
        {
          sourceType: 'url',
          url: 'https://example.com/physics-circuits-summary.pdf',
          title: 'ملخص مخططات الدوائر الكهربائية وقوانين كيرشوف',
        }
      ]
    },
    createdAt: new Date().toISOString()
  }
];

export function validateStrictLessonFields(raw: any, index?: number): string | null {
  const prefix = index !== undefined ? `الدرس رقم ${index}: ` : '';

  const subject = raw.subject;
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return `${prefix}الحقل مفقود: subject (المادة الدراسية إلزامية)`;
  }

  const grade = Number(raw.grade);
  if (grade !== 9 && grade !== 12) {
    return `${prefix}قيمة الحقل مخالفة للقيود: grade يجب أن يكون الصف 9 أو 12`;
  }

  const lessonTitle = raw.lesson_title ?? raw.lessonTitle;
  if (!lessonTitle || typeof lessonTitle !== 'string' || !lessonTitle.trim()) {
    return `${prefix}الحقل مفقود: lesson_title (عنوان الدرس إلزامي)`;
  }

  const contentJson = raw.content_json ?? raw.content;
  if (!contentJson) {
    return `${prefix}الحقل مفقود: content_json (محتوى الدرس إلزامي)`;
  }

  return null;
}

export async function insertLessons(
  lessonsInput: LessonInput[] | any[]
): Promise<{ inserted: number; lessons: Lesson[] }> {
  if (!Array.isArray(lessonsInput) || lessonsInput.length === 0) {
    return { inserted: 0, lessons: [] };
  }

  // Ensure database schema and table structure exist
  await ensureSchema();

  const newLessons: Lesson[] = [];

  for (let i = 0; i < lessonsInput.length; i++) {
    const item = lessonsInput[i];
    const validationError = validateStrictLessonFields(item, lessonsInput.length > 1 ? i + 1 : undefined);
    if (validationError) {
      throw new Error(validationError);
    }

    const id = (item.id && typeof item.id === 'string' && item.id.trim())
      ? item.id.trim()
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `les-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    const grade = Number(item.grade) as Grade;
    const section = item.section ? String(item.section).trim() : null;
    const subject = String(item.subject).trim();
    const unitTitle = item.unit_title ?? item.unitTitle ? String(item.unit_title ?? item.unitTitle).trim() : null;
    const unitOrder = Number(item.unit_order ?? item.unitOrder) || 1;
    const lessonTitle = String(item.lesson_title ?? item.lessonTitle).trim();
    const lessonOrder = Number(item.lesson_order ?? item.lessonOrder) || 1;
    const rawCodes = item.learning_objective_codes ?? item.learningObjectiveCodes;
    const learningObjectiveCodes: string[] = Array.isArray(rawCodes)
      ? rawCodes
      : (rawCodes && typeof rawCodes === 'string' ? rawCodes.split(',').map((s: string) => s.trim()) : []);
    const estimatedReadingTimeMinutes = Number(item.estimated_reading_time_minutes ?? item.estimatedReadingTimeMinutes) || 10;
    
    const rawContent = item.content_json ?? item.content;
    const content: LessonContent = typeof rawContent === 'string'
      ? (() => { try { return JSON.parse(rawContent); } catch { return { introduction: rawContent, coreConcepts: [], commonMistakes: [], solvedExamples: [], activeRecallSummary: '' }; } })()
      : rawContent;

    const rawMedia = item.media_resources ?? item.mediaResources;
    const mediaResources: LessonMediaResources = typeof rawMedia === 'string'
      ? (() => { try { return JSON.parse(rawMedia); } catch { return { audio: [], video: [], attachments: [] }; } })()
      : (rawMedia || { audio: [], video: [], attachments: [] });

    const createdAt = new Date().toISOString();

    const lesson: Lesson = {
      id,
      grade,
      section,
      subject,
      unitTitle,
      unitOrder,
      lessonTitle,
      lessonOrder,
      learningObjectiveCodes,
      estimatedReadingTimeMinutes,
      content,
      mediaResources,
      createdAt,
    };

    if (isInMemoryFallback || !pool) {
      const existingIdx = memLessons.findIndex((l) => l.id === lesson.id);
      if (existingIdx >= 0) {
        memLessons[existingIdx] = lesson;
      } else {
        memLessons.unshift(lesson);
      }
      newLessons.push(lesson);
      continue;
    }

    try {
      // Explicit SQL INSERT with clean fields into smart_exam_engine.lessons
      const sql = `
        INSERT INTO smart_exam_engine.lessons (
          id, grade, section, subject, unit_title, unit_order, lesson_title, lesson_order,
          learning_objective_codes, estimated_reading_time_minutes, content_json, media_resources, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          grade = EXCLUDED.grade,
          section = EXCLUDED.section,
          subject = EXCLUDED.subject,
          unit_title = EXCLUDED.unit_title,
          unit_order = EXCLUDED.unit_order,
          lesson_title = EXCLUDED.lesson_title,
          lesson_order = EXCLUDED.lesson_order,
          learning_objective_codes = EXCLUDED.learning_objective_codes,
          estimated_reading_time_minutes = EXCLUDED.estimated_reading_time_minutes,
          content_json = EXCLUDED.content_json,
          media_resources = EXCLUDED.media_resources
        RETURNING *;
      `;

      const res = await query(sql, [
        lesson.id,
        lesson.grade,
        lesson.section,
        lesson.subject,
        lesson.unitTitle,
        lesson.unitOrder,
        lesson.lessonTitle,
        lesson.lessonOrder,
        lesson.learningObjectiveCodes,
        lesson.estimatedReadingTimeMinutes,
        JSON.stringify(lesson.content),
        JSON.stringify(lesson.mediaResources),
        lesson.createdAt,
      ]);

      if (res.rows && res.rows.length > 0) {
        const mapped = mapLessonRowToLesson(res.rows[0] as LessonRow);
        newLessons.push(mapped);
        // Keep memory mirror in sync
        const existingIdx = memLessons.findIndex((l) => l.id === mapped.id);
        if (existingIdx >= 0) {
          memLessons[existingIdx] = mapped;
        } else {
          memLessons.unshift(mapped);
        }
      } else {
        newLessons.push(lesson);
      }
    } catch (err: any) {
      if (isInMemoryFallback || !pool) {
        const existingIdx = memLessons.findIndex((l) => l.id === lesson.id);
        if (existingIdx >= 0) {
          memLessons[existingIdx] = lesson;
        } else {
          memLessons.unshift(lesson);
        }
        newLessons.push(lesson);
      } else {
        throw err;
      }
    }
  }

  return { inserted: newLessons.length, lessons: newLessons };
}

export async function getLessons(filters?: {
  subject?: string;
  grade?: number;
  section?: string;
  limit?: number;
  offset?: number;
}): Promise<Lesson[]> {
  const limit = Math.max(1, Math.min(filters?.limit || 100, 200));
  const offset = Math.max(0, filters?.offset || 0);

  if (isInMemoryFallback || !pool) {
    let result = [...memLessons];
    if (filters?.subject && filters.subject !== 'all') {
      result = result.filter((l) => l.subject === filters.subject);
    }
    if (filters?.grade) {
      result = result.filter((l) => l.grade === filters.grade);
    }
    return result.slice(offset, offset + limit);
  }

  try {
    await ensureSchema();
    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIdx = 1;

    if (filters?.subject && filters.subject !== 'all') {
      whereClauses.push(`subject = $${paramIdx++}`);
      params.push(filters.subject);
    }
    if (filters?.grade) {
      whereClauses.push(`grade = $${paramIdx++}`);
      params.push(filters.grade);
    }
    if (filters?.section && filters.section !== 'all') {
      whereClauses.push(`section = $${paramIdx++}`);
      params.push(filters.section);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `
      SELECT * FROM smart_exam_engine.lessons
      ${whereStr}
      ORDER BY unit_order ASC, lesson_order ASC, created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;
    params.push(limit, offset);

    const res = await query(sql, params);
    return res.rows.map((row) => mapLessonRowToLesson(row as LessonRow));
  } catch (err: any) {
    console.warn('[getLessons] Falling back to in-memory lessons:', err.message);
    isInMemoryFallback = true;
    let result = [...memLessons];
    if (filters?.subject && filters.subject !== 'all') {
      result = result.filter((l) => l.subject === filters.subject);
    }
    if (filters?.grade) {
      result = result.filter((l) => l.grade === filters.grade);
    }
    return result.slice(offset, offset + limit);
  }
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    await ensureSchema();
    const res = await query(`SELECT * FROM smart_exam_engine.lessons WHERE id = $1 LIMIT 1;`, [id]);
    if (res.rows && res.rows.length > 0) {
      return mapLessonRowToLesson(res.rows[0] as LessonRow);
    }
  } catch (err: any) {
    console.warn(`[getLessonById] Query failed for id ${id}:`, err.message);
  }
  return memLessons.find((l) => l.id === id) || null;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const memIdx = memLessons.findIndex((l) => l.id === id);
  if (memIdx >= 0) {
    memLessons.splice(memIdx, 1);
  }

  try {
    await ensureSchema();
    const sql = `DELETE FROM smart_exam_engine.lessons WHERE id = $1;`;
    const res = await query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  } catch (err: any) {
    console.error(`[deleteLesson] SQL delete failed for id ${id}:`, err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 8. Student Gamification Synchronization (Dual-Mode: Cloud DB + Offline)
// ---------------------------------------------------------------------------

export async function getStudentGamification(
  studentId: string
): Promise<StudentGamificationState | null> {
  if (!studentId) return null;
  if (isInMemoryFallback) {
    return memStudentGamification[studentId] || null;
  }

  try {
    await ensureSchema();
    if (isInMemoryFallback) return memStudentGamification[studentId] || null;
    const res = await query(
      `SELECT * FROM smart_exam_engine.student_gamification WHERE student_id = $1 LIMIT 1;`,
      [studentId]
    );
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return {
        xp: Number(row.xp) || 0,
        level: Number(row.level) || 1,
        currentStreak: Number(row.current_streak) || 0,
        longestStreak: Number(row.longest_streak) || 0,
        unlockedBadges: Array.isArray(row.unlocked_badges) ? row.unlocked_badges : [],
        lastActiveDate: row.last_active_date ? new Date(row.last_active_date).toISOString().split('T')[0] : undefined,
        totalCorrect: Number(row.total_correct) || 0,
        completedLessonIds: Array.isArray(row.completed_lesson_ids) ? row.completed_lesson_ids : [],
        subjectCounts: typeof row.subject_counts === 'object' && row.subject_counts !== null ? row.subject_counts : {},
        maxMasteryScore: Number(row.max_mastery_score) || 0,
      };
    }
    return memStudentGamification[studentId] || null;
  } catch {
    isInMemoryFallback = true;
    return memStudentGamification[studentId] || null;
  }
}

export async function syncGamificationWithDB(
  studentId: string,
  state: StudentGamificationState
): Promise<boolean> {
  if (!studentId || !state) return false;

  // Always update in-memory cache so in-memory and offline modes work seamlessly
  memStudentGamification[studentId] = { ...state };

  if (isInMemoryFallback) return true;

  try {
    await ensureSchema();
    if (isInMemoryFallback) return true;

    const sql = `
      INSERT INTO smart_exam_engine.student_gamification (
        student_id, xp, level, current_streak, longest_streak,
        unlocked_badges, last_active_date, total_correct,
        completed_lesson_ids, subject_counts, max_mastery_score, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (student_id) DO UPDATE SET
        xp = EXCLUDED.xp,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        unlocked_badges = EXCLUDED.unlocked_badges,
        last_active_date = EXCLUDED.last_active_date,
        total_correct = EXCLUDED.total_correct,
        completed_lesson_ids = EXCLUDED.completed_lesson_ids,
        subject_counts = EXCLUDED.subject_counts,
        max_mastery_score = EXCLUDED.max_mastery_score,
        updated_at = NOW();
    `;

    const lastActive = state.lastActiveDate && state.lastActiveDate.trim().length > 0
      ? state.lastActiveDate
      : null;

    const values = [
      studentId,
      state.xp || 0,
      state.level || 1,
      state.currentStreak || 0,
      state.longestStreak || 0,
      state.unlockedBadges || [],
      lastActive,
      state.totalCorrect || 0,
      state.completedLessonIds || [],
      JSON.stringify(state.subjectCounts || {}),
      state.maxMasteryScore || 0,
    ];

    await query(sql, values);
    return true;
  } catch {
    isInMemoryFallback = true;
    return true;
  }
}

