# TESTS.md : Maillage, parcours de démo

Production : https://hackathon-saint-roch-2026.vercel.app
Responsable : qa (Q). Clics Chrome : team-lead. Contrôles curl et lecture du JS/HTML déployé : qa.

## A. Parcours de démo (obligatoire)

| # | Étape | Résultat attendu |
|---|---|---|
| 1 | Ouvrir l'accueil | Titre « Maillage », 3 rôles (Commerçant, Organisme, Citoyen), bouton « Visite guidée », mention « Démo simulée » visible |
| 2 | Choisir « Commerçant » | Écran Besoin : « Votre profil : Café Le Petit Détour », zone de texte, deux rangées de puces « J'offre » et « Je cherche », puis « Quand » |
| 3 | Taper : « On a un espace libre le jeudi soir et on aimerait attirer du monde » | Allumés : J'offre : Espace intérieur ; Je cherche : Public ; Quand : Semaine, soir |
| 4 | Appuyer sur « Trouver des partenaires » | Première proposition : « Exposition collaborative chez Café Le Petit Détour », Compatibilité 87 %, avec Camille Vézina et Collectif Les Voisins en Scène |
| 5 | Lire la proposition | 3 épingles sur la carte, « Pourquoi cette suggestion » (raisons) et « À confirmer » visibles |
| 6 | Appuyer sur « Ça m'intéresse » | Statut : en attente, mention « Démo simulée » |
| 7 | Attendre le 2e changement | Statut : « Projet confirmé (simulé) » (deux changements en tout) |
| 8 | Retour accueil, « Visite guidée » | Lecture automatique d'environ 47 s, sans clic, qui se termine sur « Maillage : les ressources du quartier, enfin connectées » |

## B. Contrôles transversaux

| # | Contrôle | Résultat attendu |
|---|---|---|
| 9 | iPhone Safari, largeur 390 px | Pas de défilement horizontal, texte lisible (16 px ou plus pour le corps), parcours A complet |
| 10 | Android Chrome (~360 à 412 px) | Idem |
| 11 | Boutons et zones tactiles | Au moins 44 x 44 px |
| 12 | Portable (1280 px ou plus, miroir) | Mise en page propre, carte et panneau visibles sans défilement parasite |
| 13 | Console du navigateur | Aucune erreur (avertissements tolérés) |
| 14 | Carte | Attribution (OpenFreeMap / OpenStreetMap et jeux de données de la Ville) visible sur tout écran avec carte |
| 15 | Hors ligne approximatif : charger, puis couper le Wi-Fi | La visite guidée fonctionne jusqu'au bout (données locales, tuiles déjà vues) |
| 16 | Temps de chargement, Wi-Fi | Accueil interactif en moins de 3 s |
| 17 | Aucune donnée personnelle ni clé dans le JS déployé | Aucune clé, aucun nom réel, profils non réclamés cachés |
| 18 | Page labo : ouvrir /labo/ | Le modèle se charge (environ 130 Mo au premier chargement, barre de progression), puis le statut affiche « Prêt. Le modèle tourne sur votre appareil. » |
| 19 | Scénario de sécurité (rôle Organisme) | Non reproductible dans l'interface : l'organisme est le demandeur de l'histoire. Couvert par le test du moteur `src/engine/donnees-reelles.test.ts` (`npm test`). |

## C. Contrôles qa (curl et lecture du code déployé)

| # | Contrôle | Commande |
|---|---|---|
| C1 | HTTP 200, temps | `curl -s -o /dev/null -w "%{http_code} %{time_total}s %{size_download}B\n" URL` |
| C2 | HTML : titre, lang="fr", meta viewport | `curl -s URL` |
| C3 | Les bundles /assets/*.js répondent 200 | extraire les chemins du HTML puis `curl -I` |
| C4 | JS contient les chaînes : « Maillage », « Visite guidée », « Démo simulée », « Trouver des partenaires », « Ça m'intéresse », « Projet confirmé » | `curl -s URL/assets/x.js \| grep -c "chaîne"` |
| C5 | /data/profils.json, lieux.json, evenements.json, quartier.geojson répondent 200 et JSON valide | `curl -s ... \| node -e` |
| C6 | Aucune clé : pas de motif `sk-`, `eyJ`, `service_role` dans le JS | `grep -E` |

## D. Résultats par passage

Remplir une ligne par passage. P = réussi, F = échec, - = non testé.

| Heure | Commit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | C1-C6 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-15, qa (curl), eba2680 | eba2680 | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | - | P | - | P | 16 non validé: accueil 200 (0,21 s puis 0,08 s; première requête à froid 3,7 s), bundle 1,3 Mo. Chaînes présentes dans le JS : Maillage, Visite guidée, Démo simulée, Trouver des partenaires, Ça m'intéresse, Projet confirmé, Votre profil, J'offre, Je cherche, Quand, Exposition collaborative, Compatibilité, « enfin connectées ». /data : profils 47, lieux 38, evenements 16, quartier.geojson 200 et valides. Attribution OpenFreeMap/OpenStreetMap dans le JS (14 vu en code seulement). Aucune clé. /labo/ 200, contient « Prêt » (18 vu en code seulement, modèle non chargé). Étapes cliquées (1 à 8, 9 à 13, 15) : à faire par team-lead. |
