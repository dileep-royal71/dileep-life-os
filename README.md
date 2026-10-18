# DILEEP LIFE OS

A personal command center for daily routines, strength training, weight tracking, nutrition, hydration, and technical and SSC CGL study.

The public demo starts with a generic profile. Set your own name and date of birth in Settings after opening it. Avoid publishing personal data in screenshots, issues, or commits.

## Features

- Responsive dark/light dashboard with a live clock, timezone setting, and date-of-birth-based age.
- Per-date timetable with activity statuses, notes, reminders, schedule edits, filters, and a month calendar.
- Exercise finder with set completion logs and explicit workout completion.
- Weight history and a trend chart based only on saved weigh-ins.
- Editable starter food diary, consumed-item nutrition totals, and explicit water logging.
- Python/SQL topic checklists, manual study-session logs, SSC CGL session records, and mock-test accuracy.
- Calculated overview reports and CSV exports.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```powershell
npm install
npm run dev
```

Create a production build with `npm run build`; run the source linter with `npm run lint`.

## Authentication and persistent cloud data

The app uses Supabase Auth (email/password) and stores each signed-in user's Life OS data in a private PostgreSQL row. The SQL migration enables row-level security and only permits an authenticated user to read or modify their own row. Saved records sync to that account and load again when the user returns on another device.

### Configure a Supabase project

1. Create a project at [Supabase](https://supabase.com/dashboard). Keep the database password private.
2. In **SQL Editor**, run [`supabase/migrations/20261018000000_user_life_os_data.sql`](./supabase/migrations/20261018000000_user_life_os_data.sql).
3. In **Authentication → URL Configuration**, set the site URL to `https://dileep-royal71.github.io/dileep-life-os/` and allow that URL plus `http://localhost:5173/**` as redirect URLs.
4. In **Authentication → Providers → Email**, enable email/password signup. Email confirmation is recommended; users must confirm before their first sign-in.
5. Copy the **Project URL** and browser-safe **publishable/anon key** from the Supabase project API settings. Never use a `service_role` or secret key in this frontend.
6. For a local run, copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then restart Vite.
7. For GitHub Pages, open the repository **Settings → Secrets and variables → Actions → Variables** and create `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These values are embedded in the public client bundle; security relies on Supabase Auth and RLS. Never expose a service-role key in the frontend or build.
8. The existing Actions workflow builds and deploys after a push to `main`. GitHub Pages must use **Settings → Pages → Build and deployment → GitHub Actions**.

Until the Supabase URL and publishable key are configured in GitHub's Actions variables, the site intentionally shows a setup notice and disables sign-in. No Supabase project or database credentials are configured in this repository.

Existing records under the old `dileep-life-os-v1` browser key are never uploaded automatically. After first sign-in, if such data exists in the current browser, the user can explicitly import it into their account or start fresh.

## Data and privacy

Supabase stores the app's JSON state in a row whose `user_id` references `auth.users`; database RLS prevents one account from accessing another account's row. Supabase Auth manages passwords and browser sessions. Review the Supabase project's backups, retention, and security settings for your needs. A public frontend key is not an authorization boundary; the RLS policies are essential.

## Publish with GitHub Pages

The repository includes a GitHub Actions Pages deployment workflow. On each push to `main`, it runs the production build and publishes `dist/`. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. After the first successful workflow run, the site is available at `https://dileep-royal71.github.io/dileep-life-os/`.

## Data behavior and limitations

- Schedule entries, completion state, notes, and set logs are associated with the selected date.
- Completion is always explicit; elapsed time never changes activity, meal, workout, or topic status.
- Nutrition values are approximate starter estimates intended for editing, not medical advice. Food is counted only after marking it consumed; cooked rice, raw-weight chicken, and dry chana are labeled distinctly.
- Streaks, weekly reports, background reminders, Pomodoro timers, and timed study sessions are not implemented. Reminders are in-app indicators only; browser push notifications are not enabled.
- The workout page contains a searchable exercise library and saved set checkboxes, but does not yet record repetitions/loads, calculate volume/PRs, or configure a weekly split.
- Calendar provides a month view; week/day calendar views and automatic copying of the prior day's schedule are not included.
- CSV export is available for activities, weigh-ins, and study records. Nutrition and workout export are not yet included.

## Project structure

- `src/App.tsx` — application views, date-scoped interactions, authentication session, and cloud persistence.
- `src/AuthScreen.tsx` — email/password sign-in, registration, password-reset requests, and password updates.
- `src/lib/supabase.ts` — typed Supabase client configuration.
- `supabase/migrations/` — PostgreSQL table and row-level security setup.
- `src/App.css` — responsive application components and layouts.
- `src/index.css` — global styles and theme tokens.

## Schema direction for a backend

The JSON state includes profile/preferences, date-keyed activities, measurements, foods, water, learning topics, study sessions, mock tests, and workout set logs. The current schema uses one RLS-protected row per authenticated user for atomic whole-state saves; normalized domain tables may be appropriate if concurrent editing or high-volume analytics are introduced.
