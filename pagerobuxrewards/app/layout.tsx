import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import ClickTracker from "./components/ClickTracker";

export const metadata: Metadata = {
  title: "viprbx",
  description:
    "Get virtual currency for Roblox. Visit this site to receive funds for your Roblox games.",
  icons: {
    icon: [{ rel: "icon", url: "/images/web-logo.png", sizes: "any" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://d2zk8mk8hghu3d.cloudfront.net/4fc7cdb.js"
          strategy="afterInteractive"
        />

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5356953527878151"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <Analytics />

        <NavBar />
        <ClickTracker>{children}</ClickTracker>

        <footer className="fixed bottom-0 w-full underline text-center p-2 bg-slate-300 rounded-md font-bold text-gray-700 text-sm md:p-3 sm:text-md">
          You have to complete all the steps to receive Robux
        </footer>
      </body>
    </html>
  );
}
