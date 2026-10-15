import type { CSSProperties } from "react";
import UrlForm from "./components/UrlForm";
import PricingCta from "./components/PricingCta";
import LaunchDemo from "./components/LaunchDemo";
import Motion from "./components/Motion";

const d = (i: number) => ({ "--d": i } as CSSProperties);

const chores = [
  "Write five headline options and pick one",
  "Export favicons in every size browsers ask for",
  "Resize the OG image for X, LinkedIn and GitHub",
  "Put screenshots in device frames for the stores",
  "Draft a privacy policy and terms",
  "Plan a week of launch posts",
];

const steps = [
  ["T–2", "Paste your URL", "We open your live site in a real browser and read your name, features, colors, fonts and the services you use."],
  ["T–1", "We build the kit", "Copy, logo, favicons, social images, store mockups, legal drafts and a 7-day X plan, all based on what your app actually does."],
  ["T–0", "It lands in your inbox", "Your kit arrives as one ZIP. Liftoff+ also gets a hosted landing page, set up by us within 3 business days of purchase."],
];

const ticker = [
  "landing.md", "favicon.ico", "apple-touch-icon.png", "og-1200x630.png", "x-header.png", "linkedin.png",
  "iphone-6.9-01.png", "play-feature.png", "producthunt-01.png", "privacy.md", "terms.md", "x-plan.csv", "site.webmanifest",
];

const faqs = [
  ["What do I need to provide?", "A public URL and an email for delivery. Legal drafts include clearly marked placeholders for details we can't know, like your company name and contact email."],
  ["How is the kit delivered?", "After checkout we generate your kit and email it to you as a ZIP."],
  ["Will it invent features or stats?", "Copy is written from what's on your site, and any number we can't find there is flagged for you to check. Always review AI-written copy before publishing."],
  ["Does it work for mobile apps?", "It works from a website, so point it at your app's site. Store-sized screenshots are built from your mobile site. Swap in real in-app screens before submitting to the App Store or Google Play."],
  ["What's the difference between Liftoff and Liftoff+?", "Liftoff ($29) is the downloadable kit. Liftoff+ ($79) adds a hosted landing page built from your kit. Your kit arrives by email right away; we set up and send the hosted page within 3 business days."],
];

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <path d="M16 6.5c3.6 2.6 5 6.3 4.3 11.2l-2.1 2.1h-4.4l-2.1-2.1C11 12.8 12.4 9.1 16 6.5Z" fill="var(--signal)" />
      <circle cx="16" cy="13.2" r="1.7" fill="var(--paper)" />
      <path d="M14.2 21.6h3.6L16 26.2Z" fill="var(--paper)" opacity=".85" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="site">
      <Motion />
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="logo" href="/"><Mark />LiftoffKit</a>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#kit">The kit</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a className="nav-cta" href="#top">Get your kit <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <div className="hero-grid-bg" aria-hidden="true" />
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <p className="kicker rise" style={d(0)}><span className="live-dot" />Launch kits for indie apps &amp; side projects</p>
              <h1 className="hero-title">
                <span className="line rise" style={d(1)}>Paste your URL.</span>
                <span className="line rise" style={d(2)}>Get the whole</span>
                <span className="line rise" style={d(3)}><em>launch kit.</em></span>
              </h1>
              <p className="hero-lead rise" style={d(4)}>
                Landing copy, logo and favicons, social images, App Store and Product Hunt shots, privacy and terms drafts,
                and a 7-day X launch plan. All generated from your live site, in your colors.
              </p>
              <div className="rise" style={d(5)}><UrlForm /></div>
              <ul className="hero-facts rise" style={d(6)}>
                <li><strong>$29</strong> one-time</li>
                <li>No subscription</li>
                <li>Delivered as a ZIP</li>
              </ul>
            </div>
            <div className="hero-demo rise" style={d(3)}>
              <div className="orbit" aria-hidden="true"><i /></div>
              <LaunchDemo />
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((k) => (
              <div className="ticker-row" key={k}>
                {ticker.map((f) => <span key={f}>{f}<b>✦</b></span>)}
              </div>
            ))}
          </div>
        </div>

        {/* CHORES */}
        <section className="wrap chores">
          <div className="chores-head" data-reveal>
            <p className="label">The part nobody likes</p>
            <h2 className="title">You built the app. <em>Then</em> comes the launch checklist.</h2>
          </div>
          <ol className="chore-list" data-reveal>
            {chores.map((c, i) => (
              <li key={c} style={d(i)}><span className="chore-num">{String(i + 1).padStart(2, "0")}</span><span className="chore-text">{c}</span></li>
            ))}
          </ol>
          <p className="chores-foot" data-reveal>LiftoffKit crosses off the whole list from one URL, so launch day is about shipping.</p>
        </section>

        {/* HOW */}
        <section className="how" id="how">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <p className="label">Launch sequence</p>
              <h2 className="title">From URL to launch day in three steps.</h2>
            </div>
            <div className="sequence" data-progress>
              <div className="seq-track" aria-hidden="true"><i /></div>
              {steps.map(([t, h, p], i) => (
                <div className="seq-step" key={t} data-reveal style={d(i)}>
                  <span className="seq-t">{t}</span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KIT */}
        <section className="wrap kit" id="kit">
          <div className="section-head split" data-reveal>
            <div>
              <p className="label">What&apos;s in the kit</p>
              <h2 className="title">Every launch asset, <em>one download.</em></h2>
            </div>
            <p className="section-lead">Built from one brand brief, so every file shares the same colors, fonts and voice. Hover around.</p>
          </div>

          <div className="bento">
            <article className="tile t-copy" data-reveal style={d(0)}>
              <div className="mock mock-copy" aria-hidden="true">
                <span className="file-tag">copy/landing.md</span>
                <p className="mc-h">
                  <span>Dinner, decided in ten seconds.</span>
                  <span>Your fridge, finally organized.</span>
                  <span>Meal plans that write themselves.</span>
                </p>
                <div className="mc-lines"><i /><i /><i /></div>
                <div className="mc-chips"><span>H1 ×5</span><span>FAQ</span><span>SEO</span><span>PH tagline</span></div>
              </div>
              <h3>Landing page copy</h3>
              <p>Headline options, subhead, features, FAQ, SEO title and description, Product Hunt tagline and maker comment.</p>
            </article>

            <article className="tile t-store" data-reveal style={d(1)}>
              <div className="mock mock-store" aria-hidden="true">
                <div className="phone p1"><div className="screen"><b /><i /><i /><i className="short" /><u /></div></div>
                <div className="phone p2"><div className="screen"><b /><u /><i /><i className="short" /></div></div>
              </div>
              <h3>Store &amp; Product Hunt shots</h3>
              <p>iPhone 6.9″ and Google Play screenshots in device frames, a Play feature graphic and a Product Hunt gallery.</p>
            </article>

            <article className="tile t-logo" data-reveal style={d(2)}>
              <div className="mock mock-logo" aria-hidden="true">
                {[16, 24, 36, 52, 72].map((s, i) => (
                  <span key={s} className="fav" style={{ ...d(i), width: s, height: s }}><em>{s === 72 ? "512" : s === 52 ? "180" : s}</em></span>
                ))}
              </div>
              <h3>Logo + favicon set</h3>
              <p>Logo mark, light and dark wordmarks, favicon.ico, Apple touch icon, web manifest and a paste-in &lt;head&gt; snippet.</p>
            </article>

            <article className="tile t-og" data-reveal style={d(3)}>
              <div className="mock mock-og" aria-hidden="true">
                <div className="og og-3"><span>LinkedIn</span></div>
                <div className="og og-2"><span>X header</span></div>
                <div className="og og-1"><strong>Tidyplate</strong><small>Dinner, decided.</small><span className="og-size">1200×630</span></div>
              </div>
              <h3>OG &amp; social images</h3>
              <p>OG 1200×630, X post and header, LinkedIn and GitHub previews, with your text rendered crisply on top.</p>
            </article>

            <article className="tile t-legal" data-reveal style={d(4)}>
              <div className="mock mock-legal" aria-hidden="true">
                <div className="doc">
                  <b>Privacy Policy</b>
                  <i /><i /><span className="ph">[COMPANY NAME]</span><i /><i className="short" />
                  <div className="svc"><span>Stripe</span><span>Vercel</span><span>PostHog</span></div>
                </div>
              </div>
              <h3>Privacy policy + terms</h3>
              <p>Template-based drafts that list the third-party services found on your site. Review before publishing.</p>
            </article>

            <article className="tile t-plan" data-reveal style={d(5)}>
              <div className="mock mock-plan" aria-hidden="true">
                {["Teaser", "Teaser", "Launch", "Feature", "Feature", "Story", "Lessons"].map((l, i) => (
                  <div key={i} className={`day${i === 2 ? " big" : ""}`} style={d(i)}>
                    <span className="day-n">D{i + 1}</span>
                    <span className="day-l">{l}</span>
                    <span className="day-t">{["9:00", "17:30", "8:00", "12:15", "10:00", "16:00", "11:00"][i]}</span>
                  </div>
                ))}
              </div>
              <h3>7-day X launch plan</h3>
              <p>Teaser, launch day, feature spotlights and lessons, with posting times, attachments and a CSV export.</p>
            </article>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing" id="pricing">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <p className="label">Pricing</p>
              <h2 className="title">Pay once per launch. <em>Keep everything.</em></h2>
            </div>
            <div className="price-grid">
              <div className="price-card" data-reveal style={d(0)}>
                <div className="price-top">
                  <h3>Liftoff</h3>
                  <p className="price-amount"><sup>$</sup>29<span>one-time</span></p>
                  <p className="price-desc">The full downloadable launch kit.</p>
                </div>
                <ul className="price-list">
                  <li>Landing copy, SEO and Product Hunt text</li>
                  <li>Logo, favicon set, OG and social images</li>
                  <li>Store and Product Hunt screenshots</li>
                  <li>Privacy policy and terms drafts</li>
                  <li>7-day X launch plan (MD + CSV)</li>
                </ul>
                <PricingCta tier="liftoff" label="Get Liftoff" />
              </div>
              <div className="price-card featured" data-reveal style={d(1)}>
                <span className="price-badge">Most complete</span>
                <div className="price-top">
                  <h3>Liftoff+</h3>
                  <p className="price-amount"><sup>$</sup>79<span>one-time</span></p>
                  <p className="price-desc">The kit, plus a hosted landing page.</p>
                </div>
                <ul className="price-list">
                  <li>Everything in Liftoff</li>
                  <li><strong>Hosted landing page</strong>, set up by us within 3 business days of purchase</li>
                </ul>
                <PricingCta tier="liftoff-plus" label="Get Liftoff+" featured />
              </div>
            </div>
            <p className="price-note" data-reveal>Secure checkout with Stripe. One payment, no subscription.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="wrap faq" id="faq">
          <div className="faq-grid">
            <div className="section-head" data-reveal>
              <p className="label">FAQ</p>
              <h2 className="title">Good questions.</h2>
              <p className="faq-disclaimer">Generated privacy policies and terms are templates, not legal advice. Review them, ideally with a lawyer, before publishing.</p>
            </div>
            <div className="faq-list" data-reveal>
              {faqs.map(([q, a]) => (
                <details className="faq-item" key={q}>
                  <summary>{q}<span className="faq-plus" aria-hidden="true" /></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="wrap">
          <div className="cta" data-reveal>
            <div className="cta-rocket" aria-hidden="true">
              <svg viewBox="0 0 64 128">
                <path d="M32 4c11 8 15 20 13 36v30l-6 8H25l-6-8V40C17 24 21 12 32 4Z" fill="var(--paper)" />
                <circle cx="32" cy="38" r="6" fill="var(--signal)" stroke="var(--ink)" strokeWidth="3" />
                <path d="M19 56 8 72v12l11-6ZM45 56l11 16v12l-11-6Z" fill="var(--ink)" />
                <path className="flame" d="M25 80h14l-7 34Z" fill="#ffd27a" />
              </svg>
              <span className="trail" />
            </div>
            <div className="cta-copy">
              <h2>Ship the launch,<br /><em>not the busywork.</em></h2>
              <p>Paste your URL to get started. Your kit is built from your live site.</p>
              <UrlForm buttonLabel="Get your kit" />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="footer-brand"><Mark /><strong>LiftoffKit</strong> · © {new Date().getFullYear()}</span>
          <span className="footer-links"><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></span>
        </div>
        <div className="footer-word" aria-hidden="true">LiftoffKit</div>
      </footer>
    </div>
  );
}
