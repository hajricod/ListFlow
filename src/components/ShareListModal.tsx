import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Link,
  Copy,
  Check,
  Mail,
  Trash2,
  Shield,
  Eye,
  Edit3,
  Crown,
  Clock,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AppList, Language, ShareRole, ShareMember } from '../types';
import { getTranslation } from '../locales/translations';
import { User } from 'firebase/auth';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: AppList | null;
  currentUser: User | null;
  language: Language;
  onInviteUser: (email: string, role: 'read' | 'edit') => Promise<void>;
  onUpdateRole: (memberKey: string, role: 'read' | 'edit') => Promise<void>;
  onRemoveMember: (memberKey: string, email?: string, uid?: string) => Promise<void>;
  onToggleLinkSharing: (enabled: boolean, role: 'read' | 'edit') => Promise<void>;
  onLeaveList: () => Promise<void>;
  onOpenAuthModal: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  list,
  currentUser,
  language,
  onInviteUser,
  onUpdateRole,
  onRemoveMember,
  onToggleLinkSharing,
  onLeaveList,
  onOpenAuthModal,
}) => {
  const t = getTranslation(language);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'read' | 'edit'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [linkRole, setLinkRole] = useState<'read' | 'edit'>(
    list?.shareLinkRole || 'edit'
  );

  if (!isOpen || !list) return null;

  const isOwner = !list.ownerId || (currentUser && list.ownerId === currentUser.uid);
  const myRole = isOwner ? 'owner' : list.myRole || 'read';

  // Construct invite share link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareToken = list.shareLinkToken || list.id;
  const shareUrl = `${origin}/?joinList=${encodeURIComponent(list.id)}&token=${encodeURIComponent(shareToken)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendEmailInvite = (targetEmail?: string) => {
    const emailTo = targetEmail || emailInput.trim();
    const subject = encodeURIComponent(
      t.shareMessageSubject.replace('{list}', list.title)
    );
    const body = encodeURIComponent(
      t.shareMessageBody
        .replace('{list}', list.title)
        .replace('{link}', shareUrl)
    );
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.shareMessageSubject.replace('{list}', list.title),
          text: t.shareMessageBody
            .replace('{list}', list.title)
            .replace('{link}', shareUrl),
          url: shareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    try {
      await onInviteUser(email, selectedRole);
      setEmailInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract collaborators
  const collaborators = list.collaborators || {};
  const collaboratorsList: (ShareMember & { key: string })[] = Object.keys(collaborators).map((key) => ({
    key,
    ...collaborators[key],
  }));

  const activeMembers = collaboratorsList.filter(
    (m) => m.status === 'active' || m.role === 'owner'
  );
  const pendingMembers = collaboratorsList.filter((m) => m.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="share-list-modal"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-neutral-800 dark:text-neutral-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: list.color || '#10b981' }}
            >
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">
                  {t.shareList}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: list.color || '#10b981' }}
                >
                  {list.title}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {t.shareListSubtitle}
              </p>
            </div>
          </div>

          <button
            id="share-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Guest Mode Warning Banner */}
          {!currentUser && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {language === 'ar' ? 'المزامنة السحابية مطلوبة' : 'Sign in Required to Share'}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300/90 mt-0.5">
                    {t.mustSignInToShare}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="share-modal-signin-btn"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                {t.login} / {t.signup}
              </button>
            </div>
          )}

          {/* Invite New Member by Email (Owner Only) */}
          {isOwner && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.inviteCollaborator}</span>
              </label>

              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    id="invite-email-input"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t.emailAddressPlaceholder}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex gap-2">
                    <select
                      id="invite-role-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'read' | 'edit')}
                      className="px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="edit">{t.roleCanEdit}</option>
                      <option value="read">{t.roleCanView}</option>
                    </select>

                    <button
                      type="submit"
                      id="invite-submit-btn"
                      disabled={!emailInput.trim() || isSubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t.sendInvite}</span>
                    </button>
                  </div>
                </div>

                {/* Email invitation explanation */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
                  <span>
                    {selectedRole === 'edit' ? t.roleCanEditDesc : t.roleCanViewDesc}
                  </span>
                  {emailInput.trim().includes('@') && (
                    <button
                      type="button"
                      onClick={() => handleSendEmailInvite()}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Mail className="w-3 h-3" />
                      <span>{t.sendEmailInvite}</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Share via Link Section */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Link className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {t.linkSharing}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {t.linkSharingDesc}
                  </p>
                </div>
              </div>

              {isOwner && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="link-sharing-toggle"
                    checked={list.shareLinkEnabled ?? false}
                    onChange={(e) =>
                      onToggleLinkSharing(e.target.checked, linkRole)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-emerald-600"></div>
                </label>
              )}
            </div>

            {list.shareLinkEnabled && (
              <div className="space-y-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                {isOwner && (
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                      {t.linkSharingRole}:
                    </span>
                    <select
                      id="link-role-select"
                      value={linkRole}
                      onChange={(e) => {
                        const newR = e.target.value as 'read' | 'edit';
                        setLinkRole(newR);
                        onToggleLinkSharing(true, newR);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="edit">{t.roleCanEdit}</option>
                      <option value="read">{t.roleCanView}</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-2 text-xs bg-transparent text-neutral-800 dark:text-neutral-200 font-mono truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    id="copy-share-link-btn"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تم النسخ' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.copyInviteLink}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="share-external-btn"
                    onClick={handleNativeShare}
                    title={language === 'ar' ? 'مشاركة عبر التطبيقات' : 'Share via apps'}
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.collaborators}</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                {activeMembers.length + pendingMembers.length}{' '}
                {activeMembers.length + pendingMembers.length === 1
                  ? t.membersCount.replace('{n}', '1')
                  : t.membersCountPlural.replace(
                      '{n}',
                      String(activeMembers.length + pendingMembers.length)
                    )}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 overflow-hidden bg-white dark:bg-neutral-800/70 shadow-2xs">
              {/* Owner Row */}
              <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-2.5 sm:gap-3 bg-white dark:bg-neutral-800/90 hover:bg-neutral-50/80 dark:hover:bg-neutral-800 transition-colors">
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-amber-500/30">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 break-words">
                        {list.ownerName || list.ownerEmail?.split('@')[0] || (currentUser?.displayName || 'Owner')}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[10px] font-bold shrink-0">
                        {t.ownerBadge}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium block break-all sm:break-normal sm:truncate mt-0.5">
                      {list.ownerEmail || currentUser?.email || 'list-owner'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-amber-50 dark:bg-amber-950/50 sm:bg-transparent sm:dark:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border border-amber-200/50 dark:border-amber-800/40 sm:border-0">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.roleOwner}</span>
                </div>
              </div>

              {/* Active Collaborators */}
              {activeMembers
                .filter((m) => m.role !== 'owner' && m.uid !== list.ownerId)
                .map((member) => (
                  <div
                    key={member.key}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-2.5 sm:gap-3 bg-white dark:bg-neutral-800/90 hover:bg-neutral-50/80 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName || member.email}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-neutral-200 dark:ring-neutral-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-emerald-500/30">
                          {(member.displayName || member.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 block break-words">
                          {member.displayName || member.email.split('@')[0]}
                        </span>
                        <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium block break-all sm:break-normal sm:truncate mt-0.5">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t border-neutral-100 dark:border-neutral-800 sm:border-0">
                      {isOwner ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              onUpdateRole(
                                member.key,
                                e.target.value as 'read' | 'edit'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-600 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="edit">{t.roleCanEdit}</option>
                            <option value="read">{t.roleCanView}</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveMember(member.key, member.email, member.uid)
                            }
                            title={t.delete}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 flex items-center gap-1 border border-neutral-200/60 dark:border-neutral-600/60">
                          {member.role === 'edit' ? (
                            <>
                              <Edit3 className="w-3 h-3 text-emerald-500" />
                              <span>{t.roleCanEdit}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span>{t.roleCanView}</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {/* Pending Invitations */}
              {pendingMembers.map((member) => (
                <div
                  key={member.key}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-2.5 sm:gap-3 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto flex-1">
                    <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-amber-500/20">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 break-all">
                          {member.email}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[9px] font-bold shrink-0">
                          {t.pendingBadge}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium block mt-0.5">
                        {member.role === 'edit' ? t.roleCanEdit : t.roleCanView}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t border-amber-100 dark:border-amber-900/40 sm:border-0">
                    <button
                      type="button"
                      onClick={() => handleSendEmailInvite(member.email)}
                      title={t.sendEmailInvite}
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() =>
                          onRemoveMember(member.key, member.email, member.uid)
                        }
                        title={t.delete}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborator Action: Leave List */}
          {!isOwner && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {t.leaveList}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {t.leaveListConfirmDesc}
                </p>
              </div>

              <button
                type="button"
                id="leave-shared-list-btn"
                onClick={onLeaveList}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t.leaveList}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <button
            type="button"
            id="share-modal-done-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
