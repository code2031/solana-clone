"use client";

import { QueryResult } from "@/lib/rpc-executor";

interface QueryResultDisplayProps {
  result: QueryResult;
  query: string;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function formatLamports(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

function BalanceResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">SOL Balance</p>
          <p className="text-2xl font-bold text-emerald-400">{(data.sol as number).toFixed(4)} SOL</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">USD Value</p>
          <p className="text-2xl font-bold text-[#e2e8f0]">${data.usdValue as string}</p>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] mb-1">Address</p>
        <p className="text-sm font-mono text-[#94a3b8] break-all">{data.address as string}</p>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] mb-1">Lamports</p>
        <p className="text-sm font-mono text-[#94a3b8]">{(data.lamports as number).toLocaleString()}</p>
      </div>
    </div>
  );
}

function TransactionsResult({ data }: { data: Record<string, unknown> }) {
  const txs = data.transactions as Array<Record<string, unknown>>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-[#64748b]">Showing {txs.length} recent transactions</p>
      <div className="space-y-2">
        {txs.map((tx, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-emerald-400 truncate">{tx.signature as string}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                <span>Slot {(tx.slot as number).toLocaleString()}</span>
                <span>{formatTimestamp(tx.blockTime as number)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-[#e2e8f0]">{tx.amount as string} SOL</p>
              <span className={`text-xs px-1.5 py-0.5 rounded ${tx.status === "Success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {tx.status as string}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Slot</p>
          <p className="text-lg font-bold text-[#e2e8f0]">{(data.slot as number).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Transactions</p>
          <p className="text-lg font-bold text-emerald-400">{(data.transactions as number).toLocaleString()}</p>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] mb-1">Block Hash</p>
        <p className="text-sm font-mono text-[#94a3b8] break-all">{data.blockhash as string}</p>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] mb-1">Block Time</p>
        <p className="text-sm text-[#94a3b8]">{formatTimestamp(data.blockTime as number)}</p>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] mb-1">Parent Slot</p>
        <p className="text-sm font-mono text-[#94a3b8]">{(data.parentSlot as number).toLocaleString()}</p>
      </div>
    </div>
  );
}

function ValidatorsResult({ data }: { data: Record<string, unknown> }) {
  const validators = data.validators as Array<Record<string, unknown>>;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#64748b]">Showing top {data.showing as number} of {(data.totalValidators as number).toLocaleString()} validators</span>
        <span className="text-emerald-400 font-medium">Total Stake: {((data.totalStake as number) / 1e6).toFixed(1)}M SOL</span>
      </div>
      <div className="space-y-2">
        {validators.map((v, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">{v.name as string}</p>
              <p className="text-xs font-mono text-[#64748b] mt-0.5">{v.votePubkey as string}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-400 font-medium">{((v.stake as number) / 1e6).toFixed(2)}M SOL</p>
              <p className="text-xs text-[#64748b]">{v.commission as number}% commission</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceResult({ data }: { data: Record<string, unknown> }) {
  const samples = data.samples as Array<Record<string, unknown>>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Average TPS</p>
          <p className="text-2xl font-bold text-emerald-400">{(data.averageTps as number).toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Peak TPS</p>
          <p className="text-2xl font-bold text-[#e2e8f0]">{(data.peakTps as number).toLocaleString()}</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-[#64748b] uppercase">Recent Samples</p>
        {samples.map((s, i) => (
          <div key={i} className="p-2 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center justify-between text-sm">
            <span className="text-[#64748b] font-mono">Slot {(s.slot as number).toLocaleString()}</span>
            <span className="text-emerald-400 font-medium">{(s.tps as number).toLocaleString()} TPS</span>
            <span className="text-[#64748b]">{(s.numTransactions as number).toLocaleString()} txns</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EpochResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Epoch</p>
          <p className="text-xl font-bold text-emerald-400">{data.epoch as number}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Slot</p>
          <p className="text-xl font-bold text-[#e2e8f0]">{(data.absoluteSlot as number).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] uppercase mb-1">Progress</p>
          <p className="text-xl font-bold text-[#e2e8f0]">{data.epochProgress as string}%</p>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <div className="flex justify-between text-xs text-[#64748b] mb-2">
          <span>Epoch Progress</span>
          <span>{data.slotIndex as number} / {(data.slotsInEpoch as number).toLocaleString()}</span>
        </div>
        <div className="w-full h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
            style={{ width: `${data.epochProgress}%` }}
          />
        </div>
        <p className="text-xs text-[#64748b] mt-2">Est. remaining: {data.estimatedTimeRemaining as string}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] mb-1">Block Height</p>
          <p className="text-sm font-mono text-[#94a3b8]">{(data.blockHeight as number).toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] mb-1">Total Transactions</p>
          <p className="text-sm font-mono text-[#94a3b8]">{(data.transactionCount as number).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function GenericResult({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center justify-between">
          <span className="text-xs text-[#64748b] uppercase">{key.replace(/([A-Z])/g, " $1")}</span>
          <span className="text-sm font-mono text-[#e2e8f0]">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function QueryResultDisplay({ result, query }: QueryResultDisplayProps) {
  const renderResult = () => {
    switch (result.type) {
      case "balance":
        return <BalanceResult data={result.data} />;
      case "transactions":
        return <TransactionsResult data={result.data} />;
      case "block":
        return <BlockResult data={result.data} />;
      case "validators":
        return <ValidatorsResult data={result.data} />;
      case "performance":
        return <PerformanceResult data={result.data} />;
      case "epoch":
        return <EpochResult data={result.data} />;
      case "error":
        return (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {result.data.message as string}
          </div>
        );
      default:
        return <GenericResult data={result.data} />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#e2e8f0]">{result.title}</h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Query: &quot;{query}&quot; &rarr; {result.rpcMethod}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {result.type}
        </span>
      </div>
      {renderResult()}
    </div>
  );
}
