"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ASSET_TYPE_KEYS,
  ASSET_TYPE_LABELS,
  driveThumbnailUrl,
  parseDriveLink,
  type AssetEntry,
  type AssetItemOption,
} from "@/lib/assets";
import AssetDialog from "@/components/AssetDialog";
import FolderIcon from "@/components/icons/FolderIcon";
import DocumentIcon from "@/components/icons/DocumentIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import type { AssetInput } from "@/app/assets/actions";

type Props = {
  assets: AssetEntry[];
  itemOptions: AssetItemOption[];
  onCreate: (data: AssetInput) => Promise<void>;
  onUpdate: (id: string, data: AssetInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

const DRIVE_KIND_LABELS = { file: "Drive file", folder: "Drive folder", doc: "Google Doc", sheet: "Google Sheet", slides: "Google Slides" };

/** Drive preview when the file is shared publicly; otherwise (or on error) a type icon. */
function Preview({ asset }: { asset: AssetEntry }) {
  const drive = parseDriveLink(asset.url);
  const thumb = driveThumbnailUrl(drive);
  const [failed, setFailed] = useState(false);
  if (thumb && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- external Drive thumbnail; next/image would need remote config for an uncertain host
    return <img className="asset-thumb" src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  }
  return (
    <span className="asset-thumb asset-thumb-icon" aria-hidden="true">
      {drive?.kind === "folder" ? <FolderIcon size={32} /> : <DocumentIcon size={32} />}
    </span>
  );
}

export default function AssetsView({ assets, itemOptions, onCreate, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [type, setType] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dialogAsset, setDialogAsset] = useState<AssetEntry | null | "new">(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter(
      (a) =>
        (type === "all" || a.type === type) &&
        (!q || `${a.title} ${a.notes} ${a.item?.title ?? ""}`.toLowerCase().includes(q))
    );
  }, [assets, type, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of assets) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [assets]);

  async function handleSave(data: AssetInput) {
    if (dialogAsset === "new") await onCreate(data);
    else if (dialogAsset) await onUpdate(dialogAsset.id, data);
    router.refresh();
  }

  async function handleDelete() {
    if (dialogAsset && dialogAsset !== "new") {
      await onDelete(dialogAsset.id);
      router.refresh();
    }
  }

  async function copyLink(asset: AssetEntry) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 1500);
    } catch {
      window.prompt("Copy this link:", asset.url);
    }
  }

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <span className="page-icon">
            <FolderIcon size={36} />
          </span>
          <div>
            <h1>Assets</h1>
            <p className="sub">Google Drive links for thumbnails, docs, footage and everything else, all in one place</p>
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <b>{assets.length}</b>
          <span>assets</span>
        </div>
        <div className="stat">
          <b>{counts.THUMBNAIL ?? 0}</b>
          <span>thumbnails</span>
        </div>
        <div className="stat">
          <b>{counts.DOCUMENT ?? 0}</b>
          <span>documents</span>
        </div>
      </div>

      <div className="bar">
        <div className="tabs" role="group" aria-label="Filter by type">
          <button aria-pressed={type === "all"} onClick={() => setType("all")}>
            All
          </button>
          {ASSET_TYPE_KEYS.filter((k) => counts[k] || type === k).map((key) => (
            <button key={key} aria-pressed={type === key} onClick={() => setType(key)}>
              {ASSET_TYPE_LABELS[key]} <em className="tab-count">{counts[key] ?? 0}</em>
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search assets or videos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search assets"
        />
        <span className="grow" />
        <button className="btn primary" onClick={() => setDialogAsset("new")}>
          Add asset
        </button>
      </div>

      {filtered.length ? (
        <div className="asset-grid">
          {filtered.map((asset) => {
            const drive = parseDriveLink(asset.url);
            return (
              <article className="asset-card" key={asset.id}>
                <button className="asset-main" onClick={() => setDialogAsset(asset)} aria-label={`Edit ${asset.title}`}>
                  <Preview asset={asset} />
                  <span className="asset-body">
                    <span className="asset-top">
                      <span className={`asset-badge asset-badge-${asset.type.toLowerCase()}`}>{ASSET_TYPE_LABELS[asset.type]}</span>
                      <span className="asset-source">{drive ? DRIVE_KIND_LABELS[drive.kind] : hostOf(asset.url)}</span>
                    </span>
                    <span className="asset-title">{asset.title}</span>
                    {asset.notes ? <span className="asset-notes">{asset.notes}</span> : null}
                  </span>
                </button>
                <div className="asset-foot">
                  {asset.item ? (
                    <Link className="asset-item" href={`/${asset.item.kind}?open=${asset.item.id}`} title={asset.item.title}>
                      {asset.item.kind === "youtube" ? <YouTubeIcon size={14} /> : <TikTokIcon size={14} />}
                      <span>{asset.item.title}</span>
                    </Link>
                  ) : (
                    <span className="asset-item asset-item-none">Not linked to a video</span>
                  )}
                  <button className="btn" onClick={() => copyLink(asset)}>
                    {copiedId === asset.id ? "Copied" : "Copy link"}
                  </button>
                  <a className="btn primary" href={asset.url} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">
            {assets.length
              ? "No assets match that search or filter."
              : "No assets yet. Add a Google Drive link to a thumbnail, script doc or footage folder to keep it here."}
          </div>
        </div>
      )}

      {dialogAsset ? (
        <AssetDialog
          initial={dialogAsset === "new" ? null : dialogAsset}
          itemOptions={itemOptions}
          onClose={() => setDialogAsset(null)}
          onSave={handleSave}
          onDelete={dialogAsset !== "new" ? handleDelete : undefined}
        />
      ) : null}
    </>
  );
}
