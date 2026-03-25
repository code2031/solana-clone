"use client";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const STYLES = [
  { id: "pixel-art", label: "Pixel Art", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" },
  { id: "watercolor", label: "Watercolor", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { id: "3d", label: "3D Render", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
  { id: "anime", label: "Anime", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "abstract", label: "Abstract", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
];

const EXAMPLE_PROMPTS = [
  "Cosmic dragon flying through a nebula of stars",
  "Cyberpunk samurai standing in a neon-lit rainy city",
  "Crystal fortress floating on a mystical island",
  "Ancient tree with glowing bioluminescent leaves",
  "Mechanical phoenix made of golden clockwork gears",
];

export default function PromptInput({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  style,
  onStyleChange,
  onGenerate,
  isGenerating,
}: PromptInputProps) {
  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-[#e2e8f0] mb-2">
          Describe your NFT
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="A majestic dragon soaring through a cosmic nebula..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 bg-[#12121a] border border-[#1e1e2e] rounded-xl text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 text-sm resize-none transition-all"
          disabled={isGenerating}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[#475569]">{prompt.length}/500</span>
          <button
            type="button"
            onClick={() => {
              const random = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
              onPromptChange(random);
            }}
            className="text-xs text-[#64748b] hover:text-purple-400 transition-colors"
          >
            Random prompt
          </button>
        </div>
      </div>

      {/* Negative Prompt */}
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1.5">
          Negative prompt <span className="text-[#475569]">(optional)</span>
        </label>
        <input
          type="text"
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          placeholder="blurry, low quality, distorted..."
          className="w-full px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-purple-500/50 text-sm transition-all"
          disabled={isGenerating}
        />
      </div>

      {/* Style Selector */}
      <div>
        <label className="block text-sm font-medium text-[#e2e8f0] mb-2">
          Style
        </label>
        <div className="grid grid-cols-5 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStyleChange(s.id)}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                style === s.id
                  ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                  : "border-[#1e1e2e] bg-[#12121a] text-[#64748b] hover:border-[#2e2e3e] hover:text-[#94a3b8]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
              </svg>
              <span className="text-[10px] font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 hover:from-pink-500 hover:via-purple-500 hover:to-orange-400 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate NFT
          </>
        )}
      </button>
    </div>
  );
}
