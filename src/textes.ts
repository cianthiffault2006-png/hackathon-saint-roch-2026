// Strings that fr.ts does not have yet (project sheet extras, map and accessibility texts, calendar
// file text). Everything fr.ts already has is read from there.
export const T = {
  fiche: {
    lieuAConfirmer: 'À déterminer avec les partenaires',
    progres: (fait: number, total: number) => `${fait}/${total} confirmés`,
    calendrierFait: 'Fichier de calendrier téléchargé (rappel la veille).',
    rien: 'Rien n’est envoyé automatiquement : vous choisissez à qui partager.',
  },
  projets: {
    videTexte: 'Choisissez « Ça m’intéresse » sur une proposition pour la retrouver ici.',
  },
  partage: {
    objet: (titre: string) => `Projet Maillage : ${titre}`,
  },
  ics: {
    description: 'Projet Maillage (démo simulée). Date proposée, à confirmer avec les partenaires.',
    partenaires: 'Partenaires',
    aConfirmer: 'À confirmer',
    rappel: 'Rappel : projet Maillage demain',
  },
  carte: {
    resume: 'Carte, résumé dans la liste ci-dessous',
    minutesAPied: '10 min à pied',
    voirListe: 'Voir la liste',
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
    aideBesoin: 'Écrivez un besoin ou choisissez une puce',
    pagination: (i: number, n: number) => `Proposition ${i} sur ${n}`,
    detail: {
      complementarite: 'Complémentarité',
      reciprocite: 'Réciprocité',
      proximite: 'Proximité',
      creneau: 'Créneau',
      theme: 'Thème',
    },
  },
  visite: {
    invitation: 'Le partenaire reçoit une invitation claire et l’accepte.',
    fiche: 'Le projet devient une fiche : date proposée, lieu, partenaires.',
    coches: 'Une liste de points à confirmer, à cocher un à un.',
    projets: 'Tous vos projets au même endroit.',
  },
} as const
