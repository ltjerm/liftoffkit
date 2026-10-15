import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using LiftoffKit and buying a launch kit.",
  alternates: { canonical: "https://liftoffkit.app/terms" },
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>These terms govern your use of liftoffkit.app and any launch kit you buy. LiftoffKit is operated by Jeremy Hernandez, a sole proprietor based in Colorado, USA (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site or placing an order, you agree to these terms. Contact: <a href="mailto:support@liftoffkit.app">support@liftoffkit.app</a>.</p>

      <h2>The service</h2>
      <p>You submit the URL of a public website. We read that page and use automated tools, including AI models from OpenAI and fal.ai, to generate a launch kit, which we deliver by email as a ZIP file.</p>
      <ul>
        <li><strong>Liftoff ($29, one-time):</strong> the downloadable kit.</li>
        <li><strong>Liftoff+ ($79, one-time):</strong> the kit, plus a hosted landing page built from it. Your kit arrives by email; we set up and send the hosted page within 3 business days of purchase.</li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Only submit a URL for a site you own or are authorized to use for this purpose.</li>
        <li>Don&apos;t use LiftoffKit for anything unlawful, or to create content that infringes someone else&apos;s rights.</li>
        <li>Review everything in your kit before you publish it. AI-generated copy and images can contain mistakes.</li>
      </ul>

      <h2>Ownership</h2>
      <p>You own the assets in the kit we generate for you, and you may use, change, and publish them as you like. You keep all rights to your own site and content. We keep the rights to LiftoffKit itself, including its software and design.</p>

      <h2>Not legal advice</h2>
      <p>The privacy policy and terms drafts included in your kit are generated templates, not legal advice. They may not fit your business or meet the laws that apply to you. Have a qualified lawyer review them before you rely on them.</p>

      <h2>Payments and refunds</h2>
      <p>Payments are processed by Stripe. Prices are in US dollars and are charged once; there is no subscription. If your kit fails to deliver, we will fix it or give you a full refund. If you are unhappy with your kit for any other reason, email <a href="mailto:support@liftoffkit.app">support@liftoffkit.app</a> within 7 days of purchase for a full refund.</p>

      <h2>Disclaimers</h2>
      <p>LiftoffKit is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent the law allows, we disclaim all warranties, express or implied, including fitness for a particular purpose and non-infringement. We don&apos;t guarantee any particular result from using your kit.</p>

      <h2>Limitation of liability</h2>
      <p>To the extent the law allows, we are not liable for indirect, incidental, special, or consequential damages, or for lost profits or data. Our total liability for any claim relating to the service is limited to the amount you paid for the order the claim relates to.</p>

      <h2>Changes and termination</h2>
      <p>We may update these terms by posting a new version on this page with a new date. We may refuse or cancel an order that violates these terms; if we cancel a paid order, we will refund it.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of Colorado, USA, without regard to its conflict-of-law rules. Any dispute will be handled in the state or federal courts located in Colorado.</p>
    </LegalPage>
  );
}
