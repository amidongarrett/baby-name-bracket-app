'use client';

export default function BackToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className="text-sm font-medium text-gray-600 transition-colors hover:text-foreground dark:text-gray-400 dark:hover:text-foreground"
    >
      Back to Top ↑
    </button>
  );
}
