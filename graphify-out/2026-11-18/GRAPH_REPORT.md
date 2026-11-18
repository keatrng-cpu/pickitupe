# Graph Report - pickitupe  (2026-11-18)

## Corpus Check
- 225 files · ~609,457 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 4, .css 2, .example 1)

## Summary
- 1802 nodes · 4780 edges · 93 communities (82 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a7f9866`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- plan.tsx
- package.json
- pay-actions.ts
- owner-shell.tsx
- junk-removal-grand-forks.tsx
- pricebook.ts
- care.ts
- pageHead
- index.tsx
- plan-model.mjs
- messages.ts
- jobs_.$id.tsx
- chat-actions.ts
- grok-pwa-shared.mjs
- care.server.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- server.ts
- bookings.ts
- receipts.ts
- mem.py
- Pick It Up E: the marketing workflow
- truck-scene.ts
- chat-knowledge.ts
- browser-smoke.mjs
- call.tsx
- devDependencies
- phone-line.server.ts
- ref_node_fs
- verify.server.ts
- dispatcher.ts
- LazyPGliteDriver
- ref_node_url
- preview-host-bridge.ts
- leaf-cleanup-grand-forks.tsx
- compilerOptions
- make-winter-print.mjs
- README.md
- site-phone.ts
- Deploy — Netlify + Supabase
- The missed-call line
- east-grand-forks.tsx
- scripts
- Pick It Up E — Pricebook
- playwright
- service-area.ts
- formatRange
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- truck-stage.tsx
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- estate-cleanout-grand-forks.tsx
- gutter-cleaning-grand-forks.tsx
- NOW — pickitupe current truth
- @tanstack/react-router
- grok-pwa-shared.d.mts
- AGENTS.md
- GROK.md
- overrides
- virtual-grok-og-identity.d.ts
- startup.sh
- grokOgIdentity
- CLAUDE.md — reference sections (moved verbatim)
- appliance-removal-grand-forks.tsx
- popup.server.ts
- order-e2e.mjs
- Rules
- landlords.tsx
- db.ts
- ingest-clip.mjs
- river-crossing.tsx
- client.ts
- login.tsx
- reviews.tsx
- bed-load.tsx
- seo.ts
- gates.tsx
- booking-alert.ts
- __root.tsx
- SiteFooter
- Pick It Up E

## God Nodes (most connected - your core abstractions)
1. `formatRange()` - 53 edges
2. `react` - 52 edges
3. `@tanstack/react-router` - 51 edges
4. `SiteHeader()` - 46 edges
5. `estimate` - 42 edges
6. `cn()` - 42 edges
7. `CallPage()` - 41 edges
8. `lucide-react` - 34 edges
9. `SiteFooter()` - 33 edges
10. `getSql()` - 33 edges

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

## Communities (93 total, 11 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.18
Nodes (17): HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS, Mark(), MOBILE_MORE, MOBILE_NAV (+9 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+46 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.17
Nodes (33): fmtDate(), money(), Stat(), todayLocalISO(), ReceiptDrop(), ResultCard(), addExpense, saveSettings (+25 more)

### Community 3 - "plan.tsx"
Cohesion: 0.07
Nodes (48): sonner, stripe, APP_PRODUCT_IDS, isAmericanPennyPowerObject(), isAppMeta(), isAppPrice(), Meta, PriceLike (+40 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (51): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+43 more)

### Community 5 - "pay-actions.ts"
Cohesion: 0.31
Nodes (8): zod, depositDollars(), lockInput, startSpringHold, stripeClient(), stripeReady, landlordDeposit(), LandlordPack

### Community 6 - "owner-shell.tsx"
Cohesion: 0.12
Nodes (27): btnCls, fmtWhen(), ghostBtnCls, inputCls, NotOwner(), OwnerShell(), TABS, useOwnerLoader() (+19 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (13): addOns, bags, cleanout, FAQS, freon, full, halfBed, longCarry (+5 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.08
Nodes (36): LotSizeField(), PRESETS, Props, add(), applyFlat(), applyPromo(), blockCreditFor(), bookedApart() (+28 more)

### Community 9 - "care.ts"
Cohesion: 0.06
Nodes (65): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), handleFiles(), googleCalendarUrl(), askForChange (+57 more)

### Community 10 - "pageHead"
Cohesion: 0.42
Nodes (13): breadcrumbJsonLd(), canonical(), faqJsonLd(), pageHead(), serviceJsonLd(), Route, Route, Route (+5 more)

### Community 11 - "index.tsx"
Cohesion: 0.14
Nodes (17): react, BeforeAfter(), GarageArt(), Img, CountUp(), HowItWorksRoad(), PHOTO_TEXT, STEPS (+9 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "messages.ts"
Cohesion: 0.12
Nodes (18): BookingRow, OwnerSummary, MessageContext, MessageKind, MessageTemplate, REVIEW_URL, TEMPLATES, templatesForStage() (+10 more)

### Community 14 - "jobs_.$id.tsx"
Cohesion: 0.13
Nodes (28): addBookingEvent, addPayment, BookingDetail, deleteExpense, deletePayment, deleteTrip, DropSite, getBookingDetail (+20 more)

### Community 15 - "chat-actions.ts"
Cohesion: 0.11
Nodes (21): @anthropic-ai/sdk, AskBox(), send(), SUGGESTIONS, Turn, FinePrint(), sendAsk(), askQuestion (+13 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.09
Nodes (48): GROK_OG_IDENTITY_ID, grokPwaPlugin(), INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT (+40 more)

### Community 17 - "care.server.ts"
Cohesion: 0.12
Nodes (28): alertOwnerCare(), ensureManageToken(), hits, KIND_LABEL, manageUrl(), MAX_PHOTO_BYTES, MAX_PHOTOS, newToken() (+20 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.07
Nodes (44): addTrip, BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, ExpenseRow, FixedCost (+36 more)

### Community 20 - "crew.tsx"
Cohesion: 0.11
Nodes (42): clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact, crewMarkDone, CrewMember (+34 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.18
Nodes (22): What this app already does, serviceLabel(), bookedEmail(), BookedInput, C, calendarLink(), doneEmail(), DoneInput (+14 more)

### Community 22 - "server.ts"
Cohesion: 0.13
Nodes (13): emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, databaseUrl, explicitBaseURL, globalAuthRef (+5 more)

### Community 23 - "bookings.ts"
Cohesion: 0.25
Nodes (17): bookingInput, completeMyBooking, getScheduleFill, listBookings, listMyBookings, loadFill(), OWNER_BOOKING_SELECT, submitBooking (+9 more)

### Community 24 - "receipts.ts"
Cohesion: 0.17
Nodes (19): addOneYear(), ALLOWED, bookReceiptAnyway, businessStart(), callModel(), dataUrlToBuffer(), Extracted, extractedSchema (+11 more)

### Community 25 - "mem.py"
Cohesion: 0.13
Nodes (23): 2026-10-13 — auto-memory protocol adopted, 2026-11-13 — classy truck, phone in one file, print from the pricebook, 2026-11-13 — hero loop: Kling via a 16:9 frame, video path fixed before the take, 2026-11-13 — winter: junk first, 3D truck hero, 2026-11-14 — design pass from the agency skills + vault quality bar; honest price comparison, 2026-11-14 — load slider, priced add-ons, orders proven end to end, the Sorlie Bridge, 2026-11-18 — one green work truck, hero loop on the winter stage, DECISIONS — pickitupe (append-only) (+15 more)

### Community 26 - "Pick It Up E: the marketing workflow"
Cohesion: 0.06
Nodes (29): Connect it (5 minutes, your account, your click), Costs at a glance (Plus, list price ≈ $0.049/credit), Higgsfield → site: the video workflow, Ingest, Reference stills (already made), Shot 1: hero loop → `MEDIA.heroLoop`, Shot 2: 15 s vertical spot (Facebook, Nextdoor, Reels), Sources (read 2026-11-13) (+21 more)

### Community 27 - "truck-scene.ts"
Cohesion: 0.18
Nodes (16): three, buildSnow(), buildTruck(), buildWorld(), doorTexture(), flakeTexture(), mountTruckScene(), frame() (+8 more)

### Community 28 - "chat-knowledge.ts"
Cohesion: 0.12
Nodes (27): PhotoQuote(), addFiles(), run(), Props, shrink(), assessJob, AssessOk, imageParts() (+19 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "call.tsx"
Cohesion: 0.15
Nodes (25): BedLoad(), LoadSlider(), speakShop, talkShop, canonicalSize(), HousePack, packService(), parseAddOns() (+17 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.12
Nodes (22): The words, AFTER_MESSAGE, AFTER_MESSAGE_NO_SMS, afterMessage(), appendLeadNote(), CallLead, escXml(), greeting (+14 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.09
Nodes (16): qrcode, built, here, html, names, printDir, qr, src (+8 more)

### Community 34 - "verify.server.ts"
Cohesion: 0.18
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, authConfigured, databaseConfigured, DEV_USER_ID, getSessionUser() (+5 more)

### Community 35 - "dispatcher.ts"
Cohesion: 0.10
Nodes (45): DateField(), Props, claimByPhone, sendMyLinks, absorb(), applyToolToLead(), asPack(), asService() (+37 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.15
Nodes (5): kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.18
Nodes (5): full, K, migrationsDir, base, SRC

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.19
Nodes (15): PreviewHostBridge(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost(), resolveParentEmbedderOrigin(), collectRoutePathsFromTree(), EnvelopeSchema, HelloSchema (+7 more)

### Community 39 - "leaf-cleanup-grand-forks.tsx"
Cohesion: 0.11
Nodes (15): LEAF_KSF, acre, addOns, bagging, FAQS, gutters, guttersWrap, half (+7 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "make-winter-print.mjs"
Cohesion: 0.12
Nodes (20): bedIcon(), C, card(), CLEANOUT, DEPOSIT, FRIDGE, hanger(), jobs (+12 more)

### Community 42 - "README.md"
Cohesion: 0.29
Nodes (3): Schema, Print — door hanger, Pricing, bookings, SEO, area

### Community 43 - "site-phone.ts"
Cohesion: 0.15
Nodes (15): TEL, AFTER_HOURS, FALL_START, HOURS_LINE, HOURS_NOTE, LIVE_PHONE, LIVE_PHONE_TEL, TOWNS (+7 more)

### Community 44 - "Deploy — Netlify + Supabase"
Cohesion: 0.18
Nodes (9): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify, For Claude / other agents (+1 more)

### Community 45 - "The missed-call line"
Cohesion: 0.18
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "east-grand-forks.tsx"
Cohesion: 0.13
Nodes (14): FAQS, gutter, gutterComplex, gutterStd, junk, junkFull, junkHalf, junkQuarter (+6 more)

### Community 47 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, build:dev, db:migrate, dev, e2e:order, format, lint (+3 more)

### Community 48 - "Pick It Up E — Pricebook"
Cohesion: 0.20
Nodes (9): Add-ons, Gutter cleaning — single-story, from the ground, Haul work — sized by the bed, Leaf cleanup — priced by the lot, Pick It Up E — Pricebook, Same-stop house packs, Sources, The truck-size caveat — read before quoting a big job (+1 more)

### Community 49 - "playwright"
Cohesion: 0.29
Nodes (8): playwright, checkedOutputPath(), checkedUrl(), fail(), LOOPBACK_HOSTNAMES, outPng, timeoutMs, url

### Community 50 - "service-area.ts"
Cohesion: 0.18
Nodes (15): AddressField(), choose(), handleTyping(), AddressHit, AreaTier, AreaVerdict, CORE_MILES, CORE_TOWNS (+7 more)

### Community 51 - "formatRange"
Cohesion: 0.09
Nodes (41): lucide-react, AddOnPicker(), HeroQuoteTeaser(), SERVICES, HousePacks(), JOBS, QuickQuote(), pick() (+33 more)

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "truck-stage.tsx"
Cohesion: 0.20
Nodes (14): Visual / motion, Winter (2026-11): `winter/`, Winter (2026-11): `winter/`, readMotionPaused(), restoreMotionChoice(), setMotionPaused(), MotionToggle(), useMotionPaused() (+6 more)

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
Cohesion: 0.24
Nodes (8): FallingLeaves(), Leaf, Maple(), seedLeaves(), TINT, Pages, The home page has no booking form, `validateSearch` must return every key, always

### Community 60 - "estate-cleanout-grand-forks.tsx"
Cohesion: 0.16
Nodes (18): StickyDock(), ClearoutClip(), BookMicro(), MarkPuff(), useReduced(), BLOCK_MIN_JOB_LOW, BLOCK_TIERS, ESTATE_TIERS (+10 more)

### Community 61 - "gutter-cleaning-grand-forks.tsx"
Cohesion: 0.31
Nodes (12): Block(), Faq, PriceTable(), ServicePage(), Page(), Page(), FAQS, leafAddOns (+4 more)

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts / constraints, NOW — pickitupe current truth

### Community 63 - "@tanstack/react-router"
Cohesion: 0.20
Nodes (7): @tanstack/react-router, AppErrorComponent(), isOwnerEmail(), ownerEmails(), getRouter(), Route, Route

### Community 75 - "appliance-removal-grand-forks.tsx"
Cohesion: 0.15
Nodes (10): addOns, appliance, FAQS, few, freon, fridge, half, longCarry (+2 more)

### Community 76 - "popup.server.ts"
Cohesion: 0.29
Nodes (8): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), auth, SESSION_TOKEN_COOKIE, Route

### Community 77 - "order-e2e.mjs"
Cohesion: 0.12
Nodes (10): BASE, failed, json(), readBody(), results, ROOT, RUN, sessions (+2 more)

### Community 78 - "Rules"
Cohesion: 0.33
Nodes (6): Rules, The block deal: why $40, and why it can't stack, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

### Community 79 - "landlords.tsx"
Cohesion: 0.15
Nodes (15): HaulVideo(), Props, COMBO_CREDIT, EXTRA_STOP_CUT, LANDLORD_PACKS, packDefaultSize(), STOP_COUNTS, allTurnHigh (+7 more)

### Community 80 - "db.ts"
Cohesion: 0.17
Nodes (13): @electric-sql/pglite, pg, createNeonSql(), createPgliteSql(), createSql(), dbSource, globalBoot, globalRef (+5 more)

### Community 81 - "ingest-clip.mjs"
Cohesion: 0.13
Nodes (11): args, aspect, fail(), input, key, outDir, ROOT, run() (+3 more)

### Community 82 - "river-crossing.tsx"
Cohesion: 0.17
Nodes (12): House(), LEFT, Pine(), RIGHT, RiverCrossing(), TRUCK, Truss(), SPINNING (+4 more)

### Community 83 - "client.ts"
Cohesion: 0.23
Nodes (11): better-auth, getBearerToken(), inLivePreview(), openSignInPopup(), PopupMessage, setBearerToken(), signIn(), signOut() (+3 more)

### Community 84 - "login.tsx"
Cohesion: 0.21
Nodes (8): class-variance-authority, @radix-ui/react-slot, Button(), buttonVariants, Props, authEnabled, Login(), Route

### Community 85 - "reviews.tsx"
Cohesion: 0.38
Nodes (8): Reveal(), ReviewStrip(), listReviews, PublicReview, ReviewCard(), ReviewsPage(), Route, Stars()

### Community 86 - "bed-load.tsx"
Cohesion: 0.18
Nodes (3): BED, ITEMS, LOADS

### Community 87 - "seo.ts"
Cohesion: 0.20
Nodes (10): AREA_SERVED, AREA_SERVED_TEXT, areaServedJsonLd(), localBusinessJsonLd(), NEIGHBORHOODS, OPENING_HOURS, SAME_AS, SERVICES (+2 more)

### Community 88 - "gates.tsx"
Cohesion: 0.28
Nodes (7): authClient, SIGN_IN_PATH, UserButton(), AppUser, CurrentUserState, DEV_USER, useCurrentUser()

### Community 89 - "booking-alert.ts"
Cohesion: 0.36
Nodes (7): BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, URGENCY_LABEL

### Community 90 - "__root.tsx"
Cohesion: 0.43
Nodes (4): SourceCapture(), AuthProvider(), rememberSource(), Route

### Community 91 - "SiteFooter"
Cohesion: 0.32
Nodes (7): SiteFooter(), getOfferStatus, AboutPage(), BookPage(), BookSearch, Route, SERVICE_KEYS

### Community 92 - "Pick It Up E"
Cohesion: 0.29
Nodes (7): Brand, Data, Pick It Up E, Quoting, Routes, Run locally, Stack

## Knowledge Gaps
- **44 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 705 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `owner-shell.tsx`, `junk-removal-grand-forks.tsx`, `care.ts`, `index.tsx`, `messages.ts`, `jobs_.$id.tsx`, `care.server.ts`, `crew.tsx`, `call.tsx`, `phone-line.server.ts`, `dispatcher.ts`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `site-phone.ts`, `east-grand-forks.tsx`, `formatRange`, `estate-cleanout-grand-forks.tsx`, `gutter-cleaning-grand-forks.tsx`, `appliance-removal-grand-forks.tsx`, `popup.server.ts`, `landlords.tsx`, `login.tsx`, `reviews.tsx`, `gates.tsx`, `__root.tsx`, `SiteFooter`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.037037037037037035 - nodes in this community are weakly interconnected._
- **Why does `react` connect `index.tsx` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `owner-shell.tsx`, `care.ts`, `messages.ts`, `jobs_.$id.tsx`, `chat-actions.ts`, `crew.tsx`, `chat-knowledge.ts`, `call.tsx`, `dispatcher.ts`, `preview-host-bridge.ts`, `service-area.ts`, `formatRange`, `truck-stage.tsx`, `falling-leaves.tsx`, `estate-cleanout-grand-forks.tsx`, `gutter-cleaning-grand-forks.tsx`, `landlords.tsx`, `river-crossing.tsx`, `login.tsx`, `reviews.tsx`, `bed-load.tsx`, `gates.tsx`, `__root.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `plan.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07188778492109878 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `playwright` to `ref_node_fs`, `package.json`, `make-winter-print.mjs`, `plan-model.mjs`, `order-e2e.mjs`, `browser-smoke.mjs`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._