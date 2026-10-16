# Plan d’écran du pitch (projecteur, clics, replis)

Vendredi 16 octobre, 14 h 30. Ce fichier dit, seconde par seconde, qui parle, ce que le jury voit, qui clique, et quoi faire si l’étape rate. Le texte dit mot pour mot est dans `script-fr.md` (lignes `>`); ici il est repris en abrégé. Minutage de référence : 150 mots par minute, total visé 4:32, 4:45 au plus (voir le décompte de `script-fr.md`, produit par `node docs/pitch/compter.mjs`).

## Réglage du portable (fait à 14:00 sur le projecteur de la salle, liste complète dans `docs/DEMO-SCRIPT.md`)

- Écran en miroir, pas étendu. Deux fenêtres ouvertes et rien d’autre : le PDF des diapos (lecteur PDF en plein écran, 7 pages) et Chrome. Alt+Tab alterne alors toujours entre les deux : c’est le seul raccourci utilisé.
- Chrome : deux onglets, l’app (accueil chargé, données du site vidées avant) et la vidéo de secours (en pause à 0:00, son coupé). Aucun autre onglet, aucune extension visible, barre de favoris cachée (Ctrl+Maj+B), notifications coupées.
- Disposition téléphone, pas bureau : l’app passe en disposition bureau (barre latérale, trois colonnes) à partir de 900 px CSS de large, et le script dit « toucher ». Règle : largeur de la fenêtre en pixels divisée par le zoom = largeur CSS, à garder entre 700 et 850 (la largeur testée le 15 octobre est 767). Sur un projecteur 1920 × 1080 : fenêtre d’environ 1150 px de large, pleine hauteur, centrée, zoom 150 % (Ctrl et +). Sur un projecteur 1280 × 720 : fenêtre d’environ 900 px, zoom 125 %. Vérification : pas de barre latérale, les trois rôles empilés sur l’accueil, le bouton « Trouver des partenaires » visible sans défiler après le collage. Si le bas de la feuille est coupé (bouton « Ça m’intéresse » invisible) : un cran de zoom en moins (Ctrl et -).
- Si le projecteur impose une fenêtre large (disposition bureau malgré tout) : Cian dit « cliquer » au lieu de « toucher » et suit la barre latérale; le contenu et l’ordre sont les mêmes.
- Phrase de démo dans le presse-papiers, recopiée à 14:00 : « On a un espace libre le jeudi soir et on cherche des artistes pour l’animer ». Ne rien copier d’autre ensuite.
- Qui clique : Cian, pour tout (diapos et app), le portable devant lui. Il change de diapo sur le dernier mot de la coéquipière, jamais avant. Q chronomètre depuis la salle et fait les signes de main (1 doigt à 2:15 si la démo n’est pas finie; 1 doigt à 4:00; 2 doigts à 4:30).

## Partie 1. Accroche, quoi, qui (0:00 à 0:18) [COÉQUIPIÈRE]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 0:00 | Coéquipière : « Un café, une artiste, un organisme : voisins, et ils ne se connaissent pas. » | Diapo 1 (logo, carte, trois points reliés) | Rien; la diapo 1 est déjà affichée avant que le jury ne nous donne la parole | Si le projecteur ne montre rien : la coéquipière commence quand même, Cian règle en silence; la diapo 1 n’apporte rien que la voix ne dise |
| 0:07 | « Maillage, c’est l’app qui propose à ces trois-là un projet commun. Hier on nous a dit : les initiatives existent, le réseau manque. Nous sommes quatre étudiants, équipe 14. » | Diapo 1 | Rien | |

## Partie 2. Le problème (0:18 à 0:50) [COÉQUIPIÈRE]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 0:18 | Coéquipière : « À Saint-Roch, les ressources sont là… Ce qui manque, c’est de savoir qui a quoi, juste à côté. » | Diapo 2 (trois icônes isolées) | Page suivante sur « équipe 14 » | |
| 0:26 | « Mathieu, du Café Le Petit Détour… Camille Vézina… Le Collectif… Personne ne sait que les deux autres existent. » | Diapo 2 | Rien | |
| 0:44 | La carte « Ce qu’on a entendu » : la citation réelle, ou la phrase de repli « Ce qu’on a entendu hier, en une phrase : les initiatives existent, le réseau manque. » | Diapo 2, la carte du bas, une seule des deux puces (export PDF de 12 h 30) | Rien | Si la diapo porte encore les deux puces : dire la phrase de repli seulement |
| 0:48 | Coéquipière se tait; regard vers Cian | Diapo 3 (« Maillage ne remplace aucun outil existant : il crée le lien qui manque. ») | Page suivante sur « existent » | |

## Partie 3. La démo (0:50 à 2:35) [CIAN]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 0:50 | Cian : « Voyons comment ça marche. » | Diapo 3 (2 s), puis l’app, accueil | Alt+Tab vers Chrome pendant la phrase | Si l’onglet est sur la vidéo : Ctrl+1 (premier onglet) |
| 0:52 | « Je suis Mathieu, du café. » | Accueil, trois rôles; puis « Votre profil : Café Le Petit Détour » | Toucher « Commerçant » | Si un ancien état s’affiche (statut, fil, fiche réclamée) : ouvrir une fenêtre de navigation privée pré-chargée sur l’accueil (préparée à 14:00), continuer |
| 0:58 | « On a un espace libre le jeudi soir et on cherche des artistes pour l’animer. » (lu pendant le collage) | Zone de texte; les puces s’allument : Espace intérieur, Animation, Semaine soir | Clic dans la zone de texte, Ctrl+V | Collage vide ou raté : toucher les trois puces à la main (Espace intérieur, Animation, Semaine soir); même résultat, même 87 %. Ou taper une phrase courte, la tolérance aux fautes existe |
| 1:06 | « Maillage lit la phrase et allume les bons choix. » | Puces allumées, bouton visible | Toucher « Trouver des partenaires » sur le mot « choix » | Bouton hors écran : défiler d’un coup vers le bas, ou Ctrl et - |
| 1:09 | Silence utile de 1 à 3 s : la feuille arrive (3,6 s mesurées), les épingles tombent | Carte, feuille « Exposition collaborative au Café Le Petit Détour », Compatibilité 87 % | Rien | Carte grise : la feuille est le contenu, lire les trois partenaires et continuer; si toujours grise à 1:20, plan B (ci-dessous) |
| 1:12 | « Avec Camille Vézina et le Collectif Les Voisins en Scène, à deux ou trois minutes à pied. Chacun y gagne : le café apporte son espace et sa clientèle, Camille ses toiles, le Collectif son public. » | Feuille : titre, 87 %, trois partenaires | Rien; la main ne cache pas l’écran | |
| 1:30 | « Chaque suggestion s’explique, et ce qu’on ne sait pas encore, on le dit. » | Défiler jusqu’à « Pourquoi cette suggestion » (cinq raisons), puis « À confirmer » | Défilement lent, un geste | |
| 1:38 | « Le score est une somme pondérée, visible. Réciprocité 58 % : le café comble une partie des besoins de ses deux partenaires, pas tout, et on le dit. » | Barres : Complémentarité 100, Réciprocité 58, Proximité 100, Créneau 100, Thème 67 | Toucher « Comment ce score » | Si la section ne s’ouvre pas : dire la ligne quand même, les pourcentages sont dans la phrase |
| 1:52 | (rien pendant 2 s) | Statut « En attente des partenaires », lien « Voir ce que Camille reçoit » | Toucher « Ça m’intéresse », puis le lien dans les 2 s (il disparaît quand l’attente se confirme seule) | Lien déjà disparu, statut « Projet confirmé (simulé) » : dire « La réponse de Camille est simulée ici; en pilote elle reçoit l’invitation », ouvrir la Fiche (date, Ajouter au calendrier), reprendre à 2:12 |
| 1:56 | « Voici ce que Camille reçoit sur son téléphone : le projet, le jeudi 22 octobre, de 19 h à 22 h, et ce que chacun apporte. » | Invitation côté Camille : projet, date, « ce que chacun apporte » | Rien, puis toucher « Accepter » sur « apporte » | |
| 2:07 | « Elle accepte, et le projet est confirmé. Dans la démo, la réponse du Collectif est simulée et aucun message ne part; en pilote, chaque partenaire reçoit vraiment l’invitation. » | Retour sur la proposition, statut « Projet confirmé (simulé) » | Rien | |
| 2:20 | Seulement si le chrono est sous 2:15 à la fin de la ligne précédente (signe de Q sinon) : « Deuxième histoire : Sofia… le 311 s’occupe de ce qui relève de la Ville. » | Accueil, « Proposer un projet », « Exemple », écran « Avant de commencer » avec la ligne du 311 | Logo (accueil), « Proposer un projet », « Exemple » | Chrono au-dessus de 2:15 : sauter, passer à la diapo 4 |
| 2:33 | Cian : « D’où viennent les données? » (transition) | Diapo 4 | Alt+Tab vers le PDF (la diapo 4 est déjà la page courante : Cian a avancé le PDF à la page 4 avant de passer à Chrome à 0:50) | Si le PDF est resté à la page 3 : Page suivante, 1 s |

Plan B (déclencheur : l’app plante, ou la carte est encore grise à 1:20) : Cian touche le logo pour revenir à l’accueil, puis « Visite guidée ». La visite joue seule : chapitre 1 Ouverture (3 s), chapitre 2 Le besoin (15 s), chapitre 3 La proposition (34 s), chapitre 4 Côté partenaire (21 s), environ 73 s au total d’après les durées du script de la visite (à chronométrer une fois en répétition). Pendant la lecture, Cian dit les lignes de 1:12, 1:30, 1:38, 1:56 et 2:07 sur ce que la visite montre, sans refaire les clics et sans s’excuser. Dès que les points de chapitre passent au chapitre 5 « La fiche », toucher « Quitter la visite », puis Alt+Tab vers la diapo 4. La visite complète dure 2:00 (plus une suite de 69 s) : ne jamais la laisser aller au bout. Plan C (le site ne répond pas du tout, ou le plan B échoue) : Ctrl+2 (onglet vidéo), plein écran, lecture, une seule phrase « Notre connexion nous lâche, voici l’enregistrement de la même démo », puis les mêmes lignes sur la vidéo.

## Partie 4. Les données (2:35 à 3:17) [CIAN]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 2:35 | Cian : « Maillage part des répertoires qui existent déjà : les 386 membres du fichier fourni par la SDC, et 614 organismes reconnus à l’échelle de la ville. Personne ne commence avec une page blanche. » | Diapo 4 (Technologies, outils et données; 386, 614, CC BY 4.0, Loi 25) | Rien | Diapo absente : l’app en arrière-plan suffit, les deux nombres sont dans la phrase |
| 2:50 | « Pour la Loi 25, le consentement décide. Ces répertoires pré-remplissent les fiches. Une fiche devient publique seulement après réclamation, avec un code et un consentement; en pilote, une fiche non réclamée n’est visible que par la SDC. Le code part à l’adresse que la SDC ou la Ville a déjà au dossier, jamais à celle qu’on tape. Dans cette démo, les fiches pré-remplies sont fictives et marquées. Les personnes, elles, ne sont jamais pré-remplies. » | Diapo 4 | Rien | Ne jamais dire que la démo cache déjà les fiches non réclamées : elle les montre, voulu, étiquetées « Pré-rempli · visible ici pour la démo », sans coordonnées |

## Partie 5. Transparence et IA (3:17 à 3:35) [COÉQUIPIÈRE]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 3:17 | Coéquipière : « Où est l’IA? On l’a testée, et on a choisi des règles pour que chaque suggestion s’explique. » | Diapo 5 (Règles visibles; Score pondéré visible; IA phase 2) | Page suivante sur « pré-remplies » | |
| 3:25 | « L’app tolère déjà les fautes et un peu d’anglais; en phase 2, l’IA comprendra toutes les langues, toutes les fautes. L’app suggère, les personnes décident. » | Diapo 5 | Rien | Chiffres du labo seulement en questions (Q6, Q11, Q29) |

## Partie 6. Impact, pilote, faisabilité (3:35 à 4:20) [CIAN]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 3:35 | Cian : « L’impact : plus de projets communs, des commerces plus vivants, et une contribution possible au sentiment de sécurité. On le mesure : projets confirmés, nouveaux partenariats, fréquentation. » | Diapo 6 (Maintenant, Pilote, Plus tard; la demande à la SDC) | Page suivante sur « décident » | |
| 3:47 | « Maillage règle un problème précis : trouver le bon partenaire, se mettre d’accord et passer à l’action. On s’arrête là où d’autres outils existent : 311, 911, financement. » | Diapo 6 | Rien | |
| 3:59 | « Le fil de la démo est simulé; un vrai fil partagé existe déjà en option, hébergé au Canada. Le tableau de modération pour la SDC est prévu, pas construit. » | Diapo 6 | Rien | Une seule fois dans tout le pitch; en questions, Q9 |
| 4:08 | « Ce qu’on demande à la SDC : dix membres volontaires, un trimestre, une personne à temps partiel. On mesure trois chiffres, et on décide ensemble si on étend. » | Diapo 6, dernière puce (la demande) | Rien | Si Q montre 2 doigts (4:30 dépassé) : cette ligne reste, c’est la conclusion qui se raccourcit à « Merci! » |

## Partie 7. Conclusion (4:20 à 4:32) [COÉQUIPIÈRE]

| Temps | Qui parle, quoi (abrégé) | À l’écran | Cian clique | Si ça rate |
|---|---|---|---|---|
| 4:20 | Coéquipière : « Saint-Roch a déjà tout ce qu’il faut. Maillage aide simplement ses voisins à se trouver. Un café, une artiste, un organisme : un projet. Le lien est à l’écran, essayez-le. Merci! » | Diapo 7 (lien GitHub Pages et code QR, pied de page IA) | Page suivante sur « étend » | Diapo 7 absente : Alt+Tab vers l’app, accueil, le lien se dit à voix haute |
| 4:32 | Silence. Les quatre restent debout, face au jury, la diapo 7 reste affichée pendant les questions | Diapo 7 | Rien; pour une question qui demande l’écran (Q7, Q22), Alt+Tab vers l’app | |

## Pendant les questions (3 min)

- Une voix par réponse, 20 s au plus, répartition dans `qa-fr.md` (en-tête). La diapo 7 reste à l’écran; Cian ne touche l’app que si la question porte sur un écran précis (le score, une fiche pré-remplie, le Tableau SDC).
- Pour montrer une fiche pré-remplie (Q22) : Accueil, « Explorer le quartier », une épingle avec l’étiquette pré-rempli (par exemple « Salle Le Bémol »), et dire la phrase de consentement en deux moitiés.
- Pour montrer le score (Q7, Q23) : la proposition est toujours ouverte dans l’app si on n’a pas quitté; sinon refaire Commerçant, Ctrl+V, Trouver des partenaires (8 s).

## Moments sans parole à couvrir (pour que personne ne regarde ses pieds)

| Moment | Durée | Ce qu’on fait |
|---|---|---|
| Alt+Tab diapo 3 vers l’app (0:50) | 1 s | Couvert par « Voyons comment ça marche. » |
| Chargement de la proposition (1:09) | 1 à 4 s | Cian regarde l’écran, pas le jury; la première phrase part dès que le titre apparaît. Si plus de 4 s : « Le moteur compare les 49 profils de la démo » (vrai : public/data/profils.json) |
| Épingles qui tombent (1:12) | 1 à 3 s | Déjà couvert par « Avec Camille Vézina… » |
| Attente après « Ça m’intéresse » (1:52) | 2 s | Toucher le lien tout de suite, la phrase suivante part sur l’écran de Camille |
| Alt+Tab app vers diapo 4 (2:33) | 1 s | Couvert par « D’où viennent les données? » |
| Changements de diapo 4 à 7 | 0 s | Toujours sur le dernier mot de la phrase précédente, jamais pendant un silence |

## Minutage par partie (150 mots par minute, lignes dites seulement)

| Partie | Mots | Parole | Clics | Créneau |
|---|---|---|---|---|
| 1. Accroche, quoi, qui | 41 | 16 s | 0 | 0:00 à 0:18 |
| 2. Le problème | 77 | 31 s | 0 | 0:18 à 0:50 |
| 3. La démo (étapes 1 à 5) | 160 | 64 s | environ 40 s | 0:50 à 2:35 |
| 4. Les données | 106 | 42 s | 0 | 2:35 à 3:17 |
| 5. Transparence et IA | 42 | 17 s | 0 | 3:17 à 3:35 |
| 6. Impact, pilote, faisabilité | 107 | 43 s | 0 | 3:35 à 4:20 |
| 7. Conclusion | 30 | 12 s | 0 | 4:20 à 4:32 |
| Total | 563 | 3 min 45 s | environ 40 s | 4 min 32 s (calculé 4:25; 5:00 à 130 mots par minute) |

Ordre de coupe si la répétition dépasse 4:45 : l’étape Sofia (déjà optionnelle, 25 s), puis la ligne « Réciprocité 58 % » (8 s), puis « Le code part à l’adresse… » (7 s), jamais l’acceptation de Camille ni la demande de pilote.
