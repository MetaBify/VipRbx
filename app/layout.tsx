import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import ClickTracker from "./components/ClickTracker";
import AntiAdblockPopup from "./components/AntiAdblockPopup";
import ChatWidget from "./components/ChatWidget";
import SignupPromoPopup from "./components/SignupPromoPopup";
import SignupBonusPopup from "./components/SignupBonusPopup";

const siteTitle = "VIPRBX | Complete Offers. Earn Robux. Simple.";
const siteDescription =
  "Complete offers, earn points, and redeem Robux instantly. Join VIPRBX today and grab 5 bonus points just for signing up!";
const siteKeywords = [
  // 🔹 Short + powerful
  "earn robux",
  "free robux",
  "robux payout",
  "robux offers",
  "roblox rewards",
  "robux cashout",
  "viprbx",
  
  // 🔹 Long-tail (for SEO boost)
  "earn robux online",
  "free robux site",
  "robux rewards platform",
  "legit robux site",
  "robux offerwall",
  "withdraw robux fast"
];

export const metadata: Metadata = {
  metadataBase:
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL
      ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
      : undefined,
  title: siteTitle,
  description: siteDescription,
  keywords: siteKeywords,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/offers",
    siteName: "VipRbx",
    type: "website",
    images: [
      {
        url: "/images/roblox-logo.png",
        width: 512,
        height: 512,
        alt: "VipRbx - Earn Robux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/images/roblox-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/offers",
  },
  category: "technology",
  icons: {
    icon: [{ rel: "icon", url: "/images/web-logo.png", sizes: "any" }],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VipRbx",
  url:
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : "https://viprbx.com",
  description: siteDescription,
  keywords: siteKeywords.join(", "),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        (typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_BASE_URL
          ? process.env.NEXT_PUBLIC_BASE_URL
          : "https://viprbx.com") + "/offers?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
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
        <SignupPromoPopup />
        <SignupBonusPopup />
        <NavBar />
        <ChatWidget />
        <ClickTracker>{children}</ClickTracker>

        
      </body>
    </html>
  );
}
