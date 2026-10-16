# Graph Report - pickitupe  (2026-10-16)

## Corpus Check
- 193 files · ~377,905 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .css 2, .example 1)

## Summary
- 1544 nodes · 4186 edges · 75 communities (64 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `953c288d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- site-header.tsx
- dependencies
- jobs_.books.tsx
- plan.tsx
- package.json
- quote-form.tsx
- jobs.tsx
- junk-removal-grand-forks.tsx
- pricebook.ts
- my.$token.tsx
- seo.ts
- index.tsx
- plan-model.mjs
- jobs_.$id.tsx
- client.ts
- chat-knowledge.ts
- grok-pwa-shared.mjs
- care.server.ts
- P2PRoom
- books.ts
- crew.tsx
- email-theme.ts
- @tanstack/react-router
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
- leaf-cleanup-grand-forks.tsx
- compilerOptions
- status.tsx
- README.md
- messages.ts
- Pick It Up E
- The missed-call line
- east-grand-forks.tsx
- scripts
- Pick It Up E — Pricebook
- browser-guard.mjs
- service-area.ts
- popup.server.ts
- CLAUDE.md — Pick It Up E
- eslint.config.mjs
- landlords.tsx
- vite.config.ts
- brand-check.test.mjs
- renewal-notices.mts
- Door hanger — print spec
- falling-leaves.tsx
- react
- formatRange
- NOW — pickitupe current truth
- isPromoActive
- grok-pwa-shared.d.mts
- AGENTS.md
- GROK.md
- overrides
- virtual-grok-og-identity.d.ts
- startup.sh
- grokOgIdentity
- CLAUDE.md — reference sections (moved verbatim)

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

## Communities (75 total, 11 thin omitted)

### Community 0 - "site-header.tsx"
Cohesion: 0.15
Nodes (22): HASH_OFFSET, HashScroll(), scrollToHash(), HaulTicker(), ITEMS, Mark(), MOBILE_NAV, NAV (+14 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, @anthropic-ai/sdk, better-auth, class-variance-authority, clsx, cmdk, date-fns, @electric-sql/pglite (+45 more)

### Community 2 - "jobs_.books.tsx"
Cohesion: 0.14
Nodes (34): money(), Stat(), ReceiptDrop(), ResultCard(), deletePayment, FixedCost, saveSettings, YearBooks (+26 more)

### Community 3 - "plan.tsx"
Cohesion: 0.09
Nodes (40): stripe, stripeReady, CLOSED, getPlanStatus, openBillingPortal, startPlanCheckout, stripeGate(), PLAN_EXCLUSIONS (+32 more)

### Community 4 - "package.json"
Cohesion: 0.04
Nodes (48): name, private, sideEffects, type, clsx, cmdk, date-fns, eslint (+40 more)

### Community 5 - "quote-form.tsx"
Cohesion: 0.10
Nodes (34): @hookform/resolvers, react-hook-form, SERVICES, JOBS, QuickQuote(), pick(), FieldError(), PromoStatus (+26 more)

### Community 6 - "jobs.tsx"
Cohesion: 0.11
Nodes (27): btnCls, ghostBtnCls, NotOwner(), OwnerShell(), TABS, useOwnerLoader(), getCareBoard, moderateReview (+19 more)

### Community 7 - "junk-removal-grand-forks.tsx"
Cohesion: 0.12
Nodes (14): BLOCK_MIN_JOB_LOW, addOns, bags, cleanout, FAQS, freon, full, halfBed (+6 more)

### Community 8 - "pricebook.ts"
Cohesion: 0.07
Nodes (42): The block deal: why $40, and why it can't stack, LotSizeField(), PRESETS, Props, add(), addOnLabel(), applyFlat(), applyPromo() (+34 more)

### Community 9 - "my.$token.tsx"
Cohesion: 0.12
Nodes (28): BookedScreen(), Confirmed, JobTicket(), TicketJob, TicketRow(), handleFiles(), googleCalendarUrl(), confirmDeposit (+20 more)

### Community 10 - "seo.ts"
Cohesion: 0.19
Nodes (21): AREA_SERVED, AREA_SERVED_TEXT, areaServedJsonLd(), breadcrumbJsonLd(), canonical(), faqJsonLd(), localBusinessJsonLd(), NEIGHBORHOODS (+13 more)

### Community 11 - "index.tsx"
Cohesion: 0.16
Nodes (16): lucide-react, AskBox(), send(), SUGGESTIONS, Turn, FinePrint(), HaulVideo(), Props (+8 more)

### Community 12 - "plan-model.mjs"
Cohesion: 0.09
Nodes (32): built, here, html, MODEL, out, printDir, src, t (+24 more)

### Community 13 - "jobs_.$id.tsx"
Cohesion: 0.09
Nodes (44): fmtDate(), fmtWhen(), todayLocalISO(), addBookingEvent, addPayment, addTrip, BookingDetail, deleteExpense (+36 more)

### Community 14 - "client.ts"
Cohesion: 0.13
Nodes (18): class-variance-authority, @radix-ui/react-slot, Button(), buttonVariants, Props, authClient, getBearerToken(), inLivePreview() (+10 more)

### Community 15 - "chat-knowledge.ts"
Cohesion: 0.10
Nodes (27): @anthropic-ai/sdk, HeroQuoteTeaser(), sendAsk(), askQuestion, CONCIERGE_MODEL, CONCIERGE_RULES, contactOk(), FLAG_TOOL (+19 more)

### Community 16 - "grok-pwa-shared.mjs"
Cohesion: 0.14
Nodes (28): grokPwaPlugin(), customOgAssetPath(), DEFAULT_APP_NAME, detectCustomOgCard(), escapeHtml(), GROK_EXTENSIONS_SCRIPT_SRC, grokExtensionsHeadTags(), grokOgHeadTags() (+20 more)

### Community 17 - "care.server.ts"
Cohesion: 0.10
Nodes (19): alertOwnerCare(), ensureManageToken(), hits, KIND_LABEL, manageUrl(), MAX_PHOTO_BYTES, MAX_PHOTOS, newToken() (+11 more)

### Community 18 - "P2PRoom"
Cohesion: 0.14
Nodes (10): defaultIceServers(), P2PRoom, P2PRoomOptions, PeerInfo, PeerRow, PeerSlot, RtcPollResponse, SIGNAL_RETRY_DELAYS_MS (+2 more)

### Community 19 - "books.ts"
Cohesion: 0.07
Nodes (40): addExpense, BookingEvent, CATEGORY, CustomerRow, DATE, DEFAULT_DROPS, DEFAULT_FIXED_COSTS, ExpenseRow (+32 more)

### Community 20 - "crew.tsx"
Cohesion: 0.12
Nodes (37): inputCls, RedirectToSignIn(), clockIn, clockOut, crewFor(), CrewHome, CrewJob, crewLogContact (+29 more)

### Community 21 - "email-theme.ts"
Cohesion: 0.15
Nodes (26): What this app already does, BookingAlertInput, bookingAlertSubject(), bookingAlertText(), notifyOwnerOfBooking(), OwnerAlertResult, SERVICE_LABEL, serviceLabel() (+18 more)

### Community 22 - "@tanstack/react-router"
Cohesion: 0.10
Nodes (27): @electric-sql/pglite, pg, @tanstack/react-router, createNeonSql(), createPgliteSql(), createSql(), dbSource, globalBoot (+19 more)

### Community 23 - "dispatcher.ts"
Cohesion: 0.08
Nodes (60): DateField(), Props, getScheduleFill, askForChange, canSelfMove(), daysBetween(), fillExcluding(), getManage (+52 more)

### Community 24 - "receipts.ts"
Cohesion: 0.18
Nodes (21): addOneYear(), ALLOWED, bookReceiptAnyway, businessStart(), callModel(), dataUrlToBuffer(), Extracted, extractedSchema (+13 more)

### Community 25 - "mem.py"
Cohesion: 0.18
Nodes (17): 2026-10-13 — auto-memory protocol adopted, DECISIONS — pickitupe (append-only), build(), changed(), context(), gbin(), graph(), install_hook() (+9 more)

### Community 26 - "grok-pwa-plugin.mjs"
Cohesion: 0.19
Nodes (20): GROK_OG_IDENTITY_ID, INSTALL_PAGE_PATH, renderInstallPage(), requestHost(), sendHtml(), serveGrokPwa(), TEMPLATE_ROOT, wrapHtmlResponses() (+12 more)

### Community 27 - "bookings.ts"
Cohesion: 0.29
Nodes (18): bookingInput, listBookings, listMyBookings, loadFill(), OWNER_BOOKING_SELECT, submitBooking, updateBookingStatus, careSql() (+10 more)

### Community 28 - "assess-actions.ts"
Cohesion: 0.20
Nodes (16): PhotoQuote(), addFiles(), run(), Props, shrink(), assessJob, AssessOk, imageParts() (+8 more)

### Community 29 - "browser-smoke.mjs"
Cohesion: 0.16
Nodes (21): args, baselineRequested, compareAgainstBaseline(), derived, mobilePng, outJson, outPng, timeoutMs (+13 more)

### Community 30 - "call.tsx"
Cohesion: 0.18
Nodes (19): speakShop, HousePack, packService(), saveLastBooking(), CallPage(), applyLead(), finish(), leadSnap() (+11 more)

### Community 31 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+14 more)

### Community 32 - "phone-line.server.ts"
Cohesion: 0.12
Nodes (25): The words, e164(), notifyCustomer(), sendEmail(), sendSms(), EmailDoc, ownerInbox(), AFTER_MESSAGE (+17 more)

### Community 33 - "ref_node_fs"
Cohesion: 0.12
Nodes (13): qrcode, built, here, html, names, printDir, qr, src (+5 more)

### Community 34 - "@tanstack/react-start"
Cohesion: 0.18
Nodes (13): @tanstack/react-start, assertSameSiteRequest(), CrossSiteRequestError, authMiddleware, authConfigured, databaseConfigured, DEV_USER_ID, getSessionUser() (+5 more)

### Community 35 - "server.ts"
Cohesion: 0.13
Nodes (14): better-auth, emailAndPasswordEnabled, GROK_ISSUER_DEFAULT, PREVIEW_ALLOWED_HOSTS, PREVIEW_CLIENT_ID, PREVIEW_CLIENT_SECRET, databaseUrl, explicitBaseURL (+6 more)

### Community 36 - "LazyPGliteDriver"
Cohesion: 0.15
Nodes (5): kysely, Client, LazyPGliteDriver, PGliteConnection, pgliteDialect()

### Community 37 - "ref_node_url"
Cohesion: 0.18
Nodes (4): full, K, base, SRC

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
Cohesion: 0.20
Nodes (18): BookingRow, claimByPhone, completeMyBooking, sendMyLinks, sendLinksForPhone(), deskSnapshot(), missingOf(), digitsPhone() (+10 more)

### Community 42 - "README.md"
Cohesion: 0.23
Nodes (4): Schema, Print — door hanger, Visual / motion, Pricing, bookings, SEO, area

### Community 43 - "messages.ts"
Cohesion: 0.12
Nodes (18): MessageContext, MessageKind, MessageTemplate, REVIEW_URL, TEL, PROMO_CAP, PROMO_PERCENT, AFTER_HOURS (+10 more)

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
Cohesion: 0.13
Nodes (14): Add-ons, Gutter cleaning — single-story, from the ground, Haul work — sized by the bed, Leaf cleanup — priced by the lot, Pick It Up E — Pricebook, Rules, Same-stop house packs, Sources (+6 more)

### Community 49 - "browser-guard.mjs"
Cohesion: 0.29
Nodes (8): playwright, checkedOutputPath(), checkedUrl(), fail(), LOOPBACK_HOSTNAMES, outPng, timeoutMs, url

### Community 50 - "service-area.ts"
Cohesion: 0.18
Nodes (15): AddressField(), choose(), handleTyping(), AddressHit, AreaTier, AreaVerdict, CORE_MILES, CORE_TOWNS (+7 more)

### Community 51 - "popup.server.ts"
Cohesion: 0.29
Nodes (8): completionHtml(), completionResponse(), handleAuthPopupRequest(), PopupMessage, readCookie(), auth, SESSION_TOKEN_COOKIE, Route

### Community 52 - "CLAUDE.md — Pick It Up E"
Cohesion: 0.20
Nodes (10): Business (do not invent a new one), CLAUDE.md — Pick It Up E, Commands, Design bar, Do not, Full inventory (everything Claude should be able to open), Memory protocol (auto, every task — do not wait to be asked), What this app already does (+2 more)

### Community 53 - "eslint.config.mjs"
Cohesion: 0.29
Nodes (6): eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 54 - "landlords.tsx"
Cohesion: 0.18
Nodes (14): COMBO_CREDIT, EXTRA_STOP_CUT, LANDLORD_PACKS, packDefaultSize(), sizesForPack(), STOP_COUNTS, allTurnHigh, allTurnLow (+6 more)

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
Cohesion: 0.28
Nodes (8): FallingLeaves(), Leaf, Maple(), seedLeaves(), TINT, Pages, The home page has no booking form, `validateSearch` must return every key, always

### Community 60 - "react"
Cohesion: 0.29
Nodes (9): react, Reveal(), ReviewStrip(), SiteFooter(), listReviews, PublicReview, ReviewCard(), ReviewsPage() (+1 more)

### Community 61 - "formatRange"
Cohesion: 0.29
Nodes (13): Block(), Faq, PriceTable(), ServicePage(), formatRange(), PLAN_FALL_GUTTERS, Page(), FAQS (+5 more)

### Community 62 - "NOW — pickitupe current truth"
Cohesion: 0.40
Nodes (4): Goal, In flight, Known facts / constraints, NOW — pickitupe current truth

### Community 63 - "isPromoActive"
Cohesion: 0.33
Nodes (6): RateReel(), ROWS, getOfferStatus, isPromoActive(), PROMO_DEADLINE_LABEL, Route

## Knowledge Gaps
- **43 isolated node(s):** `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 577 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@tanstack/react-router` connect `@tanstack/react-router` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `quote-form.tsx`, `jobs.tsx`, `junk-removal-grand-forks.tsx`, `pricebook.ts`, `my.$token.tsx`, `index.tsx`, `jobs_.$id.tsx`, `client.ts`, `care.server.ts`, `crew.tsx`, `call.tsx`, `preview-host-bridge.ts`, `leaf-cleanup-grand-forks.tsx`, `status.tsx`, `messages.ts`, `east-grand-forks.tsx`, `popup.server.ts`, `landlords.tsx`, `react`, `formatRange`, `isPromoActive`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `site-header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `site-header.tsx`, `jobs_.books.tsx`, `plan.tsx`, `package.json`, `quote-form.tsx`, `jobs.tsx`, `my.$token.tsx`, `index.tsx`, `jobs_.$id.tsx`, `client.ts`, `crew.tsx`, `dispatcher.ts`, `assess-actions.ts`, `call.tsx`, `preview-host-bridge.ts`, `status.tsx`, `service-area.ts`, `landlords.tsx`, `falling-leaves.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03773584905660377 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-start` connect `@tanstack/react-start` to `server.ts`, `package.json`, `plan.tsx`, `chat-knowledge.ts`, `care.server.ts`, `books.ts`, `crew.tsx`, `vite.config.ts`, `@tanstack/react-router`, `dispatcher.ts`, `receipts.ts`, `bookings.ts`, `assess-actions.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `jobs_.books.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14444444444444443 - nodes in this community are weakly interconnected._