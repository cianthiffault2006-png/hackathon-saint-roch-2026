import { describe, expect, it } from 'vitest';
import type { Besoin, Evenement, Lieu, Profil } from '../types.ts';
import { proposerAu } from './proposer.ts';
import { choixDepuisTexte, construireBesoin, suivreSaisie, type Choix } from '../lib/besoin.ts';
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
  it('3 résultats aux titres distincts', () => {
    console.log(res.map((p) => p.titre + ' | ' + p.type + ' | ' + p.score + ' | ' + p.partenaires.slice(1).map((x) => x.profilId)).join(' // '));
    expect(res).toHaveLength(3);
    expect(new Set(res.map((p) => p.titre)).size).toBe(3);
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
