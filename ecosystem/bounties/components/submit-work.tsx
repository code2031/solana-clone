"use client";

import { useState } from "react";

export function SubmitWork({ bountyTitle }: { bountyTitle: string }) {
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submission = {
      bountyTitle,
      description,
      link,
      submittedAt: Date.now(),
    };
    console.log("Submitting work:", submission);
    alert("Work submitted! The bounty creator will review your submission.");
  }

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Submit Your Work</h2>
      <p className="text-sm text-[#9999bb] mb-6">
        For: {bountyTitle}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#9999bb] mb-2">Description of Work</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe what you built, decisions made, and how it meets the requirements..."
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm text-[#9999bb] mb-2">PR / Link</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
            placeholder="https://github.com/..."
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-red-500 font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 transition-opacity"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
