// Tolerant reading: fixes typos and maps a few English words onto the French
// vocabulary of the dictionary in lecture.ts, before its patterns run.
// Input is already normalised (lowercase, no accents).

/** Damerau-Levenshtein (optimal string alignment): a swap counts as 1 edit. */
export function distance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) d.push([i]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Edits allowed for a word of this length: ≤4 exact, 5-7 one, 8+ two. */
export const tolerance = (n: number): number => (n <= 4 ? 0 : n <= 7 ? 1 : 2);

// English words → a French word the dictionary already knows. Exact match only.
const ANGLAIS: Record<string, string> = {
  art: 'artiste', arts: 'artistes', artist: 'artiste', artists: 'artistes',
  painting: 'peinture', paintings: 'peintures', music: 'musique',
  musician: 'musicien', musicians: 'musiciens', band: 'musiciens', bands: 'musiciens',
  space: 'espace', spaces: 'espaces', room: 'salle', rooms: 'salles',
  venue: 'salle', venues: 'salles', backyard: 'cour', backyards: 'cours',
  volunteer: 'benevole', volunteers: 'benevoles', volunteering: 'benevolat',
  cleaning: 'nettoyage', cleanup: 'nettoyage', litter: 'dechets', graffiti: 'graffiti',
  trash: 'dechets', garbage: 'dechets',
  garden: 'jardin', gardens: 'jardins', greening: 'verdissement', plants: 'plantes',
  food: 'nourriture', coffee: 'cafe', snacks: 'collations',
  kids: 'enfants', children: 'enfants', youth: 'jeunes', teens: 'ados',
  evening: 'soir', evenings: 'soirs', tonight: 'soir', night: 'soir', nights: 'soirs',
  weekend: 'samedi', weekends: 'samedis', saturday: 'samedi', saturdays: 'samedis',
  sunday: 'dimanche', sundays: 'dimanches',
  morning: 'matin', mornings: 'matins', afternoon: 'apres-midi', afternoons: 'apres-midi',
  workshop: 'atelier', workshops: 'ateliers', show: 'spectacle', shows: 'spectacles',
  concert: 'concert', concerts: 'concerts',
  need: 'besoin', needs: 'besoin', looking: 'cherche',
};

// French words the dictionary reads; a misspelled word is pulled to the closest one.
const VOCAB = [
  'exposer', 'exposition', 'expositions', 'galerie', 'vernissage', 'accrochage',
  'oeuvres', 'tableaux', 'sculpture', 'sculptures', 'peinture', 'peintures',
  'photographie', 'photographies', 'illustration', 'illustrations',
  'artiste', 'artistes', 'artisan', 'artisans',
  'espace', 'espaces', 'salles', 'locaux', 'endroit', 'endroits',
  'terrasse', 'terrasses', 'ruelle', 'ruelles', 'stationnement',
  'benevole', 'benevoles', 'benevolat',
  'public', 'clientele', 'achalandage', 'visiteur', 'visiteurs', 'attirer', 'passants',
  'affiche', 'affiches', 'affichage', 'babillard', 'depliant', 'depliants', 'flyers',
  'promotion', 'promouvoir', 'visibilite', 'publicite', 'rayonnement',
  'spectacle', 'spectacles', 'concerts', 'musique', 'musicien', 'musiciens',
  'animation', 'animations', 'atelier', 'ateliers',
  'materiel', 'chaises', 'sonorisation', 'equipement', 'equipements', 'projecteur', 'projecteurs',
  'financement', 'subvention', 'subventions', 'commandite', 'commandites', 'commanditaire', 'commanditaires',
  'nourriture', 'traiteur', 'collation', 'collations', 'boissons',
  'expertise', 'conseils', 'formation',
  'graffiti', 'graffitis', 'nettoyage', 'nettoyer', 'proprete', 'dechets', 'ramassage', 'ordures', 'trottoirs', 'salete',
  'culture', 'culturel', 'culturelle', 'jeunesse', 'adolescent', 'adolescents', 'enfants',
  'etudiant', 'etudiants', 'etudiante', 'etudiantes', 'universite',
  'environnement', 'verdissement', 'vegetalisation', 'jardin', 'jardins', 'plantes',
  'securite', 'securitaire', 'eclairage', 'sportif', 'sportive',
  'communaute', 'communautaire', 'voisins', 'quartier', 'citoyens', 'solidarite',
  'commerce', 'commerces', 'commercant', 'commercants', 'boutique', 'boutiques', 'marchands', 'cuisine',
  'soiree', 'soirees', 'samedi', 'samedis', 'dimanche', 'dimanches', 'mercredi', 'mercredis',
  'vendredi', 'vendredis', 'journee', 'cherche', 'recherche', 'besoin',
];
const CONNU = new Set(VOCAB);

// Real French words one edit away from a dictionary word: never "corrected".
// (aimer→aider is not in VOCAB, but these guard the ones that are.)
const PROTEGES = new Set([
  'passages', 'especes', 'espece', 'plaintes', 'plainte', 'visiter', 'voisine', 'voisines', 'expose', 'affichee',
  'aimer', 'maternel', 'maternelle', 'culturels', 'culturelles', 'passant', 'chaise',
  'publics', 'publique', 'publiques', 'sportifs', 'sportives', 'voisin', 'citoyen',
  'boisson', 'conseil', 'besoins', 'recherches', 'cherches', 'cherchez', 'cherchons',
  'jardine', 'plante', 'planter', 'affichez', 'afficher', 'exposez', 'exposes', 'exposee',
  'formations', 'quartiers', 'materiels', 'animer', 'animee', 'animez',
  'espacer', 'espaces', 'endroits', 'galeries', 'journees', 'soirs', 'matins',
  'promotions', 'cuisines', 'cuisiner', 'traiteurs', 'atelier', 'ateliers',
  'commence', 'commencer', 'commande', 'commandes', 'commander', 'information', 'informations',
  'propriete', 'proprietes', 'proprietaire', 'publie', 'publier', 'publiee', 'affaire', 'affaires',
  'position', 'positions', 'poisson', 'poissons', 'sale', 'sales', 'vitrine', 'vitrines',
]);

function corriger(mot: string): string {
  const en = ANGLAIS[mot];
  if (en) return en;
  if (CONNU.has(mot) || PROTEGES.has(mot)) return mot;
  const max = tolerance(mot.length);
  if (max === 0) return mot;
  let best = mot;
  let bestD = max + 1;
  for (const v of VOCAB) {
    if (v.length < 5) continue;
    const d = distance(mot, v, max);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return bestD <= max ? best : mot;
}

/** Normalised text in, the same text with typos fixed and English mapped to French. */
export const corrigerTexte = (t: string): string => t.replace(/[a-z]+/g, (m) => corriger(m));
