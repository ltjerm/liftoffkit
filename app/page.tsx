import UrlForm from "./components/UrlForm";
import PricingCta from "./components/PricingCta";


const steps = [
  ["Paste your URL", "We load your live site in a real browser and read your name, features, colors, fonts and the services you use."],
  ["We generate the kit", "Copy, logo, favicons, social images, store mockups, legal drafts and a 7-day X plan, built from what your app actually does."],
  ["Get it by email", "Your kit arrives as a ZIP. Liftoff+ adds a hosted landing page, set up by us within 3 business days of purchase."],
];

const kit = [
  ["✍️", "Landing page copy", "Headline options, subhead, features, FAQ, SEO title and description, Product Hunt tagline and maker comment."],
  ["🎨", "Logo + favicon set", "Logo mark, light/dark wordmarks, favicon.ico, Apple touch icon, web manifest and a paste-in <head> snippet."],
  ["🖼️", "OG & social images", "OG 1200×630, X post and header, LinkedIn and GitHub previews — with your text rendered crisply on top."],
  ["📱", "Store & Product Hunt shots", "iPhone 6.9″ and Google Play screenshots in device frames, Play feature graphic, Product Hunt gallery."],
  ["⚖️", "Privacy policy + terms", "Template-based drafts that list the third-party services detected on your site. Review before publishing."],
  ["🚀", "7-day X launch plan", "Teaser → launch day → feature spotlights → lessons, with posting times, attachments and a CSV export."],
];

const faqs = [
  ["What do I need to provide?", "A public URL and an email for delivery. Legal drafts include clearly marked placeholders for details we can't know, like your company name and contact email."],
  ["How is the kit delivered?", "After checkout we generate your kit and email it to you as a ZIP."],
  ["Will it invent features or stats?", "Copy is written from what's on your site, and any number we can't find there is flagged for you to check. Always review AI-written copy before publishing."],
  ["Does it work for mobile apps?", "It works from a website, so point it at your app's site. Store-sized screenshots are built from your mobile site — swap in real in-app screens before submitting to the App Store or Google Play."],
  ["What's the difference between Liftoff and Liftoff+?", "Liftoff ($29) is the downloadable kit. Liftoff+ ($79) adds a hosted landing page built from your kit. Your kit arrives by email right away; we set up and send the hosted page within 3 business days."],
];

export default function Home() {
  return (
    <div className="site">
      <header className="wrap nav">
        <a className="logo" href="/"><span className="logo-mark">L</span>LiftoffKit</a>
        <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#kit">What&apos;s in the kit</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a className="nav-cta" href="#top">Get your kit</a>
        </nav>
      </header>

      <main>
        <section className="wrap hero" id="top">
          <p className="eyebrow"><span className="eyebrow-dot" />Launch kits for indie apps</p>
          <h1>Paste your app URL. <span className="accent">Get your whole launch kit.</span></h1>
          <p className="hero-lead">Landing copy, logo & favicons, OG and social images, App Store and Product Hunt screenshots, privacy & terms, and a 7-day X launch plan — generated from your live site.</p>
          <UrlForm />
          <p className="hero-meta"><strong>$29</strong> Liftoff · <strong>$79</strong> Liftoff+ with hosted landing page (set up within 3 business days)</p>
        </section>

        <section className="wrap" id="how">
          <div className="center-head">
            <p className="section-label">How it works</p>
            <h2 className="section-title">Three steps from URL to launch day</h2>
          </div>
          <div className="steps">
            {steps.map(([t, d], i) => (
              <div className="step" key={t}><span className="step-num">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </section>

        <section className="wrap" id="kit">
          <div className="center-head">
            <p className="section-label">What&apos;s in the kit</p>
            <h2 className="section-title">The launch assets, in one download</h2>
            <p className="section-lead">Built from one brand brief, so every asset uses the same colors and voice.</p>
          </div>
          <div className="kit-grid">
            {kit.map(([icon, t, d]) => (
              <div className="kit-item" key={t}><span className="kit-icon">{icon}</span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </section>

        <section className="wrap pricing" id="pricing">
          <div className="center-head">
            <p className="section-label">Pricing</p>
            <h2 className="section-title">Pay once per launch</h2>
          </div>
          <div className="price-grid">
            <div className="price-card">
              <h3>Liftoff</h3>
              <p className="price-amount">$29 <span>one-time</span></p>
              <p className="price-desc">The full downloadable launch kit.</p>
              <ul className="price-list">
                <li>Everything in the kit</li>
                <li>Landing copy + SEO + Product Hunt text</li>
                <li>Logo, favicon set, OG & social images</li>
                <li>Store & Product Hunt screenshots</li>
                <li>Privacy policy + terms drafts</li>
                <li>7-day X launch plan (MD + CSV)</li>
              </ul>
              <PricingCta tier="liftoff" label="Get Liftoff" />
            </div>
            <div className="price-card featured">
              <span className="price-badge">Most complete</span>
              <h3>Liftoff+</h3>
              <p className="price-amount">$79 <span>one-time</span></p>
              <p className="price-desc">The kit, plus a hosted landing page.</p>
              <ul className="price-list">
                <li>Everything in Liftoff</li>
                <li>Hosted landing page, set up by us within 3 business days of purchase</li>
              </ul>
              <PricingCta tier="liftoff-plus" label="Get Liftoff+" featured />
            </div>
          </div>
        </section>

        <section className="wrap" id="faq">
          <div className="center-head">
            <p className="section-label">FAQ</p>
            <h2 className="section-title">Questions</h2>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a]) => (
              <details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <p className="faq-disclaimer">Generated privacy policies and terms are templates, not legal advice. Review them — ideally with a lawyer — before publishing.</p>
        </section>

        <section className="wrap cta-band">
          <h2>Ship the launch, not the busywork.</h2>
          <p>Paste your URL to get started.</p>
          <UrlForm buttonLabel="Get your kit" />
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span><strong>LiftoffKit</strong> · © {new Date().getFullYear()}</span>
          <span><a href="#pricing">Pricing</a> · <a href="#faq">FAQ</a></span>
        </div>
      </footer>
    </div>
  );
}
