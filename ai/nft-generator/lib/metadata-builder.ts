export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface GeneratedNFT {
  id: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  metadata: NFTMetadata;
  imageUrl: string;
  createdAt: string;
  gradientColors: [string, string, string];
}

const STYLE_COLORS: Record<string, [string, string, string][]> = {
  "pixel-art": [
    ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    ["#f7dc6f", "#82e0aa", "#85c1e9"],
    ["#e74c3c", "#8e44ad", "#2980b9"],
  ],
  watercolor: [
    ["#a8dadc", "#457b9d", "#e63946"],
    ["#fca311", "#e5e5e5", "#14213d"],
    ["#606c38", "#283618", "#dda15e"],
  ],
  "3d": [
    ["#7400b8", "#6930c3", "#5390d9"],
    ["#ff006e", "#8338ec", "#3a86ff"],
    ["#fb5607", "#ff006e", "#8338ec"],
  ],
  anime: [
    ["#ff758f", "#ff7eb3", "#ffc3a0"],
    ["#667eea", "#764ba2", "#f093fb"],
    ["#a8edea", "#fed6e3", "#d299c2"],
  ],
  abstract: [
    ["#f72585", "#7209b7", "#3a0ca3"],
    ["#4cc9f0", "#4361ee", "#3a0ca3"],
    ["#f94144", "#f3722c", "#f9c74f"],
  ],
};

function generateName(prompt: string): string {
  const words = prompt.split(" ").filter((w) => w.length > 3).slice(0, 3);
  if (words.length === 0) return "Untitled #" + Math.floor(Math.random() * 9999);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function getColors(style: string, seed: number): [string, string, string] {
  const options = STYLE_COLORS[style] || STYLE_COLORS.abstract;
  return options[seed % options.length];
}

export function buildMetadata(
  prompt: string,
  style: string,
  negativePrompt?: string
): GeneratedNFT {
  const id = `nft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const seed = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const name = generateName(prompt);
  const gradientColors = getColors(style, seed);
  const imageUrl = `data:image/svg+xml,${encodeURIComponent(generatePlaceholderSvg(prompt, style, gradientColors))}`;

  const metadata: NFTMetadata = {
    name,
    symbol: "SCLNFT",
    description: `AI-generated NFT created with SolClone NFT Studio. Prompt: "${prompt}"${negativePrompt ? `. Negative: "${negativePrompt}"` : ""}`,
    image: imageUrl,
    external_url: "https://solclone.ai/nft-studio",
    attributes: [
      { trait_type: "Style", value: style },
      { trait_type: "Prompt", value: prompt },
      { trait_type: "Generator", value: "SolClone NFT Studio" },
      { trait_type: "Model", value: "Mock v1.0 (Placeholder)" },
      ...(negativePrompt ? [{ trait_type: "Negative Prompt", value: negativePrompt }] : []),
    ],
    properties: {
      files: [
        { uri: imageUrl, type: "image/svg+xml" },
      ],
      category: "image",
      creators: [
        { address: "SoLcLoNe1111111111111111111111111111111111", share: 100 },
      ],
    },
  };

  return {
    id,
    prompt,
    negativePrompt,
    style,
    metadata,
    imageUrl,
    createdAt: new Date().toISOString(),
    gradientColors,
  };
}

function generatePlaceholderSvg(prompt: string, style: string, colors: [string, string, string]): string {
  const displayPrompt = prompt.length > 60 ? prompt.slice(0, 57) + "..." : prompt;
  const styleLabel = style.replace("-", " ").toUpperCase();

  const patterns: Record<string, string> = {
    "pixel-art": `
      <rect x="40" y="40" width="20" height="20" fill="${colors[0]}" opacity="0.8"/>
      <rect x="60" y="40" width="20" height="20" fill="${colors[1]}" opacity="0.6"/>
      <rect x="80" y="40" width="20" height="20" fill="${colors[0]}" opacity="0.8"/>
      <rect x="40" y="60" width="20" height="20" fill="${colors[1]}" opacity="0.6"/>
      <rect x="60" y="60" width="20" height="20" fill="${colors[2]}" opacity="0.9"/>
      <rect x="80" y="60" width="20" height="20" fill="${colors[1]}" opacity="0.6"/>
      <rect x="40" y="80" width="20" height="20" fill="${colors[0]}" opacity="0.8"/>
      <rect x="60" y="80" width="20" height="20" fill="${colors[1]}" opacity="0.6"/>
      <rect x="80" y="80" width="20" height="20" fill="${colors[0]}" opacity="0.8"/>
    `,
    watercolor: `
      <circle cx="70" cy="65" r="35" fill="${colors[0]}" opacity="0.4"/>
      <circle cx="85" cy="75" r="30" fill="${colors[1]}" opacity="0.3"/>
      <circle cx="60" cy="80" r="25" fill="${colors[2]}" opacity="0.35"/>
      <ellipse cx="75" cy="70" rx="40" ry="25" fill="${colors[0]}" opacity="0.15"/>
    `,
    "3d": `
      <polygon points="75,35 105,55 105,85 75,105 45,85 45,55" fill="none" stroke="${colors[0]}" stroke-width="2" opacity="0.8"/>
      <polygon points="75,45 95,55 95,80 75,90 55,80 55,55" fill="${colors[1]}" opacity="0.3"/>
      <line x1="75" y1="35" x2="75" y2="105" stroke="${colors[2]}" stroke-width="1" opacity="0.5"/>
      <line x1="45" y1="55" x2="105" y2="85" stroke="${colors[2]}" stroke-width="1" opacity="0.5"/>
    `,
    anime: `
      <circle cx="65" cy="60" r="15" fill="${colors[0]}" opacity="0.5"/>
      <circle cx="85" cy="60" r="15" fill="${colors[1]}" opacity="0.5"/>
      <path d="M55 80 Q75 95 95 80" fill="none" stroke="${colors[2]}" stroke-width="2" opacity="0.7"/>
      <circle cx="65" cy="58" r="5" fill="white" opacity="0.8"/>
      <circle cx="85" cy="58" r="5" fill="white" opacity="0.8"/>
    `,
    abstract: `
      <path d="M30 90 Q50 30 75 70 Q100 110 120 50" fill="none" stroke="${colors[0]}" stroke-width="3" opacity="0.7"/>
      <circle cx="50" cy="50" r="20" fill="${colors[1]}" opacity="0.2"/>
      <circle cx="90" cy="70" r="15" fill="${colors[2]}" opacity="0.25"/>
      <path d="M40 70 L110 40" stroke="${colors[0]}" stroke-width="1.5" opacity="0.4"/>
    `,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 150 150">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:0.15"/>
        <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:0.1"/>
        <stop offset="100%" style="stop-color:${colors[2]};stop-opacity:0.15"/>
      </linearGradient>
    </defs>
    <rect width="150" height="150" fill="#0a0a0f"/>
    <rect width="150" height="150" fill="url(#bg)"/>
    ${patterns[style] || patterns.abstract}
    <text x="75" y="125" text-anchor="middle" fill="${colors[0]}" font-size="6" font-family="monospace" opacity="0.7">${styleLabel}</text>
    <text x="75" y="138" text-anchor="middle" fill="#64748b" font-size="4" font-family="sans-serif">${displayPrompt}</text>
  </svg>`;
}

// Mock gallery data
export const MOCK_GALLERY: GeneratedNFT[] = [
  buildMetadata("Cosmic dragon flying through nebula", "abstract"),
  buildMetadata("Cyberpunk samurai in neon city", "anime"),
  buildMetadata("Crystal fortress on floating island", "3d"),
  buildMetadata("Enchanted forest with glowing mushrooms", "watercolor"),
  buildMetadata("Retro space invader hero", "pixel-art"),
  buildMetadata("Golden phoenix rising from ashes", "abstract"),
];
