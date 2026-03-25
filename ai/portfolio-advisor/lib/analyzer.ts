export interface TokenHolding {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  percentage: number;
  mint: string;
}

export interface PortfolioAnalysis {
  holdings: TokenHolding[];
  totalValue: number;
  riskScore: number;
  concentrationRisk: number;
  diversificationScore: number;
  volatilityEstimate: string;
  suggestions: Suggestion[];
  summary: string;
}

export interface Suggestion {
  id: string;
  type: "rebalance" | "stake" | "diversify" | "warning" | "opportunity";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
}

// Mock token data for demonstration
const MOCK_TOKENS: Record<string, { symbol: string; name: string; price: number }> = {
  SOL: { symbol: "SOL", name: "Solana", price: 148.52 },
  USDC: { symbol: "USDC", name: "USD Coin", price: 1.0 },
  BONK: { symbol: "BONK", name: "Bonk", price: 0.0000234 },
  JTO: { symbol: "JTO", name: "Jito", price: 3.82 },
  RAY: { symbol: "RAY", name: "Raydium", price: 2.15 },
  ORCA: { symbol: "ORCA", name: "Orca", price: 1.87 },
  MSOL: { symbol: "mSOL", name: "Marinade Staked SOL", price: 165.2 },
  JUP: { symbol: "JUP", name: "Jupiter", price: 1.24 },
};

// Calculate Herfindahl-Hirschman Index for concentration
function calculateHHI(percentages: number[]): number {
  return percentages.reduce((sum, p) => sum + Math.pow(p / 100, 2), 0);
}

// Generate mock holdings based on wallet address (deterministic)
function generateMockHoldings(address: string): TokenHolding[] {
  const seed = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tokenKeys = Object.keys(MOCK_TOKENS);
  const numTokens = 3 + (seed % 5);

  const holdings: TokenHolding[] = [];
  let totalValue = 0;

  for (let i = 0; i < numTokens && i < tokenKeys.length; i++) {
    const key = tokenKeys[(seed + i) % tokenKeys.length];
    const token = MOCK_TOKENS[key];
    const balance = ((seed * (i + 1) * 7) % 10000) / (token.price > 1 ? 1 : 1000000);
    const usdValue = balance * token.price;
    holdings.push({
      symbol: token.symbol,
      name: token.name,
      balance: Math.round(balance * 1000) / 1000,
      usdValue: Math.round(usdValue * 100) / 100,
      percentage: 0,
      mint: `${key}mint${address.slice(0, 8)}`,
    });
    totalValue += usdValue;
  }

  // Calculate percentages
  holdings.forEach((h) => {
    h.percentage = Math.round((h.usdValue / totalValue) * 10000) / 100;
  });

  // Sort by value descending
  holdings.sort((a, b) => b.usdValue - a.usdValue);

  return holdings;
}

function estimateVolatility(holdings: TokenHolding[]): string {
  const stablePercentage = holdings
    .filter((h) => ["USDC", "USDT", "DAI"].includes(h.symbol))
    .reduce((sum, h) => sum + h.percentage, 0);

  if (stablePercentage > 60) return "Low";
  if (stablePercentage > 30) return "Medium";
  if (stablePercentage > 10) return "Medium-High";
  return "High";
}

function generateSuggestions(holdings: TokenHolding[], hhi: number): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const topHolding = holdings[0];
  const stakedPercentage = holdings
    .filter((h) => ["mSOL", "stSOL", "jitoSOL", "bSOL"].includes(h.symbol))
    .reduce((sum, h) => sum + h.percentage, 0);
  const stablePercentage = holdings
    .filter((h) => ["USDC", "USDT", "DAI"].includes(h.symbol))
    .reduce((sum, h) => sum + h.percentage, 0);

  // Concentration warning
  if (topHolding && topHolding.percentage > 50) {
    suggestions.push({
      id: "conc-1",
      type: "diversify",
      title: "High Concentration Risk",
      description: `${topHolding.symbol} makes up ${topHolding.percentage.toFixed(1)}% of your portfolio. Consider diversifying to reduce single-asset risk.`,
      priority: "high",
      action: `Reduce ${topHolding.symbol} allocation to under 40%`,
    });
  }

  // Staking suggestion
  if (stakedPercentage < 10) {
    const solHolding = holdings.find((h) => h.symbol === "SOL");
    suggestions.push({
      id: "stake-1",
      type: "stake",
      title: "Consider Staking SOL",
      description: `Only ${stakedPercentage.toFixed(1)}% of your portfolio is staked. ${solHolding ? `You have ${solHolding.balance} SOL that could earn ~7% APY through liquid staking.` : "Staking SOL earns ~7% APY through liquid staking protocols."}`,
      priority: "medium",
      action: "Stake SOL via Marinade or Jito for liquid staking rewards",
    });
  }

  // Stablecoin allocation
  if (stablePercentage < 5) {
    suggestions.push({
      id: "stable-1",
      type: "rebalance",
      title: "Add Stablecoin Buffer",
      description: "Your portfolio has minimal stablecoin exposure. Consider holding 10-20% in USDC for buying opportunities during dips.",
      priority: "medium",
      action: "Allocate 10-15% to USDC",
    });
  } else if (stablePercentage > 50) {
    suggestions.push({
      id: "stable-2",
      type: "opportunity",
      title: "High Stablecoin Allocation",
      description: `${stablePercentage.toFixed(1)}% in stablecoins. Consider deploying some into yield-bearing positions or DeFi protocols.`,
      priority: "low",
      action: "Explore lending protocols for stablecoin yield",
    });
  }

  // Low diversification
  if (holdings.length < 4) {
    suggestions.push({
      id: "div-1",
      type: "diversify",
      title: "Low Token Diversification",
      description: `You only hold ${holdings.length} tokens. Consider diversifying across more assets and sectors (DeFi, infrastructure, memes).`,
      priority: "medium",
      action: "Research and add 2-3 more token positions",
    });
  }

  // HHI-based rebalance
  if (hhi > 0.4) {
    suggestions.push({
      id: "reb-1",
      type: "rebalance",
      title: "Portfolio Rebalancing Recommended",
      description: "Your portfolio concentration index (HHI) is high. A more balanced allocation would reduce risk while maintaining upside potential.",
      priority: "high",
      action: "Rebalance to target allocation: 30% SOL, 20% staked, 20% DeFi, 15% stables, 15% other",
    });
  }

  // Meme coin warning
  const memcoins = holdings.filter((h) => ["BONK", "WIF", "MYRO", "POPCAT"].includes(h.symbol));
  const memePercentage = memcoins.reduce((sum, h) => sum + h.percentage, 0);
  if (memePercentage > 20) {
    suggestions.push({
      id: "meme-1",
      type: "warning",
      title: "High Meme Coin Exposure",
      description: `${memePercentage.toFixed(1)}% of your portfolio is in meme coins. These are highly volatile and could lose significant value quickly.`,
      priority: "high",
      action: "Consider reducing meme coin allocation to under 10%",
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function analyzePortfolio(walletAddress: string): PortfolioAnalysis {
  const holdings = generateMockHoldings(walletAddress);
  const totalValue = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  const percentages = holdings.map((h) => h.percentage);
  const hhi = calculateHHI(percentages);
  const diversificationScore = Math.round((1 - hhi) * 100);
  const volatilityEstimate = estimateVolatility(holdings);
  const suggestions = generateSuggestions(holdings, hhi);

  // Risk score: 1 (safest) to 10 (riskiest)
  let riskScore = 5;
  if (hhi > 0.5) riskScore += 2;
  else if (hhi > 0.3) riskScore += 1;

  const stablePercent = holdings
    .filter((h) => ["USDC", "USDT", "DAI"].includes(h.symbol))
    .reduce((sum, h) => sum + h.percentage, 0);
  if (stablePercent > 40) riskScore -= 2;
  else if (stablePercent < 10) riskScore += 1;

  if (holdings.length < 3) riskScore += 1;
  riskScore = Math.max(1, Math.min(10, riskScore));

  const summary = `Portfolio valued at $${totalValue.toLocaleString()} across ${holdings.length} tokens. ` +
    `Concentration risk is ${hhi > 0.4 ? "high" : hhi > 0.2 ? "moderate" : "low"} ` +
    `with a diversification score of ${diversificationScore}/100. ` +
    `Estimated volatility: ${volatilityEstimate}. ` +
    `${suggestions.filter((s) => s.priority === "high").length} high-priority suggestions.`;

  return {
    holdings,
    totalValue: Math.round(totalValue * 100) / 100,
    riskScore,
    concentrationRisk: Math.round(hhi * 1000) / 10,
    diversificationScore,
    volatilityEstimate,
    suggestions,
    summary,
  };
}
