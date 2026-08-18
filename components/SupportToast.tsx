'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, CheckCircle2, ShieldAlert, Heart, RefreshCw } from 'lucide-react';
import { SupportMessage } from '@/lib/psychologicalSupport';

export interface ToastEventDetail {
  title?: string;
  message: SupportMessage;
  type?: 'success' | 'processing' | 'info' | 'warning' | 'offline';
  duration?: number;
}

export const SupportToast: React.FC = () => {
  const [toast, setToast] = useState<ToastEventDetail | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleToastEvent = (e: CustomEvent<ToastEventDetail>) => {
      setToast(e.detail);
      setVisible(true);

      const duration = e.detail.duration || 5000;
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    };

    window.addEventListener('show-support-toast' as any, handleToastEvent as any);
    return () => {
      window.removeEventListener('show-support-toast' as any, handleToastEvent as any);
    };
  }, []);

  if (!toast || !visible) return null;

  const getBorderAndBg = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10';
      case 'processing':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/90 text-blue-950 dark:text-blue-100 shadow-blue-500/10';
      case 'offline':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100 shadow-amber-500/10';
      default:
        return 'border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl';
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 pointer-events-auto transition-all duration-300 ease-out animate-in slide-in-from-top-4 fade-in">
      <div
        className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex items-start gap-3 relative ${getBorderAndBg()}`}
      >
        {/* Icon */}
        <div className="text-2xl shrink-0 mt-0.5">
          {toast.message.icon || '✨'}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1 text-right">
          {toast.title && (
            <h4 className="font-bold text-sm md:text-base flex items-center gap-1.5">
              <span>{toast.title}</span>
            </h4>
          )}
          <p className="font-bold text-xs md:text-sm leading-relaxed">
            {toast.message.text}
          </p>
          {toast.message.subtext && (
            <p className="text-[11px] md:text-xs opacity-85 leading-normal font-medium pt-0.5">
              {toast.message.subtext}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setVisible(false)}
          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Helper trigger function to dispatch toast anywhere from UI
export function triggerSupportToast(detail: ToastEventDetail) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-support-toast', { detail });
    window.dispatchEvent(event);
  }
}
