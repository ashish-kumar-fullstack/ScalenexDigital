# ScaleNex Digital

**Build. Rank. Grow.** A Next.js agency website and private influencer referral portal.

## Start the website on Windows

Use Node.js 22 LTS or a newer supported LTS. Open PowerShell:

```powershell
cd D:\scalenexdigital\scalenexwebsite
npm.cmd ci
Copy-Item .env.example .env.local
```

Edit `.env.local` using the configuration instructions below. Do not overwrite an existing configured `.env.local`. Start development:

```powershell
npm.cmd run dev
```

Open http://localhost:3000. Stop with Ctrl+C. The public website can render without a database; the secure portal requires MongoDB and an authentication secret. No demo account, default password, or fake dashboard data is shipped.

For a local production run:

```powershell
npm.cmd run build
npm.cmd start
```

Do not run two servers on the same port. Use `npm.cmd run dev -- --port 3001` if necessary, and update the local URL environment variables to match.

## Configure MongoDB Atlas

1. Create an Atlas project and cluster. Atlas provides the replica-set transactions required by financial and audit workflows. A local standalone MongoDB process does **not** support these transactions; use a replica set.
2. Under Database Access, create a dedicated database user with `readWrite` access to the application database. Use a strong unique password.
3. Under Network Access, allow your development machine's public IP. For Vercel, configure access for the deployment's outbound network. Prefer restricted egress/static IPs when your hosting plan supports them. An allow-all entry exposes the database listener to the internet and should not be the default production choice.
4. Choose Connect → Drivers and copy the MongoDB connection string into `MONGODB_URI`. URL-encode special characters in the database user's password.
5. Set `MONGODB_DB_NAME=scalenex`. Use a different database/cluster for preview and testing environments.

Example shape only:

```dotenv
MONGODB_URI=mongodb+srv://DATABASE_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=scalenex
AUTH_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
INITIAL_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD=YOUR_UNIQUE_TEMPORARY_PASSWORD
EMAIL_FROM=ScaleNex Digital <YOUR_VERIFIED_SENDER>
SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_USER
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
```

Generate `AUTH_SECRET` locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Store the generated value only in the environment configuration. `AUTH_SECRET` is explicitly passed to Auth.js; the `NEXTAUTH_SECRET` compatibility key in `.env.example` is optional and can be omitted. If set, use the same value. Never put secrets into `NEXT_PUBLIC_*` variables.

SMTP is required for password-reset delivery. Use your provider's verified sender and credentials. Port 465 uses TLS directly; port 587 uses SMTP STARTTLS. Reset requests always display a generic response; check provider delivery logs if a legitimate email does not arrive. The application never returns reset tokens to the browser.

## Create the first admin

Once `.env.local` contains real database credentials, a secret, and the initial admin email/password:

```powershell
npm.cmd run seed
```

This creates collection indexes and the initial admin, hashes the password, and adds the standard commission tiers. Re-running it does not change an existing admin's password or create duplicate users. An email that already belongs to an influencer is rejected. The temporary password must have at least 12 characters and at most 72 UTF-8 bytes. The script never prints it.

Open `/login`, sign in with the initial credentials, and change the temporary password. Password changes revoke existing sessions; sign in again. Use `/admin/influencers/new` to create partner accounts. Share temporary credentials through a private channel. Influencers can also register at `/register`; public accounts start ACTIVE and can sign in immediately.

## Deploy to Vercel

1. Create a private GitHub repository and push this project, including `package-lock.json`. Do not commit `.env.local`, `node_modules`, or `.next`.
2. In Vercel choose **Add New → Project**, import the repository, and select the **Next.js** framework preset. Keep this repository root as the Root Directory. Use Node.js 22.x or a compatible supported LTS, `npm ci` as the install command, and `npm run vercel-build` as the build command. Leave Output Directory at the framework default.
3. Add the production environment variables from `.env.example`. `MONGODB_URI`, `MONGODB_DB_NAME`, and `AUTH_SECRET` must be real production values. Set **both** `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the exact production origin, such as `https://YOUR_PROJECT.vercel.app`, without a trailing slash. Set SMTP sender/provider values for password reset. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in the Vercel Production environment for initialization.
4. Set `MONGOMS_DISABLE_POSTINSTALL=1` in Vercel so installation does not download the database binary used only by local automated tests.
5. Configure Atlas network access for your deployment. Deploy. If the final domain differs from the configured origin, update both URL variables and redeploy. Public metadata and sitemap use the configured public origin.
6. Production deployment automatically initializes the database and missing admin after the build. To initialize manually, point `.env.local` at the intended database and run `npm.cmd run seed`. Existing credentials are preserved.
7. Visit the deployed `/login`, change the admin's temporary password, sign in again, and create an influencer account. Verify lead creation, ownership, notifications, status history, and a commission record with a controlled test referral. Remove test data through a deliberate database maintenance process before accepting live leads.
8. To use a custom domain, add it under Vercel Project Settings → Domains, complete the requested DNS configuration, update both URL variables, and redeploy.

Production and Preview need separate databases and secrets. A preview deployment must have URL variables matching its origin before login is tested. Never point untrusted preview builds at production customer data. Updating environment variables requires a new deployment to take effect.

Official references: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel environment variables](https://vercel.com/kb/guide/how-to-add-vercel-environment-variables), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Atlas network access](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/).

## Routes and permissions

Public pages: `/`, `/about`, `/services`, the eight `/services/[slug]` pages, `/projects`, `/reviews`, `/influencer-program`, `/contact`, `/privacy-policy`, `/terms`, `/login`, `/forgot-password`, `/reset-password`.

Admin: `/admin/dashboard`, `/admin/influencers`, `/admin/influencers/new`, `/admin/influencers/[id]`, `/admin/leads`, `/admin/leads/[id]`, `/admin/payments`, `/admin/reports`, `/admin/settings`, `/admin/audit-logs`, `/admin/change-password`.

Influencer: `/influencer/dashboard`, `/influencer/leads`, `/influencer/leads/new`, `/influencer/leads/[id]`, `/influencer/earnings`, `/influencer/profile`, `/influencer/change-password`.

Only `ADMIN` and `INFLUENCER` are initial roles. Extend `src/lib/constants.ts` and the centralized guards to add a role deliberately. The shared route implementation never grants access merely because a URL exists. The layout checks role, pages check permissions, server mutations re-read the current database account, and owner queries include the authenticated influencer ID.

## Architecture and collections

- Next.js App Router, React Server Components by default, strict TypeScript, Tailwind CSS, shadcn-style Radix/CVA button primitive, React Hook Form + Zod, Recharts, Lucide.
- Auth.js/NextAuth stable release, Credentials provider, bcrypt hashes, signed/encrypted JWT sessions in HTTP-only cookies. Database-backed session version checks invalidate passwords and suspended accounts without waiting for token expiration.
- MongoDB/Mongoose: `User`, `Lead`, `LeadStatusHistory`, `UserStatusHistory`, `Payment`, `Notification`, `AuditLog`, `CommissionRule`, `PasswordReset`, `RateLimit`.
- `src/lib/workflows.ts`: protected mutations, transactions, commission snapshots, audit records and notifications.
- `src/lib/access.ts`: current account/session guards and ownership scopes.
- `src/lib/queries.ts`: bounded, scoped read queries and filters.
- `src/app/actions.ts`: validated server actions; Next.js same-origin protection. Auth.js uses its own CSRF-protected authentication endpoints.
- `src/proxy.ts`: request-specific CSP nonce and private no-store headers for portal/auth responses.

Referral codes are server-generated with 40 random bits plus a sanitized name and a unique database index. A collision causes account creation to fail safely; retry creates a new code. Leads retain their original referral-code snapshot after code regeneration. Incoming lead payloads reject extra ownership/status fields.

Duplicates compare normalized phone, email, business name, and website domain. Suspected matches are accepted with a neutral review flag. The admin either rejects the duplicate or records an `Ownership resolved:` reason to keep attribution and clear the flag. Simultaneous submissions may both be flagged only after later review; this is intentionally a similarity-review system, not a guarantee that legitimate repeat enquiries are rejected.

Commission percentages are selected by total project value and applied to actual eligible cumulative receipts. Money is stored in integer paise and calculated with BigInt. Percentage snapshots persist across rule changes. Final approved amounts can differ with a recorded reason and explicit confirmation. Each lead currently has one cumulative payment record with optimistic revision checking; paid records are immutable. Additional installments after a completed payout, reversals, withholding calculations, and reconciliation require a separately designed ledger extension rather than overwriting a paid record.

## Tests and verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:integration
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run build
```

Integration and browser tests create isolated local MongoDB replica sets. The first run downloads an official MongoDB test binary (large on Windows); internet access and permission to launch a local test process are required. They do not use Atlas or live customer data. End-to-end tests use ports 3100 and 27027; keep these free. Browser tests use a separate .next-e2e build directory and do not reuse a live server or production database. Unit tests cover commission boundaries, safe money handling, permission maps, code uniqueness, input rejection, and normalization. Integration tests verify the transactional referral lifecycle and cross-owner access. Browser tests exercise public routes, responsive navigation, login restrictions, first-login password change, lead submission, and admin account creation.

## Operational notes

### Public contact and influencer registration

- `/contact` sends enquiries to `scalenexdigital@gmail.com`. The sender is `EMAIL_FROM`; Reply-To is the visitor's validated email. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in `.env.local` and in the Vercel environment, then restart/redeploy. No success message is shown unless the SMTP server accepts the agency recipient.
- `/register` allows influencers to choose a password and register publicly. The server assigns `INFLUENCER`, `ACTIVE`, a random referral code, and the standard commission plan. The influencer can sign in immediately. Client-supplied role, status, attribution, or commission fields are rejected, so public registration cannot create administrators.
- Contact and registration are throttled through MongoDB and include honeypot fields. Real inbox delivery still requires valid SMTP credentials; automated email tests use a mock transport and never send to the real inbox.

- Published projects and customer reviews intentionally remain empty until approved material is supplied. No fake performance metrics or testimonials are included.
- The public consultation CTA opens /contact. The validated form sends plain-text email to scalenexdigital@gmail.com using SMTP, with the visitor as Reply-To. SMTP acceptance is required before success is shown. Enquiries are not stored in MongoDB; MongoDB stores only hashed throttling keys. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM before use.
- The privacy and terms pages describe the implemented service; align them with your actual business arrangements and jurisdiction before launch.
- Commission and lead history are not editable through the influencer interface or its server actions. Internal notes are excluded from default queries and partner DTOs.
- Login and reset throttles are persisted in MongoDB, with TTL indexes. Failed database/rate-limit checks fail closed. Production deployments should additionally use platform-level request controls for volumetric abuse.
- CSV exports are admin-only, capped at 10,000 rows, and escape spreadsheet formulas. Exported contacts are sensitive; store them appropriately.
- Enable Atlas backups, set a retention policy, and monitor Vercel application errors and SMTP delivery. Logs must not include connection strings, passwords, or tokens.
- Public HTML uses a request nonce for CSP, so it renders on the server instead of being fully static. Public content is still readable without client-side JavaScript.
- Never use `output: 'export'` or an Edge-only runtime for this app: authentication and Mongoose require Node.js.

Source is in this directory. Credentials, a live Atlas database, SMTP setup, and a Vercel account/domain are supplied by the operator; none are embedded in the project.

# ScalenexDigital

### Production database and admin initialization

Vercel uses `vercel.json` to run `npm run vercel-build`. After a successful production build, it initializes collections, indexes, the initial admin, and default commission rules. Preview deployments do not seed. Initialization failure fails deployment instead of silently publishing without an admin. Existing admin credentials and account status are preserved.

Set `MONGODB_URI`, `MONGODB_DB_NAME=scalenex`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (12+ characters), and `AUTH_SECRET` (32+ characters) in Vercel's **Production** environment. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your actual HTTPS website origin, not localhost. Atlas must permit the deployment's database connection. Redeploy after saving these settings; ensure a dashboard build-command override does not bypass `npm run vercel-build`.

To initialize manually from your local environment, run `npm run seed`. It loads the same `.env*` files as Next.js and also accepts environment variables supplied by the hosting provider. Sign in at `/login` with the configured initial admin credentials, then change the initial password. Running seed again never resets that password or reactivates a suspended account.
