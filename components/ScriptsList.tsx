"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/format";

export type ScriptRow = {
  id: string;
  title: string;
  platform: "YouTube" | "TikTok";
  status: "DRAFT" | "FINAL";
  updatedAt: string;
  body: string;
};

export default function ScriptsList({ scripts }: { scripts: ScriptRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => `${s.title} ${s.body}`.toLowerCase().includes(q));
  }, [scripts, query]);

  if (!scripts.length) {
    return (
      <div className="tablewrap">
        <div className="empty">No scripts yet. Start one from a video or clip above.</div>
      </div>
    );
  }

  return (
    <>
      <div className="bar" style={{ marginTop: 18 }}>
        <input
          type="search"
          placeholder="Search scripts by title or content"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search scripts"
          style={{ minWidth: 280 }}
        />
        <span className="grow" />
        {query ? <span className="cat">{filtered.length} of {scripts.length}</span> : null}
      </div>

      {filtered.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link className="linkish" href={`/scripts/${s.id}`}>
                      {s.title}
                    </Link>
                  </td>
                  <td className="cat">{s.platform}</td>
                  <td className="cat">{s.status === "FINAL" ? "Final" : "Draft"}</td>
                  <td className="cat">{fmtDate(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">No scripts match &quot;{query}&quot;.</div>
        </div>
      )}
    </>
  );
}
