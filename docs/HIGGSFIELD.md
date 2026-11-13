# Higgsfield → site: the video workflow

Written 2026-11-13 from Higgsfield's own help center and pricing page (read that day; links at the bottom).
Nothing here has been bought, connected or generated yet.

## The one rule

**Brand animation only.** Higgsfield animates *our illustrated truck* (the hero loop, social spots). It never makes
anything that reads as proof of real work: no before/after, no "our crew", no customer house, no AI person presented
as a customer. Those are real job photos, and the Google profile takes real photos only. AI "evidence" is the
fake-testimonial problem CLAUDE.md bans, and a trust killer for a one-truck business. Don't upload customer photos
or addresses to Higgsfield either: non-Enterprise content may be used for training.

## Connect it (5 minutes, your account, your click)

1. **Plan:** Plus, monthly ($59 list, 1,200 credits). Starter can't use start/end frames, which the seamless loop
   needs. Skip the yearly sale until the first clip ships. Every generation made **through Claude** costs credits,
   even on models that are "unlimited" on higgsfield.ai.
2. **Claude (desktop or claude.ai):** Settings → Connectors → Add custom connector → name `Higgsfield`, URL
   `https://mcp.higgsfield.ai/mcp` → Connect → sign in to Higgsfield. Test it: ask "What is my Higgsfield credit
   balance?" You may need to switch the connector on per chat.
3. **Claude Code (optional):** Higgsfield documents its CLI here, not the connector URL:
   `npm i -g @higgsfield/cli` → `higgsfield auth login` → `npx skills add higgsfield-ai/skills`.

Files you attach in the Claude chat are **not** passed to Higgsfield. Upload references through Higgsfield's own
upload window.

## Reference stills (already made)

`node scripts/make-higgsfield-refs.mjs` → `media/higgsfield/`
- `hero-start-frame.png` (1440×1080, 4:3): the hero composition on the page green, drawn from `src/lib/truck-art.ts`.
- `truck-sheet.png`: the truck alone on grey. Save it as an Element tagged "vehicle appearance only".

Starting from our own art keeps the truck identical across the site, the print and every clip.

## Shot 1: hero loop → `MEDIA.heroLoop`

- **Model:** Kling 3.0 image-to-video. **Start frame = end frame =** `hero-start-frame.png`. 1080p, 10 s (5 s is
  fine too). About 16 credits a take; budget 4–6 takes.
- **Prompt:**
  > Locked-off tripod shot of this exact illustrated vintage cream pickup, parked at blue hour. Light snow falls low
  > and steady on a soft wind, never floating. A thin curl of exhaust vapor drifts from the tailpipe. The headlight
  > glows warm and steady. The truck does not move. Same framing, same light and colors for the whole clip. No camera
  > move, no new objects, no text changes, no logos.
- **Why these words:** same start and end frame plus continuing motion is the documented loop trick. "Low and fast,
  never floating" is Higgsfield's own snow advice. A locked camera stops perspective jumps at the seam.
- **Reject a take if:** the door script changes, the wheels or rails morph, a badge or logo appears, the light pulses
  at the loop seam, or the snow reads as floating dust.

## Shot 2: 15 s vertical spot (Facebook, Nextdoor, Reels)

- **Model:** Seedance 2.5, 9:16, with sound. Draft at 480p (about 30 credits per 10 s), final at 1080p (about
  240–320 credits).
- **Beats:** 0–3 s an illustrated garage packed to the door → 3–9 s the cream truck backs in, two *stylized*
  figures carry out a couch → 9–13 s it drives off through snow, garage empty → 13–15 s hold on the truck.
- **Keep text out of the AI.** Add the hook ("Get the garage back before January"), the price ("One piece from
  $59", from the site) and the phone in an editor afterwards, so the lettering is crisp and the number is the live
  one. AI lettering garbles, and a wrong phone number on a video can't be fixed after it's posted.
- People carrying furniture fail often: describe the start pose and the end pose, keep each shot short, expect about
  three takes per usable shot, and cut between shots rather than asking for one long carry.

## Ingest

```bash
winget install Gyan.FFmpeg            # once
node scripts/ingest-clip.mjs <download.mp4> --slot hero-loop
```

That writes `public/media/hero-loop.{mp4,webm}` plus `hero-loop-poster.jpg` (frame 0, so there's no flash when it
starts) and prints the line to paste into `MEDIA` in `src/lib/media.ts`. The hero swaps the illustration for the
loop with no layout change.

Before merging, check it on the page:
- The edges melt into the green (`.claude/rules/visual.md`).
- The mp4 stays under about 2.5 MB.
- Pause and reduced motion still work (the poster shows).

## Costs at a glance (Plus, list price ≈ $0.049/credit)

| Job | Credits | ≈ $ |
|---|---|---|
| Hero loop, 5 takes × 10 s Kling 3.0 1080p | ~80 | ~$4 |
| 15 s Seedance spot, drafts + one 1080p final | ~300 | ~$15 |
| Month of the above + stills | well under 1,200 | inside the $59 plan |

These are Higgsfield's published per-generation rates. Failed or blocked generations are usually refunded; finished
clips with flaws are charged.

## Sources (read 2026-11-13)

- Connect: https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent
- What the MCP does: https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp
- Pricing and credits: https://higgsfield.ai/pricing
- Which model: https://higgsfield.ai/creator-hub/help-center/ai-models/which-ai-model-should-i-use
- Kling start/end frames: https://higgsfield.ai/blog/Kling-Start-End-Frames
- Kling 3.0 guide (snow): https://higgsfield.ai/blog/Kling-3.0-is-on-Higgsfield-User-Guide-AI-Video-Generation
- Distortions (people): https://higgsfield.ai/blog/how-to-avoid-distortions-ai-videos
- Small-business ads: https://higgsfield.ai/blog/video-ads-small-business-ai
- IP blocks / logos: https://higgsfield.ai/creator-hub/help-center/troubleshooting/my-generation-blocked-for-copyright-or-ip
- Ownership / commercial use: https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially
- Higgsfield's Claude Code skills: https://github.com/higgsfield-ai/skills
