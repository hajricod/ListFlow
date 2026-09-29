import React, { useState } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, AlertOctagon, X, ExternalLink } from 'lucide-react';
import { SystemAnnouncement, Language } from '../types';

interface SystemBroadcastBannerProps {
  announcement: SystemAnnouncement | null;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  isAdmin?: boolean;
  language?: Language;
}

export const SystemBroadcastBanner: React.FC<SystemBroadcastBannerProps> = ({
  announcement,
  maintenanceMode = false,
  maintenanceMessage,
  isAdmin = false,
  language = 'en',
}) => {
  const isArabic = language === 'ar';
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // 1. Maintenance mode banner (highest priority)
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="w-full bg-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md relative z-40">
        <div className="flex items-center gap-2.5 max-w-6xl mx-auto">
          <AlertOctagon className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {maintenanceMessage ||
              (isArabic
                ? 'النظام يخضع حالياً لعملية صيانة مجدولة. بعض الميزات قد تكون معطلة مؤقتاً.'
                : 'The platform is currently undergoing scheduled maintenance. Some features may be temporarily offline.')}
          </span>
        </div>
      </div>
    );
  }

  // 2. Broadcast announcement banner
  if (!announcement || !announcement.enabled || isDismissed) {
    return null;
  }

  const { type, title, message, actionLabel, actionUrl, dismissible } = announcement;

  const bgStyles = {
    info: 'bg-blue-600 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    alert: 'bg-rose-600 text-white',
  }[type || 'info'];

  const IconComp = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    alert: AlertOctagon,
  }[type || 'info'];

  return (
    <div
      className={`w-full ${bgStyles} px-4 py-2 text-xs sm:text-sm shadow-xs flex items-center justify-between gap-3 relative z-30 animate-in fade-in slide-in-from-top duration-300`}
    >
      <div className="flex items-center gap-2.5 min-w-0 max-w-6xl mx-auto flex-1">
        <IconComp className="w-4 h-4 shrink-0" />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <strong className="font-bold">{title}:</strong>
          <span className="opacity-95">{message}</span>
        </div>
        {actionLabel && (
          <a
            href={actionUrl || '#'}
            target={actionUrl?.startsWith('http') ? '_blank' : '_self'}
            rel="noreferrer"
            className="ms-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0 shadow-xs inline-flex items-center gap-1"
          >
            <span>{actionLabel}</span>
            {actionUrl?.startsWith('http') && <ExternalLink className="w-2.5 h-2.5" />}
          </a>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md hover:bg-black/15 text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
          title={isArabic ? 'إغلاق الإعلان' : 'Dismiss announcement'}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
