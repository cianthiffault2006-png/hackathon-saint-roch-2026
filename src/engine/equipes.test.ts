import { describe, expect, it } from 'vitest';
import type { Besoin, Creneau, Evenement, Lieu, Profil, Role, Tag } from '../types.ts';
import { proposerAu } from './proposer.ts';

// Taille d'équipe variable et diversité, sur public/data (comme donnees-reelles.test.ts).
const brut = import.meta.glob('../../public/data/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const lire = <T,>(f: string): T => JSON.parse(brut[`../../public/data/${f}`]) as T;
const profils = lire<Profil[]>('profils.json');
const lieux = lire<Lieu[]>('lieux.json');
const evenements = lire<Evenement[]>('evenements.json');
const lancer = (auteurRole: Role, besoins: Tag[], creneau: Creneau, offres: Tag[] = []) => proposerAu(
  { auteurRole, texte: '', besoins, offres, creneaux: [creneau], themes: [], lat: 46.8139, lng: -71.224 } satisfies Besoin,
  profils, lieux, evenements, new Date('2026-10-15T12:00:00'),
);
const ids = (p: { partenaires: { profilId: string }[] }) => p.partenaires.slice(1).map((x) => x.profilId).sort().join('+');

describe('taille d’équipe selon la compatibilité', () => {
  it('à deux: un seul partenaire couvre tout et fait mieux qu’un trio', () => {
    const [p] = lancer('commerce', ['visibilite', 'affichage'], 'semaine_jour');
    expect(p.partenaires).toHaveLength(2);
    expect(p.detailScore?.complementarite).toBe(100);
  });
  it('à quatre: le quatrième comble un besoin encore ouvert et partage un créneau', () => {
    const [p] = lancer('commerce', ['visibilite', 'materiel', 'public'], 'semaine_soir');
    expect(p.partenaires).toHaveLength(4);
    const membres = p.partenaires.slice(1).map((c) => profils.find((x) => x.id === c.profilId)!);
    expect(membres.every((m) => m.creneaux.includes(p.creneau))).toBe(true);
    // Chaque membre apporte au moins un des besoins demandés.
    expect(membres.every((m) => m.offres.some((t) => ['visibilite', 'materiel', 'public'].includes(t)))).toBe(true);
  });
});

describe('diversité entre demandes', () => {
  const entrees: [Role, Tag[], Creneau][] = [
    ['commerce', ['animation'], 'semaine_soir'],
    ['organisme', ['espace_interieur', 'public'], 'fin_de_semaine'],
    ['citoyen', ['materiel', 'benevoles'], 'fin_de_semaine'],
    ['commerce', ['visibilite', 'materiel', 'public'], 'semaine_soir'],
    ['organisme', ['expertise', 'financement'], 'semaine_jour'],
  ];
  const res = entrees.map(([r, b, c]) => lancer(r, b, c));
  it('5 demandes différentes: 5 équipes de tête distinctes, 3 types au moins', () => {
    console.log(res.map((r) => `${r[0].type} ${r[0].score} ${r[0].partenaires.length} ${ids(r[0])}`).join(' // '));
    expect(new Set(res.map((r) => ids(r[0]))).size).toBe(5);
    expect(new Set(res.map((r) => r[0].type)).size).toBeGreaterThanOrEqual(3);
  });
  it('dans chaque demande, le top 3 ne répète pas un ensemble de partenaires', () => {
    for (const r of res) expect(new Set(r.map(ids)).size).toBe(r.length);
  });
});
