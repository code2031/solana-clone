"use client";

import { GeneratedNFT } from "@/lib/metadata-builder";

interface PreviewPanelProps {
  nft: GeneratedNFT | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  onMint: () => void;
}

export default function PreviewPanel({ nft, isGenerating, onRegenerate, onMint }: PreviewPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="relative w-64 h-64 rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 animated-gradient" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-xs text-[#64748b]">Creating your masterpiece...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-64 h-64 rounded-2xl bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center mb-6">
          <div className="text-center">
            <svg className="w-16 h-16 text-[#1e1e2e] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-[#475569]">Your NFT preview will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-5">
      {/* Image Preview */}
      <div className="relative group">
        <div className="w-72 h-72 rounded-2xl overflow-hidden border border-[#1e1e2e] shadow-2xl">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${nft.gradientColors[0]}15, ${nft.gradientColors[1]}10, ${nft.gradientColors[2]}15)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nft.imageUrl}
              alt={nft.metadata.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${nft.gradientColors[0]}, ${nft.gradientColors[2]})`,
            color: "white",
          }}
        >
          {nft.style}
        </div>
      </div>

      {/* NFT Info */}
      <div className="w-full max-w-sm space-y-3">
        <div>
          <h3 className="text-lg font-bold text-[#e2e8f0]">{nft.metadata.name}</h3>
          <p className="text-xs text-[#64748b] mt-1 line-clamp-2">{nft.prompt}</p>
        </div>

        {/* Metadata Preview */}
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] space-y-2">
          <p className="text-xs text-[#64748b] uppercase tracking-wide font-medium">Metadata</p>
          <div className="space-y-1">
            {nft.metadata.attributes.slice(0, 3).map((attr) => (
              <div key={attr.trait_type} className="flex justify-between text-xs">
                <span className="text-[#64748b]">{attr.trait_type}</span>
                <span className="text-[#94a3b8] truncate ml-4 max-w-[180px]">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRegenerate}
            className="flex-1 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-purple-500/30 text-[#94a3b8] hover:text-purple-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>
          <button
            onClick={onMint}
            className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 hover:from-pink-500 hover:via-purple-500 hover:to-orange-400 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mint as NFT
          </button>
        </div>
      </div>
    </div>
  );
}
