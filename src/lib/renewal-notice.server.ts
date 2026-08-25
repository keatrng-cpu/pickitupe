import {
  markRenewalNoticeSent,
  subscriptionsDueForRenewalNotice,
  type SubscriptionRow,
} from "@/lib/subscriptions.server";
import { SERVICE_WINDOW } from "@/lib/plan";

/**
 * The NDCC ch. 51-37 pre-renewal notice.
 *
 * North Dakota requires WRITTEN notice at least 30 and not more than 60 days
 * before an automatic renewal longer than one month. An annual plan is
 * squarely in scope. Federal ROSCA (15 U.S.C. § 8403) applies independently.
 *
 * WHY THIS EXISTS AT ALL, rather than leaning on Stripe: Stripe's
 * `invoice.upcoming` fires only a few days ahead of renewal. It cannot satisfy
 * a 30-60 day requirement, and no Stripe setting changes that. This job is the
 * compliance mechanism.
 *
 * THE HARD RULE IN HERE: a notice is only ever stamped as sent when a provider
 * actually accepted it. If no email provider is configured, or the send fails,
 * the row is left untouched so the next run retries and the backlog stays
 * visible. Nothing in this file is allowed to make the database claim
 * compliance that did not happen.
 */

export type NoticeResult = {
  due: number;
  sent: number;
  failed: number;
  /** Set when the whole run could not send — the loud, visible failure. */
  blocked?: string;
  failures: { subscriptionId: string; reason: string }[];
};

export function senderConfigured(): boolean {
  const from = process.env.RENEWAL_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY?.trim() || !from) return false;

  // A free-provider from-address can never send: those domains cannot be
  // verified by someone who does not own them, and the sender's own DMARC
  // policy rejects third-party senders. Treating it as "configured" would
  // open the sell-gate on a plan whose statutory notices are guaranteed to
  // bounce — the exact failure the gate exists to prevent, arrived at through
  // a setting that merely looks filled in.
  const domain = from.split("@")[1]?.toLowerCase() ?? "";
  const unusable = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
  ];
  if (unusable.includes(domain)) {
    console.error(
      `[renewal-notice] RENEWAL_FROM_EMAIL is @${domain}, which no provider can send from. ` +
        `Use an address on a domain verified in Resend (e.g. hello@pickitupe.com) and put the ` +
        `personal address in RENEWAL_REPLY_TO instead.`,
    );
    return false;
  }
  return true;
}

function noticeBody(sub: SubscriptionRow, renewsOn: string): string {
  return [
    `Hi${sub.name ? ` ${sub.name.split(" ")[0]}` : ""},`,
    ``,
    `This is your advance notice: your Pick It Up E Seasonal Cleanup Plan renews on ${renewsOn}.`,
    ``,
    `You'll be charged the same amount as last year, to the card on file, on that date. Nothing changes and you don't have to do anything.`,
    ``,
    `What the year covers:`,
    `  • Spring cleanup — ${SERVICE_WINDOW.spring.trigger} (${SERVICE_WINDOW.spring.typical}). If we haven't been out by ${SERVICE_WINDOW.spring.outerBound}, you're refunded automatically.`,
    `  • Fall cleanup — ${SERVICE_WINDOW.fall.trigger} (${SERVICE_WINDOW.fall.typical}). Same automatic refund if we haven't been out by ${SERVICE_WINDOW.fall.outerBound}.`,
    ``,
    `Don't want to renew? Cancel in one click here — no phone call, no reason needed:`,
    `https://pickitupe.com/plan`,
    ``,
    `Cancel before ${renewsOn} and you won't be charged again. Questions: call or text 218-779-2553.`,
    ``,
    `— Pick It Up E, Grand Forks ND`,
  ].join("\n");
}

/**
 * Sends via Resend's HTTP API with plain fetch — no SDK, no new dependency.
 * Returns null on success or a reason string on failure.
 *
 * FROM must be an address on a domain verified in Resend. It cannot be a
 * gmail.com (or any other free provider) address: you can only verify a domain
 * you control, and Google's DMARC policy rejects third parties sending as
 * @gmail.com regardless. Attempting it produces mail that bounces or lands in
 * spam — worse than not sending, because the obligation looks discharged.
 *
 * REPLY-TO is where that gets solved. This is the one email whose entire job
 * is "you are about to be charged, here is how to stop it", so a meaningful
 * share of recipients will hit reply instead of clicking. Those replies have
 * to reach a human inbox — a reply that vanishes undercuts the same easy
 * cancellation the notice exists to provide. Falls back to the from address
 * when unset, which is correct but only if that address is monitored.
 */
async function send(to: string, subject: string, text: string): Promise<string | null> {
  try {
    const replyTo = process.env.RENEWAL_REPLY_TO?.trim();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RENEWAL_FROM_EMAIL?.trim(),
        to,
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) return `provider returned ${res.status}: ${await res.text()}`;
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "send failed";
  }
}

export async function runRenewalNotices(): Promise<NoticeResult> {
  const due = await subscriptionsDueForRenewalNotice();

  if (!senderConfigured()) {
    // Deliberately NOT marking anything sent. This is the visible failure
    // state: the backlog grows and every run reports it, rather than the
    // obligation quietly evaporating.
    return {
      due: due.length,
      sent: 0,
      failed: due.length,
      blocked:
        "No email provider configured (RESEND_API_KEY + RENEWAL_FROM_EMAIL). " +
        "Statutory pre-renewal notices CANNOT be sent. Auto-renewing plans " +
        "must not be sold until this is set.",
      failures: [],
    };
  }

  const failures: { subscriptionId: string; reason: string }[] = [];
  let sent = 0;

  for (const sub of due) {
    if (!sub.email) {
      failures.push({
        subscriptionId: sub.stripe_subscription_id,
        reason: "no email on file",
      });
      continue;
    }
    const renewsOn = sub.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "your renewal date";

    const reason = await send(
      sub.email,
      `Your Pick It Up E plan renews on ${renewsOn}`,
      noticeBody(sub, renewsOn),
    );

    if (reason) {
      failures.push({ subscriptionId: sub.stripe_subscription_id, reason });
      continue;
    }
    // Only now, after a provider accepted it.
    await markRenewalNoticeSent(sub.stripe_subscription_id);
    sent++;
  }

  return { due: due.length, sent, failed: failures.length, failures };
}
