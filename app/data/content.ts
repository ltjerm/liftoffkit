export const faqs: [string, string][] = [
  [
    "What do I need to provide?",
    "A public URL and an email for delivery. Legal drafts include clearly marked placeholders for details we can't know, like your company name and contact email.",
  ],
  [
    "How is the kit delivered?",
    "After checkout we generate your kit and email it to you as a ZIP.",
  ],
  [
    "Will it invent features or stats?",
    "Copy is written from what's on your site, and any number we can't find there is flagged for you to check. Always review AI-written copy before publishing.",
  ],
  [
    "Does it work for mobile apps?",
    "It works from a website, so point it at your app's site. Store-sized screenshots are built from your mobile site. Swap in real in-app screens before submitting to the App Store or Google Play.",
  ],
  [
    "What's the difference between Liftoff and Liftoff+?",
    "Liftoff ($29) is the downloadable kit. Liftoff+ ($79) adds a hosted landing page built from your kit. Your kit arrives by email right away; we set up and send the hosted page within 3 business days.",
  ],
];

export const tiers = {
  liftoff: {
    name: "Liftoff",
    price: 29,
    currency: "USD",
    description: "The full downloadable launch kit.",
    features: [
      "Landing copy, SEO and Product Hunt text",
      "Logo, favicon set, OG and social images",
      "Store and Product Hunt screenshots",
      "Privacy policy and terms drafts",
      "7-day X launch plan (MD + CSV)",
    ],
  },
  liftoffPlus: {
    name: "Liftoff+",
    price: 79,
    currency: "USD",
    description: "The kit, plus a hosted landing page.",
    features: [
      "Everything in Liftoff",
      "Hosted landing page, set up by us within 3 business days of purchase",
    ],
  },
};
