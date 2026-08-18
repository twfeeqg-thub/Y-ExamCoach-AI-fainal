import { Pool, QueryResult } from 'pg';
import { createHash } from 'crypto';
import {
  Question,
  QuestionRow,
  UploadedFile,
  UploadedFileRow,
  FileInput,
  QuestionInput,
  mapQuestionRowToQuestion,
  mapUploadedFileRowToFile,
} from '../types/index';

// ---------------------------------------------------------------------------
// 1. PostgreSQL Connection Pool Setup
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_coach_db';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 3000,
});

let isInMemoryFallback = false;

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
    isDuplicate: false,
    status: 'inserted',
  },
];

/**
 * Safe SQL Query runner with fallback to in-memory mode if DB is disconnected.
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  if (isInMemoryFallback) {
    throw new Error('DATABASE_IN_MEMORY_FALLBACK');
  }

  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error: any) {
    if (!isInMemoryFallback) {
      console.warn(`[Database] PostgreSQL unavailable (${error.message || 'connection failed'}). Switching to in-memory fallback database.`);
      isInMemoryFallback = true;
    }
    throw error;
  }
}

let isSchemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (isSchemaInitialized || isInMemoryFallback) return;

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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(schemaSql);
    isSchemaInitialized = true;
  } catch {
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

export async function insertQuestion(
  fileId: string | null,
  questionData: QuestionInput
): Promise<Question> {
  const cleanedText = sanitizeArabicText(questionData.questionText);
  const textHash = computeSHA256(cleanedText);

  if (isInMemoryFallback) {
    const isDup = memQuestions.some((q) => q.normalizedTextHash === textHash);
    const targetFile = fileId ? memFiles.find((f) => f.id === fileId) : null;

    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      fileId,
      fileName: questionData.fileName || targetFile?.name || null,
      questionText: questionData.questionText,
      questionType: questionData.questionType || 'multiple_choice',
      optionA: questionData.optionA,
      optionB: questionData.optionB,
      optionC: questionData.optionC || null,
      optionD: questionData.optionD || null,
      correctOption: questionData.correctOption,
      grade: questionData.grade || 12,
      section: questionData.section || 'علمي',
      subject: questionData.subject || 'عام',
      unit: questionData.unit || 'الوحدة الأولى',
      lesson: questionData.lesson || 'الدرس الأول',
      learningObjectiveCode: questionData.learningObjectiveCode || null,
      estimatedDifficulty: questionData.estimatedDifficulty || 'medium',
      pValue: questionData.pValue || 0.7,
      discriminationIndex: questionData.discriminationIndex || 0.4,
      distractorEfficiency: questionData.distractorEfficiency || null,
      expectedTime: questionData.expectedTime || 60,
      averageSolveTime: questionData.averageSolveTime || null,
      enemyQuestions: questionData.enemyQuestions || [],
      relativeQuestions: questionData.relativeQuestions || [],
      assessmentContext: questionData.assessmentContext || 'summative',
      hint: questionData.hint || null,
      correctExplanation: questionData.correctExplanation || 'إجابة نموذجية',
      wrongExplanations: questionData.wrongExplanations || null,
      source: questionData.source || 'المدرب الذكي',
      examYear: questionData.examYear || 2026,
      governorate: questionData.governorate || 'المركزية',
      reviewStatus: questionData.reviewStatus || 'pending_review',
      contentVersion: questionData.contentVersion || 1,
      normalizedTextHash: textHash,
      isDuplicate: isDup,
      status: isDup ? 'ignored' : 'inserted',
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
        option_c, option_d, correct_option, grade, section, subject, unit,
        lesson, learning_objective_code, estimated_difficulty, p_value,
        discrimination_index, distractor_efficiency, expected_time,
        average_solve_time, enemy_questions, relative_questions,
        assessment_context, hint, correct_explanation, wrong_explanations,
        source, exam_year, governorate, review_status, content_version,
        normalized_text_hash
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      )
      ON CONFLICT (normalized_text_hash) DO NOTHING
      RETURNING *;
    `;

    const values = [
      fileId,
      questionData.fileName || null,
      questionData.questionText,
      questionData.questionType || 'multiple_choice',
      questionData.optionA,
      questionData.optionB,
      questionData.optionC || null,
      questionData.optionD || null,
      questionData.correctOption,
      questionData.grade || 12,
      questionData.section || 'علمي',
      questionData.subject || 'عام',
      questionData.unit || 'الوحدة الأولى',
      questionData.lesson || 'الدرس الأول',
      questionData.learningObjectiveCode || null,
      questionData.estimatedDifficulty || 'medium',
      questionData.pValue || null,
      questionData.discriminationIndex || null,
      questionData.distractorEfficiency ? JSON.stringify(questionData.distractorEfficiency) : null,
      questionData.expectedTime || 60,
      questionData.averageSolveTime || null,
      questionData.enemyQuestions || [],
      questionData.relativeQuestions || [],
      questionData.assessmentContext || 'summative',
      questionData.hint || null,
      questionData.correctExplanation,
      questionData.wrongExplanations ? JSON.stringify(questionData.wrongExplanations) : null,
      questionData.source || 'تطبيق المدرب الذكي',
      questionData.examYear || 2026,
      questionData.governorate || 'المركزية',
      questionData.reviewStatus || 'pending_review',
      questionData.contentVersion || 1,
      textHash,
    ];

    const res = await query(sql, values);

    if (res.rowCount === 0) {
      const fetchExistingSql = `SELECT * FROM smart_exam_engine.questions WHERE normalized_text_hash = $1 LIMIT 1;`;
      const existingRes = await query(fetchExistingSql, [textHash]);

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        const existingQuestion = mapQuestionRowToQuestion(existingRes.rows[0] as QuestionRow);
        return {
          ...existingQuestion,
          isDuplicate: true,
          status: 'ignored',
        };
      }
    }

    const newQuestion = mapQuestionRowToQuestion(res.rows[0] as QuestionRow);
    return {
      ...newQuestion,
      isDuplicate: false,
      status: 'inserted',
    };
  } catch {
    isInMemoryFallback = true;
    return insertQuestion(fileId, questionData);
  }
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
