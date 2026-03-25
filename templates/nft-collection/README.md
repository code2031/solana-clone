# Prism NFT Collection Template

An Anchor-based NFT collection program for the Prism blockchain. Supports creating collections, minting NFTs with metadata and royalties, and transferring ownership.

## Features

- **create_collection** - Create a new NFT collection with name, symbol, URI, and royalty percentage
- **mint_nft** - Mint an NFT into a collection with individual name, URI, and royalty settings
- **transfer_nft** - Transfer NFT ownership (respects frozen state)

## Usage

```bash
# Initialize from template
prism init my-nft-project --template nft

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

## Account Structure

- `Collection` - Stores collection metadata, authority, item count
  - PDA seeds: `["collection", authority, name]`
- `NftMetadata` - Per-NFT metadata including owner, creator, royalty info
  - PDA seeds: `["nft", collection_key, token_id]`

## Error Handling

| Error | Description |
|-------|-------------|
| `NameTooLong` | Name exceeds 32 characters |
| `SymbolTooLong` | Symbol exceeds 10 characters |
| `UriTooLong` | URI exceeds 200 characters |
| `InvalidRoyalty` | Royalty bps must be 0-10000 |
| `Unauthorized` | Signer is not collection authority |
| `NotOwner` | Signer does not own the NFT |
| `NftFrozen` | Cannot transfer a frozen NFT |
