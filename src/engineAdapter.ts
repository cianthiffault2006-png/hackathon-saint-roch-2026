// Screens import the engine only through this file. Stub until src/engine merges:
// then replace the two bodies with `export { lireBesoin, proposer } from './engine'`.
import type { Contribution, Creneau, LireBesoin, Profil, Proposer, Proposition, Tag, Theme } from './types'

const MOTS_TAGS: [RegExp, Tag][] = [
  [/exposer|expo|mur|salle|espace|local/i, 'espace_interieur'],
  [/terrasse|parc|dehors|ext[eé]rieur/i, 'espace_exterieur'],
  [/visibilit[eé]|promotion|publicit[eé]/i, 'visibilite'],
  [/affiche|affichage/i, 'affichage'],
  [/b[eé]n[eé]vole/i, 'benevoles'],
  [/public|clients|achalandage/i, 'public'],
  [/toile|art|peinture|photo|artiste/i, 'contenu_artistique'],
  [/anim|spectacle|atelier/i, 'animation'],
  [/mat[eé]riel|[eé]quipement/i, 'materiel'],
  [/expertise|conseil/i, 'expertise'],
  [/financement|budget|subvention/i, 'financement'],
  [/nourriture|caf[eé]|repas|collation/i, 'nourriture'],
]
const MOTS_CRENEAUX: [RegExp, Creneau][] = [
  [/soir/i, 'semaine_soir'],
  [/fin de semaine|week-?end|samedi|dimanche/i, 'fin_de_semaine'],
  [/jour|midi|matin/i, 'semaine_jour'],
]
const MOTS_THEMES: [RegExp, Theme][] = [
  [/art|expo|toile|peinture/i, 'art'],
  [/culture|culturel|spectacle/i, 'culture'],
  [/communaut|voisin|quartier/i, 'communautaire'],
  [/jeune|ado/i, 'jeunesse'],
  [/[eé]tudiant/i, 'etudiants'],
  [/vert|environnement|jardin/i, 'environnement'],
  [/commerce|caf[eé]|boutique/i, 'commerce_local'],
]

function trouver<T>(texte: string, table: [RegExp, T][]): T[] {
  return table.filter(([re]) => re.test(texte)).map(([, v]) => v)
}

export const lireBesoin: LireBesoin = (texte) => {
  const tags = trouver(texte, MOTS_TAGS)
  const offre = /j.offre|offrir|je propose|disponible/i.test(texte)
  return {
    besoins: offre ? [] : tags,
    offres: offre ? tags : [],
    creneaux: trouver(texte, MOTS_CRENEAUX),
    themes: trouver(texte, MOTS_THEMES),
  }
}

function contribution(profils: Profil[], id: string, apport: string, tags: Tag[]): Contribution | null {
  return profils.some((p) => p.id === id) ? { profilId: id, apport, tags } : null
}

export const proposer: Proposer = (_besoin, profils, _lieux, evenements) => {
  const partenaires = [
    contribution(profils, 'story-cafe', 'accueille l’exposition sur son grand mur, le jeudi soir', ['espace_interieur', 'visibilite']),
    contribution(profils, 'story-artiste', 'présente une série de toiles sur le quartier', ['contenu_artistique']),
    contribution(profils, 'story-organisme', 'recrute des bénévoles et affiche l’événement', ['benevoles', 'affichage']),
  ].filter((c): c is Contribution => c !== null)
  const base: Proposition = {
    id: 'prop-1', titre: 'Exposition collaborative au café', type: 'exposition', partenaires,
    creneau: 'semaine_soir', score: 87,
    raisons: [
      'Le café offre un espace intérieur et l’artiste en cherche un.',
      'Les trois partenaires sont libres le soir en semaine.',
      'Tous les partenaires sont à moins de 10 minutes de marche.',
      'Thèmes communs : culture et art.',
    ],
    aConfirmer: ['Assurance des œuvres exposées', 'Accord du café sur l’accrochage au mur', 'Date exacte du vernissage'],
    evenementsProches: evenements.slice(0, 1).map((e) => e.id),
    statut: 'proposee',
  }
  const variante: Proposition = {
    ...base, id: 'prop-2', titre: 'Atelier de peinture en soirée', type: 'atelier', score: 74,
    raisons: ['Le café offre une salle à l’arrière.', 'L’organisme peut recruter des participants.'],
    aConfirmer: ['Matériel de peinture', 'Nombre de places'],
  }
  return [base, variante]
}
