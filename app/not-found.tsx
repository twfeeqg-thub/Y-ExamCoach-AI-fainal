import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-md space-y-4">
        <span className="text-5xl font-black text-amber-500 font-mono">404</span>
        <h2 className="text-xl font-black">الصفحة غير موجودة</h2>
        <p className="text-xs text-slate-500">
          لم نتمكن من العثور على الصفحة المطلوبة. يمكنك العودة إلى الصفحة الرئيسية للمدرب الذكي.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
