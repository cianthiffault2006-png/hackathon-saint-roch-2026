import type { Evenement, Lieu, Profil } from '../types'

// Local fallback used until public/data/*.json is served. Fictional rows only.
export const profils: Profil[] = [
  {
    "id": "story-cafe",
    "role": "commerce",
    "sousType": "café",
    "nom": "Café Le Petit Détour",
    "description": "Café de quartier qui a un espace libre le jeudi soir et cherche à attirer du monde.",
    "lat": 46.8148,
    "lng": -71.222,
    "offres": [
      "espace_interieur",
      "nourriture",
      "public"
    ],
    "besoins": [
      "animation",
      "contenu_artistique",
      "visibilite"
    ],
    "creneaux": [
      "semaine_soir"
    ],
    "themes": [
      "culture",
      "commerce_local"
    ],
    "source": "fictif",
    "origine": "Entreprises St-Roch",
    "reclame": true
  },
  {
    "id": "story-artiste",
    "role": "citoyen",
    "sousType": "artiste",
    "nom": "Camille Vézina",
    "description": "Artiste en arts visuels qui cherche un lieu chaleureux pour exposer ses toiles.",
    "lat": 46.8155,
    "lng": -71.2195,
    "offres": [
      "contenu_artistique",
      "animation"
    ],
    "besoins": [
      "espace_interieur",
      "visibilite",
      "public"
    ],
    "creneaux": [
      "semaine_soir",
      "fin_de_semaine"
    ],
    "themes": [
      "art",
      "culture",
      "commerce_local"
    ],
    "source": "fictif",
    "origine": "Collection Art Public",
    "reclame": true
  },
  {
    "id": "story-organisme",
    "role": "organisme",
    "sousType": "organisme culturel",
    "nom": "Collectif Les Voisins en Scène",
    "description": "Organisme culturel de quartier qui a des bénévoles et un réseau, et veut rejoindre de nouveaux publics.",
    "lat": 46.8139,
    "lng": -71.2235,
    "offres": [
      "benevoles",
      "visibilite",
      "affichage",
      "animation"
    ],
    "besoins": [
      "espace_interieur",
      "contenu_artistique"
    ],
    "creneaux": [
      "semaine_soir"
    ],
    "themes": [
      "culture",
      "communautaire"
    ],
    "source": "fictif",
    "origine": "Liste organismes reconnus LSVC",
    "reclame": true
  }
]

export const lieux: Lieu[] = [
  {
    id: 'lieu-place', nom: 'Place publique du quartier', type: 'place_publique',
    lat: 46.817, lng: -71.22, offres: ['espace_exterieur', 'public'], source: 'fictif',
    attribution: 'Donnée fictive pour la démo',
  },
]

export const evenements: Evenement[] = [
  {
    id: 'ev-1', titre: 'Soirée portes ouvertes du quartier', lieuNom: 'Place publique du quartier',
    lat: 46.817, lng: -71.22, debut: '2026-11-12T18:00:00', fin: '2026-11-12T21:00:00',
    categorie: 'Communautaire', themes: ['communautaire'], source: 'fictif',
  },
]
