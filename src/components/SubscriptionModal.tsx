import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  Users,
  Cloud,
  Smartphone,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { Language, UserSubscription, SubscriptionCycle } from '../types';
import {
  isProUser,
  createProSubscription,
  createTrialSubscription,
  downgradeToFreeSubscription,
  DEFAULT_FREE_SUBSCRIPTION,
  setLocalSubscription,
} from '../utils/subscription';
import { User } from 'firebase/auth';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  user: User | null;
  subscription?: UserSubscription;
  currentSubscription?: UserSubscription;
  onUpdateSubscription?: (newSub: UserSubscription) => Promise<void> | void;
  onSelectPlan?: (newSub: UserSubscription) => Promise<void> | void;
  onOpenAuthModal?: () => void;
  showToast: (message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  subscription,
  currentSubscription,
  onUpdateSubscription,
  onSelectPlan,
  onOpenAuthModal,
  showToast,
}) => {
  const activeSubscription = subscription || currentSubscription || DEFAULT_FREE_SUBSCRIPTION;
  const isPro = isProUser(activeSubscription);
  const [cycle, setCycle] = useState<SubscriptionCycle>('yearly');
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const applySubscriptionChange = async (newSub: UserSubscription) => {
    const handler = onUpdateSubscription || onSelectPlan;
    if (typeof handler === 'function') {
      await handler(newSub);
    } else {
      setLocalSubscription(newSub);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const freeSub = downgradeToFreeSubscription();
      await applySubscriptionChange(freeSub);
      showToast(
        language === 'ar'
          ? 'تم إلغاء الاشتراك. تم إلغاء مشاركة القوائم المشتركة وحفظها محلياً فقط على جهازك.'
          : 'Subscription cancelled. Shared lists were unshared and are now stored locally only.',
        5000,
        'info'
      );
      setShowCancelConfirm(false);
      onClose();
    } catch {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إلغاء الاشتراك' : 'Failed to cancel subscription',
        3000,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const handleSubscribe = async (trial = false) => {
    setIsProcessing(true);
    try {
      const newSub = trial ? createTrialSubscription() : createProSubscription(cycle);
      await applySubscriptionChange(newSub);
      showToast(
        language === 'ar'
          ? trial
            ? 'تم تفعيل الفترة التجريبية المجانية بنجاح!'
            : 'تم الاشتراك في باقة برو بنجاح! تم تفعيل المزامنة والمشاركة.'
          : trial
          ? '7-Day Free Trial activated! Enjoy Pro cloud sync.'
          : 'Subscribed to List Flow Pro! Cloud sync & sharing are unlocked.',
        4000,
        'success'
      );
      onClose();
    } catch (err) {
      console.error('Subscription update failed:', err);
      showToast(
        language === 'ar' ? 'فشل إتمام العملية. يرجى المحاولة ثانية.' : 'Could not activate plan. Please try again.',
        3500,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingPromo(true);
    setTimeout(async () => {
      if (['PROFREE', 'LAUNCH2026', 'LISTPRO', 'VIP', 'TEST'].includes(code)) {
        const newSub = createProSubscription('yearly');
        await applySubscriptionChange(newSub);
        showToast(
          language === 'ar' ? `تم تفعيل كود الخصم "${code}" بنجاح!` : `Promo code "${code}" redeemed! Pro plan unlocked.`,
          4000,
          'success'
        );
        setIsApplyingPromo(false);
        onClose();
      } else {
        setIsApplyingPromo(false);
        showToast(
          language === 'ar' ? 'كود الخصم غير صالح أو منتهي الصلاحية' : 'Invalid or expired promo code',
          3500,
          'error'
        );
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Hero */}
        <div className="relative p-6 sm:p-8 bg-linear-to-br from-emerald-600 via-teal-700 to-sky-700 text-white overflow-hidden">
          {/* Subtle Ambient circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 sm:top-5 end-4 sm:end-5 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ar' ? 'باقة List Flow برو' : 'List Flow Pro'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'ar'
                ? 'مزامنة فورية ومشاركة ذكية مع عائلتك وفريقك'
                : 'Realtime Cloud Sync & Live Family Sharing'}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed max-w-md">
              {language === 'ar'
                ? 'احتفظ ببياناتك المحلية مجاناً، أو قم بالترقية لمزامنة قوائمك مباشرة عبر جميع الهواتف والأجهزة والمشاركة اللحظية.'
                : 'Keep your local data and Google Drive backup 100% free, or upgrade to collaborate live and sync in real time.'}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Billing Cycle Switcher */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
              <button
                type="button"
                onClick={() => setCycle('yearly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  cycle === 'yearly'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <span>{language === 'ar' ? 'سنوي' : 'Yearly'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {language === 'ar' ? 'وفر 30%' : 'Save 30%'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  cycle === 'monthly'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {language === 'ar' ? 'شهري' : 'Monthly'}
              </button>
            </div>
          </div>

          {/* Tier Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan Card */}
            <div className="rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {language === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {language === 'ar' ? 'محلي' : 'Local'}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">$0</span>
                    <span className="text-xs text-neutral-500">/ {language === 'ar' ? 'دائماً مجاناً' : 'forever free'}</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {language === 'ar' ? 'يعمل بدون حساب ومحلياً على جهازك' : 'Works 100% locally on your device'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
                  <div className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'قوائم وعناصر غير محدودة' : 'Unlimited lists & checklist items'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'نسخ احتياطي مجاني في Google Drive' : 'Google Drive cloud backup & restore'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'تصدير واستيراد ملفات JSON' : 'Export & import workspace JSON files'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500 opacity-60">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-through">{language === 'ar' ? 'مزامنة لحظية عبر الأجهزة' : 'Real-time multi-device cloud sync'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500 opacity-60">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-through">{language === 'ar' ? 'مشاركة القوائم مع الآخرين' : 'Share lists with collaborators'}</span>
                  </div>
                </div>
              </div>

              {!isPro && (
                <div className="pt-2">
                  <div className="w-full py-2 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800">
                    {language === 'ar' ? 'خطتك الحالية مفعلة' : 'Your Active Plan'}
                  </div>
                </div>
              )}
            </div>

            {/* Pro Plan Card */}
            <div className="relative rounded-2xl p-5 border-2 border-emerald-500 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4 flex flex-col justify-between shadow-md">
              <div className="absolute -top-3 end-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                {language === 'ar' ? 'الأفضل قيمة' : 'Recommended'}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{language === 'ar' ? 'باقة برو للمزامنة' : 'Pro Cloud Plan'}</span>
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                      {cycle === 'yearly' ? '$24.99' : '$2.99'}
                    </span>
                    <span className="text-xs text-neutral-500">
                      / {cycle === 'yearly' ? (language === 'ar' ? 'سنة ($2.08/شهر)' : 'yr ($2.08/mo)') : (language === 'ar' ? 'شهر' : 'mo')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">
                    {language === 'ar' ? 'يشمل تجربة مجانية لمدة 7 أيام' : 'Includes 7-day free trial'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                  <div className="flex items-start gap-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'مزامنة سحابية فورية عبر جميع أجهزتك' : 'Instant real-time multi-device cloud sync'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'مشاركة القوائم مع العائلة والأصدقاء مباشرة' : 'Share lists with family & team in real time'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'صلاحيات القراءة والتعديل لكل مشارك' : 'Per-collaborator View & Edit permissions'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'تحديثات تلقائية بالدفع عند شطب أي صنف' : 'Instant live sync when items are checked'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{language === 'ar' ? 'جميع ميزات الخطة المجانية ونسخ Google Drive' : 'Includes all Free & Google Drive features'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                {isPro ? (
                  <div className="space-y-2.5">
                    <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-center text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'ar' ? 'أنت مشترك بالفعل في برو' : 'Active Pro Member'}</span>
                    </div>

                    {!showCancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={isProcessing}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition-colors text-center cursor-pointer disabled:opacity-50"
                      >
                        {language === 'ar' ? 'إلغاء الاشتراك (العودة للوضع المحلي)' : 'Cancel Subscription (Switch to Free Local)'}
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2">
                        <p className="text-[11px] text-red-700 dark:text-red-300 leading-snug">
                          {language === 'ar'
                            ? 'سيتم إلغاء مشاركة أي قوائم مشتركة مع الأعضاء الآخرين والاحتفاظ بها محلياً فقط على جهازك بدون مزامنة سحابية.'
                            : 'Shared lists with other members will be unshared and will only be stored locally on your device.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelSubscription}
                            disabled={isProcessing}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                            <span>{language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={isProcessing}
                            className="py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            {language === 'ar' ? 'تراجع' : 'Keep Pro'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubscribe(false)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      )}
                      <span>
                        {language === 'ar'
                          ? cycle === 'yearly'
                            ? 'الترقية الآن ($24.99/سنة)'
                            : 'الترقية الآن ($2.99/شهر)'
                          : cycle === 'yearly'
                          ? 'Upgrade to Pro ($24.99/yr)'
                          : 'Upgrade to Pro ($2.99/mo)'}
                      </span>
                      <ArrowIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(true)}
                      disabled={isProcessing}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 transition-colors text-center cursor-pointer"
                    >
                      {language === 'ar' ? 'أو ابدأ تجربة مجانية لمدة 7 أيام' : 'Or start 7-day free trial'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account notice if not signed in */}
          {!user && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-amber-800 dark:text-amber-300">
                {language === 'ar'
                  ? 'ملاحظة: تتطلب المزامنة والمشاركة تسجيل الدخول بحساب مجاني.'
                  : 'Notice: Pro cloud sync & sharing require signing in with a free account.'}
              </span>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 cursor-pointer"
                >
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              )}
            </div>
          )}

          {/* Promo code accordion */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {!showPromoInput ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="text-xs text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'هل لديك كود خصم أو ترقية؟' : 'Have a promo or activation code?'}</span>
              </button>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل الكود (مثل PROFREE)' : 'Enter code (e.g. PROFREE)'}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoCode.trim()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {isApplyingPromo ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    language === 'ar' ? 'تطبيق' : 'Apply'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-100 dark:border-neutral-800 text-center text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'ar' ? 'إلغاء في أي وقت بدون قيود' : 'Cancel anytime, no strings attached'}</span>
          </span>
          <span>•</span>
          <span>{language === 'ar' ? 'بياناتك المحلية تبقى محفوظة دائماً' : 'Your local data is always kept safe'}</span>
        </div>
      </div>
    </div>
  );
};
