import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Shield,
  ArrowRight,
  ArrowLeft,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { Language, UserSubscription } from '../types';
import { isProUser, cancelSubscription, downgradeToFreeSubscription } from '../utils/subscription';
import { User } from 'firebase/auth';

interface SubscriptionSettingsCardProps {
  language: Language;
  user: User | null;
  subscription: UserSubscription;
  onOpenUpgradeModal: () => void;
  onUpdateSubscription: (sub: UserSubscription) => Promise<void> | void;
  showToast: (message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SubscriptionSettingsCard: React.FC<SubscriptionSettingsCardProps> = ({
  language,
  user,
  subscription,
  onOpenUpgradeModal,
  onUpdateSubscription,
  showToast,
}) => {
  const isPro = isProUser(subscription);
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancelAutoRenew = async () => {
    setIsProcessing(true);
    try {
      const updated = cancelSubscription(subscription);
      if (typeof onUpdateSubscription === 'function') {
        await onUpdateSubscription(updated);
      }
      showToast(
        language === 'ar'
          ? 'تم إيقاف التجديد التلقائي. ستبقى الميزات مفعلة حتى نهاية الفترة الحالية.'
          : 'Auto-renew disabled. Your Pro benefits remain active until the end of the billing period.',
        4000,
        'info'
      );
    } catch {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء تعديل الاشتراك' : 'Failed to update subscription',
        3000,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setIsProcessing(true);
    try {
      const freeSub = downgradeToFreeSubscription();
      if (typeof onUpdateSubscription === 'function') {
        await onUpdateSubscription(freeSub);
      }
      showToast(
        language === 'ar'
          ? 'تم إلغاء الاشتراك والعودة للخطة المجانية المحلية. تم إيقاف المزامنة السحابية.'
          : 'Subscription cancelled. Downgraded to Free Local Plan. Cloud sync paused.',
        4500,
        'info'
      );
    } catch {
      showToast(
        language === 'ar' ? 'حدث خطأ أثناء إلغاء الاشتراك' : 'Failed to downgrade subscription',
        3000,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 overflow-hidden shadow-xs">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isPro
                ? 'bg-linear-to-br from-amber-500 to-emerald-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            {isPro ? <Crown className="w-5 h-5 fill-current" /> : <Shield className="w-5 h-5" />}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                {isPro
                  ? language === 'ar'
                    ? 'اشتراك List Flow برو (نشط)'
                    : 'List Flow Pro (Active)'
                  : language === 'ar'
                  ? 'الخطة المجانية المحلية'
                  : 'Free Local Plan'}
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isPro
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {isPro
                  ? subscription.status === 'trialing'
                    ? language === 'ar'
                      ? 'فترة تجريبية'
                      : 'Free Trial'
                    : language === 'ar'
                    ? 'برو مفعل'
                    : 'Pro Active'
                  : language === 'ar'
                  ? 'محلي مجاني'
                  : 'Free Tier'}
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isPro
                ? language === 'ar'
                  ? `المزامنة الفورية ومشاركة القوائم مفعلة • ${
                      subscription.autoRenew ? 'يتجدد في' : 'ينتهي في'
                    } ${formatDate(subscription.expiresAt)}`
                  : `Realtime sync & live collaboration active • ${
                      subscription.autoRenew ? 'Renews' : 'Expires'
                    } on ${formatDate(subscription.expiresAt)}`
                : language === 'ar'
                ? 'قوائم غير محدودة محلياً ونسخ احتياطي في Google Drive. قم بالترقية للمزامنة والمشاركة الحية.'
                : 'Unlimited local lists & Google Drive backup. Upgrade to collaborate in real-time.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          {isPro ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDowngradeToFree}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {language === 'ar' ? 'إلغاء الاشتراك' : 'Unsubscribe'}
              </button>
              {subscription.autoRenew && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelAutoRenew}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {language === 'ar' ? 'إيقاف التجديد' : 'Stop Auto-Renew'}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تفاصيل الخطة' : 'Plan Details'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ar' ? 'الترقية إلى برو' : 'Upgrade to Pro'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
