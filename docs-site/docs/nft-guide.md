---
sidebar_position: 7
---

# NFT Guide

SolClone includes a full NFT stack: the **Metaplex-compatible program library** for minting NFTs and the **SolMart marketplace** for listing, buying, and selling.

## Overview

| Component | Description |
|-----------|-------------|
| **Metaplex Programs** | On-chain NFT standard with metadata, collections, and royalties |
| **SolMart Marketplace** | Web-based marketplace for listing and trading NFTs |
| **NFT Collection Template** | Anchor template for custom NFT programs |

## Creating NFTs

### Using the SDK

```typescript
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solclone/web3.js';
import { Metaplex, keypairIdentity } from '@solclone/metaplex';

const connection = new Connection('http://localhost:8899');
const wallet = Keypair.generate();

// Fund the wallet
await connection.requestAirdrop(wallet.publicKey, 5 * LAMPORTS_PER_SOL);

// Initialize Metaplex
const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(wallet));
```

### Minting a Single NFT

```typescript
const { nft } = await metaplex.nfts().create({
  name: 'SolClone Genesis #1',
  symbol: 'SCG',
  uri: 'https://arweave.net/your-metadata-uri',
  sellerFeeBasisPoints: 500,  // 5% royalty
  maxSupply: 1,
});

console.log('NFT Mint:', nft.address.toBase58());
console.log('Metadata:', nft.uri);
```

### NFT Metadata Format

Host your metadata JSON at the URI specified during minting:

```json
{
  "name": "SolClone Genesis #1",
  "symbol": "SCG",
  "description": "The first NFT on the SolClone blockchain",
  "image": "https://arweave.net/your-image-uri",
  "attributes": [
    { "trait_type": "Background", "value": "Cosmic Purple" },
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Edition", "value": "Genesis" }
  ],
  "properties": {
    "files": [
      {
        "uri": "https://arweave.net/your-image-uri",
        "type": "image/png"
      }
    ],
    "creators": [
      {
        "address": "YOUR_WALLET_ADDRESS",
        "share": 100
      }
    ]
  }
}
```

## Creating Collections

### Create a Collection NFT

```typescript
const { nft: collectionNft } = await metaplex.nfts().create({
  name: 'SolClone Founders',
  symbol: 'SCF',
  uri: 'https://arweave.net/collection-metadata-uri',
  sellerFeeBasisPoints: 750,  // 7.5% royalty
  isCollection: true,
});

console.log('Collection:', collectionNft.address.toBase58());
```

### Mint NFTs into the Collection

```typescript
for (let i = 1; i <= 100; i++) {
  const { nft } = await metaplex.nfts().create({
    name: `Founder #${i}`,
    symbol: 'SCF',
    uri: `https://arweave.net/metadata/${i}.json`,
    sellerFeeBasisPoints: 750,
    collection: collectionNft.address,
  });

  // Verify the NFT as part of the collection
  await metaplex.nfts().verifyCollection({
    mintAddress: nft.address,
    collectionMintAddress: collectionNft.address,
  });

  console.log(`Minted Founder #${i}:`, nft.address.toBase58());
}
```

### Using the Anchor Template

For custom NFT logic, use the built-in template:

```bash
solclone init my-nft-project --template nft
cd my-nft-project
anchor build
anchor test
```

The template provides `create_collection`, `mint_nft`, and `transfer_nft` instructions with full royalty support.

## SolMart Marketplace

SolMart is the built-in NFT marketplace for SolClone. Access it at [http://localhost:3001](http://localhost:3001) when running the full stack.

### Listing an NFT for Sale

```typescript
import { SolMart } from '@solclone/marketplace';

const marketplace = new SolMart(connection, wallet);

// List an NFT
const listing = await marketplace.list({
  nftMint: nftMintAddress,
  price: 2.5 * LAMPORTS_PER_SOL,  // 2.5 SOL
});

console.log('Listed at:', listing.price / LAMPORTS_PER_SOL, 'SOL');
console.log('Listing ID:', listing.address);
```

### Buying an NFT

```typescript
// Buy a listed NFT
const purchase = await marketplace.buy({
  listing: listingAddress,
});

console.log('Purchased NFT:', purchase.nftMint);
console.log('Price paid:', purchase.price / LAMPORTS_PER_SOL, 'SOL');
console.log('Royalty paid:', purchase.royaltyPaid / LAMPORTS_PER_SOL, 'SOL');
```

### Cancelling a Listing

```typescript
await marketplace.cancelListing({
  listing: listingAddress,
});
```

### Browsing Listings

```typescript
// Get all active listings
const listings = await marketplace.getActiveListings();
for (const listing of listings) {
  console.log(`${listing.name} - ${listing.price / LAMPORTS_PER_SOL} SOL`);
}

// Get listings by collection
const collectionListings = await marketplace.getListingsByCollection(
  collectionAddress
);

// Get listings by seller
const myListings = await marketplace.getListingsBySeller(
  wallet.publicKey
);
```

### Making Offers

```typescript
// Make an offer on an NFT
const offer = await marketplace.makeOffer({
  nftMint: nftMintAddress,
  price: 1.8 * LAMPORTS_PER_SOL,
  expiry: Math.floor(Date.now() / 1000) + 86400,  // 24h
});

// Accept an offer (as the NFT owner)
await marketplace.acceptOffer({
  offer: offerAddress,
});
```

## Royalty Enforcement

SolClone NFTs enforce royalties at the protocol level:

- Royalties are set during minting (`sellerFeeBasisPoints`)
- Marketplace sales automatically distribute royalties to creators
- Royalty percentages are stored on-chain and cannot be bypassed
- Supports multiple creators with configurable share splits

## CLI Commands

```bash
# Mint an NFT
solclone nft mint --name "My NFT" --uri "https://metadata-uri" --royalty 500

# List on marketplace
solclone nft list --mint <NFT_MINT> --price 2.5

# View your NFTs
solclone nft list-owned

# Transfer an NFT
solclone nft transfer --mint <NFT_MINT> --to <RECIPIENT>
```

## Next Steps

- [Anchor Guide](./anchor-guide) -- customize NFT logic with the template
- [DeFi Guide](./defi-guide) -- use NFTs as collateral in SolLend
- [SDK Guide](./sdk-guide) -- full TypeScript SDK reference
