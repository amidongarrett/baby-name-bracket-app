'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminMenuRef = useRef(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
        setIsAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminLinks = [
    {
      href: '/bracket',
      icon: '📝',
      label: 'Names',
      description: 'Add & manage name submissions',
    },
    {
      href: '/pick-winner',
      icon: '🏅',
      label: 'Pick Winner of Round',
      description: 'Agree on winners to advance',
    },
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

          {/* Admin hamburger menu */}
          <div className="relative" ref={adminMenuRef}>
            <button
              onClick={() => setIsAdminOpen(prev => !prev)}
              aria-label="Admin menu"
              aria-expanded={isAdminOpen}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isAdminOpen
                  ? 'bg-gray-100 text-foreground dark:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-foreground dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-foreground'
              }`}
            >
              <span className="hidden sm:inline uppercase tracking-wider text-xs">Admin</span>
              {/* Hamburger / X icon */}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                {isAdminOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>

            {/* Dropdown panel */}
            {isAdminOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Parent Controls
                  </p>
                </div>
                <div className="py-1">
                  {adminLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsAdminOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        pathname === link.href
                          ? 'bg-gray-50 dark:bg-gray-800'
                          : ''
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
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
