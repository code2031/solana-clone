"use client";

import { useState } from "react";
import { LaunchCard } from "@/components/launch-card";
import { LaunchDetail } from "@/components/launch-detail";
import { CreateLaunchForm } from "@/components/create-launch-form";

export interface Launch {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMint: string;
  description: string;
  price: number;
  targetRaise: number;
  totalRaised: number;
  totalAllocation: number;
  totalSold: number;
  participants: number;
  startTime: number;
  endTime: number;
  minPurchase: number;
  maxPurchase: number;
  launchType: "FixedPrice" | "Lottery" | "Auction";
  isActive: boolean;
  isFinalized: boolean;
  creator: string;
}

const MOCK_LAUNCHES: Launch[] = [
  {
    id: "1",
    tokenName: "SolClone AI",
    tokenSymbol: "SCAI",
    tokenMint: "ScAi1111111111111111111111111111111111111111",
    description: "AI-powered trading assistant and analytics for the SolClone ecosystem. Providing machine learning based insights for DeFi participants.",
    price: 0.005,
    targetRaise: 500,
    totalRaised: 320,
    totalAllocation: 100000,
    totalSold: 64000,
    participants: 245,
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 86400000 * 4,
    minPurchase: 0.1,
    maxPurchase: 10,
    launchType: "FixedPrice",
    isActive: true,
    isFinalized: false,
    creator: "CrEa1111111111111111111111111111111111111111",
  },
  {
    id: "2",
    tokenName: "DeFi Shield",
    tokenSymbol: "DSHLD",
    tokenMint: "DShd1111111111111111111111111111111111111111",
    description: "Insurance protocol protecting SolClone DeFi users from smart contract exploits, oracle failures, and liquidity crises.",
    price: 0.002,
    targetRaise: 300,
    totalRaised: 300,
    totalAllocation: 150000,
    totalSold: 150000,
    participants: 512,
    startTime: Date.now() - 86400000 * 2,
    endTime: Date.now() + 86400000,
    minPurchase: 0.05,
    maxPurchase: 5,
    launchType: "Lottery",
    isActive: true,
    isFinalized: false,
    creator: "CrEb1111111111111111111111111111111111111111",
  },
  {
    id: "3",
    tokenName: "MetaVerse Land",
    tokenSymbol: "MVLD",
    tokenMint: "MvLd1111111111111111111111111111111111111111",
    description: "Virtual land tokens for the SolClone metaverse. Own, build, and trade virtual real estate in a decentralized world.",
    price: 0.01,
    targetRaise: 1000,
    totalRaised: 780,
    totalAllocation: 78000,
    totalSold: 78000,
    participants: 890,
    startTime: Date.now() - 86400000 * 3,
    endTime: Date.now() + 86400000 * 2,
    minPurchase: 0.1,
    maxPurchase: 20,
    launchType: "Auction",
    isActive: true,
    isFinalized: false,
    creator: "CrEc1111111111111111111111111111111111111111",
  },
  {
    id: "4",
    tokenName: "SolClone Gaming",
    tokenSymbol: "SCGM",
    tokenMint: "ScGm1111111111111111111111111111111111111111",
    description: "Gaming platform token for play-to-earn games built on SolClone. Stake to earn rewards and access exclusive content.",
    price: 0.001,
    targetRaise: 200,
    totalRaised: 200,
    totalAllocation: 200000,
    totalSold: 200000,
    participants: 1340,
    startTime: Date.now() - 86400000 * 10,
    endTime: Date.now() - 86400000 * 3,
    minPurchase: 0.01,
    maxPurchase: 2,
    launchType: "FixedPrice",
    isActive: false,
    isFinalized: true,
    creator: "CrEd1111111111111111111111111111111111111111",
  },
  {
    id: "5",
    tokenName: "Cross-Chain Bridge",
    tokenSymbol: "XBRD",
    tokenMint: "XBrd1111111111111111111111111111111111111111",
    description: "Governance token for the SolClone cross-chain bridge, enabling trustless asset transfers between major blockchains.",
    price: 0.008,
    targetRaise: 800,
    totalRaised: 800,
    totalAllocation: 100000,
    totalSold: 100000,
    participants: 670,
    startTime: Date.now() - 86400000 * 14,
    endTime: Date.now() - 86400000 * 7,
    minPurchase: 0.5,
    maxPurchase: 50,
    launchType: "Lottery",
    isActive: false,
    isFinalized: true,
    creator: "CrEe1111111111111111111111111111111111111111",
  },
];

export default function LaunchpadHome() {
  const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const now = Date.now();
  const upcoming = MOCK_LAUNCHES.filter((l) => l.startTime > now && l.isActive);
  const active = MOCK_LAUNCHES.filter((l) => l.startTime <= now && l.endTime > now && l.isActive);
  const completed = MOCK_LAUNCHES.filter((l) => l.isFinalized);

  if (selectedLaunch) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setSelectedLaunch(null)}
          className="mb-6 text-sm text-[#9999bb] hover:text-white transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Back to Launches
        </button>
        <LaunchDetail launch={selectedLaunch} />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setShowCreateForm(false)}
          className="mb-6 text-sm text-[#9999bb] hover:text-white transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Back to Launches
        </button>
        <CreateLaunchForm />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          SolClone Launchpad
        </h1>
        <p className="text-[#9999bb] text-lg max-w-2xl mx-auto mb-6">
          Discover and participate in fair token launches. Fixed-price sales, lottery draws, and price-discovery auctions.
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Create a Launch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Total Launches", value: MOCK_LAUNCHES.length.toString() },
          { label: "Total Raised", value: `${MOCK_LAUNCHES.reduce((s, l) => s + l.totalRaised, 0).toLocaleString()} SOL` },
          { label: "Total Participants", value: MOCK_LAUNCHES.reduce((s, l) => s + l.participants, 0).toLocaleString() },
          { label: "Active Launches", value: active.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-[#9999bb] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section id="upcoming" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Upcoming Launches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} onClick={() => setSelectedLaunch(launch)} />
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section id="active" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            Active Launches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} onClick={() => setSelectedLaunch(launch)} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section id="completed" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#666688]" />
            Completed Launches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completed.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} onClick={() => setSelectedLaunch(launch)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
