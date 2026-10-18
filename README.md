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

## Data and privacy

This implementation is a local-first demo. It saves records in the browser's `localStorage` under the key `dileep-life-os-v1`. Data remains on that browser/device, is not encrypted by this app, and is not synchronized or backed up. Clearing browser storage or using the in-app clear action permanently removes it.

There is no configured Supabase project, authentication provider, backend, or database in this workspace. Therefore, this app does **not** provide account creation, secure sign-in, protected routes, server-side validation, multi-device access, or row-level security. Do not use this demo to store sensitive information. A production deployment should add Supabase Auth, PostgreSQL migrations, and row-level security policies before collecting personal records.

## Data behavior and limitations

- Schedule entries, completion state, notes, and set logs are associated with the selected date.
- Completion is always explicit; elapsed time never changes activity, meal, workout, or topic status.
- Nutrition values are approximate starter estimates intended for editing, not medical advice. Food is counted only after marking it consumed; cooked rice, raw-weight chicken, and dry chana are labeled distinctly.
- Streaks, weekly reports, background reminders, Pomodoro timers, session timing, and cross-device sync are not implemented. Reminders are in-app indicators only; browser push notifications are not enabled.
- The workout page contains a searchable exercise library and saved set checkboxes, but does not yet record repetitions/loads, calculate volume/PRs, or configure a weekly split.
- Calendar provides a month view; week/day calendar views and automatic copying of the prior day's schedule are not included.
- CSV export is available for activities, weigh-ins, and study records. Nutrition and workout export are not yet included.

## Project structure

- `src/App.tsx` — application views, data types, date-scoped interactions, and local persistence.
- `src/App.css` — responsive application components and layouts.
- `src/index.css` — global styles and theme tokens.

## Schema direction for a backend

The local state models a profile/preferences record, schedule templates, date-keyed daily activities, weigh-ins, food entries, water entries, learning topic status, study sessions, mock tests, and date-keyed workout set logs. A production schema should normalize these into user-owned tables (`profiles`, `daily_schedules`, `daily_activities`, `weight_entries`, `food_items`, `nutrition_logs`, `water_logs`, `learning_topics`, `study_sessions`, `mock_test_results`, `workout_sessions`, and `workout_sets`) with foreign keys, timestamps, validation, indexes, and row-level security for every user-owned record. No production database schema or deployment is currently configured.
