"use client";

import { useState } from "react";
import SearchBar from "@/components/search-bar";
import QueryResultDisplay from "@/components/query-result";
import { QueryResult } from "@/lib/rpc-executor";

interface QueryEntry {
  query: string;
  result: QueryResult;
  timestamp: string;
}

export default function Home() {
  const [searching, setSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryEntry | null>(null);
  const [recentQueries, setRecentQueries] = useState<QueryEntry[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (query: string) => {
    setSearching(true);
    setError("");

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Could not understand query");
        setCurrentResult(null);
        return;
      }

      const entry: QueryEntry = {
        query,
        result: data.data,
        timestamp: new Date().toLocaleTimeString(),
      };

      setCurrentResult(entry);
      setRecentQueries((prev) => [entry, ...prev.filter((q) => q.query !== query)].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Explore the Blockchain
          </span>
        </h1>
        <p className="text-[#64748b] text-sm sm:text-base max-w-xl mx-auto">
          Ask questions in plain English. Query balances, blocks, validators, performance, and more.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} isSearching={searching} />

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center max-w-3xl mx-auto">
          {error}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-[#64748b]">Querying blockchain...</span>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 flex gap-8">
        {/* Results Area */}
        <div className="flex-1">
          {currentResult && !searching && (
            <QueryResultDisplay result={currentResult.result} query={currentResult.query} />
          )}

          {!currentResult && !searching && !error && (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-[#1e1e2e] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-[#64748b] text-sm">Type a query or click an example to get started</p>
            </div>
          )}
        </div>

        {/* Recent Queries Sidebar */}
        {recentQueries.length > 0 && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Recent Queries</h3>
            <div className="space-y-2">
              {recentQueries.map((entry, i) => (
                <button
                  key={`${entry.query}-${i}`}
                  onClick={() => handleSearch(entry.query)}
                  className="w-full text-left p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] hover:border-emerald-500/30 transition-all group"
                >
                  <p className="text-sm text-[#e2e8f0] group-hover:text-emerald-400 transition-colors truncate">
                    {entry.query}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#475569]">{entry.result.type}</span>
                    <span className="text-xs text-[#475569]">{entry.timestamp}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
