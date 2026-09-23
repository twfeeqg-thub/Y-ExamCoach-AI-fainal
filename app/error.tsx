'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 text-slate-800" dir="rtl">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
        !
      </div>
      <h2 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h2>
      <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
        حدث خطأ أثناء تحميل هذه الصفحة أو تنفيذ المعالجة. يمكنك محاولة إعادة التحميل.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
