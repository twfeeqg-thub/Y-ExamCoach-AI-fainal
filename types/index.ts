/**
 * Smart Coach Engine - Unified Production Type System
 * Mapped to PostgreSQL Schema "smart_exam_engine"
 */

// ---------------------------------------------------------------------------
// 1. Enums and Constrained Domain Types
// ---------------------------------------------------------------------------

export type QuestionType = 'multiple_choice' | 'true_false' | 'written' | 'math_problem';

export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export type Grade = 9 | 12;

export type Section = 'علمي' | 'أدبي' | 'تجاري' | 'شرعي' | 'أساسي';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type FileType = 'pdf' | 'jpg' | 'png' | 'other';

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber';

export type FontSize = 'sm' | 'md' | 'lg';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export type AssessmentContext = 'diagnostic' | 'formative' | 'summative' | 'homework' | 'practice';


// ---------------------------------------------------------------------------
// 2. Frontend Question Entity (CamelCase)
// ---------------------------------------------------------------------------

export interface Question {
  id: string; // UUID
  fileId: string | null;
  fileName: string | null;
  questionText: string;
  questionType: QuestionType;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctOption: CorrectOption;
  grade: Grade;
  section: Section;
  subject: string;
  unit: string;
  lesson: string;
  learningObjectiveCode: string | null; // مخرجات التعلم
  estimatedDifficulty: Difficulty;
  pValue: number | null; // نسبة الصعوبة الفعلية
  discriminationIndex: number | null; // مؤشر التمييز
  distractorEfficiency: Record<string, string> | null; // كائن إحصائي للمشتتات الخاطئة
  expectedTime: number; // الوقت المتوقع بالثواني
  averageSolveTime: number | null; // متوسط زمن الحل الفعلي
  enemyQuestions: string[]; // مصفوفة معرفات الأسئلة المتعارضة
  relativeQuestions: string[]; // مصفوفة معرفات الأسئلة التكاملية
  assessmentContext: AssessmentContext;
  hint: string | null; // تلميح تربوي
  correctExplanation: string; // شرح الإجابة الصحيحة
  wrongExplanations: Record<string, string> | null; // شرح تفصيلي مخصص لسبب خطأ كل خيار
  source: string;
  examYear: number;
  governorate: string;
  reviewStatus: ReviewStatus;
  contentVersion: number;
  normalizedTextHash: string | null; // البصمة النصية لمنع التكرار دلالياً
  createdAt?: string;
  updatedAt?: string;

  // UI Runtime State Attributes
  isDuplicate?: boolean; // حقل واجهة مستخدم إضافي لكشف التكرار الفوري
  status?: 'inserted' | 'ignored' | 'pending'; // حالة الإدخال في الواجهة
}


// ---------------------------------------------------------------------------
// 3. Database Question Row Entity (SnakeCase - PostgreSQL "smart_exam_engine")
// ---------------------------------------------------------------------------

export interface QuestionRow {
  id: string;
  file_id: string | null;
  file_name: string | null;
  question_text: string;
  question_type: QuestionType;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_option: CorrectOption;
  grade: Grade;
  section: Section;
  subject: string;
  unit: string;
  lesson: string;
  learning_objective_code: string | null;
  estimated_difficulty: Difficulty;
  p_value: number | null;
  discrimination_index: number | null;
  distractor_efficiency: Record<string, string> | null;
  expected_time: number;
  average_solve_time: number | null;
  enemy_questions: string[];
  relative_questions: string[];
  assessment_context: AssessmentContext;
  hint: string | null;
  correct_explanation: string;
  wrong_explanations: Record<string, string> | null;
  source: string;
  exam_year: number;
  governorate: string;
  review_status: ReviewStatus;
  content_version: number;
  normalized_text_hash: string | null;
  created_at?: string;
  updated_at?: string;
}


// ---------------------------------------------------------------------------
// 4. Frontend Uploaded File Entity (CamelCase)
// ---------------------------------------------------------------------------

export interface UploadedFile {
  id: string; // UUID
  name: string;
  size: number;
  fileType: FileType;
  previewUrl: string | null;
  grade: '9' | '12' | null;
  section: Section | null;
  subject: string | null;
  status: FileStatus;
  progress: number; // 0 to 100
  step: string | null;
  examYear: number | null;
  governorate: string | null;
  extractedQuestionsCount: number;
  createdAt?: string;
  updatedAt?: string;

  // Runtime Binary Buffer in Memory
  fileObj?: File;
}


// ---------------------------------------------------------------------------
// 5. Database Uploaded File Row Entity (SnakeCase - PostgreSQL)
// ---------------------------------------------------------------------------

export interface UploadedFileRow {
  id: string;
  name: string;
  size: number;
  file_type: FileType;
  preview_url: string | null;
  grade: '9' | '12' | null;
  section: Section | null;
  subject: string | null;
  status: FileStatus;
  progress: number;
  step: string | null;
  exam_year: number | null;
  governorate: string | null;
  extracted_questions_count: number;
  created_at?: string;
  updated_at?: string;
}


// ---------------------------------------------------------------------------
// 6. User Settings & System Log Interfaces
// ---------------------------------------------------------------------------

export interface UserSettings {
  themeColor: ThemeColor;
  fontSize: FontSize;
  isDarkMode: boolean;
  autoSync: boolean;
  updatedAt?: string;
}

export interface UserSettingsRow {
  id?: string;
  theme_color: ThemeColor;
  font_size: FontSize;
  is_dark_mode: boolean;
  auto_sync: boolean;
  updated_at?: string;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown> | null;
  timestamp: string;
}

export interface FileInput {
  name: string;
  size: number;
  fileType: FileType;
  grade?: '9' | '12' | null;
  section?: Section | null;
  subject?: string | null;
  examYear?: number | null;
  governorate?: string | null;
  previewUrl?: string | null;
}

export interface QuestionInput {
  questionText: string;
  questionType?: QuestionType;
  optionA: string;
  optionB: string;
  optionC?: string | null;
  optionD?: string | null;
  correctOption: CorrectOption;
  grade: Grade;
  section: Section;
  subject: string;
  unit: string;
  lesson: string;
  learningObjectiveCode?: string | null;
  estimatedDifficulty?: Difficulty;
  pValue?: number | null;
  discriminationIndex?: number | null;
  distractorEfficiency?: Record<string, string> | null;
  expectedTime?: number;
  averageSolveTime?: number | null;
  enemyQuestions?: string[];
  relativeQuestions?: string[];
  assessmentContext?: AssessmentContext;
  hint?: string | null;
  correctExplanation: string;
  wrongExplanations?: Record<string, string> | null;
  source?: string;
  examYear?: number;
  governorate?: string;
  reviewStatus?: ReviewStatus;
  contentVersion?: number;
  fileName?: string | null;
}

export interface SystemStats {
  totalFiles: number;
  totalQuestions: number;
  duplicateQuestionsCount: number;
  processedFilesCount: number;
  pendingFilesCount: number;
}


// ---------------------------------------------------------------------------
// 7. Data Conversion Utilities (SnakeCase <-> CamelCase)
// ---------------------------------------------------------------------------

export function mapQuestionRowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    fileId: row.file_id,
    fileName: row.file_name,
    questionText: row.question_text,
    questionType: row.question_type,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctOption: row.correct_option,
    grade: row.grade,
    section: row.section,
    subject: row.subject,
    unit: row.unit,
    lesson: row.lesson,
    learningObjectiveCode: row.learning_objective_code,
    estimatedDifficulty: row.estimated_difficulty,
    pValue: row.p_value,
    discriminationIndex: row.discrimination_index,
    distractorEfficiency: row.distractor_efficiency,
    expectedTime: row.expected_time,
    averageSolveTime: row.average_solve_time,
    enemyQuestions: Array.isArray(row.enemy_questions) ? row.enemy_questions : [],
    relativeQuestions: Array.isArray(row.relative_questions) ? row.relative_questions : [],
    assessmentContext: row.assessment_context,
    hint: row.hint,
    correctExplanation: row.correct_explanation,
    wrongExplanations: row.wrong_explanations,
    source: row.source,
    examYear: row.exam_year,
    governorate: row.governorate,
    reviewStatus: row.review_status,
    contentVersion: row.content_version,
    normalizedTextHash: row.normalized_text_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDuplicate: false,
    status: 'pending'
  };
}

export function mapQuestionToQuestionRow(q: Question): QuestionRow {
  return {
    id: q.id,
    file_id: q.fileId,
    file_name: q.fileName,
    question_text: q.questionText,
    question_type: q.questionType,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_option: q.correctOption,
    grade: q.grade,
    section: q.section,
    subject: q.subject,
    unit: q.unit,
    lesson: q.lesson,
    learning_objective_code: q.learningObjectiveCode,
    estimated_difficulty: q.estimatedDifficulty,
    p_value: q.pValue,
    discrimination_index: q.discriminationIndex,
    distractor_efficiency: q.distractorEfficiency,
    expected_time: q.expectedTime,
    average_solve_time: q.averageSolveTime,
    enemy_questions: q.enemyQuestions || [],
    relative_questions: q.relativeQuestions || [],
    assessment_context: q.assessmentContext,
    hint: q.hint,
    correct_explanation: q.correctExplanation,
    wrong_explanations: q.wrongExplanations,
    source: q.source,
    exam_year: q.examYear,
    governorate: q.governorate,
    review_status: q.reviewStatus,
    content_version: q.contentVersion,
    normalized_text_hash: q.normalizedTextHash,
    created_at: q.createdAt,
    updated_at: q.updatedAt
  };
}

export function mapUploadedFileRowToFile(row: UploadedFileRow): UploadedFile {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    fileType: row.file_type,
    previewUrl: row.preview_url,
    grade: row.grade,
    section: row.section,
    subject: row.subject,
    status: row.status,
    progress: row.progress,
    step: row.step,
    examYear: row.exam_year,
    governorate: row.governorate,
    extractedQuestionsCount: row.extracted_questions_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapUploadedFileToFileRow(file: UploadedFile): UploadedFileRow {
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    file_type: file.fileType,
    preview_url: file.previewUrl,
    grade: file.grade,
    section: file.section,
    subject: file.subject,
    status: file.status,
    progress: file.progress,
    step: file.step,
    exam_year: file.examYear,
    governorate: file.governorate,
    extracted_questions_count: file.extractedQuestionsCount,
    created_at: file.createdAt,
    updated_at: file.updatedAt
  };
}

export function mapUserSettingsRowToSettings(row: UserSettingsRow): UserSettings {
  return {
    themeColor: row.theme_color,
    fontSize: row.font_size,
    isDarkMode: row.is_dark_mode,
    autoSync: row.auto_sync,
    updatedAt: row.updated_at
  };
}
