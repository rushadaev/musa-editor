/**
 * Musa bridge — import the logged-in user's generated media into the editor.
 * Auth is the shared .musa-chat.com session cookie (credentials: include).
 */
const MUSA = process.env.NEXT_PUBLIC_MUSA_API || "";

export type MusaAsset = { id: string; kind: "video" | "image" | "audio"; url: string; name: string };
export type MusaFetch = { ok: boolean; status: number; assets: MusaAsset[]; error?: string };

/** Absolute Musa URL for a relative bridge path (assets return relative urls). */
export function musaUrl(path: string): string { return `${MUSA}${path}`; }

export async function fetchMusaAssets(): Promise<MusaFetch> {
  if (!MUSA) return { ok: false, status: 0, assets: [], error: "NEXT_PUBLIC_MUSA_API not set" };
  try {
    const r = await fetch(`${MUSA}/api/editor/assets`, { credentials: "include" });
    if (!r.ok) return { ok: false, status: r.status, assets: [], error: `HTTP ${r.status}` };
    const data = await r.json();
    return { ok: true, status: 200, assets: data.assets ?? [] };
  } catch (e) {
    return { ok: false, status: -1, assets: [], error: e instanceof Error ? e.message : "network error" };
  }
}

/** Download a Musa asset as a File so it flows through OpenCut's normal import pipeline. */
export async function musaAssetToFile(a: MusaAsset): Promise<File> {
  const r = await fetch(musaUrl(a.url), { credentials: "include" });
  const blob = await r.blob();
  const ext = blob.type.includes("mp4") ? "mp4"
    : blob.type.includes("webm") ? "webm"
    : blob.type.includes("png") ? "png"
    : blob.type.includes("mpeg") || blob.type.includes("mp3") ? "mp3"
    : "jpg";
  const safe = (a.name || "musa").replace(/[\\/:*?"<>|]+/g, " ").slice(0, 48);
  return new File([blob], `${safe}.${ext}`, { type: blob.type });
}
