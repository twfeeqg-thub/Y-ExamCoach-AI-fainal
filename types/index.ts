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

export type FileType = 'pdf' | 'jpg' | 'png' | 'other' | 'json';

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
  repetitionCount?: number; // عدد مرات تكرار السؤال الوزاري
  examYears?: number[]; // قائمة الأعوام الامتحانية التي ورد فيها السؤال
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
  repetition_count?: number | null;
  exam_years?: number[] | null;
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
  repetitionCount?: number;
  examYears?: number[];
}

export interface SystemStats {
  totalFiles: number;
  totalQuestions: number;
  duplicateQuestionsCount: number;
  processedFilesCount: number;
  pendingFilesCount: number;
}


// ---------------------------------------------------------------------------
// 7. Student Tracking Entities
// ---------------------------------------------------------------------------

// 7.1 Student Profile & Preferences
export interface StudentProfile {
  id: string; // UUID
  grade: Grade;
  section: Section | null;
  governorate: string | null;
  targetSubject: string | null;
  createdAt?: string;
}

export interface StudentProfileRow {
  id: string;
  grade: Grade;
  section: Section | null;
  governorate: string | null;
  target_subject: string | null;
  created_at?: string;
}

// 7.2 Learning Objective Mastery State
export interface MasteryState {
  id: string; // UUID
  studentId: string; // FK -> student_profiles.id
  learningObjectiveCode: string;
  masteryScore: number;
  consecutiveCorrect: number;
  lastEvaluatedAt?: string;
}

export interface MasteryStateRow {
  id: string;
  student_id: string;
  learning_objective_code: string;
  mastery_score: number;
  consecutive_correct: number;
  last_evaluated_at?: string;
}

// 7.3 Student Response Log
export interface StudentResponse {
  id: string; // UUID
  studentId: string; // FK -> student_profiles.id
  questionId: string; // FK -> questions.id
  learningObjectiveCode: string | null;
  selectedOption: CorrectOption | null;
  isCorrect: boolean;
  timeTakenSeconds: number | null;
  hintUsed: boolean;
  createdAt?: string;
}

export interface StudentResponseRow {
  id: string;
  student_id: string;
  question_id: string;
  learning_objective_code: string | null;
  selected_option: CorrectOption | null;
  is_correct: boolean;
  time_taken_seconds: number | null;
  hint_used: boolean;
  created_at?: string;
}


// ---------------------------------------------------------------------------
// 8. Data Conversion Utilities (SnakeCase <-> CamelCase)
// ---------------------------------------------------------------------------

export function mapQuestionRowToQuestion(row: QuestionRow | any): Question {
  const text = row.question_text ?? row.questionText ?? row.text ?? '';
  const optA = row.option_a ?? row.optionA ?? '';
  const optB = row.option_b ?? row.optionB ?? '';
  const optC = row.option_c ?? row.optionC ?? null;
  const optD = row.option_d ?? row.optionD ?? null;
  const correctOpt = row.correct_option ?? row.correctOption ?? 'A';

  const mapped: Question = {
    id: row.id,
    fileId: row.file_id ?? row.fileId,
    fileName: row.file_name ?? row.fileName,
    questionText: text,
    questionType: row.question_type ?? row.questionType ?? 'multiple_choice',
    optionA: optA,
    optionB: optB,
    optionC: optC,
    optionD: optD,
    correctOption: correctOpt,
    grade: row.grade,
    section: row.section,
    subject: row.subject,
    unit: row.unit,
    lesson: row.lesson,
    learningObjectiveCode: row.learning_objective_code ?? row.learningObjectiveCode,
    estimatedDifficulty: row.estimated_difficulty ?? row.estimatedDifficulty ?? 'medium',
    pValue: row.p_value ?? row.pValue ?? null,
    discriminationIndex: row.discrimination_index ?? row.discriminationIndex ?? null,
    distractorEfficiency: row.distractor_efficiency ?? row.distractorEfficiency,
    expectedTime: row.expected_time ?? row.expectedTime ?? 60,
    averageSolveTime: row.average_solve_time ?? row.averageSolveTime ?? null,
    enemyQuestions: Array.isArray(row.enemy_questions)
      ? row.enemy_questions
      : (Array.isArray(row.enemyQuestions) ? row.enemyQuestions : []),
    relativeQuestions: Array.isArray(row.relative_questions)
      ? row.relative_questions
      : (Array.isArray(row.relativeQuestions) ? row.relativeQuestions : []),
    assessmentContext: row.assessment_context ?? row.assessmentContext ?? 'summative',
    hint: row.hint,
    correctExplanation: row.correct_explanation ?? row.correctExplanation ?? '',
    wrongExplanations: row.wrong_explanations ?? row.wrongExplanations,
    source: row.source,
    examYear: row.exam_year ?? row.examYear,
    governorate: row.governorate,
    reviewStatus: row.review_status ?? row.reviewStatus,
    contentVersion: row.content_version ?? row.contentVersion,
    normalizedTextHash: row.normalized_text_hash ?? row.normalizedTextHash,
    repetitionCount: typeof row.repetition_count === 'number'
      ? row.repetition_count
      : (typeof row.repetitionCount === 'number'
          ? row.repetitionCount
          : (row.repetition_count ? Number(row.repetition_count) : 1)),
    examYears: Array.isArray(row.exam_years) && row.exam_years.length > 0
      ? row.exam_years
      : (Array.isArray(row.examYears) && row.examYears.length > 0
          ? row.examYears
          : (row.exam_year ? [row.exam_year] : (row.examYear ? [row.examYear] : []))),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    isDuplicate: Boolean(row.is_duplicate ?? row.isDuplicate),
    status: row.status ?? 'pending'
  };

  // Provide snake_case mirror property for seamless multi-format consumer compatibility
  (mapped as any).question_text = text;
  (mapped as any).option_a = optA;
  (mapped as any).option_b = optB;
  (mapped as any).option_c = optC;
  (mapped as any).option_d = optD;
  (mapped as any).correct_option = correctOpt;

  return mapped;
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
    repetition_count: q.repetitionCount ?? 1,
    exam_years: Array.isArray(q.examYears) && q.examYears.length > 0
      ? q.examYears
      : (q.examYear ? [q.examYear] : []),
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


// ---------------------------------------------------------------------------
// 9. Adaptive Session Entities (Client-Side / Offline-First)
// ---------------------------------------------------------------------------

export interface StudentProfileInput {
  grade: Grade;
  section?: Section | null;
  governorate?: string | null;
  targetSubject?: string | null;
}

export interface AdaptiveObjectiveMastery {
  masteryScore: number;
  consecutiveCorrect: number;
}

export type AdaptiveMasteryMap = Record<string, AdaptiveObjectiveMastery>;

export interface AdaptiveSessionState {
  studentId: string;
  subjectCode: string;
  answeredCount: number;
  sessionTarget: number;
  masteryByObjective: AdaptiveMasteryMap;
  answeredQuestionIds: string[];
  currentQuestion: Question | null;
  lastUpdatedAt: string;
}

export interface PendingResponse {
  id: string;
  studentId: string;
  questionId: string;
  selectedOption: CorrectOption | null;
  isCorrect: boolean;
  timeTakenSeconds: number | null;
  hintUsed: boolean;
  syncAttemptedAt?: string;
}

// ---------------------------------------------------------------------------
// 10. Hybrid Lesson Entities (Stage C2)
// ---------------------------------------------------------------------------

export type MediaSourceType = 'url' | 'file_path' | 'youtube_url';

export interface MediaResource {
  sourceType: MediaSourceType;
  url: string;
  title: string;
  durationSeconds?: number;
}

export interface LessonMediaResources {
  audio: MediaResource[];
  video: MediaResource[];
  attachments: MediaResource[];
}

export interface CoreConcept {
  conceptTitle: string;
  explanation: string;
  keyTakeaway?: string;
}

export interface SolvedExample {
  exampleText: string;
  stepByStepSolution: string;
  finalAnswer: string;
}

export interface LessonContent {
  introduction: string;
  coreConcepts: CoreConcept[];
  commonMistakes: string[];
  solvedExamples: SolvedExample[];
  activeRecallSummary: string;
}

export interface LessonInput {
  id?: string;
  grade: Grade;
  section?: Section | string | null;
  subject: string;
  unitTitle?: string | null;
  unitOrder?: number;
  lessonTitle: string;
  lessonOrder?: number;
  learningObjectiveCodes?: string[];
  estimatedReadingTimeMinutes?: number;
  content: LessonContent;
  mediaResources?: {
    audio?: MediaResource[];
    video?: MediaResource[];
    attachments?: MediaResource[];
  };
}

export interface Lesson {
  id: string;
  grade: Grade;
  section: string | null;
  subject: string;
  unitTitle: string | null;
  unitOrder: number;
  lessonTitle: string;
  lessonOrder: number;
  learningObjectiveCodes: string[];
  estimatedReadingTimeMinutes: number;
  content: LessonContent;
  mediaResources: LessonMediaResources;
  createdAt: string;
}

export interface LessonRow {
  id: string;
  grade: number;
  section: string | null;
  subject: string;
  unit_title: string | null;
  unit_order: number;
  lesson_title: string;
  lesson_order: number;
  learning_objective_codes: string[] | null;
  estimated_reading_time_minutes: number;
  content_json: LessonContent | any;
  media_resources: LessonMediaResources | any;
  created_at: string;
}

export function mapLessonRowToLesson(row: LessonRow): Lesson {
  let content: LessonContent;
  if (typeof row.content_json === 'string') {
    try {
      content = JSON.parse(row.content_json);
    } catch {
      content = {
        introduction: row.content_json,
        coreConcepts: [],
        commonMistakes: [],
        solvedExamples: [],
        activeRecallSummary: '',
      };
    }
  } else {
    content = row.content_json || {
      introduction: '',
      coreConcepts: [],
      commonMistakes: [],
      solvedExamples: [],
      activeRecallSummary: '',
    };
  }

  let media: LessonMediaResources = { audio: [], video: [], attachments: [] };
  if (typeof row.media_resources === 'string') {
    try {
      media = JSON.parse(row.media_resources);
    } catch {
      media = { audio: [], video: [], attachments: [] };
    }
  } else if (row.media_resources) {
    media = {
      audio: Array.isArray(row.media_resources.audio) ? row.media_resources.audio : [],
      video: Array.isArray(row.media_resources.video) ? row.media_resources.video : [],
      attachments: Array.isArray(row.media_resources.attachments) ? row.media_resources.attachments : [],
    };
  }

  return {
    id: String(row.id),
    grade: (row.grade === 9 ? 9 : 12) as Grade,
    section: row.section || null,
    subject: row.subject || 'عام',
    unitTitle: row.unit_title || null,
    unitOrder: Number(row.unit_order) || 1,
    lessonTitle: row.lesson_title || 'درس بدون عنوان',
    lessonOrder: Number(row.lesson_order) || 1,
    learningObjectiveCodes: Array.isArray(row.learning_objective_codes)
      ? row.learning_objective_codes
      : [],
    estimatedReadingTimeMinutes: Number(row.estimated_reading_time_minutes) || 10,
    content,
    mediaResources: media,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 9. Gamification & Self-Motivation System Types
// ---------------------------------------------------------------------------

export type BadgeCategory = 'explorer' | 'streak' | 'subject' | 'mastery' | 'milestone';

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  condition: string;
  unlockedAt?: string;
}

export interface StudentGamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  unlockedBadges: string[];
  lastActiveDate?: string;
  totalCorrect?: number;
  completedLessonIds?: string[];
  subjectCounts?: Record<string, number>;
  maxMasteryScore?: number;
}

export interface GamificationEventResult {
  xpGained: number;
  newLevel?: number;
  newBadges: Badge[];
  streakUpdated: boolean;
}

