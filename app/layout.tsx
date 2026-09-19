import type { Metadata } from "next";
import { Rajdhani, Space_Grotesk, Fira_Code } from "next/font/google";
import TopNav from "@/components/TopNav";
import "./globals.css";

const display = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Siya | Cybersecurity CMS",
  description: "YouTube + TikTok content pipeline for the cybersecurity brand.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('cms-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
