"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { browserClient } from "@/lib/supabase";

export type Role = "owner" | "manager" | "staff";
type Ctx = { email: string; role: Role; can: (min: Role) => boolean; notify: (msg: string, bad?: boolean) => void };
export const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;
export const sb = () => browserClient();

export function useNotify() {
  const [t, setT] = useState<{ msg: string; bad?: boolean } | null>(null);
  const notify = useCallback((msg: string, bad = false) => { setT({ msg, bad }); setTimeout(() => setT(null), 3000); }, []);
  const node = t ? <div className={`atoast${t.bad ? " bad" : ""}`} role="status">{t.msg}</div> : null;
  return { notify, node };
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="afield"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

/** Resize + convert to WebP in the browser, then upload to Supabase Storage. Returns the public URL. */
export async function uploadImage(file: File, folder = "products", maxW = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/webp", 0.85));
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await sb().storage.from("product-images").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb().storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export function ImageList({ images, onChange, folder = "products", max = 8 }: { images: { url: string; alt?: string }[]; onChange: (v: { url: string; alt?: string }[]) => void; folder?: string; max?: number }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useAdmin();
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: { url: string; alt?: string }[] = [];
      for (const f of Array.from(files).slice(0, max - images.length)) urls.push({ url: await uploadImage(f, folder) });
      onChange([...images, ...urls]);
    } catch (e) { notify(`Upload failed: ${(e as Error).message}`, true); }
    setBusy(false);
  }
  const move = (i: number, d: number) => { const n = [...images]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  return (
    <div className="imgs">
      {images.map((im, i) => (
        <div className="it" key={im.url + i}>
          <img src={im.url} alt="" />
          <div className="bar">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">←</button>
            <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} aria-label="Remove image">✕</button>
            <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move right">→</button>
          </div>
        </div>
      ))}
      {images.length < max && (
        <label className="drop">{busy ? "Uploading…" : <>+ Add photos<br />(JPG/PNG, auto-compressed)</>}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} disabled={busy} />
        </label>
      )}
    </div>
  );
}

export function SingleImage({ url, onChange, folder = "site" }: { url: string; onChange: (u: string) => void; folder?: string }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ImageList images={url ? [{ url }] : []} max={1} folder={folder} onChange={(v) => onChange(v[0]?.url ?? "")} />
      <input placeholder="…or paste an image URL" value={url} onChange={(e) => onChange(e.target.value)} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
    </div>
  );
}
