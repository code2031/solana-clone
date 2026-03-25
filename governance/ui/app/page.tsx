"use client";

import { useState } from "react";
import ProposalCard from "@/components/proposal-card";
import ProposalDetail from "@/components/proposal-detail";
import CreateProposalForm from "@/components/create-proposal-form";
import TreasuryPanel from "@/components/treasury-panel";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const CURRENT_SLOT = 5_200_000;

const PROPOSALS = [
  {
    id: 1,
    title: "Increase validator rewards by 15%",
    description:
      "This proposal aims to increase validator rewards from the current 8% to 9.2% (a 15% increase) to attract more validators and improve network decentralization.\n\nThe additional rewards would come from the existing inflation schedule, reducing the rate of treasury accumulation by approximately 0.3% annually.\n\nThis change has been discussed extensively in the community forum and received broad support from both validators and token holders.",
    status: "Active" as const,
    forVotes: 2_450_000,
    againstVotes: 820_000,
    startSlot: 5_100_000,
    endSlot: 5_748_000,
    timelockEnd: 0,
    proposer: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    voters: [
      { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", weight: 500_000, support: true },
      { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", weight: 1_200_000, support: true },
      { address: "3Hk4gBRsXx3CuJPMeSxjDKF2Z5CdMBJTnMa4RvCfsaWn", weight: 750_000, support: true },
      { address: "BPFLoaderUpgradeab1e11111111111111111111111", weight: 820_000, support: false },
    ],
  },
  {
    id: 2,
    title: "Fund DeFi ecosystem grants program",
    description:
      "Allocate 500,000 SCLONE from the DAO treasury to establish a DeFi ecosystem grants program.\n\nThe program will fund developers building lending protocols, AMMs, derivatives, and other DeFi primitives on SolClone.\n\nA grants committee of 5 elected members will review applications on a rolling basis, with individual grants capped at 50,000 SCLONE.",
    status: "Active" as const,
    forVotes: 3_100_000,
    againstVotes: 450_000,
    startSlot: 5_050_000,
    endSlot: 5_698_000,
    timelockEnd: 0,
    proposer: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    voters: [
      { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", weight: 1_500_000, support: true },
      { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", weight: 1_600_000, support: true },
      { address: "BPFLoaderUpgradeab1e11111111111111111111111", weight: 450_000, support: false },
    ],
  },
  {
    id: 3,
    title: "Reduce proposal quorum from 10% to 7%",
    description:
      "Lower the quorum requirement to improve governance participation rates.\n\nSeveral recent proposals have failed to reach quorum despite having strong majority support. Reducing the threshold from 10% to 7% will make governance more responsive while still requiring meaningful participation.",
    status: "Passed" as const,
    forVotes: 4_200_000,
    againstVotes: 1_100_000,
    startSlot: 4_500_000,
    endSlot: 5_148_000,
    timelockEnd: 5_580_000,
    proposer: "3Hk4gBRsXx3CuJPMeSxjDKF2Z5CdMBJTnMa4RvCfsaWn",
    voters: [
      { address: "3Hk4gBRsXx3CuJPMeSxjDKF2Z5CdMBJTnMa4RvCfsaWn", weight: 900_000, support: true },
      { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", weight: 2_000_000, support: true },
      { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", weight: 1_300_000, support: true },
      { address: "BPFLoaderUpgradeab1e11111111111111111111111", weight: 1_100_000, support: false },
    ],
  },
  {
    id: 4,
    title: "Upgrade oracle price aggregation algorithm",
    description: "Replace the simple median with a TWAP-weighted median for better manipulation resistance.",
    status: "Executed" as const,
    forVotes: 5_600_000,
    againstVotes: 200_000,
    startSlot: 4_000_000,
    endSlot: 4_648_000,
    timelockEnd: 5_080_000,
    proposer: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    voters: [],
  },
  {
    id: 5,
    title: "Add SCUSD/USDC liquidity incentives",
    description: "Allocate 200,000 SCLONE over 6 months to incentivize SCUSD/USDC LP positions.",
    status: "Failed" as const,
    forVotes: 1_800_000,
    againstVotes: 2_500_000,
    startSlot: 4_200_000,
    endSlot: 4_848_000,
    timelockEnd: 0,
    proposer: "BPFLoaderUpgradeab1e11111111111111111111111",
    voters: [],
  },
];

const TREASURY_BALANCE = 12_500_000;

const DISBURSEMENTS = [
  {
    id: "d1",
    recipient: "3Hk4gBRsXx3CuJPMeSxjDKF2Z5CdMBJTnMa4RvCfsaWn",
    amount: 50_000,
    purpose: "Oracle upgrade development bounty",
    date: "2026-03-15",
    proposalId: 4,
  },
  {
    id: "d2",
    recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    amount: 25_000,
    purpose: "Community education initiative",
    date: "2026-03-10",
    proposalId: 3,
  },
  {
    id: "d3",
    recipient: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    amount: 100_000,
    purpose: "DEX smart contract audit",
    date: "2026-02-28",
    proposalId: 2,
  },
];

const GRANT_APPLICATIONS = [
  {
    id: "g1",
    applicant: "FcaKzKByGq2NsUjARBCnz8pxkLFHsSvf3kkYgDKaFBBM",
    title: "Cross-chain bridge to Ethereum",
    requestedAmount: 45_000,
    status: "pending" as const,
  },
  {
    id: "g2",
    applicant: "HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8",
    title: "Mobile wallet SDK",
    requestedAmount: 30_000,
    status: "approved" as const,
  },
  {
    id: "g3",
    applicant: "DRpbCBMxVnDK7maPMoGsqkeMSQJRLQKDz96PveaEWE6N",
    title: "Governance analytics dashboard",
    requestedAmount: 15_000,
    status: "rejected" as const,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type View = "dashboard" | "create" | { type: "detail"; proposalId: number };

export default function DaoPage() {
  const [view, setView] = useState<View>("dashboard");

  const activeProposals = PROPOSALS.filter((p) => p.status === "Active");
  const recentProposals = PROPOSALS.filter((p) => p.status !== "Active");

  if (view === "create") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => setView("dashboard")}
          className="mb-6 text-sm text-muted transition-colors hover:text-foreground"
        >
          &larr; Back to Dashboard
        </button>
        <CreateProposalForm
          onSubmit={(data) => {
            console.log("Proposal submitted:", data);
            setView("dashboard");
          }}
          onCancel={() => setView("dashboard")}
        />
      </div>
    );
  }

  if (typeof view === "object" && view.type === "detail") {
    const proposal = PROPOSALS.find((p) => p.id === view.proposalId);
    if (!proposal) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted">Proposal not found.</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => setView("dashboard")}
          className="mb-6 text-sm text-muted transition-colors hover:text-foreground"
        >
          &larr; Back to Dashboard
        </button>
        <ProposalDetail
          {...proposal}
          currentSlot={CURRENT_SLOT}
          onVoteFor={() => console.log("Voted FOR proposal", proposal.id)}
          onVoteAgainst={() => console.log("Voted AGAINST proposal", proposal.id)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Treasury Balance
          </p>
          <p className="text-2xl font-bold text-foreground">
            12.5M <span className="text-sm font-normal text-muted">SCLONE</span>
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Active Proposals
          </p>
          <p className="text-2xl font-bold text-accent-purple">
            {activeProposals.length}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Total Proposals
          </p>
          <p className="text-2xl font-bold text-foreground">
            {PROPOSALS.length}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
            Voting Power
          </p>
          <p className="text-2xl font-bold text-foreground">
            0 <span className="text-sm font-normal text-muted">SCLONE</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">Connect wallet to view</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content: proposals */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active proposals */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Active Proposals
              </h2>
              <button
                onClick={() => setView("create")}
                className="rounded-lg bg-accent-purple px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Create Proposal
              </button>
            </div>
            {activeProposals.length === 0 && (
              <p className="rounded-xl border border-card-border bg-card-bg p-8 text-center text-sm text-muted">
                No active proposals. Be the first to create one.
              </p>
            )}
            <div className="space-y-3">
              {activeProposals.map((p) => (
                <div
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setView({ type: "detail", proposalId: p.id })}
                >
                  <ProposalCard
                    {...p}
                    currentSlot={CURRENT_SLOT}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Recent proposals */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Recent Proposals
            </h2>
            <div className="space-y-3">
              {recentProposals.map((p) => (
                <div
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setView({ type: "detail", proposalId: p.id })}
                >
                  <ProposalCard
                    {...p}
                    currentSlot={CURRENT_SLOT}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: treasury */}
        <aside id="treasury">
          <TreasuryPanel
            balance={TREASURY_BALANCE}
            recentDisbursements={DISBURSEMENTS}
            grantApplications={GRANT_APPLICATIONS}
          />
        </aside>
      </div>
    </div>
  );
}
