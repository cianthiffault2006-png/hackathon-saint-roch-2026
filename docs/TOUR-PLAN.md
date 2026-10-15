# Visite guidée: current state and proposed storyboard (2026-10-15 ~14:00)

Prepared for Cian's detailed review. Nothing in the tour has been changed yet.

## Current tour: 57 s, 13 steps, covers about 12 of 40 features
role 3 s · saisie 6 · bouton 2.5 · carte 6 · raisons 4.5 · intérêt 4.5 · invitation 4.5 · confirmé 3 · fiche 4 · coches 4 · fil 6 · projets 4 · fin 5.
Step list: `src/tour/script.ts:27-41`. Per-step behaviour: hard-coded in `src/App.tsx:182-214`. Controls: Pause, Suivant, Quitter (no Précédent, no chapters).

## Why it feels too fast
- **carte:** the sheet only slides in after all pins drop (700 ms each), so the title and 87 % show for 0.5 to 2.5 s.
- **confirmé:** coming back from the invitation replays the pins and the sheet, so the confetti is probably never seen.
- **raisons:** only 4 of 5 reasons appear, and the last one shows for 0.6 s.
- **invitation, confirmé, fiche:** 11-word captions in 3 to 4.5 s.
- **fil:** the caption names 3 tabs, but only Discussion is shown. Camille's reply has about 2 s on screen.
- Never named on screen: the score, the legend, the 5-min ring, « À confirmer », the nearby events.

## Not shown at all
- « Comment ce score », Plus d'options, « Je participe »
- Explorer le quartier, profils publics, Proposer un projet ouvert, 911/311
- Participants, Mises à jour, Signaler and slow mode
- Tableau SDC, Sources
- **Sofia's story:** its texts exist in `fr.ts:225-226` but are unused.

## Two facts to fix before the tour shows Sofia
- **Third partner:** the engine pairs Sofia with Équipe Propreté du Faubourg **and Malik A., étudiant en génie**, not « un café du coin » as the unused caption says.
- **311 checklist:** the « autorisation du propriétaire / 311 » checklist only appears in « Proposer un projet ouvert » → Exemple. The 74 % proposal's own « À confirmer » list is generic (`proposer.ts:312-320`).

## Proposed storyboard: about 2:18, 10 chapters
T = timing or caption change only. N = needs new tour code.

| Ch. | s | What it shows | Caption | |
|---|---|---|---|---|
| 0 Ouverture | 6 | 3 roles, then Commerçant | « Maillage relie commerces, organismes et citoyens de Saint-Roch. » / « Premier exemple : le Café Le Petit Détour. » | T |
| 1 Le besoin | 9 | typing, chips, button | « Il écrit son besoin avec ses mots… » / « Un toucher : Trouver des partenaires. » | T |
| 2 La proposition | 30 | pins at 400 ms; legend; score detail open; reasons at 1.4 s each; À confirmer and events; Ça m'intéresse | « Trois partenaires à quelques minutes à pied. » « Compatibilité 87 %… et voici pourquoi. » | T + N |
| 3 Côté partenaire | 12 | invitation read, accept, confirmed with no replay | « Camille reçoit l'invitation : son rôle, et pourquoi elle. » « Les trois acceptent : projet confirmé (simulé). » | T + N |
| 4 La fiche | 13 | date and partners, ticks, calendar and share | « Calendrier avec rappel la veille, partage. Rien n'est envoyé tout seul. » | T + N |
| 5 Le fil | 16 | Participants, Mises à jour, Discussion, Signaler and 15 s countdown | « Les coordonnées ne sont partagées qu'après acceptation. » « Anti-spam… tout message peut être signalé. » | N |
| 6 Sofia | 18 | graffiti text, corvée 74 %, Plus d'options slider, Je participe | « Deuxième exemple : Sofia voit des graffitis rue Saint-Joseph. » | N |
| 7 Le quartier | 12 | Explorer map, filter and search, list, a public profile with a badge | « Explorer le quartier : tout Saint-Roch sur une carte. » | N |
| 8 Projet ouvert | 8 | Exemple, « Avant de commencer », 911/311 note | « Ou lancer un projet ouvert : rôles recherchés, autorisation, 311. » | N |
| 9 Pour la SDC | 10 | Mes projets, Tableau SDC, Sources | « La SDC suit l'impact… » « Données ouvertes de la Ville; profils fictifs pour la démo. » | N |
| Fin | 4 | end card | unchanged | T |

**Steps to cut to get near 2:00:** the legend highlight, the calendar fallback, Je participe, Explorer's list view, Sources.
**Labo IA:** keep it out of the tour (the model is about 130 MB). Use a separate video insert or one caption line.

## How to build it (about 1 to 2 hours plus the new chapters)
1. **Chapters:** add `chapitre` to each step. In `useTour`, add Précédent, chapter jumps and `allerA(index)`. TourBar shows the chapter title and dots.
2. **Rebuild from the index:** each step's state must be rebuildable from its index alone (project statuses, clearing the tour thread), so that jumping back works.
3. **Scripted actions:** generalise `FilAuto` into a data list of `{atMs, click|type, selector}`. Explorer, Plus d'options, the open project form and the fil tabs are then driven from `script.ts`, not new props.
4. **Sofia:** needs a second precomputed proposal, with Sofia as the asker.
5. **Never save:** the tour must never save to the viewer's Mes projets. Today `onCree` and `participer` would save.

**Risk:** proposals use today's date for nearby events, so the scores can drift (the test pins the café between 83 and 89 %). Check both scores on recording day.
