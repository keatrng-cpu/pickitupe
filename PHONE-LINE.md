# The missed-call line

**Problem.** 701-213-3969 is on 500 door hangers. When Keaton is on a job and doesn't pick up,
the caller hits carrier voicemail — most don't leave one, and the ones who do get a callback
hours later. That's the leak.

**Fix.** The cell forwards *unanswered* calls to a Twilio toll-free number. The site answers:

1. **Text first** — before the greeting finishes, the caller has a text with the booking link
   (`pickitupe.com/book?s=call`). Hang-ups still have the link in hand.
2. **Greeting + voicemail** — "Keaton's on a job, I just texted you a link, or leave your address
   and what you need and I'll call back within the hour." Recorded and transcribed.
3. **Lead on the board** — a `bookings` row (status *new*, source *Called in*, service *other*)
   appears on `/jobs` and in the customers follow-up queue with the "needs a first reply" nudge.
   The voicemail transcript is on the job. A second call from the same number in 7 days lands on
   the same row.
4. **Owner alert** — text to Keaton's cell (*"Voicemail (701) 555-0142 — 'leaves and a couch on
   Belmont' · pickitupe.com/jobs/44"*) plus the themed email with a tap-to-call-back button.
5. **Replies keep going** — if the caller texts back, it's logged on the lead and forwarded to
   Keaton's cell so the thread continues in Messages. Someone who *texts first* gets one
   acknowledgement with the link; replies to our text get a human, not a robot.

Code: `src/lib/phone-line.server.ts`, routes `src/routes/api/voice/{missed,after,voicemail}.ts`,
`src/routes/api/sms/inbound.ts`, alert template `leadEmail()` in `src/lib/email-theme.ts`.
Every webhook checks Twilio's `X-Twilio-Signature` (HMAC-SHA1 over URL + params) before it
touches the database or spends a cent on SMS — `scripts/phone-line.test.mjs` proves the math
against Twilio's published example.

---

## Two stages — because texting needs the EIN

Twilio will not sell a number without a **compliance profile**, and the profile type that
unlocks **toll-free texting** (Business Profile) needs the LLC's **EIN**. The EIN can't be
issued until the ND SOS approves the LLC (filed 2026-09-11, "Pending Review", ~5 business days).
So:

| Stage | When | What works | Env |
|---|---|---|---|
| **Voice** | the day the number is bought | forwarded calls → greeting that spells out the website, voicemail + transcript on the board, owner alert by **email** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |
| **Texting** | toll-free verification approved (1–3 business days after the EIN) | + text-back to the caller, owner alerts also by text, replies forwarded to the cell | add `TWILIO_SMS_ENABLED=true`, redeploy |

`smsEnabled()` in `phone-line.server.ts` switches the greeting, the after-message, the owner
alert wording and every outbound text at once. Don't flip it early — unverified toll-free
texts are hard-blocked by the carriers (error 30032) and each one still costs a segment.

**Account state (2026-09-12):** Twilio account exists under pickitupe@gmail.com, **upgraded to
pay-as-you-go**, $20 balance, auto-recharge to $20 under $10, tax profile Pick It Up E LLC.
No number bought yet, no compliance profile yet — waiting on the EIN so it can be done once,
as a Business Profile.

### When the SOS approval lands
1. **EIN** — irs.gov → "Apply for an EIN online" (free, ~10 min, Mon–Fri 7am–10pm ET). Entity:
   LLC, one member, ND, "started a new business", no employees yet (say 0 — change later
   when the helper is hired; WSI is separate). Save the CP 575 PDF into the Legal folder,
   not the repo.
2. Twilio → Trust Hub → **Business Profile**: legal name exactly as on the SOS filing, EIN,
   the 2114 S 20th St address, authorized rep Keaton Ellingson / Owner, website
   pickitupe.com, industry "Home services". Approval is usually same-day.
3. Then the steps below.

## Set-up (about 20 minutes, Keaton does the account parts)

### 1. Twilio account + toll-free number
- twilio.com → sign up with **pickitupe@gmail.com**, upgrade out of trial (trial numbers can only
  text verified numbers). Card on file; expect a $20 initial top-up.
- **Buy a toll-free number** (Phone Numbers → Buy → Toll-free, voice + SMS). Toll-free, not
  local: a local (10DLC) number can't text at all until the A2P brand/campaign is registered
  ($4 + $15 vetting + $2/mo and days-to-weeks of review). Toll-free needs one verification form.
- **Toll-free verification** (Messaging → Regulatory compliance → Toll-free verification). Fill in:
  - Business: Pick It Up E LLC, pickitupe.com, Grand Forks ND, contact pickitupe@gmail.com
  - Use case: *Customer service / conversational*
  - Volume: under 1,000 messages a month
  - Opt-in description: *"A customer calls our business line (701-213-3969) and does not reach a
    person. The call forwards to this number, which plays a greeting and sends the caller ONE
    text with a link to book online. The customer may reply; replies are answered by the owner.
    No marketing. STOP and HELP are honoured."*
  - Sample message: paste the text-back below.
  - Typically approved in 1–3 business days. Until then, outbound texts may be filtered — voice,
    voicemail and the owner email still work.

### 2. Point the number at the site
Phone Numbers → your number → **Voice & Fax**:
- *A call comes in* → Webhook → `https://pickitupe.com/api/voice/missed` · HTTP POST

**Messaging**:
- *A message comes in* → Webhook → `https://pickitupe.com/api/sms/inbound` · HTTP POST

### 3. Netlify environment (Site configuration → Environment variables)
| Key | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | from the Twilio console home (starts `AC…`) — mark **secret** |
| `TWILIO_AUTH_TOKEN` | same page — **secret** |
| `TWILIO_FROM` | the toll-free number in E.164, e.g. `+18005550100` |
| `OWNER_CELL` | `7012133969` (optional — this is the default) |
| `TWILIO_SMS_ENABLED` | leave **unset** until the toll-free verification email says approved; then `true` |

Copy each straight from the Twilio console into Netlify. Redeploy ("Trigger deploy") so the
functions pick them up. With any of the three Twilio keys missing the webhooks answer 503 and
nothing else on the site changes. Add the same four keys, empty, to `.env.example`.

### 4. Forward the cell — *conditional* forwarding only
Dial from the 701-213-3969 phone. `NUMBER` = the toll-free number with the leading 1.

| Carrier | Turn on (busy / no answer) | Turn off |
|---|---|---|
| **Verizon** | `*71` then `1NUMBER`, call, wait for the tone | `*73` |
| **AT&T** | `*61*1NUMBER**20#` (no answer after 20 s) and `*67*1NUMBER#` (busy) — dial each, press call | `##61#` then `##67#` |
| **T-Mobile** | `**004*1NUMBER#` (busy, no answer and unreachable in one) | `##004#` |

Never `*72` / `**21*` — that's *unconditional* and Keaton would never hear the phone ring.

What changes for Keaton: his carrier voicemail is bypassed — every unanswered call, including
personal ones, hears the Pick It Up E greeting. That's the trade; the greeting is friendly
enough for Grandma. To pause it (off-season), dial the "turn off" code.

### 5. Test, in this order
1. From another phone, call 701-213-3969 and **don't answer**. Within ~2 rings after the forward,
   the greeting plays and the test phone gets the text. Leave a 10-second message.
2. `/jobs` shows *Caller (xxx) xxx-xxxx · via Called in*; a minute later the transcript is on the
   job and Keaton's cell + inbox get the alert.
3. Reply to the text from the test phone — it appears on the job and is forwarded to the cell.
4. Twilio console → Monitor → Logs → Errors should be empty. A `403` there means the webhook URL
   in Twilio doesn't exactly match `https://pickitupe.com/api/…` (signature covers the URL).

---

## What it costs (Twilio US list, Sept 2026)
Toll-free number **$2.15/mo**. Inbound toll-free voice **$0.022/min**, recording **$0.0025/min**,
transcription **$0.05/min**, outbound SMS ≈ **$0.008/segment** + carrier pass-through, Polly
neural voice a fraction of a cent per greeting. A busy fall week of 30 missed calls × 1 min +
30 texts + 15 voicemails ≈ **$1.60**. Call it **$3–6 a month** in season, $2.15 idle.
Source: https://www.twilio.com/en-us/voice/pricing/us and /sms/pricing/us.

Books it as **Phone / internet** (Schedule C line 25) — snap the Twilio invoice PDF into Books.

---

## The words

**Greeting (Polly Matthew, neural):**
> Hey, you've reached Keaton at Pick It Up E — leaves, junk and gutters in Grand Forks. I'm on a
> job right now, so I just texted you a link to grab a day on the calendar; it takes about two
> minutes. Or leave your address and what you need after the tone and I'll call you back within
> the hour.

**Text-back (one message, 2 segments):**
> Pick It Up E — sorry I missed you, I'm on a job. Fastest way onto the calendar:
> pickitupe.com/book?s=call (2 min, $50 holds your day, comes off the bill). Or reply here with
> your address + what you need and I'll call back within the hour. — Keaton, 701-213-3969

Both live in `phone-line.server.ts` (`GREETING`, `textBack()`); change them there.

---

## Phase 2 — an AI receptionist that *books*

Today's line converts a missed call into a lead + a link. The next step is a voice agent that
holds the conversation and takes the booking on the phone. Options, ranked for a one-truck
business:

| | Monthly | Books into our system? | Setup | Verdict |
|---|---|---|---|---|
| **Vapi / Retell "custom LLM" → our `/call` dispatcher** | ≈$0.10–0.15/min talk time (~$10–25/mo) + $2 number | **Yes** — same Claude dispatcher (`src/lib/dispatcher.ts`) that runs the web shop line, so it quotes from `pricebook.ts`, checks the calendar and creates the hold, then texts the $50 deposit link | 1–2 days of build: an HTTP endpoint Vapi calls per turn; no card over the phone (PCI + our rules) | **Build this when call volume justifies it** — the site already has the brain, only the mouth is missing |
| Rosie (heyrosie.com) | $49 flat (250 min) | No — takes a message, texts you | 30 min | Fine stopgap if the Twilio line feels too thin; overlaps with what we just built |
| Goodcall | from $79 | Partial (its own calendar) | 1 hr | Skip — second calendar to reconcile |
| Twilio ConversationRelay + Claude, self-hosted | ≈$0.05/min + hosting | Yes | Needs a WebSocket server (not Netlify) — a $5 Fly.io box | Only if we outgrow Vapi/Retell pricing |

Trigger to build Phase 2: **10+ missed calls a week** for two weeks, or the text-back converts
under 30 %. Until then the human callback within the hour beats any bot — Grand Forks still
wants to hear the guy with the truck.
