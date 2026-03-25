"use client";

import { GeneratedNFT } from "@/lib/metadata-builder";

interface NFTGalleryProps {
  nfts: GeneratedNFT[];
  onSelect: (nft: GeneratedNFT) => void;
}

export default function NFTGallery({ nfts, onSelect }: NFTGalleryProps) {
  if (nfts.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-4">
        Gallery ({nfts.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {nfts.map((nft) => (
          <button
            key={nft.id}
            onClick={() => onSelect(nft)}
            className="group relative rounded-xl overflow-hidden border border-[#1e1e2e] hover:border-purple-500/30 transition-all hover:scale-105"
          >
            <div className="aspect-square"
              style={{
                background: `linear-gradient(135deg, ${nft.gradientColors[0]}20, ${nft.gradientColors[1]}15, ${nft.gradientColors[2]}20)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nft.imageUrl}
                alt={nft.metadata.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-[#0a0a0f] to-transparent">
              <p className="text-xs font-medium text-[#e2e8f0] truncate">{nft.metadata.name}</p>
              <p className="text-[10px] text-[#64748b]">{nft.style}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
