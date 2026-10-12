import { useState, useEffect, useRef } from "react";
import { chatService } from "../services";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Bot, Brain, Send } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Explain recursion with an example",
  "Give me 5 Python practice questions",
  "Help me understand SQL joins",
  "Create a study plan for Data Structures",
  "What are the best resources to learn React?",
  "Explain the difference between lists and tuples",
];

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatService.getHistory()
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    // Optimistically add user message
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: "user", message: msg, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const res = await chatService.sendMessage(msg);
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        res.data.user_message,
        res.data.assistant_message,
      ]);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear all chat history?")) return;
    await chatService.clearHistory();
    setMessages([]);
    toast.success("Chat cleared.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bot size={24} color="var(--color-primary)" /> AI Tutor
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Powered by Groq · llama-3.3-70b-versatile
          </p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearChat}>Clear Chat</button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2.5rem" }}>
        {historyLoading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="animate-fade-up" style={{ textAlign: "center", paddingTop: "3rem" }}>
            <Brain size={48} color="var(--color-primary-light)" style={{ margin: "0 auto 1.5rem" }} />
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
              Hi {user?.name?.split(" ")[0]}! I'm your AI Tutor
            </h2>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem" }}>
              Ask me anything about your studies. I'm here to explain, quiz, and guide you.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="animate-fade-in"
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "var(--gradient-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginRight: "0.625rem", marginTop: "0.25rem",
                  }}>
                    <Bot size={16} color="#fff" />
                  </div>
                )}
                <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                  ) : (
                    <span style={{ fontSize: "0.95rem" }}>{msg.message}</span>
                  )}
                  <div style={{
                    fontSize: "0.68rem", marginTop: "0.4rem",
                    color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "var(--color-text-muted)",
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div className="chat-bubble-ai" style={{ display: "flex", gap: "4px", alignItems: "center", padding: "1rem 1.25rem" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "var(--color-primary)",
                      animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: "1.25rem 2.5rem",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "flex", gap: "0.75rem", alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
            className="input"
            rows={1}
            style={{ flex: 1, resize: "none", maxHeight: 120, lineHeight: 1.6 }}
            id="chat-input"
          />
          <button
            id="chat-send"
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ padding: "0.75rem 1.25rem", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <><Send size={16} /> Send</>
            )}
          </button>
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
          AI may make mistakes. Verify important information.
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
