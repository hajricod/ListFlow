import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  X,
  Shield,
  Edit3,
  Eye,
  Crown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppList, Language, ShareRole } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';

interface JoinListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: Partial<AppList> | null;
  currentUser: User | null;
  language: Language;
  onJoin: () => Promise<void>;
  onOpenAuthModal: () => void;
}

export const JoinListModal: React.FC<JoinListModalProps> = ({
  isOpen,
  onClose,
  list,
  currentUser,
  language,
  onJoin,
  onOpenAuthModal,
}) => {
  const t = getTranslation(language);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen || !list) return null;

  const role: ShareRole = (list.shareLinkRole || list.myRole || 'edit') as ShareRole;
  const ownerDisplay = list.ownerName || list.ownerEmail || 'A ListFlow User';

  const handleJoinClick = async () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setIsJoining(true);
    try {
      await onJoin();
      onClose();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="join-list-modal"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-neutral-800 dark:text-neutral-200"
      >
        {/* Header Visual */}
        <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 border-b border-neutral-100 dark:border-neutral-800 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 end-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-white dark:ring-neutral-900"
            style={{ backgroundColor: list.color || '#10b981' }}
          >
            <Users className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50 mb-1">
            {t.joinListTitle}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
            {t.joinListDesc
              .replace('{owner}', ownerDisplay)
              .replace('{list}', list.title || 'List')
              .replace('{role}', role === 'edit' ? t.roleCanEdit : t.roleCanView)}
          </p>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {language === 'ar' ? 'القائمة' : 'List Name'}
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {list.title}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {t.roleOwner}
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>{ownerDisplay}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {t.permissionRole}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                {role === 'edit' ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.roleCanEdit}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.roleCanView}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {!currentUser && (
            <p className="text-xs text-center text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60">
              {t.mustSignInToShare}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {currentUser ? (
              <button
                type="button"
                id="join-confirm-btn"
                onClick={handleJoinClick}
                disabled={isJoining}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isJoining ? t.signingIn : t.acceptInvite}</span>
              </button>
            ) : (
              <button
                type="button"
                id="join-signin-btn"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.signInToJoin}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}

            <button
              type="button"
              id="join-cancel-btn"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
