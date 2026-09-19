"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import type { StatEntry } from "@/lib/types";

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
  onDuplicate?: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onCategoryChange: (id: string, category: string) => Promise<void>;
  connectPlatformLabel?: string;
  connectedAccount?: { title: string | null } | null;
  connectUrl?: string;
  onDisconnect?: () => Promise<void>;
  itemStats?: Record<string, StatEntry[]>;
  editorOptions?: string[];
  overviewTitle?: string;
  overview?: StatEntry[] | null;
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
  onDuplicate,
  onStatusChange,
  onCategoryChange,
  connectPlatformLabel = "the platform",
  connectedAccount,
  connectUrl,
  onDisconnect,
  itemStats,
  editorOptions,
  overviewTitle = "Account overview",
  overview,
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [touchDrag, setTouchDrag] = useState<{
    id: string;
    touchId: number;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>(CATEGORY_KEYS[0]);
  const [bulkBusy, setBulkBusy] = useState(false);

  function toggleSelect(id: string, e?: React.SyntheticEvent) {
    e?.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleTouchStart(id: string, e: React.TouchEvent) {
    const t = e.touches[0];
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setTouchDrag((prev) => (prev && prev.id === id ? { ...prev, active: true } : prev));
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    }, 450);
    setTouchDrag({ id, touchId: t.identifier, startX: t.clientX, startY: t.clientY, active: false });
  }

  // Long-press-then-drag for touch screens, since the HTML5 drag-and-drop API
  // used for mouse dragging has no touch equivalent. Runs alongside it.
  useEffect(() => {
    if (!touchDrag) return;

    function findStage(x: number, y: number): string | null {
      const el = document.elementFromPoint(x, y);
      const col = el ? (el as HTMLElement).closest<HTMLElement>(".col") : null;
      return col?.dataset.stage ?? null;
    }

    function onMove(e: TouchEvent) {
      const t = [...e.touches].find((t) => t.identifier === touchDrag!.touchId);
      if (!t) return;
      if (!touchDrag!.active) {
        const dx = t.clientX - touchDrag!.startX;
        const dy = t.clientY - touchDrag!.startY;
        if (Math.hypot(dx, dy) > 10) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          setTouchDrag(null);
        }
        return;
      }
      e.preventDefault();
      setDragOverStage(findStage(t.clientX, t.clientY));
    }

    function onEnd(e: TouchEvent) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (touchDrag!.active) {
        const t = e.changedTouches[0];
        const stageKey = t ? findStage(t.clientX, t.clientY) : null;
        if (stageKey) handleStatusChange(touchDrag!.id, stageKey);
      }
      setDragOverStage(null);
      setTouchDrag(null);
    }

    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchDrag]);

  async function applyBulkCategory() {
    setBulkBusy(true);
    try {
      // Sequential on purpose: concurrent calls to the same bound server action
      // reference (via Promise.all) were observed to silently drop all but one.
      // Also deliberately a narrow category-only update (not onUpdate, which
      // rebuilds the whole record from this component's possibly-stale items
      // prop) — reconstructing every other field from stale client state
      // risks silently reverting a change (e.g. a status update) that hasn't
      // round-tripped back into `items` yet.
      for (const id of selected) {
        await onCategoryChange(id, bulkCategory);
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function applyBulkDelete() {
    if (!confirm(`Delete ${selected.size} selected item${selected.size === 1 ? "" : "s"}?`)) return;
    setBulkBusy(true);
    try {
      for (const id of selected) {
        await onDelete(id);
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  const topScrollRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef<"top" | "board" | null>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  function handleTopScroll() {
    if (syncingRef.current === "board") {
      syncingRef.current = null;
      return;
    }
    if (!topScrollRef.current || !boardRef.current) return;
    syncingRef.current = "top";
    boardRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  }

  function handleBoardScroll() {
    if (syncingRef.current === "top") {
      syncingRef.current = null;
      return;
    }
    if (!topScrollRef.current || !boardRef.current) return;
    syncingRef.current = "board";
    topScrollRef.current.scrollLeft = boardRef.current.scrollLeft;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchesCat = category === "all" || i.category === category;
      const matchesQ =
        !q || `${i.title} ${i.pitch} ${i.notes} ${i.editor}`.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [items, category, query]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || view !== "board") return;
    const measure = () => setBoardWidth(board.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [view, filtered.length]);

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

  async function handleDuplicate() {
    if (dialogItem && dialogItem !== "new" && onDuplicate) {
      await onDuplicate(dialogItem.id);
      closeDialog();
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

      {connectedAccount !== undefined ? (
        <div className="notice" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {connectNotice === "connected" ? (
            <span>Connected to {connectPlatformLabel}.</span>
          ) : connectNotice?.startsWith("error:") ? (
            <span style={{ color: "var(--danger)" }}>
              Couldn&apos;t connect: {connectNotice.slice(6)}
            </span>
          ) : null}
          {connectedAccount ? (
            <>
              <span>
                Connected to {connectPlatformLabel} as <strong>{connectedAccount.title ?? "your account"}</strong> —
                published items show real stats.
              </span>
              <span className="grow" />
              {onDisconnect ? (
                <form action={onDisconnect}>
                  <button type="submit" className="btn">
                    Disconnect
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <>
              <span>Connect your {connectPlatformLabel} account to see real stats on published items.</span>
              <span className="grow" />
              {connectUrl ? (
                <a className="btn primary" href={connectUrl}>
                  Connect {connectPlatformLabel}
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

      {selected.size > 0 ? (
        <div className="notice" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>
            <strong>{selected.size}</strong> selected
          </span>
          <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} aria-label="Bulk category">
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
          <button className="btn" onClick={applyBulkCategory} disabled={bulkBusy}>
            {bulkBusy ? "Applying…" : "Set category"}
          </button>
          <button className="btn danger" onClick={applyBulkDelete} disabled={bulkBusy}>
            Delete selected
          </button>
          <span className="grow" />
          <button className="btn" onClick={clearSelection} disabled={bulkBusy}>
            Clear
          </button>
        </div>
      ) : null}

      {view === "board" ? (
        <div className="board-topscroll" ref={topScrollRef} onScroll={handleTopScroll}>
          <div style={{ width: boardWidth, height: 1 }} />
        </div>
      ) : null}

      {view === "board" ? (
        <div
          className="board"
          ref={boardRef}
          onScroll={handleBoardScroll}
          style={{ ["--cols" as string]: stages.length }}
        >
          {stages.map((s) => {
            const colItems = filtered
              .filter((i) => i.status === s[0])
              .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
            return (
              <section
                className={`col${dragOverStage === s[0] ? " drag-over" : ""}`}
                key={s[0]}
                data-stage={s[0]}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingId) setDragOverStage(s[0]);
                }}
                onDragLeave={() => setDragOverStage((cur) => (cur === s[0] ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || draggingId;
                  setDragOverStage(null);
                  if (id) handleStatusChange(id, s[0]);
                }}
              >
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
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className={`card${draggingId === item.id || (touchDrag?.active && touchDrag.id === item.id) ? " dragging" : ""}${selected.has(item.id) ? " selected" : ""}`}
                        style={{ ["--c" as string]: `var(${stageColorVar(stages, item.status)})` }}
                        onClick={() => setDialogItem(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDialogItem(item);
                          }
                        }}
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(item.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", item.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverStage(null);
                        }}
                        onTouchStart={(e) => handleTouchStart(item.id, e)}
                      >
                        <input
                          type="checkbox"
                          className="card-select"
                          checked={selected.has(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleSelect(item.id, e)}
                          aria-label={`Select ${item.title}`}
                        />
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
                      </div>
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
          selected={selected}
          onToggleSelect={toggleSelect}
        />
      )}

      {dialogItem ? (
        <ItemDialog
          kind={kind}
          stages={stages}
          steps={steps}
          showCostAndEditor={showCostAndEditor}
          showTopPick={showTopPick}
          stats={dialogItem !== "new" ? itemStats?.[dialogItem.id] : undefined}
          statsLabel={`${connectPlatformLabel} stats`}
          editorOptions={editorOptions}
          initial={dialogItem === "new" ? null : dialogItem}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialogItem !== "new" ? handleDelete : undefined}
          onDuplicate={dialogItem !== "new" && onDuplicate ? handleDuplicate : undefined}
        />
      ) : null}

      {overview && overview.length ? (
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: "0 0 4px" }}>
            {overviewTitle}
          </h2>
          <p className="sub" style={{ margin: "0 0 16px" }}>Pulled live from {connectPlatformLabel}</p>
          <div className="stats">
            {overview.map((s) => (
              <div className="stat" key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>
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
  selected,
  onToggleSelect,
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
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
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
            <th style={{ width: 32 }}></th>
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
              <tr key={item.id} className={selected.has(item.id) ? "row-selected" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`Select ${item.title}`}
                  />
                </td>
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
              <td colSpan={4}>Total editing cost ({items.length} videos)</td>
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
