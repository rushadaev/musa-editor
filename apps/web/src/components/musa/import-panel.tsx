"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchMusaAssets, musaAssetToFile, musaUrl, type MusaAsset } from "@/lib/musa/import";

/**
 * Browse the user's Musa generations as lightweight thumbnails (loaded by URL,
 * no download) and import only the ones clicked — instead of bulk-downloading
 * the entire library, which hangs the browser.
 */
export function MusaImportPanel({ onImport }: { onImport: (files: File[]) => Promise<void> | void }) {
	const [assets, setAssets] = useState<MusaAsset[]>([]);
	const [state, setState] = useState<"loading" | "ready" | "auth" | "empty" | "error">("loading");
	const [busy, setBusy] = useState<Set<string>>(new Set());
	const loaded = useRef(false);

	const load = async () => {
		setState("loading");
		const res = await fetchMusaAssets();
		if (!res.ok) { setState(res.status === 401 ? "auth" : "error"); return; }
		if (!res.assets.length) { setState("empty"); return; }
		setAssets(res.assets);
		setState("ready");
	};
	useEffect(() => { if (!loaded.current) { loaded.current = true; load(); } }, []);

	const importOne = async (a: MusaAsset) => {
		setBusy((p) => new Set(p).add(a.id));
		try {
			const file = await musaAssetToFile(a);
			await onImport([file]);
		} catch {
			toast.error("Не удалось импортировать");
		} finally {
			setBusy((p) => { const n = new Set(p); n.delete(a.id); return n; });
		}
	};

	if (state === "loading") return <div className="p-3 text-xs text-muted-foreground">Загружаю материалы Музы…</div>;
	if (state === "auth") return <div className="p-3 text-xs text-muted-foreground">Войдите в Музу (musa-chat.com), затем обновите редактор. <button onClick={load} className="text-primary underline">Повторить</button></div>;
	if (state === "empty") return <div className="p-3 text-xs text-muted-foreground">В Музе пока нет готовых работ.</div>;
	if (state === "error") return <div className="p-3 text-xs text-muted-foreground">Не удалось получить материалы. <button onClick={load} className="text-primary underline">Повторить</button></div>;

	return (
		<div className="flex flex-col min-h-0">
			<div className="px-2 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
				<span>Из Музы ({assets.length}) — нажми, чтобы добавить</span>
				<button onClick={load} className="text-primary hover:underline">↻</button>
			</div>
			<div className="grid grid-cols-2 gap-1.5 px-2 pb-2 overflow-y-auto">
				{assets.map((a) => (
					<button
						key={a.id}
						type="button"
						disabled={busy.has(a.id)}
						onClick={() => importOne(a)}
						title={a.name}
						className="relative rounded-md overflow-hidden bg-secondary border border-border hover:border-primary transition disabled:opacity-50 aspect-square"
					>
						{a.kind === "image" && <img src={musaUrl(a.url)} alt="" loading="lazy" className="w-full h-full object-cover" />}
						{a.kind === "video" && <video src={`${musaUrl(a.url)}#t=0.1`} preload="metadata" muted className="w-full h-full object-cover" />}
						{a.kind === "audio" && <span className="flex h-full items-center justify-center text-lg">🎵</span>}
						{busy.has(a.id) && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-white">…</span>}
					</button>
				))}
			</div>
		</div>
	);
}
