"use client";

import { useState } from "react";
import PromptInput from "@/components/prompt-input";
import PreviewPanel from "@/components/preview-panel";
import NFTGallery from "@/components/nft-gallery";
import { GeneratedNFT, MOCK_GALLERY } from "@/lib/metadata-builder";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("abstract");
  const [generating, setGenerating] = useState(false);
  const [currentNft, setCurrentNft] = useState<GeneratedNFT | null>(null);
  const [gallery, setGallery] = useState<GeneratedNFT[]>(MOCK_GALLERY);
  const [mintMessage, setMintMessage] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setMintMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, negativePrompt }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentNft(data.data);
        setGallery((prev) => [data.data, ...prev]);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleMint = () => {
    setMintMessage("Minting requires a connected wallet. This is a demo - connect a Solana wallet to mint on-chain.");
    setTimeout(() => setMintMessage(""), 5000);
  };

  const handleGallerySelect = (nft: GeneratedNFT) => {
    setCurrentNft(nft);
    setPrompt(nft.prompt);
    setStyle(nft.style);
    if (nft.negativePrompt) setNegativePrompt(nft.negativePrompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            AI NFT Generator
          </span>
        </h1>
        <p className="text-[#64748b] text-sm sm:text-base max-w-xl mx-auto">
          Describe your vision, choose a style, and generate unique NFT art. Mint directly to Solana.
        </p>
      </div>

      {/* Mint Toast */}
      {mintMessage && (
        <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm text-center max-w-2xl mx-auto">
          {mintMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#1e1e2e]">
          <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-4">Create</h2>
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            style={style}
            onStyleChange={setStyle}
            onGenerate={handleGenerate}
            isGenerating={generating}
          />
        </div>

        {/* Right: Preview */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#1e1e2e] min-h-[500px]">
          <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wide mb-4">Preview</h2>
          <PreviewPanel
            nft={currentNft}
            isGenerating={generating}
            onRegenerate={handleRegenerate}
            onMint={handleMint}
          />
        </div>
      </div>

      {/* Gallery */}
      <NFTGallery nfts={gallery} onSelect={handleGallerySelect} />
    </div>
  );
}
