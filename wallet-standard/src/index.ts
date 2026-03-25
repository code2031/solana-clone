/**
 * @prism/wallet-standard
 *
 * Solana Wallet Standard implementation for Prism.
 * Enables bidirectional wallet interoperability:
 *   - Third-party wallets (Phantom, Solflare, Backpack, ...) can connect to Prism DApps.
 *   - Prism's own wallet can connect to external Solana DApps.
 */

// Wallet implementation
export { PrismWallet, PrismWalletAccount } from "./wallet";
export type { KeypairProvider, TransactionSender } from "./wallet";

// Registration
export {
  registerPrismWallet,
  registerPrismWalletGlobally,
} from "./register";

// Feature constants
export {
  PrismConnect,
  PrismDisconnect,
  PrismEvents,
  PrismSignTransaction,
  PrismSignAndSendTransaction,
  PrismSignMessage,
  PRISM_FEATURES,
  ALL_FEATURES,
} from "./features";
export type { PrismFeature } from "./features";

// Wallet detection
export { detectWallets, onWalletRegistered } from "./detect";
export type { DetectedWallet, DetectWalletsOptions } from "./detect";

// Wallet adapter bridge
export {
  PrismWalletAdapter,
  createPrismAdapter,
} from "./adapter";
export type { WalletAdapterInterface } from "./adapter";
