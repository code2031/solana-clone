"use client";

interface BridgeRecord {
  id: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: string;
  status: "pending" | "confirming" | "completed" | "failed";
  timestamp: string;
  txHash: string;
}

const MOCK_RECENT: BridgeRecord[] = [
  {
    id: "1",
    sourceChain: "Ethereum",
    destChain: "SolClone",
    token: "ETH",
    amount: "1.5000",
    status: "completed",
    timestamp: "2 min ago",
    txHash: "0x8f3a...e4b1",
  },
  {
    id: "2",
    sourceChain: "Bitcoin",
    destChain: "SolClone",
    token: "BTC",
    amount: "0.0500",
    status: "confirming",
    timestamp: "18 min ago",
    txHash: "a3c4...7f2d",
  },
  {
    id: "3",
    sourceChain: "SolClone",
    destChain: "Solana",
    token: "SOL",
    amount: "250.00",
    status: "completed",
    timestamp: "25 min ago",
    txHash: "5Kj2...9pRv",
  },
  {
    id: "4",
    sourceChain: "Solana",
    destChain: "SolClone",
    token: "USDC",
    amount: "10,000",
    status: "completed",
    timestamp: "1 hr ago",
    txHash: "7Hn4...mQ3x",
  },
  {
    id: "5",
    sourceChain: "Ethereum",
    destChain: "SolClone",
    token: "USDT",
    amount: "5,000",
    status: "pending",
    timestamp: "1 hr ago",
    txHash: "0xb2c1...d8a3",
  },
  {
    id: "6",
    sourceChain: "SolClone",
    destChain: "Ethereum",
    token: "scETH",
    amount: "3.2000",
    status: "failed",
    timestamp: "2 hrs ago",
    txHash: "9Lp5...kW2j",
  },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#F59E0B22", color: "#F59E0B", label: "Pending" },
  confirming: { bg: "#3B82F622", color: "#3B82F6", label: "Confirming" },
  completed: { bg: "#10B98122", color: "#10B981", label: "Completed" },
  failed: { bg: "#EF444422", color: "#EF4444", label: "Failed" },
};

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Bitcoin: "#F7931A",
  Solana: "#9945FF",
  SolClone: "#8B5CF6",
};

export default function RecentBridges() {
  return (
    <div
      style={{
        background: "#1A1545",
        border: "1px solid #2D2670",
        borderRadius: 16,
        padding: 24,
        marginTop: 24,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 16,
          color: "#E2E8F0",
        }}
      >
        Recent Bridge Transactions
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Route", "Token", "Amount", "Status", "Time", "Tx"].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#64748B",
                    fontWeight: 500,
                    borderBottom: "1px solid #2D2670",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_RECENT.map((record) => {
              const statusStyle = STATUS_STYLES[record.status];
              return (
                <tr
                  key={record.id}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#231D5E";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "10px 12px", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: CHAIN_COLORS[record.sourceChain] || "#666",
                          display: "inline-block",
                        }}
                      />
                      <span style={{ color: "#E2E8F0" }}>{record.sourceChain}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M7 3L10 6L7 9" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: CHAIN_COLORS[record.destChain] || "#666",
                          display: "inline-block",
                        }}
                      />
                      <span style={{ color: "#E2E8F0" }}>{record.destChain}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#E2E8F0", fontWeight: 500 }}>
                    {record.token}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#E2E8F0" }}>
                    {record.amount}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 6,
                        display: "inline-block",
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>
                    {record.timestamp}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <a
                      href="#"
                      style={{
                        fontSize: 12,
                        color: "#8B5CF6",
                        textDecoration: "none",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {record.txHash}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
