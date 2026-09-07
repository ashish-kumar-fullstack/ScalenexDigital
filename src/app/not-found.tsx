import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state full-height">
      <span className="eyebrow">404 / A DIFFERENT DIRECTION</span>
      <h1>This page isn’t here.</h1>
      <p>Let’s get you back on track.</p>
      <Link className="button button-primary" href="/">
        Back to home
      </Link>
    </main>
  );
}
