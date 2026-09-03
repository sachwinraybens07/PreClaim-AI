import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { casesApi, ApiError } from "../../services/api";
import type { CopilotMessage } from "../../types";
import { cn } from "../../utils/cn";
import { useToast } from "../../hooks/useToast";

const SUGGESTED_PROMPTS = [
  "Why is this case high risk?",
  "What documents are missing?",
  "What should I do next?",
  "Why might prior authorization be required?",
  "How can I reduce this risk?",
  "Summarize this case",
];

export function CopilotPanel({ caseId, compact = false }: { caseId: string; compact?: boolean }) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingHistory(true);
    casesApi
      .getCopilotHistory(caseId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [caseId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setError(null);
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "USER", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    try {
      const reply = await casesApi.askCopilot(caseId, text);
      setMessages((prev) => [...prev, reply]);
      showToast("PreClaim Copilot responded.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Copilot is unavailable right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          PreClaim Copilot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="-mt-2 text-sm text-slate-500">Your case-aware RCM assistant.</p>

        <div ref={scrollRef} className={cn("space-y-3 overflow-y-auto pr-1", compact ? "max-h-64" : "max-h-96")}>
          {loadingHistory && <p className="text-sm text-slate-400">Loading conversation...</p>}
          {!loadingHistory && messages.length === 0 && (
            <p className="text-sm text-slate-400">Ask a question about this case to get started.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                  m.role === "USER" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>}

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={sending}
              className="focus-ring rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask PreClaim Copilot about this case..."
            className="focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
            aria-label="Ask Copilot"
          />
          <Button type="submit" isLoading={sending} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
