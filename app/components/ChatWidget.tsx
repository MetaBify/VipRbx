"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUserSummary } from "@/lib/useUserSummary";

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
const DEFAULT_RAIN_DURATION = 5;
const MIN_RAIN_DURATION = 1;
const MAX_RAIN_DURATION = 120;
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
  durationMinutes: number;
  expiresAt: string;
};
type MutedUser = {
  id: string;
  username: string;
  mutedUntil: string;
};

const formatMuteRemaining = (iso: string) => {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return "Unknown";
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    return "Expired";
  }
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

export default function ChatWidget() {
  const { refresh: refreshUserSummary } = useUserSummary();
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
  const [rainDuration, setRainDuration] = useState(DEFAULT_RAIN_DURATION);
  const [rainSubmitting, setRainSubmitting] = useState(false);
  const [rainCountdown, setRainCountdown] = useState<string | null>(null);
  const [showMutedList, setShowMutedList] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [mutedLoading, setMutedLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  const loadMessages = useCallback(
    async (options?: { markUnreadOnDiff?: boolean }) => {
      try {
        const response = await fetch("/api/chat", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setMessages((prev) => {
          if (
            options?.markUnreadOnDiff &&
            prev.length &&
            data.length &&
            prev[prev.length - 1]?.id !== data[data.length - 1]?.id &&
            !open
          ) {
            setHasUnread(true);
          }
          return data;
        });
      } catch (error) {
        console.error("Chat load failed", error);
      }
    },
    [open]
  );

  const fetchRain = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/rain", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setRain(data.rain);
      if (!data.rain) {
        setRainCountdown(null);
      }
    } catch (error) {
      console.error("Rain fetch failed", error);
    }
  }, []);

  const fetchMutedUsers = useCallback(async () => {
    if (!viewer?.isAdmin) {
      setMutedUsers([]);
      return;
    }
    setMutedLoading(true);
    try {
      const response = await fetch("/api/chat/manage", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) {
          fetchViewer();
        }
        return;
      }
      const data = await response.json();
      setMutedUsers(data.muted ?? []);
    } catch (error) {
      console.error("Muted users fetch failed", error);
    } finally {
      setMutedLoading(false);
    }
  }, [viewer?.isAdmin, fetchViewer]);

  useEffect(() => {
    fetchViewer();
    loadMessages();
    fetchRain();
    const interval = window.setInterval(() => {
      loadMessages({ markUnreadOnDiff: true });
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

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => {
        setAutoScrollEnabled(true);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScrollEnabled]);

  useEffect(() => {
    if (!viewer?.isAdmin) {
      setShowMutedList(false);
      setMutedUsers([]);
    }
  }, [viewer?.isAdmin]);

  useEffect(() => {
    if (showMutedList && open && viewer?.isAdmin) {
      fetchMutedUsers();
    }
  }, [showMutedList, open, viewer?.isAdmin, fetchMutedUsers]);

  useEffect(() => {
    if (!rain) {
      setRainCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = new Date(rain.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setRainCountdown("Expired");
        fetchRain();
        return false;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRainCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      return true;
    };

    updateCountdown();
    const intervalId = window.setInterval(() => {
      const stillRunning = updateCountdown();
      if (!stillRunning) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [rain, fetchRain]);

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
    fetchMutedUsers();
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
      fetchMutedUsers();
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
      refreshUserSummary();
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
    const normalizedDuration = Math.max(
      MIN_RAIN_DURATION,
      Math.min(MAX_RAIN_DURATION, Math.round(rainDuration || DEFAULT_RAIN_DURATION))
    );
    setRainAmount(normalizedAmount);
    setRainDuration(normalizedDuration);
    try {
      const response = await fetch("/api/chat/rain/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: normalizedAmount,
          durationMinutes: normalizedDuration,
        }),
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

  const rainExpired = rainCountdown === "Expired";
  const canClaimRain = Boolean(
    rain && viewer && !rain.claimedByViewer && !rainExpired
  );
  const rainButtonLabel = !rain
    ? ""
    : rainExpired
    ? "Rain ended"
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
                    const next = !showMutedList;
                    setShowMutedList(next);
                    if (next) {
                      fetchMutedUsers();
                    }
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-400"
                >
                  {showMutedList ? "Hide muted" : "Muted users"}
                </button>
              )}
              {viewer?.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setRainAmount(DEFAULT_RAIN_AMOUNT);
                    setRainDuration(DEFAULT_RAIN_DURATION);
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
          {viewer?.isAdmin && showMutedList && (
            <div className="border-b bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Muted users ({mutedUsers.length})
                </p>
                <button
                  type="button"
                  onClick={fetchMutedUsers}
                  className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide hover:border-slate-400"
                >
                  Refresh
                </button>
              </div>
              {mutedLoading ? (
                <p className="text-[11px] text-slate-500">Loading...</p>
              ) : mutedUsers.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  Nobody is muted right now.
                </p>
              ) : (
                <div className="space-y-2">
                  {mutedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-2xl bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-slate-800">
                          {user.username}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Until{" "}
                          {new Date(user.mutedUntil).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({formatMuteRemaining(user.mutedUntil)})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRelease(user.id)}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-400"
                      >
                        Unmute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div
            className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm"
            onScroll={(event) => {
              const { scrollTop, scrollHeight, clientHeight } =
                event.currentTarget;
              const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
              setAutoScrollEnabled(isBottom);
            }}
          >
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
            <div
              ref={(node) => {
                messagesEndRef.current = node;
                if (node && autoScrollEnabled) {
                  node.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />
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
                    Started by {rain.createdBy} · {rain.claims} claimed · Ends in{" "}
                    {rainCountdown ?? "--:--"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimRain}
                  disabled={
                    !viewer || rain.claimedByViewer || claimingRain || rainExpired
                  }
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
          style={{
            position: "fixed",
            bottom: isMobile ? "16px" : "24px",
            right: isMobile ? "16px" : "24px",
          }}
          className="z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl ring-2 ring-emerald-400 transition hover:scale-105 sm:h-16 sm:w-16 relative"
          aria-label="Open chat"
        >
          <Image
            src="https://icons.veryicon.com/png/o/commerce-shopping/jinfeng-technology-icon-library/chat-116.png"
            alt="Chat icon"
            width={isMobile ? 28 : 32}
            height={isMobile ? 28 : 32}
            className="object-contain"
          />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white">
              !
            </span>
          )}
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
                    setRainAmount(
                      Math.min(5000, Math.max(1, Number(event.target.value)))
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  disabled={rainSubmitting}
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration (minutes)
                <input
                  type="number"
                  min={MIN_RAIN_DURATION}
                  max={MAX_RAIN_DURATION}
                  step={1}
                  value={rainDuration}
                  onChange={(event) =>
                    setRainDuration(
                      Math.min(
                        MAX_RAIN_DURATION,
                        Math.max(MIN_RAIN_DURATION, Number(event.target.value))
                      )
                    )
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
