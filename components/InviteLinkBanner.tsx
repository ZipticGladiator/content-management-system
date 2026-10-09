"use client";

import { useState } from "react";

export default function InviteLinkBanner({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/invite/${token}` : `/invite/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the link is still shown for manual copy.
    }
  }

  return (
    <div className="notice" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span>Invite sent. Share this link with them:</span>
      <code style={{ flex: "1 1 auto", wordBreak: "break-all" }}>{link}</code>
      <button type="button" className="btn primary" onClick={copy}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
