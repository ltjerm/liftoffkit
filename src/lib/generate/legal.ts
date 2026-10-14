import type { Brand } from "../extract.js";

export interface LegalIntake {
  companyName?: string;     // legal entity
  contactEmail?: string;
  jurisdiction?: string;    // governing law, e.g. "the State of Colorado, USA"
  effectiveDate?: string;
  collectsAccounts?: boolean;
  childrenUnder13?: boolean;
}

const DISCLAIMER = "> **Not legal advice.** This document was generated from a template based on what LiftoffKit detected on your website and the answers you gave. Review it (ideally with a lawyer) and edit anything that does not match how your product actually works before publishing.";

/** Clause library: detected service -> processor disclosure. */
const PROCESSORS: Record<string, { purpose: string; data: string; link: string }> = {
  "Google Analytics": { purpose: "website analytics", data: "device, browser, approximate location, pages viewed (via cookies)", link: "https://policies.google.com/privacy" },
  "Stripe": { purpose: "payment processing", data: "name, email, billing address, payment card details (handled by Stripe; we do not store full card numbers)", link: "https://stripe.com/privacy" },
  "Supabase": { purpose: "database and authentication hosting", data: "account data you provide", link: "https://supabase.com/privacy" },
  "PostHog": { purpose: "product analytics", data: "usage events, device and browser information", link: "https://posthog.com/privacy" },
  "Plausible": { purpose: "privacy-friendly website analytics (no cookies)", data: "aggregated page views, referrer, country", link: "https://plausible.io/privacy" },
  "Segment": { purpose: "analytics data routing", data: "usage events", link: "https://www.twilio.com/legal/privacy" },
  "Mixpanel": { purpose: "product analytics", data: "usage events, device information", link: "https://mixpanel.com/legal/privacy-policy" },
  "Hotjar": { purpose: "session recording and heatmaps", data: "interactions, device information", link: "https://www.hotjar.com/legal/policies/privacy/" },
  "Intercom": { purpose: "customer support chat", data: "name, email, messages", link: "https://www.intercom.com/legal/privacy" },
  "Crisp": { purpose: "customer support chat", data: "name, email, messages", link: "https://crisp.chat/en/privacy/" },
  "Clerk": { purpose: "authentication", data: "email, name, login metadata", link: "https://clerk.com/legal/privacy" },
  "Firebase": { purpose: "app backend, authentication and/or analytics", data: "account data, device identifiers, usage events", link: "https://firebase.google.com/support/privacy" },
  "Sentry": { purpose: "error monitoring", data: "error reports, device and browser information", link: "https://sentry.io/privacy/" },
  "Paddle": { purpose: "payment processing (merchant of record)", data: "name, email, billing details", link: "https://www.paddle.com/legal/privacy" },
  "Lemon Squeezy": { purpose: "payment processing (merchant of record)", data: "name, email, billing details", link: "https://www.lemonsqueezy.com/privacy" },
  "Meta Pixel": { purpose: "advertising measurement", data: "pages viewed, device identifiers (via cookies)", link: "https://www.facebook.com/privacy/policy/" },
  "Microsoft Clarity": { purpose: "session recording and heatmaps", data: "interactions, device information", link: "https://privacy.microsoft.com/privacystatement" },
  "Vercel Analytics": { purpose: "hosting and website analytics", data: "aggregated page views, device type, country", link: "https://vercel.com/legal/privacy-policy" },
  "Cloudflare Web Analytics": { purpose: "website analytics (no cookies)", data: "aggregated page views", link: "https://www.cloudflare.com/privacypolicy/" },
  "HubSpot": { purpose: "marketing and CRM", data: "name, email, website interactions", link: "https://legal.hubspot.com/privacy-policy" },
  "YouTube embeds": { purpose: "embedded video", data: "device information, cookies set by YouTube", link: "https://policies.google.com/privacy" },
  "Google Fonts": { purpose: "web fonts", data: "IP address and browser information sent to Google when fonts load", link: "https://policies.google.com/privacy" },
};

const COOKIE_SERVICES = new Set(["Google Analytics", "Meta Pixel", "Hotjar", "Microsoft Clarity", "HubSpot", "Mixpanel", "Intercom", "YouTube embeds"]);

function ctx(b: Brand, i: LegalIntake) {
  return {
    product: b.name,
    company: i.companyName || `[TODO: legal entity name, e.g. "${b.name} LLC" or your full name]`,
    email: i.contactEmail || b.contactEmail || "[TODO: contact email]",
    law: i.jurisdiction || "[TODO: governing law, e.g. the State of Colorado, USA]",
    date: i.effectiveDate || new Date().toISOString().slice(0, 10),
    url: "",
  };
}

export function privacyPolicy(b: Brand, i: LegalIntake = {}, siteUrl = ""): string {
  const c = ctx(b, i);
  const procs = b.services.filter((s) => PROCESSORS[s]);
  const cookies = procs.filter((s) => COOKIE_SERVICES.has(s));
  const accounts = i.collectsAccounts ?? (b.services.some((s) => ["Supabase", "Clerk", "Firebase"].includes(s)) || /sign ?in|log ?in|sign ?up|create account/i.test(b.description));
  const payments = procs.some((s) => ["Stripe", "Paddle", "Lemon Squeezy"].includes(s));
  const apps = b.platforms.filter((p) => p === "ios" || p === "android");
  return `# Privacy Policy for ${c.product}

${DISCLAIMER}

**Effective date:** ${c.date}

This Privacy Policy explains how ${c.company} ("we", "us") collects, uses, and shares information when you use ${c.product}${siteUrl ? ` (${siteUrl})` : ""}${apps.length ? ` and our ${apps.map((a) => (a === "ios" ? "iOS" : "Android")).join(" and ")} app` : ""} (the "Service").

## 1. Information we collect
- **Information you give us.** ${accounts ? "When you create an account we collect your email address and any profile details you choose to provide. " : ""}If you contact us, we collect your message and email address.${payments ? " When you buy something, payment details are collected by our payment processor (see below)." : ""}
- **Information collected automatically.** Like most websites, our servers and providers receive technical data such as IP address, browser type, device type, pages visited, and timestamps.
${cookies.length ? `- **Cookies and similar technologies.** We and our providers (${cookies.join(", ")}) use cookies or similar technologies for analytics and measurement. You can control cookies in your browser settings.\n` : "- **Cookies.** We use only cookies that are necessary for the Service to work, unless stated otherwise below.\n"}
## 2. How we use information
- To provide, maintain, and improve the Service
- To ${accounts ? "create and secure your account, and to " : ""}respond to your requests and send service-related messages
${payments ? "- To process payments and prevent fraud\n" : ""}- To understand usage and fix problems
- To comply with legal obligations

We do **not** sell your personal information.

## 3. Service providers we share data with
${procs.length ? `We use the following third parties to run the Service. They process data on our behalf under their own privacy policies:\n\n| Provider | Purpose | Data involved |\n|---|---|---|\n${procs.map((s) => `| [${s}](${PROCESSORS[s].link}) | ${PROCESSORS[s].purpose} | ${PROCESSORS[s].data} |`).join("\n")}\n\n_Detected automatically from your website's scripts — add any providers we missed (hosting, email, AI APIs, etc.)._` : "[TODO: list your hosting, analytics, email, payment, and AI providers. LiftoffKit detected none on your homepage.]"}

We may also disclose information if required by law, to protect our rights, or as part of a merger or acquisition.

## 4. Data retention
We keep personal information only as long as needed for the purposes above${accounts ? ", or until you delete your account" : ""}, unless a longer period is required by law.

## 5. Your rights
Depending on where you live (for example under the GDPR/UK GDPR or California law), you may have the right to access, correct, delete, or export your personal information, and to object to or restrict certain processing. To make a request, email **${c.email}**. We will respond within the time required by law.${accounts ? " You can also delete your account from within the Service [TODO: confirm, or describe how]." : ""}

## 6. International transfers
Our providers may process data in countries other than yours, including the United States. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses.

## 7. Security
We use reasonable technical and organizational measures to protect information, but no method of transmission or storage is 100% secure.

## 8. Children
${i.childrenUnder13 ? "[TODO: Your app is directed at children — COPPA/GDPR-K rules apply. Get legal review before publishing.]" : `The Service is not directed to children under 13 (or 16 in the EEA), and we do not knowingly collect their personal information.`}

## 9. Changes
We may update this policy. We will post the new version here and update the effective date.

## 10. Contact
${c.company} — ${c.email}
`;
}

export function termsOfService(b: Brand, i: LegalIntake = {}, siteUrl = ""): string {
  const c = ctx(b, i);
  const paid = !/^unknown$/.test(b.pricingModel) || b.services.some((s) => ["Stripe", "Paddle", "Lemon Squeezy"].includes(s));
  return `# Terms of Service for ${c.product}

${DISCLAIMER}

**Effective date:** ${c.date}

These Terms govern your use of ${c.product}${siteUrl ? ` (${siteUrl})` : ""} (the "Service"), provided by ${c.company} ("we", "us"). By using the Service you agree to these Terms.

## 1. Using the Service
You must be at least 13 years old (or the age of digital consent where you live). You are responsible for your account credentials and for activity under your account.

## 2. Acceptable use
You agree not to: break the law; infringe others' rights; upload malware; attempt to access systems or data you are not authorized to; scrape or overload the Service; or resell the Service without permission.

## 3. Your content
You keep ownership of content you submit. You grant us a limited license to host, process, and display it only as needed to operate the Service.

${paid ? `## 4. Payments and refunds
Paid features are billed as described at checkout${b.pricingModel !== "unknown" ? ` (${b.pricingModel})` : ""}. Subscriptions renew automatically until cancelled. [TODO: state your refund policy, e.g. "Refunds within 14 days on request."] Taxes may apply.
` : `## 4. Fees
The Service is currently offered free of charge. If we introduce paid features, we will tell you before you are charged.
`}
## 5. Intellectual property
The Service, including its software, design, and branding, is owned by ${c.company} and protected by law. These Terms do not give you rights to our trademarks.

## 6. Termination
You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms or if needed to protect the Service or others.

## 7. Disclaimers
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 8. Limitation of liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${c.company.toUpperCase()} WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS OR DATA. OUR TOTAL LIABILITY IS LIMITED TO THE GREATER OF THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM OR USD $100.

## 9. Changes
We may update these Terms. If changes are material we will give reasonable notice. Continued use after changes means you accept them.

## 10. Governing law
These Terms are governed by the laws of ${c.law}, without regard to conflict-of-law rules.

## 11. Contact
${c.company} — ${c.email}
`;
}

export function legalTodos(md: string): string[] {
  return [...md.matchAll(/\[TODO:[^\]]+\]/g)].map((m) => m[0]);
}
