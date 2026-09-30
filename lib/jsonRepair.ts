import { QuestionInput } from '@/types/index';

/**
 * Robust JSON repair and parsing utility.
 * Handles common real-world errors when users copy-paste JSON or output from LLM/OCR models:
 * - Empty / missing values for keys like `"examYears": \n },` or `"examYears": ,`
 * - Trailing commas in objects or arrays: `[1, 2, ],` or `{"a": 1, }`
 * - Markdown fences: ```json ... ```
 * - Surrounding chat / intro text
 * - Missing commas between objects
 * - Root payload variations: arrays `[...]`, single objects `{...}`, or wrapped `{ questions: [...] }`
 */

export interface RobustParseResult<T = any> {
  success: boolean;
  data: T | null;
  repaired: boolean;
  repairedText?: string;
  errorMessage?: string;
  errorLine?: number;
}

export function repairJsonString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '{}';
  let s = raw.trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ...)
  s = s.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '').trim();

  // 2. Extract from first { or [ to last } or ] if surrounded by extra text
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  const lastBrace = s.lastIndexOf('}');
  const lastBracket = s.lastIndexOf(']');
  let endIdx = s.length;
  if (lastBrace !== -1 && lastBracket !== -1) {
    endIdx = Math.max(lastBrace, lastBracket) + 1;
  } else if (lastBrace !== -1) {
    endIdx = lastBrace + 1;
  } else if (lastBracket !== -1) {
    endIdx = lastBracket + 1;
  }
  if (startIdx >= 0 && endIdx > startIdx) {
    s = s.slice(startIdx, endIdx);
  }

  // 3. Remove JS comments (// ... and /* ... */)
  s = s.replace(/\/\/[^\n\r]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. Fix missing or empty values before comma, closing brace, or bracket
  // Example: `"examYears": \n },` or `"examYears": ,` or `"repetitionCount": \n }`
  s = s.replace(/"([^"]+)"\s*:\s*(?=[,\}\]])/g, (_match, key) => {
    if (/years|list|array|questions|options/i.test(key)) {
      return `"${key}": []`;
    }
    if (/count|order|time|index|score|grade|year/i.test(key)) {
      return `"${key}": 1`;
    }
    return `"${key}": null`;
  });

  // 5. Remove trailing commas before } or ]
  for (let i = 0; i < 3; i++) {
    s = s.replace(/,\s*([\}\]])/g, '$1');
  }

  // 6. Fix missing commas between consecutive objects or array items: } { or ] [
  s = s.replace(/\}\s*\{/g, '},{').replace(/\]\s*\[/g, '],[');

  return s;
}

/**
 * Safely parse JSON with automatic repair and fallback recovery.
 */
export function robustParseJson<T = any>(raw: string): RobustParseResult<T> {
  if (!raw || !raw.trim()) {
    return {
      success: false,
      data: null,
      repaired: false,
      errorMessage: 'نص JSON فارغ. يرجى لصق كائن أو مصفوفة صالحة.',
    };
  }

  // Attempt 1: Direct JSON.parse
  try {
    const data = JSON.parse(raw);
    return {
      success: true,
      data,
      repaired: false,
    };
  } catch (initialErr: any) {
    // Attempt 2: Try with repaired string
    try {
      const repaired = repairJsonString(raw);
      const data = JSON.parse(repaired);
      return {
        success: true,
        data,
        repaired: true,
        repairedText: repaired,
      };
    } catch (_repairedErr: any) {
      // Attempt 3: Try auto-closing braces and brackets
      try {
        let fixed = repairJsonString(raw);
        let openBraces = (fixed.match(/\{/g) || []).length;
        let closeBraces = (fixed.match(/\}/g) || []).length;
        let openBrackets = (fixed.match(/\[/g) || []).length;
        let closeBrackets = (fixed.match(/\]/g) || []).length;

        while (openBrackets > closeBrackets) {
          fixed += ']';
          closeBrackets++;
        }
        while (openBraces > closeBraces) {
          fixed += '}';
          closeBraces++;
        }

        const data = JSON.parse(fixed);
        return {
          success: true,
          data,
          repaired: true,
          repairedText: fixed,
        };
      } catch (finalErr: any) {
        // Extract line info if available
        let errorLine: number | undefined;
        const lineMatch = initialErr.message.match(/line (\d+)/i) || finalErr.message.match(/line (\d+)/i);
        if (lineMatch) {
          errorLine = parseInt(lineMatch[1], 10);
        }

        return {
          success: false,
          data: null,
          repaired: false,
          errorMessage: initialErr.message || 'فشل تحليل كود JSON',
          errorLine,
        };
      }
    }
  }
}

/**
 * Normalizes any parsed JSON into standard questions payload:
 * { fileName, questions, metadata }
 */
export function normalizeQuestionImportPayload(
  parsed: any,
  defaultFileName?: string
): { fileName: string; questions: QuestionInput[]; metadata: Record<string, any> } {
  const fileName =
    parsed?.fileName ||
    defaultFileName ||
    `PastedContent-${new Date().toISOString().slice(0, 10)}.json`;

  let rawList: any[] = [];
  let metadata: Record<string, any> = parsed?.metadata || {};

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) {
      rawList = parsed.questions;
    } else if (Array.isArray(parsed.data)) {
      rawList = parsed.data;
    } else if (Array.isArray(parsed.items)) {
      rawList = parsed.items;
    } else if (Array.isArray(parsed.list)) {
      rawList = parsed.list;
    } else if (parsed.questionText) {
      // Single question object
      rawList = [parsed];
    }
  }

  // Sanitize each question
  const questions: QuestionInput[] = rawList.map((item, idx) => {
    const qText = String(item.questionText || item.question || item.text || `سؤال ${idx + 1}`).trim();
    const optA = String(item.optionA || item.option_a || (Array.isArray(item.options) ? item.options[0] : 'أ')).trim();
    const optB = String(item.optionB || item.option_b || (Array.isArray(item.options) ? item.options[1] : 'ب')).trim();
    const optC = item.optionC || item.option_c || (Array.isArray(item.options) && item.options[2] ? String(item.options[2]).trim() : null);
    const optD = item.optionD || item.option_d || (Array.isArray(item.options) && item.options[3] ? String(item.options[3]).trim() : null);

    let correctOpt: any = String(item.correctOption || item.correct_option || item.answer || 'A').toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(correctOpt)) {
      correctOpt = 'A';
    }

    let examYears: number[] = [];
    if (Array.isArray(item.examYears)) {
      examYears = item.examYears.map((y: any) => Number(y)).filter((y: number) => !isNaN(y) && y > 1900);
    } else if (Array.isArray(item.exam_years)) {
      examYears = item.exam_years.map((y: any) => Number(y)).filter((y: number) => !isNaN(y) && y > 1900);
    } else if (item.examYear && !isNaN(Number(item.examYear))) {
      examYears = [Number(item.examYear)];
    }

    const repCount = Number(item.repetitionCount || item.repetition_count || (examYears.length > 0 ? examYears.length : 1));

    return {
      questionText: qText,
      questionType: item.questionType || 'multiple_choice',
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctOption: correctOpt,
      grade: item.grade === 9 ? 9 : 12,
      section: item.section || 'علمي',
      subject: item.subject || 'عام',
      unit: item.unit || 'الوحدة الأولى',
      lesson: item.lesson || 'الدرس الأول',
      learningObjectiveCode: item.learningObjectiveCode || item.learning_objective_code || null,
      estimatedDifficulty: item.estimatedDifficulty || item.estimated_difficulty || 'medium',
      pValue: typeof item.pValue === 'number' ? item.pValue : 0.7,
      discriminationIndex: typeof item.discriminationIndex === 'number' ? item.discriminationIndex : 0.4,
      distractorEfficiency: item.distractorEfficiency || null,
      expectedTime: typeof item.expectedTime === 'number' ? item.expectedTime : 60,
      averageSolveTime: typeof item.averageSolveTime === 'number' ? item.averageSolveTime : null,
      enemyQuestions: Array.isArray(item.enemyQuestions) ? item.enemyQuestions : [],
      relativeQuestions: Array.isArray(item.relativeQuestions) ? item.relativeQuestions : [],
      assessmentContext: item.assessmentContext || 'summative',
      hint: item.hint || null,
      correctExplanation: item.correctExplanation || item.explanation || 'إجابة نموذجية صحيحة ومثبتة علمياً',
      wrongExplanations: item.wrongExplanations || null,
      source: item.source || 'بنك الأسئلة الموحد',
      examYear: examYears.length > 0 ? examYears[examYears.length - 1] : (item.examYear || 2024),
      governorate: item.governorate || 'المركزية',
      reviewStatus: item.reviewStatus || 'pending_review',
      contentVersion: item.contentVersion || 1,
      fileName,
      repetitionCount: repCount,
      examYears,
    };
  });

  return { fileName, questions, metadata };
}

/**
 * Standard, beautiful sample JSON template demonstrating all fields,
 * including repeated ministerial exam fields (`examYears` and `repetitionCount`).
 */
export const SAMPLE_QUESTIONS_JSON = JSON.stringify(
  {
    fileName: 'نماذج_وزارية_الثانوية_العامة.json',
    metadata: {
      grade: '12',
      section: 'علمي',
      subject: 'الفيزياء',
      examYear: 2024,
      governorate: 'المركزية',
    },
    questions: [
      {
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
        estimatedDifficulty: 'medium',
        pValue: 0.72,
        discriminationIndex: 0.45,
        expectedTime: 60,
        hint: 'تذكر علاقة القدرة الكهربائية بشدة التيار والمقاومة P = I^2 * R.',
        correctExplanation: 'العلاقة تربيعية P = I^2 * R، فعند مضاعفة التيار إلى 2I تصبح القدرة (2I)^2 * R = 4 * I^2 * R = 4P.',
        source: 'امتحان الثانوية العامة الوزاري',
        examYear: 2024,
        repetitionCount: 3,
        examYears: [2018, 2021, 2024],
      },
      {
        questionText: 'ما هي وحدة قياس السعة الكهربائية في النظام الدولي للوحدات (SI)؟',
        questionType: 'multiple_choice',
        optionA: 'الفاراد (F)',
        optionB: 'الجول (J)',
        optionC: 'الكولوم (C)',
        optionD: 'التسلا (T)',
        correctOption: 'A',
        grade: 12,
        section: 'علمي',
        subject: 'الفيزياء',
        unit: 'الكهرباء الساكنة',
        lesson: 'المواسعات الكهربائية',
        learningObjectiveCode: 'PHYS-12-CAP-01',
        estimatedDifficulty: 'easy',
        pValue: 0.88,
        discriminationIndex: 0.35,
        expectedTime: 45,
        hint: 'تنسب الوحدة للعالم مايكل فاراداي.',
        correctExplanation: 'تقاس السعة الكهربائية بالفاراد (Farad) وتكافئ كولوم لكل فولت (C/V).',
        source: 'امتحان الثانوية العامة الوزاري',
        examYear: 2023,
        repetitionCount: 2,
        examYears: [2019, 2023],
      },
    ],
  },
  null,
  2
);
