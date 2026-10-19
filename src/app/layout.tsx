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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="flex items-center justify-between border-b border-[var(--stroke)] px-6 py-3">
          <Link href="/" className="text-sm font-medium tracking-wide text-[var(--ink)]">
            CS Escape Lab
          </Link>
          <p className="text-xs text-[var(--muted)]">Investigate · Debug · Escape</p>
        </header>
        {children}
      </body>
    </html>
  );
}
