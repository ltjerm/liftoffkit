import { Resend } from "resend";
export const FROM = process.env.KIT_FROM_EMAIL || "LiftoffKit <kits@liftoffkit.app>";
export async function sendKitEmail(to: string, appUrl: string, tier: string | undefined, zip: Uint8Array) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM, to, subject: "Your LiftoffKit launch kit is ready",
    text: `Your launch kit for ${appUrl} is attached.\n\nReview the legal drafts (legal/TODO.md) and all AI-written copy before publishing.${tier === "liftoff-plus" ? "\n\nYour Liftoff+ hosted landing page follows within 3 business days of purchase; we'll set it up and send it to you." : ""}\n\n— LiftoffKit`,
    attachments: [{ filename: "liftoffkit.zip", content: Buffer.from(zip) }],
  });
  if (r.error) throw new Error(`resend: ${r.error.message}`);
  return r.data!.id;
}
