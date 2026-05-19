'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@/contexts/UserContext';
import EmailPillInput from './EmailPillInput';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * InviteModal — lets a bracket admin invite people via email or a copyable share link.
 *
 * Props:
 *   bracketId: string      — the bracket's MongoDB _id
 *   onClose:   () => void  — called when the modal should close
 */
export default function InviteModal({ bracketId, onClose }) {
  const { token } = useUser();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [pills, setPills]         = useState([]);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied]       = useState(false);
  const [sending, setSending]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Fetch the share link on mount
  useEffect(() => {
    if (!bracketId) return;
    const authToken = token || localStorage.getItem('authToken');

    fetch(`${BASE_URL}/api/bracket/${bracketId}/invite-link`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load share link (${res.status})`);
        return res.json();
      })
      .then(data => setShareLink(data.shareLink))
      .catch(err => setLoadError(err.message));
  }, [bracketId, token]);

  function handleAdd(email) {
    setPills(prev => [...prev, email]);
  }

  function handleRemove(index) {
    setPills(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (pills.length === 0 || sending) return;
    setSending(true);
    try {
      const authToken = token || localStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/api/bracket/${bracketId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ emails: pills }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setConfirmed(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      // Surface the error without crashing — user can retry
      alert(`Could not send invites: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  async function handleCopy() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in the input
    }
  }

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Invite People
          </h2>
          <button
            onClick={onClose}
            aria-label="Close invite modal"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Email pill input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email addresses
            </label>
            <EmailPillInput
              pills={pills}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Press Space or Enter after each address to add it.
            </p>
          </div>

          {/* Send Invites button / confirmation */}
          {confirmed ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Invites sent! Closing…
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={pills.length === 0 || sending}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending…' : 'Send Invites'}
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Or share a link</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Share link */}
          <div>
            {loadError ? (
              <p className="text-xs text-red-500">{loadError}</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink ?? 'Loading…'}
                  className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  disabled={!shareLink}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
