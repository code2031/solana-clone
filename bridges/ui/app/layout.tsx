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
  title: "Prism Bridge",
  description: "Cross-chain bridge for Ethereum, Bitcoin, Solana, and Prism",
};

function ChainIcon({ chain, size = 20 }: { chain: string; size?: number }) {
  const colors: Record<string, string> = {
    ethereum: "#627EEA",
    bitcoin: "#F7931A",
    solana: "#9945FF",
    prism: "#8B5CF6",
  };
  const labels: Record<string, string> = {
    ethereum: "ETH",
    bitcoin: "BTC",
    solana: "SOL",
    prism: "SC",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[chain] || "#666",
        color: "#fff",
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {labels[chain] || "?"}
    </span>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#0F0B2E" }}>
        {/* Header */}
        <header
          style={{
            background: "rgba(26, 21, 69, 0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #2D2670",
          }}
          className="sticky top-0 z-50"
        >
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#fff",
                }}
              >
                SC
              </div>
              <h1 className="text-xl font-bold" style={{ color: "#E2E8F0" }}>
                Prism <span className="gradient-text">Bridge</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ChainIcon chain="ethereum" size={24} />
              <ChainIcon chain="bitcoin" size={24} />
              <ChainIcon chain="solana" size={24} />
              <ChainIcon chain="prism" size={24} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid #2D2670",
            background: "rgba(26, 21, 69, 0.5)",
          }}
          className="py-4"
        >
          <div className="max-w-6xl mx-auto px-4 text-center text-sm" style={{ color: "#64748B" }}>
            Prism Bridge - Cross-chain infrastructure powered by guardian networks
          </div>
        </footer>
      </body>
    </html>
  );
}
