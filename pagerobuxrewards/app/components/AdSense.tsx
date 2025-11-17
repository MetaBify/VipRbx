// components/AdSense.tsx
import Script from "next/script";
import React from "react";

interface AdSenseProps {
  pId: string;
}

function AdSense({ pId }: AdSenseProps) {
  return (
    <Script
      crossOrigin="anonymous"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pId}`}
    />
  );
}

export default AdSense;
