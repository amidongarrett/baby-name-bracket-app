'use client';

/**
 * UserContext — single source of user identity for the Baby Name Bracket app.
 *
 * Auth is backed by a JWT stored in localStorage under 'authToken'.
 * On mount, the token is revalidated via GET /api/auth/me. If invalid
 * or absent, the user is treated as unauthenticated and AuthGate shows
 * the OTP sign-in flow.
 *
 * The public shape of useUser() is kept compatible with the previous
 * localStorage-only stub so all consuming components need zero changes.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '@/lib/authApi';

export const USER_TYPES = [
  {
    id:          'guest',
    label:       'Guest',
    emoji:       '👤',
    role:        null,
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
  // OTP-backed auth state
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Owner role switcher (owners only — kept for backwards compatibility)
  const [userType, setUserTypeState] = useState('guest');
  const [hydrated, setHydrated]      = useState(false);

  // On mount: revalidate stored token via /api/auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      setAuthLoading(false);
      setHydrated(true);
      return;
    }

    getMe(storedToken)
      .then(({ user: me }) => {
        setToken(storedToken);
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
      })
      .finally(() => {
        // Also restore the owner role switcher state
        const stored = localStorage.getItem('userType');
        if (stored && USER_TYPES.find(t => t.id === stored)) {
          setUserTypeState(stored);
        }
        setAuthLoading(false);
        setHydrated(true);
      });
  }, []);

  /** Called after a successful OTP verify-code response. */
  function login(newToken, newUser) {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  /** Pushes updated user data into context after a successful profile save. */
  function updateUser(newUser) {
    setUser(newUser);
  }

  /** Clears auth state and returns the user to the sign-in screen. */
  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    setToken(null);
    setUser(null);
    setUserTypeState('guest');
  }

  // Owner role switcher — kept for backwards compatibility with Navbar & admin panels
  const setUserType = (type) => {
    setUserTypeState(type);
    localStorage.setItem('userType', type);
  };

  // Derive userType from auth state: OTP users are guests unless they've
  // manually switched to an owner role via the dev switcher.
  const effectiveUserType = user ? userType : 'guest';
  const current = USER_TYPES.find(t => t.id === effectiveUserType) ?? USER_TYPES[0];

  const value = {
    // OTP auth
    token,
    user,
    login,
    logout,
    updateUser,
    authLoading,

    // Core identity
    userType: effectiveUserType,
    setUserType,
    hydrated,

    // Convenience flags
    isGuest:  effectiveUserType === 'guest',
    isOwner:  effectiveUserType === 'owner1' || effectiveUserType === 'owner2',
    isOwner1: effectiveUserType === 'owner1',
    isOwner2: effectiveUserType === 'owner2',

    // Display helpers — prefer authenticated user's displayName when available
    displayName:  user?.displayName || current.label,
    displayEmoji: current.emoji,

    // API integration
    role: current.role,

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
