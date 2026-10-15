import type { Besoin, Evenement, Lieu, Profil } from '../../types.ts';

// Profils fictifs autour de la place Jacques-Cartier (46.815, -71.222). 0,001° lat ≈ 111 m; 0,001° lng ≈ 76 m.
const base = { source: 'fictif' as const, origine: 'fixture de test', reclame: true };

export const profils: Profil[] = [
  { ...base, id: 'story-cafe', role: 'commerce', sousType: 'café', nom: 'Café Le Parvis', description: 'Café de quartier.', lat: 46.815, lng: -71.222, offres: ['espace_interieur'], besoins: ['public'], creneaux: ['semaine_soir'], themes: ['culture', 'commerce_local'] },
  { ...base, id: 'story-artiste', role: 'citoyen', sousType: 'artiste', nom: 'Léa Fortin, artiste', description: 'Peintre.', lat: 46.816, lng: -71.2235, offres: ['contenu_artistique'], besoins: ['espace_interieur', 'visibilite'], creneaux: ['semaine_soir', 'fin_de_semaine'], themes: ['art', 'culture'] },
  { ...base, id: 'story-organisme', role: 'organisme', sousType: 'organisme culturel', nom: 'Collectif Les Passeurs', description: 'Organisme culturel.', lat: 46.8165, lng: -71.221, offres: ['public', 'benevoles', 'affichage'], besoins: ['espace_interieur'], creneaux: ['semaine_soir'], themes: ['culture', 'communautaire'] },
  { ...base, id: 'bistro', role: 'commerce', sousType: 'bistro', nom: 'Bistro du Faubourg', description: 'Bistro.', lat: 46.8155, lng: -71.2225, offres: ['espace_interieur', 'nourriture'], besoins: ['public'], creneaux: ['semaine_soir', 'fin_de_semaine'], themes: ['commerce_local', 'alimentation'] },
  { ...base, id: 'jeunes', role: 'organisme', sousType: 'organisme jeunesse', nom: 'Maison des jeunes Saint-Roch', description: 'Jeunes.', lat: 46.8145, lng: -71.223, offres: ['benevoles', 'public'], besoins: ['espace_exterieur', 'materiel'], creneaux: ['fin_de_semaine', 'semaine_jour'], themes: ['jeunesse', 'communautaire'] },
  { ...base, id: 'boutique', role: 'commerce', sousType: 'boutique', nom: 'Boutique Ma Rue', description: 'Boutique.', lat: 46.8152, lng: -71.2205, offres: ['materiel', 'affichage', 'visibilite'], besoins: ['public'], creneaux: ['semaine_soir', 'fin_de_semaine'], themes: ['commerce_local'] },
  { ...base, id: 'etudiant', role: 'citoyen', sousType: 'étudiant', nom: 'Samuel Roy, étudiant', description: 'Musicien.', lat: 46.8148, lng: -71.2215, offres: ['animation', 'benevoles'], besoins: ['public', 'visibilite'], creneaux: ['semaine_soir'], themes: ['etudiants', 'culture'] },
  { ...base, id: 'traiteur', role: 'commerce', sousType: 'traiteur', nom: 'Traiteur Chez Colette', description: 'Traiteur.', lat: 46.8152, lng: -71.2218, offres: ['nourriture'], besoins: ['public'], creneaux: ['fin_de_semaine'], themes: ['alimentation', 'commerce_local'] },
  { ...base, id: 'ruelle', role: 'organisme', sousType: 'comité de ruelle', nom: 'Comité Ruelle Verte', description: 'Verdissement.', lat: 46.8135, lng: -71.2225, offres: ['espace_exterieur', 'benevoles'], besoins: ['materiel', 'financement'], creneaux: ['fin_de_semaine'], themes: ['environnement', 'communautaire'], reclame: false },
  { ...base, id: 'loin', role: 'commerce', sousType: 'librairie', nom: 'Librairie Lointaine', description: 'Hors quartier.', lat: 46.83, lng: -71.25, offres: ['espace_interieur'], besoins: ['public'], creneaux: ['semaine_soir'], themes: ['culture'] },
];

export const lieux: Lieu[] = [
  { id: 'lieu-salle', nom: 'Salle communautaire Dauphine', type: 'salle', lat: 46.8153, lng: -71.2228, offres: ['espace_interieur'], source: 'fictif', attribution: 'test' },
  { id: 'lieu-parc', nom: 'Parc de la Pointe', type: 'parc', lat: 46.8137, lng: -71.2231, offres: ['espace_exterieur'], source: 'fictif', attribution: 'test' },
  { id: 'lieu-stat', nom: 'Stationnement Cartier', type: 'stationnement', lat: 46.82, lng: -71.21, offres: ['espace_exterieur'], source: 'fictif', attribution: 'test' },
];

export const evenements: Evenement[] = [
  { id: 'ev-proche', titre: 'Soirée de poésie', lieuNom: 'Bibliothèque', lat: 46.8152, lng: -71.2221, debut: '2026-10-22T19:00:00', fin: '2026-10-22T21:00:00', categorie: 'littérature', themes: ['culture'], source: 'fictif' },
  { id: 'ev-loin', titre: 'Tournoi', lieuNom: 'Aréna', lat: 46.83, lng: -71.25, debut: '2026-10-22T19:00:00', fin: '2026-10-22T21:00:00', categorie: 'sport', themes: ['culture'], source: 'fictif' },
  { id: 'ev-tard', titre: 'Marché de Noël', lieuNom: 'Place', lat: 46.8151, lng: -71.222, debut: '2026-12-10T10:00:00', fin: '2026-12-10T16:00:00', categorie: 'marché', themes: ['culture'], source: 'fictif' },
  { id: 'ev-autre-theme', titre: 'Corvée', lieuNom: 'Parc', lat: 46.8151, lng: -71.222, debut: '2026-10-20T10:00:00', fin: '2026-10-20T12:00:00', categorie: 'environnement', themes: ['environnement'], source: 'fictif' },
];

export const besoinCafe: Besoin = {
  auteurRole: 'commerce',
  auteurId: 'story-cafe',
  texte: 'On a un espace libre le jeudi soir et on aimerait attirer du monde',
  besoins: ['public'],
  offres: ['espace_interieur'],
  creneaux: ['semaine_soir'],
  themes: ['culture'],
};

export const MAINTENANT = new Date('2026-10-15T12:00:00');
