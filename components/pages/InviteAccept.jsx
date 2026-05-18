'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { acceptOwner2 } from '@/lib/lobbyApi';

export default function InvitePage({ params }) {
  const { inviteCode } = use(params);
  const searchParams = useSearchParams();
  const role = searchParams.get('role'); // 'owner2' for Owner 2 invite links

  const { token, authLoading } = useUser();
  const router = useRouter();

  const [status, setStatus] = useState('idle'); // 'idle' | 'accepting' | 'done' | 'error' | 'claimed'
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Wait for auth to finish loading before attempting to accept
    if (authLoading) return;
    // Not authenticated — AuthGate in layout will handle OTP sign-in
    if (!token) return;
    // Avoid double-firing
    if (status !== 'idle') return;

    setStatus('accepting');
    acceptOwner2(inviteCode, token)
      .then(({ bracket }) => {
        setStatus('done');
        const bracketId = bracket._id || bracket.id;
        router.push(`/bracket/${bracketId}`);
      })
      .catch((err) => {
        if (err.message === 'Owner 2 seat already claimed') {
          setStatus('claimed');
        } else {
          setStatus('error');
          setErrorMessage(err.message);
        }
      });
  }, [token, authLoading, status, inviteCode, router]);

  if (authLoading || status === 'idle' || status === 'accepting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {status === 'accepting' ? 'Accepting your invite…' : 'You have been invited to a Baby Name Bracket. Signing you in…'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Taking you to your bracket…</p>
        </div>
      </div>
    );
  }

  if (status === 'claimed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-sm w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            This Owner 2 seat has already been claimed by someone else.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Go to Lobby
          </Link>
        </div>
      </div>
    );
  }

  // status === 'error'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-sm w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Could not accept invite</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{errorMessage || 'An unexpected error occurred.'}</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          Go to Lobby
        </Link>
      </div>
    </div>
  );
}
