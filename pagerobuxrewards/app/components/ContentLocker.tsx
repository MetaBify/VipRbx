// import { useEffect } from "react";
// import Script from "next/script";

// const ContentLocker = () => {
//   useEffect(() => {
//     // Ensure the `_Ul()` function is called after the external script loads
//     const scriptCheckInterval = setInterval(() => {
//       if (typeof window._Ul === "function") {
//         window._Ul(); // Call the function when it's available
//         clearInterval(scriptCheckInterval);
//       }
//     }, 100);

//     return () => clearInterval(scriptCheckInterval); // Cleanup interval on unmount
//   }, []);

//   return (
//     <>
//       {/* Inline script to define the variable */}
//       <Script
//         id="inline-script-1"
//         strategy="afterInteractive"
//         dangerouslySetInnerHTML={{
//           __html: `
//             var oOBBI_SMq_hmxsIc = {"it": 4402222, "key": "1f01e"};
//           `,
//         }}
//       />

//       <Script
//         src="https://d16w9e5gvnj8jg.cloudfront.net/534a3ac.js"
//         strategy="afterInteractive" // Ensure the script is loaded after interactive
//         async
//       />
//     </>
//   );
// };

// export default ContentLocker;
