import type { Metadata } from "next";
import { Sora, Inter, Fira_Code } from "next/font/google";
import TopNav from "@/components/TopNav";
import Onboarding from "@/components/Onboarding";
import { getNotifications } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { getCurrentOrg } from "@/lib/org";
import "./globals.css";

// Spotify Circular has no free equivalent on Google Fonts; Sora (display) and
// Inter (body) are the closest geometric, rounded-terminal match — see the
// mobile-app-ui-design skill's "one font family, bold weights" typography rule.
const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mono = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Social Flow",
  description: "YouTube + TikTok content pipeline, from idea to published.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('cms-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const [notifications, org] = await Promise.all([
    user ? getNotifications(user.orgId) : Promise.resolve([]),
    user ? getCurrentOrg(user.orgId) : Promise.resolve(null),
  ]);

  // Every org picks its own accent color (Settings); this overrides the
  // design system's default lime for the one request/session it applies to,
  // without touching anything else in the dark/light theme.
  const accentStyle = org ? (`:root,:root[data-theme="dark"]{--accent:${org.accentColor};}` as const) : null;

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {accentStyle ? <style dangerouslySetInnerHTML={{ __html: accentStyle }} /> : null}
      </head>
      <body>
        <TopNav notifications={notifications} user={user} orgName={org?.name ?? null} />
        {children}
        <Onboarding />
      </body>
    </html>
  );
}
