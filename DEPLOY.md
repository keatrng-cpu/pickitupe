# Deploy — Netlify + Supabase

**Live:** <https://marvelous-trifle-746b0c.netlify.app> — Netlify project
`marvelous-trifle-746b0c`, deploying from this repo's `main` branch.

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `VITE_SITE_URL`
are set on the Netlify project. `VITE_SITE_URL` is baked in at build time, so
changing the domain needs a rebuild, not just an env edit.

## Database

Supabase project **pickitupe** (`fletejughpwkudradend`, us-east-2, free tier).
All three migrations are already applied — `user`, `session`, `account`,
`verification`, `bookings`.

The app connects with plain `pg` over a Postgres connection string. It does not
use the Supabase JS client, the anon key, or PostgREST.

### Getting the connection string

Supabase never returns the database password after project creation. In the
dashboard: **Project Settings → Database → Reset database password**, then
**Connect → Transaction pooler** and copy that URI verbatim. Its parts are the
`postgres.fletejughpwkudradend` user, the password you just set, the pooler
host Supabase shows you, port `6543`, and the `postgres` database. Copy it from
the dashboard rather than assembling it by hand — the pooler hostname varies by
region and is not guessable.

Use the **transaction pooler** (port 6543), not the direct connection. Netlify
runs this as a serverless function — every cold start opens a new connection,
and the direct port-5432 endpoint runs out of slots. `pg` works with transaction
mode because it does not use named prepared statements.

### Lock the REST API (recommended)

Every table is currently readable by anyone holding the project's anon key —
that includes customer names, phones, and addresses in `bookings`. The app
never uses that API, so the fix is to enable RLS with no policies at all: the
REST API returns nothing, and the `postgres` role this app connects as owns the
tables and bypasses RLS.

```sql
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

## Netlify

Build config is in [`netlify.toml`](netlify.toml). Nitro's netlify preset emits
`dist/` (static) and `.netlify/functions-internal/server` (the SSR handler).

**`dist/` alone is not a website.** It contains no HTML — every page, the
booking form, the early-bird counter, and `/jobs` are rendered by the server
function. Dropping only the build output gives a blank site.

### Drag and drop

Drop the **project folder** (not the build output) on
<https://app.netlify.com/drop> while signed in. Netlify reads `netlify.toml`,
runs `npm run build`, and publishes both halves.

Do not drag the working copy — `node_modules` is ~359 MB. Use a clean export:

```bash
git archive HEAD | tar -x -C /path/to/pickitupe-netlify-drop
```

### Environment variables

Set these in **Site configuration → Environment variables**, then redeploy.

| Variable | Value |
|---|---|
| `DATABASE_URL` | The transaction-pooler URI from above |
| `BETTER_AUTH_SECRET` | A fresh 32-byte random string |
| `BETTER_AUTH_URL` | The live site URL, e.g. `https://pickitupe.netlify.app` |
| `VITE_SITE_URL` | Same URL — feeds canonical, OG, and JSON-LD tags |

Generate the auth secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Leave `VITE_AUTH_ENABLED` unset. Auth stays on, and with no OAuth provider
configured `/jobs` simply cannot be signed into — which keeps customer records
off the public internet. Setting it to `false` would make `/jobs` readable by
anyone who visits the URL.

Read incoming bookings from the Supabase table editor until Google OAuth is set
up.
