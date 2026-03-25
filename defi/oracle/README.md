# Prism Price Oracle

> Decentralized price feeds with multi-publisher aggregation for the Prism DeFi ecosystem.

Part of the [Prism DeFi Suite](../README.md) | [Prism](https://github.com/code2031/solana-clone)

---

## Overview

The Prism Price Oracle provides reliable on-chain price data for DeFi protocols.
Multiple authorized publishers submit price updates, and the program aggregates them
using a weighted median to produce a single canonical price per feed. Staleness
protection ensures consumers never read outdated data.

## Features

- **Multi-Publisher Feeds** -- Multiple independent publishers submit prices per feed
- **Median Aggregation** -- Weighted median filters outliers and manipulation attempts
- **Staleness Protection** -- Feeds expose a timestamp; consumers can reject stale data
- **Confidence Intervals** -- Each price includes a confidence band for risk assessment
- **Permissioned Publishers** -- Feed authority controls which publishers can update
- **On-Chain Consumption** -- Other programs read price data via CPI or account deserialization

## Feed Lifecycle

1. **Create Feed** -- Authority initializes a feed account for a price pair (e.g., PRISM/USD)
2. **Add Publishers** -- Authority registers publisher public keys for the feed
3. **Publish Prices** -- Publishers submit price, confidence, and timestamp
4. **Aggregate** -- Program computes weighted median across all recent submissions
5. **Consume** -- DeFi programs read the aggregated price from the feed account

## Key Parameters

| Parameter | Value |
|---|---|
| Minimum Publishers | 3 per feed |
| Staleness Threshold | 30 seconds (configurable per feed) |
| Aggregation Method | Stake-weighted median |
| Max Confidence Band | 5% of price |
| Update Cooldown | 400ms per publisher per feed |

## Quick Start

Build the on-chain program:

```bash
cargo build-bpf
```

Run the oracle dashboard:

```bash
cd app
npm install
npm run dev
```

The oracle dashboard will be available at `http://localhost:3003`.

## Program Instructions

| Instruction | Description |
|---|---|
| `create_feed` | Initialize a new price feed account |
| `add_publisher` | Authorize a publisher for a feed |
| `remove_publisher` | Revoke a publisher from a feed |
| `publish_price` | Submit a price update from an authorized publisher |
| `aggregate` | Trigger median aggregation (called automatically) |

## Consuming Prices

```rust
let feed_account = next_account_info(accounts_iter)?;
let feed_data = PriceFeed::try_from_slice(&feed_account.data.borrow())?;
let price = feed_data.aggregate_price;
let staleness = clock.unix_timestamp - feed_data.last_update_timestamp;
require!(staleness < MAX_STALENESS, OracleError::StalePrice);
```

## License

Apache 2.0 -- see the root [LICENSE](../../LICENSE) file.
