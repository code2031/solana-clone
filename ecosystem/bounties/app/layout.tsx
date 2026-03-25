import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Prism Bounties",
  description: "Earn PRISM by completing development bounties for the Prism ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-[#2a2a4a] bg-[#12121a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center font-bold text-sm text-white">
                SB
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                Prism Bounties
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#open" className="text-sm text-[#9999bb] hover:text-white transition-colors">Open</a>
              <a href="#in-progress" className="text-sm text-[#9999bb] hover:text-white transition-colors">In Progress</a>
              <a href="#completed" className="text-sm text-[#9999bb] hover:text-white transition-colors">Completed</a>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Connect Wallet
              </button>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#2a2a4a] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#666688]">
            Prism Bounties &mdash; Build, earn, and grow the ecosystem
          </div>
        </footer>
      </body>
    </html>
  );
}
