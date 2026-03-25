"use client";

interface Disbursement {
  id: string;
  recipient: string;
  amount: number;
  purpose: string;
  date: string;
  proposalId: number;
}

interface GrantApplication {
  id: string;
  applicant: string;
  title: string;
  requestedAmount: number;
  status: "pending" | "approved" | "rejected";
}

interface TreasuryPanelProps {
  balance: number;
  tokenSymbol?: string;
  recentDisbursements: Disbursement[];
  grantApplications: GrantApplication[];
}

function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ${symbol}`;
  return `${amount.toLocaleString()} ${symbol}`;
}

function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const GRANT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-accent-amber/20 text-accent-amber",
  approved: "bg-accent-green/20 text-accent-green",
  rejected: "bg-accent-red/20 text-accent-red",
};

export default function TreasuryPanel({
  balance,
  tokenSymbol = "PRISM",
  recentDisbursements,
  grantApplications,
}: TreasuryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <p className="mb-1 text-sm font-medium uppercase tracking-wider text-muted">
          Treasury Balance
        </p>
        <p className="text-3xl font-bold text-foreground">
          {formatAmount(balance, tokenSymbol)}
        </p>
        <p className="mt-1 text-sm text-muted">
          ${((balance * 1.25) / 1_000_000).toFixed(2)}M USD est. value
        </p>
      </div>

      {/* Recent disbursements */}
      <div className="rounded-xl border border-card-border bg-card-bg">
        <div className="border-b border-card-border px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Recent Disbursements
          </h3>
        </div>
        <div className="divide-y divide-card-border">
          {recentDisbursements.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted">
              No recent disbursements.
            </p>
          )}
          {recentDisbursements.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {d.purpose}
                </p>
                <p className="text-xs text-muted">
                  To {formatAddress(d.recipient)} -- Proposal #{d.proposalId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-accent-red">
                  -{formatAmount(d.amount, tokenSymbol)}
                </p>
                <p className="text-xs text-muted">{d.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grant applications */}
      <div className="rounded-xl border border-card-border bg-card-bg">
        <div className="border-b border-card-border px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Grant Applications
          </h3>
        </div>
        <div className="divide-y divide-card-border">
          {grantApplications.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted">
              No grant applications.
            </p>
          )}
          {grantApplications.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {g.title}
                </p>
                <p className="text-xs text-muted">
                  by {formatAddress(g.applicant)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {formatAmount(g.requestedAmount, tokenSymbol)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    GRANT_STATUS_STYLES[g.status] ?? ""
                  }`}
                >
                  {g.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
