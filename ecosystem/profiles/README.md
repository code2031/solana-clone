# SolClone On-Chain Profiles

Decentralized identity profiles stored on-chain for the SolClone ecosystem.

## Overview

The Profiles program allows any wallet holder to create, update, and delete a public profile that is stored directly on-chain as a Program Derived Address (PDA). This provides a permissionless identity layer for the entire SolClone ecosystem, enabling display names, avatars, and bios to be attached to wallet addresses.

## Architecture

### Program (Rust / Solana BPF)

Located in `program/src/lib.rs`.

**Profile Account (PDA)**

Each profile is derived from `["profile", owner_pubkey]` ensuring one profile per wallet.

| Field          | Type      | Size    | Description                     |
|----------------|-----------|---------|---------------------------------|
| discriminator  | `[u8; 8]` | 8 bytes | Account type identifier         |
| owner          | `Pubkey`  | 32 bytes| Wallet that owns this profile   |
| display_name   | `String`  | 4 + 32  | Human-readable display name     |
| avatar_url     | `String`  | 4 + 128 | URL to avatar image             |
| bio            | `String`  | 4 + 256 | Short biography / description   |
| created_at     | `i64`     | 8 bytes | Unix timestamp of creation      |
| updated_at     | `i64`     | 8 bytes | Unix timestamp of last update   |
| bump           | `u8`      | 1 byte  | PDA bump seed                   |

**Instructions**

| Instruction      | Description                                    |
|------------------|------------------------------------------------|
| `CreateProfile`  | Create a profile PDA from the signer's wallet  |
| `UpdateProfile`  | Update display name, avatar URL, and/or bio    |
| `DeleteProfile`  | Close the profile account and reclaim rent     |

### Integration

Other programs in the SolClone ecosystem can perform CPI calls to resolve a wallet's profile by deriving the PDA with `["profile", wallet_pubkey]` and reading the account data.

## Building

```bash
cd program
cargo build-bpf
```

## Testing

```bash
cd program
cargo test
```

## Field Limits

- Display name: 32 bytes max
- Avatar URL: 128 bytes max
- Bio: 256 bytes max

## License

MIT
