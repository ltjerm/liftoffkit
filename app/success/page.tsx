import { getStripe } from "../../src/lib/billing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thanks — LiftoffKit", robots: { index: false } };

export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const stripe = getStripe();
  let paid = false, email: string | null = null, appUrl: string | null = null, tier: string | null = null;
  if (stripe && session_id && /^cs_(test|live)_[A-Za-z0-9]+$/.test(session_id)) {
    try {
      const s = await stripe.checkout.sessions.retrieve(session_id);
      paid = s.payment_status === "paid";
      email = s.customer_details?.email ?? null;
      appUrl = s.metadata?.app_url ?? null;
      tier = s.metadata?.tier ?? null;
    } catch { /* fall through */ }
  }
  return (
    <div className="site">
      <main className="wrap success">
        {paid ? (
          <>
            <h1>You&apos;re cleared for <span className="accent">liftoff.</span></h1>
            <p className="hero-lead">Payment received. We&apos;re generating the kit for <strong>{appUrl}</strong> and will email it to <strong>{email}</strong> when it&apos;s ready.</p>
            {tier === "liftoff-plus" && (
              <p className="hero-lead">Your Liftoff+ hosted landing page follows within 3 business days of purchase. We&apos;ll set it up and send it to you.</p>
            )}
          </>
        ) : (
          <>
            <h1>We couldn&apos;t confirm that payment.</h1>
            <p className="hero-lead">If you completed checkout and were charged, keep your Stripe receipt and contact us — we&apos;ll sort it out.</p>
          </>
        )}
        <p className="hero-meta"><a href="/">← Back to LiftoffKit</a></p>
      </main>
    </div>
  );
}
