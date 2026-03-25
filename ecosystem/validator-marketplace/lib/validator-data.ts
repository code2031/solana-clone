export interface ValidatorInfo {
  id: string;
  name: string;
  identity: string;
  voteAccount: string;
  totalStake: number;
  commission: number;
  apy: number;
  uptime: number;
  skipRate: number;
  version: string;
  delegators: number;
  apyHistory: { epoch: number; apy: number }[];
  stakeHistory: { epoch: number; stake: number }[];
  commissionHistory: { epoch: number; commission: number }[];
  datacenter: string;
}

/**
 * Fetch validator data from the RPC getVoteAccounts endpoint.
 * In production this would call the real RPC; here we return mock data.
 */
export async function fetchValidators(): Promise<ValidatorInfo[]> {
  return MOCK_VALIDATORS;
}

/**
 * Calculate estimated APY from commission, epoch duration and inflation rate.
 */
export function calculateEstimatedAPY(
  commission: number,
  inflationRate: number = 0.065
): number {
  const validatorShare = 1 - commission / 100;
  return inflationRate * validatorShare * 100;
}

/**
 * Format large SOL amounts for display.
 */
export function formatStake(lamports: number): string {
  if (lamports >= 1_000_000) return `${(lamports / 1_000_000).toFixed(2)}M`;
  if (lamports >= 1_000) return `${(lamports / 1_000).toFixed(1)}K`;
  return lamports.toFixed(2);
}

export const MOCK_VALIDATORS: ValidatorInfo[] = [
  {
    id: "v1",
    name: "Prism Foundation",
    identity: "SCFd1111111111111111111111111111111111111111",
    voteAccount: "SCFv1111111111111111111111111111111111111111",
    totalStake: 5_200_000,
    commission: 5,
    apy: 6.18,
    uptime: 99.97,
    skipRate: 0.12,
    version: "1.17.15",
    delegators: 1240,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 6.0 + Math.random() * 0.4 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 4_800_000 + i * 20_000 })),
    commissionHistory: [{ epoch: 390, commission: 7 }, { epoch: 400, commission: 5 }],
    datacenter: "US-East",
  },
  {
    id: "v2",
    name: "StakeSquad",
    identity: "SSqd1111111111111111111111111111111111111111",
    voteAccount: "SSqv1111111111111111111111111111111111111111",
    totalStake: 3_800_000,
    commission: 3,
    apy: 6.31,
    uptime: 99.95,
    skipRate: 0.18,
    version: "1.17.15",
    delegators: 890,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 6.1 + Math.random() * 0.4 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 3_500_000 + i * 15_000 })),
    commissionHistory: [{ epoch: 380, commission: 5 }, { epoch: 395, commission: 3 }],
    datacenter: "EU-West",
  },
  {
    id: "v3",
    name: "ValidatorOne",
    identity: "VOn1111111111111111111111111111111111111111e",
    voteAccount: "VOvt1111111111111111111111111111111111111111",
    totalStake: 2_100_000,
    commission: 8,
    apy: 5.98,
    uptime: 99.80,
    skipRate: 0.45,
    version: "1.17.14",
    delegators: 450,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 5.7 + Math.random() * 0.5 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 1_900_000 + i * 10_000 })),
    commissionHistory: [{ epoch: 370, commission: 10 }, { epoch: 400, commission: 8 }],
    datacenter: "AP-Southeast",
  },
  {
    id: "v4",
    name: "NodeNinja",
    identity: "NNja1111111111111111111111111111111111111111",
    voteAccount: "NNjv1111111111111111111111111111111111111111",
    totalStake: 1_500_000,
    commission: 2,
    apy: 6.37,
    uptime: 99.99,
    skipRate: 0.05,
    version: "1.17.15",
    delegators: 670,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 6.2 + Math.random() * 0.3 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 1_200_000 + i * 15_000 })),
    commissionHistory: [{ epoch: 400, commission: 2 }],
    datacenter: "US-West",
  },
  {
    id: "v5",
    name: "CryptoKeepers",
    identity: "CKpr1111111111111111111111111111111111111111",
    voteAccount: "CKpv1111111111111111111111111111111111111111",
    totalStake: 980_000,
    commission: 10,
    apy: 5.85,
    uptime: 99.60,
    skipRate: 0.72,
    version: "1.17.13",
    delegators: 210,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 5.5 + Math.random() * 0.6 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 900_000 + i * 4_000 })),
    commissionHistory: [{ epoch: 380, commission: 10 }],
    datacenter: "EU-Central",
  },
  {
    id: "v6",
    name: "BlockBuilders",
    identity: "BBld1111111111111111111111111111111111111111",
    voteAccount: "BBlv1111111111111111111111111111111111111111",
    totalStake: 4_100_000,
    commission: 4,
    apy: 6.24,
    uptime: 99.92,
    skipRate: 0.22,
    version: "1.17.15",
    delegators: 1050,
    apyHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, apy: 6.0 + Math.random() * 0.4 })),
    stakeHistory: Array.from({ length: 20 }, (_, i) => ({ epoch: 400 + i, stake: 3_700_000 + i * 20_000 })),
    commissionHistory: [{ epoch: 390, commission: 5 }, { epoch: 405, commission: 4 }],
    datacenter: "US-Central",
  },
];
