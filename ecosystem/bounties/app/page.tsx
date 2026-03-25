"use client";

import { useState, useMemo } from "react";
import { BountyCard } from "@/components/bounty-card";
import { BountyDetail } from "@/components/bounty-detail";
import { CreateBounty } from "@/components/create-bounty";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type BountyStatus = "Open" | "InProgress" | "Completed";
export type Category = "Frontend" | "Smart Contract" | "Infrastructure" | "Documentation" | "Testing" | "Design";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  requirements: string[];
  reward: number;
  difficulty: Difficulty;
  category: Category;
  deadline: number;
  status: BountyStatus;
  creator: string;
  claimedBy: string | null;
  submissions: Submission[];
}

export interface Submission {
  id: string;
  author: string;
  description: string;
  link: string;
  submittedAt: number;
}

const MOCK_BOUNTIES: Bounty[] = [
  {
    id: "b1",
    title: "Implement Token Transfer History Component",
    description: "Build a reusable React component that displays token transfer history for any SPL token, with pagination and filtering.",
    fullDescription: "Create a production-ready React component that fetches and displays SPL token transfer history using the SolClone RPC. The component should support pagination, filtering by date range and amount, sorting, and should be fully responsive. Include proper loading states, error handling, and empty states.",
    requirements: [
      "Fetch transfers via getSignaturesForAddress + getParsedTransaction",
      "Support pagination with configurable page size",
      "Filter by date range and minimum amount",
      "Responsive design with dark theme",
      "Unit tests with >80% coverage",
    ],
    reward: 500,
    difficulty: "Easy",
    category: "Frontend",
    deadline: Date.now() + 86400000 * 14,
    status: "Open",
    creator: "BntyCreator11111111111111111111111111111111",
    claimedBy: null,
    submissions: [],
  },
  {
    id: "b2",
    title: "Escrow Program for P2P Trading",
    description: "Write a Solana program that implements trustless P2P token escrow with dispute resolution.",
    fullDescription: "Develop a Solana program (in Rust) that enables two parties to exchange tokens trustlessly via an escrow mechanism. The program should support creating escrow offers, accepting them, cancellation, and a dispute resolution flow with an optional arbiter. Include comprehensive tests.",
    requirements: [
      "Escrow create, accept, cancel, and complete instructions",
      "Arbiter-based dispute resolution",
      "Support for any SPL token pair",
      "Comprehensive Rust unit tests",
      "Security considerations documented",
    ],
    reward: 2000,
    difficulty: "Hard",
    category: "Smart Contract",
    deadline: Date.now() + 86400000 * 21,
    status: "Open",
    creator: "BntyCreator11111111111111111111111111111111",
    claimedBy: null,
    submissions: [],
  },
  {
    id: "b3",
    title: "Prometheus Metrics Exporter for Validators",
    description: "Create a Prometheus metrics exporter that exposes validator performance data for monitoring dashboards.",
    fullDescription: "Build a lightweight service that connects to a SolClone validator and exposes key metrics (skip rate, vote credits, leader slots, block production, etc.) in Prometheus format. Should be deployable as a Docker container alongside the validator.",
    requirements: [
      "Export key validator metrics (skip rate, credits, slots, etc.)",
      "Prometheus-compatible /metrics endpoint",
      "Docker container with health checks",
      "Grafana dashboard template included",
      "Configuration via environment variables",
    ],
    reward: 1200,
    difficulty: "Medium",
    category: "Infrastructure",
    deadline: Date.now() + 86400000 * 28,
    status: "Open",
    creator: "BntyCreator22222222222222222222222222222222",
    claimedBy: null,
    submissions: [],
  },
  {
    id: "b4",
    title: "Write Program Development Guide",
    description: "Create a comprehensive guide for developing Solana programs on SolClone, from setup to deployment.",
    fullDescription: "Write an end-to-end developer guide covering the SolClone program development lifecycle. Cover environment setup, project structure, writing and testing programs in Rust, deploying to devnet/mainnet, and common patterns and pitfalls. Include code samples and diagrams.",
    requirements: [
      "Cover full development lifecycle",
      "Code samples that compile and run",
      "Diagrams for architecture concepts",
      "Beginner-friendly with progressive complexity",
      "Peer-reviewed for accuracy",
    ],
    reward: 800,
    difficulty: "Medium",
    category: "Documentation",
    deadline: Date.now() + 86400000 * 30,
    status: "InProgress",
    creator: "BntyCreator11111111111111111111111111111111",
    claimedBy: "DevWriter111111111111111111111111111111111",
    submissions: [],
  },
  {
    id: "b5",
    title: "Integration Test Suite for Token Program",
    description: "Build a comprehensive integration test suite for the SolClone Token program covering all instructions.",
    fullDescription: "Create an integration test suite using the solana-program-test framework that covers all Token program instructions including mint, transfer, burn, freeze, thaw, and close. Tests should cover both success and failure paths with clear assertions.",
    requirements: [
      "Cover all Token program instructions",
      "Test both success and error paths",
      "Use solana-program-test framework",
      "Document test coverage report",
      "CI/CD pipeline configuration",
    ],
    reward: 600,
    difficulty: "Easy",
    category: "Testing",
    deadline: Date.now() - 86400000 * 5,
    status: "Completed",
    creator: "BntyCreator22222222222222222222222222222222",
    claimedBy: "TestDev1111111111111111111111111111111111111",
    submissions: [
      {
        id: "s1",
        author: "TestDev1111111111111111111111111111111111111",
        description: "Complete test suite with 95% coverage across all Token program instructions.",
        link: "https://github.com/example/token-tests",
        submittedAt: Date.now() - 86400000 * 6,
      },
    ],
  },
  {
    id: "b6",
    title: "Design System Component Library",
    description: "Design and implement a reusable UI component library following SolClone brand guidelines.",
    fullDescription: "Create a design system with reusable React components (buttons, inputs, cards, modals, tables, charts) that follow the SolClone dark theme and brand guidelines. Components should be accessible, responsive, and documented with Storybook.",
    requirements: [
      "Core components: Button, Input, Card, Modal, Table, Badge",
      "Chart components for financial data",
      "Dark theme with SolClone brand colors",
      "Storybook documentation",
      "Accessibility compliance (WCAG 2.1 AA)",
    ],
    reward: 1500,
    difficulty: "Hard",
    category: "Design",
    deadline: Date.now() + 86400000 * 35,
    status: "Open",
    creator: "BntyCreator33333333333333333333333333333333",
    claimedBy: null,
    submissions: [],
  },
];

export default function BountyBoard() {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "All">("All");

  const openBounties = useMemo(() => {
    return MOCK_BOUNTIES.filter((b) => {
      if (b.status !== "Open") return false;
      if (filterCategory !== "All" && b.category !== filterCategory) return false;
      if (filterDifficulty !== "All" && b.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [filterCategory, filterDifficulty]);

  const inProgress = MOCK_BOUNTIES.filter((b) => b.status === "InProgress");
  const completed = MOCK_BOUNTIES.filter((b) => b.status === "Completed");
  const totalRewards = MOCK_BOUNTIES.reduce((s, b) => s + b.reward, 0);

  const categories: (Category | "All")[] = ["All", "Frontend", "Smart Contract", "Infrastructure", "Documentation", "Testing", "Design"];
  const difficulties: (Difficulty | "All")[] = ["All", "Easy", "Medium", "Hard"];

  if (selectedBounty) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setSelectedBounty(null)}
          className="mb-6 text-sm text-[#9999bb] hover:text-white transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Back to Bounties
        </button>
        <BountyDetail bounty={selectedBounty} />
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
          <span>&larr;</span> Back to Bounties
        </button>
        <CreateBounty />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
          SolClone Bounty Board
        </h1>
        <p className="text-[#9999bb] text-lg max-w-2xl mx-auto mb-6">
          Earn SCLONE tokens by completing development tasks. Browse open bounties, claim work, and get rewarded.
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Post a Bounty
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bounties", value: MOCK_BOUNTIES.length.toString() },
          { label: "Open", value: MOCK_BOUNTIES.filter((b) => b.status === "Open").length.toString() },
          { label: "Total Rewards", value: `${totalRewards.toLocaleString()} SCLONE` },
          { label: "Completed", value: completed.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-[#9999bb] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div>
            <label className="block text-xs text-[#666688] mb-2">Category</label>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterCategory === cat
                      ? "bg-red-600 text-white"
                      : "bg-[#0a0a0f] text-[#9999bb] hover:text-white border border-[#2a2a4a]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#666688] mb-2">Difficulty</label>
            <div className="flex gap-1">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterDifficulty === diff
                      ? "bg-red-600 text-white"
                      : "bg-[#0a0a0f] text-[#9999bb] hover:text-white border border-[#2a2a4a]"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Bounties */}
      <section id="open" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Open Bounties
        </h2>
        {openBounties.length === 0 ? (
          <div className="text-center py-12 text-[#666688]">No bounties match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {openBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} onClick={() => setSelectedBounty(bounty)} />
            ))}
          </div>
        )}
      </section>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section id="in-progress" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            In Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inProgress.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} onClick={() => setSelectedBounty(bounty)} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section id="completed" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completed.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} onClick={() => setSelectedBounty(bounty)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
