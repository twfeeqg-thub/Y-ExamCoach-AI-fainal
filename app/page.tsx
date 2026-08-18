'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { UploadPage } from '@/components/UploadPage';
import { QuestionsPage } from '@/components/QuestionsPage';
import { SettingsPage } from '@/components/SettingsPage';
import { SupportToast, triggerSupportToast } from '@/components/SupportToast';
import {
  PSYCHOLOGICAL_MESSAGES,
  getRandomSupportMessage,
} from '@/lib/psychologicalSupport';
import {
  FileUp,
  HelpCircle,
  Settings,
  Brain,
  Moon,
  Sun,
  Database,
  WifiOff,
  Sparkles,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'questions' | 'settings'>('upload');
  const { stats, settings, updateUserSettings, databaseStatus } = useApp();
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    // Pick an encouraging pedagogical quote on load
    const randomQuote =
      PSYCHOLOGICAL_MESSAGES.pedagogicalQuotes[
        Math.floor(Math.random() * PSYCHOLOGICAL_MESSAGES.pedagogicalQuotes.length)
      ];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    // Alert user if offline or fallback mode is active
    if (databaseStatus === 'offline') {
      const msg = PSYCHOLOGICAL_MESSAGES.offlineMode[0];
      triggerSupportToast({
        title: 'وضع المحرك المحلي المستقل',
        message: msg,
        type: 'offline',
        duration: 7000,
      });
    }
  }, [databaseStatus]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 relative pb-24 md:pb-12">
      {/* Toast Notification Container */}
      <SupportToast />

      {/* Top Header Navigation Bar (Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base md:text-xl tracking-tight text-slate-900 dark:text-slate-100">
                  المدرب الذكي
                </h1>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                  PRO v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block">
                محرك معالجة الامتحانات وتوليد الأسئلة وحوكمة التكرار بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>رفع المستندات</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 font-mono">
                {stats.totalFiles}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>بنك الأسئلة</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 font-mono">
                {stats.totalQuestions}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateUserSettings({ isDarkMode: !settings.isDarkMode })}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="تبديل الوضع الليلي"
            >
              {settings.isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Psychological Support Banner Header (Pedagogical Quote) */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs md:text-sm py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium overflow-hidden">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300 animate-spin" />
            <span className="truncate">{quote || "«حتى لو كنت تبدأ من الصفر، شغفك بالتعليم هو الجسر لنقل أجيالنا نحو المستقبل.»"}</span>
          </div>
          <span className="shrink-0 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
            حتى لو كنت تبدأ من الصفر 🌱
          </span>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 py-4 md:py-6">
        {activeTab === 'upload' && <UploadPage />}
        {activeTab === 'questions' && <QuestionsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Mobile Bottom Navigation Bar (Mobile-First Thumb Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl px-2 py-1.5 flex justify-around items-center">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 min-h-[48px] active:scale-95 transition ${
            activeTab === 'upload'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <FileUp className="w-5 h-5" />
            {stats.totalFiles > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                {stats.totalFiles}
              </span>
            )}
          </div>
          <span className="text-[11px]">الرفع والملفات</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 min-h-[48px] active:scale-95 transition ${
            activeTab === 'questions'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <HelpCircle className="w-5 h-5" />
            {stats.totalQuestions > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                {stats.totalQuestions}
              </span>
            )}
          </div>
          <span className="text-[11px]">بنك الأسئلة</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 min-h-[48px] active:scale-95 transition ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px]">الإعدادات</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>المدرب الذكي © 2026 - نظام توليد ونقد بنك الأسئلة بالذكاء الاصطناعي</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>قاعدة البيانات: {databaseStatus}</span>
            </span>
            {databaseStatus === 'offline' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>(وضع العمل المحلي)</span>
              </span>
            )}
            <span>•</span>
            <span>n8n Stream Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
