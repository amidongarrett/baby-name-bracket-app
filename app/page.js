import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
          Baby Name Bracket Championship
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Find the perfect name for your baby through an exciting tournament-style bracket.
          Compare your favorite names head-to-head until you discover the winner!
        </p>

        {/* CTA Button */}
        <Link
          href="/bracket"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-background bg-foreground rounded-lg transition-all hover:opacity-90 hover:scale-105 active:scale-95"
        >
          Start Your Bracket
        </Link>
      </div>
    </div>
  );
}
