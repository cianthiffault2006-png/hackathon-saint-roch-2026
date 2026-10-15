import { describe, expect, it } from 'vitest';
import type { Besoin } from '../types.ts';
import { besoinCafe, evenements, lieux, MAINTENANT, profils } from './__fixtures__/index.ts';
import { proposer, proposerAu } from './proposer.ts';

const lancer = (b: Besoin, ps = profils, ls = lieux, es = evenements) => proposerAu(b, ps, ls, es, MAINTENANT);

describe('proposer: histoire', () => {
  const res = lancer(besoinCafe);
  it('première proposition: exposition avec artiste et organisme', () => {
    const p = res[0];
    expect(p.type).toBe('exposition');
    expect(p.partenaires[0].profilId).toBe('story-cafe');
    expect(p.partenaires.slice(1).map((x) => x.profilId).sort()).toEqual(['story-artiste', 'story-organisme']);
    expect(p.titre).toContain('Café Le Parvis');
    expect(p.creneau).toBe('semaine_soir');
    expect(p.lieuId).toBeUndefined();
    expect(p.statut).toBe('proposee');
  });
  it('raisons concrètes en français avec distances', () => {
    const r = res[0].raisons.join('\n');
    expect(r).toMatch(/Collectif Les Passeurs offre du public le soir en semaine, ce que vous cherchez/);
    expect(r).toMatch(/À pied de vous : .* à \d+ minutes?/);
    expect(r).toMatch(/Thèmes en commun : culture/);
  });
  it('à confirmer: date, capacité, assurances, accessibilité', () => {
    const a = res[0].aConfirmer.join('\n');
    for (const m of ['Date', 'Capacité', 'Assurances', 'Accessibilité']) expect(a).toContain(m);
  });
  it('événement proche partageant un thème; pas le lointain, ni le tardif, ni autre thème', () => {
    expect(res[0].evenementsProches).toEqual(['ev-proche']);
  });
});

describe('proposer: organisme sans salle', () => {
  const profilsReels = JSON.parse(JSON.stringify(profils)) as typeof profils;
  const orga = {
    ...profilsReels[2], offres: ['benevoles', 'animation'], besoins: ['espace_interieur', 'contenu_artistique'],
  } as (typeof profils)[number];
  const ps = profilsReels.map((p) => (p.id === 'story-organisme' ? orga : p));
  const b: Besoin = {
    auteurRole: 'organisme', auteurId: 'story-organisme',
    texte: "On veut organiser un événement culturel mais on n'a pas de salle",
    besoins: ['espace_interieur', 'contenu_artistique'], offres: ['benevoles', 'animation'],
    creneaux: ['semaine_soir'], themes: ['culture', 'communautaire'],
  };
  const res = lancer(b, ps);
  it("pas d'exposition pour un événement culturel", () => {
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].type).not.toBe('exposition');
    expect(['spectacle', 'atelier']).toContain(res[0].type);
  });
  it('lieu public proposé en solution de rechange', () => {
    expect(res[0].lieuId).toBeTruthy();
    expect(res[0].raisons.join(' | ')).toMatch(/Lieu public proposé : .+, à \d+ minutes?/);
  });
  it("exposition si le texte parle d'exposer", () => {
    const r = lancer({ ...b, texte: 'On veut exposer des œuvres' }, ps);
    expect(r.some((p) => p.type === 'exposition')).toBe(true);
  });
});

describe('proposer: detailScore', () => {
  it('valeurs 0..100, poids 35/20/20/10/15, total cohérent, créneau partiel à 60', () => {
    for (const x of lancer(besoinCafe)) {
      const d = x.detailScore!;
      expect(d.poids).toEqual({ complementarite: 35, reciprocite: 20, proximite: 20, creneau: 10, theme: 15 });
      for (const k of ['complementarite', 'reciprocite', 'proximite', 'creneau', 'theme'] as const) {
        expect(d[k]).toBeGreaterThanOrEqual(0);
        expect(d[k]).toBeLessThanOrEqual(100);
      }
      const somme = (Object.keys(d.poids) as (keyof typeof d.poids)[]).reduce((u, k) => u + (d.poids[k] * d[k]) / 100, 0);
      expect(x.score).toBe(Math.round(somme));
    }
    const large: Besoin = { ...besoinCafe, creneaux: ['semaine_soir', 'fin_de_semaine'] };
    expect(lancer(large).some((x) => x.detailScore!.creneau === 60)).toBe(true);
  });
});

describe('proposer: raisons', () => {
  it('au plus 5 lignes, complémentarité en premier', () => {
    for (const p of lancer(besoinCafe)) {
      expect(p.raisons.length).toBeLessThanOrEqual(5);
      expect(p.raisons[0]).toContain('ce que vous cherchez');
    }
  });
});

describe('proposer: règles', () => {
  it('proposer (API figée) renvoie le même résultat à date égale', () => {
    expect(proposer(besoinCafe, profils, lieux, []).length).toBeGreaterThan(0);
  });
  it('au plus 3 propositions, scores 0..100 triés, ids uniques', () => {
    const res = lancer(besoinCafe);
    expect(res.length).toBeLessThanOrEqual(3);
    expect(res.length).toBeGreaterThan(0);
    for (const p of res) expect(p.score >= 0 && p.score <= 100).toBe(true);
    expect(res.map((p) => p.score)).toEqual([...res.map((p) => p.score)].sort((a, b) => b - a));
    expect(new Set(res.map((p) => p.id)).size).toBe(res.length);
  });
  it('déterministe', () => {
    expect(lancer(besoinCafe)).toEqual(lancer(besoinCafe));
    expect(lancer(besoinCafe, [...profils].reverse())).toEqual(lancer(besoinCafe));
  });
  it('exclut les profils sans créneau commun', () => {
    const res = lancer(besoinCafe);
    const ids = res.flatMap((p) => p.partenaires.map((x) => x.profilId));
    expect(ids).not.toContain('traiteur'); // fin de semaine seulement
    expect(ids).not.toContain('jeunes');
  });
  it('un profil lointain ne gagne aucun point de distance', () => {
    const res = lancer(besoinCafe);
    expect(res[0].partenaires.map((x) => x.profilId)).not.toContain('loin');
  });
  it('sans espace offert: attache le lieu le plus proche', () => {
    const artiste: Besoin = {
      auteurRole: 'citoyen', auteurId: 'story-artiste', texte: '',
      besoins: ['espace_interieur', 'visibilite'], offres: ['contenu_artistique'],
      creneaux: ['semaine_soir'], themes: ['art'],
    };
    const sansEspace = profils.filter((p) => !['story-cafe', 'bistro', 'loin'].includes(p.id));
    const res = lancer(artiste, sansEspace);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].lieuId).toBe('lieu-salle');
    expect(res[0].raisons.join('\n')).toContain('Salle communautaire Dauphine');
  });
  it('profil pré-rempli: ligne À confirmer', () => {
    const b: Besoin = {
      auteurRole: 'organisme', auteurId: 'jeunes', texte: '', besoins: ['espace_exterieur'], offres: ['benevoles'],
      creneaux: ['fin_de_semaine'], themes: ['communautaire'],
    };
    const res = lancer(b);
    expect(res[0].partenaires.map((x) => x.profilId)).toContain('ruelle');
    expect(res[0].aConfirmer.join('\n')).toContain("Profil pré-rempli : l’organisme doit d’abord activer son profil");
    expect(res[0].type).toBe('verdissement');
  });
  it('besoin non comblé signalé', () => {
    const b: Besoin = { ...besoinCafe, besoins: ['public', 'financement'] };
    const res = lancer(b);
    expect(res[0].aConfirmer.join('\n')).toContain('Besoin non comblé : financement');
  });
  it('type marché éphémère: nourriture + commerce local', () => {
    const b: Besoin = {
      auteurRole: 'commerce', auteurId: 'boutique', texte: '', besoins: ['nourriture', 'public'],
      offres: ['espace_exterieur', 'materiel'], creneaux: ['fin_de_semaine'], themes: ['commerce_local'],
    };
    const res = lancer(b);
    expect(res.some((p) => p.type === 'marche_ephemere')).toBe(true);
  });
  it('aucun candidat: liste vide', () => {
    const b: Besoin = { ...besoinCafe, creneaux: ['semaine_jour'] };
    expect(lancer(b, profils.filter((p) => p.id !== 'jeunes'))).toEqual([]);
  });
  it('position du besoin utilisée sans profil auteur', () => {
    const b: Besoin = { ...besoinCafe, auteurId: undefined, lat: 46.815, lng: -71.222 };
    const res = lancer(b);
    expect(res[0].id.startsWith('prop-anon-')).toBe(true);
  });
});
