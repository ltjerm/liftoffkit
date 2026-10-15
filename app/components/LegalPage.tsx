import type { ReactNode } from "react";

export const LEGAL_UPDATED = "October 15, 2026";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="site">
      <main className="wrap legal">
        <p className="legal-back"><a href="/">← LiftoffKit</a></p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {LEGAL_UPDATED}</p>
        {children}
        <p className="legal-back"><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></p>
      </main>
    </div>
  );
}
