'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useBracket } from '@/contexts/BracketContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef  = useRef(null);
  const pathname = usePathname();

  const {
    displayName,
    logout,
    user,
  } = useUser();

  const { isOwnerOfCurrentBracket, ownerRole, currentBracketId } = useBracket();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminLinks = currentBracketId ? [
    { href: `/bracket/${currentBracketId}/names`,       icon: '📝', label: 'Names',                description: 'Add & manage name submissions' },
    { href: `/bracket/${currentBracketId}/pick-winner`, icon: '🏅', label: 'Pick Winner of Round', description: 'Agree on winners to advance'   },
  ] : [];

  function handleSignOut() {
    setIsOpen(false);
    logout();
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
              onClick={() => setIsOpen(prev => !prev)}
              aria-label="Menu"
              aria-expanded={isOpen}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isOpen
                  ? 'bg-gray-100 text-foreground dark:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-foreground dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline text-xs">
                {isOwnerOfCurrentBracket ? '👑' : '👤'} {user?.displayName || displayName}
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
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">

                {/* ── All Brackets ──────────────────────────────────────── */}
                <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span>🏠</span>
                    <span>All Brackets</span>
                  </Link>
                </div>

                {/* ── User identity ─────────────────────────────────────── */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-foreground">{user?.displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isOwnerOfCurrentBracket ? (ownerRole === 'owner1' ? '👑 Owner 1' : '👑 Owner 2') : '👤 Guest'}
                  </p>
                </div>

                {/* ── Parent controls (owners only) ─────────────────────── */}
                {isOwnerOfCurrentBracket && (
                  <>
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
                          onClick={() => setIsOpen(false)}
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
                    </div>
                  </>
                )}

                {/* ── Sign out ──────────────────────────────────────────── */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Sign out
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
