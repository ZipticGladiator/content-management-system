import { requireOwnerSession, getCurrentOrg } from "@/lib/org";
import { addCategory, deleteCategory, renameCategory, updateOrgProfile } from "@/app/settings/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { session, db } = await requireOwnerSession();
  const [org, categories] = await Promise.all([
    getCurrentOrg(session.orgId),
    db.category.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!org) throw new Error("Organization not found");

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="sub">Workspace name, branding and content categories.</p>
        </div>
      </header>

      {error ? (
        <div className="notice" style={{ color: "var(--danger)", marginBottom: 16 }}>
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Workspace</h2>
        <form action={updateOrgProfile} className="bar" style={{ alignItems: "flex-end" }}>
          <label className="f">
            Name
            <input type="text" name="name" defaultValue={org.name} required />
          </label>
          <label className="f">
            Accent color
            <input type="color" name="accentColor" defaultValue={org.accentColor} style={{ height: 38, width: 60 }} />
          </label>
          <button className="btn primary" type="submit">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Categories</h2>
        <p className="sub" style={{ marginTop: 0, marginBottom: 12 }}>
          These replace the fixed Educational / Technical / Lifestyle labels — rename or add your own, used across
          YouTube and TikTok items.
        </p>
        <div className="tablewrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <form action={renameCategory.bind(null, c.id)} className="bar" style={{ gap: 8 }}>
                      <input type="text" name="label" defaultValue={c.label} required />
                      <button className="btn" type="submit">
                        Rename
                      </button>
                    </form>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <form action={deleteCategory.bind(null, c.id)}>
                      <button className="btn danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={addCategory} className="bar" style={{ alignItems: "flex-end" }}>
          <label className="f">
            New category
            <input type="text" name="label" placeholder="e.g. Tutorials" required />
          </label>
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
