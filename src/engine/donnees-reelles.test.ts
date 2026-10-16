import { describe, expect, it } from 'vitest';
import type { Besoin, Evenement, Lieu, Profil, Proposition, Role } from '../types.ts';
import { proposerAu } from './proposer.ts';
import { choixDepuisTexte, construireBesoin, departDepuisBesoin, suivreSaisie, type Choix } from '../lib/besoin.ts';
import { fr } from '../i18n/fr.ts';

// Lecture des fichiers réels (pas de types node dans tsconfig.app: import.meta.glob de Vite).
const brut = import.meta.glob('../../public/data/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const lire = <T,>(f: string): T => JSON.parse(brut[`../../public/data/${f}`]) as T;

describe('proposer sur public/data', () => {
  const profils = lire<Profil[]>('profils.json');
  const cafe = profils.find((p) => p.id === 'story-cafe')!;
  // Besoin de l'histoire: les tags du profil du café (le texte typé s'y ajoute dans l'app).
  const besoin: Besoin = {
    auteurRole: 'commerce', auteurId: cafe.id, texte: 'On a un espace libre le jeudi soir et on aimerait attirer du monde',
    besoins: cafe.besoins, offres: cafe.offres, creneaux: cafe.creneaux, themes: cafe.themes,
  };
  const res = proposerAu(besoin, profils, lire<Lieu[]>('lieux.json'), lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
  it('premier: trio de l’histoire', () => {
    expect(res[0].partenaires.slice(1).map((x) => x.profilId).sort()).toEqual(['story-artiste', 'story-organisme']);
  });
  // Three results, never the same pair of partners twice; a title may repeat when only two project types fit
  // (before, the third was a « Projet de verdissement » the café never asked for).
  it('3 résultats, trois paires de partenaires distinctes, 2 types au moins', () => {
    console.log(res.map((p) => p.titre + ' | ' + p.type + ' | ' + p.score + ' | ' + p.partenaires.slice(1).map((x) => x.profilId)).join(' // '));
    expect(res).toHaveLength(3);
    expect(new Set(res.map((p) => p.partenaires.slice(1).map((x) => x.profilId).sort().join('+'))).size).toBe(3);
    expect(new Set(res.map((p) => p.type)).size).toBeGreaterThanOrEqual(2);
  });
});

describe('proposer sur public/data: organisme sans salle', () => {
  const profils = lire<Profil[]>('profils.json');
  const texte = "On veut organiser un événement culturel mais on n'a pas de salle";
  const besoin = construireBesoin('organisme', texte, profils, choixDepuisTexte('organisme', texte, profils));
  const res = proposerAu(besoin, profils, lire<Lieu[]>('lieux.json'), lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
  it('pas d’exposition, lieu public proposé, 5 raisons au plus', () => {
    console.log(res.map((p) => p.titre + ' | ' + p.lieuId + ' | ' + p.raisons.join(' / ')).join(' // '));
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].type).not.toBe('exposition');
    expect(res[0].lieuId).toBeTruthy();
    expect(res[0].raisons.join(' | ')).toContain('Lieu public proposé');
    for (const p of res) expect(p.raisons.length).toBeLessThanOrEqual(5);
  });
  it('lieu public hôte: « au Centre Materia », jamais « chez »', () => {
    expect(res[0].titre).not.toMatch(/chez/);
    expect(res[0].titre).toMatch(/ (au|aux|à la|à l’|à) [A-ZÉÈ]|au lieu public proposé$/);
  });
});

describe('proposer sur public/data: sécurité en soirée', () => {
  const profils = lire<Profil[]>('profils.json');
  const lieux = lire<Lieu[]>('lieux.json');
  const med = profils.find((p) => p.id === 'p-mediation')!;
  const besoin: Besoin = {
    auteurRole: 'organisme', auteurId: med.id, texte: 'On veut animer un endroit public le soir pour que le monde s’y sente en sécurité',
    besoins: ['espace_exterieur', 'public'], offres: ['expertise', 'benevoles'], creneaux: ['semaine_soir'], themes: ['securite'],
  };
  const res = proposerAu(besoin, profils, lieux, lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
  it('animation de rue dans un lieu public ouvert, avec la raison du soir', () => {
    console.log('SECURITE TOP: ' + res[0].titre + ' | ' + res[0].lieuId + ' | ' + res[0].score + ' | ' + res[0].raisons.join(' / '));
    expect(res[0].type).toBe('animation_de_rue');
    const lieu = lieux.find((l) => l.id === res[0].lieuId);
    expect(lieu?.source).toBe('ouvert');
    expect(res[0].raisons).toContain('Animer un lieu public le soir, quand il est moins fréquenté');
  });
});

describe('detailScore sur public/data', () => {
  it('score = somme pondérée des cinq valeurs', () => {
    const profils = lire<Profil[]>('profils.json');
    const cafe = profils.find((p) => p.id === 'story-cafe')!;
    const b: Besoin = { auteurRole: 'commerce', auteurId: cafe.id, texte: '', besoins: cafe.besoins, offres: cafe.offres, creneaux: cafe.creneaux, themes: cafe.themes };
    const res = proposerAu(b, profils, lire<Lieu[]>('lieux.json'), [], new Date('2026-10-15T12:00:00'));
    expect(res[0].score).toBeGreaterThanOrEqual(83);
    expect(res[0].score).toBeLessThanOrEqual(89);
    for (const p of res) {
      const d = p.detailScore!;
      const somme = (Object.keys(d.poids) as (keyof typeof d.poids)[]).reduce((u, k) => u + (d.poids[k] * d[k]) / 100, 0);
      expect(p.score).toBe(Math.round(somme));
    }
  });
});

describe('proposer sur public/data: corvée de propreté', () => {
  const profils = lire<Profil[]>('profils.json');
  const texte = "Il y a des graffitis et des déchets sur la rue Saint-Joseph, j'aimerais organiser un nettoyage avec des voisins";
  const besoin = construireBesoin('citoyen', texte, profils, choixDepuisTexte('citoyen', texte, profils));
  // Le rôle citoyen joue story-artiste dans l'app; ici Sofia est le demandeur.
  const sofia = profils.find((p) => p.id === 'p-sofia')!;
  const b: Besoin = { ...besoin, auteurId: sofia.id, besoins: sofia.besoins, offres: sofia.offres, creneaux: sofia.creneaux, themes: sofia.themes, lat: sofia.lat, lng: sofia.lng };
  const res = proposerAu(b, profils, lire<Lieu[]>('lieux.json'), lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
  it('première: Corvée de propreté avec l’équipe de propreté, raison de proximité', () => {
    console.log('CORVEE TOP: ' + res[0].titre + ' | ' + res[0].score + ' | ' + res[0].raisons.join(' / '));
    expect(res[0].titre).toBe('Corvée de propreté avec Équipe Propreté du Faubourg');
    expect(res[0].type).toBe('corvee_proprete');
    expect(res[0].partenaires.map((x) => x.profilId)).toContain('p-proprete');
    expect(res[0].raisons.join(' | ')).toMatch(/Depuis chez vous, à pied : .*Équipe Propreté du Faubourg à \d+ minutes?/);
  });
});

describe('visite guidée: phrase du café', () => {
  const profils = lire<Profil[]>('profils.json');
  const texte = fr.visite.texteCafe;
  const choix = choixDepuisTexte('commerce', texte, profils);
  const besoin = construireBesoin('commerce', texte, profils, choix);
  const res = proposerAu(besoin, profils, lire<Lieu[]>('lieux.json'), lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
  const nom = (id: string) => profils.find((p) => p.id === id)?.nom;
  it('pastilles: offre espace intérieur, cherche animation, semaine soir', () => {
    expect(choix.offre).toEqual(['espace_interieur']);
    expect(choix.cherche).toEqual(['animation']);
    expect(choix.creneaux).toEqual(['semaine_soir']);
  });
  it('87 % avec Camille Vézina et Collectif Les Voisins en Scène', () => {
    expect(res[0].score).toBe(87);
    expect(res[0].partenaires.slice(1).map((x) => nom(x.profilId)).sort()).toEqual(['Camille Vézina', 'Collectif Les Voisins en Scène']);
    expect(res[0].titre).toBe('Exposition collaborative au Café Le Petit Détour');
  });
  // Pin de la proposition de la démo (jury): tout changement du moteur doit la laisser identique.
  it('proposition de la démo: 87 %, détail 100/58/100/100/67, raisons et à confirmer figés', () => {
    const { titre, type, score, detailScore, raisons, aConfirmer, partenaires } = res[0];
    expect(detailScore).toEqual({ complementarite: 100, reciprocite: 58, proximite: 100, creneau: 100, theme: 67, poids: { complementarite: 35, reciprocite: 20, proximite: 20, creneau: 10, theme: 15 } });
    expect({ titre, type, score, partenaires, raisons, aConfirmer }).toMatchInlineSnapshot(`
      {
        "aConfirmer": [
          "Date précise du projet",
          "Capacité d’accueil : Café Le Petit Détour",
          "Assurances (responsabilité civile) à valider",
          "Accessibilité du lieu pour tous",
          "Événements à proximité : Dégustation de bières d’automne (24 oct.), Corvée de verdissement d’automne (25 oct.)",
        ],
        "partenaires": [
          {
            "apport": "porte le projet et offre un espace intérieur, de la nourriture et du public",
            "profilId": "story-cafe",
            "tags": [
              "espace_interieur",
              "nourriture",
              "public",
            ],
          },
          {
            "apport": "apporte du contenu artistique et de l’animation",
            "profilId": "story-artiste",
            "tags": [
              "contenu_artistique",
              "animation",
            ],
          },
          {
            "apport": "apporte de la visibilité et de l’animation",
            "profilId": "story-organisme",
            "tags": [
              "visibilite",
              "animation",
            ],
          },
        ],
        "raisons": [
          "Camille Vézina offre du contenu artistique et de l’animation le soir en semaine, ce que vous cherchez",
          "Collectif Les Voisins en Scène offre de la visibilité et de l’animation le soir en semaine, ce que vous cherchez",
          "Ce que vous offrez (espace intérieur, public) répond à ce que cherchent Camille Vézina et Collectif Les Voisins en Scène",
          "Depuis chez vous, à pied : Camille Vézina à 3 minutes ; Collectif Les Voisins en Scène à 2 minutes",
          "Tous disponibles le soir en semaine",
        ],
        "score": 87,
        "titre": "Exposition collaborative au Café Le Petit Détour",
        "type": "exposition",
      }
    `);
  });
  it('proposition 2: l’hôte est le café qui offre l’espace, pas un partenaire qui apporte de l’art', () => {
    // Le café offre son espace intérieur; Obscura a aussi une salle, mais n'apporte que de l'art et de la visibilité.
    expect(res[1].titre).toMatch(/ au Café Le Petit Détour$/);
    for (const p of res) expect(p.titre).not.toMatch(/Obscura|chez/);
  });
  // Same path as the Besoin screen: chips updated at every keystroke (surSaisie), then « Trouver ».
  it.each([texte, texte.replace(/\.$/, ''), texte.replace('’', "'")])('saisie lettre par lettre « %s »: mêmes pastilles, 87 %%', (phrase) => {
    let cur: Choix = { cherche: [], offre: [], creneaux: [] };
    let avant: Choix = { cherche: [], offre: [], creneaux: [] };
    for (let i = 1; i <= phrase.length; i++) {
      const lu = choixDepuisTexte('commerce', phrase.slice(0, i), profils);
      cur = { cherche: suivreSaisie(cur.cherche, avant.cherche, lu.cherche), offre: suivreSaisie(cur.offre, avant.offre, lu.offre), creneaux: suivreSaisie(cur.creneaux, avant.creneaux, lu.creneaux) };
      avant = lu;
    }
    expect(cur).toEqual({ cherche: ['animation'], offre: ['espace_interieur'], creneaux: ['semaine_soir'] });
    const r = proposerAu(construireBesoin('commerce', phrase, profils, cur), profils, lire<Lieu[]>('lieux.json'), lire<Evenement[]>('evenements.json'), new Date('2026-10-15T12:00:00'));
    expect(r[0].score).toBe(87);
    expect(r[0].partenaires.slice(1).map((x) => nom(x.profilId)).sort()).toEqual(['Camille Vézina', 'Collectif Les Voisins en Scène']);
  });
});

// The need drives the proposal: type from what was asked, time slot from what was typed.
describe('proposer sur public/data: le besoin mène', () => {
  const profils = lire<Profil[]>('profils.json');
  const lieux = lire<Lieu[]>('lieux.json');
  const evenements = lire<Evenement[]>('evenements.json');
  const lancer = (role: Role, texte: string) =>
    proposerAu(construireBesoin(role, texte, profils, choixDepuisTexte(role, texte, profils)), profils, lieux, evenements, new Date('2026-10-15T12:00:00'));

  it.each([
    ['commerce', 'On cherche un groupe de musique pour une soirée concert samedi.', 'spectacle', 'fin_de_semaine'],
    ['commerce', 'On veut accueillir une conférence sur l’histoire du quartier.', 'conference', 'semaine_soir'],
    ['commerce', 'On cherche des artistes pour une expo dans notre salle.', 'exposition', 'semaine_soir'],
    ['citoyen', 'Je cherche une salle pour un concert acoustique vendredi soir.', 'spectacle', 'semaine_soir'],
    ['citoyen', 'Je veux verdir ma ruelle avec mes voisins.', 'verdissement', undefined],
    ['citoyen', 'Je cherche un espace extérieur pour un spectacle de danse en fin de semaine.', 'spectacle', 'fin_de_semaine'],
    ['organisme', 'On organise une conférence sur la sécurité, on cherche un lieu.', 'conference', 'semaine_soir'],
    ['organisme', 'On organise une expo de photos, on cherche un lieu et du public.', 'exposition', 'semaine_soir'],
    ['organisme', 'On offre des ateliers d’écriture, on cherche une salle le jour.', 'atelier', 'semaine_jour'],
    ['citoyen', 'Je cherche des bénévoles pour une collecte de vêtements.', 'collecte', undefined],
    ['citoyen', 'Je cherche du matériel pour une projection de films.', 'spectacle', undefined],
  ] as const)('%s « %s » → %s, %s', (role, texte, type, creneau) => {
    const res = lancer(role, texte);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].type).toBe(type);
    if (creneau) expect(res[0].creneau).toBe(creneau);
  });
  it('une équipe de propreté parmi les partenaires ne fait pas une corvée d’une animation jeunesse', () => {
    const res = lancer('organisme', 'On cherche un espace extérieur pour une animation jeunesse en fin de semaine.');
    for (const p of res) expect(p.type).not.toBe('corvee_proprete');
  });
  it('la démo du café: ni marché ni verdissement parmi ses trois propositions', () => {
    for (const p of lancer('commerce', fr.visite.texteCafe)) expect(['marche_ephemere', 'verdissement']).not.toContain(p.type);
  });
  it('le demandeur qui accueille chez lui: « au Café », pas « avec Café »', () => {
    const res = lancer('commerce', 'On aimerait verdir notre terrasse avec des plantes.');
    expect(res[0].type).toBe('verdissement');
    expect(res[0].titre).toBe('Projet de verdissement au Café Le Petit Détour');
  });
  it('citoyen (Camille) qui parle de graffitis obtient une corvée malgré son profil d’artiste', () => {
    const res = lancer('citoyen', 'Il y a des graffitis et des déchets sur ma rue, j’aimerais organiser un nettoyage avec des voisins.');
    expect(res[0].type).toBe('corvee_proprete');
  });
  it('pas de marché éphémère quand le besoin ne parle ni de nourriture ni de marché', () => {
    for (const p of lancer('commerce', fr.visite.texteCafe)) expect(p.type).not.toBe('marche_ephemere');
    for (const p of lancer('organisme', 'On cherche une salle pour un spectacle de musique samedi soir.')) expect(p.type).not.toBe('marche_ephemere');
  });
  it('marché éphémère quand on le demande', () => {
    expect(lancer('organisme', 'On veut faire un marché de Noël avec les commerçants.')[0].type).toBe('marche_ephemere');
  });
});

describe('partenaire voulu (explorateur → « Proposer une collaboration »)', () => {
  const profils = lire<Profil[]>('profils.json');
  const lieux = lire<Lieu[]>('lieux.json');
  const evenements = lire<Evenement[]>('evenements.json');
  // Même chemin que l'écran Besoin: les offres de X deviennent des puces « je cherche », puis X va au moteur.
  const avecVoulu = (role: Role, id: string, puces = true): Proposition[] => {
    const x = profils.find((p) => p.id === id)!;
    const b = construireBesoin(role, '', profils, { cherche: puces ? x.offres : [], offre: [], creneaux: [] });
    return proposerAu({ ...b, voulu: id }, profils, lieux, evenements, new Date('2026-10-15T12:00:00'));
  };
  const partenaires = (p: Proposition) => p.partenaires.slice(1).map((c) => c.profilId);
  it.each([
    ['citoyen pré-rempli', 'commerce', 'p-sofia'],
    ['commerce (rangée ouverte SIT, non réclamée)', 'organisme', 'sit-RESTMTOV500RND'],
    ['organisme', 'commerce', 'p-mdj'],
    ['citoyen sans créneau ni offre communs', 'commerce', 'p-cuisinier'],
  ])('X = %s: X en premier dans chaque proposition', (_, role, id) => {
    const res = avecVoulu(role as Role, id);
    expect(res.length).toBeGreaterThan(0);
    for (const p of res) expect(partenaires(p)[0]).toBe(id);
    for (const p of res) expect(p.partenaires[0].profilId).not.toBe(id);
  });
  it('X qui ne colle pas: gardé quand même, et « À confirmer » dit pourquoi', () => {
    const res = avecVoulu('commerce', 'p-cuisinier', false); // sans les puces: ses offres ne répondent à rien
    const a = res[0].aConfirmer.join('\n');
    expect(a).toContain('Rôle de Rémi C., cuisinier amateur à préciser : son profil n’offre pas ce que vous cherchez');
    expect(a).toContain('Horaire à convenir avec Rémi C., cuisinier amateur : aucun créneau commun');
  });
  it('X qui ne colle pas: le % de la paire et ce qui le baisse', () => {
    const acc = avecVoulu('commerce', 'p-cuisinier', false)[0].accordVoulu!;
    expect(acc.nom).toBe('Rémi C., cuisinier amateur');
    expect(acc.freins).toContain('Son profil n’offre rien de ce que vous cherchez');
    expect(acc.freins).toContain('Aucun créneau en commun');
    expect(acc.score).toBeLessThan(50);
  });
  it('café + Musi’Quiz Québec: % et freins réels', () => {
    const acc = avecVoulu('commerce', 'sit-DIVLMTOV503I45', false)[0].accordVoulu!;
    expect(acc.nom).toBe('Musi\'Quiz Québec');
    expect(acc.freins).toContain('Répond à 1 de vos 3 besoins');
    expect(acc.freins).not.toContain('Aucun créneau en commun');
    expect(acc.score).toBeGreaterThan(0);
    expect(acc.score).toBeLessThanOrEqual(100);
  });
  it('X sans créneau commun (Boulangerie, semaine jour): « Pourquoi » ne promet aucun créneau', () => {
    for (const p of avecVoulu('commerce', 'p-boulangerie')) {
      const r = p.raisons.join('\n');
      expect(r).not.toMatch(/Tous disponibles/);
      expect(r).not.toMatch(/Boulangerie[^\n]*le soir en semaine/);
      expect(p.aConfirmer.join('\n')).toContain('aucun créneau commun');
    }
  });
  it('« Je démarre »: aucun profil existant, X toujours en premier', () => {
    const x = profils.find((p) => p.id === 'p-mdj')!;
    const b = construireBesoin('commerce', 'Je veux animer mon nouveau local le soir', profils, { cherche: x.offres, offre: [], creneaux: [] }, true);
    expect(b.auteurId).toBeUndefined();
    expect(b.offres).toEqual([]);
    const res = proposerAu({ ...b, voulu: x.id }, profils, lieux, evenements, new Date('2026-10-15T12:00:00'));
    expect(res.length).toBeGreaterThan(0);
    for (const p of res) {
      expect(p.id.startsWith('prop-anon-')).toBe(true);
      expect(partenaires(p)[0]).toBe(x.id);
    }
  });
  it('« Créer le projet quand même »: le formulaire part du besoin, X invité', () => {
    const b = { ...construireBesoin('commerce', 'Un concert le jeudi soir', profils, { cherche: [], offre: [], creneaux: ['semaine_soir'] }), voulu: 'p-cuisinier' };
    const d = departDepuisBesoin(b, profils);
    expect(d.titre).toBe(fr.proposition.typesProjet.spectacle);
    expect(d.type).toBe('spectacle');
    expect(d.description).toBe('Un concert le jeudi soir');
    expect(d.creneau).toBe('semaine_soir');
    expect(d.auteurId).toBe('story-cafe');
    const cuisinier = profils.find((p) => p.id === 'p-cuisinier')!;
    expect(d.invites['p-cuisinier']?.length).toBeGreaterThan(0);
    for (const t of d.invites['p-cuisinier']) {
      expect(cuisinier.offres).toContain(t);
      expect(d.roles).toContain(t);
    }
  });
  it('X qui colle: aucune ligne d’excuse', () => {
    const a = avecVoulu('commerce', 'p-mdj')[0].aConfirmer.join('\n');
    expect(a).not.toMatch(/à préciser : son profil|aucun créneau commun/);
  });
  it('pin: sans X (ou X = soi-même), même résultat qu’avant', () => {
    const cafe = profils.find((p) => p.id === 'story-cafe')!;
    const b: Besoin = { auteurRole: 'commerce', auteurId: cafe.id, texte: fr.visite.texteCafe, besoins: cafe.besoins, offres: cafe.offres, creneaux: cafe.creneaux, themes: cafe.themes };
    const sans = proposerAu(b, profils, lieux, evenements, new Date('2026-10-15T12:00:00'));
    expect(proposerAu({ ...b, voulu: cafe.id }, profils, lieux, evenements, new Date('2026-10-15T12:00:00'))).toEqual(sans);
    expect(proposerAu({ ...b, voulu: 'inconnu' }, profils, lieux, evenements, new Date('2026-10-15T12:00:00'))).toEqual(sans);
    expect(sans[0].score).toBe(87);
  });
});
