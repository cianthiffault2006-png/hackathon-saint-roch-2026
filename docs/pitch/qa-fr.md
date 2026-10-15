# Questions probables du jury (3 minutes) et réponses courtes

Règle : une réponse en 20 secondes, une seule voix répond, on dit « nous ne savons pas encore » plutôt que d’inventer.

## 1. Et la vie privée, la Loi 25?
Les profils pré-remplis à partir des répertoires de la Ville sont cachés tant que leur propriétaire ne les a pas réclamés. Aucun profil de citoyen n’est publié sans son consentement. Nous collectons le strict nécessaire, et un profil peut être retiré. Dans un vrai déploiement, la Ville ou la SDC serait responsable des renseignements et ferait l’évaluation requise. Notre démo n’utilise aucune vraie donnée de personne.

## 2. Qui s’inscrit en premier?
Les membres de la SDC, invités par la SDC elle-même, et les organismes reconnus qui ont déjà des projets. Les commerces et les organismes commencent parce qu’ils ont des lieux, du matériel et des événements; les citoyens arrivent ensuite, attirés par les projets visibles sur la carte. Le démarrage se fait par un pilote avec un petit groupe, pas par une grande campagne.

## 3. Pourquoi pas un groupe Facebook?
Les groupes restent utiles pour annoncer et discuter, et Maillage ne les remplace pas. Il ajoute ce qui manque : il prend un besoin écrit en mots simples et propose directement trois partenaires précis, avec les raisons et la distance à pied. Il n’y a pas de fil à suivre pour trouver un partenaire, et la Ville ou la SDC garde la main sur le service.

## 4. En quoi est-ce différent d’un répertoire?
Un répertoire répond à « qui existe? ». Maillage répond à « qui devrait faire quoi ensemble? ». Il croise ce que chacun offre et cherche, le moment, le thème et la proximité, puis assemble un projet à trois. Maillage ne remplace aucun outil existant : il crée le lien qui manque entre ceux qui ont des ressources et ceux qui ont des projets, avec trois partenaires complémentaires pour un projet concret. Chaque suggestion s’explique. Dans la démo, aucun message ne part; en pilote, chaque partenaire reçoit l’invitation et accepte.

## 5. Combien ça coûte et qui paie?
La démo tourne sur des services gratuits (hébergement, cartes ouvertes). Hébergement gratuit pour un projet pilote, et une personne à temps partiel à la SDC pour l’accueil et la modération. Celui qui déploie, la Ville ou la SDC, assume ces coûts, ainsi que celui d’un éventuel modèle de langage en phase 2. Nous ne donnons pas de chiffre précis sans l’avoir calculé.

## 6. Est-ce de l’IA ou pas?
Notre moteur est un moteur de règles qui explique chaque suggestion. Nous avons aussi testé l’IA : un modèle multilingue tourne directement dans le navigateur, gratuitement, et le texte ne quitte pas l’appareil (page /labo/). Sur un portable : 69 s au premier chargement (129 Mo), 13 s ensuite, environ 0,3 à 0,6 s par phrase. Il comprend le sens, mais il trouve des profils semblables, pas complémentaires : d’où notre moteur de règles, et l’IA en phase 2 pour lire la demande libre. Les personnes décident. Nous avons utilisé Claude Code pour développer l’app, ce qui est indiqué sur la dernière diapo.

## 7. Comment fonctionne le jumelage?
Le score est une somme pondérée visible : complémentarité, réciprocité, proximité, créneau, thème. Dans l’app, « Comment ce score » le montre. Les règles : complémentarité (l’un offre ce que l’autre cherche), proximité (environ dix minutes à pied), moment commun (semaine jour, semaine soir ou fin de semaine) et thème commun. Le moteur assemble trois partenaires, ajoute un lieu public si personne n’offre d’espace, puis affiche « Pourquoi cette suggestion » et « À confirmer ».

## 8. Comment brancher les données de la Ville?
Nos profils ont les mêmes colonnes que les fichiers de la Ville. Pour brancher les vraies données, il suffit de remplacer nos fichiers fictifs par un export des mêmes colonnes, avec réclamation des profils par leurs propriétaires. Les données ouvertes (lieux publics, événements) peuvent se mettre à jour automatiquement.

## 9. Et la modération? Si quelqu’un abuse?
Un profil doit être réclamé pour apparaître. Un projet n’est confirmé que si les partenaires acceptent; il n’y a pas de messagerie ouverte à tous. Pour un pilote, un administrateur (SDC ou Ville) pourrait retirer un profil ou un projet. C’est dans la feuille de route, et nous ne prétendons pas l’avoir déjà construit.

## 10. Comment mesurer l’impact?
Trois mesures simples : le nombre de projets confirmés, le nombre de partenariats entre des acteurs qui ne se connaissaient pas, et la fréquentation des événements créés. Après un trimestre de pilote, on compare avec la SDC et on décide si on étend ou si on arrête.

---

## 11. Pourquoi ne pas entraîner l’IA sur vos données?
Il faudrait des données réelles de collaborations réussies : le pilote les produira, c’est la phase 2.

## 12. Vos règles viennent d’où?
Nos profils et nos règles s’appuient sur les colonnes des répertoires de la Ville et sur le Plan d’action Saint-Roch. Nous ne prétendons pas avoir fait des entrevues; le pilote servira à les valider avec des gens du quartier.

## 13. Avez-vous des preuves que ça aide un quartier?
Pas pour Maillage lui-même : c’est ce que le pilote mesurera. Pour l’idée générale, un essai randomisé à Philadelphie sur 541 terrains vacants (Moyer, MacDonald, Ridgeway et Branas, American Journal of Public Health, 2019) a trouvé que les verdir (−6,8 %) ou les tondre et nettoyer (−9,2 %) réduisait les tirs de façon significative, sans signe de déplacement vers les zones voisines. C’est un autre type d’intervention : nous le citons pour dire que soigner les espaces communs peut compter, pas pour promettre le même résultat.

## 14. Que fait Maillage, et que ne fait-il pas?
Maillage règle un problème précis, de bout en bout : trouver le bon partenaire, se mettre d’accord, se coordonner et passer à l’action. On ne fait ni paiements, ni signalements d’urgence, ni réseau social : on s’arrête là où d’autres outils existent (311, 911, plateformes de financement).

## 15. Comment les gens communiquent-ils?
Chaque projet a un fil : participants, mises à jour et discussion, avec un mode lent de 15 secondes contre le pourriel et un bouton de signalement. Les coordonnées ne sont partagées qu’après une acceptation mutuelle, par courriel, texto ou WhatsApp.

## 16. Qui peut créer un événement ou un commerce?
Dans le modèle prévu pour le pilote : les commerces sont vérifiés par la SDC, les organismes sont reconnus par la Ville, et les citoyens s’inscrivent sans badge. La SDC modère.

## 17. Un citoyen voit du vandalisme, que fait-il?
En cas d’urgence, le 911; pour la voie publique, le 311. Pour embellir ou nettoyer, il propose un projet ouvert : une équipe de propreté du quartier, des bénévoles et un commerce qui offre le café.

## 18. Un citoyen veut juste assister à un événement?
Les événements ouverts au public ont un bouton « Je participe », sans approbation.

## 19. Et les grands projets, le financement?
Le projet ouvert a des rôles à combler. Le financement viendra en phase 2, via les programmes existants et le sociofinancement local, à confirmer.

## 20. Pourquoi ces couleurs?
Le vert profond rassure et ancre l’app dans le quartier, l’orange invite à agir. Surtout, chaque couleur respecte les contrastes d’accessibilité, et les épingles combinent forme, icône et couleur pour les personnes daltoniennes (environ 8 % des hommes).

## Si on ne sait pas
« Bonne question. Nous ne l’avons pas encore tranchée. Dans un pilote avec la SDC, voici comment nous le vérifierions : … » Puis une phrase. Ne jamais inventer un chiffre ni dire qu’une fonction existe si elle n’existe pas.

## Chiffres à ne pas inventer
Aucune statistique sur les commerces qui quittent le quartier, la fréquentation, les coûts exacts ou le nombre d’utilisateurs. Si le jury demande, répondre que ce serait mesuré pendant le pilote.
