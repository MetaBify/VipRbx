"use client";

import {
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";

export type LeadSummary = {
  id: string;
  offerId: string;
  points: number;
  status: string;
  createdAt: string;
  availableAt: string;
  awardedAt?: string | null;
};

export type UserSummary = {
  id: string;
  email: string;
  username: string;
  balance: number;
  pending: number;
  availablePoints: number;
  totalPoints: number;
  level: number;
  isAdmin: boolean;
  chatMutedUntil?: string | null;
  leads: LeadSummary[];
  signupBonusAwarded: boolean;
  socialClaims: string[];
};

type StoreState = {
  user: UserSummary | null;
  loading: boolean;
  needsAuth: boolean;
  error: string | null;
  bonusJustGranted: boolean;
};

const listeners = new Set<() => void>();
let state: StoreState = {
  user: null,
  loading: true,
  needsAuth: false,
  error: null,
  bonusJustGranted: false,
};

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partial: Partial<StoreState>) => {
  state = { ...state, ...partial };
  emit();
};

const updateUserState = (
  updater:
    | UserSummary
    | null
    | ((prev: UserSummary | null) => UserSummary | null)
) => {
  const nextValue =
    typeof updater === "function"
      ? (updater as (prev: UserSummary | null) => UserSummary | null)(state.user)
      : updater;

  setState({
    user: nextValue,
    needsAuth: nextValue ? false : state.needsAuth,
    bonusJustGranted: nextValue ? state.bonusJustGranted : false,
  });
};

const fetchUser = async () => {
  setState({ loading: true, error: null });

  try {
    const response = await fetch("/api/user/me", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load user.");
    }

    const data = await response.json();
    if (!data?.user) {
      setState({
        user: null,
        needsAuth: true,
        loading: false,
        bonusJustGranted: false,
      });
      return;
    }

    const normalizedUser: UserSummary = {
      ...data.user,
      socialClaims: data.user.socialClaims ?? [],
    };

    setState({
      user: normalizedUser,
      needsAuth: false,
      loading: false,
      bonusJustGranted: Boolean(data.bonusJustGranted),
    });
  } catch (error) {
    console.error(error);
    setState({
      user: null,
      needsAuth: true,
      loading: false,
      error: "Unable to fetch user details right now.",
      bonusJustGranted: false,
    });
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

let initialized = false;

const init = () => {
  if (initialized) return;
  initialized = true;
  if (typeof window !== "undefined") {
    fetchUser();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUser();
      }
    };
    window.addEventListener("focus", fetchUser);
    document.addEventListener("visibilitychange", handleVisibility);
  }
};

export function useUserSummary() {
  useEffect(() => {
    init();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => {
    fetchUser();
  }, []);

  const setUser = useCallback(
    (
      updater:
        | UserSummary
        | null
        | ((prev: UserSummary | null) => UserSummary | null)
    ) => {
      updateUserState(updater);
    },
    []
  );

  return {
    ...snapshot,
    refresh,
    setUser,
    acknowledgeBonus: () => setState({ bonusJustGranted: false }),
  };
}
