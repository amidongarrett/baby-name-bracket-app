'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { updateProfile, verifyEmailChange } from '@/lib/authApi';

const ICON_OPTIONS = ['👤','👨','👩','🐼','🦁','🐶','🐨','🦊','🐸','🐯','🦄','🐻','🐮'];

export default function ProfileEditPage() {
  const { user, token, updateUser } = useUser();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [icon, setIcon] = useState('👤');
  const [step, setStep] = useState('form'); // 'form' | 'verify-email'
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from context on mount (and whenever user object changes)
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setIcon(user.icon || '👤');
    }
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Inline validation
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }

    // Nothing changed
    if (displayName.trim() === user?.displayName && email.trim().toLowerCase() === user?.email && icon === (user?.icon || '👤')) {
      setError('No changes detected.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await updateProfile(displayName.trim(), email.trim().toLowerCase(), token, icon);
      if (data.requiresVerification) {
        setPendingEmail(email.trim().toLowerCase());
        setStep('verify-email');
      } else {
        updateUser(data.user);
        setSuccess('Profile updated.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const data = await verifyEmailChange(pendingEmail, code.trim(), token);
      updateUser(data.user);
      setStep('form');
      setEmail(data.user.email);
      setCode('');
      setSuccess('Email updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const buttonClass =
    'w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Update Profile</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Changes to your display name take effect immediately across the app.
      </p>

      <div className="mt-8">
        {step === 'form' && (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="e.g. Grandma Sue"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Choose your icon</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIcon(opt)}
                    className={`text-2xl rounded-lg p-1.5 border-2 transition-colors ${
                      icon === opt
                        ? 'border-indigo-500 bg-indigo-900/40'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-500">
                Changing your email will require a verification code sent to the new address.
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}

        {step === 'verify-email' && (
          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <p className="text-sm text-gray-400">
              We sent a 6-digit verification code to{' '}
              <span className="font-medium text-gray-200">{pendingEmail}</span>.
              Enter it below to confirm your new email address.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Verification code
              </label>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tracking-[0.4em] text-center text-lg`}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Verifying…' : 'Confirm new email'}
            </button>

            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              onClick={() => { setStep('form'); setError(''); setCode(''); }}
            >
              Cancel — keep current email
            </button>
          </form>
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          &larr; Back to Bracket Dashboard
        </Link>
      </div>
    </main>
  );
}
