# Maillage (Équipe 14, Hackathon étudiant 2026 Saint-Roch, Québec International)

Maillage, c’est l’app qui propose à un commerce, un artiste et un organisme de Saint-Roch un projet commun, sur la carte du quartier, avec les raisons de chaque suggestion.

**Essayer l’app :** https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/ (lien officiel, GitHub Pages). Le lien Vercel (https://hackathon-saint-roch-2026.vercel.app) est une copie de secours qui peut être périmée.

**Parcours de démo :** Commerçant → coller « On a un espace libre le jeudi soir et on cherche des artistes pour l’animer » → Trouver des partenaires → proposition à 87 % avec Camille Vézina et le Collectif Les Voisins en Scène → Ça m’intéresse → Voir ce que Camille reçoit → Accepter. La « Visite guidée » (environ 57 s) rejoue la même histoire toute seule. Détails : `docs/DEMO-SCRIPT.md`, tests : `TESTS.md`.

**Technologies :** React, Vite, TypeScript, MapLibre GL JS (fond OpenFreeMap / OpenStreetMap), un moteur de règles transparent (`src/engine/`, score pondéré affiché), et un labo d’IA qui tourne sur l’appareil avec transformers.js (page `/labo/`).

**Données :**
- Données ouvertes de la Ville de Québec et du ministère du Tourisme (SIT Québec), via donneesquebec.ca, licence CC BY 4.0 (attribution dans l’app). Liste complète : `docs/DATA-SOURCES.md`.
- Profils, événements et colonnes Morris de la démo : fictifs (noms inventés, placés sur de vrais points d’adresse ouverts).
- Les fichiers confidentiels fournis par les organisateurs ne sont pas dans ce dépôt : nous n’avons utilisé que leur structure (colonnes) et leur nombre de lignes, jamais leurs valeurs.

**Utilisation de l’IA :** Claude Code et Claude ont servi à écrire le code, les scripts de données et des brouillons de textes. L’équipe a fait elle-même le cadrage du problème, les choix de données, la conception, les tests et la présentation.

**Lancer en local :**
```
npm ci
npm run dev
npm test
```
