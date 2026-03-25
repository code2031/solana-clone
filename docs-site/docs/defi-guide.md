---
sidebar_position: 6
---

# DeFi Guide

Prism ships with a complete DeFi suite: **SolSwap** (AMM/DEX), **SolLend** (lending protocol), and **SCUSD** (algorithmic stablecoin). This guide covers how to use each protocol.

## Overview

| Protocol | Type | Description |
|----------|------|-------------|
| **SolSwap** | AMM DEX | Constant-product automated market maker (x*y=k) |
| **SolLend** | Lending | Supply and borrow tokens with dynamic interest rates |
| **SCUSD** | Stablecoin | Algorithmic stablecoin pegged to $1 USD |

## SolSwap (Decentralized Exchange)

SolSwap implements a Uniswap-style constant product AMM for token swaps.

### Creating a Liquidity Pool

```typescript
import { SolSwap } from '@prism/defi';

const swap = new SolSwap(connection, wallet);

// Create a new pool with initial liquidity
const pool = await swap.createPool({
  tokenA: mintA,           // Token A mint address
  tokenB: mintB,           // Token B mint address
  initialAmountA: 10000,   // Initial token A deposit
  initialAmountB: 50000,   // Initial token B deposit
  feeBps: 30,              // 0.3% swap fee
});

console.log('Pool created:', pool.address);
```

### Swapping Tokens

```typescript
// Swap token A for token B
const result = await swap.swap({
  pool: poolAddress,
  inputMint: mintA,
  inputAmount: 100,
  minimumOutputAmount: 480,  // Slippage protection
});

console.log('Received:', result.outputAmount, 'Token B');
console.log('Price impact:', result.priceImpact, '%');
```

### Adding/Removing Liquidity

```typescript
// Add liquidity (proportional deposit)
await swap.addLiquidity({
  pool: poolAddress,
  amountA: 1000,
  amountB: 5000,
});

// Remove liquidity
await swap.removeLiquidity({
  pool: poolAddress,
  lpTokenAmount: 500,      // LP tokens to burn
  minimumAmountA: 900,     // Minimum token A to receive
  minimumAmountB: 4500,    // Minimum token B to receive
});
```

### Querying Pool State

```typescript
const poolInfo = await swap.getPool(poolAddress);
console.log('Token A reserve:', poolInfo.reserveA);
console.log('Token B reserve:', poolInfo.reserveB);
console.log('LP token supply:', poolInfo.lpSupply);
console.log('Current price:', poolInfo.reserveB / poolInfo.reserveA);
```

## SolLend (Lending Protocol)

SolLend enables supplying tokens to earn interest and borrowing against collateral.

### Supplying Tokens

```typescript
import { SolLend } from '@prism/defi';

const lend = new SolLend(connection, wallet);

// Supply SOL as collateral
const receipt = await lend.supply({
  mint: SOL_MINT,
  amount: 10 * LAMPORTS_PER_SOL,
});

console.log('Supplied:', receipt.amount, 'SOL');
console.log('Current APY:', receipt.supplyApy, '%');
```

### Borrowing Tokens

```typescript
// Borrow SCUSD against SOL collateral
const loan = await lend.borrow({
  mint: SCUSD_MINT,
  amount: 500_000_000,     // 500 SCUSD
});

console.log('Borrowed:', loan.amount);
console.log('Borrow APY:', loan.borrowApy, '%');
console.log('Health factor:', loan.healthFactor);
```

### Repaying Loans

```typescript
// Repay borrowed tokens
await lend.repay({
  mint: SCUSD_MINT,
  amount: 250_000_000,     // Partial repayment
});
```

### Checking Positions

```typescript
const position = await lend.getPosition(wallet.publicKey);
console.log('Total supplied:', position.totalSupplied);
console.log('Total borrowed:', position.totalBorrowed);
console.log('Health factor:', position.healthFactor);
console.log('Liquidation threshold:', position.liquidationThreshold);
```

### Interest Rate Model

SolLend uses a dual-slope interest rate model:

| Utilization | Borrow Rate |
|-------------|-------------|
| 0-80% | Base rate + utilization * slope1 |
| 80-100% | Accelerated rate (slope2) to incentivize repayment |

## SCUSD (Stablecoin)

SCUSD is an algorithmic stablecoin that maintains its peg through overcollateralization and liquidation mechanisms.

### Minting SCUSD

```typescript
import { SCUSD } from '@prism/defi';

const stablecoin = new SCUSD(connection, wallet);

// Deposit collateral and mint SCUSD
const vault = await stablecoin.openVault({
  collateralMint: SOL_MINT,
  collateralAmount: 5 * LAMPORTS_PER_SOL,
  mintAmount: 200_000_000,  // 200 SCUSD
});

console.log('Vault opened:', vault.address);
console.log('Collateral ratio:', vault.collateralRatio, '%');
```

### Managing Vaults

```typescript
// Add more collateral
await stablecoin.addCollateral({
  vault: vaultAddress,
  amount: 2 * LAMPORTS_PER_SOL,
});

// Mint more SCUSD (if collateral ratio allows)
await stablecoin.mintMore({
  vault: vaultAddress,
  amount: 50_000_000,
});

// Repay SCUSD and withdraw collateral
await stablecoin.repayAndWithdraw({
  vault: vaultAddress,
  repayAmount: 100_000_000,
  withdrawAmount: 1 * LAMPORTS_PER_SOL,
});
```

### Liquidation

Vaults below the minimum collateral ratio (150%) can be liquidated:

```typescript
// Check if a vault is liquidatable
const vaultInfo = await stablecoin.getVault(vaultAddress);
if (vaultInfo.collateralRatio < 150) {
  // Liquidate the vault (anyone can call this)
  await stablecoin.liquidate({
    vault: vaultAddress,
    repayAmount: vaultInfo.debt / 2,  // Liquidate up to 50%
  });
}
```

## CLI Access

All DeFi operations are also available via the CLI:

```bash
# SolSwap
prism swap create-pool --token-a <MINT> --token-b <MINT> --amount-a 10000 --amount-b 50000
prism swap trade --pool <POOL> --input-mint <MINT> --amount 100

# SolLend
prism lend supply --mint <MINT> --amount 10
prism lend borrow --mint <MINT> --amount 500

# SCUSD
prism stablecoin mint --collateral 5 --amount 200
prism stablecoin repay --vault <VAULT> --amount 100
```

## Next Steps

- [NFT Guide](./nft-guide) -- create and trade NFTs on SolMart
- [SDK Guide](./sdk-guide) -- full SDK reference
- [Anchor Guide](./anchor-guide) -- build your own DeFi programs
