"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state full-height">
      <h1>Something didn’t load.</h1>
      <p>
        Please try again. If the problem continues, contact ScaleNex Digital.
      </p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
