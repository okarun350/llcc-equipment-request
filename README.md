# Lapu-Lapu City College Equipment Requests

A responsive request form for LED wall and event sound equipment. The form follows the college request sheet: requester information, event organizer and event details, venue, equipment selection, and office-only review/approval fields.

## Run locally

1. In PowerShell, open the project folder: `Set-Location "C:\Users\PC#4\Desktop\do not delete"`.
2. Install dependencies if needed: `npm install`.
3. Build the app: `npm run build`.
4. Start the production preview: `npm run preview -- --host 127.0.0.1 --port 4173`.
5. Open `http://localhost:4173` in Chrome. Keep PowerShell open while using the app.

The workspace path contains `#`, which can prevent Vite's development server from resolving source files on Windows. The production build and preview work. For database submission, create `.env.local` from `.env.example` with the Supabase project URL and publishable key, then restart the preview process.

## Supabase setup

1. Create a Supabase project.
2. Open the project's SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Run `npm run build` and then the preview command above again.

Requests are stored in `equipment_booking_requests` with `pending` status. Public access is insert-only, approval fields must be empty on public submissions, and requests are not publicly readable. College staff can review requests in Supabase or through a separate authenticated staff application; no staff approval screen is included in this requester form.

If the earlier studio-booking schema was already run, this schema adds a separate equipment request table and leaves the original tables untouched.

## Commands

- `npm run build` type-checks and creates the production build.
- `npm run lint` runs Oxlint.
- `npm run preview -- --host 127.0.0.1 --port 4173` serves the build locally.
