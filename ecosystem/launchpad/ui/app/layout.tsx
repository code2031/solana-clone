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
  title: "Prism Launchpad",
  description: "Token launch platform for the Prism ecosystem — fixed-price, lottery, and auction launches",
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
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-sm text-white">
                SL
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Prism Launchpad
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#upcoming" className="text-sm text-[#9999bb] hover:text-white transition-colors">Upcoming</a>
              <a href="#active" className="text-sm text-[#9999bb] hover:text-white transition-colors">Active</a>
              <a href="#completed" className="text-sm text-[#9999bb] hover:text-white transition-colors">Completed</a>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Connect Wallet
              </button>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#2a2a4a] py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#666688]">
            Prism Launchpad &mdash; Powering fair token launches on Prism
          </div>
        </footer>
      </body>
    </html>
  );
}
