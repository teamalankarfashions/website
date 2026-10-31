"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./Store";
import { IconBag, IconHeart, IconMenu, IconSearch, IconUser } from "./Icons";
import CartDrawer from "./CartDrawer";
import { LOGO_RED } from "@/lib/supabase";

type Nav = { slug: string; name: string; name_mr: string | null; image_url: string | null; children: { slug: string; name: string; name_mr: string | null }[] }[];

export default function Header({ nav, announcements, phone }: { nav: Nav; announcements: string[]; phone: string }) {
  const { count, wish, drawer, setDrawer } = useStore();
  const [ri, setRi] = useState(0);
  const [search, setSearch] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (announcements.length < 2) return;
    const t = setInterval(() => setRi((i) => (i + 1) % announcements.length), 3800);
    return () => clearInterval(t);
  }, [announcements.length]);

  return (
    <>
      {announcements.length > 0 && (
        <div className="announce" role="region" aria-label="Offers">
          <div className="wrap">
            <span className="side">Mangalwar Peth, Kolhapur</span>
            <div className="rot">{announcements.map((a, i) => <span key={i} className={i === ri ? "on" : ""} aria-hidden={i !== ri}>{a}</span>)}</div>
            <span className="side">{phone}</span>
          </div>
        </div>
      )}
      <header className="site">
        <div className="wrap hdr">
          <button className="icon-btn burger" aria-label="Open menu" onClick={() => setDrawer("menu")}><IconMenu /></button>
          <nav className="main" aria-label="Main">
            {nav.map((c) => (
              <div key={c.slug}>
                <Link className="top" href={`/collections/${c.slug}`}>{c.name}</Link>
                {c.children.length > 0 && (
                  <div className="mega">
                    <ul>
                      {c.children.map((s) => <li key={s.slug}><Link href={`/collections/${s.slug}`}>{s.name} <span>{s.name_mr}</span></Link></li>)}
                      <li><Link href={`/collections/${c.slug}`} style={{ color: "var(--sindoor)" }}>Shop all {c.name} →</Link></li>
                    </ul>
                    {c.image_url && <img src={c.image_url.replace("w=1200", "w=320")} alt="" loading="lazy" />}
                  </div>
                )}
              </div>
            ))}
            <div><Link className="top" href="/collections/all?sort=new" style={{ color: "var(--sindoor)" }}>New</Link></div>
          </nav>
          <Link className="brand" href="/" aria-label="Alankar Fashions home"><img src={LOGO_RED} alt="अलंकार Alankar Fashions" width={806} height={315} /></Link>
          <div className="tools">
            <button className="icon-btn" aria-label="Search" aria-expanded={search} onClick={() => setSearch((s) => !s)}><IconSearch /></button>
            <Link className="icon-btn hide-sm" href="/account" aria-label="My account"><IconUser /></Link>
            <Link className="icon-btn hide-sm" href="/wishlist" aria-label="Wishlist"><IconHeart />{wish.length > 0 && <span className="count">{wish.length}</span>}</Link>
            <button className="icon-btn" aria-label={`Open bag, ${count} items`} onClick={() => setDrawer("bag")}><IconBag /><span className="count">{count}</span></button>
          </div>
        </div>
        {search && (
          <div className="searchbar"><div className="wrap">
            <form role="search" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get("q"); setSearch(false); router.push(`/search?q=${encodeURIComponent(String(q ?? ""))}`); }}>
              <label htmlFor="hq" className="sr">Search jewellery</label>
              <input id="hq" name="q" className="input" placeholder="Search Saj, Thushi, jhumka, kundan…" autoFocus />
              <button className="btn btn-dark" type="submit">Search</button>
            </form>
          </div></div>
        )}
      </header>

      <div className={`scrim${drawer ? " on" : ""}`} onClick={() => setDrawer(null)} />
      <CartDrawer />
      <aside className={`drawer left${drawer === "menu" ? " on" : ""}`} aria-label="Menu" aria-hidden={drawer !== "menu"}>
        <div className="dh"><img src={LOGO_RED} alt="Alankar Fashions" style={{ height: 44, width: "auto" }} /><button aria-label="Close menu" onClick={() => setDrawer(null)}>✕</button></div>
        <div className="db mnav" onClick={(e) => (e.target as HTMLElement).closest("a") && setDrawer(null)}>
          {nav.map((c) => (
            <div key={c.slug}>
              <Link href={`/collections/${c.slug}`}>{c.name}<span>{c.name_mr}</span></Link>
              {c.children.length > 0 && <div className="sub">{c.children.map((s) => <Link key={s.slug} href={`/collections/${s.slug}`}>{s.name}</Link>)}</div>}
            </div>
          ))}
          <Link href="/collections/all?sort=new" style={{ color: "var(--sindoor)" }}>New in<span>नवीन</span></Link>
          <Link href="/wishlist">Wishlist<span /></Link>
          <Link href="/account">My account<span /></Link>
          <Link href="/track-order">Track order<span /></Link>
          <Link href="/contact">Contact<span /></Link>
        </div>
      </aside>
    </>
  );
}
