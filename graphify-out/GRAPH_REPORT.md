# Graph Report - pickitupe  (2026-11-18)

## Corpus Check
- 209 files · ~386,976 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .css 2, .example 1)

## Summary
- 1646 nodes · 4467 edges · 80 communities (69 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4d9e927`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- plan.tsx
- package.json
- quote-form.tsx
- owner-shell.tsx
- junk-removal-grand-forks.tsx
- pricebook.ts
- my.$token.tsx
- seo.ts
- index.tsx
- plan-model.mjs
- jobs.tsx
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
- grok-pwa-plugin.mjs
- truck-scene.ts
- assess-actions.ts
- browser-smoke.mjs
- call.tsx
- devDependencies
- phone-line.server.ts
- load
- verify.server.ts
- dispatcher.ts
- LazyPGliteDriver
- ref_node_url
- preview-host-bridge.ts
- leaf-cleanup-grand-forks.tsx
- compilerOptions
- status.tsx
- README.md
- care.ts
- Pick It Up E
- The missed-call line
- east-grand-forks.tsx
- scripts
- Pick It Up E — Pricebook
- make-door-hanger-pdf.mjs
- service-area.ts
- formatRange
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- truck-stage.tsx
- vite.config.ts
- ref_node_fs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- estate-cleanout-grand-forks.tsx
- pricing.tsx
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
- owner.ts
- Rules
- landlords.tsx

## God Nodes (most connected - your core abstractions)
1. `@tanstack/react-router` - 51 edges
2. `formatRange()` - 49 edges
3. `react` - 47 edges
4. `SiteHeader()` - 44 edges
5. `cn()` - 42 edges
6. `estimate` - 40 edges
7. `CallPage()` - 39 edges
8. `SiteFooter()` - 33 edges
9. `getSql()` - 33 edges
10. `lucide-react` - 32 edges

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

## Communities (80 total, 11 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.06
Nodes (53): class-variance-authority, @radix-ui/react-slot, HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), Mark(), MOBILE_MORE (+45 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+46 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.14
Nodes (30): money(), Stat(), addExpense, addPayment, FixedCost, saveSettings, YearBooks, LOT_SQFT (+22 more)

### Community 3 - "plan.tsx"
Cohesion: 0.08
Nodes (45): stripe, APP_PRODUCT_IDS, isAmericanPennyPowerObject(), isAppMeta(), isAppPrice(), Meta, PriceLike, CLOSED (+37 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (51): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+43 more)

### Community 5 - "quote-form.tsx"
Cohesion: 0.12
Nodes (22): zod, FieldError(), QuoteForm(), onAssess(), onSubmit(), schema, SERVICES, URGENCY (+14 more)

### Community 6 - "owner-shell.tsx"
Cohesion: 0.17
Nodes (17): ghostBtnCls, NotOwner(), OwnerShell(), TABS, RedirectToSignIn(), getCareBoard, HIDE_REASONS, moderateReview (+9 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (13): addOns, bags, cleanout, FAQS, freon, full, halfBed, longCarry (+5 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.06
Nodes (51): LotSizeField(), PRESETS, Props, COMPETITOR_BENCHMARKS, knowledge(), LOCAL, MAX_QUESTION, MAX_TURNS (+43 more)

### Community 9 - "my.$token.tsx"
Cohesion: 0.13
Nodes (27): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), handleFiles(), SiteFooter(), googleCalendarUrl() (+19 more)

### Community 10 - "seo.ts"
Cohesion: 0.17
Nodes (25): AREA_SERVED, AREA_SERVED_TEXT, areaServedJsonLd(), breadcrumbJsonLd(), BUSINESS, canonical(), faqJsonLd(), localBusinessJsonLd() (+17 more)

### Community 11 - "index.tsx"
Cohesion: 0.14
Nodes (20): lucide-react, react, ITEMS, RateReel(), ROWS, Reveal(), ReviewStrip(), CountUp() (+12 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "jobs.tsx"
Cohesion: 0.10
Nodes (30): inputCls, useOwnerLoader(), BookingRow, listBookings, addBookingEvent, CustomerRow, OwnerSummary, MessageContext (+22 more)

### Community 14 - "jobs_.$id.tsx"
Cohesion: 0.15
Nodes (27): todayLocalISO(), addTrip, BookingDetail, DropSite, updateBookingDetails, ownerJobLink, mileageRateFor(), cn() (+19 more)

### Community 15 - "chat-actions.ts"
Cohesion: 0.13
Nodes (18): @anthropic-ai/sdk, AskBox(), send(), SUGGESTIONS, Turn, FinePrint(), sendAsk(), askQuestion (+10 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.13
Nodes (29): grokPwaPlugin(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags(), grokOgHeadTags() (+21 more)

### Community 17 - "care.server.ts"
Cohesion: 0.11
Nodes (34): updateBookingStatus, alertOwnerCare(), careSql(), ensureManageToken(), hits, KIND_LABEL, manageUrl(), MAX_PHOTO_BYTES (+26 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.07
Nodes (44): BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, deleteExpense, deletePayment, deleteTrip (+36 more)

### Community 20 - "crew.tsx"
Cohesion: 0.11
Nodes (45): fmtDate(), fmtWhen(), clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact (+37 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.14
Nodes (27): What this app already does, BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, serviceLabel() (+19 more)

### Community 22 - "server.ts"
Cohesion: 0.14
Nodes (12): better-auth, emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, databaseUrl, explicitBaseURL (+4 more)

### Community 23 - "bookings.ts"
Cohesion: 0.13
Nodes (31): DateField(), Props, bookingInput, getScheduleFill, loadFill(), OWNER_BOOKING_SELECT, submitBooking, asNeed() (+23 more)

### Community 24 - "receipts.ts"
Cohesion: 0.16
Nodes (24): btnCls, ReceiptDrop(), ResultCard(), addOneYear(), ALLOWED, bookReceiptAnyway, businessStart(), callModel() (+16 more)

### Community 25 - "mem.py"
Cohesion: 0.17
Nodes (18): 2026-10-13 — auto-memory protocol adopted, 2026-11-13 — winter: junk first, 3D truck hero, DECISIONS — pickitupe (append-only), build(), changed(), context(), gbin(), graph() (+10 more)

### Community 26 - "grok-pwa-plugin.mjs"
Cohesion: 0.19
Nodes (20): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+12 more)

### Community 27 - "truck-scene.ts"
Cohesion: 0.18
Nodes (16): three, buildSnow(), buildTruck(), buildWorld(), doorTexture(), flakeTexture(), mountTruckScene(), frame() (+8 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.20
Nodes (18): assessJob, AssessOk, imageParts(), parseAssess(), regionalFor(), systemFor(), viaAnthropic(), viaXai() (+10 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "call.tsx"
Cohesion: 0.16
Nodes (20): speakShop, HousePack, packService(), ServiceKey, LAST_BOOKING_KEY, saveLastBooking(), CallPage(), applyLead() (+12 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.07
Nodes (37): The words, @electric-sql/pglite, pg, createNeonSql(), createPgliteSql(), createSql(), dbSource, ensureDbReady() (+29 more)

### Community 33 - "load"
Cohesion: 0.67
Nodes (3): load(), Visual / motion, Winter (2026-11): `winter/`

### Community 34 - "verify.server.ts"
Cohesion: 0.18
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, authConfigured, databaseConfigured, DEV_USER_ID, getSessionUser() (+5 more)

### Community 35 - "dispatcher.ts"
Cohesion: 0.15
Nodes (29): absorb(), applyToolToLead(), asPack(), asService(), ChatTurn, deskSnapshot(), fallbackReply(), fillPack() (+21 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.15
Nodes (5): kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.16
Nodes (5): full, K, migrationsDir, base, SRC

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.13
Nodes (20): sonner, PreviewHostBridge(), SourceCapture(), AuthProvider(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost(), resolveParentEmbedderOrigin() (+12 more)

### Community 39 - "leaf-cleanup-grand-forks.tsx"
Cohesion: 0.11
Nodes (15): LEAF_KSF, acre, addOns, bagging, FAQS, gutters, guttersWrap, half (+7 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "status.tsx"
Cohesion: 0.27
Nodes (15): claimByPhone, completeMyBooking, listMyBookings, sendMyLinks, digitsPhone(), formatPhone(), isUsPhone(), findOrCreateCallLead() (+7 more)

### Community 42 - "README.md"
Cohesion: 0.29
Nodes (3): Schema, Print — door hanger, Pricing, bookings, SEO, area

### Community 43 - "care.ts"
Cohesion: 0.29
Nodes (16): askForChange, canSelfMove(), daysBetween(), fillExcluding(), getManage, isoDay(), loadByToken(), moveMyDay (+8 more)

### Community 44 - "Pick It Up E"
Cohesion: 0.12
Nodes (16): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify, Brand (+8 more)

### Community 45 - "The missed-call line"
Cohesion: 0.15
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "east-grand-forks.tsx"
Cohesion: 0.12
Nodes (15): FAQS, gutter, gutterComplex, gutterStd, junk, junkFull, junkHalf, junkQuarter (+7 more)

### Community 47 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:dev, db:migrate, dev, format, lint, preview (+2 more)

### Community 48 - "Pick It Up E — Pricebook"
Cohesion: 0.20
Nodes (9): Add-ons, Gutter cleaning — single-story, from the ground, Haul work — sized by the bed, Leaf cleanup — priced by the lot, Pick It Up E — Pricebook, Same-stop house packs, Sources, The truck-size caveat — read before quoting a big job (+1 more)

### Community 49 - "make-door-hanger-pdf.mjs"
Cohesion: 0.14
Nodes (15): playwright, checkedOutputPath(), checkedUrl(), fail(), LOOPBACK_HOSTNAMES, built, here, html (+7 more)

### Community 50 - "service-area.ts"
Cohesion: 0.18
Nodes (15): AddressField(), choose(), handleTyping(), AddressHit, AreaTier, AreaVerdict, CORE_MILES, CORE_TOWNS (+7 more)

### Community 51 - "formatRange"
Cohesion: 0.23
Nodes (15): HeroQuoteTeaser(), SERVICES, JOBS, QuickQuote(), pick(), PromoStatus, Props, SameStop() (+7 more)

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "truck-stage.tsx"
Cohesion: 0.29
Nodes (10): readMotionPaused(), restoreMotionChoice(), setMotionPaused(), MotionToggle(), useMotionPaused(), useReducedMotion(), canRun3D(), TruckStage() (+2 more)

### Community 55 - "vite.config.ts"
Cohesion: 0.29
Nodes (4): nitro, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 56 - "ref_node_fs"
Cohesion: 0.13
Nodes (13): qrcode, computeBrandWarnings(), MAX_CARD_BYTES, siteDeclaresOgTypeGame(), GAME_SITE, UTILITY_CUSTOM_SITE, UTILITY_SITE, readOgSite() (+5 more)

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
Cohesion: 0.24
Nodes (10): BeforeAfter(), GarageArt(), Img, FLAKES, Snowfall(), EstatePage(), FAQS, money() (+2 more)

### Community 61 - "pricing.tsx"
Cohesion: 0.18
Nodes (20): Block(), Faq, PriceTable(), ServicePage(), StickyDock(), BLOCK_MIN_JOB_LOW, BLOCK_TIERS, PLAN_FALL_GUTTERS (+12 more)

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts / constraints, NOW — pickitupe current truth

### Community 63 - "@tanstack/react-router"
Cohesion: 0.43
Nodes (3): @tanstack/react-router, AppErrorComponent(), getRouter()

### Community 75 - "appliance-removal-grand-forks.tsx"
Cohesion: 0.15
Nodes (10): addOns, appliance, FAQS, few, freon, fridge, half, longCarry (+2 more)

### Community 76 - "popup.server.ts"
Cohesion: 0.29
Nodes (8): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), auth, SESSION_TOKEN_COOKIE, Route

### Community 77 - "owner.ts"
Cohesion: 0.47
Nodes (3): ownerEmails(), Route, Route

### Community 78 - "Rules"
Cohesion: 0.33
Nodes (6): Rules, The block deal: why $40, and why it can't stack, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

### Community 79 - "landlords.tsx"
Cohesion: 0.10
Nodes (25): HaulVideo(), Props, HousePacks(), PhotoQuote(), addFiles(), run(), Props, shrink() (+17 more)

## Knowledge Gaps
- **44 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 609 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `owner-shell.tsx`, `junk-removal-grand-forks.tsx`, `my.$token.tsx`, `index.tsx`, `jobs.tsx`, `jobs_.$id.tsx`, `care.server.ts`, `crew.tsx`, `assess-actions.ts`, `call.tsx`, `phone-line.server.ts`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `status.tsx`, `east-grand-forks.tsx`, `formatRange`, `estate-cleanout-grand-forks.tsx`, `pricing.tsx`, `appliance-removal-grand-forks.tsx`, `popup.server.ts`, `owner.ts`, `landlords.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0574400723654455 - nodes in this community are weakly interconnected._
- **Why does `react` connect `index.tsx` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `quote-form.tsx`, `owner-shell.tsx`, `my.$token.tsx`, `jobs.tsx`, `jobs_.$id.tsx`, `chat-actions.ts`, `crew.tsx`, `bookings.ts`, `receipts.ts`, `call.tsx`, `preview-host-bridge.ts`, `status.tsx`, `service-area.ts`, `formatRange`, `truck-stage.tsx`, `falling-leaves.tsx`, `estate-cleanout-grand-forks.tsx`, `pricing.tsx`, `landlords.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.037037037037037035 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-start` connect `verify.server.ts` to `dispatcher.ts`, `package.json`, `quote-form.tsx`, `plan.tsx`, `care.ts`, `chat-actions.ts`, `care.server.ts`, `books.ts`, `crew.tsx`, `vite.config.ts`, `server.ts`, `bookings.ts`, `receipts.ts`, `assess-actions.ts`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `jobs_.books.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._