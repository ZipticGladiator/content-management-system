"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/youtube", label: "YouTube" },
  { href: "/tiktok", label: "TikTok" },
  { href: "/scripts", label: "Scripts" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <div className="topnav">
      <div className="topnav-inner">
        <Link href="/youtube" className="brand">
          Siya | Cybersecurity CMS
        </Link>
        <nav className="navlinks">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={pathname.startsWith(link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
