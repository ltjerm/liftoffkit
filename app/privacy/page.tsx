import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — LiftoffKit",
  description: "How LiftoffKit collects, uses, and shares information.",
  alternates: { canonical: "https://liftoffkit.app/privacy" },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>LiftoffKit (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by Jeremy Hernandez, a sole proprietor based in Colorado, USA. This policy explains what information we handle when you use liftoffkit.app and buy a launch kit. Questions: <a href="mailto:support@liftoffkit.app">support@liftoffkit.app</a>.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>The URL you submit.</strong> We visit that public web page, read its content, and take screenshots of it to build your kit.</li>
        <li><strong>Checkout details.</strong> Your email address and payment information are entered on Stripe&apos;s checkout page. We receive your email address, the URL, the tier you bought, and the payment status. We do not receive or store your card number.</li>
        <li><strong>Messages you send us,</strong> such as support emails.</li>
        <li><strong>Basic technical data</strong> that our hosting provider records when you visit the site, such as IP address, browser type, and request logs.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To generate your launch kit from the page you submitted and email it to you.</li>
        <li>For Liftoff+ orders, to set up your hosted landing page and send it to you.</li>
        <li>To process payments, handle refunds, and provide support.</li>
        <li>To keep the site secure and working, and to meet legal obligations.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising.</p>

      <h2>Service providers we share it with</h2>
      <ul>
        <li><strong>Stripe</strong> processes payments.</li>
        <li><strong>OpenAI</strong> and <strong>fal.ai</strong> generate text and images. We send them content taken from the page you submitted.</li>
        <li><strong>Resend</strong> sends our emails, including your kit.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
      </ul>
      <p>Each provider handles data under its own terms and privacy policy. We may also disclose information if the law requires it.</p>

      <h2>Retention</h2>
      <p>We keep order records and generated kit files for as long as we need them to deliver your order, provide support, and keep business records. Stripe keeps payment records under its own policies. You can ask us to delete your kit files and personal information by emailing <a href="mailto:support@liftoffkit.app">support@liftoffkit.app</a>. We may keep records the law requires us to keep.</p>

      <h2>Your choices</h2>
      <p>You can ask us to access, correct, or delete the personal information we hold about you. Email <a href="mailto:support@liftoffkit.app">support@liftoffkit.app</a> and we will respond within a reasonable time.</p>

      <h2>Children</h2>
      <p>LiftoffKit is not intended for children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date above and post the new version on this page.</p>
    </LegalPage>
  );
}
