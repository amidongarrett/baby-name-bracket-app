import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { UserProvider } from "@/contexts/UserContext";
import { BracketProvider } from "@/contexts/BracketContext";
import AuthGate from "@/components/auth/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Baby Name Bracket Championship",
  description: "A 32-name tournament bracket to find the perfect baby name — vote, pick winners, and crown a champion.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <UserProvider>
          <BracketProvider>
            <Navbar />
            <main className="flex-1"><AuthGate>{children}</AuthGate></main>
            <Footer />
          </BracketProvider>
        </UserProvider>
      </body>
    </html>
  );
}
