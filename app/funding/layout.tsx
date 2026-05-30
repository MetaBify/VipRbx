export { metadata } from "../../pagerobuxrewards/app/layout";
import type { ReactNode } from "react";
import GiveawayLayout from "../../pagerobuxrewards/app/layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <GiveawayLayout>{children}</GiveawayLayout>;
}
