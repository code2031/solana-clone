/**
 * SolClone Bridge Client
 *
 * Unified client that routes bridge operations to the appropriate
 * bridge program based on the source and destination chain selection.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChainId = "ethereum" | "bitcoin" | "solana" | "solclone";

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
  private solcloneRpc: string;

  constructor(solcloneRpc: string = "http://localhost:8899") {
    this.solcloneRpc = solcloneRpc;
  }

  /**
   * Determine which bridge program to use based on the source/dest chain pair.
   * One side must always be SolClone.
   */
  private resolveBridgeProgram(source: ChainId, dest: ChainId): string {
    const otherChain = source === "solclone" ? dest : source;

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
    // Validate that one side is SolClone
    if (request.sourceChain !== "solclone" && request.destChain !== "solclone") {
      return {
        success: false,
        nonce: 0,
        txHash: "",
        estimatedTime: "",
        error: "One side of the bridge must be SolClone",
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
    if (request.sourceChain === "solclone") {
      return this.bridgeFromSolClone(request, programId);
    } else {
      return this.bridgeToSolClone(request, programId);
    }
  }

  /**
   * Bridge tokens FROM SolClone to another chain.
   * This calls the appropriate program's lock/burn instruction.
   */
  private async bridgeFromSolClone(
    request: BridgeRequest,
    programId: string
  ): Promise<BridgeResult> {
    const estimatedTimes: Record<ChainId, string> = {
      ethereum: "~15 minutes",
      bitcoin: "~60 minutes",
      solana: "~30 seconds",
      solclone: "instant",
    };

    try {
      // In production: build and send the appropriate transaction
      // For Ethereum bridge: call Redeem (burn wrapped tokens)
      // For Bitcoin bridge: call RequestWithdrawal (burn scBTC)
      // For Solana bridge: call BurnAndRelease or LockToken

      console.log(`[BridgeClient] Initiating ${request.destChain} bridge-out from SolClone`);

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
   * Bridge tokens TO SolClone from another chain.
   * The user initiates on the source chain, then relayers handle the rest.
   */
  private async bridgeToSolClone(
    request: BridgeRequest,
    programId: string
  ): Promise<BridgeResult> {
    const estimatedTimes: Record<ChainId, string> = {
      ethereum: "~15 minutes",
      bitcoin: "~60 minutes",
      solana: "~30 seconds",
      solclone: "instant",
    };

    try {
      // In production:
      // For Ethereum: user calls deposit() on the Ethereum bridge contract
      // For Bitcoin: user sends BTC to the bridge multisig with OP_RETURN
      // For Solana: user calls lock on the Solana-side program

      console.log(`[BridgeClient] Initiating ${request.sourceChain} bridge-in to SolClone`);

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

    // In production: read the TransferRecord/BridgeTransaction PDA on SolClone
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
      "ethereum-solclone": ["ETH", "WBTC", "USDC", "USDT"],
      "solclone-ethereum": ["scETH", "WBTC", "USDC", "USDT"],
      "bitcoin-solclone": ["BTC"],
      "solclone-bitcoin": ["scBTC"],
      "solana-solclone": ["SOL", "USDC", "USDT"],
      "solclone-solana": ["SOL", "USDC", "USDT"],
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
  // Solana/SolClone use base58, but hex is fine for mock
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
