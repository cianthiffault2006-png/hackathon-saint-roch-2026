# Diapositives Maillage (8 diapos, 5 min)

Ce fichier est la source de `build_pptx.py` (`py -3.12 docs/pitch/build_pptx.py` produit `Maillage.pptx`). Format de chaque diapo : « Ligne » = message principal, « Diapo » = puces courtes séparées par des points-virgules, tout le reste va dans les notes du présentateur. Captures d’écran : `img/slide-<n>.png`. Peu de texte par diapo, grosse police, une idée à la fois. Aucun vrai nom de commerce ou de personne.

## 1. Maillage
Ligne : « Un café, une artiste, un organisme : un projet. »
Visuel : logo, carte de Saint-Roch, trois points qui se relient.
Signal [COÉQUIPIÈRE] : lancer l’accroche, ne pas lire la diapo. (10 s)

## 2. Le problème
Ligne : « Les ressources de Saint-Roch sont là, mais les voisins ne se connaissent pas. »
Visuel : trois icônes isolées (café, artiste, organisme) à cinq minutes à pied.
Signal [COÉQUIPIÈRE] : histoire de Mathieu (Café Le Petit Détour), de Camille Vézina et du Collectif Les Voisins en Scène. Finir par « Personne ne sait que les autres existent. » (40 s)

## 3. La solution : Maillage
Ligne : « Les autres apps informent; Maillage fait collaborer : trois partenaires complémentaires, un projet concret. »
Visuel : capture de l’écran de proposition. Message de fond : une app mobile qui propose des projets à trois partenaires, sur la carte, avec les raisons.
Signal [CIAN] : « Voici Maillage », puis passer au téléphone pour la démo. (1 min 45 s avec la démo)

## 4. Ce que la démo montre
Ligne : « Commerçant, besoin, proposition à trois (87 %), Ça m’intéresse, projet confirmé (simulé). »
Diapo : Commerçant ; Besoin ; Proposition à trois ; Ça m’intéresse ; Confirmé (simulé)
Visuel : les 5 étapes en frise, badge « Démo simulée ».
Signal [CIAN] : à garder à l’écran si l’app plante, puis lancer la vidéo de secours. (peut être sautée si le temps manque)

## 5. Technologies, outils et données utilisés
Ligne : « Une app web légère, des données ouvertes, des profils protégés. »
Diapo : Vite, React, TypeScript, MapLibre ; OpenFreeMap, OpenStreetMap, Vercel, GitHub, Claude Code ; Données Québec ouvertes, fichiers de la Ville : structure seulement
Contenu en trois colonnes :
- Technologies : Vite, React, TypeScript, MapLibre GL JS.
- Outils et plateformes : OpenFreeMap et OpenStreetMap (fond de carte), Vercel (hébergement), GitHub (code), Claude Code comme assistant de développement.
- Données : Données Québec, données ouvertes (licence indiquée dans l’app, à reprendre exactement de chaque jeu de données). Fichiers confidentiels de la Ville : utilisés pour leur structure seulement, remplacés par des lignes fictives dans la démo.
Signal [CIAN] : trois idées seulement : profils cachés tant que non réclamés, fichiers confidentiels non publiés, structure prête pour la Ville. Dire : « Nos profils et nos règles s’appuient sur les colonnes des répertoires de la Ville et sur le Plan d’action Saint-Roch. » (35 s)

## 6. Transparence : un moteur de règles, l’IA en phase 2
Ligne : « On l’a testé, on a choisi des règles pour que chaque suggestion s’explique. »
Diapo : Règles visibles ; Score pondéré visible ; Phase 2 : l’IA lit la demande libre
Visuel : une carte de proposition avec « Pourquoi cette suggestion » et « À confirmer » surlignés; en bas, en petit : « Chaque suggestion s’explique, sans boîte noire. » Notes du test d’IA (pas sur la diapo, à voix haute seulement si on veut) : « Modèle multilingue dans le navigateur, gratuit, texte sur l’appareil (page /labo/) : 69 s au premier chargement (129 Mo), 13 s ensuite, 0,3 à 0,6 s par phrase. Trouve des profils semblables, pas complémentaires. » 
Signal [COÉQUIPIÈRE] : verdict d’abord : on l’a testé, on a choisi des règles pour que chaque suggestion s’explique. Chiffres du test seulement si le jury demande. (45 s)

## 7. Impact et feuille de route
Ligne : « Un pilote avec la SDC, puis tout Saint-Roch. »
Diapo : Maintenant : démo simulée ; Pilote : chaque partenaire reçoit l’invitation et accepte ; Plus tard : IA, autres quartiers
Feuille de route en trois temps :
- Maintenant : démo avec profils fictifs et données ouvertes.
- Ensuite : pilote avec la SDC, profils réclamés par leurs propriétaires, vraies notifications.
- Plus tard : modèle de langage pour lire les demandes, autres quartiers.
Mesures : projets confirmés, nouveaux partenariats, fréquentation des événements créés.
Signal [CIAN] : coût : « Hébergement gratuit pour un projet pilote, et une personne à temps partiel à la SDC pour l’accueil et la modération. » Dans la démo aucun message ne part; en pilote, la boucle complète est ce qu’on ajoute. (40 s)

## 8. Conclusion
Ligne : « Saint-Roch a déjà tout ce qu’il faut. Maillage aide ses voisins à se trouver. »
Visuel : la carte, les trois points reliés, l’adresse de l’app (code QR).
Pied de page : « Équipe 14 · Outils d’IA : Claude Code et Claude (code, scripts de données, brouillons de textes). Fait par l’équipe : cadrage du problème, choix de données, conception, tests, présentation. »
Signal [COÉQUIPIÈRE] : phrase finale, « Merci! », attendre les questions. (15 s)

## Rappels pour la mise en page
- Fond clair, contraste fort, police de 28 points et plus.
- Attribution des données et de la carte sur toute diapo qui montre la carte ou des données.
- Exporter en PDF vendredi à 12 h 30, copie sur un deuxième portable et sur une clé USB.
