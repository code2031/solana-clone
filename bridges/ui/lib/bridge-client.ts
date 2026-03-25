/**
 * Prism Bridge Client
 *
 * Unified client that routes bridge operations to the appropriate
 * bridge program based on the source and destination chain selection.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChainId = "ethereum" | "bitcoin" | "solana" | "prism";

export interface BridgeRequest {
  sourceChain: ChainId;
  destChain: ChainId;
  token: string;
  amount: string;
  recipientAddress: string;
  senderAddress: string;
}

export interface BridgeResult {
  success: boolean;
  nonce: number;
  txHash: string;
  estimatedTime: string;
  error?: string;
}

export interface BridgeStatus {
  nonce: number;
  status: "pending" | "confirming" | "attesting" | "minting" | "complete" | "failed";
  sourceChain: ChainId;
  destChain: ChainId;
  token: string;
  amount: string;
  sourceTxHash?: string;
  destTxHash?: string;
  guardianSignatures: number;
  requiredSignatures: number;
  createdAt: number;
  completedAt?: number;
}

// ---------------------------------------------------------------------------
// Bridge Program IDs
// ---------------------------------------------------------------------------

const BRIDGE_PROGRAMS: Record<string, string> = {
  ethereum: "EthBrdg11111111111111111111111111111111111",
  bitcoin: "BtcBrdg11111111111111111111111111111111111",
  solana: "SolBrdg11111111111111111111111111111111111",
};

// ---------------------------------------------------------------------------
// Bridge Client
// ---------------------------------------------------------------------------

export class BridgeClient {
  private prismRpc: string;

  constructor(prismRpc: string = "http://localhost:8899") {
    this.prismRpc = prismRpc;
  }

  /**
   * Determine which bridge program to use based on the source/dest chain pair.
   * One side must always be Prism.
   */
  private resolveBridgeProgram(source: ChainId, dest: ChainId): string {
    const otherChain = source === "prism" ? dest : source;

    const programId = BRIDGE_PROGRAMS[otherChain];
    if (!programId) {
      throw new Error(`No bridge program for chain: ${otherChain}`);
    }
    return programId;
  }

  /**
   * Initiate a bridge transfer.
   */
  async bridge(request: BridgeRequest): Promise<BridgeResult> {
    // Validate that one side is Prism
    if (request.sourceChain !== "prism" && request.destChain !== "prism") {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: "One side of the bridge must be Prism",
      };
    }

    if (request.sourceChain === request.destChain) {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: "Source and destination chains must be different",
      };
    }

    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: "Invalid amount",
      };
    }

    const programId = this.resolveBridgeProgram(
      request.sourceChain,
      request.destChain
    );

    console.log(`[BridgeClient] Using bridge program: ${programId}`);
    console.log(`[BridgeClient] Route: ${request.sourceChain} -> ${request.destChain}`);
    console.log(`[BridgeClient] Token: ${request.token}, Amount: ${request.amount}`);

    // Route to the appropriate bridge handler
    if (request.sourceChain === "prism") {
      return this.bridgeFromPrism(request, programId);
    } else {
      return this.bridgeToPrism(request, programId);
    }
  }

  /**
   * Bridge tokens FROM Prism to another chain.
   * This calls the appropriate program's lock/burn instruction.
   */
  private async bridgeFromPrism(
    request: BridgeRequest,
    programId: string
  ): Promise<BridgeResult> {
    const estimatedTimes: Record<ChainId, string> = {
      ethereum: "~15 minutes",
      bitcoin: "~60 minutes",
      solana: "~30 seconds",
      prism: "instant",
    };

    try {
      // In production: build and send the appropriate transaction
      // For Ethereum bridge: call Redeem (burn wrapped tokens)
      // For Bitcoin bridge: call RequestWithdrawal (burn scBTC)
      // For Solana bridge: call BurnAndRelease or LockToken

      console.log(`[BridgeClient] Initiating ${request.destChain} bridge-out from Prism`);

      // Mock successful result
      const mockNonce = Math.floor(Math.random() * 100000);
      const mockTxHash = generateMockTxHash(request.sourceChain);

      return {
        success: true,
        nonce: mockNonce,
        txHash: mockTxHash,
        estimatedTime: estimatedTimes[request.destChain],
      };
    } catch (err) {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: `Bridge-out failed: ${err}`,
      };
    }
  }

  /**
   * Bridge tokens TO Prism from another chain.
   * The user initiates on the source chain, then relayers handle the rest.
   */
  private async bridgeToPrism(
    request: BridgeRequest,
    programId: string
  ): Promise<BridgeResult> {
    const estimatedTimes: Record<ChainId, string> = {
      ethereum: "~15 minutes",
      bitcoin: "~60 minutes",
      solana: "~30 seconds",
      prism: "instant",
    };

    try {
      // In production:
      // For Ethereum: user calls deposit() on the Ethereum bridge contract
      // For Bitcoin: user sends BTC to the bridge multisig with OP_RETURN
      // For Solana: user calls lock on the Solana-side program

      console.log(`[BridgeClient] Initiating ${request.sourceChain} bridge-in to Prism`);

      const mockNonce = Math.floor(Math.random() * 100000);
      const mockTxHash = generateMockTxHash(request.sourceChain);

      return {
        success: true,
        nonce: mockNonce,
        txHash: mockTxHash,
        estimatedTime: estimatedTimes[request.sourceChain],
      };
    } catch (err) {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: `Bridge-in failed: ${err}`,
      };
    }
  }

  /**
   * Get the status of a bridge transfer by nonce.
   */
  async getStatus(nonce: number, sourceChain: ChainId, destChain: ChainId): Promise<BridgeStatus> {
    const programId = this.resolveBridgeProgram(sourceChain, destChain);

    // In production: read the TransferRecord/BridgeTransaction PDA on Prism
    console.log(`[BridgeClient] Checking status for nonce ${nonce} on program ${programId}`);

    // Mock status
    return {
      nonce,
      status: "confirming",
      sourceChain,
      destChain,
      token: "ETH",
      amount: "1.0",
      sourceTxHash: generateMockTxHash(sourceChain),
      guardianSignatures: 1,
      requiredSignatures: 3,
      createdAt: Date.now() - 60000,
    };
  }

  /**
   * Get supported tokens for a chain pair.
   */
  getSupportedTokens(source: ChainId, dest: ChainId): string[] {
    const tokensByPair: Record<string, string[]> = {
      "ethereum-prism": ["ETH", "WBTC", "USDC", "USDT"],
      "prism-ethereum": ["scETH", "WBTC", "USDC", "USDT"],
      "bitcoin-prism": ["BTC"],
      "prism-bitcoin": ["scBTC"],
      "solana-prism": ["SOL", "USDC", "USDT"],
      "prism-solana": ["SOL", "USDC", "USDT"],
    };

    return tokensByPair[`${source}-${dest}`] || [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateMockTxHash(chain: ChainId): string {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }

  if (chain === "ethereum") return `0x${hash}`;
  if (chain === "bitcoin") return hash;
  // Solana/Prism use base58, but hex is fine for mock
  return hash;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let clientInstance: BridgeClient | null = null;

export function getBridgeClient(rpc?: string): BridgeClient {
  if (!clientInstance) {
    clientInstance = new BridgeClient(rpc);
  }
  return clientInstance;
}
