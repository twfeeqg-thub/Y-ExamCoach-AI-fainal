'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  Award,
  Zap,
  Target,
  Heart,
  CheckCircle2,
  X,
} from 'lucide-react';

export type MotivationType = 'correct' | 'streak3' | 'streak5' | 'streak10' | 'lesson' | 'general';

export interface MotivationMessage {
  id: string;
  text: string;
  subtext?: string;
  type: MotivationType;
  iconName: 'target' | 'flame' | 'trophy' | 'sparkles' | 'zap' | 'award';
  colorGradient: string;
  badgeText: string;
}

export const MOTIVATIONAL_PHRASES: Record<MotivationType, MotivationMessage[]> = {
  correct: [
    {
      id: 'c1',
      text: 'بطل! إجابة دقيقة وفي الصميم 🎯',
      subtext: 'فهمك العميق وتأنّيك في القراءة يصنع الفارق!',
      type: 'correct',
      iconName: 'target',
      colorGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      badgeText: 'إجابة نموذجية',
    },
    {
      id: 'c2',
      text: 'رائع جداً! استمر بنفس القوة والعزيمة 🔥',
      subtext: 'كل سؤال صحيح يقربك خطوة إضافية نحو حلمك!',
      type: 'correct',
      iconName: 'flame',
      colorGradient: 'from-amber-500 via-orange-500 to-red-500',
      badgeText: 'طاقة إيجابية',
    },
    {
      id: 'c3',
      text: 'خطوة إضافية نحو التفوق والدرجة الكاملة 🌟',
      subtext: 'ذكاؤك وتحليلك العلمي في أعلى مستوياته اليوم!',
      type: 'correct',
      iconName: 'sparkles',
      colorGradient: 'from-blue-600 via-indigo-600 to-purple-600',
      badgeText: 'مسار المتفوقين',
    },
    {
      id: 'c4',
      text: 'إتقان استثنائي للمفهوم العلمي! 💡',
      subtext: 'تجاوزت المشتتات ببراعة ووصلت للحل الصحيح.',
      type: 'correct',
      iconName: 'zap',
      colorGradient: 'from-indigo-500 via-purple-500 to-pink-500',
      badgeText: 'فهم راسخ',
    },
    {
      id: 'c5',
      text: 'إجابة ذكية تُرفع لها القبعة! 🎩',
      subtext: 'واصل هذا الأداء المتميز حتى نهاية التدريب.',
      type: 'correct',
      iconName: 'award',
      colorGradient: 'from-teal-500 via-emerald-600 to-green-600',
      badgeText: 'علامة كاملة',
    },
  ],

  streak3: [
    {
      id: 's3',
      text: 'ثلاثية نارية متتالية! 3️⃣🔥',
      subtext: 'ثلاث إجابات صحيحة على التوالي.. تركيزك في ذروته!',
      type: 'streak3',
      iconName: 'flame',
      colorGradient: 'from-orange-500 via-amber-500 to-yellow-500',
      badgeText: 'سلسلة 3 إجابات',
    },
  ],

  streak5: [
    {
      id: 's5',
      text: 'خماسية ذهبية لا تُقهر! 5️⃣⚡',
      subtext: 'خمس إجابات متتالية بدقة متناهية.. أنت بطل حقيقي!',
      type: 'streak5',
      iconName: 'trophy',
      colorGradient: 'from-amber-400 via-yellow-500 to-orange-500',
      badgeText: 'سلسلة 5 إجابات',
    },
  ],

  streak10: [
    {
      id: 's10',
      text: 'عشر إجابات متتالية خارقة! 🔟🏆',
      subtext: 'أداء أسطوري وعزيمة لا تلين.. أنت جاهز للامتحان بجدارة!',
      type: 'streak10',
      iconName: 'trophy',
      colorGradient: 'from-yellow-400 via-amber-500 to-rose-500',
      badgeText: 'إنجاز أسطوري',
    },
  ],

  lesson: [
    {
      id: 'l1',
      text: 'مبارك إتمام استيعاب الدرس بنجاح! 🎓',
      subtext: 'إضافة معلومات جديدة إلى رصيدك الدراسي وبناء قاعدة معرفية متينة.',
      type: 'lesson',
      iconName: 'award',
      colorGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      badgeText: 'إتمام الدرس',
    },
    {
      id: 'l2',
      text: 'معلومة راسخة وفهم عميق.. أنت في مسار المتفوقين! 📚✨',
      subtext: 'استمرارية المذاكرة المنظمة هي سر التفوق في الثانوية والتاسع.',
      type: 'lesson',
      iconName: 'sparkles',
      colorGradient: 'from-blue-600 via-indigo-600 to-purple-600',
      badgeText: 'تفوق واجتهاد',
    },
  ],

  general: [
    {
      id: 'g1',
      text: 'حتى لو بدأت من الصفر، كل محاولة تبني نجاحك المستقبلي! 🌱',
      subtext: 'الخطأ هو نقطة الانطلاق نحو الفهم الحقيقي.',
      type: 'general',
      iconName: 'sparkles',
      colorGradient: 'from-slate-700 via-slate-800 to-slate-900',
      badgeText: 'تشجيع مستمر',
    },
  ],
};

/** Get a random motivational phrase */
export function getRandomMotivationalPhrase(
  type: MotivationType = 'correct'
): MotivationMessage {
  const list = MOTIVATIONAL_PHRASES[type] || MOTIVATIONAL_PHRASES.correct;
  return list[Math.floor(Math.random() * list.length)];
}

const MOTIVATION_EVENT = 'aadir:trigger-motivation';

/** Trigger global motivational banner programmatically */
export function triggerMotivationalBanner(
  payload: { type?: MotivationType; customText?: string; customSubtext?: string } = {}
): void {
  if (typeof window === 'undefined') return;

  const msg = getRandomMotivationalPhrase(payload.type || 'correct');
  if (payload.customText) msg.text = payload.customText;
  if (payload.customSubtext) msg.subtext = payload.customSubtext;

  window.dispatchEvent(
    new CustomEvent(MOTIVATION_EVENT, {
      detail: msg,
    })
  );
}

// ---------------------------------------------------------------------------
// Inline Banner Component (Reusable inside Cards)
// ---------------------------------------------------------------------------

interface InlineMotivationBadgeProps {
  message?: MotivationMessage | null;
  onDismiss?: () => void;
  className?: string;
}

export const InlineMotivationBadge: React.FC<InlineMotivationBadgeProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 md:p-4 text-white shadow-lg bg-gradient-to-r ${message.colorGradient} animate-in fade-in zoom-in-95 duration-200 ${className}`}
    >
      {/* Decorative ambient flare */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
            {message.iconName === 'flame' && <Flame className="w-5 h-5 text-amber-200 animate-pulse" />}
            {message.iconName === 'trophy' && <Trophy className="w-5 h-5 text-yellow-200 animate-bounce" />}
            {message.iconName === 'sparkles' && <Sparkles className="w-5 h-5 text-white animate-spin" />}
            {message.iconName === 'zap' && <Zap className="w-5 h-5 text-yellow-300" />}
            {message.iconName === 'target' && <Target className="w-5 h-5 text-emerald-200" />}
            {message.iconName === 'award' && <Award className="w-5 h-5 text-amber-200" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                {message.badgeText}
              </span>
            </div>
            <p className="text-sm md:text-base font-black leading-snug">
              {message.text}
            </p>
            {message.subtext && (
              <p className="text-xs text-white/90 font-medium">
                {message.subtext}
              </p>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Global Floating Motivation Banner (Top of Screen)
// ---------------------------------------------------------------------------

export const MotivationBanner: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState<MotivationMessage | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleEvent = (e: Event) => {
      const custom = e as CustomEvent<MotivationMessage>;
      if (custom.detail) {
        setActiveMessage(custom.detail);
        clearTimeout(timer);
        timer = setTimeout(() => {
          setActiveMessage(null);
        }, 5500);
      }
    };

    window.addEventListener(MOTIVATION_EVENT, handleEvent);
    return () => {
      window.removeEventListener(MOTIVATION_EVENT, handleEvent);
      clearTimeout(timer);
    };
  }, []);

  if (!activeMessage) return null;

  return (
    <aside
      aria-label="تنبيه تحفيزي"
      className="fixed top-18 right-4 left-4 md:right-auto md:left-6 md:max-w-md z-50 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <InlineMotivationBadge
        message={activeMessage}
        onDismiss={() => setActiveMessage(null)}
      />
    </aside>
  );
};
