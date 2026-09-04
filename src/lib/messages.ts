/**
 * One-tap customer messages for the owner board.
 *
 * Adapted from the E&E message templates — same voice, same discipline: an
 * arrival window that gets hit, a number before any work starts, and a review
 * ask the same day. The point is that answering a lead takes one thumb tap
 * instead of a blank text box at 6am.
 */

import { BLOCK_TIERS, PROMO_CAP, PROMO_PERCENT } from "@/lib/pricebook";

export const PHONE = "701-213-3969";
export const TEL = "tel:7012133969";

export type MessageKind =
  | "callback"
  | "quote"
  | "confirm"
  | "on-my-way"
  | "done"
  | "review"
  | "neighbor";

export type MessageTemplate = {
  kind: MessageKind;
  label: string;
  /** When in the job's life this one gets sent. */
  stage: "new" | "quoted" | "scheduled" | "done";
  build: (ctx: MessageContext) => string;
};

export type MessageContext = {
  name: string;
  service: string;
  estimate?: string;
  date?: string;
  earlyBird?: boolean;
};

const firstName = (full: string) => (full || "there").trim().split(/\s+/)[0];

export const TEMPLATES: MessageTemplate[] = [
  {
    kind: "callback",
    label: "First reply",
    stage: "new",
    build: (c) =>
      `Hi ${firstName(c.name)} — this is Pick It Up E about your ${c.service} request. I can give you a number today. Is the pile curb-side or does it need raking first? — ${PHONE}`,
  },
  {
    kind: "quote",
    label: "Send the quote",
    stage: "new",
    build: (c) =>
      `${firstName(c.name)}, here's your number for the ${c.service}: ${c.estimate || "$___"}. ${
        c.earlyBird
          ? `That's with the ${Math.round(PROMO_PERCENT * 100)}% off (up to $${PROMO_CAP}) already taken off. `
          : ""
      }A $50 deposit holds the date and comes off the bill. Reply YES and I'll lock it in. — Pick It Up E, ${PHONE}`,
  },
  {
    kind: "confirm",
    label: "Confirm the date",
    stage: "quoted",
    build: (c) =>
      `You're on the schedule${c.date ? ` for ${c.date}` : ""}, ${firstName(c.name)}. Silver crew cab. Leave the pile where it is — we bag, blow, and haul. I'll text when I'm on the way. — Pick It Up E`,
  },
  {
    kind: "on-my-way",
    label: "On my way",
    stage: "scheduled",
    build: (c) =>
      `Heading your way now, ${firstName(c.name)} — about 20 minutes out. — Pick It Up E`,
  },
  {
    kind: "done",
    label: "Job done",
    stage: "scheduled",
    build: (c) =>
      `All done, ${firstName(c.name)} — yard's clear and the load is gone. Invoice is ${c.estimate || "$___"} less your $50 deposit. Thanks for having us out. — Pick It Up E`,
  },
  {
    kind: "review",
    label: "Ask for a review",
    stage: "done",
    build: (c) =>
      `Thanks again, ${firstName(c.name)}. If we did right by you, a quick Google review helps neighbors find us — takes about 30 seconds. Either way, call anytime. — Pick It Up E, ${PHONE}`,
  },
  {
    kind: "neighbor",
    label: "Neighbor offer",
    stage: "done",
    build: (c) =>
      `${firstName(c.name)} — if a neighbor books the same day we're on your block, you both get $${BLOCK_TIERS[0].credit} off — three or more houses and it's $${BLOCK_TIERS[1].credit} each. Just have them mention your address when they call ${PHONE}. — Pick It Up E`,
  },
];

export function templatesForStage(status: string): MessageTemplate[] {
  const stage =
    status === "quoted"
      ? "quoted"
      : status === "scheduled"
        ? "scheduled"
        : status === "done"
          ? "done"
          : "new";
  return TEMPLATES.filter((t) => t.stage === stage);
}

/** `sms:` link that pre-fills the body on both iOS and Android. */
export function smsLink(phone: string, body: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return `sms:${digits}?&body=${encodeURIComponent(body)}`;
}
