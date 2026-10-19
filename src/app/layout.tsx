import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS Escape Lab",
  description: "Investigate failing systems. Debug the mission. Escape the lab.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--ink)]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8">
          <header className="flex items-center justify-between border-b border-[var(--stroke)] py-5">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              CS Escape Lab
            </Link>
            <Link
              href="/#missions"
              className="text-sm text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              Missions
            </Link>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
