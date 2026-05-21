import { useEffect, useRef, useState } from "react";
import { Send, Bot, Check, X, Trash2 } from "lucide-react";
import { resumesApi, type ChatMessage, type SseEvent } from "@/lib/resumesApi";

interface Message extends ChatMessage {
  clientId: string;
  toolsUsed?: string[];
}

interface PendingAction {
  description: string;
  tool: string;
  parameters: Record<string, string>;
  messages: Message[];
}

const SUGGESTIONS = [
  "Summarise this resume in 3 bullet points.",
  "What are the strongest technical skills here?",
  "Generate a cover letter for a senior engineering role.",
  "Add Python and FastAPI to the skills.",
  "Write a weakness I could honestly mention in an interview.",
  "Answer: Tell me about a time you led a difficult project.",
];

let messageId = 0;

function createMessageId() {
  messageId += 1;
  return `${Date.now()}-${messageId}`;
}

interface Props {
  hash: string;
  displayLabel?: string | null;
  /** Optional fixed height for the messages area (default: 22rem) */
  messagesHeight?: string;
}

export function ChatPane({ hash, displayLabel, messagesHeight = "22rem" }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    resumesApi.getChatHistory(hash)
      .then((history) => {
        if (!mounted) return;
        setMessages(history.map((m) => ({
          clientId: `${m.createdAt}-${m.role}`,
          role: m.role,
          content: m.content,
          toolsUsed: m.toolsUsed,
        })));
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [hash]);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  function action(tool: string, description: string, content: string): Omit<PendingAction, "messages"> {
    return {
      tool,
      description,
      parameters: {
        user_request: content,
        update_mode: tool === "save_cover_letter" ? "generate_or_save" : "replace_or_patch_section",
      },
    };
  }

  function detectAction(content: string): Omit<PendingAction, "messages"> | null {
    const lower = content.toLowerCase();
    if (/(add|update|remove|delete|change).*(skill|skills|tech)/.test(lower)) return action("update_skills", "User wants to change skills. Please confirm.", content);
    if (/(update|change|set).*(profile|name|title|summary|email|linkedin|github|website|location)/.test(lower)) return action("update_profile_field", "User wants to update a profile field. Please confirm.", content);
    if (/(add|update|remove|delete|change|rewrite|edit).*(experience|role|job|company)/.test(lower)) return action("update_experience", "User wants to change experience entries. Please confirm.", content);
    if (/(add|update|remove|delete|change|rewrite|edit).*(project|projects)/.test(lower)) return action("update_projects", "User wants to change projects. Please confirm.", content);
    if (/(add|update|remove|delete|change|rewrite|edit).*(certificate|certification|certifications)/.test(lower)) return action("update_certificates", "User wants to change certificates. Please confirm.", content);
    if (/(add|update|remove|delete|change|rewrite|edit).*(education|degree|university|school)/.test(lower)) return action("update_education", "User wants to change education entries. Please confirm.", content);
    if (/(add|update|remove|delete|change|rewrite|edit|hide|show|disable|enable).*(story|stories|behavioral)/.test(lower)) return action("update_stories", "User wants to change stories. Please confirm.", content);
    if (/(save|generate|write|update|regenerate).*(cover letter)/.test(lower)) return action("save_cover_letter", "User wants to create or update a cover letter. Please confirm.", content);
    return null;
  }

  async function runChat(next: Message[]) {
    setLoading(true);
    const streamingId = createMessageId();
    setMessages((prev) => [...prev, { clientId: streamingId, role: "assistant", content: "" }]);

    try {
      const apiMessages = next.map(({ role, content }) => ({ role, content }));
      const toolsCollected: string[] = [];

      await resumesApi.chatStream(hash, apiMessages, (event: SseEvent) => {
        if (event.type === "delta") {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === streamingId
                ? { ...m, content: m.content + event.text }
                : m,
            ),
          );
        } else if (event.type === "tool") {
          toolsCollected.push(event.name);
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === streamingId
                ? { ...m, toolsUsed: [...toolsCollected] }
                : m,
            ),
          );
        } else if (event.type === "done") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.clientId !== streamingId) return m;
              return { ...m, toolsUsed: event.toolsUsed };
            }),
          );
          if (event.dataChanged || event.coverLetterSaved) {
            window.dispatchEvent(new CustomEvent("resume-data-changed", { detail: { hash } }));
          }
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === streamingId
                ? { clientId: streamingId, role: "assistant", content: "Something went wrong. Please try again." }
                : m,
            ),
          );
        }
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === streamingId
            ? { clientId: streamingId, role: "assistant", content: "Something went wrong. Please try again." }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { clientId: createMessageId(), role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);

    const action = detectAction(content);
    if (action) {
      setPendingAction({ ...action, messages: next });
      return;
    }
    await runChat(next);
  }

  async function clearHistory() {
    if (loading) return;
    await resumesApi.clearChatHistory(hash);
    setMessages([]);
    setPendingAction(null);
  }

  function rejectAction() {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { clientId: createMessageId(), role: "assistant", content: "Rejected. I did not run that action." },
    ]);
  }

  return (
    <div className="flex flex-col border border-border rounded-md overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border shrink-0">
        <Bot size={14} className="accent-text shrink-0" />
        <span className="text-sm font-medium flex-1">AI Assistant</span>
        <span className="font-mono text-xs text-muted-foreground">{displayLabel ?? "loaded resume"}</span>
        <button
          type="button"
          onClick={clearHistory}
          disabled={loading || messages.length === 0}
          className="chip h-7 px-2 flex items-center gap-1.5 disabled:opacity-40"
          aria-label="Clear chat history"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div
        className="overflow-y-auto px-4 py-3 space-y-3"
        style={{ height: messagesHeight }}
      >
        {messages.length === 0 && (
          <div className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Ask anything about this resume, or try a suggestion:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="chip text-xs text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.clientId} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-xl px-3 py-2 text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
            {m.toolsUsed && m.toolsUsed.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-[88%]">
                {[...new Set(m.toolsUsed)].map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                    ⚙ {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {pendingAction && (
          <div className="rounded-md border border-border bg-background px-3 py-3 max-w-[88%]">
            <p className="text-sm font-medium">Action: {pendingAction.description}</p>
            <div className="mt-2 rounded bg-muted/60 p-2 text-xs">
              <div><span className="font-medium">Tool:</span> <code>{pendingAction.tool}</code></div>
              <div className="mt-1 font-medium">Parameters</div>
              <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
                {JSON.stringify(pendingAction.parameters, null, 2)}
              </pre>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="chip flex items-center gap-1.5"
                data-active="true"
                onClick={() => {
                  const action = pendingAction;
                  setPendingAction(null);
                  void runChat(action.messages);
                }}
              >
                <Check size={12} /> OK
              </button>
              <button type="button" className="chip flex items-center gap-1.5" onClick={rejectAction}>
                <X size={12} /> Reject
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-start">
            <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2.5 flex gap-2 bg-background shrink-0">
        <input
          ref={inputRef}
          className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-foreground placeholder:text-muted-foreground disabled:opacity-50"
          placeholder="Ask anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="chip h-8 w-8 flex items-center justify-center shrink-0 disabled:opacity-40"
          data-active="true"
          aria-label="Send"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
