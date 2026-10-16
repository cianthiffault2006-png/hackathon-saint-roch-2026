# Diapositives Maillage (7 diapos, 5 min)

Ce fichier est la source de `build_pptx.py` (`py -3.12 docs/pitch/build_pptx.py` produit `Maillage.pptx`). Format de chaque diapo : « Ligne » = message principal, « Diapo » = puces courtes séparées par des points-virgules, tout le reste va dans les notes du présentateur. Captures d’écran : `img/slide-<n>.png`. Peu de texte par diapo, grosse police, une idée à la fois. Aucun vrai nom de commerce ou de personne.

## 1. Maillage
Ligne : « Un café, une artiste, un organisme : un projet. »
Visuel : logo, carte de Saint-Roch, trois points qui se relient.
Signal [COÉQUIPIÈRE] : lancer l’accroche, ne pas lire la diapo. (10 s)

## 2. Le problème
Ligne : « Les initiatives existent. Ce qui manque, c’est le réseau qui les relie. »
Diapo : Un café ; Une artiste ; Un organisme ; Ce qu’on a entendu hier : les initiatives existent, le réseau manque.
Citation réelle, seulement si on en a une : remplacer la quatrième carte par « [CITATION RÉELLE ICI, sinon laisser la carte de repli] » avant l’export PDF de 12 h 30. Jamais de crochets sur une diapo projetée.
Visuel : trois icônes isolées (café, artiste, organisme) à cinq minutes à pied.
Carte « Ce qu’on a entendu » : par défaut la phrase de repli, vraie sans rien ajouter (dite jeudi 15 octobre par l’intervenant qui présentait le quartier); si un commerçant rencontré vendredi matin a donné une vraie citation, elle la remplace, telle quelle, sans nom si la personne ne l’a pas permis. Ne jamais inventer une citation.
Signal [COÉQUIPIÈRE] : histoire de Mathieu (Café Le Petit Détour), de Camille Vézina et du Collectif Les Voisins en Scène. Finir par « Personne ne sait que les deux autres existent. » (30 s)

## 3. La solution : Maillage
Ligne : « Maillage ne remplace aucun outil existant : il crée le lien qui manque. »
Visuel : capture de l’écran de proposition. Couleurs (notes) : le vert profond rassure et ancre l’app dans le quartier, l’orange invite à agir; chaque couleur respecte les contrastes d’accessibilité et les épingles combinent forme, icône et couleur pour les personnes daltoniennes (environ 8 % des hommes). Phrase complète à dire : « Maillage ne remplace aucun outil existant : il crée le lien qui manque entre ceux qui ont des ressources et ceux qui ont des projets. » Message de fond : une app mobile qui propose des projets à trois partenaires, sur la carte, avec les raisons.
Signal [CIAN] : « Voyons comment ça marche », puis passer à l’app : coller la phrase « On a un espace libre le jeudi soir et on cherche des artistes pour l’animer », 87 % avec Camille Vézina et le Collectif Les Voisins en Scène, dire la réciprocité, toucher « Comment ce score » et dire la ligne « Réciprocité 58 % », puis « Voir ce que Camille reçoit » et « Accepter ». Si l’app plante : Visite guidée, chapitres 1 à 4 seulement (environ 73 s; la visite complète dure 2 min), puis « Quitter la visite ». (1 min 45 s avec la démo)

## 4. Technologies, outils et données utilisés
Ligne : « Personne ne commence avec une page blanche. »
Diapo : React, Vite, TypeScript, MapLibre, GitHub Pages, Claude Code ; 386 membres (fichier fourni par la SDC) ; 614 organismes reconnus (toute la ville) ; Données Québec, CC BY 4.0 ; Loi 25 : publique après consentement
Contenu en trois colonnes :
- Technologies : Vite, React, TypeScript, MapLibre GL JS.
- Outils et plateformes : OpenFreeMap et OpenStreetMap (fond de carte), GitHub Pages (hébergement; Vercel en secours), GitHub (code), Claude Code comme assistant de développement.
- Données : Données Québec, données ouvertes de la Ville de Québec et du SIT Québec (CC BY 4.0, attribution dans l’app). Fichiers fournis confidentiels : structure et nombre de lignes seulement, remplacés par des profils fictifs dans la démo. Les nombres sont des totaux de lignes : « les 386 membres du fichier fourni par la SDC », « 614 organismes reconnus à l’échelle de la ville » (jamais « dans Saint-Roch » pour un fichier de toute la ville).
Signal [CIAN] : dire « Maillage part des répertoires qui existent déjà : les 386 membres du fichier fourni par la SDC, et 614 organismes reconnus à l’échelle de la ville. Personne ne commence avec une page blanche. » Puis la Loi 25 : « Pour la Loi 25, le consentement décide. Ces répertoires pré-remplissent les fiches. Une fiche devient publique seulement après réclamation, avec un code et un consentement; en pilote, une fiche non réclamée n’est visible que par la SDC. Le code part à l’adresse que la SDC ou la Ville a déjà au dossier, jamais à celle qu’on tape. Dans cette démo, les fiches pré-remplies sont fictives et marquées. Les personnes, elles, ne sont jamais pré-remplies. » (Dans la démo, les neuf fiches pré-remplies fictives restent visibles sur la carte, voulu, avec l’étiquette « Pré-rempli · visible ici pour la démo », sans coordonnées : la règle du pilote n’est pas codée; ne pas dire le contraire.) Nos règles s’appuient aussi sur le Plan d’action Saint-Roch. (42 s)

## 5. Transparence : un moteur de règles, l’IA en phase 2
Ligne : « On l’a testée, on a choisi des règles pour que chaque suggestion s’explique. »
Diapo : Règles visibles ; Score pondéré visible ; IA phase 2 : toutes les langues, toutes les fautes
Visuel : une carte de proposition avec « Pourquoi cette suggestion » et « À confirmer » surlignés; en bas, en petit : « Chaque suggestion s’explique. » Notes du test d’IA (pas sur la diapo, à voix haute seulement si on veut) : « Modèle multilingue dans le navigateur, gratuit, texte sur l’appareil (page /labo/) : 69 s au premier chargement (129 Mo), 13 s ensuite, 0,3 à 0,6 s par phrase. Trouve des profils semblables, pas complémentaires. » Ce modèle (paraphrase-multilingual-MiniLM) est multilingue. Déjà dans l’app : tolérance aux fautes, aux accents oubliés et à quelques mots d’anglais. Pas d’IA payante aujourd’hui; en phase 2, celui qui déploie la paie. 
Signal [COÉQUIPIÈRE] : verdict d’abord : on l’a testée, on a choisi des règles pour que chaque suggestion s’explique. Chiffres du test seulement si le jury demande. (20 s)

## 6. Impact et feuille de route
Ligne : « Un pilote avec la SDC, puis tout Saint-Roch. »
Diapo : Maintenant : démo simulée, fil en direct en option (Canada) ; Pilote : vraie invitation, fil partagé modéré par la SDC ; Plus tard : IA, autres quartiers ; Ce qu’on demande à la SDC : dix membres volontaires, un trimestre, une personne à temps partiel; trois mesures
Feuille de route en trois temps :
- Maintenant : démo avec profils fictifs et données ouvertes.
- Ensuite : pilote avec la SDC, profils activés par leurs propriétaires, vraies notifications, fil de projet sur une table gratuite derrière le même écran, modérée par la SDC.
- Plus tard : modèle de langage pour lire les demandes, autres quartiers.
Mesures : projets confirmés, nouveaux partenariats, fréquentation des événements créés.
Signal [CIAN] : portée : « Maillage règle un problème précis : trouver le bon partenaire, se mettre d’accord et passer à l’action. On s’arrête là où d’autres outils existent : 311, 911, financement. » Puis le fil et la modération, une seule fois : « Le fil de la démo est simulé; un vrai fil partagé existe déjà en option, hébergé au Canada. Le tableau de modération pour la SDC est prévu, pas construit. » Puis la demande de pilote : « Ce qu’on demande à la SDC : dix membres volontaires, un trimestre, une personne à temps partiel et un export du fichier des membres. On mesure trois chiffres, et on décide ensemble si on étend. » (45 s)
Histoire 2 (en direct seulement si le temps le permet, voir script-fr.md, démo étape 6 : Accueil, Proposer un projet, Exemple, Avant de commencer) : Sofia, résidente de la rue Saint-Joseph, corvée le samedi 24 octobre de 13 h à 17 h, voit des graffitis et des déchets; Maillage lui propose une « Corvée de propreté avec Équipe Propreté du Faubourg », des bénévoles et un café du coin, avec la liste « autorisation du propriétaire, 311 pour la voie publique ». Noms fictifs.
À ajouter à la feuille de route seulement si non démontré en direct : Explorer le quartier, profils publics, fil de projet, projets ouverts.

## 7. Conclusion
Ligne : « Saint-Roch a déjà tout ce qu’il faut. Maillage aide ses voisins à se trouver. »
Diapo : cianthiffault2006-png.github.io/hackathon-saint-roch-2026 ; Outils d’IA : Claude Code et Claude; fait par l’équipe : cadrage, données, conception, tests, présentation
Visuel : la carte, les trois points reliés, code QR vers https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/ (lien officiel, GitHub Pages). Ne pas mettre le lien Vercel : il est figé sur une ancienne version.
Pied de page : « Équipe 14 · Outils d’IA : Claude Code et Claude (code, scripts de données, brouillons de textes). Fait par l’équipe : cadrage du problème, choix de données, conception, tests, présentation. »
Signal [COÉQUIPIÈRE] : phrase finale, « Merci! », attendre les questions. (15 s)

## Rappels pour la mise en page
- Fond clair, contraste fort, police de 28 points et plus.
- Attribution des données et de la carte sur toute diapo qui montre la carte ou des données.
- Exporter en PDF vendredi à 12 h 30, copie sur un deuxième portable et sur une clé USB.
