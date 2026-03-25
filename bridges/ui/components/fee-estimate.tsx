"use client";

interface FeeEstimateProps {
  sourceChain: string;
  destChain: string;
  token: string;
  amount: string;
}

interface FeeDetails {
  bridgeFee: string;
  bridgeFeeUsd: string;
  gasFee: string;
  gasFeeUsd: string;
  estimatedTime: string;
  totalUsd: string;
}

function calculateFees(
  sourceChain: string,
  destChain: string,
  token: string,
  amount: string
): FeeDetails {
  const amt = parseFloat(amount) || 0;

  // Bridge fee: 0.1% of amount
  const bridgeFeeAmount = amt * 0.001;

  // Gas estimates by chain
  const gasEstimates: Record<string, { fee: string; usd: string }> = {
    ethereum: { fee: "0.003 ETH", usd: "$9.50" },
    bitcoin: { fee: "5,000 sats", usd: "$3.25" },
    solana: { fee: "0.000005 SOL", usd: "$0.001" },
    solclone: { fee: "0.000005 SC", usd: "$0.001" },
  };

  // Estimated times
  const timeEstimates: Record<string, string> = {
    ethereum: "~15 minutes",
    bitcoin: "~60 minutes",
    solana: "~30 seconds",
    solclone: "~30 seconds",
  };

  // Use the slower chain's time
  const sourceTime = timeEstimates[sourceChain] || "~5 minutes";
  const destTime = timeEstimates[destChain] || "~5 minutes";

  // Pick the chain with longer estimated time
  const timeOrder = ["solclone", "solana", "ethereum", "bitcoin"];
  const sourceIdx = timeOrder.indexOf(sourceChain);
  const destIdx = timeOrder.indexOf(destChain);
  const estimatedTime = sourceIdx >= destIdx ? sourceTime : destTime;

  const sourceGas = gasEstimates[sourceChain] || { fee: "N/A", usd: "$0" };

  // Mock USD value
  const tokenPrices: Record<string, number> = {
    ETH: 3200, scETH: 3200, WBTC: 65000, BTC: 65000, scBTC: 65000,
    SOL: 180, USDC: 1, USDT: 1,
  };
  const price = tokenPrices[token] || 1;
  const bridgeFeeUsd = (bridgeFeeAmount * price).toFixed(2);
  const gasUsd = parseFloat(sourceGas.usd.replace("$", ""));
  const totalUsd = (parseFloat(bridgeFeeUsd) + gasUsd).toFixed(2);

  return {
    bridgeFee: `${bridgeFeeAmount.toFixed(6)} ${token}`,
    bridgeFeeUsd: `$${bridgeFeeUsd}`,
    gasFee: sourceGas.fee,
    gasFeeUsd: sourceGas.usd,
    estimatedTime,
    totalUsd: `$${totalUsd}`,
  };
}

export default function FeeEstimate({
  sourceChain,
  destChain,
  token,
  amount,
}: FeeEstimateProps) {
  const fees = calculateFees(sourceChain, destChain, token, amount);
  const hasAmount = parseFloat(amount) > 0;

  return (
    <div
      style={{
        background: "#13103A",
        border: "1px solid #2D2670",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", marginBottom: 12 }}>
        Fee Estimate
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#64748B" }}>Bridge Fee (0.1%)</span>
          <span style={{ color: "#E2E8F0" }}>
            {hasAmount ? fees.bridgeFee : "--"}{" "}
            {hasAmount && (
              <span style={{ color: "#64748B", fontSize: 11 }}>({fees.bridgeFeeUsd})</span>
            )}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#64748B" }}>Gas Estimate</span>
          <span style={{ color: "#E2E8F0" }}>
            {fees.gasFee}{" "}
            <span style={{ color: "#64748B", fontSize: 11 }}>({fees.gasFeeUsd})</span>
          </span>
        </div>

        <div
          style={{
            borderTop: "1px solid #2D2670",
            paddingTop: 8,
            marginTop: 4,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#64748B" }}>Estimated Time</span>
          <span style={{ color: "#10B981", fontWeight: 500 }}>{fees.estimatedTime}</span>
        </div>

        {hasAmount && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#64748B" }}>Total Fees</span>
            <span style={{ color: "#F59E0B", fontWeight: 600 }}>{fees.totalUsd}</span>
          </div>
        )}
      </div>
    </div>
  );
}
