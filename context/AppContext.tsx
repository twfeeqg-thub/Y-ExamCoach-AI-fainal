'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UploadedFile,
  Question,
  UserSettings,
  FileInput,
  QuestionInput,
  SystemLog,
  SystemStats,
} from '@/types/index';

// ---------------------------------------------------------------------------
// Context Interface
// ---------------------------------------------------------------------------

interface AppContextType {
  // State variables
  files: UploadedFile[];
  questions: Question[];
  settings: UserSettings;
  databaseStatus: 'online' | 'offline' | 'checking';
  isLoading: boolean;
  systemLogs: SystemLog[];
  stats: SystemStats;
  focusFileId: string | null;

  // Action methods
  setFocusFileId: (id: string | null) => void;
  syncFileWithServer: (file: File, metadata: Partial<FileInput>) => Promise<UploadedFile | null>;
  startProcessingFile: (id: string) => Promise<boolean>;
  deleteFileFromStateAndServer: (id: string) => Promise<boolean>;
  
  addQuestions: (questions: QuestionInput[], fileId?: string | null) => Promise<Question[]>;
  updateQuestionInStateAndServer: (id: string, data: Partial<QuestionInput>) => Promise<boolean>;
  deleteQuestionFromStateAndServer: (id: string) => Promise<boolean>;
  deleteAllQuestionsFromStateAndServer: () => Promise<boolean>;

  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  refreshData: () => Promise<void>;
  addLogMessage: (level: SystemLog['level'], source: string, message: string, details?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Fallback Rich Offline Data (In case DB or Server is unreachable)
// ---------------------------------------------------------------------------

const FALLBACK_FILES: UploadedFile[] = [
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

const FALLBACK_QUESTIONS: Question[] = [
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
    id: 'q102-physics-sample',
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
    governorate: 'نابلس',
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
    governorate: 'الخليل',
    reviewStatus: 'approved',
    contentVersion: 1,
    normalizedTextHash: 'hash-sample-103',
    isDuplicate: false,
    status: 'inserted',
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  themeColor: 'blue',
  fontSize: 'md',
  isDarkMode: false,
  autoSync: true,
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Provider Component Implementation
// ---------------------------------------------------------------------------

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [databaseStatus, setDatabaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [focusFileId, setFocusFileId] = useState<string | null>(null);

  // Log Message Helper
  const addLogMessage = (
    level: SystemLog['level'],
    source: string,
    message: string,
    details?: any
  ) => {
    const newLog: SystemLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      level,
      source,
      message,
      details,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
    };
    setSystemLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Calculate System Stats dynamically
  const stats: SystemStats = {
    totalFiles: files.length,
    totalQuestions: questions.length,
    duplicateQuestionsCount: questions.filter((q) => q.isDuplicate).length,
    processedFilesCount: files.filter((f) => f.status === 'completed').length,
    pendingFilesCount: files.filter((f) => f.status === 'pending' || f.status === 'processing').length,
  };

  // ---------------------------------------------------------------------------
  // 1. Parallel Hydration on Mount with Fallback Mechanism
  // ---------------------------------------------------------------------------
  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      addLogMessage('info', 'SystemHydration', 'جاري جلب البيانات والتأكد من اتصال قاعدة البيانات...');

      const [filesRes, questionsRes, settingsRes] = await Promise.all([
        fetch('/api/files').then((res) => (res.ok ? res.json() : Promise.reject(res))),
        fetch('/api/questions').then((res) => (res.ok ? res.json() : Promise.reject(res))),
        fetch('/api/settings').then((res) => (res.ok ? res.json() : Promise.reject(res))),
      ]);

      if (filesRes.success && questionsRes.success) {
        setFiles(filesRes.data || []);
        setQuestions(questionsRes.data || []);
        if (settingsRes.success && settingsRes.data) {
          setSettings(settingsRes.data);
        }
        setDatabaseStatus('online');
        addLogMessage('success', 'SystemHydration', 'تم الاتصال المباشر بقاعدة البيانات وجلب كافة البيانات بنجاح.');
      } else {
        throw new Error('فشل جلب البيانات من الخادم الخلفي');
      }
    } catch (error: any) {
      console.warn('[AppContext] Database/Server offline or unreachable. Switched to Fallback Mode.', error);
      setDatabaseStatus('offline');
      setFiles(FALLBACK_FILES);
      setQuestions(FALLBACK_QUESTIONS);
      setSettings(DEFAULT_SETTINGS);
      addLogMessage('warn', 'SystemHydration', 'تعذر الاتصال بقاعدة البيانات. تم تفعيل نمط التراجع المحلي (Offline Fallback Mode).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. File Synchronization Actions (Pessimistic State Pattern)
  // ---------------------------------------------------------------------------
  const syncFileWithServer = async (
    file: File,
    metadata: Partial<FileInput>
  ): Promise<UploadedFile | null> => {
    try {
      addLogMessage('info', 'FileOperations', `جاري رفع ميتاداتا المستند: ${file.name}`);

      const filePayload: FileInput = {
        name: file.name,
        size: file.size,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : file.name.match(/\.(jpg|jpeg)$/i) ? 'jpg' : file.name.endsWith('.png') ? 'png' : 'other',
        grade: metadata.grade || '12',
        section: metadata.section || 'علمي',
        subject: metadata.subject || 'الرياضيات',
        examYear: metadata.examYear || 2026,
        governorate: metadata.governorate || 'المركزية',
      };

      if (databaseStatus === 'online') {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filePayload),
        });

        if (!res.ok) throw new Error(`فشل إنشاء سجل المستند (${res.status})`);
        const json = await res.json();

        if (json.success && json.data) {
          const createdFile: UploadedFile = {
            ...json.data,
            fileObj: file, // Keep physical binary buffer in live memory
          };
          // Pessimistic state update
          setFiles((prev) => [createdFile, ...prev]);
          addLogMessage('success', 'FileOperations', `تم إنشاء سجل المستند بنجاح بالمعرف ${createdFile.id}`);
          return createdFile;
        }
      }

      // Offline fallback handling
      const fallbackFile: UploadedFile = {
        id: 'file-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        fileType: filePayload.fileType,
        previewUrl: null,
        grade: filePayload.grade || '12',
        section: filePayload.section || 'علمي',
        subject: filePayload.subject || 'عام',
        status: 'pending',
        progress: 0,
        step: 'ready',
        examYear: filePayload.examYear || 2026,
        governorate: filePayload.governorate || 'المركزية',
        extractedQuestionsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileObj: file,
      };

      setFiles((prev) => [fallbackFile, ...prev]);
      addLogMessage('warn', 'FileOperations', `تم تجهيز المستند محلياً في نمط Offline: ${fallbackFile.name}`);
      return fallbackFile;
    } catch (error: any) {
      addLogMessage('error', 'FileOperations', `فشل رفع المستند: ${error.message}`);
      return null;
    }
  };

  const startProcessingFile = async (id: string): Promise<boolean> => {
    const fileItem = files.find((f) => f.id === id);
    if (!fileItem) {
      addLogMessage('error', 'FileProcessing', `لم يتم العثور على المستند بالمعرف: ${id}`);
      return false;
    }

    try {
      addLogMessage('info', 'FileProcessing', `بدء المعالجة والرفع البايناري للمستند: ${fileItem.name}`);

      // Step 1: Update UI progress to 30%
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'processing', progress: 30, step: 'forwarding_to_n8n' } : f
        )
      );

      const formData = new FormData();
      if (fileItem.fileObj) {
        formData.append('file', fileItem.fileObj, fileItem.name);
      } else {
        // Fallback dummy binary text blob if original File object is lost
        const dummyBlob = new Blob([`Binary placeholder for file ${fileItem.name}`], { type: 'text/plain' });
        formData.append('file', dummyBlob, fileItem.name);
      }

      if (databaseStatus === 'online') {
        const res = await fetch(`/api/files/${id}/process`, {
          method: 'POST',
          body: formData, // No explicit Content-Type header so browser sets multipart boundary
        });

        const json = await res.json();
        if (json.success) {
          // Update state to 100% processing
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: 'processing', progress: 100, step: 'waiting_for_extraction' }
                : f
            )
          );
          addLogMessage('success', 'FileProcessing', `تم تمرير بايناري المستند إلى n8n بنجاح بانتظار استخلاص الأسئلة.`);
          return true;
        } else {
          throw new Error(json.error || 'فشل معالجة المستند عبر n8n');
        }
      }

      // Offline simulated process
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: 'completed', progress: 100, step: 'completed', extractedQuestionsCount: 3 }
              : f
          )
        );
      }, 1500);

      addLogMessage('success', 'FileProcessing', `تم محاكاة معالجة واستخلاص الملف بنجاح (Offline Mode).`);
      return true;
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'failed', progress: 0, step: 'n8n_forwarding_failed' } : f
        )
      );
      addLogMessage('error', 'FileProcessing', `فشلت معالجة المستند: ${error.message}`);
      return false;
    }
  };

  const deleteFileFromStateAndServer = async (id: string): Promise<boolean> => {
    try {
      addLogMessage('info', 'FileOperations', `جاري حذف المستند ID: ${id}`);

      if (databaseStatus === 'online') {
        const res = await fetch(`/api/files?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'فشل الحذف من الخادم');
      }

      // Pessimistic state update upon confirmation
      setFiles((prev) => prev.filter((f) => f.id !== id));
      addLogMessage('success', 'FileOperations', `تم حذف المستند بنجاح.`);
      return true;
    } catch (error: any) {
      addLogMessage('error', 'FileOperations', `خطأ في حذف المستند: ${error.message}`);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Question Bank Actions (Pessimistic Pattern)
  // ---------------------------------------------------------------------------
  const addQuestions = async (
    newQuestions: QuestionInput[],
    fileId?: string | null
  ): Promise<Question[]> => {
    try {
      addLogMessage('info', 'QuestionBank', `جاري إضافة ${newQuestions.length} سؤال إلى بنك الأسئلة...`);

      if (databaseStatus === 'online') {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, questions: newQuestions }),
        });

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const insertedList: Question[] = json.data;
          setQuestions((prev) => [...insertedList, ...prev]);
          addLogMessage('success', 'QuestionBank', `تم معالجة وإضافة ${insertedList.length} سؤال ببنك الأسئلة.`);
          return insertedList;
        }
      }

      // Offline Fallback for Question Insertion
      const fallbackQuestions: Question[] = newQuestions.map((q, idx) => ({
        id: 'q-offline-' + Math.random().toString(36).substring(2, 9),
        fileId: fileId || null,
        fileName: q.fileName || 'مستند_مباشر.pdf',
        questionText: q.questionText,
        questionType: q.questionType || 'multiple_choice',
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC || null,
        optionD: q.optionD || null,
        correctOption: q.correctOption,
        grade: q.grade,
        section: q.section,
        subject: q.subject,
        unit: q.unit,
        lesson: q.lesson,
        learningObjectiveCode: q.learningObjectiveCode || null,
        estimatedDifficulty: q.estimatedDifficulty || 'medium',
        pValue: q.pValue || null,
        discriminationIndex: q.discriminationIndex || null,
        distractorEfficiency: q.distractorEfficiency || null,
        expectedTime: q.expectedTime || 60,
        averageSolveTime: q.averageSolveTime || null,
        enemyQuestions: q.enemyQuestions || [],
        relativeQuestions: q.relativeQuestions || [],
        assessmentContext: q.assessmentContext || 'summative',
        hint: q.hint || null,
        correctExplanation: q.correctExplanation,
        wrongExplanations: q.wrongExplanations || null,
        source: q.source || 'المدرب الذكي',
        examYear: q.examYear || 2026,
        governorate: q.governorate || 'المركزية',
        reviewStatus: q.reviewStatus || 'pending_review',
        contentVersion: q.contentVersion || 1,
        normalizedTextHash: 'hash-' + idx,
        isDuplicate: false,
        status: 'inserted',
      }));

      setQuestions((prev) => [...fallbackQuestions, ...prev]);
      addLogMessage('warn', 'QuestionBank', `تم إضافة الأسئلة محلياً في نمط Offline.`);
      return fallbackQuestions;
    } catch (error: any) {
      addLogMessage('error', 'QuestionBank', `فشلت عملية إضافة الأسئلة: ${error.message}`);
      return [];
    }
  };

  const updateQuestionInStateAndServer = async (
    id: string,
    data: Partial<QuestionInput>
  ): Promise<boolean> => {
    try {
      addLogMessage('info', 'QuestionBank', `تحديث السؤال ID: ${id}`);

      if (databaseStatus === 'online') {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: { ...data, id } }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'فشل التحديث بالخادم');
      }

      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...data } : q))
      );
      addLogMessage('success', 'QuestionBank', `تم تحديث بيانات السؤال بنجاح.`);
      return true;
    } catch (error: any) {
      addLogMessage('error', 'QuestionBank', `خطأ في تحديث السؤال: ${error.message}`);
      return false;
    }
  };

  const deleteQuestionFromStateAndServer = async (id: string): Promise<boolean> => {
    try {
      addLogMessage('info', 'QuestionBank', `حذف السؤال ID: ${id}`);

      if (databaseStatus === 'online') {
        const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'فشل حذف السؤال من الخادم');
      }

      setQuestions((prev) => prev.filter((q) => q.id !== id));
      addLogMessage('success', 'QuestionBank', `تم حذف السؤال بنجاح.`);
      return true;
    } catch (error: any) {
      addLogMessage('error', 'QuestionBank', `خطأ في حذف السؤال: ${error.message}`);
      return false;
    }
  };

  const deleteAllQuestionsFromStateAndServer = async (): Promise<boolean> => {
    try {
      addLogMessage('info', 'QuestionBank', `مسح وتصفير بنك الأسئلة بالكامل...`);

      if (databaseStatus === 'online') {
        const res = await fetch('/api/questions?all=true', { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'فشل تصفير بنك الأسئلة بالخادم');
      }

      setQuestions([]);
      addLogMessage('success', 'QuestionBank', `تم تصفير بنك الأسئلة بنجاح.`);
      return true;
    } catch (error: any) {
      addLogMessage('error', 'QuestionBank', `خطأ في مسح بنك الأسئلة: ${error.message}`);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // 4. User Settings Actions
  // ---------------------------------------------------------------------------
  const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };

      if (databaseStatus === 'online') {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
          addLogMessage('success', 'Settings', 'تم حفظ وتنسيق تفضيلات المظهر بنجاح.');
          return true;
        }
      }

      setSettings(merged);
      addLogMessage('info', 'Settings', 'تم تحديث التفضيلات البصرية محلياً.');
      return true;
    } catch (error: any) {
      addLogMessage('error', 'Settings', `خطأ في حفظ الإعدادات: ${error.message}`);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        files,
        questions,
        settings,
        databaseStatus,
        isLoading,
        systemLogs,
        stats,
        focusFileId,
        setFocusFileId,
        syncFileWithServer,
        startProcessingFile,
        deleteFileFromStateAndServer,
        addQuestions,
        updateQuestionInStateAndServer,
        deleteQuestionFromStateAndServer,
        deleteAllQuestionsFromStateAndServer,
        updateUserSettings,
        refreshData,
        addLogMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
