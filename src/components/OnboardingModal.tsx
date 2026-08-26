import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ListTodo,
  Layers,
  SlidersHorizontal,
  Users,
  Zap,
  Tag,
  DollarSign,
  Cloud,
  WifiOff,
  Keyboard,
  Languages,
  Check,
  Plus,
  Share2,
  FolderPlus,
  ArrowRight,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { getTranslation } from '../locales/translations';
import { sounds } from '../utils/audio';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  theme?: Theme;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [interactiveChecked, setInteractiveChecked] = useState(false);
  const [interactiveSelectedList, setInteractiveSelectedList] = useState(0);
  const totalSteps = 5;
  const t = getTranslation(language);
  const isRTL = language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setInteractiveChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    sounds.playPop();
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      sounds.playComplete();
      onClose();
    }
  };

  const handlePrev = () => {
    sounds.playPop();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    sounds.playPop();
    onClose();
  };

  const handleStepClick = (stepIndex: number) => {
    sounds.playPop();
    setCurrentStep(stepIndex);
  };

  const toggleInteractiveCheck = () => {
    if (!interactiveChecked) {
      sounds.playComplete();
    } else {
      sounds.playPop();
    }
    setInteractiveChecked(!interactiveChecked);
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-900/95 sm:bg-neutral-900/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={handleSkip}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        id="onboarding-full-page-card"
        className="relative w-full min-h-full flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-all max-w-5xl mx-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Decorative Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 shrink-0" />

        {/* Full-page Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base ring-1 ring-emerald-500/20 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {t.onboardingTitle}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                {t.onboardingSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Step Progress Pill */}
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              {t.onboardingStep
                .replace('{current}', String(currentStep + 1))
                .replace('{total}', String(totalSteps))}
            </div>

            {/* Quick Language Toggle */}
            {onLanguageChange && (
              <button
                type="button"
                id="onboarding-lang-toggle"
                onClick={() => {
                  sounds.playPop();
                  onLanguageChange(language === 'en' ? 'ar' : 'en');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700/80 transition-colors cursor-pointer"
                title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>
            )}

            {/* Skip / Close Button */}
            <button
              type="button"
              id="onboarding-skip-btn"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={t.onboardingSkip}
            >
              <span className="hidden sm:inline">{t.onboardingSkip}</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-10 max-w-4xl w-full mx-auto flex flex-col justify-center">
          {/* STEP 1: Multiple Lists & Workspaces */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {t.onboardingStep1Badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {t.onboardingStep1Title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {t.onboardingStep1Desc}
                </p>
              </div>

              {/* Interactive Visual Showcase */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-3 sm:p-4 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2.5">
                <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {language === 'ar' ? 'انقر لتجربة التنقل بين القوائم' : 'Interactive List Preview'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 0,
                      name: language === 'ar' ? 'مقاضي الأسرة' : 'Weekly Groceries',
                      color: 'bg-emerald-500',
                      badge: language === 'ar' ? '12 عنصر' : '12 items',
                      desc: language === 'ar' ? 'خضار، ألبان، ومؤونة' : 'Fresh produce & pantry',
                    },
                    {
                      id: 1,
                      name: language === 'ar' ? 'مهام العمل' : 'Work Sprint',
                      color: 'bg-indigo-500',
                      badge: language === 'ar' ? '5 مهام' : '5 tasks',
                      desc: language === 'ar' ? 'برمجة وتصميم وتقارير' : 'Sprints & deliverables',
                    },
                    {
                      id: 2,
                      name: language === 'ar' ? 'الأهداف الشخصية' : 'Personal Goals',
                      color: 'bg-amber-500',
                      badge: language === 'ar' ? '8 عادات' : '8 habits',
                      desc: language === 'ar' ? 'رياضة، قراءة وصحة' : 'Fitness & wellness',
                    },
                  ].map((list) => {
                    const isSelected = interactiveSelectedList === list.id;
                    return (
                      <div
                        key={list.id}
                        onClick={() => {
                          sounds.playPop();
                          setInteractiveSelectedList(list.id);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-start ${
                          isSelected
                            ? 'bg-white dark:bg-neutral-800 border-emerald-500 dark:border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white/60 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                              {list.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/80 px-1.5 py-0.5 rounded-md">
                            {list.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {list.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Aisles & Group Categories */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  {t.onboardingStep2Badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {t.onboardingStep2Title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {t.onboardingStep2Desc}
                </p>
              </div>

              {/* Interactive Visual Showcase */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {language === 'ar' ? 'ممر الخضار والفواكه الطازجة' : 'Fresh Produce Aisle'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      2 / 3
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {language === 'ar' ? 'سحب للإفلات' : 'Drag to reorder'}
                  </span>
                </div>

                <div className="space-y-1.5 bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700">
                  <div className="flex items-center justify-between p-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-neutral-400 dark:text-neutral-500 line-through">
                        {language === 'ar' ? 'طماطم طازجة (1 كجم)' : 'Fresh Organic Tomatoes (1 kg)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400">$3.50</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded-lg text-xs bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md border-2 border-neutral-300 dark:border-neutral-600" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {language === 'ar' ? 'أفوكادو هاس (4 حبات)' : 'Hass Avocados (4 pcs)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      $5.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Rich Details, Quantities & Pricing */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  {t.onboardingStep3Badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {t.onboardingStep3Title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {t.onboardingStep3Desc}
                </p>
              </div>

              {/* Interactive Visual Showcase */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {language === 'ar' ? 'انقر على المربع لتجربة شطب الصنف' : 'Click the checkbox to try audio check!'}
                </div>

                <div
                  onClick={toggleInteractiveCheck}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    interactiveChecked
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200/90 dark:border-neutral-700 shadow-sm hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                        interactiveChecked
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-neutral-300 dark:border-neutral-600 hover:border-emerald-400'
                      }`}
                    >
                      {interactiveChecked && <Check className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <span
                        className={`text-xs sm:text-sm font-bold block transition-all ${
                          interactiveChecked
                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                            : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {language === 'ar' ? 'حليب عضوي طازج' : 'Fresh Organic Whole Milk'}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold">
                          2 {language === 'ar' ? 'عبوة' : 'bottles'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          $3.20 / {language === 'ar' ? 'عبوة' : 'ea'}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                          {language === 'ar' ? 'المجموع:' : 'Total:'} $6.40
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-xs font-bold px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    {interactiveChecked ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ {language === 'ar' ? 'مكتمل' : 'Done'}</span>
                    ) : (
                      <span>{language === 'ar' ? 'اضغط للشطب' : 'Tap to check'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Real-time Cloud Sync & Shared Lists */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                  {t.onboardingStep4Badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {t.onboardingStep4Title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {t.onboardingStep4Desc}
                </p>
              </div>

              {/* Interactive Visual Showcase */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    <Cloud className="w-4 h-4 text-sky-500" />
                    <span>{language === 'ar' ? 'المزامنة السحابية الفورية' : 'Live Real-Time Sync'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    ● {language === 'ar' ? 'متزامن' : 'Online & Synced'}
                  </span>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
                        A
                      </div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        alex@family.com
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {language === 'ar' ? 'يمكنه التعديل' : 'Can Edit'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                        S
                      </div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        sarah@work.io
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                      {language === 'ar' ? 'للقراءة فقط' : 'View Only'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Offline First, Templates & Shortcuts */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                  {t.onboardingStep5Badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {t.onboardingStep5Title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {t.onboardingStep5Desc}
                </p>
              </div>

              {/* Interactive Visual Showcase */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700">
                    <WifiOff className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                      {language === 'ar' ? 'يعمل بدون إنترنت' : 'Offline Ready'}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {language === 'ar' ? 'حفظ تلقائي محلي' : 'Local browser store'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700">
                    <Zap className="w-4 h-4 text-amber-500 mb-1" />
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                      {language === 'ar' ? 'قوالب جاهزة' : 'Starter Templates'}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {language === 'ar' ? 'شواء، تسوق، مؤونة' : 'Family, BBQ, Weekly'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 col-span-2 sm:col-span-1">
                    <Keyboard className="w-4 h-4 text-indigo-500 mb-1" />
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                      {language === 'ar' ? 'اختصارات سريعة' : 'Keyboard Shortcuts'}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-[9px]">/</span>{' '}
                      <span className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-[9px]">L</span>{' '}
                      <span className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-[9px]">D</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Footer Controls & Step Navigation */}
        <footer className="px-4 sm:px-8 py-4 sm:py-5 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky bottom-0 z-10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                id={`onboarding-step-dot-${idx}`}
                onClick={() => handleStepClick(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-8 sm:w-10 bg-emerald-500 dark:bg-emerald-400'
                    : 'w-2.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                id="onboarding-prev-btn"
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{t.onboardingPrev}</span>
              </button>
            )}

            <button
              type="button"
              id="onboarding-next-btn"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <span>
                {currentStep === totalSteps - 1 ? t.onboardingGetStarted : t.onboardingNext}
              </span>
              {currentStep === totalSteps - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isRTL ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
