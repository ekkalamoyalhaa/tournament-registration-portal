# Tournament Registration Portal — scaffold

A working Next.js scaffold for the Tournament Registration Portal PRD, styled
with the "Glassmorphism" design system from `design.md`.

## What's here

- **`prisma/schema.prisma`** — full data model: tournaments, teams, players,
  documents, registrations, fixtures, announcements, audit logs, notifications,
  plus the Auth.js user/account/session tables. Covers PRD §6, §19, §20, §30-31.
- **`src/lib/r2/`** — Cloudflare R2 (S3-compatible) integration: presigned
  direct-to-R2 uploads, short-lived signed download URLs for private
  documents, upload validation (MIME/size allow-listing), and the
  `tournaments/{id}/teams/{id}/players/{id}/documents/{uuid}.ext` key scheme
  from PRD §40. Credentials never leave the server.
- **`src/modules/`** — business logic (domain services), kept out of
  components per PRD §37: registration state machine + submit/review flow,
  player state machine + review flow, document upload orchestration.
- **`src/lib/security/authorization.ts`** — ownership checks (PRD §35): every
  team-scoped action verifies the requesting user actually belongs to that
  team, not just that they're logged in.
- **`src/lib/validation/schemas/`** — Zod schemas for player, team, manager,
  account signup, and tournament detail forms (PRD §36).
- **`src/lib/auth/`** — Auth.js (NextAuth v5) credentials provider with
  bcrypt password hashing and a Prisma adapter.
- **`src/app/`** — route groups matching PRD §38's structure: `(public)` for
  the tournament site, `(auth)` for login/register/verify, `team/` for the
  manager portal, `admin/` for the review portal, `api/` for the presign,
  public-read, and NextAuth routes.
- **`tailwind.config.ts`** / **`src/app/globals.css`** — the glassmorphism
  tokens transcribed directly from `design.md`'s front matter (colors, radii,
  blur, shadows, z-index scale).
- Sample screens built with the design system: the public homepage (§4),
  the admin dashboard summary tiles (§22), and the **full team registration
  wizard** (§7-§14, §21): team info → manager → players (add/remove with live
  state) → documents (real presigned-upload calls against
  `/api/uploads/presign`) → review/submit. Also the **admin review screens**
  (§23-§25): a tabbed team-review page (Team / Manager / Players / Documents /
  Activity) and a player-review page with per-document "View" and an
  approve / request-changes / reject action bar that requires a note before
  a change request can be sent.

## What's stubbed or left for you

- **Malware scanning** on uploads (§18) — no vendor wired in; the validation
  layer is the hook point.
- **Rate limiting / login throttling** (§34) — `src/lib/rate-limit/` is an
  empty folder; add Redis-backed limiting before this is public-facing.
- **MFA for admins** (§34) — not implemented in `auth.config.ts` yet.
- **Email delivery** (`NotificationService`, §43) — `notifications` module
  folder exists but has no provider wired in. This is also where the
  "registration approved / changes requested" notifications from the review
  actions below would actually get sent.
- **Wiring the wizard and admin screens to real data.** Every screen currently
  runs on example data and its actions (`console.log` calls in the admin
  action bar, local `useState` in the players step) — the server-side pieces
  they should call already exist (`submitRegistration`, `reviewTeamRegistration`,
  `reviewPlayer`, `requestUploadUrl`), they just aren't threaded through yet.
  That wiring needs an actual signed-in session and a real team/tournament id,
  which means auth has to be set up first.
- **Fixtures/announcements admin CRUD UI** and **exports** (§27-29, §45).
- Only the credentials auth provider is wired up — email verification
  (§8) needs a token-send + confirm route.

## Getting started (local, with Docker)

```bash
# 1. Start Postgres (and Adminer for a quick DB browser at localhost:8080)
docker compose up -d db

# 2. Install dependencies
npm install

# 3. Set up environment variables — the default DATABASE_URL already
#    matches docker-compose.yml, so no edits needed to get running
cp .env.example .env

# 4. Generate the Prisma client and create tables
npx prisma generate
npx prisma migrate dev --name init

# 5. Run the app
npm run dev
```

Open http://localhost:3000. `npx prisma studio` gives you a GUI on the data
too, if you prefer it over Adminer.

R2 credentials, `AUTH_SECRET`, and email provider keys can stay blank for
local UI work — they're only read when an upload or auth flow actually runs.
For `AUTH_SECRET`, generate one with `openssl rand -base64 32` once you're
ready to test login.

To stop and wipe the local database:

```bash
docker compose down -v
```
