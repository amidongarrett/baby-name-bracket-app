'use client';

export default function AiNameBank({ suggestions, onAdd, onDismiss }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mb-4 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
      <div className="px-4 py-2 border-b border-amber-200 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/40">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          AI Suggestions ({suggestions.length} remaining)
        </h3>
      </div>
      <ul className="divide-y divide-amber-100 dark:divide-amber-800/50">
        {suggestions.map(({ name, note }) => (
          <li key={name} className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{note}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onAdd(name)}
                className="px-2 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => onDismiss(name)}
                className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label={`Dismiss ${name}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
