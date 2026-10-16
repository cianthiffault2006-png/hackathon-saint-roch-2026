# Pitch Maillage, version française (5 min + 3 min de questions)

Équipe 14, Hackathon étudiant 2026 Saint-Roch. Vendredi 16 octobre, 14 h 30. Structure du 16 octobre, 9 h 45 (Cian et sa coéquipière) : la démo est la visite guidée en vidéo dans la diapo, commentée en direct; l’app en direct n’est pas touchée pendant le pitch, elle reste dans l’onglet 2 pour les questions.
Deux voix : [COÉQUIPIÈRE] ouvre, présente la solution, pose les questions de la partie 6 et conclut; [CIAN] commente la vidéo côté café, fait les données et le pilote, répond aux questions de la partie 6. Les autres ne parlent pas, sauf aux questions.
Durée visée : 4 min 30 s à 150 mots par minute (débit normal à voix haute en français), 4 min 45 s au plus; arrêt ferme à 4 min 50 s. Décompte : dernière section. Plan d’écran : `ECRAN.md`. Diapos à monter par la coéquipière : `DIAPOS-POUR-COEQUIPIERE.md`. Antisèche par personne : `ANTISECHE.md`.

Convention : les lignes en citation (`>`) sont dites à voix haute, mot pour mot. Tout le reste est une consigne. Pas de tiret long dans le texte dit. [CONDITIONNEL] marque une ligne à dire seulement si la condition est vraie à 12 h 30.

Lien officiel de l’app (GitHub Pages) : https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/
Le lien Vercel est figé sur une ancienne version : secours seulement, peut être périmé.

| Partie | Voix | Début | Durée |
|---|---|---|---|
| 1. Le problème | COÉQUIPIÈRE | 0:00 | 25 s |
| 2. La solution : Maillage | COÉQUIPIÈRE | 0:25 | 25 s |
| 3. La démo (vidéo de la visite guidée) | CIAN, puis COÉQUIPIÈRE, puis CIAN | 0:50 | 1 min 33 s (durée de la vidéo) |
| 4. Données et technologie | CIAN | 2:23 | 51 s |
| 5. Impact, pilote, évolution | CIAN | 3:14 | 32 s |
| 6. Vous vous demandez peut-être… | COÉQUIPIÈRE demande, CIAN répond | 3:46 | 34 s |
| 7. Conclusion | COÉQUIPIÈRE | 4:20 | 8 s |
| Fin | | 4:28 | marge de 17 s avant 4:45 (4:26 calculé) |

---

## 1. Le problème (0:00 à 0:25) [COÉQUIPIÈRE]
Diapo 1 (le problème, tout de suite : trois icônes isolées, café, artiste, organisme).

> À Saint-Roch, les ressources sont là : des locaux, du talent, des bénévoles. Ce qui manque, c’est de savoir qui a quoi, juste à côté.
> Mathieu, du Café Le Petit Détour, a un espace libre le jeudi soir. Camille Vézina, artiste de la relève, cherche un mur. Le Collectif Les Voisins en Scène cherche un public. Ils sont voisins, et personne ne sait que les deux autres existent.
> Hier, en nous présentant le quartier, on nous a dit : les initiatives existent, le réseau manque.

(« Hier » : l’intervenant du hackathon qui présentait le quartier le jeudi 15 octobre; ne pas le nommer. Le mot à mot de cette phrase n’a pas d’écrit : Cian ou la coéquipière le confirment avant 12 h 30, sinon dire « on nous a dit, en résumé, que… ». Les prénoms de la démo sont fictifs. Ne jamais citer un vrai commerce ou une vraie personne sans permission; ne jamais inventer une citation.)

## 2. La solution : Maillage (0:25 à 0:50) [COÉQUIPIÈRE]
Diapo 2 (captures de l’app, téléphone et ordinateur côte à côte).

> Maillage, c’est l’app qui propose à ces trois-là un projet commun. On écrit son besoin en mots simples; Maillage propose trois partenaires complémentaires, à distance de marche, avec les raisons, et chacun accepte ou refuse. Elle ne remplace aucun outil existant : elle crée le lien qui manque. Testée sur téléphone et sur ordinateur. Nous sommes quatre étudiants, équipe 14.

(Dernier mot « équipe 14 » : Cian lance la vidéo de la diapo 3.)

## 3. La démo : la visite guidée en vidéo (0:50 à 2:23) [CIAN, puis COÉQUIPIÈRE, puis CIAN]
Diapo 3 : la vidéo `tour-cadre-court.mp4` (visite guidée, chapitres 1 à 5 et carte de fin, environ 1 min 33 s, cadre téléphone sur fond 16:9, sans son). Cian appuie sur lecture sur « équipe 14 ». Les sous-titres de la visite sont à l’écran : on ne les lit pas, on raconte par-dessus, en laissant des silences. Repères = début de chaque chapitre d’après les durées de `src/tour/script.ts` (à recaler une fois sur le mp4 final, voir ECRAN.md).

Chapitre 1, Ouverture (0:00 à 0:03 de la vidéo) et chapitre 2, Le besoin (0:03 à 0:18) [CIAN] :
> Voyons comment ça marche. Je suis Mathieu, du café. J’écris, avec mes mots : on a un espace libre le jeudi soir et on cherche des artistes pour l’animer.
(à 0:09, quand les puces s’allument; silence jusqu’au clic à 0:15)
> Maillage lit la phrase et allume les bons choix.

Chapitre 3, La proposition (0:18 à 0:52) [CIAN] :
(0:18, la carte et le titre)
> Exposition collaborative au café, 87 %. Camille Vézina, le Collectif Les Voisins en Scène, à deux ou trois minutes à pied.
(0:24, les barres du score)
> Réciprocité 58 % : le café comble une partie des besoins de ses partenaires, pas tout, et on le dit.
(0:30, les raisons)
> Chacun y gagne : le café apporte son espace et sa clientèle, Camille ses toiles, le Collectif son public.
(0:38, à confirmer; silence; puis 0:44, « Ça m’intéresse »)
> Ce qu’on ne sait pas encore, on le dit. Mathieu dit « Ça m’intéresse ».

Chapitre 4, Côté partenaire (0:52 à 1:14) [COÉQUIPIÈRE] :
(0:52, l’invitation de Camille)
> Voici ce que Camille reçoit : le projet, le jeudi 22 octobre, de 19 h à 22 h, et ce que chacun apporte.
(0:59, « pourquoi vous » : silence, le sous-titre le dit)
(1:04, elle accepte; 1:09, confirmé)
> Elle accepte, le Collectif aussi : projet confirmé. Dans la démo, les réponses sont simulées et aucun message ne part; en pilote, chaque partenaire reçoit vraiment l’invitation.

Chapitre 5, La fiche (1:14 à 1:29) et carte de fin [CIAN] :
(1:14, la fiche)
> Le projet devient une fiche, avec ses points à confirmer.
(1:29, carte de fin « Maillage : les ressources du quartier, enfin connectées »)
> Un café, une artiste, un organisme : un projet.

Plan B si la vidéo ne démarre pas (ou se fige) dans les 3 s : Ctrl+2, onglet de l’app, « Visite guidée », laisser jouer les chapitres 1 à 5 (mêmes repères, environ 1 min 30 s), « Quitter la visite » dès le chapitre 6 « Le fil du projet », puis Ctrl+1 et diapo 4. Même texte. Plan C : la vidéo de secours (onglet 3), même texte.

## 4. Données et technologie (2:23 à 3:14) [CIAN]
Diapo 4.

> D’où viennent les données? Des données ouvertes de la Ville de Québec et du SIT Québec, en licence CC BY : lieux publics, événements, vrais commerces. Et des répertoires qui existent déjà : les 386 membres du fichier fourni par la SDC, les 614 organismes reconnus à l’échelle de la ville, par leurs colonnes seulement : personne ne commence avec une page blanche, et aucune valeur confidentielle n’est en ligne.
> Pour la Loi 25, le consentement décide : une fiche devient publique seulement après réclamation, avec un code et un consentement; en pilote, une fiche non réclamée n’est visible que par la SDC.
> Pas d’IA payante : un moteur de règles, cinq critères aux poids visibles, pour que chaque suggestion s’explique. Claude Code nous a aidés à coder; les choix sont les nôtres.

[CONDITIONNEL, seulement si le mode présentation local est livré et testé à 12 h 30] :
> Sur ce portable seulement, un mode présentation montre les vrais répertoires; rien de tout ça n’est en ligne.

Notes (Q&A si on demande) : dans la démo, les fiches pré-remplies sont visibles sur la carte avec l’étiquette « Pré-rempli · visible ici pour la démo », sans coordonnées : neuf fictives, plus seize commerces réels (12 restos et cafés, 3 loisirs, 1 organisme touristique) tirés des données ouvertes du SIT Québec, ministère du Tourisme, CC BY 4.0 (65 profils en tout, 40 lieux publics, 18 événements, après la fusion de data/open-d2); c’est voulu, pour montrer le mécanisme; la règle du pilote (visibles par la SDC seulement) n’est pas codée. « Réclamer votre fiche » envoie un code à l’adresse déjà au dossier de la SDC ou de la Ville, jamais à une adresse tapée (Q38); le code de démo est affiché, aucun courriel ne part. Les nombres 386 et 614 sont des totaux de lignes approuvés par les organisateurs; ne jamais dire « dans Saint-Roch » pour un fichier qui couvre toute la ville. Les poids : complémentarité 35, réciprocité 20, proximité 20, thème 15, créneau 10 (Q7, Q23). Le modèle d’IA testé dans /labo/ (Q6) : 69 s au premier chargement (environ 130 Mo), 0,3 à 0,6 s par phrase, trouve des profils semblables, pas complémentaires. Tolérance aux fautes et à l’anglais ajoutée le 15 octobre après la remarque d’un mentor du hackathon (pas de la SDC : nous n’avons rencontré personne de la SDC).

## 5. Impact, pilote, évolution (3:14 à 3:46) [CIAN]
Diapo 5.

> L’impact : plus de projets communs, des commerces plus vivants, et une contribution possible au sentiment de sécurité. On le mesure : projets confirmés, nouveaux partenariats, fréquentation.
> Ce qu’on propose comme pilote : dix membres volontaires d’une SDC, un trimestre, une personne à temps partiel, un export du fichier des membres, et trois chiffres pour décider de la suite.
> Ensuite : le tableau de modération, prévu, pas construit; l’IA en phase 2, pour lire toutes les langues et toutes les fautes; puis d’autres quartiers.

(C’est une proposition : aucun oui de la SDC n’est demandé ni sous-entendu, nous n’avons rencontré personne de la SDC. Le fil : la démo est simulée; un vrai fil partagé existe en option, hébergé au Canada (Q15), à dire seulement en questions.)

## 6. Vous vous demandez peut-être… (3:46 à 4:20) [COÉQUIPIÈRE demande, CIAN répond]
Diapo 6 (trois questions, trois réponses d’une ligne).

> [COÉQUIPIÈRE] Vous vous demandez peut-être : qui prouve qu’un commerçant est bien le propriétaire de sa fiche?
> [CIAN] Le code part à l’adresse que la SDC ou la Ville a déjà au dossier, jamais à celle qu’on tape.
> [COÉQUIPIÈRE] Pourquoi des règles et pas de l’IA?
> [CIAN] On l’a testée : elle trouve des profils semblables, pas complémentaires; les règles, elles, s’expliquent.
> [COÉQUIPIÈRE] Et pourquoi un commerçant reviendrait une deuxième fois?
> [CIAN] Pour le projet lui-même : la fiche, le calendrier et le fil vivent dans l’app, et un projet confirmé en appelle un autre.

## 7. Conclusion (4:20 à 4:28) [COÉQUIPIÈRE]
Diapo 7 (lien et code QR).

> Saint-Roch a déjà tout ce qu’il faut. Maillage aide ses voisins à se trouver. Le lien est à l’écran, essayez-le. Merci!

Arrêt au plus tard à 4 min 50 s. Rester debout, sourire, attendre les questions.

---

## Notes de répétition
- Répéter au chronomètre deux fois avant 12 h (les salles ferment), puis une fois à 13 h 45 sur le projecteur. La vidéo fixe la durée de la partie 3 : on ne la commente pas plus vite qu’elle, on laisse les sous-titres respirer.
- Si on dépasse 4 min 45 s : couper d’abord la troisième question de la partie 6 (« reviendrait une deuxième fois »), puis la ligne « Réciprocité 58 % » (partie 3, 0:24). Jamais le consentement ni la proposition de pilote.
- Avant le pitch : vider les données du site dans l’onglet 2 (pour les questions), recharger l’accueil; la vidéo de la diapo 3 testée sur le projecteur avec son coupé.
- Ne pas lire les diapos ni les sous-titres de la vidéo : une idée par diapo.
- Si une question porte sur les données confidentielles : « Les fichiers fournis restent confidentiels. Nous n’avons utilisé que leur structure et leur nombre de lignes. » Détails dans qa-fr.md.
- Ne dire aucun chiffre qu’on ne peut pas prouver (pas de pourcentage de commerces qui partent, pas de revenus, pas de nombre de commerçants rencontrés sans l’avoir compté). Ne jamais dire ni laisser entendre qu’on a rencontré la SDC.

## Couleurs et accessibilité (note pour une question)
Le vert profond rassure et ancre l’app dans le quartier, l’orange invite à agir. Surtout, chaque couleur respecte les contrastes d’accessibilité, et les épingles combinent forme, icône et couleur pour les personnes daltoniennes (environ 8 % des hommes). WCAG 2.2 AA visé, police Atkinson Hyperlegible, cibles de 44 px, mouvement réduit (Q20).

## Décompte
Recompté le 16 octobre à 9 h 55 (nouvelle structure). Seules les lignes en citation (`>`) sont comptées; la ligne [CONDITIONNEL] est exclue. Débit de référence 150 mots par minute; la partie 3 dure la vidéo (1 min 33 s), quel que soit le nombre de mots. Compte produit par `node docs/pitch/compter.mjs` (130 pour la marge si on parle lentement).

| Partie | Mots | Parole à 150 | Créneau | À 130 mots/min |
|---|---|---|---|---|
| 1. Le problème | 59 | 24 s | 25 s | 27 s |
| 2. La solution : Maillage | 59 | 24 s | 25 s | 27 s |
| 3. La démo (vidéo) | 172 | 69 s (24 s de silence sur 93 s) | 1 min 33 s | 79 s, tient dans la vidéo |
| 4. Données et technologie | 128 | 51 s | 51 s | 59 s |
| 5. Impact, pilote, évolution | 80 | 32 s | 32 s | 37 s |
| 6. Vous vous demandez peut-être… | 86 | 34 s | 34 s | 40 s |
| 7. Conclusion | 21 | 8 s | 8 s | 10 s |
| Total | 605 | 4 min 02 s | 4 min 26 s (4 min 28 s avec les arrondis des créneaux) | 4 min 53 s |

À 130 mots par minute on dépasse 4:45 de 8 s : garder le débit normal; sinon appliquer l’ordre de coupe des notes de répétition (troisième question de la partie 6, 15 s; puis « Réciprocité 58 % », 8 s). La ligne [CONDITIONNEL] de la partie 4 ajoute 17 mots, 7 s : à dire seulement si le mode présentation local est livré, et seulement si la répétition est sous 4:35.
