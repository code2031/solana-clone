"use client";

export type BridgeStep =
  | "initiated"
  | "confirming"
  | "attesting"
  | "minting"
  | "complete";

interface StepInfo {
  key: BridgeStep;
  label: string;
  txHash?: string;
}

interface BridgeStatusProps {
  currentStep: BridgeStep;
  steps: StepInfo[];
  sourceChain: string;
  destChain: string;
}

const STEP_ORDER: BridgeStep[] = [
  "initiated",
  "confirming",
  "attesting",
  "minting",
  "complete",
];

function getExplorerUrl(chain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    bitcoin: `https://mempool.space/tx/${txHash}`,
    solana: `https://solscan.io/tx/${txHash}`,
    solclone: `https://explorer.solclone.io/tx/${txHash}`,
  };
  return explorers[chain] || `#${txHash}`;
}

export default function BridgeStatus({
  currentStep,
  steps,
  sourceChain,
  destChain,
}: BridgeStatusProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div
      style={{
        background: "#1A1545",
        border: "1px solid #2D2670",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 20,
          color: "#E2E8F0",
        }}
      >
        Bridge Status
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, idx) => {
          const stepIndex = STEP_ORDER.indexOf(step.key);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex > currentIndex;

          let dotColor = "#2D2670";
          let lineColor = "#2D2670";
          if (isCompleted) {
            dotColor = "#10B981";
            lineColor = "#10B981";
          } else if (isCurrent) {
            dotColor = "#8B5CF6";
          }

          const chain =
            step.key === "initiated" || step.key === "confirming"
              ? sourceChain
              : destChain;

          return (
            <div key={step.key}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: dotColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background 0.3s",
                    }}
                  >
                    {isCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : isCurrent ? (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#fff",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 32,
                        background: isCompleted ? lineColor : "#2D2670",
                        transition: "background 0.3s",
                      }}
                    />
                  )}
                </div>

                {/* Step info */}
                <div style={{ paddingBottom: idx < steps.length - 1 ? 12 : 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isCurrent ? 600 : 400,
                      color: isPending ? "#475569" : "#E2E8F0",
                    }}
                  >
                    {step.label}
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          background: "#8B5CF622",
                          color: "#8B5CF6",
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        In Progress
                      </span>
                    )}
                  </div>

                  {step.txHash && (
                    <a
                      href={getExplorerUrl(chain, step.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "#8B5CF6",
                        textDecoration: "none",
                        display: "inline-block",
                        marginTop: 4,
                      }}
                    >
                      {step.txHash.slice(0, 8)}...{step.txHash.slice(-6)}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
