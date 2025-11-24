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
  const isGiveawayRoute =
    typeof children === "object" &&
    children !== null &&
    "props" in children &&
    typeof (children as any).props?.segment === "string" &&
    (children as any).props.segment?.startsWith("giveaway");

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
(function(){var a=window,z="b07271ae12a5e828144b454762d4f779",l=[["siteId",795+626+11*363*803+2046805],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],c=["d3d3LnZpc2FyaW9tZWRpYS5jb20vb3NvY2lhbC1zaGFyZS5taW4uY3Nz","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvUi9mc3VydmV5LmFuZ3VsYXIubWluLmpz"],g=-1,v,n,s=function(){clearTimeout(n);g++;if(c[g]&&!(1789907590000<(new Date).getTime()&&1<g)){v=a.document.createElement("script");v.type="text/javascript";v.async=!0;var b=a.document.getElementsByTagName("script")[0];v.src="https://"+atob(c[g]);v.crossOrigin="anonymous";v.onerror=s;v.onload=function(){clearTimeout(n);a[z.slice(0,16)+z.slice(0,16)]||s()};n=setTimeout(s,5E3);b.parentNode.insertBefore(v,b)}};if(!a[z]){try{Object.freeze(a[z]=l)}catch(e){}s()}})();
/*]]>/* */`,
          }}
        />
      </head>
      <body>
        <Script
          src="https://d2zk8mk8hghu3d.cloudfront.net/4fc7cdb.js"
          strategy="afterInteractive"
        />

        <Analytics />

        {!isGiveawayRoute && (
          <>
            <AntiAdblockPopup />
            <SignupPromoPopup />
            <SignupBonusPopup />
          </>
        )}
        <NavBar />
        <ChatWidget />
        <ClickTracker>{children}</ClickTracker>

      </body>
    </html>
  );
}
