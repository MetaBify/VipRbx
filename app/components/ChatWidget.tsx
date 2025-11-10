"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  username: string;
  content: string;
  level: number;
  createdAt: string;
  userId: string;
  isAdmin: boolean;
};

const MAX_LEN = 230;
const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😎",
  "🤩",
  "😇",
  "🤠",
  "🤔",
  "😴",
  "😤",
  "😭",
  "😡",
  "👍",
  "👏",
  "🙏",
  "🔥",
  "⭐",
  "💎",
  "💰",
  "⚡",
  "🎯",
  "🏆",
  "🎉",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{
    username: string;
    level: number;
    isAdmin: boolean;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);

  const fetchViewer = useCallback(async () => {
    try {
      const response = await fetch("/api/user/me", { cache: "no-store" });
      if (!response.ok) {
        setViewer(null);
        setAuthChecked(true);
        return;
      }
      const data = await response.json();
      if (data?.user) {
        setViewer({
          username: data.user.username,
          level: data.user.level,
          isAdmin: Boolean(data.user.isAdmin),
        });
      } else {
        setViewer(null);
      }
    } catch {
      setViewer(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch("/api/chat", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Chat load failed", error);
    }
  }, []);

  useEffect(() => {
    fetchViewer();
    loadMessages();
    const interval = window.setInterval(loadMessages, 8000);
    return () => window.clearInterval(interval);
  }, [fetchViewer, loadMessages]);

  useEffect(() => {
    if (!open) {
      setShowEmojiPicker(false);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!viewer) {
      setStatus("Sign in to chat.");
      return;
    }
    if (!input.trim()) {
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus(data.error ?? "Unable to send right now.");
        if (response.status === 401) {
          fetchViewer();
        }
        return;
      }

      const newMessage = await response.json();
      setMessages((prev) => [...prev.slice(-19), newMessage]);
      setInput("");
      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus("Network error while sending message.");
    } finally {
      setSending(false);
    }
  };

  const buttonLabel = useMemo(() => {
    if (!open) return "Open chat";
    return `Global chat (${messages.length})`;
  }, [open, messages.length]);

  const handleDelete = async (messageId: string) => {
    if (!viewer?.isAdmin) return;
    setAdminStatus(null);
    try {
      const response = await fetch("/api/chat/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", messageId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAdminStatus(data.error ?? "Failed to delete message.");
        return;
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setAdminStatus("Message deleted.");
    } catch (error) {
      console.error(error);
      setAdminStatus("Network error while deleting message.");
    }
  };

  const handleTimeout = async (targetUserId: string, minutes = 60) => {
    if (!viewer?.isAdmin) return;
    setAdminStatus(null);
    try {
      const response = await fetch("/api/chat/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "timeout",
          userId: targetUserId,
          minutes,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAdminStatus(data.error ?? "Failed to timeout user.");
        return;
      }
      setAdminStatus(`User muted for ${minutes} min.`);
    } catch (error) {
      console.error(error);
      setAdminStatus("Network error while muting user.");
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[9999] flex flex-col items-end space-y-2">
      {open && (
        <div className="flex w-80 flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Global chat
              </p>
              <p className="text-xs text-slate-500">
                {viewer
                  ? `Signed in as ${viewer.username} (Lv ${viewer.level})`
                  : authChecked
                  ? "Sign in to chat"
                  : "Checking session..."}
              </p>
            </div>
            <button
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-slate-500">
                No one has chatted yet. Be the first!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-slate-800"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>
                      {message.username} · Lv {message.level}
                      {message.isAdmin && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          Admin
                        </span>
                      )}
                    </span>
                    {viewer?.isAdmin && (
                      <div className="flex gap-1 text-[10px] uppercase tracking-wide">
                        <button
                          type="button"
                          onClick={() => handleDelete(message.id)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-rose-600 hover:border-rose-400"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimeout(message.userId, 60)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-amber-600 hover:border-amber-400"
                        >
                          Timeout
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSubmit} className="border-t px-4 py-3">
            <div className="relative">
              <textarea
                value={input}
                onChange={(event) => {
                  if (event.target.value.length <= MAX_LEN) {
                    setInput(event.target.value);
                  }
                }}
                rows={2}
                placeholder={
                  viewer ? "Share something helpful..." : "Sign in to chat."
                }
                disabled={!viewer || sending}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">
                    Emojis
                  </p>
                  <div className="mt-2 grid grid-cols-6 gap-1 text-lg">
                    {EMOJIS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() =>
                          setInput((prev) =>
                            (prev + emoji).slice(0, MAX_LEN)
                          )
                        }
                        className="rounded-lg bg-slate-50 py-1 text-base hover:bg-slate-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  {input.length}/{MAX_LEN}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="rounded-full border border-slate-200 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-600 hover:border-emerald-400"
                >
                  {showEmojiPicker ? "Hide emojis" : "Emojis"}
                </button>
              </div>
              <button
                type="submit"
                disabled={!viewer || sending || !input.trim()}
                className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
            {status && (
              <p className="mt-2 text-xs text-rose-600">{status}</p>
            )}
            {adminStatus && viewer?.isAdmin && (
              <p className="mt-1 text-[10px] text-slate-500">{adminStatus}</p>
            )}
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-600"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
