/**
 * Musa bridge — import the logged-in user's generated media into the editor.
 * Auth is the shared .musa-chat.com session cookie (credentials: include).
 */
const MUSA = process.env.NEXT_PUBLIC_MUSA_API || "";

export type MusaAsset = { id: string; kind: "video" | "image" | "audio"; url: string; name: string };

export async function fetchMusaAssets(): Promise<MusaAsset[]> {
  if (!MUSA) return [];
  try {
    const r = await fetch(`${MUSA}/api/editor/assets`, { credentials: "include" });
    if (!r.ok) return [];
    return (await r.json()).assets ?? [];
  } catch {
    return [];
  }
}

/** Download a Musa asset as a File so it flows through OpenCut's normal import pipeline. */
export async function musaAssetToFile(a: MusaAsset): Promise<File> {
  const r = await fetch(`${MUSA}${a.url}`, { credentials: "include" });
  const blob = await r.blob();
  const ext = blob.type.includes("mp4") ? "mp4"
    : blob.type.includes("webm") ? "webm"
    : blob.type.includes("png") ? "png"
    : blob.type.includes("mpeg") || blob.type.includes("mp3") ? "mp3"
    : "jpg";
  const safe = (a.name || "musa").replace(/[\\/:*?"<>|]+/g, " ").slice(0, 48);
  return new File([blob], `${safe}.${ext}`, { type: blob.type });
}
