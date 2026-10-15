# CLAUDE.md (Équipe 14, Hackathon étudiant 2026 Saint-Roch; under 80 lines)


## What we are building
Pour les commerçants, organismes et citoyens de Saint-Roch qui ont des ressources et des projets mais ne se connaissent pas, Maillage est une app mobile qui leur propose des projets communs à trois partenaires sur la carte du quartier, avec les raisons de chaque suggestion, à partir des répertoires d'organismes, de commerces et d'installations de la Ville.

Matching is a transparent rules engine (no AI in the demo; phase 2 swaps `lireBesoin` for a language model). 'Ça m'intéresse' is simulated and labelled « Démo simulée ». Pre-filled profiles are hidden until claimed (Loi 25).

Demo path (the only thing that must work): choisir un rôle (café) → décrire le besoin (texte + puces) → proposition à 3 partenaires sur la carte (raisons, à confirmer) → « Ça m'intéresse » → statut en attente puis projet confirmé (simulé). Plus a « Visite guidée » auto-play of the same story. Everything else is roadmap.

## Team and ownership (one owner per file)
Humans: L Cian (integration, merges, freezes, demo clicks); the team at the table takes D (numbers), U (French text, slides, voice), Q (phone tests, stopwatch, backup video). Each human reviews what the Claude teammate of that role makes.
Claude teammates (Sonnet, one branch and one worktree each; they report to "team-lead"):
- team-lead (the Headmaster session, with L): `CLAUDE.md`, `README.md`, `.gitignore`, `docs/BOARD.md`, `docs/DATA-CONTRACT.md`, `src/types.ts`, `.vercel/`; `package.json` and `package-lock.json` from gate 2 on. Merges to `main`, deploys, tags.
- build (for L), branch `feat/app`: `src/**` except the files listed for others, `index.html`, Vite and TS config; `package.json` and `package-lock.json` until gate 2.
- data (for D), branch `data/v1`: `data/**`, `scripts/**`, `public/data/**`, `docs/DATA-SOURCES.md`. Nobody else edits data files.
- copy (for U), branch `copy/fr`: `src/i18n/fr.ts`, `docs/pitch/**`. Slides themselves live outside the repo.
- qa (for Q), branch `qa/tests`: `TESTS.md`, `public/seed/**` (separate from D's data), `docs/DEMO-SCRIPT.md`.
- engine (plain helper for L), branch `feat/engine`: `src/engine/**`. · db, build2: not used.

## Stack
Vite + React + TypeScript. MapLibre GL JS with the OpenFreeMap style `https://tiles.openfreemap.org/styles/liberty` (no key). Static GeoJSON/JSON in `public/data/`. Recharts for charts. Turf.js only when spatial math is needed. Deployed on Vercel by the CLI; `main` is production, a preview URL comes from `vercel` in a branch worktree. [Supabase: not used | one table `[name]`, anonymous inserts under RLS, publishable key only, in Vercel env vars, never in the repo.]

## Rules for Claude in this repo
- Plan mode first on every feature; show a short plan, wait for approval, then edit.
- Smallest change that moves the demo path. No refactors. New dependencies only by the owner of `package.json` (build until gate 2, then team-lead).
- French interface text only, Québec spelling; U reviews every string before it ships.
- Attribution visible on every screen that shows third-party data, worded exactly as that dataset's licence requires (read from the organizers' data pack): [lines go here as datasets are added].
- No personal data about residents, merchants or vulnerable people anywhere (data, seed, screenshots, commits).
- Never commit keys. `.env.example` lists variable names only.
- Edit only the files your role owns (block above); for anything else, message team-lead. After gate 2, only team-lead adds dependencies.
- Keep the deployed URL working: run `npm run build` before proposing a merge to `main`.

## Commands
- `npm install` · `npm run dev` · `npm run build` · `npm run preview`
- Deploy: team-lead runs `vercel --prod` from the main clone after a verifier PASS and the merge; `vercel` in a worktree gives a preview URL.

## Freezes (day 2)
Pitch Fri Oct 16 14:30 (5 min + 3 min questions). Feature freeze 11:30; code freeze 12:30: tag `v1-pitch`, record the backup video, export slides to PDF, copy to a second laptop and a USB key. After the code freeze, the only change is a revert to the tag and a redeploy: `git checkout v1-pitch && vercel --prod` from L's machine (or revert `main` to the tag and push).

## Data sources used (full list with notes: `docs/DATA-SOURCES.md`)
| File | Source dataset | URL | Licence | Pulled on |
|---|---|---|---|---|
| `data/open/vque_14_lieux_publics.geojson` (+ Saint-Roch extract) | Lieux publics, Ville de Québec | https://www.donneesquebec.ca/recherche/dataset/vque_14 | CC BY 4.0 | 2026-10-15 |
| `data/open/vque_9_quartiers.geojson` (+ Saint-Roch polygon) | Quartiers, Ville de Québec | https://www.donneesquebec.ca/recherche/dataset/vque_9 | CC BY 4.0 | 2026-10-15 |
| `data/open/vque_24_reseau_cyclable.geojson` | Réseau cyclable, Ville de Québec | https://www.donneesquebec.ca/recherche/dataset/vque_24 | CC BY 4.0 | 2026-10-15 |
| `data/open/sit_quebec_hotels_saint_roch.geojson` | Hôtels, SIT Québec (ministère du Tourisme) | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-hotels | CC BY 4.0 | 2026-10-15 |
| `data/open/sit_quebec_culture_saint_roch.geojson` | Culture, arts et patrimoine, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-culture-art-et-patrimoine | CC BY 4.0 | 2026-10-15 |
| profile and event positions | Adresses de la Ville de Québec | https://www.donneesquebec.ca/recherche/dataset/adresses-de-la-ville-de-quebec | CC BY 4.0 | 2026-10-15 |
| `public/data/profils.json`, `evenements.json`, Morris columns | Fictional rows with the provided files' columns | none | n/a | 2026-10-15 |

## AI use (also on the last slide and in README)
Tools: [Claude Code, Claude]. Used for: [coding, data scripts, French copy drafts]. Done by the team itself: [problem framing, interviews, data choices, design decisions, testing, presentation].

## Confidential data rule (cahier du participant p.4, binding)
The provided « Données fournies » files live in `data-private/` only: git-ignored, Read denied to Claude, never committed, pushed or deployed. Claude may see file names, structure, column names, types, row counts, descriptions and open-data links, never a value. The app runs on open data (donneesquebec.ca, ville.quebec.qc.ca) or fake rows with the provided columns.
