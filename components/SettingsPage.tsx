'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Settings,
  Palette,
  Type,
  Moon,
  Sun,
  Database,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateUserSettings, databaseStatus, systemLogs, refreshData } = useApp();

  const themes = [
    { id: 'blue', name: 'الأزرق المعياري', class: 'bg-blue-600', ring: 'ring-blue-500' },
    { id: 'emerald', name: 'الزمردي التربوي', class: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'violet', name: 'البنفسجي الحديث', class: 'bg-violet-600', ring: 'ring-violet-500' },
    { id: 'amber', name: 'الكهرماني التنبيهي', class: 'bg-amber-600', ring: 'ring-amber-500' },
  ];

  const fontSizes = [
    { id: 'sm', label: 'صغير (14px)' },
    { id: 'md', label: 'متوسط قياسي (16px)' },
    { id: 'lg', label: 'كبير ومريح (18px)' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span>تخصيص المظهر وإعدادات النظام</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            التحكم الديناميكي بالثيمات، أحجام الخطوط، وضع الرؤية الليلية، والاطلاع على سجل الأحداث.
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs md:text-sm rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة جلب المزامنة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              <span>السمة اللونية العامة (Color Theme)</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themes.map((t) => {
                const isSelected = settings.themeColor === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateUserSettings({ themeColor: t.id as any })}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${t.class} flex items-center justify-center text-white shadow-sm`}>
                      {isSelected && <Check className="w-5 h-5" />}
                    </div>
                    <span className="text-xs text-slate-800 dark:text-slate-200">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size & Dark Mode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            {/* Font Size */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Type className="w-5 h-5 text-blue-600" />
                <span>حجم خط واجهة القراءة (Font Size)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {fontSizes.map((f) => {
                  const isSelected = settings.fontSize === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateUserSettings({ fontSize: f.id as any })}
                      className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  {settings.isDarkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>الوضع الليلي (Dark Mode)</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  تبديل مظهر الخلفية إلى الألوان الداكنة لراحة العين
                </span>
              </div>

              <button
                onClick={() => updateUserSettings({ isDarkMode: !settings.isDarkMode })}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  settings.isDarkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    settings.isDarkMode ? '-translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Database & Logs Panel */}
        <div className="space-y-6">
          {/* Database Health Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>حالة قاعدة البيانات والسيرفر</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">حالة الاتصال:</span>
                <span className={`font-bold flex items-center gap-1.5 ${
                  databaseStatus === 'online' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {databaseStatus === 'online' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>متصل أونلاين (PostgreSQL)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>تراجع محلي (Offline Fallback)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">نظام المزامنة:</span>
                <span className="font-mono font-semibold">تلقائي فوري (Realtime)</span>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-600" />
              <span>سجلات النظام والأحداث ({systemLogs.length})</span>
            </h3>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-2 border border-slate-800">
              {systemLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-8">لا توجد سجلات مسجلة حتى الآن</div>
              ) : (
                systemLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900 pb-1.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-blue-400 font-bold">[{log.source}]</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className={`leading-relaxed ${
                      log.level === 'error'
                        ? 'text-rose-400'
                        : log.level === 'warn'
                        ? 'text-amber-300'
                        : log.level === 'success'
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
