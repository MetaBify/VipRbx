"use client";

import { useCallback, useEffect, useState } from "react";

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
};

type StateError = string | null;

export function useUserSummary() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<StateError>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/me", { cache: "no-store" });
      if (!response.ok) {
        setNeedsAuth(true);
        setUser(null);
        return;
      }

      const data = await response.json();
      if (!data.user) {
        setNeedsAuth(true);
        setUser(null);
        return;
      }

      setNeedsAuth(false);
      setUser(data.user);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch user details right now.");
      setNeedsAuth(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    user,
    setUser,
    loading,
    needsAuth,
    error,
    refresh,
  };
}
