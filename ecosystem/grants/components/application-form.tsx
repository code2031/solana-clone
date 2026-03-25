"use client";

import { useState } from "react";

interface Milestone {
  id: number;
  title: string;
  description: string;
  deliverable: string;
}

export function ApplicationForm({ grantTitle }: { grantTitle: string }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [teamInfo, setTeamInfo] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [links, setLinks] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, title: "", description: "", deliverable: "" },
  ]);

  function addMilestone() {
    const newId = milestones.length > 0 ? Math.max(...milestones.map((m) => m.id)) + 1 : 1;
    setMilestones([...milestones, { id: newId, title: "", description: "", deliverable: "" }]);
  }

  function removeMilestone(id: number) {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  }

  function updateMilestone(id: number, field: keyof Omit<Milestone, "id">, value: string) {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const application = {
      grantTitle,
      projectName,
      description,
      teamInfo,
      requestedAmount: parseInt(requestedAmount),
      milestones,
      timeline,
      links: links.split("\n").filter(Boolean),
    };
    console.log("Submitting application:", application);
    alert("Application submitted! You will be notified of the review decision.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold">Apply for: {grantTitle}</h2>

      {/* Project Info */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Project Information</h3>
        <div>
          <label className="block text-sm text-[#9999bb] mb-2">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            placeholder="Your project name"
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm text-[#9999bb] mb-2">Description (Markdown supported)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            placeholder="Describe your project, its goals, and how it benefits the SolClone ecosystem..."
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Team */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Team</h3>
        <div>
          <label className="block text-sm text-[#9999bb] mb-2">Team Information</label>
          <textarea
            value={teamInfo}
            onChange={(e) => setTeamInfo(e.target.value)}
            required
            rows={3}
            placeholder="Team members, roles, and relevant experience..."
            className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Funding */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Funding &amp; Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#9999bb] mb-2">Requested Amount (SCLONE)</label>
            <input
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              required
              min="1"
              placeholder="e.g. 25000"
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9999bb] mb-2">Timeline</label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              required
              placeholder="e.g. 3 months"
              className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Milestones</h3>
          <button
            type="button"
            onClick={addMilestone}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            + Add Milestone
          </button>
        </div>
        {milestones.map((ms, idx) => (
          <div key={ms.id} className="bg-[#0a0a0f] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#9999bb]">Milestone {idx + 1}</span>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(ms.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="text"
              value={ms.title}
              onChange={(e) => updateMilestone(ms.id, "title", e.target.value)}
              placeholder="Milestone title"
              required
              className="w-full bg-[#12121a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#666688] focus:outline-none focus:border-amber-500"
            />
            <textarea
              value={ms.description}
              onChange={(e) => updateMilestone(ms.id, "description", e.target.value)}
              placeholder="What will be accomplished?"
              rows={2}
              className="w-full bg-[#12121a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#666688] focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={ms.deliverable}
              onChange={(e) => updateMilestone(ms.id, "deliverable", e.target.value)}
              placeholder="Key deliverable (e.g., deployed smart contract)"
              className="w-full bg-[#12121a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#666688] focus:outline-none focus:border-amber-500"
            />
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-white">Relevant Links</h3>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={3}
          placeholder="One URL per line (GitHub, website, previous work, etc.)"
          className="w-full bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg px-4 py-3 text-white placeholder-[#666688] focus:outline-none focus:border-amber-500"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 transition-opacity"
      >
        Submit Application
      </button>
    </form>
  );
}
