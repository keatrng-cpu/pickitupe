# Graph Report - pickitupe  (2026-11-18)

## Corpus Check
- 235 files · ~842,526 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .glb 19, (none) 4, .css 2)

## Summary
- 2026 nodes · 5208 edges · 105 communities (91 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `505e516b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- plan.tsx
- package.json
- HaulScene.tsx
- owner-shell.tsx
- junk-removal-grand-forks.tsx
- pricebook.ts
- schedule.ts
- phone-line.server.ts
- client.ts
- plan-model.mjs
- messages.ts
- draco_wasm_wrapper.js
- chat-actions.ts
- grok-pwa-shared.mjs
- bookings.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- server.ts
- receipt-drop.tsx
- webhook.ts
- mem.py
- Pick It Up E: the marketing workflow
- truck-scene.ts
- assess-actions.ts
- browser-smoke.mjs
- index.tsx
- devDependencies
- db.ts
- ref_node_fs
- verify.server.ts
- dispatcher.ts
- care.server.ts
- ref_node_url
- preview-host-bridge.ts
- leaf-cleanup-grand-forks.tsx
- compilerOptions
- make-winter-print.mjs
- README.md
- quick-quote.tsx
- Deploy — Netlify + Supabase
- The missed-call line
- formatRange
- scripts
- Pick It Up E — Pricebook
- playwright
- service-area.ts
- quote-form.tsx
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- seo.ts
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- landlords.tsx
- basis_transcoder.js
- NOW — pickitupe current truth
- pageHead
- grok-pwa-shared.d.mts
- AGENTS.md
- GROK.md
- overrides
- virtual-grok-og-identity.d.ts
- startup.sh
- grokOgIdentity
- CLAUDE.md — reference sections (moved verbatim)
- LazyPGliteDriver
- gutter-cleaning-grand-forks.tsx
- order-e2e.mjs
- Rules
- call.tsx
- react
- ingest-clip.mjs
- east-grand-forks.tsx
- @tanstack/react-router
- estate-cleanout-grand-forks.tsx
- grok-pwa-plugin.mjs
- bed-load.tsx
- appliance-removal-grand-forks.tsx
- status.tsx
- popup.server.ts
- about.tsx
- care.ts
- Pick It Up E
- ExceptionInfo
- renewal-notice.server.ts
- createWasm
- postRun
- instantiateArrayBuffer
- craftInvokerFunction
- RegisteredPointer_fromWireType
- site-phone.ts
- TRUCK.md
- pricing.tsx
- Effects.tsx
- jobs_.$id.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 57 edges
2. `formatRange()` - 55 edges
3. `@tanstack/react-router` - 52 edges
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

## Communities (105 total, 14 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.14
Nodes (23): HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS, Mark(), MOBILE_MORE, MOBILE_NAV (+15 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (60): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+52 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.15
Nodes (25): money(), Stat(), DropSite, FixedCost, saveSettings, YearBooks, LOT_SQFT, suggestAddresses() (+17 more)

### Community 3 - "plan.tsx"
Cohesion: 0.20
Nodes (19): startSpringHold, stripeClient(), stripeReady, CLOSED, getPlanStatus, openBillingPortal, startPlanCheckout, stripeGate() (+11 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (51): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+43 more)

### Community 5 - "HaulScene.tsx"
Cohesion: 0.06
Nodes (63): gsap, lenis, @react-three/drei, @react-three/fiber, three, bedSlot(), Boot(), clamp01() (+55 more)

### Community 6 - "owner-shell.tsx"
Cohesion: 0.13
Nodes (26): fmtDate(), fmtWhen(), inputCls, NotOwner(), OwnerShell(), TABS, RedirectToSignIn(), CustomerRow (+18 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (13): addOns, bags, cleanout, FAQS, freon, full, halfBed, longCarry (+5 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.06
Nodes (48): LotSizeField(), PRESETS, Props, COMPETITOR_BENCHMARKS, knowledge(), LOCAL, MODEL, add() (+40 more)

### Community 9 - "schedule.ts"
Cohesion: 0.12
Nodes (26): DateField(), Props, getScheduleFill, asNeed(), capacityFor(), DAILY_SLOTS, DayFill, dayOptions() (+18 more)

### Community 10 - "phone-line.server.ts"
Cohesion: 0.11
Nodes (26): The words, e164(), sendEmail(), sendSms(), EmailDoc, REVIEW_URL, ownerInbox(), AFTER_MESSAGE (+18 more)

### Community 11 - "client.ts"
Cohesion: 0.11
Nodes (22): class-variance-authority, @radix-ui/react-slot, Button(), buttonVariants, Props, authClient, authEnabled, getBearerToken() (+14 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "messages.ts"
Cohesion: 0.14
Nodes (17): BookingRow, OwnerSummary, MessageContext, MessageKind, MessageTemplate, smsLink(), TEMPLATES, templatesForStage() (+9 more)

### Community 14 - "draco_wasm_wrapper.js"
Cohesion: 0.08
Nodes (26): A(), B(), C(), D(), E(), f(), e(), G() (+18 more)

### Community 15 - "chat-actions.ts"
Cohesion: 0.14
Nodes (16): @anthropic-ai/sdk, AskBox(), send(), sendAsk(), askQuestion, CONCIERGE_MODEL, CONCIERGE_RULES, contactOk() (+8 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.13
Nodes (29): grokPwaPlugin(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags(), grokOgHeadTags() (+21 more)

### Community 17 - "bookings.ts"
Cohesion: 0.17
Nodes (27): bookingInput, listBookings, listMyBookings, loadFill(), OWNER_BOOKING_SELECT, submitBooking, updateBookingStatus, careSql() (+19 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.06
Nodes (63): addExpense, BookingDetail, BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, deleteExpense (+55 more)

### Community 20 - "crew.tsx"
Cohesion: 0.11
Nodes (43): useOwnerLoader(), clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact, crewMarkDone (+35 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.15
Nodes (26): What this app already does, BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, serviceLabel() (+18 more)

### Community 22 - "server.ts"
Cohesion: 0.13
Nodes (13): better-auth, emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, authConfigured, databaseUrl (+5 more)

### Community 23 - "receipt-drop.tsx"
Cohesion: 0.23
Nodes (11): btnCls, ghostBtnCls, ReceiptDrop(), handleFiles(), ResultCard(), MAX_PDF_BYTES, prepareReceiptFile(), readAsDataUrl() (+3 more)

### Community 24 - "webhook.ts"
Cohesion: 0.21
Nodes (14): stripe, tierForPriceId(), getStripe(), localTestApi(), stripeConfigured(), claimEvent(), listSubscriptions(), startNewServiceYear() (+6 more)

### Community 25 - "mem.py"
Cohesion: 0.10
Nodes (29): 2026-10-13 — auto-memory protocol adopted, 2026-11-13 — classy truck, phone in one file, print from the pricebook, 2026-11-13 — hero loop: Kling via a 16:9 frame, video path fixed before the take, 2026-11-13 — winter: junk first, 3D truck hero, 2026-11-14 — design pass from the agency skills + vault quality bar; honest price comparison, 2026-11-14 — load slider, priced add-ons, orders proven end to end, the Sorlie Bridge, 2026-11-18 — carry-out starts mid-scroll and the quote sits on the swept room, 2026-11-18 — objects sit on the floor and the load sits in the bed (+21 more)

### Community 26 - "Pick It Up E: the marketing workflow"
Cohesion: 0.06
Nodes (29): Connect it (5 minutes, your account, your click), Costs at a glance (Plus, list price ≈ $0.049/credit), Higgsfield → site: the video workflow, Ingest, Reference stills (already made), Shot 1: hero loop → `MEDIA.heroLoop`, Shot 2: 15 s vertical spot (Facebook, Nextdoor, Reels), Sources (read 2026-11-13) (+21 more)

### Community 27 - "truck-scene.ts"
Cohesion: 0.08
Nodes (34): Visual / motion, Winter (2026-11): `winter/`, Winter (2026-11): `winter/`, readMotionPaused(), restoreMotionChoice(), setMotionPaused(), MotionToggle(), useMotionPaused() (+26 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.18
Nodes (19): PhotoQuote(), addFiles(), run(), Props, shrink(), onAssess(), assessJob, AssessOk (+11 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "index.tsx"
Cohesion: 0.19
Nodes (14): FinePrint(), House(), LEFT, Pine(), RIGHT, RiverCrossing(), TRUCK, Truss() (+6 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 32 - "db.ts"
Cohesion: 0.14
Nodes (17): @electric-sql/pglite, pg, createNeonSql(), createPgliteSql(), createSql(), dbSource, ensureDbReady(), getPglite() (+9 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.09
Nodes (16): qrcode, built, here, html, names, printDir, qr, src (+8 more)

### Community 34 - "verify.server.ts"
Cohesion: 0.17
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, databaseConfigured, DEV_USER_ID, getSessionUser(), requireUserId() (+5 more)

### Community 35 - "dispatcher.ts"
Cohesion: 0.17
Nodes (28): absorb(), applyToolToLead(), asPack(), asService(), ChatTurn, deskSnapshot(), fallbackReply(), fillPack() (+20 more)

### Community 36 - "care.server.ts"
Cohesion: 0.15
Nodes (12): alertOwnerCare(), hits, KIND_LABEL, MAX_PHOTO_BYTES, MAX_PHOTOS, newToken(), openTicket(), SERVICE_NAME (+4 more)

### Community 37 - "ref_node_url"
Cohesion: 0.12
Nodes (11): full, K, PRICE_SURFACES, base, SRC, APP_PRODUCT_IDS, isAmericanPennyPowerObject(), isAppMeta() (+3 more)

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.13
Nodes (20): sonner, PreviewHostBridge(), SourceCapture(), AuthProvider(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost(), resolveParentEmbedderOrigin() (+12 more)

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

### Community 43 - "quick-quote.tsx"
Cohesion: 0.24
Nodes (14): JOBS, QuickQuote(), pick(), Props, SameStop(), BedLoad(), LoadSlider(), bundleAddOns() (+6 more)

### Community 44 - "Deploy — Netlify + Supabase"
Cohesion: 0.18
Nodes (9): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify, For Claude / other agents (+1 more)

### Community 45 - "The missed-call line"
Cohesion: 0.18
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "formatRange"
Cohesion: 0.20
Nodes (15): AddOnPicker(), HeroQuoteTeaser(), HousePacks(), BedGauge(), FILL, RateReel(), addOnsFor(), BED_CUBIC_YARDS (+7 more)

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

### Community 51 - "quote-form.tsx"
Cohesion: 0.12
Nodes (21): zod, SERVICES, FieldError(), PromoStatus, QuoteForm(), schema, SERVICES, URGENCY (+13 more)

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "seo.ts"
Cohesion: 0.15
Nodes (12): PHOTO_TEXT, STEPS, AREA_SERVED, areaServedJsonLd(), BUSINESS, FAQ, localBusinessJsonLd(), NEIGHBORHOODS (+4 more)

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
Cohesion: 0.38
Nodes (5): FallingLeaves(), Leaf, Maple(), seedLeaves(), TINT

### Community 60 - "landlords.tsx"
Cohesion: 0.13
Nodes (19): lucide-react, HaulVideo(), Props, StickyDock(), depositDollars(), COMBO_CREDIT, EXTRA_STOP_CUT, LANDLORD_PACKS (+11 more)

### Community 61 - "basis_transcoder.js"
Cohesion: 0.07
Nodes (3): onComplete(), registerType(), sharedRegisterType()

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts, NOW — pickitupe current truth

### Community 63 - "pageHead"
Cohesion: 0.29
Nodes (17): getOfferStatus, breadcrumbJsonLd(), canonical(), faqJsonLd(), pageHead(), serviceJsonLd(), Route, Route (+9 more)

### Community 75 - "LazyPGliteDriver"
Cohesion: 0.15
Nodes (5): kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 76 - "gutter-cleaning-grand-forks.tsx"
Cohesion: 0.28
Nodes (13): Block(), Faq, PriceTable(), ServicePage(), PLAN_FALL_GUTTERS, Page(), Page(), FAQS (+5 more)

### Community 77 - "order-e2e.mjs"
Cohesion: 0.12
Nodes (10): BASE, failed, json(), readBody(), results, ROOT, RUN, sessions (+2 more)

### Community 78 - "Rules"
Cohesion: 0.33
Nodes (6): Rules, The block deal: why $40, and why it can't stack, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

### Community 79 - "call.tsx"
Cohesion: 0.15
Nodes (22): onSubmit(), speakShop, HousePack, packService(), saveLastBooking(), readSource(), CallPage(), applyLead() (+14 more)

### Community 80 - "react"
Cohesion: 0.21
Nodes (10): react, Reveal(), ReviewStrip(), SiteFooter(), listReviews, PublicReview, AboutPage(), ReviewCard() (+2 more)

### Community 81 - "ingest-clip.mjs"
Cohesion: 0.13
Nodes (11): args, aspect, fail(), input, key, outDir, ROOT, run() (+3 more)

### Community 82 - "east-grand-forks.tsx"
Cohesion: 0.13
Nodes (14): FAQS, gutter, gutterComplex, gutterStd, junk, junkFull, junkHalf, junkQuarter (+6 more)

### Community 83 - "@tanstack/react-router"
Cohesion: 0.43
Nodes (3): @tanstack/react-router, AppErrorComponent(), getRouter()

### Community 84 - "estate-cleanout-grand-forks.tsx"
Cohesion: 0.22
Nodes (12): BeforeAfter(), ClearoutClip(), GarageArt(), Img, FLAKES, Snowfall(), ESTATE_TIERS, EstatePage() (+4 more)

### Community 85 - "grok-pwa-plugin.mjs"
Cohesion: 0.20
Nodes (19): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+11 more)

### Community 86 - "bed-load.tsx"
Cohesion: 0.18
Nodes (3): BED, ITEMS, LOADS

### Community 87 - "appliance-removal-grand-forks.tsx"
Cohesion: 0.15
Nodes (10): addOns, appliance, FAQS, few, freon, fridge, half, longCarry (+2 more)

### Community 88 - "status.tsx"
Cohesion: 0.26
Nodes (14): claimByPhone, completeMyBooking, sendMyLinks, digitsPhone(), formatPhone(), isUsPhone(), findOrCreateCallLead(), Route (+6 more)

### Community 89 - "popup.server.ts"
Cohesion: 0.29
Nodes (8): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), auth, SESSION_TOKEN_COOKIE, Route

### Community 90 - "about.tsx"
Cohesion: 0.22
Nodes (11): TEL, AFTER_HOURS, FALL_START, HOURS_LINE, HOURS_NOTE, LIVE_PHONE, LIVE_PHONE_TEL, TOWNS (+3 more)

### Community 91 - "care.ts"
Cohesion: 0.10
Nodes (42): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), googleCalendarUrl(), askForChange, canSelfMove() (+34 more)

### Community 92 - "Pick It Up E"
Cohesion: 0.29
Nodes (7): Brand, Data, Pick It Up E, Quoting, Routes, Run locally, Stack

### Community 94 - "renewal-notice.server.ts"
Cohesion: 0.30
Nodes (10): noticeBody(), NoticeResult, runRenewalNotices(), send(), senderConfigured(), markRenewalNoticeSent(), subscriptionsDueForRenewalNotice(), json() (+2 more)

### Community 95 - "createWasm"
Cohesion: 0.22
Nodes (10): addOnInit(), addRunDependency(), createWasm(), receiveInstance(), receiveInstantiationResult(), findWasmBinary(), getWasmImports(), locateFile() (+2 more)

### Community 96 - "postRun"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run(), doRun()

### Community 97 - "instantiateArrayBuffer"
Cohesion: 0.40
Nodes (5): abort(), getBinaryPromise(), getBinarySync(), instantiateArrayBuffer(), instantiateAsync()

### Community 98 - "craftInvokerFunction"
Cohesion: 0.67
Nodes (4): craftInvokerFunction(), createJsInvoker(), newFunc(), usesDestructorStack()

### Community 99 - "RegisteredPointer_fromWireType"
Cohesion: 0.50
Nodes (3): destructor(), getPointee(), RegisteredPointer_fromWireType()

### Community 100 - "site-phone.ts"
Cohesion: 0.25
Nodes (6): SUGGESTIONS, Turn, NEW_LINE_DIGITS, SITE_E164, SITE_PHONE_DIGITS, SITE_SMS

### Community 102 - "pricing.tsx"
Cohesion: 0.43
Nodes (6): BLOCK_MIN_JOB_LOW, BLOCK_TIERS, addRows(), money(), PricingPage(), rows()

### Community 104 - "jobs_.$id.tsx"
Cohesion: 0.14
Nodes (32): todayLocalISO(), addBookingEvent, addPayment, addTrip, updateBookingDetails, ownerJobLink, startBalanceInvoice, mileageRateFor() (+24 more)

## Knowledge Gaps
- **44 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 780 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `HaulScene.tsx`, `owner-shell.tsx`, `schedule.ts`, `client.ts`, `messages.ts`, `crew.tsx`, `receipt-drop.tsx`, `truck-scene.ts`, `assess-actions.ts`, `index.tsx`, `preview-host-bridge.ts`, `quick-quote.tsx`, `formatRange`, `service-area.ts`, `quote-form.tsx`, `seo.ts`, `falling-leaves.tsx`, `landlords.tsx`, `gutter-cleaning-grand-forks.tsx`, `call.tsx`, `estate-cleanout-grand-forks.tsx`, `bed-load.tsx`, `status.tsx`, `care.ts`, `site-phone.ts`, `jobs_.$id.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `HaulScene.tsx`, `owner-shell.tsx`, `junk-removal-grand-forks.tsx`, `client.ts`, `messages.ts`, `bookings.ts`, `crew.tsx`, `webhook.ts`, `index.tsx`, `db.ts`, `verify.server.ts`, `care.server.ts`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `quick-quote.tsx`, `formatRange`, `quote-form.tsx`, `landlords.tsx`, `gutter-cleaning-grand-forks.tsx`, `call.tsx`, `react`, `east-grand-forks.tsx`, `estate-cleanout-grand-forks.tsx`, `appliance-removal-grand-forks.tsx`, `status.tsx`, `popup.server.ts`, `about.tsx`, `care.ts`, `renewal-notice.server.ts`, `pricing.tsx`, `jobs_.$id.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Why does `n()` connect `draco_wasm_wrapper.js` to `ref_node_url`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.038461538461538464 - nodes in this community are weakly interconnected._