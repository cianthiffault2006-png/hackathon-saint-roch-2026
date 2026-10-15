import { normaliser } from './lecture.ts';
import type {
  Besoin, Contribution, Creneau, Evenement, Lieu, Profil, Proposer, Proposition, Tag, Theme, TypeProjet,
} from '../types.ts';

const M_PROCHE = 400; // points pleins
const M_LOIN = 800; // zéro point (≈ 10 minutes à pied)
const M_PAR_MIN = 80;
const RAYON_EVENT_M = 600;
const FENETRE_EVENT_J = 14;

const POIDS = { comp: 35, rev: 20, dist: 20, theme: 15, creneau: 10 };

const LIBELLE: Record<Tag, string> = {
  espace_interieur: 'un espace intérieur', espace_exterieur: 'un espace extérieur',
  visibilite: 'de la visibilité', affichage: "de l’affichage", benevoles: 'des bénévoles',
  public: 'du public', contenu_artistique: 'du contenu artistique', animation: "de l’animation",
  materiel: 'du matériel', expertise: "de l’expertise", financement: 'du financement',
  nourriture: 'de la nourriture',
};
const NU: Record<Tag, string> = {
  espace_interieur: 'espace intérieur', espace_exterieur: 'espace extérieur', visibilite: 'visibilité',
  affichage: 'affichage', benevoles: 'bénévoles', public: 'public', contenu_artistique: 'contenu artistique',
  animation: 'animation', materiel: 'matériel', expertise: 'expertise', financement: 'financement',
  nourriture: 'nourriture',
};
const CRENEAU_TXT: Record<Creneau, string> = {
  semaine_soir: 'le soir en semaine', fin_de_semaine: 'la fin de semaine', semaine_jour: 'le jour en semaine',
};
const THEME_TXT: Record<Theme, string> = {
  culture: 'culture', art: 'art', communautaire: 'communautaire', jeunesse: 'jeunesse', etudiants: 'étudiants',
  environnement: 'environnement', commerce_local: 'commerce local', securite: 'sécurité', sport: 'sport',
  alimentation: 'alimentation',
};
const ORDRE_CRENEAU: Creneau[] = ['semaine_soir', 'fin_de_semaine', 'semaine_jour'];
const ESPACES: Tag[] = ['espace_interieur', 'espace_exterieur'];

interface Point { lat: number; lng: number }

export function distanceM(a: Point, b: Point): number {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const minutes = (m: number) => Math.max(1, Math.ceil(m / M_PAR_MIN));
const minTxt = (m: number) => `${minutes(m)} minute${minutes(m) > 1 ? 's' : ''}`;
const inter = <T,>(a: readonly T[], b: readonly T[]): T[] => a.filter((x) => b.includes(x));
const sans = <T,>(a: readonly T[], b: readonly T[]): T[] => a.filter((x) => !b.includes(x));
const uniq = <T,>(a: readonly T[]): T[] => [...new Set(a)];
const lib = (tags: Tag[]) => tags.map((t) => LIBELLE[t]).join(' et ');

interface Cand {
  p: Profil;
  comp: Tag[]; // offres du candidat qui répondent aux besoins du demandeur
  rev: Tag[]; // offres du demandeur qui répondent aux besoins du candidat
  dist?: number;
  creneaux: Creneau[];
  sDist: number; // 0..1
  sTheme: number; // 0..1
  score: number; // 0..100 (paire, sert à choisir les partenaires)
}

function scorerPaire(b: Besoin, pos: Point | undefined, p: Profil): Cand | null {
  const creneaux = b.creneaux.length ? inter(b.creneaux, p.creneaux) : p.creneaux;
  if (!creneaux.length) return null; // créneau commun obligatoire
  const comp = inter(p.offres, b.besoins);
  const rev = inter(b.offres, p.besoins);
  if (!comp.length && !rev.length) return null;
  const dist = pos ? distanceM(pos, p) : undefined;
  const sDist = dist === undefined ? 0.5 : dist <= M_PROCHE ? 1 : dist >= M_LOIN ? 0 : (M_LOIN - dist) / (M_LOIN - M_PROCHE);
  const communs = inter(b.themes, p.themes);
  const sTheme = b.themes.length ? Math.min(1, communs.length / Math.min(b.themes.length, Math.max(1, p.themes.length))) : 0;
  const sComp = b.besoins.length ? comp.length / b.besoins.length : 0;
  const sRev = p.besoins.length ? rev.length / p.besoins.length : 0;
  const score = POIDS.comp * sComp + POIDS.rev * sRev + POIDS.dist * sDist + POIDS.theme * sTheme + POIDS.creneau;
  return { p, comp, rev, dist, creneaux, sDist, sTheme, score };
}

function lienEntre(x: Profil, y: Profil): { sDist: number; sTheme: number } {
  const d = distanceM(x, y);
  const sDist = d <= M_PROCHE ? 1 : d >= M_LOIN ? 0 : (M_LOIN - d) / (M_LOIN - M_PROCHE);
  const sTheme = Math.min(1, inter(x.themes, y.themes).length / Math.max(1, Math.min(x.themes.length, y.themes.length)));
  return { sDist, sTheme };
}

function choisirType(tags: Tag[], themes: Theme[], sansExposition = false, securiteExterieur = false): TypeProjet {
  const has = (t: Tag) => tags.includes(t);
  const th = (t: Theme) => themes.includes(t);
  const espace = has('espace_interieur') || has('espace_exterieur');
  if (has('contenu_artistique') && espace && !sansExposition) return 'exposition';
  if (securiteExterieur) return 'animation_de_rue';
  if (th('environnement')) return 'verdissement';
  if (has('nourriture') && th('commerce_local')) return 'marche_ephemere';
  if (has('animation')) {
    if (has('espace_exterieur') && !has('espace_interieur')) return 'animation_de_rue';
    return th('culture') || th('art') ? 'spectacle' : 'atelier';
  }
  if (has('expertise')) return 'conference';
  if (has('benevoles') && has('materiel')) return 'collecte';
  if (th('securite') || th('sport')) return 'animation_de_rue';
  return 'atelier';
}

function titre(type: TypeProjet, hote: string): string {
  switch (type) {
    case 'exposition': return `Exposition collaborative chez ${hote}`;
    case 'spectacle': return `Soirée spectacle chez ${hote}`;
    case 'atelier': return `Atelier ouvert chez ${hote}`;
    case 'marche_ephemere': return `Marché éphémère chez ${hote}`;
    case 'animation_de_rue': return `Animation de rue avec ${hote}`;
    case 'verdissement': return `Projet de verdissement avec ${hote}`;
    case 'conference': return `Conférence chez ${hote}`;
    case 'collecte': return `Collecte communautaire avec ${hote}`;
  }
}

const APPORT_TYPE: Record<TypeProjet, string> = {
  exposition: "l’exposition", spectacle: 'le spectacle', atelier: "l’atelier", marche_ephemere: 'le marché',
  animation_de_rue: "l’animation", verdissement: 'le verdissement', conference: 'la conférence', collecte: 'la collecte',
};

function lieuLePlusProche(lieux: Lieu[], c: Point, besoins: Tag[]): Lieu | undefined {
  const voulus = inter(besoins, ESPACES);
  const pref = voulus.length ? voulus : ESPACES;
  const ok = lieux.filter((l) => inter(l.offres, pref).length);
  const pool = ok.length ? ok : lieux.filter((l) => inter(l.offres, ESPACES).length);
  return [...pool].sort((a, b) => distanceM(c, a) - distanceM(c, b) || a.id.localeCompare(b.id))[0];
}

const centre = (pts: Point[]): Point => ({
  lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
  lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
});

const partIds = (p: Proposition) => p.partenaires.slice(1).map((x) => x.profilId);

/** Garde la meilleure, puis des propositions d'un autre type ou sans aucun partenaire déjà proposé (score > 50 d'abord). */
function diversifier(tries: Proposition[], n: number): Proposition[] {
  const out: Proposition[] = tries.slice(0, 1);
  const different = (p: Proposition) =>
    out.every((o) => p.titre !== o.titre && (p.type !== o.type || !partIds(p).some((i) => partIds(o).includes(i))));
  const passes: ((p: Proposition) => boolean)[] = [
    (p) => p.score > 50 && different(p),
    (p) => p.score > 50 && out.every((o) => p.titre !== o.titre),
    () => true,
  ];
  for (const ok of passes) {
    for (const p of tries) {
      if (out.length >= n) break;
      if (!out.includes(p) && ok(p)) out.push(p);
    }
  }
  return out.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id));
}

/** `maintenant` sert à filtrer les événements; par défaut l'heure courante. */
export const proposerAu = (
  besoin: Besoin, profils: Profil[], lieux: Lieu[], evenements: Evenement[], maintenant: Date = new Date(),
): Proposition[] => {
  const moi = besoin.auteurId ? profils.find((p) => p.id === besoin.auteurId) : undefined;
  const pos: Point | undefined =
    besoin.lat !== undefined && besoin.lng !== undefined ? { lat: besoin.lat, lng: besoin.lng } : moi;

  const cands = profils
    .filter((p) => p.id !== besoin.auteurId)
    .map((p) => scorerPaire(besoin, pos, p))
    .filter((c): c is Cand => c !== null)
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));

  // Pour chacun des 5 meilleurs partenaires, tous les tiers utiles; un trio par ensemble de partenaires.
  const combos = new Map<string, { a: Cand; b?: Cand; valeur: number }>();
  for (const a of cands.slice(0, 5)) {
    const nonCouverts = sans(besoin.besoins, a.p.offres);
    const besoinsA = sans(a.p.besoins, besoin.offres);
    const groupe = uniq([...besoin.offres, ...a.p.offres]);
    let nTiers = 0;
    for (const c of cands) {
      if (c.p.id === a.p.id) continue;
      if (!inter(c.creneaux, a.p.creneaux).length) continue;
      const couvre = inter(c.p.offres, nonCouverts).length;
      const couvreA = inter(c.p.offres, besoinsA).length;
      const sert = inter(c.p.besoins, groupe).length;
      if (!couvre && !couvreA && !sert) continue;
      nTiers++;
      const valeur = a.score + (25 * couvre + 15 * couvreA + 8 * sert + c.score) / 4;
      const cle = [a.p.id, c.p.id].sort().join('+');
      const deja = combos.get(cle);
      if (!deja || valeur > deja.valeur) combos.set(cle, { a, b: c, valeur });
    }
    if (!nTiers) combos.set(a.p.id, { a, valeur: a.score });
  }
  const trios = [...combos.values()].filter((x) => x.b);
  const choix = trios.length ? trios : [...combos.values()];

  const rang = new Map<string, number>(); // qualité des paires, pour départager les scores égaux
  const props = choix.map(({ a, b, valeur }): Proposition => {
    const membres = b && b.score > a.score ? [b, a] : b ? [a, b] : [a];
    const profs = membres.map((m) => m.p);
    const communs = (besoin.creneaux.length ? besoin.creneaux : profs[0].creneaux).filter((c) =>
      profs.every((p) => p.creneaux.includes(c)),
    );
    const creneau = ORDRE_CRENEAU.find((c) => communs.includes(c)) ?? communs[0] ?? 'semaine_soir';

    const offresGroupe = uniq([...besoin.offres, ...profs.flatMap((p) => p.offres)]);
    const pts: Point[] = [...(pos ? [pos] : []), ...profs];
    const espaceOffert = inter(offresGroupe, ESPACES).length > 0;
    const veutEspace = inter(besoin.besoins, ESPACES).length > 0;
    // Lieu retenu: nécessaire si personne n'offre d'espace; sinon proposé en solution de rechange si le demandeur cherche un espace.
    const lieu = !espaceOffert || veutEspace ? lieuLePlusProche(lieux, centre(pts), besoin.besoins) : undefined;
    const lieuRemplace = !espaceOffert ? lieu : undefined;
    const tags = uniq([...offresGroupe, ...(lieuRemplace ? lieuRemplace.offres : [])]);
    const themes = uniq([...besoin.themes, ...profs.flatMap((p) => p.themes)]);
    // Un événement culturel sans salle n'est pas une exposition, sauf si on l'a demandé ou si le demandeur apporte l'art.
    const parleExpo = /expos|galerie|oeuvre|tableau|vernissage/.test(normaliser(besoin.texte));
    const sansExposition = veutEspace && !besoin.offres.includes('contenu_artistique') && !parleExpo &&
      (themes.includes('culture') || themes.includes('communautaire')) &&
      (besoin.offres.includes('animation') || besoin.offres.includes('benevoles'));
    const securiteExt = themes.includes('securite') && besoin.besoins.includes('espace_exterieur') && !besoin.besoins.includes('contenu_artistique');
    const type = choisirType(tags, themes, sansExposition, securiteExt);

    const hoteProfil = profs.find((p) => inter(p.offres, ESPACES).length) ?? (inter(besoin.offres, ESPACES).length ? moi : undefined);
    const hoteNom = hoteProfil?.nom ?? lieu?.nom ?? profs[0].nom;
    const hotePos: Point = hoteProfil ?? lieu ?? pos ?? profs[0];

    const couverts = uniq([...profs.flatMap((p) => p.offres), ...(lieuRemplace ? lieuRemplace.offres : [])]);
    const manquants = sans(besoin.besoins, couverts);
    const couverture = besoin.besoins.length ? (besoin.besoins.length - manquants.length) / besoin.besoins.length : 0;
    // Détail du score: chaque valeur 0..100, total = round(Σ poids × valeur / 100).
    const moy = (xs: number[], vide: number) => (xs.length ? xs.reduce((u, v) => u + v, 0) / xs.length : vide);
    // Réciprocité: la part des besoins de chaque partenaire que le demandeur comble lui-même.
    const avecBesoins = membres.filter((m) => m.p.besoins.length);
    const toutesCommunes = !besoin.creneaux.length || besoin.creneaux.every((c) => communs.includes(c));
    // Les partenaires entre eux comptent aussi: le groupe doit tenir dans un même coin de quartier et partager des thèmes.
    const entrePartenaires = membres.length === 2 ? [lienEntre(membres[0].p, membres[1].p)] : [];
    const valeurs = {
      complementarite: Math.round(100 * couverture),
      reciprocite: Math.round(100 * moy(avecBesoins.map((m) => m.rev.length / m.p.besoins.length), 0)),
      proximite: Math.round(100 * moy([...membres.map((m) => m.sDist), ...entrePartenaires.map((e) => e.sDist)], 0.5)),
      creneau: communs.length ? (toutesCommunes ? 100 : 60) : 0,
      theme: Math.round(100 * moy([...membres.map((m) => m.sTheme), ...entrePartenaires.map((e) => e.sTheme)], 0)),
    };
    const poids = { complementarite: 35, reciprocite: 20, proximite: 20, creneau: 10, theme: 15 };
    const total = (Object.keys(poids) as (keyof typeof poids)[]).reduce((u, k) => u + (poids[k] * valeurs[k]) / 100, 0);
    const score = Math.max(0, Math.min(100, Math.round(total)));
    const detailScore = { ...valeurs, poids };

    const partenaires: Contribution[] = [
      {
        profilId: besoin.auteurId ?? 'demandeur',
        apport: besoin.offres.length ? `porte le projet et offre ${lib(besoin.offres)}` : 'porte le projet',
        tags: besoin.offres,
      },
      ...membres.map((m): Contribution => {
        const tagsM = m.comp.length ? m.comp : m.p.offres;
        return {
          profilId: m.p.id,
          apport: tagsM.some((t) => ESPACES.includes(t)) ? `accueille ${APPORT_TYPE[type]}` : `apporte ${lib(tagsM)}`,
          tags: tagsM,
        };
      }),
    ];

    const rComp: string[] = [];
    for (const m of membres) {
      const cr = inter(communs, m.p.creneaux)[0] ?? creneau;
      if (m.comp.length) rComp.push(`${m.p.nom} offre ${m.comp.map((t) => LIBELLE[t]).join(' et ')} ${CRENEAU_TXT[cr]}, ce que vous cherchez`);
    }
    const rev = membres.filter((m) => m.rev.length);
    const rRev = rev.length
      ? [`Ce que vous offrez (${uniq(rev.flatMap((m) => m.rev)).map((t) => NU[t]).join(', ')}) répond aux besoins de ${rev.map((m) => m.p.nom).join(' et ')}`]
      : [];
    const avecDist = membres.filter((m) => m.dist !== undefined);
    const rDist = avecDist.length ? [`À pied de vous : ${avecDist.map((m) => `${m.p.nom} à ${minTxt(m.dist!)}`).join(', ')}`] : [];
    const rLieu: string[] = [];
    if (lieuRemplace) {
      rLieu.push(`Lieu public proposé : ${lieuRemplace.nom}, à ${minTxt(distanceM(centre(pts), lieuRemplace))} (personne n’offre d’espace)`);
    } else if (lieu) {
      rLieu.push(`Lieu public proposé : ${lieu.nom}, à ${minTxt(distanceM(centre(pts), lieu))}`);
    }
    const rSecurite = securiteExt && creneau === 'semaine_soir' ? ['Animer un lieu public le soir, quand il est moins fréquenté'] : [];
    const themesCommuns = themes.filter((t) => besoin.themes.includes(t) && profs.some((p) => p.themes.includes(t)));
    const rTheme = themesCommuns.length ? [`Thèmes en commun : ${themesCommuns.map((t) => THEME_TXT[t]).join(', ')}`] : [];

    const proches = evenements
      .filter((e) => {
        const jours = (new Date(e.debut).getTime() - maintenant.getTime()) / 86400000;
        return jours >= 0 && jours <= FENETRE_EVENT_J && distanceM(hotePos, e) <= RAYON_EVENT_M && inter(e.themes, themes).length > 0;
      })
      .sort((x, y) => x.debut.localeCompare(y.debut) || x.id.localeCompare(y.id))
      .slice(0, 3);
    const rEvents = proches.length
      ? [`À proximité dans les 14 prochains jours : ${proches.map((e) => e.titre).join(', ')}`]
      : [];
    // 5 lignes au plus, les plus informatives d'abord; le chevauchement d'événements est repris dans « à confirmer ».
    const raisons = [...rComp, ...rSecurite, ...rLieu, ...rRev, ...rDist, `Tous disponibles ${CRENEAU_TXT[creneau]}`, ...rTheme, ...rEvents].slice(0, 5);

    const aConfirmer = [
      'Date précise du projet',
      `Capacité d’accueil de ${hoteNom}`,
      'Assurances (responsabilité civile) à valider',
      'Accessibilité du lieu pour tous',
      ...(proches.length ? [`Éviter le chevauchement avec : ${proches.map((e) => e.titre).join(', ')}`] : []),
      ...manquants.map((t) => `Besoin non comblé : ${NU[t]}`),
      ...membres.filter((m) => !m.p.reclame).map((m) => `${m.p.nom}. Profil pré-rempli : l’organisme doit d’abord activer son profil`),
    ];

    const idProp = `prop-${besoin.auteurId ?? 'anon'}-${profs.map((p) => p.id).sort().join('+')}`;
    rang.set(idProp, valeur);
    return {
      id: `prop-${besoin.auteurId ?? 'anon'}-${profs.map((p) => p.id).sort().join('+')}`,
      titre: titre(type, hoteNom),
      type,
      partenaires,
      lieuId: lieu?.id,
      creneau,
      score,
      detailScore,
      raisons,
      aConfirmer,
      evenementsProches: proches.map((e) => e.id),
      statut: 'proposee',
    };
  });

  const tries = props.sort((x, y) => y.score - x.score || (rang.get(y.id) ?? 0) - (rang.get(x.id) ?? 0) || x.id.localeCompare(y.id));
  return diversifier(tries, 3);
};

export const proposer: Proposer = (besoin, profils, lieux, evenements) => proposerAu(besoin, profils, lieux, evenements);
