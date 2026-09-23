'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { FileInput, UploadedFile, QuestionInput } from '@/types/index';
import { triggerSupportToast } from '@/components/SupportToast';
import { getRandomSupportMessage } from '@/lib/psychologicalSupport';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Filter,
  Sparkles,
  Clock,
  Loader2,
  X,
  FileUp,
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  Heart,
  FileJson,
  ClipboardPaste,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const {
    files,
    syncFileWithServer,
    startProcessingFile,
    deleteFileFromStateAndServer,
    focusFileId,
    setFocusFileId,
    importJsonQuestions,
  } = useApp();

  // Component State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [showJsonPasteModal, setShowJsonPasteModal] = useState<boolean>(false);
  const [jsonPasteContent, setJsonPasteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Metadata Form State
  const [metadata, setMetadata] = useState<FileInput>({
    name: '',
    size: 0,
    fileType: 'pdf',
    grade: '12',
    section: 'علمي',
    subject: 'الرياضيات',
    examYear: 2024,
    governorate: 'المركزية',
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json') {
        handleJsonFileSelect(e.dataTransfer.files);
      } else {
        prepareFileForMetadata(file);
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      prepareFileForMetadata(e.target.files[0]);
    }
  };

  const prepareFileForMetadata = (file: File) => {
    setSelectedFileObj(file);
    setMetadata((prev) => ({
      ...prev,
      name: file.name,
      size: file.size,
      fileType: file.name.endsWith('.pdf') ? 'pdf' : file.name.match(/\.(jpg|jpeg)$/i) ? 'jpg' : file.name.endsWith('.png') ? 'png' : 'other',
    }));
    setShowMetadataModal(true);
  };

  const handleConfirmAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileObj) return;

    if (!metadata.subject.trim() || !metadata.governorate.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية للمستند');
      return;
    }

    setIsSubmitting(true);
    try {
      await syncFileWithServer(selectedFileObj, metadata);
      setShowMetadataModal(false);
      setSelectedFileObj(null);
      triggerSupportToast({
        title: 'تم تجهيز المستند بنجاح',
        message: getRandomSupportMessage('uploadSuccess'),
        type: 'success',
      });
    } catch (err) {
      console.error('Error syncing file:', err);
      triggerSupportToast({
        title: 'فشل رفع المستند',
        message: 'حدث خطأ أثناء محاولة رفع المستند، يرجى المحاولة مرة أخرى.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartProcessing = async (id: string) => {
    const success = await startProcessingFile(id);
    if (success) {
      triggerSupportToast({
        title: 'بدأت عملية الاستخلاص الذكي',
        message: getRandomSupportMessage('processing'),
        type: 'processing',
      });
    }
  };

  const handleJsonFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        handleJsonImport(data, file.name);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        triggerSupportToast({
          title: 'ملف JSON غير صالح',
          message: 'تعذر تحليل الملف. يرجى التأكد من أن الملف يحتوي على تنسيق JSON صحيح.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(jsonPasteContent);
      await handleJsonImport(data, `PastedContent-${new Date().toISOString()}.json`);
      setShowJsonPasteModal(false);
      setJsonPasteContent('');
    } catch (error) {
      console.error('Error parsing pasted JSON:', error);
      triggerSupportToast({
        title: 'نص JSON غير صالح',
        message: 'تعذر تحليل النص. يرجى التأكد من أن النص الذي تم لصقه هو بتنسيق JSON صحيح.',
        type: 'error',
      });
    }
  };

  const handleJsonImport = async (data: { questions: QuestionInput[], [key: string]: any }, fileName: string) => {
    if (!data.questions || !Array.isArray(data.questions)) {
      triggerSupportToast({
        title: 'بنية JSON غير متوافقة',
        message: 'يجب أن يحتوي الكائن الجذري على خاصية "questions" وهي عبارة عن مصفوفة.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await importJsonQuestions({
        fileName,
        questions: data.questions,
        metadata: data.metadata || {},
      });

      triggerSupportToast({
        title: 'اكتمل استيراد JSON',
        message: `تم بنجاح إدراج ${result.insertedCount} سؤالاً وتجاهل ${result.ignoredCount} سؤالاً مكرراً.`,
        type: 'success',
      });

    } catch (error: any) {
      console.error("Failed to import JSON questions:", error);
      triggerSupportToast({
        title: 'فشل استيراد JSON',
        message: error.message || 'حدث خطأ غير متوقع أثناء عملية الاستيراد.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileUp className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>رفع ومعالجة المستندات</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1">
            ارفع الامتحانات (PDF/صور)، أو قم باستيراد أسئلة جاهزة مباشرة من ملفات JSON.
          </p>
        </div>

        {focusFileId && (
          <div className="flex items-center justify-between md:justify-start gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse shrink-0" />
              <span>وضع التركيز مفعل</span>
            </div>
            <button
              onClick={() => setFocusFileId(null)}
              className="hover:bg-blue-200 dark:hover:bg-blue-900 p-1 rounded-full transition"
              title="إلغاء وضع التركيز"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 md:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 scale-[1.01] shadow-xl'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm'
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.png,.jpg,.jpeg" className="hidden" />
        <input type="file" ref={jsonInputRef} onChange={(e) => handleJsonFileSelect(e.target.files)} accept=".json" className="hidden" />

        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner shrink-0">
          <UploadCloud className="w-8 h-8 md:w-10 md:h-10 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base md:text-xl font-bold text-slate-800 dark:text-slate-200">
            اسحب وأسقط ملف الامتحان (PDF/JPG) أو ملف الأسئلة (JSON)
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            يمكنك رفع الامتحانات التقليدية أو استيراد بنوك الأسئلة الجاهزة.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>رفع PDF/صورة</span>
          </button>
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            <span>استيراد ملف JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setShowJsonPasteModal(true)}
            className="px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-500/20 transition flex items-center justify-center gap-2"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>لصق نص JSON</span>
          </button>
        </div>
      </div>
      
      {/* JSON Paste Modal */}
      {showJsonPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">لصق محتوى JSON</h3>
            <form onSubmit={handlePasteModalSubmit}>
              <textarea
                value={jsonPasteContent}
                onChange={(e) => setJsonPasteContent(e.target.value)}
                placeholder='{ "fileName": "MyPastedQuestions.json", "questions": [ ... ] }'
                className="w-full h-64 p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                required
              />
              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowJsonPasteModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
                <button type="submit" disabled={isSubmitting || !jsonPasteContent} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'جاري الاستيراد...' : 'تأكيد واستيراد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && selectedFileObj && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-lg w-full p-5 md:p-6 space-y-5 animate-in slide-in-from-bottom duration-300 md:animate-in md:fade-in md:zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto md:hidden" />
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>البيانات الوصفية للمستند</span>
                </h3>
                <button onClick={() => setShowMetadataModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleConfirmAndAdd} className="space-y-4 text-xs md:text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-[260px]">{selectedFileObj.name}</span>
                  <span className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-lg font-mono">{formatFileSize(selectedFileObj.size)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-blue-600" /><span>الصف الدراسي *</span></label>
                    <select value={metadata.grade} onChange={(e) => setMetadata({ ...metadata, grade: e.target.value as '9' | '12' })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]">
                      <option value="9">الصف التاسع (9)</option>
                      <option value="12">الصف الثاني عشر (12)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-600" /><span>الفرع / القسم *</span></label>
                    <select value={metadata.section} onChange={(e) => setMetadata({ ...metadata, section: e.target.value as any })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]">
                      <option value="علمي">علمي</option>
                      <option value="أدبي">أدبي</option>
                      <option value="تجاري">تجاري</option>
                      <option value="شرعي">شرعي</option>
                      <option value="أساسي">أساسي</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-600" /><span>المادة الدراسية *</span></label>
                    <input type="text" value={metadata.subject} onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })} placeholder="مثال: الرياضيات" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"/>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-600" /><span>سنة الامتحان *</span></label>
                    <input type="number" value={metadata.examYear} onChange={(e) => setMetadata({ ...metadata, examYear: parseInt(e.target.value, 10) || 2026 })} min="2000" max="2030" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"/>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-600" /><span>المحافظة / الإدارة *</span></label>
                  <input type="text" value={metadata.governorate} onChange={(e) => setMetadata({ ...metadata, governorate: e.target.value })} placeholder="مثال: صنعاء / عدن" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"/>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowMetadataModal(false)} className="px-4 py-2.5 border rounded-xl font-semibold">إلغاء</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>تأكيد وحفظ</span>
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          <span>سجل المستندات ({files.length})</span>
        </h2>
        {files.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border">
            <p className="font-bold text-sm">لا توجد مستندات بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {files.map((file: UploadedFile) => {
              const isFocused = focusFileId === file.id;
              return (
                <div key={file.id} className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 md:p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${isFocused ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base truncate">{file.name}</h4>
                      {/* ... file metadata ... */}
                      <div className="mt-3 space-y-1.5 max-w-xl">
                          <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  {/* ... status icons ... */}
                                  <span>{file.step}</span>
                              </span>
                              <span className="font-mono font-bold text-slate-500">{file.progress}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-300 rounded-full ${file.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${file.progress}%` }} />
                          </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {file.status !== 'completed' && file.status !== 'processing' && file.fileType !== 'json' && (
                      <button onClick={() => handleStartProcessing(file.id)} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
                        <Play className="w-4 h-4" />
                        <span>ابدأ المعالجة</span>
                      </button>
                    )}
                    <button onClick={() => setFocusFileId(isFocused ? null : file.id)} className={`px-3.5 py-2.5 text-xs font-bold rounded-xl border ${isFocused ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Filter className="w-4 h-4" />
                      <span>{isFocused ? 'إلغاء التركيز' : 'تركيز'}</span>
                    </button>
                    <button onClick={() => deleteFileFromStateAndServer(file.id)} className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
