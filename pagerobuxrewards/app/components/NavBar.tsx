import Image from "next/image";
import Link from "next/link";

const FUNDING_BASE = "/funding";

const NavBar = () => {
  return (
    <nav className="bg-[#dee1e3] fixed top-0 left-0 right-0 p-2 lg:px-4 z-50 shadow-md">
      <Link href={FUNDING_BASE}>
        <Image
          width={40}
          height={40}
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PHBhdGggZD0iTTExLjY3NiAwTDAgNDQuMTY2IDQzLjU3NyA1NmwxMS42NzYtNDQuMTY2TDExLjY3NiAwem0yMC40MDkgMzUuODI3bC0xMi4xNzctMy4zMDggMy4yNjQtMTIuMzQyIDEyLjE4MiAzLjMwOC0zLjI3IDEyLjM0MnoiIGZpbGw9IiMzOTNCM0QiLz48L3N2Zz4="
          alt="Logo"
          className="w-8 h-8 cursor-pointer"
          unoptimized
        />
      </Link>
    </nav>
  );
};

export default NavBar;
