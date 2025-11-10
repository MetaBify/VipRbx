// // app/middleware.js
// import { NextResponse } from "next/server";

// export function middleware(request) {
//   const user = request.cookies.get("robloxUser");

//   if (!user) {
//     return NextResponse.redirect(new URL("/", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/verify"],
// };
