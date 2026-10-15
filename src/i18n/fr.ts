// Maillage: textes de l'interface (français du Québec). Clés alignées sur src/types.ts.
// Aucun nom réel, aucune donnée personnelle.

export const fr = {
  accueil: {
    titre: 'Maillage',
    accroche: 'Des projets communs entre voisins de Saint-Roch, à trois partenaires, sur la carte du quartier.',
    question: 'Vous êtes…',
    roles: {
      commerce: 'Commerçant',
      organisme: 'Organisme',
      citoyen: 'Citoyen',
    },
    visiteGuidee: 'Visite guidée',
    badgeDemo: 'Démo simulée',
    pasDeCompte: 'Aucune inscription pour essayer.',
    tableauSdc: 'Tableau de bord du quartier (SDC)',
  },

  besoin: {
    titre: 'De quoi avez-vous besoin?',
    etiquette: 'Décrivez votre besoin ou ce que vous pouvez offrir',
    placeholders: {
      commerce: 'Ex. : Je suis un café et je voudrais animer mon espace le jeudi soir.',
      organisme: 'Ex. : Notre organisme cherche un local pour un atelier jeunesse en fin de semaine.',
      citoyen: 'Ex. : Je suis artiste et je cherche un endroit pour exposer mes œuvres.',
    },
    puces: {
      titreTags: 'Ce que je cherche ou j’offre',
      titreCreneaux: 'Quand',
      titreThemes: 'Thèmes',
    },
    tags: {
      espace_interieur: 'Espace intérieur',
      espace_exterieur: 'Espace extérieur',
      visibilite: 'Visibilité',
      affichage: 'Affichage',
      benevoles: 'Bénévoles',
      public: 'Public',
      contenu_artistique: 'Contenu artistique',
      animation: 'Animation',
      materiel: 'Matériel',
      expertise: 'Expertise',
      financement: 'Financement',
      nourriture: 'Nourriture',
    },
    creneaux: {
      semaine_jour: 'Semaine, jour',
      semaine_soir: 'Semaine, soir',
      fin_de_semaine: 'Fin de semaine',
    },
    themes: {
      culture: 'Culture',
      art: 'Art',
      communautaire: 'Communautaire',
      jeunesse: 'Jeunesse',
      etudiants: 'Étudiants',
      environnement: 'Environnement',
      commerce_local: 'Commerce local',
      securite: 'Sécurité',
      sport: 'Sport',
      alimentation: 'Alimentation',
    },
    jOffre: 'J’offre',
    jeCherche: 'Je cherche',
    aideBouton: 'Écrivez un besoin ou choisissez une puce',
    plus: 'Plus',
    moins: 'Moins',
    votreProfil: 'Votre profil :',
    bouton: 'Trouver des partenaires',
    boutonRetour: 'Retour',
    compris: 'Nous avons compris :',
    aucunePuce: 'Aucune puce choisie. Ajoutez-en pour affiner.',
  },

  proposition: {
    titre: 'Votre projet à trois',
    nombreTrouvees: (n: number) => (n === 1 ? '1 proposition trouvée' : `${n} propositions trouvées`),
    pourquoi: 'Pourquoi cette suggestion',
    aConfirmer: 'À confirmer',
    evenementsProches: 'Événements à proximité',
    aucunEvenement: 'Aucun événement à proximité à ce moment-là.',
    partenaires: 'Les trois partenaires',
    vous: 'Vous',
    quand: 'Quand',
    score: (n: number) => `Compatibilité : ${n} %`,
    lieuSuggere: 'Lieu suggéré',
    rolesPartenaire: {
      commerce: 'Commerce',
      organisme: 'Organisme',
      citoyen: 'Citoyen',
    },
    typesProjet: {
      exposition: 'Exposition',
      spectacle: 'Spectacle',
      atelier: 'Atelier',
      marche_ephemere: 'Marché éphémère',
      animation_de_rue: 'Animation de rue',
      verdissement: 'Verdissement',
      conference: 'Conférence',
      collecte: 'Collecte',
    },
    precedente: 'Proposition précédente',
    suivante: 'Proposition suivante',
    commentScore: 'Comment ce score',
    paginationN: (i: number, n: number) => `Proposition ${i} sur ${n}`,
    detailScore: {
      complementarite: 'Complémentarité',
      reciprocite: 'Réciprocité',
      proximite: 'Proximité',
      creneau: 'Créneau',
      theme: 'Thème',
    },
    voirInvitation: (prenom: string) => `Voir ce que ${prenom} reçoit`,
    interet: 'Ça m’intéresse',
    statuts: {
      proposee: 'Proposition',
      interet_envoye: 'Intérêt envoyé',
      en_attente: 'En attente des partenaires',
      confirmee: 'Projet confirmé (simulé)',
    },
    noteSimulation: 'Démo simulée : aucun message n’est envoyé aux partenaires.',
    voirCarte: 'Voir sur la carte',
    autreProposition: 'Voir une autre proposition',
  },

  transparence: {
    regles: 'Chaque suggestion s’appuie sur des règles claires, expliquées en mots simples.',
    personneDecide: 'L’app suggère, les personnes décident.',
  },

  profil: {
    tagNonReclame: 'Profil pré-rempli',
    nonReclame: 'Ce profil a été pré-rempli à partir de répertoires de la Ville. Il reste caché tant que son propriétaire ne l’a pas réclamé.',
    reclamer: 'Réclamer ce profil',
    pasAffiche: 'Profil non réclamé : non affiché.',
    fictif: 'Données fictives créées pour la démo.',
  },

  attribution: {
    prefixe: 'Données :',
    carte: '© contributeurs OpenStreetMap, OpenFreeMap',
    donneesOuvertes: 'Données ouvertes de la Ville de Québec',
    fictif: 'Profils et événements fictifs pour la démo',
  },

  fiche: {
    voir: 'Voir la fiche projet',
    titre: 'Fiche projet',
    ajouterCalendrier: 'Ajouter au calendrier',
    googleAgenda: 'Google Agenda',
    partager: 'Partager',
    prochaineDate: 'Prochaine date proposée',
    dateProposee: 'Date proposée, à confirmer avec les partenaires',
    aConfirmerAvant: 'À confirmer avant la date',
    lieuAConfirmer: 'À déterminer avec les partenaires',
    progres: (fait: number, total: number) => `${fait}/${total} confirmés`,
    calendrierFait: 'Fichier de calendrier téléchargé (rappel la veille).',
    rien: 'Rien n’est envoyé automatiquement : vous choisissez à qui partager.',
    objetPartage: (titre: string) => `Projet Maillage : ${titre}`,
    rappel: 'Rappel la veille',
    courriel: 'Envoyer par courriel',
    texto: 'Envoyer par texto',
    partageTexte: (titre: string, date: string, partenaires: string) =>
      `Projet Maillage : ${titre}, ${date}, avec ${partenaires}.`,
  },

  projets: {
    titre: 'Mes projets',
    aucun: 'Aucun projet pour l’instant',
    videTexte: 'Choisissez « Ça m’intéresse » sur une proposition pour la retrouver ici.',
  },

  carte: {
    titre: 'Carte de Saint-Roch',
    legende: 'Partenaires et lieux',
    chargement: 'Chargement de la carte…',
    resume: 'Carte, résumé dans la liste ci-dessous',
    minutesAPied: '10 min à pied',
    voirListe: 'Voir la liste',
    lieuPublic: 'Lieu public',
    evenement: 'Événement',
  },

  etats: {
    chargement: 'Chargement…',
    vide: {
      titre: 'Aucune proposition pour l’instant',
      texte: 'Essayez d’ajouter une puce ou de changer le moment. Plus nous en savons, plus les suggestions sont justes.',
    },
    erreur: {
      titre: 'Oups, quelque chose n’a pas fonctionné',
      texte: 'Vos données n’ont pas été perdues. Réessayez dans un instant.',
      reessayer: 'Réessayer',
    },
    horsLigne: 'Vous semblez hors ligne. La carte pourrait ne pas s’afficher.',
    donneesIndisponibles: 'Les données du quartier sont indisponibles pour le moment.',
  },

  visite: {
    titre: 'Visite guidée',
    finTitre: 'Maillage : les ressources du quartier, enfin connectées',
    texteCafe: 'Je suis un café de Saint-Roch. Je cherche un artiste pour exposer sur mon mur le jeudi soir.',
    suivant: 'Suivant',
    precedent: 'Précédent',
    quitter: 'Quitter la visite',
    pause: 'Pause',
    reprendre: 'Reprendre',
    etapes: {
      role: 'Un café de Saint-Roch se présente.',
      besoin: 'Il décrit ce qu’il cherche, avec ses mots.',
      proposition: 'Maillage propose un projet à trois, avec les raisons.',
      interet: 'Le café dit « Ça m’intéresse ».',
      confirme: 'Les partenaires répondent : le projet est confirmé (simulé).',
      invitation: 'Le partenaire reçoit une invitation claire et l’accepte.',
      fiche: 'Le projet devient une fiche : date proposée, lieu, partenaires.',
      coches: 'Une liste de points à confirmer, à cocher un à un.',
      projets: 'Tous vos projets au même endroit.',
    },
  },

  a11y: {
    ecrans: {
      accueil: 'Accueil',
      besoin: 'Décrivez votre besoin',
      proposition: 'Propositions',
      invitation: 'Invitation du partenaire',
      fiche: 'Fiche projet',
      projets: 'Mes projets',
      sdc: 'Tableau de bord du quartier',
    },
  },

  ics: {
    description: 'Projet Maillage (démo simulée). Date proposée, à confirmer avec les partenaires.',
    partenaires: 'Partenaires',
    aConfirmer: 'À confirmer',
    rappel: 'Rappel : projet Maillage demain',
  },

  general: {
    ok: 'D’accord',
    fermer: 'Fermer',
    retour: 'Retour',
    langue: 'Français (Québec)',
  },
} as const;

export type Fr = typeof fr;
