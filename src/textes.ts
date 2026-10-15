// New strings of the afternoon batch (retire, public events, explorer slots). Copy moves them to fr.ts.
export const T = {
  retirer: {
    bouton: 'Me retirer du projet',
    boutonEvenement: 'Me désinscrire de l’événement',
    confirmer: 'Oui, me retirer',
    annuler: 'Annuler',
    question: 'Vous retirer de ce projet ? Il disparaîtra de votre liste.',
    questionEvenement: 'Vous désinscrire de cet événement ? Il disparaîtra de votre liste.',
    fait: 'Projet retiré de votre liste.',
  },
  evenement: {
    ouvert: 'Événement ouvert à tous : aucune approbation nécessaire',
    participe: 'Je participe',
    inscrit: 'Inscrit',
    inscritMoi: 'Inscrit : voir ma fiche',
    nbPersonnes: (n: number) => (n === 1 ? '1 personne y va' : `${n} personnes y vont`),
    organisateur: 'Organisateur',
    collab: 'Proposition de collaboration : les partenaires doivent accepter',
    proches: 'Événements proches',
  },
  carte: {
    cinqMinutes: '5 min à pied',
  },
  visite: {
    fil: 'Le fil du projet : participants, mises à jour et discussion.',
  },
  options: {
    plus: 'Plus d’options',
    voulu: 'Vous souhaitez travailler avec :',
  },
  accueil: {
    explorer: 'Explorer le quartier',
    proposer: 'Proposer un projet',
  },
  fiche: {
    ouvrirFil: 'Ouvrir le fil du projet',
  },
} as const
