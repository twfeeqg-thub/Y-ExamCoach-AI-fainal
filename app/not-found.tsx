import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 text-slate-800" dir="rtl">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h2 className="text-xl font-bold mb-2">الصفحة غير موجودة</h2>
      <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
        عذراً، لم نتمكن من العثور على الصفحة أو المورد المطلوب في نظام المدرب الذكي.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
      >
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
