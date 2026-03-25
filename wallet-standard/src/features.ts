/**
 * Prism Wallet Standard Feature Constants
 *
 * These feature identifiers are used to declare the capabilities
 * that the Prism wallet supports. DApps query these features
 * to determine what operations they can request from the wallet.
 */

// ── Standard Solana Features ────────────────────────────────────────────────

/** Feature identifier for the connect capability. */
export const PrismConnect = "standard:connect" as const;

/** Feature identifier for the disconnect capability. */
export const PrismDisconnect = "standard:disconnect" as const;

/** Feature identifier for the events capability (state change notifications). */
export const PrismEvents = "standard:events" as const;

// ── Solana-Specific Features ────────────────────────────────────────────────

/** Feature identifier for signing a transaction without sending it. */
export const PrismSignTransaction = "solana:signTransaction" as const;

/** Feature identifier for signing and sending a transaction in one step. */
export const PrismSignAndSendTransaction = "solana:signAndSendTransaction" as const;

/** Feature identifier for signing an arbitrary message (off-chain). */
export const PrismSignMessage = "solana:signMessage" as const;

// ── Feature Type Map ────────────────────────────────────────────────────────

/**
 * All features supported by the Prism wallet, grouped by category.
 */
export const PRISM_FEATURES = {
  connect: PrismConnect,
  disconnect: PrismDisconnect,
  events: PrismEvents,
  signTransaction: PrismSignTransaction,
  signAndSendTransaction: PrismSignAndSendTransaction,
  signMessage: PrismSignMessage,
} as const;

/**
 * Array of all feature identifiers for easy iteration and registration.
 */
export const ALL_FEATURES = [
  PrismConnect,
  PrismDisconnect,
  PrismEvents,
  PrismSignTransaction,
  PrismSignAndSendTransaction,
  PrismSignMessage,
] as const;

/** Union type of all Prism feature identifiers. */
export type PrismFeature = (typeof ALL_FEATURES)[number];
