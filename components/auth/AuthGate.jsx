'use client';

import { useUser } from '@/contexts/UserContext';
import AuthFlow from './AuthFlow';

/**
 * AuthGate — wraps the app's main content and shows the OTP sign-in flow
 * until the user is authenticated.
 *
 * States:
 *   - Loading (token revalidation in progress) → spinner
 *   - Unauthenticated                          → centered AuthFlow
 *   - Authenticated                            → children rendered as-is
 */
export default function AuthGate({ children }) {
  const { hydrated, authLoading, user, token } = useUser();

  if (!hydrated || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 px-4">
        <AuthFlow onComplete={() => {/* login() in AuthFlow already updates context */}} />
      </div>
    );
  }

  return <>{children}</>;
}
