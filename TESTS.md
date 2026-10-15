# TESTS.md : Maillage, parcours de démo

Production (lien officiel, GitHub Pages) : https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/
Secours : https://hackathon-saint-roch-2026.vercel.app (figé sur une ancienne version sans Explorer, fil ni « Proposer un projet »; peut être périmé).
Responsable : qa (Q). Clics Chrome : team-lead. Contrôles curl et lecture du JS/HTML déployé : qa.

## A. Parcours de démo (obligatoire)

Avant chaque passage sur le téléphone de démo : vider les données du site (réglages du navigateur), puis recharger l’accueil.

| # | Étape | Résultat attendu |
|---|---|---|
| 1 | Ouvrir l’accueil | Titre « Maillage », 3 rôles (Commerçant, Organisme, Citoyen), bouton « Visite guidée », mention « Démo simulée » visible |
| 2 | Choisir « Commerçant » | Écran Besoin : « Votre profil : Café Le Petit Détour », zone de texte, deux rangées de puces « J’offre » et « Je cherche », puis « Quand » |
| 3 | Coller : « On a un espace libre le jeudi soir et on cherche des artistes pour l’animer » | Allumés : J’offre : Espace intérieur; Je cherche : Animation; Quand : Semaine, soir |
| 4 | Appuyer sur « Trouver des partenaires » | Première proposition : « Exposition collaborative au Café Le Petit Détour », Compatibilité 87 %, avec Camille Vézina et Collectif Les Voisins en Scène |
| 5 | Lire la proposition | 3 épingles sur la carte, « Pourquoi cette suggestion » (raisons) et « À confirmer » visibles |
| 6 | Appuyer sur « Ça m’intéresse » | Statut : en attente, mention « Démo simulée », lien « Voir ce que Camille reçoit » (l’attente passe seule à « Projet confirmé » en quelques secondes : cliquer sans tarder) |
| 7 | Toucher « Voir ce que Camille reçoit », puis « Accepter » | Invitation de Camille (jeudi 22 octobre, 19 h à 22 h), puis statut « Projet confirmé (simulé) » |
| 8 | Retour accueil, « Visite guidée » | Lecture automatique de 2 min en 7 chapitres (mesuré le 15 oct. à 15:44 : environ 120 s), puis « Continuer la visite » (suite de 69 s), sans clic, qui se termine sur « Maillage : les ressources du quartier, enfin connectées » |

## B. Contrôles transversaux

| # | Contrôle | Résultat attendu |
|---|---|---|
| 9 | iPhone Safari, largeur 390 px | Pas de défilement horizontal, texte lisible (16 px ou plus pour le corps), parcours A complet |
| 10 | Android Chrome (~360 à 412 px) | Idem |
| 11 | Boutons et zones tactiles | Au moins 44 x 44 px |
| 12 | Portable (1280 px ou plus, miroir) | Mise en page propre, carte et panneau visibles sans défilement parasite |
| 13 | Console du navigateur | Aucune erreur (avertissements tolérés) |
| 14 | Carte | Attribution (OpenFreeMap / OpenStreetMap et jeux de données de la Ville) visible sur tout écran avec carte |
| 15 | Hors ligne approximatif : charger, puis couper le Wi-Fi | La visite guidée fonctionne jusqu’au bout (données locales, tuiles déjà vues) |
| 16 | Temps de chargement, Wi-Fi | Accueil interactif en moins de 3 s |
| 17 | Aucune donnée personnelle ni clé dans le JS déployé | Aucune clé, aucun nom réel, profils non réclamés cachés |
| 18 | Page labo : ouvrir /labo/ | Le modèle se charge (environ 130 Mo au premier chargement, barre de progression), puis le statut affiche « Prêt. Le modèle tourne sur votre appareil. » |
| 19 | Scénario de sécurité (rôle Organisme) | Non reproductible dans l’interface : l’organisme est le demandeur de l’histoire. Couvert par le test du moteur `src/engine/donnees-reelles.test.ts` (`npm test`). |

## C. Contrôles qa (curl et lecture du code déployé)

| # | Contrôle | Commande |
|---|---|---|
| C1 | HTTP 200, temps | `curl -s -o /dev/null -w "%{http_code} %{time_total}s %{size_download}B\n" URL` |
| C2 | HTML : titre, lang="fr", meta viewport | `curl -s URL` |
| C3 | Les bundles /assets/*.js répondent 200 | extraire les chemins du HTML puis `curl -I` |
| C4 | JS contient les chaînes : « Maillage », « Visite guidée », « Démo simulée », « Trouver des partenaires », « Ça m’intéresse », « Projet confirmé » | `curl -s URL/assets/x.js \| grep -c "chaîne"` |
| C5 | /data/profils.json, lieux.json, evenements.json, quartier.geojson répondent 200 et JSON valide | `curl -s ... \| node -e` |
| C6 | Aucune clé : pas de motif `sk-`, `eyJ`, `service_role` dans le JS | `grep -E` |

## D. Résultats par passage

Remplir une ligne par passage. P = réussi, F = échec, - = non testé.

| Heure | Commit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | C1-C6 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-15, qa (curl), eba2680 | eba2680 | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | - | P | - | P | 16 non validé: accueil 200 (0,21 s puis 0,08 s; première requête à froid 3,7 s), bundle 1,3 Mo. Chaînes présentes dans le JS : Maillage, Visite guidée, Démo simulée, Trouver des partenaires, Ça m’intéresse, Projet confirmé, Votre profil, J’offre, Je cherche, Quand, Exposition collaborative, Compatibilité, « enfin connectées ». /data : profils 47, lieux 38, evenements 16, quartier.geojson 200 et valides. Attribution OpenFreeMap/OpenStreetMap dans le JS (14 vu en code seulement). Aucune clé. /labo/ 200, contient « Prêt » (18 vu en code seulement, modèle non chargé). Étapes cliquées (1 à 8, 9 à 13, 15) : à faire par team-lead. |
| 2026-10-15 14:35, qa (Chrome, GitHub Pages) | d90a250 | P | P | F | F | P | P | P | P | - | - | - | P | P | P | - | P | - | - | - | Fenêtre 767 px, stockage vidé. 3: puces « Semaine, jour » ET « Semaine, soir » allumées (attendu: soir seul), reproduit 3 fois. 4: Compatibilité 83 % au lieu de 87 %. 5: épingles apparaissent 1 à 3 s après l’ouverture. 7: invitation puis Accepter, confirmé. Ajouter au calendrier: .ics valide (22 oct 19:00-22:00). 8: se termine sur « enfin connectées », durée 70 à 80 s. 13: aucune erreur de l’app (seulement avertissements Grammarly). 12: pas de défilement horizontal, corps 16 px, aucun bouton sous 44 px (accueil). 390 px, Android, hors ligne, /labo non testés. |
| 2026-10-15 15:20, qa (Chrome, GitHub Pages) | e63025c | P | P | P | P | P | P | P | - | P | - | - | P | - | - | - | - | - | - | - | Fenêtre réelle 767 px (viewport fixé par l’outil); mises en page 390, 899, 1000, 1279 et 1300 testées dans un iframe de cette largeur (mêmes media queries). 3: soir seul; si « Semaine, jour » est touchée à la main puis la phrase tapée, les deux restent allumées. 4: 87 %. 6-7: lien Camille visible environ 2 s après le clic, Accepter, confirmé. Bureau: barre latérale dès 900 px (masquée à 899); Mes projets: liste + fiche + fil côte à côte à 1300, fiche + fil à 1000 et 1279 (liste masquée), aucun débordement. 390 px: aucun défilement horizontal, aucun bouton sous 44 px (sauf liens d’attribution de la carte, 20 px de haut). Titres: « Soirée spectacle au Centre Materia » (lieu), « chez » pour les commerces. Tableau de bord: lien sur l’accueil OK, page affichée; Sources OK. 8, 13: non testés ce passage (console non suivie). |
| 2026-10-15 15:35, qa (Chrome, GitHub Pages) | 8bd2bea | P | P | P | P | P | P | P | P | - | - | - | - | - | - | - | - | - | - | - | Fenêtre 767 px, stockage vidé. 1-7: titre « Exposition collaborative au Café Le Petit Détour », 87 %. 8 (visite v2, 7 chapitres): 2 passages complets, carte de fin « Maillage : les ressources du quartier, enfin connectées » restant jusqu’à « Quitter la visite »; durée mesurée 2:00 (120 s avec une pause de 6 s) et 2:20 en intervenant; Pause figée (seul le libellé passe à Reprendre), points de chapitre, Précédent, Suivant et clic sur la barre de progression arrière OK; épingles stables (6 marqueurs sans clignotement dans un chapitre); 4 messages un à un dans le fil (environ 1 à 3 s d’écart). Anomalie non reproduite: au 1er passage (après la pause) la visite est repartie du chapitre 6 au 5 puis a quitté vers l’accueil sans carte de fin. Réclamer: chemin lien (code de démo affiché 482 913, modifications conservées, consentement, « Profil activé (simulé) » + badge « Membre SDC »), Réinitialiser la démo rétablit « Profil pré-rempli »; chemin sans lien: « Demande en cours ». Fil en direct: projet créé avec titre personnalisé, bascule, nom, message affiché; ouvert via #fil dans un 2e onglet (même navigateur donc même appareil): message visible, réponse envoyée et visible dans le 1er onglet, délai « prochain message dans 6 s »; le fil du café démo n’offre pas la bascule. |
| 2026-10-15 15:44, qa (Chrome, GitHub Pages) | c9a15c9 | P | P | P | P | P | P | P | P | - | - | - | - | - | - | - | - | - | - | - | Fenêtre 767 px, stockage vidé, nouveau look (point de maille). 1-7: « Exposition collaborative au Café Le Petit Détour », 87 %, 6 marqueurs, invitation + Accepter, projet confirmé. 8: visite 7 chapitres avec pause de 6 s au chapitre 3 puis reprise: sans retour en arrière ni sortie anticipée, carte de fin à environ 120 s avec « Continuer la visite » / « Quitter la visite » / « Précédent ». Suite (5 chapitres, 69 s: corvée de Sofia 74 % avec Équipe Propreté du Faubourg et Malik A., Explorer le quartier, profil public, projet ouvert, Pour la SDC), pause de 5 s au chapitre 2 puis reprise: chapitres 1 à 5 dans l’ordre, aucune régression, carte de fin finale. Accueil: tous les liens présents (3 rôles, Visite guidée, Explorer, Proposer, Tableau de bord, Réclamez votre fiche, Tableau SDC, Sources), pas de défilement horizontal; le tampon « Démo simulée » (fixe) recouvre une partie du texte quand on défile. Tableau SDC: indicateurs 120/40/31/9, types de projets, 9 profils pré-remplis, étiquette « données fictives de pilote », aucun chevauchement. Sur la carte de la suite (Explorer / Sofia) des étiquettes se chevauchent à 767 px. Le texte du tampon est en majuscules via CSS (innerText: « DÉMO SIMULÉE »), les contrôles automatiques doivent ignorer la casse. |
