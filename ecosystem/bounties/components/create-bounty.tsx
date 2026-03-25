"use client";

import { useState } from "react";
import type { Difficulty, Category } from "@/app/page";

export function CreateBounty() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [category, setCategory] = useState<Category>("Frontend");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [deadline, setDeadline] = useState("");

  const categories: Category[] = ["Frontend", "Smart Contract", "Infrastructure", "Documentation", "Testing", "Design"];
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

  const difficultyColors: Record<string, string> = {
    Easy: "border-green-500 bg-green-500/10",
    Medium: "border-yellow-500 bg-yellow-500/10",
    Hard: "border-red-500 bg-red-500/10",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bounty = {
      title,
      description,
      reward: parseInt(reward),
      category,
      difficulty,
      deadline: new Date(deadline).getTime(),
    };
    console.log("Creating bounty:", bounty);
    alert("Bounty created! It will appear on the board once funded.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
        Post a Bounty
      </h1>
      <p className="text-[#9999bb] mb-8">
        Create a bounty to get community help building what the ecosystem needs.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Bounty Details</h2>
          <div>
            <label className="block text-sm text-[#9999bb] mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Short, descriptive title"
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9999bb] mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              placeholder="Detailed description of the bounty, what needs to be built, acceptance criteria..."
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Category */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                  category === cat
                    ? "border-red-500 bg-red-500/10 text-white"
                    : "border-[#2a2a4a] bg-[#0a0a0f] text-[#9999bb] hover:border-[#666688]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`p-3 rounded-lg border text-sm font-medium text-center transition-all ${
                  difficulty === diff
                    ? difficultyColors[diff] + " text-white"
                    : "border-[#2a2a4a] bg-[#0a0a0f] text-[#9999bb] hover:border-[#666688]"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Reward & Deadline */}
        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Reward &amp; Deadline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Reward Amount (PRISM)</label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
                min="1"
                placeholder="e.g. 500"
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9999bb] mb-2">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 transition-opacity"
        >
          Create Bounty
        </button>
      </form>
    </div>
  );
}
