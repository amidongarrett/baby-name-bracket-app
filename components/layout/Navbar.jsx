'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef  = useRef(null);
  const pathname = usePathname();

  const { userType, setUserType, isOwner, displayEmoji, displayName, userTypes } = useUser();

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

  const adminLinks = [
    { href: '/bracket',     icon: '📝', label: 'Names',                description: 'Add & manage name submissions' },
    { href: '/pick-winner', icon: '🏅', label: 'Pick Winner of Round', description: 'Agree on winners to advance'   },
  ];

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

          {/* Menu button — always visible; shows current user identity */}
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
              <span className="hidden sm:inline text-xs">{displayEmoji} {displayName}</span>
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

                {/* ── User type switcher ────────────────────────────────── */}
                {/* TODO (auth): replace this section with a login/logout UI  */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Viewing As
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {userTypes.map(({ id, emoji, label }) => (
                      <button
                        key={id}
                        onClick={() => setUserType(id)}
                        className={`py-1.5 px-1 text-xs font-semibold rounded-lg transition-colors truncate ${
                          userType === id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Parent controls (owners only) ─────────────────────── */}
                {isOwner ? (
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
                ) : (
                  <div className="px-4 py-3 text-xs text-center text-gray-400 dark:text-gray-500">
                    Switch to Husband or Wife above to access parent controls.
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
