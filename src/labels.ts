import type { Creneau, Role, Tag, Theme } from './types'

export const LIBELLE_TAG: Record<Tag, string> = {
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
}

export const LIBELLE_CRENEAU: Record<Creneau, string> = {
  semaine_jour: 'Semaine, jour',
  semaine_soir: 'Semaine, soir',
  fin_de_semaine: 'Fin de semaine',
}

export const LIBELLE_THEME: Record<Theme, string> = {
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
}

export const LIBELLE_ROLE: Record<Role, string> = {
  commerce: 'Commerçant',
  organisme: 'Organisme',
  citoyen: 'Citoyen',
}

export const TAGS: Tag[] = Object.keys(LIBELLE_TAG) as Tag[]
export const CRENEAUX: Creneau[] = Object.keys(LIBELLE_CRENEAU) as Creneau[]
