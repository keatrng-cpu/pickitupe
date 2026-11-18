# Graph Report - pickitupe  (2026-11-18)

## Corpus Check
- 235 files · ~841,660 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .glb 19, (none) 4, .css 2)

## Summary
- 2016 nodes · 5200 edges · 105 communities (92 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `14fbaaf1`
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
- east-grand-forks.tsx
- react
- plan-model.mjs
- jobs.tsx
- draco_wasm_wrapper.js
- chat-knowledge.ts
- grok-pwa-shared.mjs
- care.server.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- server.ts
- my.$token.tsx
- receipts.ts
- mem.py
- Pick It Up E: the marketing workflow
- truck-scene.ts
- assess-actions.ts
- browser-smoke.mjs
- quick-quote.tsx
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
- messages.ts
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
- Visual / motion
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- estate-cleanout-grand-forks.tsx
- basis_transcoder.js
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
- bookings.ts
- popup.server.ts
- order-e2e.mjs
- Rules
- call.tsx
- db.ts
- ingest-clip.mjs
- HaulStage.tsx
- client.ts
- pay-finalize.server.ts
- grok-pwa-plugin.mjs
- bed-load.tsx
- seo.ts
- gates.tsx
- care.ts
- owner.ts
- pay-actions.ts
- Pick It Up E
- ExceptionInfo
- addOnsFor
- createWasm
- postRun
- instantiateArrayBuffer
- craftInvokerFunction
- RegisteredPointer_fromWireType
- booking-alert.ts
- TRUCK.md
- foreign-stripe.ts
- Setup
- ownerJobLink

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
- `Deploy — Netlify + Supabase` --references--> `main()`  [INFERRED]
  DEPLOY.md → scripts/migrate.mjs
- `What this app already does` --references--> `QuoteForm()`  [INFERRED]
  docs/agents/CLAUDE-reference.md → src/components/quote-form.tsx
- `What this app already does` --references--> `notifyCustomer()`  [INFERRED]
  docs/agents/CLAUDE-reference.md → src/lib/customer-notify.server.ts
- `The missed-call line` --references--> `leadEmail()`  [INFERRED]
  PHONE-LINE.md → src/lib/email-theme.ts

## Import Cycles
- None detected.

## Communities (105 total, 13 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.10
Nodes (27): class-variance-authority, lucide-react, @radix-ui/react-slot, HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS (+19 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (60): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+52 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.12
Nodes (49): fmtDate(), money(), Stat(), todayLocalISO(), ReceiptDrop(), ResultCard(), addPayment, addTrip (+41 more)

### Community 3 - "plan.tsx"
Cohesion: 0.06
Nodes (59): stripe, SUGGESTIONS, Turn, finalizeBalance(), CLOSED, getPlanStatus, openBillingPortal, startPlanCheckout (+51 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (49): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+41 more)

### Community 5 - "HaulScene.tsx"
Cohesion: 0.08
Nodes (48): postprocessing, @react-three/drei, @react-three/fiber, @react-three/postprocessing, three, clamp01(), Effects, Floor() (+40 more)

### Community 6 - "owner-shell.tsx"
Cohesion: 0.09
Nodes (33): btnCls, fmtWhen(), ghostBtnCls, inputCls, NotOwner(), OwnerShell(), TABS, handleFiles() (+25 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (13): addOns, bags, cleanout, FAQS, freon, full, halfBed, longCarry (+5 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.07
Nodes (41): The block deal: why $40, and why it can't stack, PRESETS, Props, add(), addOnLabel(), applyFlat(), applyPromo(), blockCreditFor() (+33 more)

### Community 9 - "schedule.ts"
Cohesion: 0.13
Nodes (27): DateField(), Props, getScheduleFill, submitBooking, asNeed(), capacityFor(), DAILY_SLOTS, DayFill (+19 more)

### Community 10 - "east-grand-forks.tsx"
Cohesion: 0.13
Nodes (28): BLOCK_TIERS, breadcrumbJsonLd(), canonical(), faqJsonLd(), pageHead(), serviceJsonLd(), Route, FAQS (+20 more)

### Community 11 - "react"
Cohesion: 0.14
Nodes (17): react, HaulVideo(), Props, LotSizeField(), Reveal(), ReviewStrip(), listReviews, PublicReview (+9 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "jobs.tsx"
Cohesion: 0.19
Nodes (12): addBookingEvent, OwnerSummary, smsLink(), PROMO_CAP, PROMO_PERCENT, BoardData, estimateText(), JobsPage() (+4 more)

### Community 14 - "draco_wasm_wrapper.js"
Cohesion: 0.08
Nodes (26): A(), B(), C(), D(), E(), f(), e(), G() (+18 more)

### Community 15 - "chat-knowledge.ts"
Cohesion: 0.09
Nodes (28): @anthropic-ai/sdk, HeroQuoteTeaser(), sendAsk(), SERVICES, PromoStatus, askQuestion, CONCIERGE_MODEL, CONCIERGE_RULES (+20 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.14
Nodes (28): grokPwaPlugin(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags(), grokOgHeadTags() (+20 more)

### Community 17 - "care.server.ts"
Cohesion: 0.15
Nodes (17): alertOwnerCare(), hits, KIND_LABEL, MAX_PHOTO_BYTES, MAX_PHOTOS, openTicket(), sendLinksForPhone(), SERVICE_NAME (+9 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.07
Nodes (43): addExpense, BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, ExpenseRow, FixedCost (+35 more)

### Community 20 - "crew.tsx"
Cohesion: 0.11
Nodes (45): useOwnerLoader(), clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact, crewMarkDone (+37 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.21
Nodes (19): What this app already does, bookedEmail(), BookedInput, C, calendarLink(), doneEmail(), DoneInput, EmailDoc (+11 more)

### Community 22 - "server.ts"
Cohesion: 0.12
Nodes (14): better-auth, emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, auth, databaseUrl (+6 more)

### Community 23 - "my.$token.tsx"
Cohesion: 0.12
Nodes (28): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), TruckSvg(), googleCalendarUrl(), confirmDeposit (+20 more)

### Community 24 - "receipts.ts"
Cohesion: 0.16
Nodes (28): zod, listBookings, updateBookingStatus, careSql(), getSql(), ensureOwnerTables(), ensurePayColumns(), ready() (+20 more)

### Community 25 - "mem.py"
Cohesion: 0.12
Nodes (25): 2026-10-13 — auto-memory protocol adopted, 2026-11-13 — classy truck, phone in one file, print from the pricebook, 2026-11-13 — hero loop: Kling via a 16:9 frame, video path fixed before the take, 2026-11-13 — winter: junk first, 3D truck hero, 2026-11-14 — design pass from the agency skills + vault quality bar; honest price comparison, 2026-11-14 — load slider, priced add-ons, orders proven end to end, the Sorlie Bridge, 2026-11-18 — carry-out starts mid-scroll and the quote sits on the swept room, 2026-11-18 — one green work truck, hero loop on the winter stage (+17 more)

### Community 26 - "Pick It Up E: the marketing workflow"
Cohesion: 0.06
Nodes (29): Connect it (5 minutes, your account, your click), Costs at a glance (Plus, list price ≈ $0.049/credit), Higgsfield → site: the video workflow, Ingest, Reference stills (already made), Shot 1: hero loop → `MEDIA.heroLoop`, Shot 2: 15 s vertical spot (Facebook, Nextdoor, Reels), Sources (read 2026-11-13) (+21 more)

### Community 27 - "truck-scene.ts"
Cohesion: 0.07
Nodes (37): readMotionPaused(), restoreMotionChoice(), setMotionPaused(), MotionToggle(), useMotionPaused(), useReducedMotion(), House(), LEFT (+29 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.15
Nodes (21): PhotoQuote(), addFiles(), run(), Props, shrink(), onAssess(), assessJob, AssessOk (+13 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "quick-quote.tsx"
Cohesion: 0.40
Nodes (9): JOBS, QuickQuote(), pick(), SIZE_HINTS, canonicalService(), featuredSizesFor(), listedSizesFor(), sizeOptionsFor() (+1 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.14
Nodes (18): The words, AFTER_MESSAGE, AFTER_MESSAGE_NO_SMS, afterMessage(), appendLeadNote(), CallLead, escXml(), greeting (+10 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.08
Nodes (16): pg, qrcode, built, here, html, names, printDir, qr (+8 more)

### Community 34 - "verify.server.ts"
Cohesion: 0.18
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, authConfigured, databaseConfigured, DEV_USER_ID, getSessionUser() (+5 more)

### Community 35 - "dispatcher.ts"
Cohesion: 0.18
Nodes (26): absorb(), applyToolToLead(), asPack(), asService(), deskSnapshot(), fallbackReply(), fillPack(), grokLoop() (+18 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.14
Nodes (6): @electric-sql/pglite, kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.20
Nodes (6): full, K, frames, OUT, ROOT, base

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.12
Nodes (20): sonner, PreviewHostBridge(), SourceCapture(), AuthProvider(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost(), resolveParentEmbedderOrigin() (+12 more)

### Community 39 - "leaf-cleanup-grand-forks.tsx"
Cohesion: 0.12
Nodes (14): acre, addOns, bagging, FAQS, gutters, guttersWrap, half, large (+6 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "make-winter-print.mjs"
Cohesion: 0.12
Nodes (20): bedIcon(), C, card(), CLEANOUT, DEPOSIT, FRIDGE, hanger(), jobs (+12 more)

### Community 42 - "README.md"
Cohesion: 0.29
Nodes (3): Schema, Print — door hanger, Pricing, bookings, SEO, area

### Community 43 - "messages.ts"
Cohesion: 0.20
Nodes (8): MessageContext, MessageKind, MessageTemplate, REVIEW_URL, TEL, TEMPLATES, templatesForStage(), Route

### Community 44 - "Deploy — Netlify + Supabase"
Cohesion: 0.22
Nodes (7): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify

### Community 45 - "The missed-call line"
Cohesion: 0.18
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "formatRange"
Cohesion: 0.11
Nodes (30): HousePacks(), Block(), Faq, PriceTable(), ServicePage(), BLOCK_MIN_JOB_LOW, DEPOSIT, formatRange() (+22 more)

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
Cohesion: 0.14
Nodes (18): @hookform/resolvers, react-hook-form, FieldError(), QuoteForm(), onSubmit(), schema, SERVICES, URGENCY (+10 more)

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "Visual / motion"
Cohesion: 0.67
Nodes (3): Visual / motion, Winter (2026-11): `winter/`, Winter (2026-11): `winter/`

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

### Community 60 - "estate-cleanout-grand-forks.tsx"
Cohesion: 0.20
Nodes (13): BeforeAfter(), ClearoutClip(), GarageArt(), Img, FLAKES, Snowfall(), ESTATE_TIERS, REFUSED (+5 more)

### Community 61 - "basis_transcoder.js"
Cohesion: 0.07
Nodes (3): onComplete(), registerType(), sharedRegisterType()

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts, NOW — pickitupe current truth

### Community 63 - "@tanstack/react-router"
Cohesion: 0.43
Nodes (3): @tanstack/react-router, AppErrorComponent(), getRouter()

### Community 75 - "bookings.ts"
Cohesion: 0.23
Nodes (18): bookingInput, BookingRow, claimByPhone, completeMyBooking, listMyBookings, OWNER_BOOKING_SELECT, sendMyLinks, digitsPhone() (+10 more)

### Community 76 - "popup.server.ts"
Cohesion: 0.48
Nodes (6): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), SESSION_TOKEN_COOKIE

### Community 77 - "order-e2e.mjs"
Cohesion: 0.12
Nodes (10): BASE, failed, json(), readBody(), results, ROOT, RUN, sessions (+2 more)

### Community 78 - "Rules"
Cohesion: 0.40
Nodes (5): Rules, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

### Community 79 - "call.tsx"
Cohesion: 0.10
Nodes (31): BedLoad(), LoadSlider(), ChatTurn, ShopLead, speakShop, canonicalSize(), HOUSE_PACKS, HousePack (+23 more)

### Community 80 - "db.ts"
Cohesion: 0.15
Nodes (14): createNeonSql(), createPgliteSql(), createSql(), dbSource, ensureDbReady(), getPglite(), globalBoot, globalRef (+6 more)

### Community 81 - "ingest-clip.mjs"
Cohesion: 0.13
Nodes (11): args, aspect, fail(), input, key, outDir, ROOT, run() (+3 more)

### Community 82 - "HaulStage.tsx"
Cohesion: 0.13
Nodes (14): gsap, lenis, HaulScene, HaulStage(), STOPS, TruckScene, useMoney(), WEEK (+6 more)

### Community 83 - "client.ts"
Cohesion: 0.26
Nodes (10): getBearerToken(), inLivePreview(), openSignInPopup(), PopupMessage, setBearerToken(), signIn(), signOut(), waitForPopupToken() (+2 more)

### Community 84 - "pay-finalize.server.ts"
Cohesion: 0.20
Nodes (9): ensureManageToken(), manageUrl(), newToken(), bookedMessage(), finalizePaidDeposit(), recordStripePayment(), sendDayBeforeReminders(), tomorrowISO() (+1 more)

### Community 85 - "grok-pwa-plugin.mjs"
Cohesion: 0.19
Nodes (20): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+12 more)

### Community 86 - "bed-load.tsx"
Cohesion: 0.18
Nodes (3): BED, ITEMS, LOADS

### Community 87 - "seo.ts"
Cohesion: 0.13
Nodes (22): AskBox(), send(), FinePrint(), SiteFooter(), getOfferStatus, firstName(), AREA_SERVED, areaServedJsonLd() (+14 more)

### Community 88 - "gates.tsx"
Cohesion: 0.24
Nodes (11): authClient, authEnabled, SIGN_IN_PATH, SignedIn(), SignedOut(), UserButton(), AppUser, CurrentUserState (+3 more)

### Community 89 - "care.ts"
Cohesion: 0.28
Nodes (18): loadFill(), askForChange, canSelfMove(), daysBetween(), fillExcluding(), getManage, isoDay(), loadByToken() (+10 more)

### Community 90 - "owner.ts"
Cohesion: 0.47
Nodes (3): ownerEmails(), Route, Route

### Community 91 - "pay-actions.ts"
Cohesion: 0.32
Nodes (10): depositDollars(), lockInput, lockWithDeposit, startBalanceInvoice, startSpringHold, stripeClient(), stripeReady, BOOKING_SELECT (+2 more)

### Community 92 - "Pick It Up E"
Cohesion: 0.22
Nodes (9): Brand, Data, For Claude / other agents, Pick It Up E, Quoting, Routes, Run locally, Stack (+1 more)

### Community 94 - "addOnsFor"
Cohesion: 0.27
Nodes (9): AddOnPicker(), BedGauge(), FILL, RateReel(), addOnsFor(), BED_CUBIC_YARDS, isBundleAddOn(), LOCAL_COMPARABLE (+1 more)

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

### Community 100 - "booking-alert.ts"
Cohesion: 0.36
Nodes (8): BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, serviceLabel(), URGENCY_LABEL

### Community 102 - "foreign-stripe.ts"
Cohesion: 0.43
Nodes (6): APP_PRODUCT_IDS, isAmericanPennyPowerObject(), isAppMeta(), isAppPrice(), Meta, PriceLike

### Community 103 - "Setup"
Cohesion: 0.70
Nodes (5): saveSettings, suggestAddresses(), Setup(), geocodeAndSave(), toggleService()

### Community 104 - "ownerJobLink"
Cohesion: 0.67
Nodes (4): ownerJobLink, CustomerLinkButton(), go(), JobPage()

## Knowledge Gaps
- **44 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 772 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `owner-shell.tsx`, `junk-removal-grand-forks.tsx`, `east-grand-forks.tsx`, `react`, `jobs.tsx`, `chat-knowledge.ts`, `crew.tsx`, `server.ts`, `my.$token.tsx`, `quick-quote.tsx`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `messages.ts`, `formatRange`, `estate-cleanout-grand-forks.tsx`, `bookings.ts`, `call.tsx`, `db.ts`, `HaulStage.tsx`, `pay-finalize.server.ts`, `seo.ts`, `gates.tsx`, `owner.ts`, `addOnsFor`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `HaulScene.tsx`, `owner-shell.tsx`, `schedule.ts`, `jobs.tsx`, `chat-knowledge.ts`, `crew.tsx`, `my.$token.tsx`, `truck-scene.ts`, `assess-actions.ts`, `quick-quote.tsx`, `preview-host-bridge.ts`, `formatRange`, `service-area.ts`, `quote-form.tsx`, `falling-leaves.tsx`, `estate-cleanout-grand-forks.tsx`, `bookings.ts`, `call.tsx`, `HaulStage.tsx`, `bed-load.tsx`, `seo.ts`, `gates.tsx`, `addOnsFor`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Why does `n()` connect `draco_wasm_wrapper.js` to `ref_node_url`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `jobs_.books.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12156862745098039 - nodes in this community are weakly interconnected._