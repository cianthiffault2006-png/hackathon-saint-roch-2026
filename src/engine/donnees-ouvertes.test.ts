import { describe, expect, it } from 'vitest';
import type { Evenement, Lieu, Profil } from '../types.ts';
import { proposerAu } from './proposer.ts';
import { choixDepuisTexte, construireBesoin } from '../lib/besoin.ts';
import { fr } from '../i18n/fr.ts';
import { besoinSofia } from '../tour/histoires.ts';

// Lignes réelles (données ouvertes, scripts/build_open_rows.py) : elles s'ajoutent sans changer le chemin de la démo.
const brut = import.meta.glob('../../public/data/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const lire = <T,>(f: string): T => JSON.parse(brut[`../../public/data/${f}`]) as T;
const profils = lire<Profil[]>('profils.json');
const lieux = lire<Lieu[]>('lieux.json');
const evenements = lire<Evenement[]>('evenements.json');
const ouverts = profils.filter((p) => p.source === 'ouvert');

describe('lignes réelles des données ouvertes', () => {
  it('au moins 12 établissements SIT Québec et 2 lieux de culte, tous dans le quartier', () => {
    expect(ouverts.length).toBeGreaterThanOrEqual(12);
    expect(lieux.filter((l) => l.id.startsWith('vque45-'))).toHaveLength(2);
    for (const p of ouverts) {
      expect(p.lat).toBeGreaterThan(46.80); expect(p.lat).toBeLessThan(46.83);
      expect(p.lng).toBeGreaterThan(-71.24); expect(p.lng).toBeLessThan(-71.21);
    }
  });
  it('pré-remplis, sans contact, jamais des citoyens, ligne de licence portée par origine', () => {
    for (const p of ouverts) {
      expect(p.reclame).toBe(false);
      expect(p.contactPublic).toBe(false);
      expect(p.role).not.toBe('citoyen');
      expect(p.origine).toMatch(/^Source : ministère du Tourisme du Québec \(SIT Québec\), .*, licence CC BY 4\.0$/);
    }
    for (const l of lieux.filter((x) => x.id.startsWith('vque45-'))) expect(l.attribution).toBe('Source : Ville de Québec, Lieux de culte, licence CC BY 4.0');
  });
});

describe('chemin de la démo inchangé avec les lignes réelles', () => {
  const texte = fr.visite.texteCafe;
  const lancer = (ps: Profil[], ls: Lieu[]) => proposerAu(construireBesoin('commerce', texte, ps, choixDepuisTexte('commerce', texte, ps)), ps, ls, evenements, new Date('2026-10-15T12:00:00'));
  const avec = lancer(profils, lieux);
  const sans = lancer(profils.filter((p) => p.source !== 'ouvert'), lieux.filter((l) => !l.id.startsWith('vque45-')));
  it('café → 87 % avec Camille Vézina et Collectif Les Voisins en Scène', () => {
    const nom = (id: string) => profils.find((p) => p.id === id)?.nom;
    expect(avec[0].score).toBe(87);
    expect(avec[0].partenaires.slice(1).map((x) => nom(x.profilId)).sort()).toEqual(['Camille Vézina', 'Collectif Les Voisins en Scène']);
    expect(avec[0].titre).toBe('Exposition collaborative au Café Le Petit Détour');
  });
  const cle = (r: typeof avec) => r.map((p) => [p.titre, p.score, p.lieuId ?? '', ...p.partenaires.map((x) => x.profilId)].join('|'));
  it('les trois propositions du café sont identiques avec ou sans les lignes réelles', () => {
    expect(cle(avec)).toEqual(cle(sans));
  });
  it('Sofia (deuxième visite) : corvée à 74 % avec Équipe Propreté et Malik A., identique avec ou sans', () => {
    const b = besoinSofia(profils)!;
    const jour = new Date('2026-10-16T12:00:00');
    const a = proposerAu(b, profils, lieux, evenements, jour);
    const s = proposerAu(b, profils.filter((p) => p.source !== 'ouvert'), lieux.filter((l) => !l.id.startsWith('vque45-')), evenements, jour);
    expect(a[0].score).toBe(74);
    expect(a[0].partenaires.map((x) => x.profilId).sort()).toEqual(['p-etu-genie', 'p-proprete', 'p-sofia']);
    expect(cle(a)).toEqual(cle(s));
  });
});
