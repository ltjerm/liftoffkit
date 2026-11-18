import assert from "node:assert/strict";
import { z } from "zod";
import { PlanSchema } from "../lib/generate/xplan.js";

// What z.coerce.number() used to do: Number(value), then reject NaN.
const coerceDay = z.coerce.number();
const samples = [1, "1", "Day 1", "day-2", "D3", null, undefined] as const;
console.log("previous z.coerce.number():");
for (const value of samples) {
  const parsed = coerceDay.safeParse(value);
  const label = value === undefined ? "(missing)" : JSON.stringify(value);
  console.log(`  ${label.padEnd(12)} ${parsed.success ? `→ ${parsed.data}` : `rejected (${parsed.error.issues[0]?.message})`}`);
}

const post = { time: "09:00", kind: "post" as const, text: "Launching today." };

function dayRow(day: unknown, index: number, omitDay = false) {
  const row: Record<string, unknown> = {
    label: `Label ${index + 1}`,
    goal: index === 5 ? null : "Ship it",
    posts: [{ ...post, text: `Post for slot ${index + 1}` }],
    crossPost: index === 0 ? ["Indie Hackers"] : [],
  };
  if (!omitDay) row.day = day;
  return row;
}

const messy = PlanSchema.parse({
  days: [
    dayRow(1, 0),
    dayRow("1", 1),
    dayRow("Day 1", 2),
    dayRow("day-2", 3),
    dayRow("D3", 4),
    dayRow(null, 5),
    dayRow(undefined, 6, true),
    dayRow("Day 8", 7),
  ],
});

const days = messy.days.map((d) => d.day);
console.log("\nPlanSchema days:", days.join(", "));
assert.deepEqual(days, [1, 2, 3, 4, 5, 6, 7]);
assert.ok(days.every((n) => Number.isInteger(n) && n >= 1 && n <= 7));
assert.equal(messy.days.length, 7);
assert.equal(messy.days[0].posts[0].text, "Post for slot 1");
assert.equal(messy.days[0].posts[0].kind, "post");
assert.deepEqual(messy.days[0].crossPost, ["Indie Hackers"]);
assert.equal(messy.days[3].label, "Label 4");
assert.equal(messy.days[5].goal, "");
assert.equal(messy.days[6].posts[0].text, "Post for slot 7");

const repeated = PlanSchema.parse({
  days: Array.from({ length: 7 }, (_, i) => dayRow(i % 2 === 0 ? "Day 1" : "D1", i)),
});
assert.deepEqual(repeated.days.map((d) => d.day), [1, 2, 3, 4, 5, 6, 7]);

const numbered = PlanSchema.parse({
  days: [1, 2, 3, 4, 5, 6, 7].map((n, i) => dayRow(n, i)),
});
assert.deepEqual(numbered.days.map((d) => d.day), [1, 2, 3, 4, 5, 6, 7]);

assert.equal(PlanSchema.safeParse({ days: [1, 2, 3, 4, 5, 6].map((n, i) => dayRow(n, i)) }).success, false);
assert.equal(PlanSchema.safeParse({
  days: Array.from({ length: 7 }, () => ({ day: 1, label: "L", goal: "G", posts: [] })),
}).success, false);

console.log("ok");
