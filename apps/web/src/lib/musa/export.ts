/** Musa bridge — save the rendered video back to Musa (appears in Мастерская). */
const MUSA = process.env.NEXT_PUBLIC_MUSA_API || "";

export async function saveToMusa(data: ArrayBuffer | Blob, name = "Монтаж", mime = "video/mp4") {
  if (!MUSA) throw new Error("NEXT_PUBLIC_MUSA_API not set");
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const fd = new FormData();
  fd.append("file", blob, `${name}.mp4`);
  fd.append("name", name);
  const r = await fetch(`${MUSA}/api/editor/export`, { method: "POST", credentials: "include", body: fd });
  if (!r.ok) throw new Error("save to Musa failed");
  return r.json() as Promise<{ ok: boolean; jobId: string; url: string }>;
}
