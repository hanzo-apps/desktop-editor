import Base from "@hanzo/base";

/**
 * The template's backend: one Hanzo Base instance. A fork points at its own by
 * setting VITE_BASE_URL — no code edit. Both halves of the app (Tauri window
 * and web preview) talk to the same collections, so a record written on the
 * desktop shows up in the browser.
 */
export const base = new Base(
  import.meta.env.VITE_BASE_URL ?? "https://base.hanzo.ai",
);

export type Sync = { ok: boolean; note: string };

/** Push rows to a Base collection, reporting the outcome instead of throwing:
 *  an unconfigured fork must still render, just with "offline" in the status
 *  bar. Local state is always the source of truth for the UI. */
export async function push(
  collection: string,
  rows: Record<string, unknown>[],
): Promise<Sync> {
  try {
    const c = base.collection(collection);
    for (const r of rows) await c.create(r);
    return { ok: true, note: `synced ${rows.length} -> ${collection}` };
  } catch (e) {
    return { ok: false, note: `base offline (${(e as Error).message})` };
  }
}

/** Read a Base collection, empty on any failure — same rule as push(). */
export async function pull<T>(collection: string): Promise<T[]> {
  try {
    return (await base.collection(collection).getFullList()) as T[];
  } catch {
    return [];
  }
}
