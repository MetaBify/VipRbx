"use client";

import Image from "next/image";
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
const MAX_TIMEOUT_MINUTES = 1440;
const DEFAULT_RAIN_AMOUNT = 10;
const emojiCategories = {
  Smileys: [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😃",
    "😄",
    "😅",
    "😆",
    "😉",
    "😊",
    "😍",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤨",
    "😐",
    "😑",
    "😶",
    "🙄",
    "😏",
    "😣",
    "😥",
    "😮",
    "🤐",
    "😯",
    "😪",
    "😫",
    "🥱",
    "😴",
    "😌",
    "😛",
    "😜",
    "😝",
    "🤤",
    "😒",
    "😓",
    "😔",
    "😕",
    "🙃",
    "🫠",
    "🤑",
    "😲",
    "☹️",
    "🙁",
    "😖",
    "😞",
    "😟",
    "😤",
    "😢",
    "😭",
    "😦",
    "😧",
    "😨",
    "😩",
    "🤯",
    "😬",
    "😰",
    "😱",
    "🥵",
    "🥶",
    "😳",
    "🤪",
    "😵",
    "😡",
    "😠",
    "🤬",
    "😈",
    "👿",
    "💀",
    "☠️",
    "🤡",
  ],
  People: [
    "👍",
    "👎",
    "👏",
    "🙌",
    "🙏",
    "🤝",
    "🤞",
    "🤟",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤘",
    "🤙",
    "🫶",
    "💪",
    "👊",
    "✊",
    "🤛",
    "🤜",
    "💅",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🙋",
    "🙆",
    "🙇",
    "🧑‍💻",
    "🧑‍🎓",
    "🧑‍🚀",
  ],
  Animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐵", "🐸", "🦄"],
  Food: ["🍏", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗"],
  Activities: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏒", "🏑", "🥍", "🥅", "⛳", "🏹", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "🎿", "⛷️", "🏂"],
  Travel: ["✈️", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖"],
  Objects: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📷", "📸", "🎥", "📺", "📻", "📡", "🔋", "🔌", "💡", "🔦", "🕯️"],
  Symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎"],
} as const;

type EmojiCategory = keyof typeof emojiCategories;
type TimeoutFormState = {
  userId: string;
  username: string;
  minutes: number;
  reason: string;
};
type RainStatus = {
  id: string;
  amount: number;
  createdAt: string;
  createdBy: string;
  claims: number;
  claimedByViewer: boolean;
};

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
  const [isMobile, setIsMobile] = useState(false);
  const [emojiCategory, setEmojiCategory] =
    useState<EmojiCategory>("Smileys");
  const [timeoutForm, setTimeoutForm] = useState<TimeoutFormState | null>(null);
  const [timeoutSubmitting, setTimeoutSubmitting] = useState(false);
  const emojiEntries = useMemo(
    () => Object.entries(emojiCategories) as [EmojiCategory, readonly string[]][],
    []
  );
  const [rain, setRain] = useState<RainStatus | null>(null);
  const [claimingRain, setClaimingRain] = useState(false);
  const [rainMessage, setRainMessage] = useState<string | null>(null);
  const [rainFormOpen, setRainFormOpen] = useState(false);
  const [rainAmount, setRainAmount] = useState(DEFAULT_RAIN_AMOUNT);
  const [rainSubmitting, setRainSubmitting] = useState(false);

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

  const fetchRain = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/rain", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setRain(data.rain);
    } catch (error) {
      console.error("Rain fetch failed", error);
    }
  }, []);

  useEffect(() => {
    fetchViewer();
    loadMessages();
    fetchRain();
    const interval = window.setInterval(() => {
      loadMessages();
      fetchRain();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [fetchViewer, loadMessages, fetchRain]);

  useEffect(() => {
    if (!open) {
      setShowEmojiPicker(false);
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleTimeout = async (
    targetUserId: string,
    minutes: number,
    reason: string
  ) => {
    if (!viewer?.isAdmin) return false;
    setAdminStatus(null);
    try {
      const response = await fetch("/api/chat/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "timeout",
          userId: targetUserId,
          minutes,
          reason,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAdminStatus(data.error ?? "Failed to timeout user.");
        return false;
      }
      setAdminStatus(`User muted for ${minutes} min.`);
      return true;
    } catch (error) {
      console.error(error);
      setAdminStatus("Network error while muting user.");
      return false;
    }
  };

  const handleRelease = async (targetUserId: string) => {
    if (!viewer?.isAdmin) return;
    setAdminStatus(null);
    try {
      const response = await fetch("/api/chat/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "untimeout",
          userId: targetUserId,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAdminStatus(data.error ?? "Failed to lift mute.");
        return;
      }
      setAdminStatus("User mute removed.");
    } catch (error) {
      console.error(error);
      setAdminStatus("Network error while lifting mute.");
    }
  };

  const closeTimeoutForm = () => {
    if (timeoutSubmitting) return;
    setTimeoutForm(null);
  };

  const handleTimeoutSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!timeoutForm) return;
    const trimmedReason = timeoutForm.reason.trim();
    if (!trimmedReason) {
      setAdminStatus("Reason is required.");
      return;
    }
    const minutes = Math.min(
      MAX_TIMEOUT_MINUTES,
      Math.max(1, Math.round(timeoutForm.minutes || 1))
    );
    setTimeoutSubmitting(true);
    const success = await handleTimeout(
      timeoutForm.userId,
      minutes,
      trimmedReason
    );
    setTimeoutSubmitting(false);
    if (success) {
      setTimeoutForm(null);
    }
  };

  const handleClaimRain = async () => {
    if (!rain || rain.claimedByViewer) return;
    if (!viewer) {
      setStatus("Sign in to claim the rain.");
      return;
    }
    setClaimingRain(true);
    setRainMessage(null);
    try {
      const response = await fetch("/api/chat/rain/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setRainMessage(data.error ?? "Unable to claim right now.");
        if (response.status === 401) {
          fetchViewer();
        }
        return;
      }
      setRainMessage(`+${Number(data.claimed).toFixed(0)} points added!`);
      setRain((prev) =>
        prev
          ? {
              ...prev,
              claimedByViewer: true,
              claims: prev.claims + 1,
            }
          : prev
      );
      fetchViewer();
      fetchRain();
    } catch (error) {
      console.error(error);
      setRainMessage("Network error while claiming.");
    } finally {
      setClaimingRain(false);
    }
  };

  const closeRainForm = () => {
    if (rainSubmitting) return;
    setRainFormOpen(false);
  };

  const handleRainStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!viewer?.isAdmin) return;
    setRainSubmitting(true);
    setAdminStatus(null);
    const normalizedAmount = Math.max(
      1,
      Math.min(5000, Math.round(rainAmount || 1))
    );
    setRainAmount(normalizedAmount);
    try {
      const response = await fetch("/api/chat/rain/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: normalizedAmount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAdminStatus(data.error ?? "Failed to start rain.");
        return;
      }
      setAdminStatus("Rain started.");
      setRainFormOpen(false);
      fetchRain();
    } catch (error) {
      console.error(error);
      setAdminStatus("Network error while starting rain.");
    } finally {
      setRainSubmitting(false);
    }
  };

  const canClaimRain = Boolean(rain && viewer && !rain.claimedByViewer);
  const rainButtonLabel = !rain
    ? ""
    : !viewer
    ? "Login to claim"
    : rain.claimedByViewer
    ? "Claimed"
    : claimingRain
    ? "Claiming..."
    : "Join rain";

  return (
    <>
      {open && isMobile && (
        <div
          className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <div
          className={`fixed z-[9999] flex flex-col overflow-hidden ${
            isMobile
              ? "inset-x-0 bottom-0 top-0 bg-white"
              : "top-20 bottom-4 right-4 w-[360px] rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur"
          }`}
        >
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
            <div className="flex items-center gap-2">
              {viewer?.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setRainAmount(DEFAULT_RAIN_AMOUNT);
                    setRainFormOpen(true);
                  }}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-400"
                >
                  Start rain
                </button>
              )}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white shadow hover:bg-rose-600"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-slate-500">
                No one has chatted yet. Be the first!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-800"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="text-[11px]">
                        {message.username} • Lv {message.level}
                      </span>
                      {message.isAdmin && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
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
                          Del
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTimeoutForm({
                              userId: message.userId,
                              username: message.username,
                              minutes: 60,
                              reason: "",
                            })
                          }
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-amber-600 hover:border-amber-400"
                        >
                          Mute
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRelease(message.userId)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-emerald-600 hover:border-emerald-400"
                        >
                          Lift
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))
            )}
          </div>
          {rain && (
            <div className="mx-4 mb-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    Rain is live
                  </p>
                  <p className="text-base font-bold text-emerald-900">
                    Claim {Number(rain.amount).toFixed(0)} points
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Started by {rain.createdBy} · {rain.claims} claimed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimRain}
                  disabled={!viewer || rain.claimedByViewer || claimingRain}
                  className="rounded-full border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition enabled:hover:bg-emerald-600 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-emerald-200 disabled:text-emerald-300"
                >
                  {rainButtonLabel}
                </button>
              </div>
              {rainMessage && (
                <p className="mt-2 text-xs text-emerald-700">{rainMessage}</p>
              )}
              {!viewer && (
                <p className="mt-1 text-[11px] text-emerald-600">
                  Sign in to grab this drop.
                </p>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="border-t px-4 py-3">
            <div className="relative">
              <textarea
                value={input}
                onChange={(event) => {
                  if (event.target.value.length <= MAX_LEN) {
                    setInput(event.target.value);
                  }
                }}
                rows={3}
                placeholder={
                  viewer ? "Share something helpful..." : "Sign in to chat."
                }
                disabled={!viewer || sending}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-emerald-500">
                    <span>Emojis</span>
                    <div className="flex gap-2 overflow-x-auto text-[10px] normal-case tracking-normal">
                      {emojiEntries.map(([category]) => (
                        <button
                          type="button"
                          key={category}
                          onClick={() => {
                            const section = document.getElementById(
                              `emoji-${category}`
                            );
                            section?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`rounded-full px-2 py-1 ${
                            emojiCategory === category
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="mt-2 max-h-48 overflow-y-auto"
                    onScroll={(event) => {
                      const container = event.currentTarget;
                      const sections =
                        container.querySelectorAll<HTMLDivElement>("[data-emoji-section]");

                      let currentCategory: EmojiCategory | null = null;
                      sections.forEach((section) => {
                        const rect = section.getBoundingClientRect();
                        if (rect.top >= container.getBoundingClientRect().top) {
                          if (!currentCategory) {
                            currentCategory = section.dataset
                              .emojiSection as EmojiCategory;
                          }
                        }
                      });

                      if (currentCategory && currentCategory !== emojiCategory) {
                        setEmojiCategory(currentCategory);
                      }
                    }}
                  >
                    {emojiEntries.map(([category, emojis]) => (
                      <div
                        key={category}
                        id={`emoji-${category}`}
                        data-emoji-section={category}
                        className="pb-3"
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          {category}
                        </p>
                        <div className="mt-1 grid grid-cols-6 gap-1 text-xl">
                          {emojis.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() =>
                                setInput((prev) =>
                                  (prev + emoji).slice(0, MAX_LEN)
                                )
                              }
                              className="rounded-lg bg-slate-50 py-1 hover:bg-slate-100"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
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
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:border-emerald-400"
                >
                  😊
                </button>
              </div>
              <button
                type="submit"
                disabled={!viewer || sending || !input.trim()}
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
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

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed z-[9998] rounded-full bg-white shadow-xl ring-2 ring-emerald-400 transition hover:scale-105 ${
            isMobile
              ? "bottom-4 right-4 h-14 w-14 sm:right-6"
              : "top-1/2 right-4 h-16 w-16 -translate-y-1/2"
          } flex items-center justify-center`}
          aria-label="Open chat"
        >
          <Image
            src="https://icons.veryicon.com/png/o/commerce-shopping/jinfeng-technology-icon-library/chat-116.png"
            alt="Chat icon"
            width={isMobile ? 28 : 32}
            height={isMobile ? 28 : 32}
            className="object-contain"
          />
        </button>
      )}
      {timeoutForm && viewer?.isAdmin && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeTimeoutForm}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Mute {timeoutForm.username}
                </p>
                <p className="text-xs text-slate-500">
                  Choose a duration and reason. The reason is sent to chat.
                </p>
              </div>
              <button
                type="button"
                onClick={closeTimeoutForm}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200"
                aria-label="Close mute form"
                disabled={timeoutSubmitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleTimeoutSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration (minutes)
                <input
                  type="number"
                  min={1}
                  max={MAX_TIMEOUT_MINUTES}
                  value={timeoutForm.minutes}
                  onChange={(event) =>
                    setTimeoutForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            minutes: Number(event.target.value),
                          }
                        : prev
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  disabled={timeoutSubmitting}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason (shows in chat)
                <textarea
                  rows={3}
                  maxLength={200}
                  value={timeoutForm.reason}
                  onChange={(event) =>
                    setTimeoutForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            reason: event.target.value.slice(0, 200),
                          }
                        : prev
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  placeholder="Explain the mute..."
                  disabled={timeoutSubmitting}
                />
              </label>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeTimeoutForm}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-400 disabled:opacity-70"
                  disabled={timeoutSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-400"
                  disabled={timeoutSubmitting}
                >
                  {timeoutSubmitting ? "Muting..." : "Mute user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {rainFormOpen && viewer?.isAdmin && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeRainForm}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Start a rain
                </p>
                <p className="text-xs text-slate-500">
                  Everyone online can claim the amount you set once.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRainForm}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200"
                aria-label="Close rain form"
                disabled={rainSubmitting}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRainStart} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount per user
                <input
                  type="number"
                  min={1}
                  max={5000}
                  step={1}
                  value={rainAmount}
                  onChange={(event) =>
                    setRainAmount(Math.max(1, Number(event.target.value)))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  disabled={rainSubmitting}
                />
              </label>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeRainForm}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-400 disabled:opacity-70"
                  disabled={rainSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  disabled={rainSubmitting}
                >
                  {rainSubmitting ? "Starting..." : "Start rain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
