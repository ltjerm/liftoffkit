import { faqs, tiers } from "../data/content";

function generateJsonLd() {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LiftoffKit",
    url: "https://liftoffkit.app",
    logo: "https://liftoffkit.app/icon",
  };

  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LiftoffKit",
    url: "https://liftoffkit.app",
    applicationCategory: "DeveloperApplication",
    description:
      "Paste your app URL. Get landing copy, logo & favicon, OG images, store/Product Hunt shots, privacy & terms, and a 7-day X launch plan.",
    offers: [
      {
        "@type": "Offer",
        name: tiers.liftoff.name,
        price: tiers.liftoff.price,
        priceCurrency: tiers.liftoff.currency,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: tiers.liftoff.price,
          priceCurrency: tiers.liftoff.currency,
          billingDuration: "P0D",
        },
        description: tiers.liftoff.description,
      },
      {
        "@type": "Offer",
        name: tiers.liftoffPlus.name,
        price: tiers.liftoffPlus.price,
        priceCurrency: tiers.liftoffPlus.currency,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: tiers.liftoffPlus.price,
          priceCurrency: tiers.liftoffPlus.currency,
          billingDuration: "P0D",
        },
        description: tiers.liftoffPlus.description,
      },
    ],
  };

  const faqPageLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return [organizationLd, softwareApplicationLd, faqPageLd];
}

export default function JsonLd() {
  const jsonLdItems = generateJsonLd();

  return (
    <>
      {jsonLdItems.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
