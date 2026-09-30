/**
 * Unified Lesson Validator & Normalizer
 * Stage C2 - Hybrid Lesson Intake Engine
 */

import {
  Grade,
  LessonInput,
  LessonContent,
  LessonMediaResources,
  MediaResource,
  CoreConcept,
  SolvedExample,
} from '@/types/index';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: LessonInput;
}

export interface ListValidationResult {
  validLessons: LessonInput[];
  failedCount: number;
  errors: string[];
}

/**
 * Normalizes and validates a single lesson input object.
 * Intelligently handles variations from Gemini Notebook, JSON files, and manual form data.
 */
export function validateLessonInput(raw: any): ValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['البيانات المدخلة للدرس فارغة أو غير صالحة'] };
  }

  // 1. Grade (9 or 12)
  let grade: Grade = 12;
  const rawGrade = raw.grade ?? raw.Grade ?? raw.grade_level ?? raw.gradeLevel;
  if (rawGrade !== undefined && rawGrade !== null) {
    const gradeStr = String(rawGrade).trim();
    if (gradeStr === '9' || gradeStr.includes('تاسع') || gradeStr.includes('اساسي') || gradeStr.includes('أساسي')) {
      grade = 9;
    } else {
      grade = 12;
    }
  }

  // 2. Subject
  const subjectRaw =
    raw.subject ??
    raw.Subject ??
    raw.targetSubject ??
    raw.target_subject ??
    raw.course ??
    raw.material;
  const subject =
    typeof subjectRaw === 'string' && subjectRaw.trim().length > 0
      ? subjectRaw.trim()
      : 'عام';

  // 3. Lesson Title
  const lessonTitleRaw =
    raw.lesson_title ??
    raw.lessonTitle ??
    raw.title ??
    raw.LessonTitle ??
    raw.name ??
    raw.lesson;
  const lessonTitle =
    typeof lessonTitleRaw === 'string' && lessonTitleRaw.trim().length > 0
      ? lessonTitleRaw.trim()
      : '';
  if (!lessonTitle) {
    errors.push('عنوان الدرس (lesson_title) إلزامي ولا يمكن تركه فارغاً');
  }

  // 4. Section & Unit
  const sectionRaw = raw.section ?? raw.Section;
  const section =
    typeof sectionRaw === 'string' && sectionRaw.trim().length > 0
      ? sectionRaw.trim()
      : null;

  const unitTitleRaw =
    raw.unit_title ??
    raw.unitTitle ??
    raw.unit ??
    raw.UnitTitle ??
    raw.unit_name;
  const unitTitle =
    typeof unitTitleRaw === 'string' && unitTitleRaw.trim().length > 0
      ? unitTitleRaw.trim()
      : null;

  const unitOrderRaw = raw.unit_order ?? raw.unitOrder;
  const unitOrder = Number(unitOrderRaw) > 0 ? Math.floor(Number(unitOrderRaw)) : 1;

  const lessonOrderRaw = raw.lesson_order ?? raw.lessonOrder;
  const lessonOrder = Number(lessonOrderRaw) > 0 ? Math.floor(Number(lessonOrderRaw)) : 1;

  // 5. Learning Objective Codes
  let learningObjectiveCodes: string[] = [];
  const rawCodes =
    raw.learning_objective_codes ??
    raw.learningObjectiveCodes ??
    raw.objectives ??
    raw.codes ??
    raw.learning_objectives;
  if (Array.isArray(rawCodes)) {
    learningObjectiveCodes = rawCodes
      .map((c) => String(c).trim())
      .filter((c) => c.length > 0);
  } else if (typeof rawCodes === 'string' && rawCodes.trim().length > 0) {
    learningObjectiveCodes = rawCodes
      .split(/[,،\n]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  }

  // 6. Estimated Reading Time
  const timeRaw =
    raw.estimated_reading_time_minutes ??
    raw.estimatedReadingTimeMinutes ??
    raw.readingTimeMinutes ??
    raw.readingTime ??
    raw.reading_time;
  const estimatedReadingTimeMinutes = Number(timeRaw) > 0 ? Math.floor(Number(timeRaw)) : 10;

  // 7. Content Normalization
  let rawContent = raw.content_json ?? raw.content ?? raw.body ?? raw;
  if (rawContent && typeof rawContent === 'object' && rawContent.content_json) {
    rawContent = rawContent.content_json;
  }
  const content = normalizeContent(rawContent);

  // 8. Media Resources Normalization
  const rawMedia = raw.media_resources ?? raw.mediaResources ?? raw.media;
  const mediaResources = normalizeMediaResources(rawMedia);

  const id = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : undefined;

  const sanitized: LessonInput = {
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
  };

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}

/**
 * Normalizes content object into standard LessonContent structure
 */
function normalizeContent(rawContent: any): LessonContent {
  if (typeof rawContent === 'string') {
    try {
      rawContent = JSON.parse(rawContent);
    } catch {
      // Keep as string introduction if not JSON
    }
  }

  if (!rawContent || typeof rawContent !== 'object') {
    return {
      introduction: typeof rawContent === 'string' ? rawContent.trim() : '',
      coreConcepts: [],
      commonMistakes: [],
      solvedExamples: [],
      activeRecallSummary: '',
    };
  }

  // Introduction
  const introRaw =
    rawContent.introduction ??
    rawContent.intro ??
    rawContent.summary ??
    rawContent.overview ??
    '';
  const introduction = typeof introRaw === 'string' ? introRaw.trim() : '';

  // Core Concepts
  const rawConcepts =
    rawContent.core_concepts ??
    rawContent.coreConcepts ??
    rawContent.concepts ??
    rawContent.key_concepts ??
    [];
  const coreConcepts: CoreConcept[] = [];
  if (Array.isArray(rawConcepts)) {
    for (const c of rawConcepts) {
      if (typeof c === 'string' && c.trim().length > 0) {
        coreConcepts.push({ conceptTitle: 'مفهوم أساسي', explanation: c.trim() });
      } else if (c && typeof c === 'object') {
        const title = c.concept_title ?? c.conceptTitle ?? c.title ?? c.name ?? 'مفهوم رئيسي';
        const expl = c.explanation ?? c.description ?? c.text ?? c.content ?? '';
        const key = c.key_takeaway ?? c.keyTakeaway ?? c.takeaway ?? c.summary;
        if (expl || title) {
          coreConcepts.push({
            conceptTitle: String(title).trim(),
            explanation: String(expl).trim(),
            keyTakeaway: key ? String(key).trim() : undefined,
          });
        }
      }
    }
  }

  // Common Mistakes
  const rawMistakes =
    rawContent.common_mistakes ??
    rawContent.commonMistakes ??
    rawContent.mistakes ??
    rawContent.pitfalls ??
    [];
  let commonMistakes: string[] = [];
  if (Array.isArray(rawMistakes)) {
    commonMistakes = rawMistakes
      .map((m) => (typeof m === 'string' ? m.trim() : m?.text || m?.mistake || ''))
      .filter((m) => m.length > 0);
  } else if (typeof rawMistakes === 'string' && rawMistakes.trim().length > 0) {
    commonMistakes = rawMistakes.split(/[\n;]+/).map((m) => m.trim()).filter((m) => m.length > 0);
  }

  // Solved Examples
  const rawExamples =
    rawContent.solved_examples ??
    rawContent.solvedExamples ??
    rawContent.examples ??
    rawContent.solved_problems ??
    [];
  const solvedExamples: SolvedExample[] = [];
  if (Array.isArray(rawExamples)) {
    for (const ex of rawExamples) {
      if (ex && typeof ex === 'object') {
        const text = ex.example_text ?? ex.exampleText ?? ex.question ?? ex.text ?? ex.problem ?? '';
        const solution =
          ex.step_by_step_solution ??
          ex.stepByStepSolution ??
          ex.solution ??
          ex.steps ??
          '';
        const answer = ex.final_answer ?? ex.finalAnswer ?? ex.answer ?? ex.result ?? '';
        if (text || solution) {
          solvedExamples.push({
            exampleText: String(text).trim(),
            stepByStepSolution: String(solution).trim(),
            finalAnswer: String(answer).trim(),
          });
        }
      }
    }
  }

  // Active Recall Summary
  const rawRecall =
    rawContent.active_recall_summary ??
    rawContent.activeRecallSummary ??
    rawContent.activeRecall ??
    rawContent.active_recall ??
    rawContent.quizQuestions ??
    rawContent.quick_review ??
    '';
  let activeRecallSummary = '';
  if (typeof rawRecall === 'string') {
    activeRecallSummary = rawRecall.trim();
  } else if (Array.isArray(rawRecall)) {
    activeRecallSummary = rawRecall.map((r) => String(r).trim()).join('\n• ');
  }

  return {
    introduction,
    coreConcepts,
    commonMistakes,
    solvedExamples,
    activeRecallSummary,
  };
}

/**
 * Normalizes media resources into audio, video, attachments buckets
 */
function normalizeMediaResources(rawMedia: any): LessonMediaResources {
  const result: LessonMediaResources = {
    audio: [],
    video: [],
    attachments: [],
  };

  if (!rawMedia || typeof rawMedia !== 'object') {
    return result;
  }

  const parseItem = (item: any): MediaResource | null => {
    if (!item) return null;
    if (typeof item === 'string') {
      const isYoutube = item.includes('youtube.com') || item.includes('youtu.be');
      return {
        sourceType: isYoutube ? 'youtube_url' : 'url',
        url: item.trim(),
        title: 'رابط خارجي',
      };
    }
    if (typeof item === 'object' && item.url) {
      const url = String(item.url).trim();
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      const srcType = item.sourceType ?? item.source_type ?? (isYoutube ? 'youtube_url' : 'url');
      return {
        sourceType: srcType as any,
        url,
        title: item.title ? String(item.title).trim() : 'مورد وسائط',
        durationSeconds: Number(item.durationSeconds ?? item.duration_seconds) || undefined,
      };
    }
    return null;
  };

  if (Array.isArray(rawMedia.audio)) {
    result.audio = rawMedia.audio.map(parseItem).filter(Boolean) as MediaResource[];
  }
  if (Array.isArray(rawMedia.video)) {
    result.video = rawMedia.video.map(parseItem).filter(Boolean) as MediaResource[];
  }
  if (Array.isArray(rawMedia.attachments)) {
    result.attachments = rawMedia.attachments.map(parseItem).filter(Boolean) as MediaResource[];
  }

  return result;
}

/**
 * Validates a list of lesson items (from bulk Gemini Notebook export or multi-lesson JSON)
 */
export function validateLessonList(items: any[]): ListValidationResult {
  const validLessons: LessonInput[] = [];
  const errors: string[] = [];
  let failedCount = 0;

  if (!Array.isArray(items) || items.length === 0) {
    return { validLessons: [], failedCount: 0, errors: ['قائمة الدروس فارغة'] };
  }

  items.forEach((item, index) => {
    const res = validateLessonInput(item);
    if (res.valid && res.sanitized) {
      validLessons.push(res.sanitized);
    } else {
      failedCount++;
      errors.push(`العنصر [${index + 1}]: ${res.errors.join('، ')}`);
    }
  });

  return {
    validLessons,
    failedCount,
    errors,
  };
}
