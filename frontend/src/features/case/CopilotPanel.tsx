import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
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

export function CopilotPanel({
  caseId,
  compact = false,
  embedded = false,
}: {
  caseId: string;
  compact?: boolean;
  embedded?: boolean;
}) {
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
  }, [messages, sending]);

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
      showToast("Copilot response generated.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Copilot service is temporarily unreachable.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", embedded ? "p-5" : "p-4")}>
      {/* Message Feed */}
      <div
        ref={scrollRef}
        className={cn(
          "space-y-4 overflow-y-auto pr-1 flex-1",
          !embedded && (compact ? "max-h-64" : "max-h-96")
        )}
      >
        {loadingHistory && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            <span>Retrieving case intelligence history...</span>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-2 animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Bot className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">PreClaim Case Intelligence Copilot</p>
            <p className="text-2xs text-slate-500 max-w-[260px] leading-relaxed">
              Ask about pre-submission documentation, risk drivers, or corrective actions for this case.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "USER" ? (
            <div key={m.id} className="flex justify-end items-end gap-2 animate-slide-up">
              <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-brand-600 px-4 py-2.5 text-xs text-white shadow-2xs leading-relaxed">
                {m.content}
              </div>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-3xs font-bold">
                <User className="h-3 w-3" />
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start items-start gap-2.5 animate-fade-in">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 mt-0.5 border border-slate-200/80">
                <Sparkles className="h-3 w-3 text-brand-600" />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-xs border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs text-slate-800 shadow-2xs">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-3xs font-bold uppercase tracking-wider text-brand-700">
                    PreClaim Case Intelligence
                  </span>
                </div>
                <div className="space-y-1.5 leading-relaxed whitespace-pre-line text-slate-700 font-normal">
                  {m.content}
                </div>
              </div>
            </div>
          )
        )}

        {sending && (
          <div className="flex justify-start items-start gap-2.5 animate-fade-in">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 mt-0.5 border border-slate-200/80">
              <Sparkles className="h-3 w-3 text-brand-600" />
            </div>
            <div className="rounded-2xl rounded-tl-xs border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
              <span>Analyzing case against configured payer rules...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-lg bg-red-50 border border-red-200/80 px-3.5 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Suggested Prompt Chips */}
      <div className="mt-3 pt-3 border-t border-slate-100/90 space-y-2">
        <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">
          Suggested Inquiries
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={sending}
              className="focus-ring inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-2xs font-medium text-slate-600 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-800 hover:shadow-2xs active:scale-98 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input Bar */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about documentation, risk drivers, or next steps..."
          disabled={sending}
          className="focus-ring flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs placeholder:text-slate-400 focus:bg-white transition"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => send(input)}
          disabled={!input.trim() || sending}
          className="rounded-xl px-3"
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
