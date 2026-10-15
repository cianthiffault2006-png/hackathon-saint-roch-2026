# Maillage design direction: « le point de maille » (2026-10-15)

Direction by a design review on 2026-10-15. Mock: `docs/design/mock-m-accueil.png` (source `docs/design/mock-accueil.html`, copy-pasteable CSS).

## Why
The current UI reads as generated. What gives it away:
- system-ui / Segoe UI everywhere;
- pills everywhere (`.btn` 999px at styles.css ~910, chips, tags, badges);
- white rounded cards with soft shadows on cream;
- the same 16px radius on everything;
- too many badges in one row (Explorer rows, profile);
- an orange pill « Démo simulée » sticker;
- a round white back button next to a pale-green pill label;
- pale-green tinted blocks for every list item;
- grey helper text under everything;
- the 4-stat dashboard;
- Unicode glyph icons in the sidebar;
- a phone column floating in an empty desktop;
- three equal pills in the tour bar.

**Keep:**
- the Okabe-Ito pins with distinct shapes and stroke icons (`Icones.tsx`);
- the dashed partner links on the map;
- the palette (#1f5f4a / #b9460e);
- the 44px targets, focus rings and reduced-motion rules;
- the sheet architecture: `.feuille` is an opaque, non-scrolling card, `.feuille-defile` is the transparent inner scroller, and `.pied-feuille` stays outside it. This fixed a stale-repaint bug over the WebGL map, so never add overflow, backdrop-filter, opacity or a background to `.feuille-defile`.

## Identity
Saint-Roch was Québec's manufacturing quarter: corset, shoe and textile factories (the Dominion Corset building is now the École de design de l'Université Laval). *Maillage* is the knit stitch.
1. **Paper, not white.**
   - The page is warm paper; cards are « craie » with a 1px linen line and no drop shadow. Only the sheet and the floating map buttons keep a shadow.
   - The body has a faint 24px grid.
2. **The stitch is the line.** Dividers, section rules, progress tracks, pagination and map partner links are all a running stitch (dashed, 7px on / 5px off, green thread).
3. **The stamp, not the badge.**
   - « DÉMO SIMULÉE » is a rotated rubber stamp: brick outline, uppercase, letterspaced.
   - Status uses the same stamp in green.
4. **Shapes repeat.** The role buttons on Accueil carry the same pin shapes and colours as the map legend.

## Type
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,600..700,0..100;1,9..144,600..700,0..100&family=Atkinson+Hyperlegible+Next:wght@400;500;700&display=swap" rel="stylesheet">
```
- **Fraunces 600** for titles, and 600 italic for the pitch and the tour narration. Use `font-optical-sizing:auto; font-variation-settings:"SOFT" 100`.
- **Atkinson Hyperlegible Next 400/500/700** for the UI. It was made by the Braille Institute for low-vision readers, which is a talking point for the Ville.
- Fallbacks: Georgia / system-ui.
- **Sizes:**
  - logo 48/1.0;
  - screen titles 26/1.2, Fraunces 600, `--vert-fonce`;
  - pitch 22/1.3, Fraunces italic, in ink;
  - section labels 13px, 700, uppercase, `.12em` letter-spacing, `--gris-fil`;
  - body 16/1.5;
  - helper text 14 in `--gris-fil`.

## Tokens (paste over `:root`; the aliases keep existing `var()` working)
```css
:root {
  --papier: #f7f1e6; --lin: #efe7d8; --craie: #fffdf8; --trait: #d9cfbd;
  --encre: #15201b; --gris-fil: #4f5f58;
  --vert: #1f5f4a; --vert-fonce: #164536; --vert-pale: #e6f1ec; --fil: var(--vert);
  --brique: #b9460e; --brique-fonce: #8f360a; --brique-pale: #fbe9dc; --ocre: #e3b100; --focus: #164536;
  --couleur-commerce: #b9460e; --couleur-organisme: #0072b2; --couleur-citoyen: #7b3f9e;
  --couleur-lieu: #009e73; --couleur-lieu-texte: #00694d; --couleur-evenement: #e3b100; --contour-evenement: #15201b;
  --rayon: 10px; --rayon-petit: 6px; --rayon-pilule: 999px; --rayon-feuille: 16px;
  --ombre-flottante: 0 -2px 10px rgba(21, 32, 27, 0.18);
  --police: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif;
  --police-titre: "Fraunces", Georgia, "Times New Roman", serif;
  --couture: repeating-linear-gradient(90deg, var(--fil) 0 7px, transparent 7px 12px);
  --couture-v: repeating-linear-gradient(180deg, var(--fil) 0 7px, transparent 7px 12px);
  --fond: var(--papier); --surface: var(--craie); --texte: var(--encre); --gris: var(--gris-fil);
  --cta: var(--brique); --cta-fonce: var(--brique-fonce); --orange-pale: var(--brique-pale);
  --accent: #e8833a; --orange: var(--accent); --bordure-champ: #758580;
}
body { font-family: var(--police); color: var(--encre); background: var(--papier);
  background-image: linear-gradient(to right, rgba(31,95,74,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,95,74,.04) 1px, transparent 1px);
  background-size: 24px 24px; }
```
**Contrast:**

| Text on background | Ratio |
|---|---|
| encre on papier | 14.9 |
| gris-fil on papier | 6.0 |
| vert on papier | 6.7 |
| white on brique | 5.3 |
| brique-fonce on papier | 6.9 |
| white on vert-fonce | 10.8 |

Only icons go on `#009e73` (3.4), never text.

**Shape and shadow rules:**
- Pill radius is for toggle chips and status tags only.
- Exactly two shadows: `.feuille`, and the floating buttons over the map (`.retour-carte`, `.ex-fiche`).
- Everything else uses `border: 1px solid var(--trait)` on `--craie`.

## Stitch, stamp, icons (CSS)
```css
.couture { height: 2px; border: 0; margin: 16px 0; background: var(--couture); }
.sous-titre { display: flex; align-items: center; gap: 10px; }
.sous-titre::after { content: ''; flex: 1; height: 2px; background: var(--couture); opacity: .45; }
.liste-part { position: relative; padding-left: 18px; }
.liste-part::before { content: ''; position: absolute; left: 4px; top: 10px; bottom: 10px; width: 2px; background: var(--couture-v); }
.partenaire { position: relative; background: var(--craie); border: 1px solid var(--trait); border-radius: var(--rayon); }
.partenaire::before { content: ''; position: absolute; left: -19px; top: 14px; width: 8px; height: 8px; border-radius: 50%; background: var(--fil); box-shadow: 0 0 0 2px var(--papier); }
.barre, .p2-barre-piste { height: 8px; border-radius: 2px; background: repeating-linear-gradient(90deg, var(--lin) 0 6px, transparent 6px 9px); }
.barre > span, .p2-barre-rempli { background: var(--vert); border-radius: 2px; }
.point { width: 14px; height: 3px; border-radius: 2px; background: var(--trait); } .point-on { background: var(--brique); }
.badge-demo { padding: 3px 9px; border: 2px solid var(--brique); border-radius: 4px; background: transparent; color: var(--brique-fonce);
  font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; transform: rotate(-4deg); white-space: nowrap; pointer-events: none; }
.tampon-vert { border-color: var(--vert); color: var(--vert-fonce); transform: none; }
```
- **Map links:** the dashed partner line becomes `--fil`, width 3, `line-dasharray [1.5, 2.5]`, `line-cap round`.
- **New icons in `Icones.tsx`:**
  - `liste: '<path d="M4 7h16M4 12h16M4 17h10"/>'`
  - `barres: '<path d="M4 20v-9M10 20V5M16 20v-6M2 20h20"/>'`
  - **The loop mark (logo):** 40x40, fill none, stroke `--vert` 3, round caps:
    `<path d="M8 26c0-9 6-14 12-14s12 5 12 14"/><path d="M4 18c0 9 6 14 12 14"/><path d="M36 18c0 9-6 14-12 14"/><circle cx="20" cy="12" r="2.2" fill="#b9460e" stroke="none"/>`

## Per screen, by impact per hour
**A. Global (25 min)**
- Tokens, the font link in index.html, and `html, body` font.
- Headings: `.logo, .feuille-titre, .fiche-titre, .pj-titre, .pp-titre, .p2-sdc-titre, .p2-invit-titre, .po-titre, .carte-fin p, .dashboard-entete h1` get Fraunces 600, `--vert-fonce`, `-.01em` letter-spacing, line-height 1.15.
- Delete the `.btn { border-radius: 999px }` override.
- Card rule: `.pj-carte, .p2-kpi, .p2-sdc-carte, .p2-carte, .ex-item, .pp-carte, .po-carte, .carte-projet, .dashboard-stat, .dashboard-carte-projet` get `--craie`, a 1px `--trait` border, `--rayon` radius and no shadow.
- Stamp and stitch utilities.
- Replace the hard-coded hex colours in `TableauSdc.css` and `InvitationPartenaire.css` with the vars.

**B. Accueil (25 min), per the mock**
- Stamp at top left.
- Loop mark plus « Maillage » in Fraunces 48.
- `SAINT-ROCH · QUÉBEC` label.
- Pitch in Fraunces italic 22, in ink.
- Stitch rule, then the label « VOUS ÊTES… ».
- Three role buttons:
  - on craie, with a 6px left thread in the role colour (`box-shadow: inset 6px 0 0 var(--c)`);
  - the 30px pin shape (`PinForme`), label 18/700;
  - an optional hint (« café, boutique, resto » / « OBNL, collectif, école » / « artiste, voisin, bénévole »).
- Stitch rule, then the outline buttons (radius 10).
- The small links in one row with dashed underlines.

**C. Proposition sheet (20 min)**
- `.feuille` on craie, with a stitch handle `::before`: a non-scrolling flex child with no overflow.
- `.nav-btn` transparent with a 1px border.
- Pagination as stitches.
- Title in Fraunces 24.
- `.score` in Fraunces 22, 600, `--vert`: this is the sheet's hero number.
- Bars as stitches.
- Partners threaded: `.liste-part` instead of pale-green blocks.
- `.statut`: lin background, brique-fonce text, 4px brique left border.
- Legend and pin labels on craie, radius 6.

**D. Fiche (15 min)**
- `.retour` 44px, radius 10, craie, 1px border, no shadow.
- `.role-tag` becomes an uppercase label, not a pill.
- Title in Fraunces 26; date in Fraunces 20; status as the green stamp.
- Partners threaded.
- A stitch progress line under « À confirmer » (`.progres-couture`).
- Actions: one brique button, then text links with dashed underlines.

**E. SDC dashboard (20 min)**
- The fictional banner becomes a stamp; title in Fraunces 26.
- KPIs become one bordered grid block: numbers in Fraunces 36, labels uppercase 12.
- Bars as stitches.
- « Profils pré-remplis à activer » number in Fraunces 44, `--brique-fonce`.
- The impact box becomes Fraunces italic 18 under a stitch.

**F. Explorer and profil (10 min, CSS only)**
- Craie items.
- The « Voir le profil » pill becomes a dashed-underline link.
- Badges become uppercase labels (brique-fonce; green when verified).
- The profile's read-only pills become inline text separated by « · ».

**G. Tour bar (10 min)**
- Caption in Fraunces italic 18.
- Progress as a stitch.
- Pause and Suivant as craie buttons; « Quitter la visite » as a text button.
- End card text in Fraunces 600 28, with the loop mark.

**Later:**
- H: fil tabs with a stitched underline.
- I: small screens.
- J: sidebar and dashboard restyle (her branch). Lin rail, stitched seam, Icone instead of glyphs. Keep her dashboard content unless the team decides otherwise.
- Desktop two-column Accueil, self-hosted fonts.
- No dark mode, because the basemap is light.
