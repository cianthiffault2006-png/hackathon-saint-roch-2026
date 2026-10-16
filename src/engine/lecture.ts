import type { Creneau, LireBesoin, Tag, Theme } from '../types.ts';
import { corrigerTexte } from './tolerance.ts';

/** Minuscules, sans accents, apostrophes droites. */
export const normaliser = (s: string): string =>
  s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/[’‘`ʼ]/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

interface Entree {
  re: RegExp;
  besoin?: Tag[];
  offre?: Tag[];
  themes?: Theme[];
}

// Dictionnaire sur texte normalisé; les racines couvrent pluriels et féminins.
const DICO: Entree[] = [
  { re: /\b(expos?\b|expos(er|e|ons|ition|itions|ant|ants)|galerie|vernissage|accrochage)/, besoin: ['espace_interieur', 'visibilite'], offre: ['contenu_artistique'], themes: ['art'] },
  { re: /\b(oeuvres?|tableaux?|sculptures?|peintures?|photographies?|illustrations?)\b/, offre: ['contenu_artistique'], themes: ['art'] },
  { re: /\b(artistes?|artisans?)\b/, themes: ['art'] },
  // « espace extérieur », « lieu à l'extérieur », « en plein air » : dehors; un espace sans ce complément : dedans.
  { re: /\b(espaces?|salles?|locaux|local|endroits?|lieux?)\b(?!\s+(exterieurs?|a l'exterieur|dehors|en plein air)\b)/, besoin: ['espace_interieur'], offre: ['espace_interieur'] },
  { re: /\b(exterieurs?|plein air|dehors|terrasses?|cour|ruelles?|parcs?|places?|stationnements?)\b/, besoin: ['espace_exterieur'], offre: ['espace_exterieur'] },
  { re: /\b(benevol|coup de main|main[- ]d'oeuvre|mains|aide|aider)/, besoin: ['benevoles'], offre: ['benevoles'] },
  { re: /\b(public|clientele|achalandage|visiteurs?|foule|attirer|monde|passants?)\b/, besoin: ['public'], offre: ['public'] },
  { re: /\b(affiches?|affichage|afficher|babillard|depliants?|flyers?)/, besoin: ['affichage'], offre: ['affichage'] },
  { re: /\b(promotion|promouvoir|faire connaitre|visibilite|publicite|se faire voir|rayonnement)/, besoin: ['visibilite'], offre: ['visibilite'] },
  { re: /\b(spectacles?|concerts?|musique|musiciens?|danse|animations?|animer|ateliers?)/, besoin: ['animation'], offre: ['animation'], themes: ['culture'] },
  { re: /\b(materiel|chaises?|sono|sonorisation|tables?|equipements?|projecteurs?|tentes?)\b/, besoin: ['materiel'], offre: ['materiel'] },
  { re: /\b(financement|subventions?|commandites?|commanditaires?|fonds|argent)\b/, besoin: ['financement'], offre: ['financement'] },
  { re: /\b(bouffe|cafe|cafes|nourriture|traiteur|repas|collations?|manger|boissons?|nourrir)\b/, besoin: ['nourriture'], offre: ['nourriture'], themes: ['alimentation'] },
  { re: /\b(expertise|experts?|conseils?|formation|savoir-faire|mentor)/, besoin: ['expertise'], offre: ['expertise'] },
  { re: /\b(graffitis?|tags?|nettoy\w*|proprete|dechets?|ramass\w*|ordures?|vitrines? sales?|trottoirs?|salete)/, besoin: ['expertise', 'materiel', 'benevoles'], offre: ['expertise', 'materiel', 'benevoles'], themes: ['environnement', 'securite'] },
  { re: /\b(culture|culturel|culturelle|culturels|culturelles)\b/, themes: ['culture'] },
  { re: /\b(jeunes?|jeunesse|ados?|adolescents?|enfants?)\b/, themes: ['jeunesse'] },
  { re: /\b(etudiants?|etudiantes?|cegep|universit\w*)\b/, themes: ['etudiants'] },
  { re: /\b(environnement|verdissement|verdir|ruelles? vertes?|vert|vegetalisation|jardin\w*|plantes?|ecolo\w*)\b/, themes: ['environnement'] },
  { re: /\b(securite|securitaire|sentiment de securite|eclairage)\b/, themes: ['securite'] },
  { re: /\b(sports?|sportif|sportive|yoga|velo)\b/, themes: ['sport'] },
  { re: /\b(communaute|communautaire|voisins?|quartier|citoyens?|solidarite)\b/, themes: ['communautaire'] },
  { re: /\b(commerces?|commercants?|boutiques?|marchands?|achat local)\b/, themes: ['commerce_local'] },
  { re: /\b(cuisine|manger|repas|bouffe|nourriture)\b/, themes: ['alimentation'] },
];

const MARQUEUR_OFFRE =
  /\b(j'ai|on a (un|une|des|du|de la)|nous avons|on offre|j'offre|nous offrons|disponible|libre|peut accueillir|peuvent accueillir|on peut|je peux|on prete|je prete|on propose|je propose|mettre a disposition|a disposition|on met)\b/;
const MARQUEUR_BESOIN =
  /\b(cherche|chercher|cherchons|recherche|rechercher|besoin|aimerait|aimerions|aimerais|voudrait|voudrions|voudrais|veut|veux|voulons|souhaite|manque|il nous faut|il me faut|on n'a pas|n'avons pas|n'ai pas|on a pas|sans)\b/;
const NEGATION = /\b(n'a pas|n'avons pas|n'ai pas|on a pas|pas de|sans)\b/;

// Possessif sur le travail de la personne: elle l'apporte, même si elle cherche un endroit.
const APPORT_PERSONNEL = /\b(mes|mon|nos|notre) (oeuvres?|tableaux|sculptures?|photos?|peintures?|travail|creations?)\b/;

const splitClauses = (t: string): string[] =>
  t
    .split(/[.;!?\n]+|,| mais | et (?=(?:on|nous|je|j'|il|elle)\b)| pour (?=(?:le|la|les|l')\s)/)
    .map((c) => c.trim())
    .filter(Boolean);

// A day with its moment, left to right: « jeudi soir », « le soir du jeudi », « samedi matin ».
// The moment next to a day belongs to that day only, so « jeudi soir » is not also « jour ».
const MOMENT = String.raw`(soir|soiree|soirees|soirs|matin|matins|apres-midi|midi)`;
const reJourMoment = new RegExp(
  String.raw`(?:\b${MOMENT}\s+(?:du|de|le|les)\s+)?` +
    String.raw`\b(fin de semaine|fins de semaine|week-?end|fds|samedis?|dimanches?|lundis?|mardis?|mercredis?|jeudis?|vendredis?)\b` +
    String.raw`(?:\s+(?:en\s+)?${MOMENT}\b)?`,
  'g',
);
const FDS = /^(fin|fins|week|fds|samedi|dimanche)/;

function lireCreneaux(t: string): Creneau[] {
  const out = new Set<Creneau>();
  let jourDeSemaine = false;
  for (const m of t.matchAll(reJourMoment)) {
    if (FDS.test(m[2])) out.add('fin_de_semaine');
    else {
      jourDeSemaine = true;
      out.add(/soir/.test(`${m[1] ?? ''} ${m[3] ?? ''}`) ? 'semaine_soir' : 'semaine_jour');
    }
  }
  // A moment on its own: « une soirée concert samedi » is the weekend's evening, not a weekday one.
  const reste = out.has('fin_de_semaine') && !jourDeSemaine ? '' : t.replace(reJourMoment, ' ');
  if (/\b(soir|soiree|soirees|soirs)\b/.test(reste)) out.add('semaine_soir');
  if (/\b(midi|apres-midi|matin|journee|jour|jours)\b/.test(reste)) out.add('semaine_jour');
  return [...out];
}

export const lireBesoin: LireBesoin = (texte) => {
  const t = corrigerTexte(normaliser(texte));
  const besoins = new Set<Tag>();
  const offres = new Set<Tag>();
  const themes = new Set<Theme>();

  for (const clause of splitClauses(t)) {
    const neg = NEGATION.test(clause);
    const estOffre = !neg && MARQUEUR_OFFRE.test(clause) && !MARQUEUR_BESOIN.test(clause.replace(MARQUEUR_OFFRE, ''));
    for (const e of DICO) {
      if (!e.re.test(clause)) continue;
      e.themes?.forEach((x) => themes.add(x));
      const cible = estOffre ? e.offre : e.besoin;
      cible?.forEach((x) => (estOffre ? offres : besoins).add(x));
    }
    if (!estOffre && APPORT_PERSONNEL.test(clause)) offres.add('contenu_artistique');
  }
  return {
    besoins: [...besoins],
    offres: [...offres],
    creneaux: lireCreneaux(t),
    themes: [...themes],
  };
};
