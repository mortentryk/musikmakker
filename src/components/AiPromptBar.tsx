"use client";

import { Loader2, Wand2 } from "lucide-react";
import { FormEvent, useState } from "react";

type AiPromptBarProps = {
  loading: boolean;
  onSubmit: (prompt: string) => void;
};

export function AiPromptBar({ loading, onSubmit }: AiPromptBarProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onSubmit(prompt.trim());
    setPrompt("");
  };

  return (
    <footer className="ejay-ai-bar shrink-0 px-3 py-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="ejay-panel-label flex shrink-0 items-center gap-1 rounded px-3 py-1.5">
          <Wand2 className="h-3 w-3" />
          <span>AI DJ</span>
        </div>
        <input
          id="ai-prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          placeholder='Skriv fx "mørkt hiphop beat" eller "club house"'
          className="ejay-input min-w-0 flex-1 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="ejay-btn shrink-0 px-5 py-2 disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Scanner loops...
            </span>
          ) : (
            "Byg beat"
          )}
        </button>
      </form>
    </footer>
  );
}
