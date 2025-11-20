"use client";

import { createContext, useContext } from "react";

export type SiteContextValue = {
  isGiveaway: boolean;
};

const defaultValue: SiteContextValue = { isGiveaway: false };

export const SiteContext = createContext<SiteContextValue>(defaultValue);

export const SiteContextProvider = SiteContext.Provider;

export function useSiteContext() {
  return useContext(SiteContext);
}
