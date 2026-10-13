# Graph Report - pickitupe  (2026-10-13)

## Corpus Check
- 193 files · ~488,806 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .example 1)

## Summary
- 1580 nodes · 4323 edges · 74 communities (64 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a88accfc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- getSql
- package.json
- quote-form.tsx
- react
- formatRange
- pricebook.ts
- care.ts
- leaf-cleanup-grand-forks.tsx
- @tanstack/react-router
- plan-model.mjs
- jobs_.$id.tsx
- routeTree.gen.ts
- chat-knowledge.ts
- grok-pwa-shared.mjs
- care.server.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- pay-actions.ts
- dispatcher.ts
- receipts.ts
- mem.py
- grok-pwa-plugin.mjs
- bookings.ts
- assess-actions.ts
- browser-smoke.mjs
- call.tsx
- devDependencies
- phone-line.server.ts
- ref_node_fs
- @tanstack/react-start
- server.ts
- LazyPGliteDriver
- ref_node_url
- preview-host-bridge.ts
- FileRoutesByPath
- compilerOptions
- status.tsx
- README.md
- jobs.tsx
- Deploy — Netlify + Supabase
- The missed-call line
- __root.tsx
- scripts
- Pick It Up E — Pricebook
- browser-guard.mjs
- address-field.tsx
- popup.server.ts
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- Pick It Up E
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- router.tsx
- owner.ts
- NOW — pickitupe current truth
- Rules
- grok-pwa-shared.d.mts
- AGENTS.md
- GROK.md
- overrides
- virtual-grok-og-identity.d.ts
- startup.sh
- grokOgIdentity

## God Nodes (most connected - your core abstractions)
1. `@tanstack/react-router` - 48 edges
2. `formatRange()` - 44 edges
3. `cn()` - 42 edges
4. `react` - 41 edges
5. `estimate` - 40 edges
6. `SiteHeader()` - 39 edges
7. `CallPage()` - 39 edges
8. `getSql()` - 33 edges
9. `FileRoutesByPath` - 33 edges
10. `SiteFooter()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Schema` --references--> `ensureOwnerTables()`  [INFERRED]
  migrations/CLAUDE.md → src/lib/owner-schema.ts
- `What this app already does` --references--> `QuoteForm()`  [INFERRED]
  CLAUDE.md → src/components/quote-form.tsx
- `What this app already does` --references--> `notifyCustomer()`  [INFERRED]
  CLAUDE.md → src/lib/customer-notify.server.ts
- `The missed-call line` --references--> `leadEmail()`  [INFERRED]
  PHONE-LINE.md → src/lib/email-theme.ts
- `What this app already does` --references--> `ensureOwnerTables()`  [INFERRED]
  CLAUDE.md → src/lib/owner-schema.ts

## Import Cycles
- None detected.

## Communities (74 total, 10 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.06
Nodes (53): better-auth, class-variance-authority, @radix-ui/react-slot, HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS (+45 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+45 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.09
Nodes (47): btnCls, ghostBtnCls, money(), Stat(), ReceiptDrop(), handleFiles(), ResultCard(), saveSettings (+39 more)

### Community 3 - "getSql"
Cohesion: 0.09
Nodes (41): stripe, getSql(), finalizeBalance(), CLOSED, getPlanStatus, openBillingPortal, startPlanCheckout, stripeGate() (+33 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (48): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+40 more)

### Community 5 - "quote-form.tsx"
Cohesion: 0.07
Nodes (38): @hookform/resolvers, react-hook-form, SERVICES, JOBS, QuickQuote(), pick(), FieldError(), PromoStatus (+30 more)

### Community 6 - "react"
Cohesion: 0.09
Nodes (40): react, fmtDate(), fmtWhen(), inputCls, NotOwner(), OwnerShell(), TABS, useOwnerLoader() (+32 more)

### Community 7 - "formatRange"
Cohesion: 0.07
Nodes (40): Block(), Faq, PriceTable(), ServicePage(), BLOCK_MIN_JOB_LOW, formatRange(), FAQS, gutter (+32 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.07
Nodes (42): The block deal: why $40, and why it can't stack, LotSizeField(), PRESETS, Props, add(), addOnLabel(), applyFlat(), applyPromo() (+34 more)

### Community 9 - "care.ts"
Cohesion: 0.11
Nodes (39): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), googleCalendarUrl(), askForChange, canSelfMove() (+31 more)

### Community 10 - "leaf-cleanup-grand-forks.tsx"
Cohesion: 0.08
Nodes (36): LEAF_KSF, AREA_SERVED, areaServedJsonLd(), breadcrumbJsonLd(), canonical(), FAQ, faqJsonLd(), localBusinessJsonLd() (+28 more)

### Community 11 - "@tanstack/react-router"
Cohesion: 0.11
Nodes (30): lucide-react, @tanstack/react-router, FinePrint(), HaulVideo(), Props, HousePacks(), RateReel(), ROWS (+22 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "jobs_.$id.tsx"
Cohesion: 0.11
Nodes (39): todayLocalISO(), addBookingEvent, addExpense, addPayment, addTrip, BookingDetail, deleteExpense, deletePayment (+31 more)

### Community 14 - "routeTree.gen.ts"
Cohesion: 0.05
Nodes (38): Route, AboutRoute, ApiAuthSplatRoute, ApiCronRemindersRoute, ApiCronRenewalNoticesRoute, ApiReceiptIdRoute, ApiReviewPhotoIdRoute, ApiSmsInboundRoute (+30 more)

### Community 15 - "chat-knowledge.ts"
Cohesion: 0.08
Nodes (33): @anthropic-ai/sdk, zod, AskBox(), send(), SUGGESTIONS, Turn, HeroQuoteTeaser(), sendAsk() (+25 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.12
Nodes (32): computeBrandWarnings(), siteDeclaresOgTypeGame(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags() (+24 more)

### Community 17 - "care.server.ts"
Cohesion: 0.13
Nodes (26): alertOwnerCare(), careSql(), ensureManageToken(), hits, KIND_LABEL, manageUrl(), MAX_PHOTO_BYTES, MAX_PHOTOS (+18 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.08
Nodes (30): BookingEvent, CATEGORY, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, ExpenseRow, FixedCost, getOwnerSummary (+22 more)

### Community 20 - "crew.tsx"
Cohesion: 0.17
Nodes (29): clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact, crewMarkDone, getCrewHome (+21 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.14
Nodes (27): What this app already does, BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, serviceLabel() (+19 more)

### Community 22 - "pay-actions.ts"
Cohesion: 0.14
Nodes (21): onSubmit(), createNeonSql(), createPgliteSql(), createSql(), dbSource, globalBoot, globalRef, identity() (+13 more)

### Community 23 - "dispatcher.ts"
Cohesion: 0.18
Nodes (29): loadFill(), submitBooking, absorb(), applyToolToLead(), asPack(), asService(), deskSnapshot(), fallbackReply() (+21 more)

### Community 24 - "receipts.ts"
Cohesion: 0.17
Nodes (24): listBookings, updateBookingStatus, isOwnerEmail(), ensureOwnerTables(), ensurePayColumns(), addOneYear(), ALLOWED, bookReceiptAnyway (+16 more)

### Community 25 - "mem.py"
Cohesion: 0.18
Nodes (17): 2026-10-13 — auto-memory protocol adopted, DECISIONS — pickitupe (append-only), build(), changed(), context(), gbin(), graph(), install_hook() (+9 more)

### Community 26 - "grok-pwa-plugin.mjs"
Cohesion: 0.19
Nodes (20): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+12 more)

### Community 27 - "bookings.ts"
Cohesion: 0.17
Nodes (21): DateField(), Props, bookingInput, getScheduleFill, OWNER_BOOKING_SELECT, BOOKING_SELECT, ServiceKey, DAILY_SLOTS (+13 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.16
Nodes (23): PhotoQuote(), addFiles(), run(), Props, shrink(), assessJob, AssessOk, imageParts() (+15 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "call.tsx"
Cohesion: 0.15
Nodes (23): ChatTurn, ShopLead, speakShop, HOUSE_PACKS, HousePack, packService(), saveLastBooking(), readSource() (+15 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+14 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.13
Nodes (19): The words, AFTER_MESSAGE, AFTER_MESSAGE_NO_SMS, afterMessage(), appendLeadNote(), CallLead, escXml(), greeting (+11 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.10
Nodes (15): pg, qrcode, vite, built, here, html, names, printDir (+7 more)

### Community 34 - "@tanstack/react-start"
Cohesion: 0.18
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, authConfigured, databaseConfigured, DEV_USER_ID, getSessionUser() (+5 more)

### Community 35 - "server.ts"
Cohesion: 0.13
Nodes (13): emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, databaseUrl, explicitBaseURL, globalAuthRef (+5 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.14
Nodes (6): @electric-sql/pglite, kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.18
Nodes (4): full, K, base, SRC

### Community 38 - "preview-host-bridge.ts"
Cohesion: 0.19
Nodes (15): PreviewHostBridge(), isGrokEmbedderOrigin(), isRemintPreviewPair(), isSandboxPreviewGuestHost(), resolveParentEmbedderOrigin(), collectRoutePathsFromTree(), EnvelopeSchema, HelloSchema (+7 more)

### Community 39 - "FileRoutesByPath"
Cohesion: 0.13
Nodes (13): Route, Route, Route, Route, Route, Route, Route, Route (+5 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "status.tsx"
Cohesion: 0.33
Nodes (13): claimByPhone, completeMyBooking, listMyBookings, sendMyLinks, digitsPhone(), formatPhone(), isUsPhone(), findOrCreateCallLead() (+5 more)

### Community 42 - "README.md"
Cohesion: 0.23
Nodes (4): Schema, Print — door hanger, Visual / motion, Pricing, bookings, SEO, area

### Community 43 - "jobs.tsx"
Cohesion: 0.21
Nodes (12): OwnerSummary, smsLink(), templatesForStage(), startBalanceInvoice, PROMO_CAP, PROMO_PERCENT, BoardData, estimateText() (+4 more)

### Community 44 - "Deploy — Netlify + Supabase"
Cohesion: 0.18
Nodes (9): Database, Deploy — Netlify + Supabase, Drag and drop, Environment variables, Getting the connection string, Lock the REST API (recommended), Netlify, For Claude / other agents (+1 more)

### Community 45 - "The missed-call line"
Cohesion: 0.18
Nodes (11): 1. Twilio account + toll-free number, 2. Point the number at the site, 3. Netlify environment (Site configuration → Environment variables), 4. Forward the cell — *conditional* forwarding only, 5. Test, in this order, Phase 2 — an AI receptionist that *books*, Set-up (about 20 minutes, Keaton does the account parts), The missed-call line (+3 more)

### Community 46 - "__root.tsx"
Cohesion: 0.29
Nodes (6): sonner, SourceCapture(), AuthProvider(), rememberSource(), Route, FileRoutesById

### Community 47 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:dev, db:migrate, dev, format, lint, preview (+2 more)

### Community 48 - "Pick It Up E — Pricebook"
Cohesion: 0.20
Nodes (9): Add-ons, Gutter cleaning — single-story, from the ground, Haul work — sized by the bed, Leaf cleanup — priced by the lot, Pick It Up E — Pricebook, Same-stop house packs, Sources, The truck-size caveat — read before quoting a big job (+1 more)

### Community 49 - "browser-guard.mjs"
Cohesion: 0.29
Nodes (8): playwright, checkedOutputPath(), checkedUrl(), fail(), LOOPBACK_HOSTNAMES, outPng, timeoutMs, url

### Community 50 - "address-field.tsx"
Cohesion: 0.33
Nodes (8): AddressField(), choose(), handleTyping(), AddressHit, AreaVerdict, milesFromHome(), verdictForDistance(), verdictForText()

### Community 51 - "popup.server.ts"
Cohesion: 0.29
Nodes (8): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), auth, SESSION_TOKEN_COOKIE, Route

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.22
Nodes (9): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), When changing marketing (+1 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "Pick It Up E"
Cohesion: 0.29
Nodes (7): Brand, Data, Pick It Up E, Quoting, Routes, Run locally, Stack

### Community 55 - "vite.config.ts"
Cohesion: 0.29
Nodes (4): nitro, @tailwindcss/vite, @vitejs/plugin-react, grokPwaPlugin()

### Community 56 - "brand-check.test.mjs"
Cohesion: 0.29
Nodes (4): MAX_CARD_BYTES, GAME_SITE, UTILITY_CUSTOM_SITE, UTILITY_SITE

### Community 57 - "renewal-notices.mts"
Cohesion: 0.33
Nodes (3): config, config, @netlify/functions

### Community 58 - "Door hanger — print spec"
Cohesion: 0.33
Nodes (6): Build (print-ready files live in this folder), Copy (keep in sync with `src/components/door-hanger.tsx`), Door hanger — print spec, QR code, References in the repo, Size

### Community 59 - "falling-leaves.tsx"
Cohesion: 0.47
Nodes (5): FallingLeaves(), Leaf, Maple(), seedLeaves(), TINT

### Community 60 - "router.tsx"
Cohesion: 0.47
Nodes (4): AppErrorComponent(), getRouter(), Register, routeTree

### Community 61 - "owner.ts"
Cohesion: 0.47
Nodes (3): ownerEmails(), Route, Route

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts / constraints, NOW — pickitupe current truth

### Community 63 - "Rules"
Cohesion: 0.40
Nodes (5): Rules, Why a date, not a count, Why capped, not a flat percent, Why "Garage / basement" is no longer a service, Why "Single-item pickup" is no longer a service

## Knowledge Gaps
- **43 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 597 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-start` connect `@tanstack/react-start` to `server.ts`, `package.json`, `getSql`, `care.ts`, `routeTree.gen.ts`, `chat-knowledge.ts`, `care.server.ts`, `books.ts`, `crew.tsx`, `vite.config.ts`, `pay-actions.ts`, `dispatcher.ts`, `receipts.ts`, `bookings.ts`, `assess-actions.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05879692446856626 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `getSql`, `package.json`, `quote-form.tsx`, `react`, `formatRange`, `care.ts`, `leaf-cleanup-grand-forks.tsx`, `jobs_.$id.tsx`, `routeTree.gen.ts`, `crew.tsx`, `pay-actions.ts`, `call.tsx`, `preview-host-bridge.ts`, `FileRoutesByPath`, `status.tsx`, `jobs.tsx`, `__root.tsx`, `popup.server.ts`, `router.tsx`, `owner.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `site-header.tsx`, `jobs_.books.tsx`, `getSql`, `package.json`, `quote-form.tsx`, `formatRange`, `care.ts`, `@tanstack/react-router`, `jobs_.$id.tsx`, `chat-knowledge.ts`, `crew.tsx`, `bookings.ts`, `assess-actions.ts`, `call.tsx`, `preview-host-bridge.ts`, `status.tsx`, `jobs.tsx`, `__root.tsx`, `address-field.tsx`, `falling-leaves.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `jobs_.books.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09049773755656108 - nodes in this community are weakly interconnected._