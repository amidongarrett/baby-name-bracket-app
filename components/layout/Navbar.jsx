'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';
import { updateProfile } from '@/lib/authApi';
import InviteModal from '@/components/bracket/InviteModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LeaderboardModal from '@/components/ui/LeaderboardModal';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PICKER_ICONS = ['👤','👨','👩','🐼','🦁','🐶','🐨','🦊','🐸','🐯','🦄','🐻','🐮'];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('main'); // 'main' | 'settings'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteBracketModal, setShowDeleteBracketModal] = useState(false);
  const [showRemoveOwner2Modal, setShowRemoveOwner2Modal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showUnlockLockinModal, setShowUnlockLockinModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [iconSaving, setIconSaving] = useState(false);
  const menuRef  = useRef(null);
  const buttonRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const {
    displayName,
    logout,
    token,
    user,
    updateUser,
  } = useUser();

  const { isOwnerOfCurrentBracket, currentBracketId, currentBracket, ownerRole } = useBracket();

  function closeMenu() {
    setIsOpen(false);
    setActivePanel('main');
    buttonRef.current?.focus();
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeMenu();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ownerLinks = currentBracketId ? [
    { href: `/bracket/${currentBracketId}/names`,       icon: '📝', label: 'Names',                description: 'Add & manage name submissions' },
    { href: `/bracket/${currentBracketId}/pick-winner`, icon: '🏅', label: 'Pick Winner of Round', description: 'Agree on winners to advance'   },
  ] : [];

  const showViewBracket = !!currentBracketId && pathname !== '/';
  const isBracketViewPage = !!currentBracketId && pathname === `/bracket/${currentBracketId}`;

  function handleSignOut() {
    closeMenu();
    logout();
  }

  function navigate(href) {
    closeMenu();
    router.push(href);
  }

  async function handleDeleteBracket() {
    setDangerLoading(true);
    await fetch(`${BASE_URL}/api/bracket/${currentBracketId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDangerLoading(false);
    window.location.href = '/';
  }

  async function handleRemoveOwner2() {
    setDangerLoading(true);
    await fetch(`${BASE_URL}/api/bracket/${currentBracketId}/owner2`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDangerLoading(false);
    window.location.reload();
  }

  async function handleResetAndRegenerate() {
    setDangerLoading(true);
    await fetch(`${BASE_URL}/api/admin/reset-and-regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bracketId: currentBracketId }),
    });
    setDangerLoading(false);
    window.location.reload();
  }

  async function handleUnlockNames() {
    setDangerLoading(true);
    await fetch(`${BASE_URL}/api/admin/unlock-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bracketId: currentBracketId }),
    });
    setDangerLoading(false);
    window.location.reload();
  }

  async function handleUnlockLockin() {
    setDangerLoading(true);
    await fetch(`${BASE_URL}/api/admin/unlock-lockin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bracketId: currentBracketId }),
    });
    setDangerLoading(false);
    window.location.reload();
  }

  async function handleIconSelect(icon) {
    if (iconSaving || icon === user?.icon) return;
    setIconSaving(true);
    try {
      const data = await updateProfile(undefined, undefined, token, icon);
      if (data?.user) updateUser(data.user);
    } finally {
      setIconSaving(false);
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Brand */}
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-80"
          >
            <span className="text-xl">🏠</span>
          </Link>

          {/* Menu button — shows authenticated user's display name */}
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              onClick={() => setIsOpen(prev => !prev)}
              aria-label="Menu"
              aria-expanded={isOpen}
              aria-controls="nav-dropdown"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isOpen
                  ? 'bg-gray-100 text-foreground dark:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-foreground dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline text-xs">
                {(user?.icon || '😊') + ' '}{user?.displayName || displayName}
              </span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                {isOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
              <div
                id="nav-dropdown"
                className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden"
              >

                {/* ── MAIN PANEL ─────────────────────────────────────────── */}
                {activePanel === 'main' && (
                  <>
                    {/* User identity row — name + settings cog inline */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-base font-bold text-foreground">
                        {(user?.icon || '😊') + ' '}{user?.displayName || displayName || 'Guest'}
                      </p>
                      {isOwnerOfCurrentBracket && (
                        <button
                          onClick={() => setActivePanel('settings')}
                          aria-label="Open settings"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* View Bracket — shown on bracket-scoped pages except the bracket view page itself */}
                    {showViewBracket && !isBracketViewPage && (
                      <div className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                        <Link
                          href={`/bracket/${currentBracketId}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="text-xl leading-none">🏆</span>
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-200">
                              View Bracket
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">See the current bracket view</p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Leaderboard — shown only on the bracket view page */}
                    {isBracketViewPage && (
                      <div className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => { closeMenu(); setShowLeaderboard(true); }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="text-xl leading-none">🏅</span>
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-200">Leaderboard</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">See how everyone is ranked</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Names & Pick Round Winners (owners only) */}
                    {isOwnerOfCurrentBracket && ownerLinks.length > 0 && (
                      <div className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                        {ownerLinks
                          .filter(link => pathname !== link.href)
                          .map(link => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={closeMenu}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <span className="text-xl leading-none">{link.icon}</span>
                              <div>
                                <p className="font-semibold text-gray-700 dark:text-gray-200">
                                  {link.label}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{link.description}</p>
                              </div>
                            </Link>
                          ))}
                      </div>
                    )}

                  </>
                )}

                {/* ── SETTINGS SUB-PANEL ─────────────────────────────────── */}
                {activePanel === 'settings' && (
                  <>
                    {/* Back button */}
                    <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => setActivePanel('main')}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back
                      </button>
                    </div>

                    {/* Profile section — always first */}
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                        Update Information
                      </button>
                    </div>

                    {/* Icon picker */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Choose your icon
                      </p>
                      <div className="grid grid-cols-5 gap-1">
                        {PICKER_ICONS.map((emoji) => {
                          const isSelected = (user?.icon || '👤') === emoji;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleIconSelect(emoji)}
                              disabled={iconSaving}
                              aria-label={`Select icon ${emoji}`}
                              aria-pressed={isSelected}
                              className={`flex items-center justify-center rounded-lg p-2 text-xl transition-colors ${
                                isSelected
                                  ? 'bg-indigo-100 ring-2 ring-indigo-400 dark:bg-indigo-900/40'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              } ${iconSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Settings label */}
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Settings
                      </p>
                    </div>

                    {/* Invite People */}
                    <div className="py-1">
                      {currentBracketId && (
                        <button
                          onClick={() => { closeMenu(); setShowInviteModal(true); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span className="text-xl leading-none">✉️</span>
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-200">Invite People</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Send email invites or share a link</p>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Bracket Health (owner1 only) */}
                    {ownerRole === 'owner1' && currentBracket && (() => {
                      const ROUND_ORDER_NAV = ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship'];
                      const roundsAdvancedCount = ROUND_ORDER_NAV.filter(rk =>
                        (currentBracket.matchups?.[rk] || []).some(m => m.winnerId)
                      ).length;
                      return (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                            Bracket Health
                          </p>
                          <dl className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                              <dt>Status</dt>
                              <dd className="font-semibold capitalize">{currentBracket.status}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Current round</dt>
                              <dd className="font-semibold">{currentBracket.currentRound || 'Round of 32'}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Names filled</dt>
                              <dd className="font-semibold">
                                {(currentBracket.owner1Names?.length || 0) + (currentBracket.owner2Names?.length || 0)} / 32
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Rounds advanced</dt>
                              <dd className="font-semibold">{roundsAdvancedCount}</dd>
                            </div>
                          </dl>
                        </div>
                      );
                    })()}

                    {/* Danger Zone (owner1 only) */}
                    {ownerRole === 'owner1' && (
                      <div className="px-4 py-3 border-t border-red-100 dark:border-red-900/40">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">
                          Danger Zone
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setShowResetModal(true)}
                            className="w-full px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors text-left"
                          >
                            Reset &amp; Regenerate
                          </button>
                          {currentBracket?.status !== 'draft' && (
                            <button
                              onClick={() => setShowUnlockModal(true)}
                              className="w-full px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700 transition-colors text-left"
                            >
                              Unlock Names
                            </button>
                          )}
                          {(currentBracket?.owner1LockedIn || currentBracket?.owner2LockedIn) && (
                            <button
                              onClick={() => setShowUnlockLockinModal(true)}
                              className="w-full px-3 py-2 bg-yellow-600 text-white text-xs font-bold rounded hover:bg-yellow-700 transition-colors text-left"
                            >
                              Unlock Lock-In
                            </button>
                          )}
                          <button
                            onClick={() => setShowRemoveOwner2Modal(true)}
                            className="w-full px-3 py-2 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 transition-colors text-left"
                          >
                            Remove Owner 2
                          </button>
                          <button
                            onClick={() => setShowDeleteBracketModal(true)}
                            className="w-full px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors text-left"
                          >
                            Delete Bracket
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom section — All Brackets + Sign Out */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col gap-1">
                      <button
                        onClick={() => navigate('/')}
                        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <span>🏠</span>
                        All Brackets
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}


              </div>
            )}
          </div>

        </div>
      </div>
      {showLeaderboard && (
        <LeaderboardModal
          bracketId={currentBracketId}
          currentUserId={user?.id}
          onClose={() => setShowLeaderboard(false)}
          bracketMatchups={currentBracket?.matchups || {}}
          nameMap={
            (() => {
              const allNames = [
                ...(currentBracket?.owner1Names || []),
                ...(currentBracket?.owner2Names || []),
                ...(currentBracket?.sharedNames || []),
              ];
              return Object.fromEntries(allNames.map(n => [n.id, n]));
            })()
          }
          voteTallies={null}
          publishedRounds={
            currentBracket?.status === 'completed'
              ? ['roundOf32', 'roundOf16', 'elite8', 'final4', 'championship']
              : (currentBracket?.publishedRounds || [])
          }
          activeRoundKey={
            { 'Round of 32': 'roundOf32', 'Round of 16': 'roundOf16', 'Elite 8': 'elite8', 'Final 4': 'final4', 'Championship': 'championship' }[currentBracket?.currentRound]
            || (currentBracket?.status === 'completed' ? 'championship' : 'roundOf32')
          }
          bracketStatus={currentBracket?.status}
          token={token}
        />
      )}
      {showInviteModal && (
        <InviteModal
          bracketId={currentBracketId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
      {showDeleteBracketModal && (
        <ConfirmModal
          title="Delete Bracket"
          message="This permanently deletes all names, matchups, and votes. This cannot be undone."
          confirmLabel="Yes, Delete"
          onConfirm={async () => { await handleDeleteBracket(); setShowDeleteBracketModal(false); }}
          onCancel={() => setShowDeleteBracketModal(false)}
          loading={dangerLoading}
        />
      )}
      {showRemoveOwner2Modal && (
        <ConfirmModal
          title="Remove Owner 2"
          message="This permanently removes Owner 2, deletes all pick brackets (Owner 1, Owner 2, and all guests), removes all guest participants, and resets the bracket to draft. Only Owner 1's submitted names are kept. This cannot be undone."
          confirmLabel="Yes, Remove"
          onConfirm={async () => { await handleRemoveOwner2(); setShowRemoveOwner2Modal(false); }}
          onCancel={() => setShowRemoveOwner2Modal(false)}
          loading={dangerLoading}
        />
      )}
      {showResetModal && (
        <ConfirmModal
          title="Reset &amp; Regenerate"
          message="This will delete all votes and regenerate the bracket with the current seeding algorithm. This cannot be undone."
          confirmLabel="Yes, Reset"
          onConfirm={async () => { await handleResetAndRegenerate(); setShowResetModal(false); }}
          onCancel={() => setShowResetModal(false)}
          loading={dangerLoading}
        />
      )}
      {showUnlockModal && (
        <ConfirmModal
          title="Unlock Names?"
          message="This will permanently erase all votes and all matchups. The bracket will return to draft mode so names can be edited again. This cannot be undone."
          confirmLabel="Yes, Unlock"
          onConfirm={async () => { await handleUnlockNames(); setShowUnlockModal(false); }}
          onCancel={() => setShowUnlockModal(false)}
          loading={dangerLoading}
        />
      )}
      {showUnlockLockinModal && (
        <ConfirmModal
          title="Unlock Lock-In?"
          message="This resets both owners' lock-in state so names can be edited and re-submitted. Existing matchup stubs are cleared; all names and votes are left untouched. This cannot be undone."
          confirmLabel="Yes, Unlock"
          onConfirm={async () => { await handleUnlockLockin(); setShowUnlockLockinModal(false); }}
          onCancel={() => setShowUnlockLockinModal(false)}
          loading={dangerLoading}
        />
      )}
    </nav>
  );
}
