export { metadata } from "../../pagerobuxrewards/app/layout";
import type { ReactNode } from "react";
import GiveawayLayout from "../../pagerobuxrewards/app/layout";
import { SiteContextProvider } from "../components/SiteContext";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteContextProvider value={{ isGiveaway: true }}>
      <GiveawayLayout>{children}</GiveawayLayout>
    </SiteContextProvider>
  );
}
