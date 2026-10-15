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

## Fil en direct (bêta, optionnel)

La démo du jury reste sur le fil simulé : le projet du café, la corvée de Sofia et la visite guidée ne passent jamais en direct. Pour les autres projets, l’onglet Discussion offre un interrupteur « Fil en direct (bêta) », désactivé par défaut, qui partage les messages entre appareils avec Supabase (lien de partage `#fil/<id>?t=<titre>`). Sans configuration, l’app affiche une note discrète et la discussion reste sur l’appareil.

Pour l’activer :
1. Dans un projet Supabase, exécuter les fichiers de `supabase/migrations/` dans l’ordre (éditeur SQL du tableau de bord, ou `supabase db push`). Ils créent la table `messages` (aucun accès direct par l’API), le déclencheur anti-abus et trois fonctions : `lire_fil` (un fil à la fois, il faut son identifiant, donc le lien), `envoyer_message` et `signaler` (10 signalements par heure et par appareil). Les appareils se préviennent par un message Realtime « broadcast » sur `fil:<id>` puis relisent le fil, et relisent aussi toutes les 20 secondes.
2. Créer `.env.local` à la racine (ignoré par git, modèle : `.env.example`) avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (clé publiable, jamais la clé secrète ni `service_role`). Sur Vercel, mettre les mêmes variables dans les réglages du projet.
3. `npm run dev` ou `npm run build`. La bibliothèque Supabase n’est chargée qu’à l’ouverture d’un fil en direct.

## Licence

Code sous licence MIT (fichier `LICENSE`). Les données ouvertes gardent leur licence d’origine (CC BY 4.0).
