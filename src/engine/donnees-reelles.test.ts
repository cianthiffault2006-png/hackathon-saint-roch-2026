import { describe, expect, it } from 'vitest';
import type { Besoin, Evenement, Lieu, Profil } from '../types.ts';
import { proposerAu } from './proposer.ts';
import { choixDepuisTexte, construireBesoin } from '../lib/besoin.ts';

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
