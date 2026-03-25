"use client";

import { useState, useRef, useEffect } from "react";
import { EXAMPLE_QUERIES } from "@/lib/query-parser";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExamples(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSearching) {
      onSearch(query.trim());
      setShowExamples(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    onSearch(example);
  };

  return (
    <div className="w-full max-w-3xl mx-auto" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <svg className="absolute left-4 w-5 h-5 text-[#64748b] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            placeholder="Ask anything about the blockchain..."
            className="w-full pl-12 pr-28 py-4 bg-[#12121a] border border-[#1e1e2e] rounded-2xl text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 text-base transition-all"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Example Queries Dropdown */}
        {showExamples && !isSearching && (
          <div className="absolute w-full mt-2 bg-[#12121a] border border-[#1e1e2e] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-[#1e1e2e]">
              <span className="text-xs text-[#64748b] uppercase tracking-wide">Example Queries</span>
            </div>
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#94a3b8] hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-[#475569] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {example}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
