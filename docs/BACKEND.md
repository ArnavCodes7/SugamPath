# Plugging in a backend

Everything the app sends to a server goes through one interface: `src/services/backend/types.ts` (`SugamBackend`).
By default the app runs on `localBackend` (localStorage + BroadcastChannel), so every feature works with no server.
Open a trip in one tab and `/track/<token>` in a second tab to see the live Walk-With-Me page update.

## Supabase (zero-login caregiver link + crowd data)
1. `npm i @supabase/supabase-js`
2. Run `supabase/schema.sql`.
3. In `src/main.tsx` add:
   ```ts
   import { createClient } from '@supabase/supabase-js';
   import { registerBackend } from './services/backend';
   import { createSupabaseBackend } from './services/backend/supabaseBackend';
   registerBackend(createSupabaseBackend(createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)));
   ```
Remote backends are wrapped in an offline outbox automatically. SOS and position updates made in a tunnel are replayed in order when signal returns.

## "What's ahead?" (Gemini / Groq)
Either set `VITE_API_BASE` (the app POSTs to `${VITE_API_BASE}/api/whats-ahead`) or deploy a Supabase Edge Function named `whats-ahead`.

Request: `{ image: "data:image/jpeg;base64,...", language: "en"|"hi"|"pa", placeId?: string }`
Response: `{ guidance: string, hazard?: { kind: "blocked_path"|"vendor"|"parked_vehicle"|"stairs"|"other", side?: "left"|"right"|"ahead" } }`

Prompt rules for the model: one or two short sentences, say which side to step to, never claim the way is safe, answer in the requested language, keep the key server-side.

## Pushing SOS to the emergency contact
The app already opens call / WhatsApp / SMS links on the traveller's own phone. To also notify the contact automatically,
add a Postgres trigger or Edge Function on `trips` updates where `state->>'status' = 'sos'` that sends an SMS/WhatsApp message containing `/track/<token>`.

## Self-check
`npx tsx scripts/selfcheck-pulse.ts` verifies the sensor classifiers and hazard decay. `npx tsx scripts/selfcheck-legal.ts` verifies the legal eligibility gate.
