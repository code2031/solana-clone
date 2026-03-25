/**
 * @prism/connect-kit
 *
 * React component library for adding wallet connections to Prism DApps.
 * Drop-in components and hooks for wallet connect, disconnect, sign, and send.
 */

// Provider
export { PrismProvider, usePrismContext } from "./PrismProvider";
export type {
  PrismProviderProps,
  PrismContextValue,
  PrismNetwork,
} from "./PrismProvider";

// Components
export { ConnectButton } from "./ConnectButton";
export type { ConnectButtonProps } from "./ConnectButton";

export { WalletModal } from "./WalletModal";
export type { WalletModalProps } from "./WalletModal";

// Hooks
export { useWallet } from "./useWallet";
export type { UseWalletReturn } from "./useWallet";

export { usePrism } from "./usePrism";
export type {
  UsePrismReturn,
  PrismNetwork as PrismNetworkType,
  TokenAccount,
} from "./usePrism";
