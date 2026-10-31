import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap"><div className="empty" style={{ paddingBlock: 96 }}>
      <h1 style={{ fontSize: 40 }}>This page isn&apos;t here</h1>
      <p>It may have moved. Try our collections instead.</p>
      <div className="ctas" style={{ justifyContent: "center" }}><Link className="btn btn-dark" href="/collections/all">Shop jewellery</Link><Link className="btn btn-ghost" href="/">Home</Link></div>
    </div></div>
  );
}
