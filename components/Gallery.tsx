"use client";
import { useState } from "react";
import type { Img } from "@/lib/types";

export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const list = images.length ? images : [{ url: "", alt: name }];
  return (
    <div className="gallery">
      {list.length > 1 && (
        <div className="thumbs">
          {list.map((im, k) => (
            <button key={k} aria-current={k === i} aria-label={`Show image ${k + 1}`} onClick={() => setI(k)}><img src={im.url.replace("w=1200", "w=200")} alt="" /></button>
          ))}
        </div>
      )}
      <div
        className={`main${zoom ? " zoom" : ""}`}
        style={list.length > 1 ? undefined : { gridColumn: "1 / -1" }}
        onClick={() => setZoom((z) => !z)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
        onMouseLeave={() => setZoom(false)}
        role="button" aria-label={zoom ? "Zoom out" : "Zoom in"} tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setZoom((z) => !z)}
      >
        {list[i].url && <img src={list[i].url.replace("w=1200", "w=1400")} alt={list[i].alt || name} style={{ transformOrigin: origin }} fetchPriority="high" />}
      </div>
    </div>
  );
}
