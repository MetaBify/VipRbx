import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import ClickTracker from "./components/ClickTracker";
import AntiAdblockPopup from "./components/AntiAdblockPopup";
import EntryOverlay from "./components/EntryOverlay";
import ChatWidget from "./components/ChatWidget";

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
      <head>
        <Script
          id="popunder-ads"
          type="text/javascript"
          data-cfasync="false"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `/*<![CDATA[/* */
(function(){var v=window,i="b7e4ddd8b8d35c5bea2629cd7b6af264",c=[["siteId",48+870*52-633+5205329],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],b=["d3d3LnZpc2FyaW9tZWRpYS5jb20vcFdVbUZlL2hmb3JtLmF1dGh5Lm1pbi5qcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvYmVVL2wvbmtlZW4udW1kLm1pbi5jc3M="],p=-1,z,q,y=function(){clearTimeout(q);p++;if(b[p]&&!(1787770191000<(new Date).getTime()&&1<p)){z=v.document.createElement("script");z.type="text/javascript";z.async=!0;var n=v.document.getElementsByTagName("script")[0];z.src="https://"+atob(b[p]);z.crossOrigin="anonymous";z.onerror=y;z.onload=function(){clearTimeout(q);v[i.slice(0,16)+i.slice(0,16)]||y()};q=setTimeout(y,5E3);n.parentNode.insertBefore(z,n)}};if(!v[i]){try{Object.freeze(v[i]=c)}catch(e){}y()}})();
/*]]>/* */`,
          }}
        />
      </head>
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

        <AntiAdblockPopup />
        <EntryOverlay />
        <NavBar />
        <ChatWidget />
        <ClickTracker>{children}</ClickTracker>

        <footer className="fixed bottom-0 w-full underline text-center p-2 bg-slate-300 rounded-md font-bold text-gray-700 text-sm md:p-3 sm:text-md">
          You have to complete all the steps to receive Robux
        </footer>
      </body>
    </html>
  );
}
