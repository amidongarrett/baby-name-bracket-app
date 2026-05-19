'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';
import InviteModal from '@/components/bracket/InviteModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('main'); // 'main' | 'settings' | 'profile'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const menuRef  = useRef(null);
  const buttonRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const {
    displayName,
    logout,
    user,
  } = useUser();

  const { isOwnerOfCurrentBracket, currentBracketId } = useBracket();

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

  const adminLinks = currentBracketId ? [
    { href: `/bracket/${currentBracketId}/names`,       icon: '📝', label: 'Names',                description: 'Add & manage name submissions' },
    { href: `/bracket/${currentBracketId}/pick-winner`, icon: '🏅', label: 'Pick Winner of Round', description: 'Agree on winners to advance'   },
  ] : [];

  function handleSignOut() {
    closeMenu();
    logout();
  }

  function navigate(href) {
    closeMenu();
    router.push(href);
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-80"
          >
            <span className="text-xl">🏆</span>
            <span className="text-lg">Baby Name Bracket</span>
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
                {isOwnerOfCurrentBracket ? '👑' : ''} {user?.displayName || displayName}
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
                    {/* User identity */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-foreground">
                        {isOwnerOfCurrentBracket ? '👑 ' : ''}{user?.displayName || displayName}
                      </p>
                    </div>

                    {/* All Brackets */}
                    <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
                      <Link
                        href="/"
                        onClick={closeMenu}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span>🏠</span>
                        <span>All Brackets</span>
                      </Link>
                    </div>

                    {/* Profile (all users) */}
                    <div className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => setActivePanel('profile')}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        <span>Profile</span>
                        <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>

                    {/* Settings (owners only) */}
                    {isOwnerOfCurrentBracket && (
                      <div className="px-2 py-1 border-b border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => setActivePanel('settings')}
                          className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          <span>Settings</span>
                          <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Sign out */}
                    <div className="px-4 py-3">
                      <button
                        onClick={handleSignOut}
                        className="w-full rounded-lg px-3 py-2 text-sm font-medium text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}

                {/* ── SETTINGS SUB-PANEL ─────────────────────────────────── */}
                {activePanel === 'settings' && (
                  <>
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
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Parent Controls
                      </p>
                    </div>
                    <div className="py-1">
                      {adminLinks.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeMenu}
                          className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            pathname === link.href ? 'bg-gray-50 dark:bg-gray-800' : ''
                          }`}
                        >
                          <span className="text-xl leading-none">{link.icon}</span>
                          <div>
                            <p className={`font-semibold ${pathname === link.href ? 'text-foreground' : 'text-gray-700 dark:text-gray-200'}`}>
                              {link.label}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{link.description}</p>
                          </div>
                          {pathname === link.href && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                          )}
                        </Link>
                      ))}
                      {isOwnerOfCurrentBracket && currentBracketId && (
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
                  </>
                )}

                {/* ── PROFILE SUB-PANEL ──────────────────────────────────── */}
                {activePanel === 'profile' && (
                  <>
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
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/')}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span>🏠</span>
                        View Bracket Dashboard
                      </button>
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
                  </>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
      {showInviteModal && (
        <InviteModal
          bracketId={currentBracketId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </nav>
  );
}
