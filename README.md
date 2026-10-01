# MacroTrack

MacroTrack is a mobile-first nutrition tracker for a small private group. It supports calorie and macro logging, raw/cooked food variants, custom foods, recipes, weight history, targets, meal templates, and invitation-only progress sharing. It is not medical advice.

## Architecture

- **Frontend/server:** Next.js App Router, TypeScript, React, Tailwind CSS
- **Persistence/auth:** Supabase Postgres with Supabase Auth and RLS
- **Charts:** Recharts
- **Nutrition data:** editable Supabase catalogue first, then optional USDA FoodData Central server-side search
- **Deployment:** Vercel connected to GitHub

The browser only receives the Supabase anonymous key. The service-role key is deliberately not used by this app. User identity comes from the signed-in Supabase session; API routes recalculate nutrition from the stored food row before writing a food log.

## Project structure

```text
app/                  Routes, authentication actions, API routes
components/           Dashboard, shell, charts, shared UI
lib/nutrition/        Calculation engine and editable development seed data
lib/supabase/         Browser, server, and middleware clients
services/             Nutrition provider abstraction
supabase/migrations/  Schema, indexes, RLS, protected RPCs
supabase/seed.sql     Approximate global starter foods
tests/                Vitest unit tests
```

## Prerequisites

Install Node.js 20.9 or newer from [nodejs.org](https://nodejs.org/). Create a Supabase project and a Vercel account. You will also need a GitHub repository before deploying.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase environment values, the interface displays development sample data; persistent API operations require the Supabase setup below.

## Supabase setup

1. Create a project in the Supabase dashboard.
2. In **Authentication > URL Configuration**, add `http://localhost:3000/auth/callback` and your production URL with `/auth/callback`.
3. Copy the project URL and anonymous key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Open the Supabase SQL editor and run `supabase/migrations/20261001000000_macrotrack.sql` in full.
5. Run `supabase/seed.sql` to insert the editable approximate global food catalogue.
6. Create an account from `/signup`. The database trigger automatically creates its profile.

The migration enables RLS on every user-owned table. It includes security-definer RPCs only for accepting or declining an invitation and returning privacy-filtered group progress. Do not grant clients a service-role key.

## Nutrition provider configuration

USDA is optional. Add a FoodData Central API key to `.env.local` to search server-side only after the personal/global food catalogue returns no result:

```bash
USDA_API_KEY=your_usda_key
OPEN_FOOD_FACTS_USER_AGENT=MacroTrack/1.0 (contact@example.com)
```

The Open Food Facts user-agent variable is reserved for a future provider adapter. The current provider abstraction prevents either source from being coupled to UI components. Never put provider keys in a `NEXT_PUBLIC_` variable.

## Everyday workflows

- **Add food:** choose a food, confirm its state, enter grams, choose a meal, and add it. Nutrition is always calculated from the per-100g value with `calculateNutrition()`.
- **Raw/cooked:** separate food records retain their own nutrition values. No implicit raw-to-cooked conversion occurs.
- **Custom food:** enter the product-label values per 100g; records are owned by the authenticated user.
- **Recipe:** persist ingredient rows, enter the final cooked weight, then use the recipe per-100g result for servings.
- **Groups:** create a group, invite an existing account, then the recipient uses the protected accept/decline operation. An invitation itself does not grant group access.

## Tests and quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests cover standard and decimal nutrient quantities, recipe servings, total/goal calculations, and invitation response ownership. RLS-sensitive behavior is enforced in the SQL migration and should also be exercised against two real test users before production release.

## Vercel and GitHub deployment

1. Commit the project to a new GitHub repository (do not commit `.env.local`).
2. Import the repository in Vercel and select the Next.js preset.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and optionally `USDA_API_KEY` to Vercel’s environment variables.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed Vercel URL and add that URL to Supabase Auth redirect URLs.
5. Deploy. Vercel is recommended because server routes securely access nutrition providers. GitHub Pages cannot safely host this server-side functionality.

## Security checklist

- RLS restricts food logs, weights, recipes, custom foods, templates, and profiles to their owner.
- Global foods are readable by authenticated users but cannot be edited by them.
- Group rows and activity are readable only after membership exists.
- The invitation recipient alone can accept or decline a pending invitation through controlled functions.
- Group progress returns only data allowed by each member’s privacy settings.
- No client accepts `user_id` as authority; routes query the authenticated Supabase user.

## Known limitations

The starter catalogue contains approximate generic values and needs verification for a user’s particular product. The UI ships with a development sample view before environment configuration; it does not use localStorage as a database. The schema and RLS coverage include recipes, templates, group ownership, and invitations, while dedicated recipe/template composers and group-owner management screens still need to be added before a public launch. Add integration tests against a dedicated Supabase test project and set up a scheduled review of provider data and dependency security updates.

### External nutrition search

Food search checks the user's saved MacroTrack catalogue first, then searches external nutrition sources. Selecting an external result automatically imports its nutrition data into that user's private `foods` library before it can be logged.

- **USDA FoodData Central** is used when `USDA_API_KEY` is configured.
- **Open Food Facts** is also searched and does not require an API key.

Add this to `.env.local` if you have a USDA FoodData Central key:

```env
USDA_API_KEY=your_usda_api_key
```

The key is server-side only and is never exposed to the browser.
