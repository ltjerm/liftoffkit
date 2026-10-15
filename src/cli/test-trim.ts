/**
 * Test script for trimToSentence fallback behavior.
 * Run with: npx tsx src/cli/test-trim.ts
 */
import { trimToSentence, critic } from "../lib/generate/copy.js";

const tests: { input: string; limit: number; desc: string; expectNoEllipsis: boolean; expectCompleteSentence?: boolean }[] = [
  {
    desc: "Already under limit",
    input: "Short text here.",
    limit: 50,
    expectNoEllipsis: true,
  },
  {
    desc: "Trim at sentence boundary (period)",
    input: "First sentence here. Second sentence is longer and goes over the limit with extra words.",
    limit: 30,
    expectNoEllipsis: true,
    expectCompleteSentence: true,
  },
  {
    desc: "Trim at sentence boundary (exclamation)",
    input: "Get started today! This is the second part that exceeds our character limit.",
    limit: 25,
    expectNoEllipsis: true,
    expectCompleteSentence: true,
  },
  {
    desc: "Trim at clause boundary (comma)",
    input: "Build forms easily, collect responses securely, and integrate with your favorite tools for maximum productivity.",
    limit: 60,
    expectNoEllipsis: true,
  },
  {
    desc: "Trim at clause boundary (semicolon)",
    input: "No code required; just drag and drop components to build your perfect form in minutes.",
    limit: 30,
    expectNoEllipsis: true,
  },
  {
    desc: "Real PH description example (Tally-like)",
    input: "Tally is the simplest way to create forms. Build forms in seconds, collect responses, and integrate with your tools. All data is encrypted in transit and at rest. Add conditional logic, payments, file uploads, and more.",
    limit: 260,
    expectNoEllipsis: true,
  },
  {
    desc: "Real promoText example (Tally-like)",
    input: "Create beautiful forms in seconds. No coding required. Includes conditional logic, payments, file uploads, integrations and more features.",
    limit: 170,
    expectNoEllipsis: true,
  },
  {
    desc: "Oversized PH description needing trim",
    input: "Tally is the simplest way to create free forms and surveys. No sign up required. Build any type of form in seconds. Share it with a link or embed it on your website. All data is encrypted in transit and at rest. Add conditional logic, payments, file uploads, and advanced integrations with your favorite tools.",
    limit: 260,
    expectNoEllipsis: true,
    expectCompleteSentence: true,
  },
  {
    desc: "Oversized promoText needing trim",
    input: "Create beautiful forms in seconds with no coding required. Includes conditional logic, payments, file uploads, advanced integrations, and so many more powerful features for teams.",
    limit: 170,
    expectNoEllipsis: true,
  },
];

console.log("Testing trimToSentence fallback behavior\n" + "=".repeat(50) + "\n");

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = trimToSentence(t.input, t.limit);
  const hasEllipsis = result.includes("…") || result.includes("...");
  const withinLimit = result.length <= t.limit;
  const endsClean = /[.!?]$/.test(result) || /[a-z0-9]$/i.test(result);
  
  const ok = withinLimit && (t.expectNoEllipsis ? !hasEllipsis : true) && endsClean;
  
  if (ok) {
    passed++;
    console.log(`✓ ${t.desc}`);
    console.log(`  Input (${t.input.length} chars): "${t.input.slice(0, 60)}${t.input.length > 60 ? "..." : ""}"`);
    console.log(`  Output (${result.length}/${t.limit} chars): "${result}"\n`);
  } else {
    failed++;
    console.log(`✗ ${t.desc}`);
    console.log(`  Input (${t.input.length} chars): "${t.input}"`);
    console.log(`  Output (${result.length}/${t.limit} chars): "${result}"`);
    console.log(`  Issues: ${!withinLimit ? "OVER LIMIT " : ""}${hasEllipsis ? "HAS ELLIPSIS " : ""}${!endsClean ? "BAD ENDING " : ""}\n`);
  }
}

// Test the critic function with a realistic copy object
console.log("\n" + "=".repeat(50));
console.log("Testing critic() with oversized fields\n");

const testCopy = {
  headlines: ["Test headline"],
  subhead: "Test subhead",
  cta: { primary: "Get started", secondary: "Learn more" },
  features: [{ title: "Feature", body: "Description" }],
  faq: [{ q: "Question?", a: "Answer." }],
  meta: {
    title: "A very long meta title that exceeds the sixty character limit for SEO purposes",
    description: "This is a meta description that is way too long and needs to be trimmed down to fit within the one hundred sixty character limit that search engines typically display in results.",
  },
  productHunt: {
    tagline: "The simplest way to create forms and collect responses quickly",
    description: "Tally is the simplest way to create free forms and surveys. No sign up required. Build any type of form in seconds. Share it with a link or embed it on your website. All data is encrypted in transit and at rest. Add conditional logic, payments, file uploads, and advanced integrations.",
    makerComment: "Hey!",
  },
  appStore: {
    subtitle: "Build forms fast and easily",
    keywords: "forms,surveys,data",
    promoText: "Create beautiful forms in seconds with no coding required. Includes conditional logic, payments, file uploads, advanced integrations, and so many more powerful features.",
  },
};

const { copy, warnings } = critic(testCopy);

console.log("Warnings generated:", warnings.length ? warnings.join("; ") : "(none)");
console.log("\nTrimmed fields:");
console.log(`  meta.title (${copy.meta.title.length}/60): "${copy.meta.title}"`);
console.log(`  meta.description (${copy.meta.description.length}/160): "${copy.meta.description}"`);
console.log(`  productHunt.tagline (${copy.productHunt.tagline.length}/60): "${copy.productHunt.tagline}"`);
console.log(`  productHunt.description (${copy.productHunt.description.length}/260): "${copy.productHunt.description}"`);
console.log(`  appStore.subtitle (${copy.appStore.subtitle.length}/30): "${copy.appStore.subtitle}"`);
console.log(`  appStore.promoText (${copy.appStore.promoText.length}/170): "${copy.appStore.promoText}"`);

// Verify no ellipses in output
const hasAnyEllipsis = [
  copy.meta.title,
  copy.meta.description,
  copy.productHunt.tagline,
  copy.productHunt.description,
  copy.appStore.subtitle,
  copy.appStore.promoText,
].some(s => s.includes("…") || s.includes("..."));

if (hasAnyEllipsis) {
  console.log("\n✗ FAIL: Some fields contain ellipsis");
  failed++;
} else {
  console.log("\n✓ PASS: No ellipsis in any trimmed field");
  passed++;
}

console.log("\n" + "=".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
