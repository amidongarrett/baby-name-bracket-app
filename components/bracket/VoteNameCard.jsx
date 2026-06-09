'use client';

/**
 * VoteNameCard
 * Fully-controlled presentational component for the pre-tournament voting screen.
 *
 * Props:
 *   name        {string}             - The name value to display
 *   reaction    {'love'|'like'|'hate'|null} - Current reaction (controlled)
 *   suggestion  {string}             - Current suggestion text (controlled, only used when reaction === 'like')
 *   onReact     {(reaction) => void} - Called when a reaction button is clicked
 *   onSuggest   {(text) => void}     - Called when suggestion text changes
 */
export default function VoteNameCard({ name, reaction, suggestion, onReact, onSuggest }) {
  const borderClass =
    reaction === 'love' ? 'border-green-500 dark:border-green-400' :
    reaction === 'hate' ? 'border-red-500 dark:border-red-400' :
    reaction === 'like' ? 'border-yellow-500 dark:border-yellow-400' :
    'border-gray-200 dark:border-gray-700';

  const bgClass =
    reaction === 'love' ? 'bg-green-50 dark:bg-green-900/20' :
    reaction === 'hate' ? 'bg-red-50 dark:bg-red-900/20' :
    reaction === 'like' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
    'bg-white dark:bg-gray-900';

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${borderClass} ${bgClass}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {reaction === 'love' && <span className="text-green-500 text-lg flex-shrink-0">♥</span>}
          <span className="text-foreground font-medium truncate">{name}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Love button */}
          <button
            type="button"
            onClick={() => onReact(reaction === 'love' ? null : 'love')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
              reaction === 'love'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-400'
            }`}
          >
            Love
          </button>

          {/* Like button */}
          <button
            type="button"
            onClick={() => onReact(reaction === 'like' ? null : 'like')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
              reaction === 'like'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:text-yellow-700 dark:hover:text-yellow-400'
            }`}
          >
            Like
          </button>

          {/* Hate button */}
          <button
            type="button"
            onClick={() => onReact(reaction === 'hate' ? null : 'hate')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
              reaction === 'hate'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400'
            }`}
          >
            Hate
          </button>
        </div>
      </div>

      {/* Suggestion input — only shown when reaction is 'like' */}
      {reaction === 'like' && (
        <div className="mt-3">
          <input
            type="text"
            value={suggestion || ''}
            onChange={(e) => onSuggest(e.target.value)}
            placeholder="Suggest an alternative name (optional)"
            className="w-full px-3 py-1.5 text-sm border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      )}
    </div>
  );
}
