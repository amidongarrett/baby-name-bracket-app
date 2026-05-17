'use client';

/**
 * UserContext — single source of user identity for the Baby Name Bracket app.
 *
 * ─── AUTH MIGRATION GUIDE ──────────────────────────────────────────────────
 * Currently backed by localStorage for dev / testing. When real authentication
 * is implemented:
 *
 *   1. Replace the localStorage `useEffect` block in UserProvider with your
 *      auth provider initialisation (e.g. NextAuth useSession, a /api/auth/me
 *      fetch, Clerk useUser, etc.).
 *
 *   2. Replace `setUserType` with your login / logout actions. The `userType`
 *      value ('guest' | 'owner1' | 'owner2') should be stored on the user
 *      account at registration time and returned with the session.
 *
 *   3. The public shape of `useUser()` must stay compatible — consuming
 *      components use fields like `isOwner`, `role`, `displayName`, etc. and
 *      should need zero changes when the backing store swaps.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect } from 'react';

export const USER_TYPES = [
  {
    id:          'guest',
    label:       'Guest',
    emoji:       '👤',
    role:        null,        // API owner field value; null = not an owner
    description: 'View & vote on matchups',
  },
  {
    id:          'owner1',
    label:       'Husband',
    emoji:       '👨',
    role:        'Owner 1',
    description: 'Owner 1 — admin access',
  },
  {
    id:          'owner2',
    label:       'Wife',
    emoji:       '👩',
    role:        'Owner 2',
    description: 'Owner 2 — admin access',
  },
];

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userType, setUserTypeState] = useState('guest');
  const [hydrated, setHydrated]      = useState(false);

  // ── TODO (auth): replace this block with your session initialisation ──
  useEffect(() => {
    const stored = localStorage.getItem('userType');
    if (stored && USER_TYPES.find(t => t.id === stored)) {
      setUserTypeState(stored);
    }
    setHydrated(true);
  }, []);

  // ── TODO (auth): replace with login / logout actions ──────────────────
  const setUserType = (type) => {
    setUserTypeState(type);
    localStorage.setItem('userType', type);
  };

  const current = USER_TYPES.find(t => t.id === userType) ?? USER_TYPES[0];

  const value = {
    // Core identity — the only fields auth needs to provide
    userType,       // 'guest' | 'owner1' | 'owner2'
    setUserType,    // dev/test: swapped for real auth actions in production
    hydrated,       // false until the identity source has been read (prevents flash)

    // Convenience flags
    isGuest:  userType === 'guest',
    isOwner:  userType === 'owner1' || userType === 'owner2',
    isOwner1: userType === 'owner1',
    isOwner2: userType === 'owner2',

    // Display helpers
    displayName:  current.label,        // 'Guest' | 'Husband' | 'Wife'
    displayEmoji: current.emoji,        // '👤' | '👨' | '👩'

    // API integration — matches the `owner` field the backend expects
    role: current.role,                 // null | 'Owner 1' | 'Owner 2'

    // Full list — used by the Navbar switcher
    userTypes: USER_TYPES,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/** Access user identity from any client component inside <UserProvider>. */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
