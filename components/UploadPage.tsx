'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { FileInput, UploadedFile } from '@/types/index';
import { triggerSupportToast } from '@/components/SupportToast';
import { PSYCHOLOGICAL_MESSAGES, getRandomSupportMessage } from '@/lib/psychologicalSupport';
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
  ChevronUp,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const {
    files,
    syncFileWithServer,
    startProcessingFile,
    deleteFileFromStateAndServer,
    focusFileId,
    setFocusFileId,
  } = useApp();

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Handle Drag Over
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle Drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      prepareFileForMetadata(file);
    }
  };

  // Handle Manual File Selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      prepareFileForMetadata(file);
    }
  };

  // Prepare file and open metadata modal
  const prepareFileForMetadata = (file: File) => {
    setSelectedFileObj(file);
    setMetadata((prev) => ({
      ...prev,
      name: file.name,
      size: file.size,
      fileType: file.name.endsWith('.pdf')
        ? 'pdf'
        : file.name.match(/\.(jpg|jpeg)$/i)
        ? 'jpg'
        : file.name.endsWith('.png')
        ? 'png'
        : 'other',
    }));
    setShowMetadataModal(true);
  };

  // Submit Metadata & Sync
  const handleConfirmAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileObj) return;

    if (!metadata.subject.trim() || !metadata.governorate.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية للمستند');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await syncFileWithServer(selectedFileObj, metadata);
      setShowMetadataModal(false);
      setSelectedFileObj(null);

      // Trigger Psychological Support Alert
      const supportMsg = getRandomSupportMessage('uploadSuccess');
      triggerSupportToast({
        title: 'تم تجهيز المستند بنجاح',
        message: supportMsg,
        type: 'success',
      });
    } catch (err) {
      console.error('Error syncing file:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Processing Handler
  const handleStartProcessing = async (id: string) => {
    const success = await startProcessingFile(id);
    if (success) {
      const procMsg = getRandomSupportMessage('processing');
      triggerSupportToast({
        title: 'بدأت عملية الاستخلاص الذكي',
        message: procMsg,
        type: 'processing',
      });
    }
  };

  // Format File Size
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
            <span>رفع ومعالجة المستندات والامتحانات</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1">
            قم برفع نماذج الامتحانات (PDF / صور) لنقلها مباشرة إلى n8n واستخراج بنك الأسئلة الذكي.
          </p>
        </div>

        {focusFileId && (
          <div className="flex items-center justify-between md:justify-start gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse shrink-0" />
              <span>وضع التركيز مفعل على مستند</span>
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

      {/* Drag & Drop Zone (Mobile First Responsive) */}
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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />

        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner shrink-0">
          <UploadCloud className="w-8 h-8 md:w-10 md:h-10 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base md:text-xl font-bold text-slate-800 dark:text-slate-200">
            اسحب وأسقط ملف الامتحان هنا
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            يدعم ملفات PDF والصور عالية الدقة (PNG, JPG) حتى حجم 50 ميجابايت.
          </p>
        </div>

        <div className="w-full md:w-auto mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>تصفح الملفات من الجهاز</span>
          </button>
        </div>

        {/* Support Micro-copy */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
          <Heart className="w-3 h-3 text-rose-500 inline" />
          <span>حتى لو كنت تبدأ من الصفر، كل ورقة ترفعها تبني مستقبل غدٍ مشرق.</span>
        </p>
      </div>

      {/* Metadata Entry Modal / Mobile Bottom Sheet */}
      {showMetadataModal && selectedFileObj && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-lg w-full p-5 md:p-6 space-y-5 animate-in slide-in-from-bottom duration-300 md:animate-in md:fade-in md:zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Mobile Sheet Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto md:hidden" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <span>البيانات الوصفية والتربوية للمستند</span>
              </h3>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAndAdd} className="space-y-4 text-xs md:text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-[260px]">
                  {selectedFileObj.name}
                </span>
                <span className="text-[11px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-lg font-mono">
                  {formatFileSize(selectedFileObj.size)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Grade */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>الصف الدراسي *</span>
                  </label>
                  <select
                    value={metadata.grade}
                    onChange={(e) => setMetadata({ ...metadata, grade: e.target.value as '9' | '12' })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="9">الصف التاسع (9)</option>
                    <option value="12">الصف الثاني عشر (12)</option>
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>الفرع / القسم *</span>
                  </label>
                  <select
                    value={metadata.section}
                    onChange={(e) => setMetadata({ ...metadata, section: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="علمي">علمي</option>
                    <option value="أدبي">أدبي</option>
                    <option value="تجاري">تجاري</option>
                    <option value="شرعي">شرعي</option>
                    <option value="أساسي">أساسي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Subject */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>المادة الدراسية *</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                    placeholder="مثال: الرياضيات"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                {/* Exam Year */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>سنة الامتحان *</span>
                  </label>
                  <input
                    type="number"
                    value={metadata.examYear}
                    onChange={(e) => setMetadata({ ...metadata, examYear: parseInt(e.target.value, 10) || 2026 })}
                    min="2000"
                    max="2030"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Governorate */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>المحافظة / الإدارة التعليمية *</span>
                </label>
                <input
                  type="text"
                  value={metadata.governorate}
                  onChange={(e) => setMetadata({ ...metadata, governorate: e.target.value })}
                  placeholder="مثال: صنعاء / عدن / المركزية"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMetadataModal(false)}
                  className="w-1/2 md:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold min-h-[44px]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>تأكيد وحفظ الميتاداتا</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Files List & Management */}
      <div className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          <span>سجل المستندات المرفوعة ({files.length})</span>
        </h2>

        {files.length === 0 ? (
          <div className="p-8 md:p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">لا توجد مستندات مرفوعة حتى الآن.</p>
            <p className="text-xs text-slate-400">قم بسحب وإسقاط امتحان أعلى الشاشة للبدء فوراً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {files.map((file: UploadedFile) => {
              const isFocused = focusFileId === file.id;

              return (
                <div
                  key={file.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 md:p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isFocused
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* File Metadata Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base truncate max-w-full">
                          {file.name}
                        </h4>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                          الصف {file.grade} ({file.section})
                        </span>
                        <span>•</span>
                        <span className="font-medium">{file.subject}</span>
                        <span>•</span>
                        <span>سنة {file.examYear}</span>
                        <span>•</span>
                        <span>{file.governorate}</span>
                      </div>

                      {/* Step / Progress Bar & Support Micro-copy */}
                      <div className="mt-3 space-y-1.5 max-w-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {file.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {file.status === 'processing' && (
                              <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                            )}
                            {file.status === 'failed' && (
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            {file.status === 'pending' && (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span>
                              {file.step === 'forwarding_to_n8n' && 'جاري التمرير لـ n8n...'}
                              {file.step === 'waiting_for_extraction' && 'بانتظار استخلاص اللآلئ والأسئلة'}
                              {file.step === 'completed' && 'تم استخلاص الأسئلة المعتمدة بنجاح'}
                              {file.step === 'n8n_forwarding_failed' && 'فشل التمرير لـ n8n'}
                              {file.step === 'ready' && 'جاهز للرفع والمعالجة'}
                            </span>
                          </span>
                          <span className="font-mono font-bold text-slate-500">{file.progress}%</span>
                        </div>

                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              file.status === 'completed'
                                ? 'bg-emerald-500'
                                : file.status === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-blue-600 animate-pulse'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>

                        {/* Processing Encouragement Micro-copy */}
                        {file.status === 'processing' && (
                          <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 pt-1 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>صبر جميل.. نحن نستخرج اللآلئ التعليمية من ملفك الآن! 💎</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Friendly Touch Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 justify-end w-full md:w-auto">
                    {/* Start Processing */}
                    {file.status !== 'completed' && file.status !== 'processing' && (
                      <button
                        onClick={() => handleStartProcessing(file.id)}
                        className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
                      >
                        <Play className="w-4 h-4" />
                        <span>ابدأ الرفع والمعالجة</span>
                      </button>
                    )}

                    {/* Focus Filter Toggle */}
                    <button
                      onClick={() => setFocusFileId(isFocused ? null : file.id)}
                      className={`px-3.5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition border min-h-[44px] ${
                        isFocused
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title="فلترة وتمركُز الأسئلة بهذا الملف فقط"
                    >
                      <Filter className="w-4 h-4" />
                      <span>{isFocused ? 'إلغاء التركيز' : 'تركيز الأسئلة'}</span>
                    </button>

                    {/* Delete File */}
                    <button
                      onClick={() => deleteFileFromStateAndServer(file.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="حذف المستند"
                    >
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
