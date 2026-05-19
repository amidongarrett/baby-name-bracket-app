'use client';

import { useState } from 'react';

/**
 * EmailPillInput — controlled pill-based email input.
 *
 * Props:
 *   pills:    string[]          — list of locked email addresses
 *   onAdd:    (email: string)   — called when Space or Enter is pressed with a non-empty value
 *   onRemove: (index: number)   — called when the × on a pill is clicked
 */
export default function EmailPillInput({ pills, onAdd, onRemove }) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onAdd(trimmed);
        setInputValue('');
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[42px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      {pills.map((email, index) => (
        <span
          key={index}
          className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full px-3 py-0.5 text-sm font-medium flex items-center gap-1"
        >
          {email}
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${email}`}
            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-100 leading-none focus:outline-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="email"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={pills.length === 0 ? 'Type an email and press Space' : ''}
        className="flex-1 min-w-[180px] bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
      />
    </div>
  );
}
