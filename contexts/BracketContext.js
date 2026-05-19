'use client';

import { createContext, useContext, useState } from 'react';
import { useUser } from '@/contexts/UserContext';

const BracketContext = createContext(null);

export function BracketProvider({ children }) {
  const { user } = useUser();
  const [currentBracket, setCurrentBracket] = useState(null);

  const isOwnerOfCurrentBracket =
    !!user &&
    !!currentBracket &&
    (user.id === currentBracket.owner1UserId || user.id === currentBracket.owner2UserId);

  const ownerRole = !isOwnerOfCurrentBracket
    ? null
    : user.id === currentBracket.owner1UserId
      ? 'owner1'
      : 'owner2';

  const currentBracketId = currentBracket?._id || currentBracket?.id || null;

  const value = {
    currentBracket,
    setCurrentBracket,
    isOwnerOfCurrentBracket,
    ownerRole,
    currentBracketId,
  };

  return (
    <BracketContext.Provider value={value}>
      {children}
    </BracketContext.Provider>
  );
}

export function useBracket() {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error('useBracket must be used inside <BracketProvider>');
  return ctx;
}
