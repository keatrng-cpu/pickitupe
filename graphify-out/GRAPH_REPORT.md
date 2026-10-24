# Graph Report - pickitupe  (2026-10-24)

## Corpus Check
- 195 files · ~378,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .css 2, .example 1)

## Summary
- 1552 nodes · 4203 edges · 80 communities (68 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27b6d381`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- plan-actions.ts
- package.json
- quote-form.tsx
- jobs_.crew.tsx
- junk-removal-grand-forks.tsx
- pricebook.ts
- my.$token.tsx
- pageHead
- react
- plan-model.mjs
- jobs_.$id.tsx
- plan.tsx
- chat-knowledge.ts
- grok-pwa-shared.mjs
- care.server.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- db.ts
- care.ts
- receipts.ts
- mem.py
- grok-pwa-plugin.mjs
- bookings.ts
- assess-actions.ts
- browser-smoke.mjs
- CallPage
- devDependencies
- phone-line.server.ts
- ref_node_fs
- server.ts
- dispatcher.ts
- LazyPGliteDriver
- ref_node_url
- preview-host-bridge.ts
- leaf-cleanup-grand-forks.tsx
- compilerOptions
- status.tsx
- README.md
- about.tsx
- Deploy — Netlify + Supabase
- The missed-call line
- east-grand-forks.tsx
- scripts
- Pick It Up E — Pricebook
- browser-guard.mjs
- service-area.ts
- sizeOptionsFor
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- pay-finalize.server.ts
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- SiteFooter
- formatRange
- NOW — pickitupe current truth
- call.tsx
- grok-pwa-shared.d.mts
- AGENTS.md
- GROK.md
- overrides
- virtual-grok-og-identity.d.ts
- startup.sh
- grokOgIdentity
- CLAUDE.md — reference sections (moved verbatim)
- seo.ts
- booking-alert.ts
- Pick It Up E
- Rules
- house-packs.tsx

## God Nodes (most connected - your core abstractions)
1. `@tanstack/react-router` - 48 edges
2. `formatRange()` - 44 edges
3. `cn()` - 42 edges
4. `react` - 41 edges
5. `estimate` - 40 edges
6. `SiteHeader()` - 39 edges
7. `CallPage()` - 39 edges
8. `getSql()` - 33 edges
9. `SiteFooter()` - 29 edges
10. `lucide-react` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Schema` --references--> `ensureOwnerTables()`  [INFERRED]
  migrations/CLAUDE.md → src/lib/owner-schema.ts
- `What this app already does` --references--> `QuoteForm()`  [INFERRED]
  docs/agents/CLAUDE-reference.md → src/components/quote-form.tsx
- `What this app already does` --references--> `notifyCustomer()`  [INFERRED]
  docs/agents/CLAUDE-reference.md → src/lib/customer-notify.server.ts
- `The missed-call line` --references--> `leadEmail()`  [INFERRED]
  PHONE-LINE.md → src/lib/email-theme.ts
- `What this app already does` --references--> `ensureOwnerTables()`  [INFERRED]
  docs/agents/CLAUDE-reference.md → src/lib/owner-schema.ts

## Import Cycles
- None detected.

## Communities (80 total, 12 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.13
Nodes (24): HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS, Mark(), MOBILE_NAV, NAV (+16 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+45 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.12
Nodes (37): money(), Stat(), ReceiptDrop(), ResultCard(), saveSettings, suggestAddresses(), categoryFor(), CostPhase (+29 more)

### Community 3 - "plan-actions.ts"
Cohesion: 0.08
Nodes (44): stripe, APP_PRODUCT_IDS, isAmericanPennyPowerObject(), isAppMeta(), isAppPrice(), Meta, PriceLike, CLOSED (+36 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (48): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+40 more)

### Community 5 - "quote-form.tsx"
Cohesion: 0.12
Nodes (21): @hookform/resolvers, react-hook-form, FieldError(), QuoteForm(), onAssess(), onSubmit(), schema, SERVICES (+13 more)

### Community 6 - "jobs_.crew.tsx"
Cohesion: 0.10
Nodes (38): btnCls, fmtDate(), fmtWhen(), ghostBtnCls, inputCls, NotOwner(), OwnerShell(), TABS (+30 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (14): BLOCK_MIN_JOB_LOW, addOns, bags, cleanout, FAQS, freon, full, halfBed (+6 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.06
Nodes (54): The block deal: why $40, and why it can't stack, LotSizeField(), PRESETS, Props, add(), addOnLabel(), applyFlat(), applyPromo() (+46 more)

### Community 9 - "my.$token.tsx"
Cohesion: 0.12
Nodes (27): AskBox(), SUGGESTIONS, Turn, BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow() (+19 more)

### Community 10 - "pageHead"
Cohesion: 0.39
Nodes (12): breadcrumbJsonLd(), canonical(), faqJsonLd(), pageHead(), serviceJsonLd(), Route, Route, Route (+4 more)

### Community 11 - "react"
Cohesion: 0.20
Nodes (14): react, FinePrint(), HaulVideo(), Props, HousePacks(), RateReel(), Reveal(), ReviewStrip() (+6 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "jobs_.$id.tsx"
Cohesion: 0.08
Nodes (42): todayLocalISO(), addBookingEvent, addExpense, addPayment, deletePayment, OwnerSummary, updateBookingDetails, ownerJobLink (+34 more)

### Community 14 - "plan.tsx"
Cohesion: 0.19
Nodes (9): class-variance-authority, @radix-ui/react-slot, Button(), buttonVariants, Props, authClient, Login(), Route (+1 more)

### Community 15 - "chat-knowledge.ts"
Cohesion: 0.09
Nodes (29): @anthropic-ai/sdk, send(), HeroQuoteTeaser(), sendAsk(), askQuestion, CONCIERGE_MODEL, CONCIERGE_RULES, contactOk() (+21 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.14
Nodes (28): grokPwaPlugin(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags(), grokOgHeadTags() (+20 more)

### Community 17 - "care.server.ts"
Cohesion: 0.12
Nodes (20): alertOwnerCare(), hits, KIND_LABEL, MAX_PHOTO_BYTES, MAX_PHOTOS, newToken(), openTicket(), SERVICE_NAME (+12 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.08
Nodes (40): addTrip, BookingDetail, BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, deleteExpense (+32 more)

### Community 20 - "crew.tsx"
Cohesion: 0.14
Nodes (33): clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact, crewMarkDone, editTimeEntry (+25 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.22
Nodes (19): What this app already does, serviceLabel(), bookedEmail(), BookedInput, C, calendarLink(), doneEmail(), DoneInput (+11 more)

### Community 22 - "db.ts"
Cohesion: 0.21
Nodes (11): createNeonSql(), createPgliteSql(), createSql(), dbSource, globalBoot, globalRef, identity(), Run (+3 more)

### Community 23 - "care.ts"
Cohesion: 0.11
Nodes (37): DateField(), Props, getScheduleFill, askForChange, canSelfMove(), confirmDeposit, daysBetween(), fillExcluding() (+29 more)

### Community 24 - "receipts.ts"
Cohesion: 0.19
Nodes (19): addOneYear(), ALLOWED, bookReceiptAnyway, businessStart(), callModel(), dataUrlToBuffer(), Extracted, extractedSchema (+11 more)

### Community 25 - "mem.py"
Cohesion: 0.18
Nodes (17): 2026-10-13 — auto-memory protocol adopted, DECISIONS — pickitupe (append-only), build(), changed(), context(), gbin(), graph(), install_hook() (+9 more)

### Community 26 - "grok-pwa-plugin.mjs"
Cohesion: 0.19
Nodes (20): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+12 more)

### Community 27 - "bookings.ts"
Cohesion: 0.20
Nodes (14): bookingInput, listBookings, listMyBookings, OWNER_BOOKING_SELECT, updateBookingStatus, getCareBoard, ensureDbReady(), getPglite() (+6 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.25
Nodes (14): Props, assessJob, AssessOk, imageParts(), parseAssess(), RegionalComp, regionalFor(), systemFor() (+6 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "CallPage"
Cohesion: 0.21
Nodes (17): PhotoQuote(), addFiles(), run(), shrink(), speakShop, packService(), saveLastBooking(), CallPage() (+9 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+14 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.10
Nodes (30): The words, claimByPhone, sendMyLinks, digitsPhone(), formatPhone(), isUsPhone(), AFTER_MESSAGE, AFTER_MESSAGE_NO_SMS (+22 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.09
Nodes (14): qrcode, built, here, html, names, printDir, qr, src (+6 more)

### Community 34 - "server.ts"
Cohesion: 0.06
Nodes (44): better-auth, pg, @tanstack/react-start, getBearerToken(), inLivePreview(), openSignInPopup(), PopupMessage, setBearerToken() (+36 more)

### Community 35 - "dispatcher.ts"
Cohesion: 0.14
Nodes (36): loadFill(), absorb(), applyToolToLead(), asPack(), asService(), ChatTurn, deskSnapshot(), fallbackReply() (+28 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.14
Nodes (6): @electric-sql/pglite, kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.26
Nodes (3): full, K, base

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.12
Nodes (21): sonner, zod, PreviewHostBridge(), SourceCapture(), AuthProvider(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost() (+13 more)

### Community 39 - "leaf-cleanup-grand-forks.tsx"
Cohesion: 0.11
Nodes (15): LEAF_KSF, acre, addOns, bagging, FAQS, gutters, guttersWrap, half (+7 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "status.tsx"
Cohesion: 0.43
Nodes (6): completeMyBooking, JobCard(), Route, SERVICE_LABEL, StatusPage(), hauled()

### Community 42 - "README.md"
Cohesion: 0.23
Nodes (4): Schema, Print — door hanger, Visual / motion, Pricing, bookings, SEO, area

### Community 43 - "about.tsx"
Cohesion: 0.22
Nodes (11): TEL, AFTER_HOURS, FALL_START, HOURS_LINE, HOURS_NOTE, LIVE_PHONE, LIVE_PHONE_TEL, TOWNS (+3 more)

### Community 44 - "Deploy — Netlify + Supabase"
Cohesion: 0.18
Nodes (9): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify, For Claude / other agents (+1 more)

### Community 45 - "The missed-call line"
Cohesion: 0.18
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "east-grand-forks.tsx"
Cohesion: 0.14
Nodes (13): FAQS, gutter, gutterComplex, gutterStd, junk, junkFull, junkHalf, junkQuarter (+5 more)

### Community 47 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:dev, db:migrate, dev, format, lint, preview (+2 more)

### Community 48 - "Pick It Up E — Pricebook"
Cohesion: 0.20
Nodes (9): Add-ons, Gutter cleaning — single-story, from the ground, Haul work — sized by the bed, Leaf cleanup — priced by the lot, Pick It Up E — Pricebook, Same-stop house packs, Sources, The truck-size caveat — read before quoting a big job (+1 more)

### Community 49 - "browser-guard.mjs"
Cohesion: 0.29
Nodes (8): playwright, checkedOutputPath(), checkedUrl(), fail(), LOOPBACK_HOSTNAMES, outPng, timeoutMs, url

### Community 50 - "service-area.ts"
Cohesion: 0.18
Nodes (15): AddressField(), choose(), handleTyping(), AddressHit, AreaTier, AreaVerdict, CORE_MILES, CORE_TOWNS (+7 more)

### Community 51 - "sizeOptionsFor"
Cohesion: 0.18
Nodes (17): SERVICES, JOBS, QuickQuote(), pick(), PromoStatus, getOfferStatus, SIZE_HINTS, AddOnKey (+9 more)

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "pay-finalize.server.ts"
Cohesion: 0.25
Nodes (14): careSql(), ensureManageToken(), manageUrl(), sendLinksForPhone(), bookedMessage(), notifyCustomer(), logEvent(), ensurePayColumns() (+6 more)

### Community 55 - "vite.config.ts"
Cohesion: 0.29
Nodes (4): nitro, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 56 - "brand-check.test.mjs"
Cohesion: 0.23
Nodes (9): computeBrandWarnings(), MAX_CARD_BYTES, siteDeclaresOgTypeGame(), GAME_SITE, UTILITY_CUSTOM_SITE, UTILITY_SITE, OG_SITE_REL_PATH, readOgSite() (+1 more)

### Community 57 - "renewal-notices.mts"
Cohesion: 0.33
Nodes (3): config, config, @netlify/functions

### Community 58 - "Door hanger — print spec"
Cohesion: 0.33
Nodes (6): Build (print-ready files live in this folder), Copy (keep in sync with `src/components/door-hanger.tsx`), Door hanger — print spec, QR code, References in the repo, Size

### Community 59 - "falling-leaves.tsx"
Cohesion: 0.47
Nodes (5): FallingLeaves(), Leaf, Maple(), seedLeaves(), TINT

### Community 60 - "SiteFooter"
Cohesion: 0.48
Nodes (6): SiteFooter(), PublicReview, REVIEW_URL, ReviewCard(), ReviewsPage(), Stars()

### Community 61 - "formatRange"
Cohesion: 0.29
Nodes (13): Block(), Faq, PriceTable(), ServicePage(), formatRange(), PLAN_FALL_GUTTERS, Page(), FAQS (+5 more)

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts / constraints, NOW — pickitupe current truth

### Community 63 - "call.tsx"
Cohesion: 0.16
Nodes (12): lucide-react, @tanstack/react-router, ROWS, StickyDock(), AppErrorComponent(), PROMO_DEADLINE_LABEL, getRouter(), Search (+4 more)

### Community 75 - "seo.ts"
Cohesion: 0.20
Nodes (10): AREA_SERVED, areaServedJsonLd(), FAQ, localBusinessJsonLd(), NEIGHBORHOODS, OPENING_HOURS, SAME_AS, SERVICES (+2 more)

### Community 76 - "booking-alert.ts"
Cohesion: 0.31
Nodes (8): BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, URGENCY_LABEL, submitBooking

### Community 77 - "Pick It Up E"
Cohesion: 0.29
Nodes (7): Brand, Data, Pick It Up E, Quoting, Routes, Run locally, Stack

### Community 78 - "Rules"
Cohesion: 0.40
Nodes (5): Rules, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

## Knowledge Gaps
- **43 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 580 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-router` connect `call.tsx` to `site-header.tsx`, `jobs_.books.tsx`, `plan-actions.ts`, `package.json`, `jobs_.crew.tsx`, `junk-removal-grand-forks.tsx`, `pricebook.ts`, `my.$token.tsx`, `react`, `jobs_.$id.tsx`, `plan.tsx`, `care.server.ts`, `crew.tsx`, `phone-line.server.ts`, `server.ts`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `status.tsx`, `about.tsx`, `east-grand-forks.tsx`, `sizeOptionsFor`, `pay-finalize.server.ts`, `SiteFooter`, `formatRange`, `house-packs.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1330049261083744 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-start` connect `server.ts` to `dispatcher.ts`, `package.json`, `plan-actions.ts`, `chat-knowledge.ts`, `care.server.ts`, `books.ts`, `crew.tsx`, `vite.config.ts`, `care.ts`, `receipts.ts`, `bookings.ts`, `assess-actions.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `jobs_.books.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12179487179487179 - nodes in this community are weakly interconnected._