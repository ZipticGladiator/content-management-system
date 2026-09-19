"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import ThemeToggle from "@/components/ThemeToggle";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";

const LINKS = [
  { href: "/youtube", label: "YouTube", icon: <YouTubeIcon size={16} /> },
  { href: "/tiktok", label: "TikTok", icon: <TikTokIcon size={16} /> },
  { href: "/scripts", label: "Scripts", icon: null },
];

export default function TopNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <div className="topnav">
      <div className="topnav-inner">
        <Link href="/youtube" className="brand">
          <span className="brand-dot" />
          SIYA // CYBERSECURITY CMS
        </Link>
        <nav className="navlinks">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} data-active={pathname.startsWith(link.href)}>
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <span style={{ flex: 1 }} />
        <ThemeToggle />
        <form action={logout}>
          <button type="submit" className="btn">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
