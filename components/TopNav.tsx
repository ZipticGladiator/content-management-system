"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import ThemeToggle from "@/components/ThemeToggle";
import { openOnboarding } from "@/components/Onboarding";
import NotificationBell from "@/components/NotificationBell";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import HelpIcon from "@/components/icons/HelpIcon";
import type { NotificationEntry } from "@/lib/notifications";

const LINKS = [
  { href: "/youtube", label: "YouTube", icon: <YouTubeIcon size={16} /> },
  { href: "/tiktok", label: "TikTok", icon: <TikTokIcon size={16} /> },
  { href: "/scripts", label: "Scripts", icon: null },
  { href: "/calendar", label: "Calendar", icon: null },
  { href: "/inspiration", label: "Inspiration", icon: null },
  { href: "/goals", label: "Goals", icon: null },
  { href: "/finance", label: "Finance", icon: null },
  { href: "/trash", label: "Trash", icon: null },
];

export default function TopNav({ notifications }: { notifications: NotificationEntry[] }) {
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
        <NotificationBell notifications={notifications} />
        <button type="button" className="btn theme-toggle" onClick={openOnboarding} aria-label="Replay onboarding tour">
          <HelpIcon size={15} />
        </button>
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
