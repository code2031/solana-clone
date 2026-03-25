"use client";

import { useState } from "react";
import { GrantCard } from "@/components/grant-card";
import { GrantDetail } from "@/components/grant-detail";
import { FundedProject } from "@/components/funded-project";

export interface Grant {
  id: string;
  title: string;
  description: string;
  category: "DeFi" | "Tooling" | "Education" | "Infrastructure";
  fundingAmount: number;
  deadline: number;
  applicants: number;
  requirements: string[];
  isOpen: boolean;
}

export interface FundedProjectData {
  id: string;
  name: string;
  team: string;
  amountFunded: number;
  totalMilestones: number;
  completedMilestones: number;
  links: { label: string; url: string }[];
  grantTitle: string;
}

const MOCK_GRANTS: Grant[] = [
  {
    id: "g1",
    title: "Cross-Chain DEX Aggregator",
    description: "Build a DEX aggregator that sources liquidity from multiple Prism AMMs and cross-chain bridges to provide optimal swap routing for users.",
    category: "DeFi",
    fundingAmount: 50000,
    deadline: Date.now() + 86400000 * 30,
    applicants: 12,
    requirements: [
      "Working prototype or MVP",
      "Technical architecture documentation",
      "Team of 2+ developers with DeFi experience",
      "Quarterly milestone deliverables",
    ],
    isOpen: true,
  },
  {
    id: "g2",
    title: "Developer SDK & CLI Tools",
    description: "Create a comprehensive SDK and CLI toolkit for Prism developers including project scaffolding, contract deployment, testing frameworks, and monitoring tools.",
    category: "Tooling",
    fundingAmount: 35000,
    deadline: Date.now() + 86400000 * 45,
    applicants: 8,
    requirements: [
      "Open-source with MIT or Apache 2.0 license",
      "Documentation and tutorials",
      "Support for TypeScript and Rust",
      "CI/CD integration examples",
    ],
    isOpen: true,
  },
  {
    id: "g3",
    title: "Prism Academy",
    description: "Develop a comprehensive educational platform with interactive courses covering Prism development, from beginner blockchain concepts to advanced program development.",
    category: "Education",
    fundingAmount: 25000,
    deadline: Date.now() + 86400000 * 60,
    applicants: 15,
    requirements: [
      "Curriculum covering beginner to advanced topics",
      "Interactive coding exercises",
      "Video content and written guides",
      "Certification program",
    ],
    isOpen: true,
  },
  {
    id: "g4",
    title: "High-Performance RPC Infrastructure",
    description: "Deploy and maintain geo-distributed RPC nodes with load balancing, caching, and WebSocket support for the Prism network.",
    category: "Infrastructure",
    fundingAmount: 75000,
    deadline: Date.now() + 86400000 * 20,
    applicants: 5,
    requirements: [
      "Multi-region deployment plan",
      "99.9% uptime SLA",
      "Performance benchmarks",
      "Monitoring and alerting infrastructure",
    ],
    isOpen: true,
  },
  {
    id: "g5",
    title: "Yield Farming Protocol",
    description: "Design and implement a yield aggregation protocol that automatically compounds rewards across Prism DeFi protocols.",
    category: "DeFi",
    fundingAmount: 40000,
    deadline: Date.now() - 86400000 * 5,
    applicants: 20,
    requirements: [
      "Smart contract audit plan",
      "Risk management framework",
      "TVL growth strategy",
      "Revenue model documentation",
    ],
    isOpen: false,
  },
];

const MOCK_FUNDED: FundedProjectData[] = [
  {
    id: "fp1",
    name: "Prism Block Explorer",
    team: "ExplorerDAO",
    amountFunded: 30000,
    totalMilestones: 5,
    completedMilestones: 4,
    links: [
      { label: "GitHub", url: "https://github.com/example/explorer" },
      { label: "Live App", url: "https://explorer.prism.io" },
    ],
    grantTitle: "Block Explorer & Analytics",
  },
  {
    id: "fp2",
    name: "Prism Wallet SDK",
    team: "WalletWorks",
    amountFunded: 20000,
    totalMilestones: 4,
    completedMilestones: 4,
    links: [
      { label: "GitHub", url: "https://github.com/example/wallet-sdk" },
      { label: "npm", url: "https://npmjs.com/package/prism-wallet" },
    ],
    grantTitle: "Wallet Integration Toolkit",
  },
  {
    id: "fp3",
    name: "DeFi Dashboard",
    team: "DataLabs",
    amountFunded: 15000,
    totalMilestones: 3,
    completedMilestones: 2,
    links: [
      { label: "GitHub", url: "https://github.com/example/defi-dash" },
    ],
    grantTitle: "Analytics & Monitoring Tools",
  },
];

export default function GrantsHome() {
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);

  const openGrants = MOCK_GRANTS.filter((g) => g.isOpen);
  const closedGrants = MOCK_GRANTS.filter((g) => !g.isOpen);

  const totalFunded = MOCK_FUNDED.reduce((s, p) => s + p.amountFunded, 0);

  if (selectedGrant) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setSelectedGrant(null)}
          className="mb-6 text-sm text-[#9999bb] hover:text-white transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Back to Grants
        </button>
        <GrantDetail grant={selectedGrant} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Prism Grants Program
        </h1>
        <p className="text-[#9999bb] text-lg max-w-2xl mx-auto">
          Apply for funding to build tools, infrastructure, and applications that grow the Prism ecosystem.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { label: "Total Funded", value: `${totalFunded.toLocaleString()} PRISM` },
          { label: "Active Grants", value: openGrants.length.toString() },
          { label: "Total Applications", value: MOCK_GRANTS.reduce((s, g) => s + g.applicants, 0).toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-[#9999bb] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Open Grants */}
      <section id="open" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          Open Grants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openGrants.map((grant) => (
            <GrantCard key={grant.id} grant={grant} onClick={() => setSelectedGrant(grant)} />
          ))}
        </div>
      </section>

      {/* Your Applications */}
      <section id="applications" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Your Applications
        </h2>
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-8 text-center text-[#666688]">
          Connect your wallet to view your grant applications.
        </div>
      </section>

      {/* Funded Projects */}
      <section id="funded" className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          Funded Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_FUNDED.map((project) => (
            <FundedProject key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Closed Grants */}
      {closedGrants.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#666688]" />
            Closed Grants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {closedGrants.map((grant) => (
              <GrantCard key={grant.id} grant={grant} onClick={() => setSelectedGrant(grant)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
