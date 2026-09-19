"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  stageColorVar,
  stageLabel,
  type StageDef,
} from "@/lib/pipeline";
import { fmtDate, isLate, rand } from "@/lib/format";
import type { ItemKind, PipelineItem, PipelineItemInput } from "@/lib/types";
import ItemDialog from "@/components/ItemDialog";
import CommentIcon from "@/components/icons/CommentIcon";
import CheckIcon from "@/components/icons/CheckIcon";
import PaperclipIcon from "@/components/icons/PaperclipIcon";
import type { VideoStats } from "@/lib/youtube-analytics";

type SortKey = "title" | "status" | "due" | "cost" | "prog";

type Props = {
  kind: ItemKind;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  initialOpenId?: string;
  items: PipelineItem[];
  stages: readonly StageDef[];
  steps?: readonly (readonly [string, string])[];
  showCostAndEditor?: boolean;
  showTopPick?: boolean;
  onCreate: (data: PipelineItemInput) => Promise<void>;
  onUpdate: (id: string, data: PipelineItemInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  youtubeChannel?: { title: string | null } | null;
  youtubeConnectUrl?: string;
  onDisconnectYoutube?: () => Promise<void>;
  videoStats?: Record<string, VideoStats>;
  connectNotice?: string;
};

function pct(item: PipelineItem, stages: readonly StageDef[]) {
  if (item.steps) {
    const keys = Object.keys(item.steps);
    if (keys.length === 0) return 0;
    const done = keys.filter((k) => item.steps![k]).length;
    return Math.round((done / keys.length) * 100);
  }
  const idx = stages.findIndex((s) => s[0] === item.status);
  return Math.round((idx / (stages.length - 1)) * 100);
}

export default function PipelineBoard({
  kind,
  title,
  subtitle,
  icon,
  initialOpenId,
  items,
  stages,
  steps,
  showCostAndEditor,
  showTopPick = true,
  onCreate,
  onUpdate,
  onDelete,
  onStatusChange,
  youtubeChannel,
  youtubeConnectUrl,
  onDisconnectYoutube,
  videoStats,
  connectNotice,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<"board" | "list">("board");
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("due");
  const [dir, setDir] = useState(1);
  const [dialogItem, setDialogItem] = useState<PipelineItem | null | "new">(
    () => (initialOpenId ? items.find((i) => i.id === initialOpenId) ?? null : null)
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchesCat = category === "all" || i.category === category;
      const matchesQ =
        !q || `${i.title} ${i.pitch} ${i.notes} ${i.editor}`.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [items, category, query]);

  const total = items.length;
  const publishedKey = stages[stages.length - 1][0];
  const published = items.filter((i) => i.status === publishedKey).length;
  const inProgress = items.filter((i) => i.status !== stages[0][0] && i.status !== publishedKey).length;
  const overdue = items.filter((i) => isLate(i.dueDate, i.status === publishedKey)).length;
  const budget = items.reduce((a, i) => a + i.cost, 0);
  const spent = items.filter((i) => i.paid).reduce((a, i) => a + i.cost, 0);

  function closeDialog() {
    setDialogItem(null);
  }

  async function handleSave(data: PipelineItemInput) {
    if (dialogItem === "new") {
      await onCreate(data);
    } else if (dialogItem) {
      await onUpdate(dialogItem.id, data);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (dialogItem && dialogItem !== "new") {
      await onDelete(dialogItem.id);
      router.refresh();
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await onStatusChange(id, status);
    router.refresh();
  }

  function sortedList() {
    const order = Object.fromEntries(stages.map((s, i) => [s[0], i]));
    return [...filtered].sort((a, b) => {
      let x: string | number, y: string | number;
      if (sort === "due") {
        x = a.dueDate || "9999";
        y = b.dueDate || "9999";
      } else if (sort === "status") {
        x = order[a.status];
        y = order[b.status];
      } else if (sort === "cost") {
        x = a.cost;
        y = b.cost;
      } else if (sort === "prog") {
        x = pct(a, stages);
        y = pct(b, stages);
      } else {
        x = a.title.toLowerCase();
        y = b.title.toLowerCase();
      }
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(-dir);
    else {
      setSort(key);
      setDir(1);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div className="page-title">
          {icon ? <span className="page-icon">{icon}</span> : null}
          <div>
            <h1>{title}</h1>
            <p className="sub">{subtitle}</p>
          </div>
        </div>
      </header>

      {youtubeChannel !== undefined ? (
        <div className="notice" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {connectNotice === "connected" ? (
            <span>Connected to YouTube Studio.</span>
          ) : connectNotice?.startsWith("error:") ? (
            <span style={{ color: "var(--danger)" }}>
              Couldn&apos;t connect: {connectNotice.slice(6)}
            </span>
          ) : null}
          {youtubeChannel ? (
            <>
              <span>
                Connected to YouTube Studio as <strong>{youtubeChannel.title ?? "your channel"}</strong> —
                published videos show real view/watch stats.
              </span>
              <span className="grow" />
              {onDisconnectYoutube ? (
                <form action={onDisconnectYoutube}>
                  <button type="submit" className="btn">
                    Disconnect
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <>
              <span>Connect your YouTube channel to see real view and watch-time stats on published videos.</span>
              <span className="grow" />
              {youtubeConnectUrl ? (
                <a className="btn primary" href={youtubeConnectUrl}>
                  Connect YouTube
                </a>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="stats">
        <div className="stat">
          <b>{total}</b>
          <span>ideas</span>
        </div>
        <div className="stat">
          <b>{inProgress}</b>
          <span>in production</span>
        </div>
        <div className="stat">
          <b>{published}</b>
          <span>{stageLabel(stages, publishedKey).toLowerCase()}</span>
        </div>
        <div className={`stat${overdue ? " over" : ""}`}>
          <b>{overdue}</b>
          <span>past due</span>
        </div>
        {showCostAndEditor ? (
          <div className="stat">
            <b>{rand(budget)}</b>
            <span>editing budget, {rand(spent)} paid</span>
          </div>
        ) : null}
      </div>

      <div className="pipe" aria-hidden="true">
        {stages.map((s) => {
          const n = items.filter((i) => i.status === s[0]).length;
          if (!n) return null;
          return (
            <i
              key={s[0]}
              style={{ width: `${(n / total) * 100}%`, background: `var(${s[2]})` }}
              title={`${s[1]}: ${n}`}
            />
          );
        })}
      </div>
      <div className="legend">
        {stages.map((s) => {
          const n = items.filter((i) => i.status === s[0]).length;
          return (
            <span key={s[0]}>
              <i className="sw" style={{ background: `var(${s[2]})` }} />
              {s[1]} {n}
            </span>
          );
        })}
      </div>

      <div className="bar">
        <div className="tabs" role="group" aria-label="View">
          <button aria-pressed={view === "board"} onClick={() => setView("board")}>
            Board
          </button>
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search ideas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search ideas"
        />
        <span className="grow" />
        <button className="btn primary" onClick={() => setDialogItem("new")}>
          Add idea
        </button>
      </div>

      {view === "board" ? (
        <div className="board" style={{ ["--cols" as string]: stages.length }}>
          {stages.map((s) => {
            const colItems = filtered
              .filter((i) => i.status === s[0])
              .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
            return (
              <section className="col" key={s[0]}>
                <h2>
                  <i className="sw" style={{ background: `var(${s[2]})` }} />
                  {s[1]}
                  <em>{colItems.length}</em>
                </h2>
                {colItems.length ? (
                  colItems.map((item) => {
                    const p = pct(item, stages);
                    const late = isLate(item.dueDate, item.status === publishedKey);
                    return (
                      <button
                        key={item.id}
                        className="card"
                        style={{ ["--c" as string]: `var(${stageColorVar(stages, item.status)})` }}
                        onClick={() => setDialogItem(item)}
                      >
                        {item.topPick ? <span className="top">Top pick</span> : null}
                        <span className="t">
                          {item.title}
                          {item.paid ? (
                            <span title="Paid" style={{ marginLeft: 6 }}>
                              <CheckIcon size={13} />
                            </span>
                          ) : null}
                        </span>
                        <span className="meta">
                          <span>{CATEGORY_LABELS[item.category]}</span>
                          {item.dueDate ? (
                            <span className={late ? "late" : ""}>Due {fmtDate(item.dueDate)}</span>
                          ) : null}
                          {item.cost ? <span title={item.paid ? "Paid" : "Not paid yet"}>{rand(item.cost)}</span> : null}
                          {item.attachmentCount ? (
                            <span className="comment-count">
                              <PaperclipIcon size={11} /> {item.attachmentCount}
                            </span>
                          ) : null}
                          {item.commentCount ? (
                            <span className="comment-count">
                              <CommentIcon size={11} /> {item.commentCount}
                            </span>
                          ) : null}
                        </span>
                        <span className="prog">
                          <i style={{ width: `${p}%` }} />
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="cat" style={{ padding: "6px 4px" }}>
                    Nothing here yet
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <ListView
          items={sortedList()}
          stages={stages}
          sort={sort}
          dir={dir}
          onSort={toggleSort}
          onOpen={setDialogItem}
          onStatusChange={handleStatusChange}
          publishedKey={publishedKey}
          showCostAndEditor={showCostAndEditor}
        />
      )}

      {dialogItem ? (
        <ItemDialog
          kind={kind}
          stages={stages}
          steps={steps}
          showCostAndEditor={showCostAndEditor}
          showTopPick={showTopPick}
          stats={dialogItem !== "new" ? videoStats?.[dialogItem.id] : undefined}
          initial={dialogItem === "new" ? null : dialogItem}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialogItem !== "new" ? handleDelete : undefined}
        />
      ) : null}
    </div>
  );
}

function ListView({
  items,
  stages,
  sort,
  dir,
  onSort,
  onOpen,
  onStatusChange,
  publishedKey,
  showCostAndEditor,
}: {
  items: PipelineItem[];
  stages: readonly StageDef[];
  sort: SortKey;
  dir: number;
  onSort: (key: SortKey) => void;
  onOpen: (item: PipelineItem) => void;
  onStatusChange: (id: string, status: string) => void;
  publishedKey: string;
  showCostAndEditor?: boolean;
}) {
  if (!items.length) {
    return (
      <div className="tablewrap">
        <div className="empty">No ideas match. Clear the search or add a new idea.</div>
      </div>
    );
  }

  const sum = items.reduce((a, i) => a + i.cost, 0);

  function th(key: SortKey, label: string) {
    return (
      <th
        onClick={() => onSort(key)}
        style={{ cursor: "pointer" }}
        aria-sort={sort === key ? (dir > 0 ? "ascending" : "descending") : "none"}
      >
        {label}
        {sort === key ? (dir > 0 ? " ▲" : " ▼") : ""}
      </th>
    );
  }

  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {th("title", "Video")}
            {th("status", "Status")}
            {th("due", "Due date")}
            {th("prog", "Progress")}
            {showCostAndEditor ? th("cost", "Editing cost") : null}
            {showCostAndEditor ? <th>Editor</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const p = item.steps
              ? (() => {
                  const keys = Object.keys(item.steps!);
                  return keys.length
                    ? Math.round((keys.filter((k) => item.steps![k]).length / keys.length) * 100)
                    : 0;
                })()
              : Math.round(
                  (stages.findIndex((s) => s[0] === item.status) / (stages.length - 1)) * 100
                );
            const late = isLate(item.dueDate, item.status === publishedKey);
            return (
              <tr key={item.id}>
                <td>
                  <button className="linkish" onClick={() => onOpen(item)}>
                    {item.topPick ? "★ " : ""}
                    {item.title}
                    {item.paid ? (
                      <span title="Paid" style={{ marginLeft: 6 }}>
                        <CheckIcon size={12} />
                      </span>
                    ) : null}
                  </button>
                  <div className="cat">{CATEGORY_LABELS[item.category]}</div>
                </td>
                <td>
                  <select
                    value={item.status}
                    aria-label="Status"
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                  >
                    {stages.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span className={late ? "late" : ""}>
                    {item.dueDate ? fmtDate(item.dueDate) : <span className="cat">Not set</span>}
                  </span>
                </td>
                <td>
                  <div className="mini" style={{ ["--c" as string]: `var(${stageColorVar(stages, item.status)})` }}>
                    <div className="prog">
                      <i style={{ width: `${p}%` }} />
                    </div>
                    <span className="cat">{p}%</span>
                  </div>
                </td>
                {showCostAndEditor ? (
                  <td className="num" title={item.cost && item.paid ? "Paid" : item.cost ? "Not paid yet" : undefined}>
                    {item.cost ? (
                      <>{rand(item.cost)}</>
                    ) : (
                      <span className="cat">—</span>
                    )}
                  </td>
                ) : null}
                {showCostAndEditor ? <td>{item.editor || <span className="cat">—</span>}</td> : null}
              </tr>
            );
          })}
          {showCostAndEditor ? (
            <tr className="foot">
              <td colSpan={3}>Total editing cost ({items.length} videos)</td>
              <td className="num">{rand(sum)}</td>
              <td></td>
              <td></td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
