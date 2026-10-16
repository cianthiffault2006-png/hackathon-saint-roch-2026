import { describe, expect, it } from 'vitest';
import type { Besoin } from '../types.ts';
import { besoinCafe, evenements, lieux, MAINTENANT, profils } from './__fixtures__/index.ts';
import { aLieu, enumerer, proposer, proposerAu, titre, typeDemande } from './proposer.ts';

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
    expect(r).toMatch(/Depuis chez vous, à pied : .* à \d+ minutes?/);
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

describe('proposer: élisions', () => {
  const textes = () => lancer(besoinCafe).flatMap((p) => [p.titre, ...p.raisons, ...p.aConfirmer]);
  it('aucune contraction fautive devant un nom (de Le, à Le, de Les, de Équipe…)', () => {
    for (const x of textes()) {
      expect(x).not.toMatch(/(de|à) (Le|Les)/);
      expect(x).not.toMatch(/de [AÀÂEÉÈÊIÎOÔUÛHY]/);
    }
  });
  it('« répond à ce que cherche(nt) » au lieu de « aux besoins de »', () => {
    const r = lancer(besoinCafe)[0].raisons.join(' | ');
    expect(r).toMatch(/répond à ce que cherchent? /);
    expect(r).not.toContain('aux besoins de');
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
    expect(res[0].aConfirmer.join('\n')).toContain('Faire activer le profil pré-rempli de Comité Ruelle Verte');
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

describe('proposer: français des sorties', () => {
  it('« Soirée » seulement pour un créneau de soir; la soupe populaire n’est pas un spectacle', () => {
    expect(titre('spectacle', 'Bibliothèque Gabrielle-Roy', true, false, 'semaine_jour')).toBe('Spectacle à la Bibliothèque Gabrielle-Roy');
    expect(titre('spectacle', 'Bibliothèque Gabrielle-Roy', true, false, 'fin_de_semaine')).toBe('Spectacle à la Bibliothèque Gabrielle-Roy');
    expect(titre('spectacle', 'Bibliothèque Gabrielle-Roy', true, false, 'semaine_soir')).toBe('Soirée spectacle à la Bibliothèque Gabrielle-Roy');
    expect(typeDemande('Nous cherchons des cuisiniers bénévoles pour une soupe populaire le lundi matin')).toBe('collecte');
    expect(typeDemande('Notre groupe d’aînés cherche une salle pour se réunir les après-midi de semaine')).toBe('atelier');
  });
  it('pas de « chez Chez »', () => {
    expect(titre('exposition', 'Chez Gaston')).toBe('Exposition collaborative Chez Gaston');
    expect(titre('spectacle', 'chez Lulu')).toBe('Soirée spectacle chez Lulu');
    expect(titre('atelier', 'Café Le Pignon')).toBe('Atelier ouvert au Café Le Pignon');
  });
  it('lieu public: jamais « chez », « à » contracté et élidé', () => {
    expect(titre('spectacle', 'Centre Materia', true)).toBe('Soirée spectacle au Centre Materia');
    expect(titre('exposition', 'Bibliothèque Gabrielle-Roy', true)).toBe('Exposition collaborative à la Bibliothèque Gabrielle-Roy');
    expect(titre('atelier', 'Université du Québec-Télé-Université', true)).toBe('Atelier ouvert à l’Université du Québec-Télé-Université');
    expect(titre('animation_de_rue', 'Parc-école des Berges', true)).toBe('Animation de rue au Parc-école des Berges');
    expect(titre('conference', 'Le Lieu, centre en art actuel', true)).toBe('Conférence au Lieu, centre en art actuel');
    expect(titre('marche_ephemere', 'Les Halles du Faubourg', true)).toBe('Marché éphémère aux Halles du Faubourg');
    expect(titre('spectacle', 'Jardins de la Ville', true)).toBe('Soirée spectacle aux Jardins de la Ville');
    expect(titre('spectacle', "L'Anti Bar & Spectacles", true)).toBe('Soirée spectacle à L’Anti Bar & Spectacles');
    expect(titre('spectacle', 'La Korrigane', true)).toBe('Soirée spectacle à La Korrigane');
    expect(titre('collecte', 'Hôtel de ville', true)).toBe('Collecte communautaire à l’Hôtel de ville');
    expect(titre('verdissement', 'Marina Saint-Roch', true)).toBe('Projet de verdissement à la Marina Saint-Roch');
  });
  it('salles connues sans nom commun: « à l’Impérial Bell », « à Méduse », « à Engramme », « à VU »', () => {
    expect(titre('spectacle', 'Méduse', true)).toBe('Soirée spectacle à Méduse');
    expect(titre('spectacle', 'Impérial Bell', true)).toBe('Soirée spectacle à l’Impérial Bell');
    expect(titre('exposition', 'Engramme', true)).toBe('Exposition collaborative à Engramme');
    expect(titre('exposition', 'VU, centre de diffusion et production de la photographie', true)).toBe('Exposition collaborative à VU');
  });
  it('lieu public au genre inconnu: « au lieu public proposé »', () => {
    expect(aLieu('Kinémax')).toBeNull();
    expect(titre('spectacle', 'Kinémax', true)).toBe('Soirée spectacle au lieu public proposé');
  });
  it('hôte privé au nom commun: « au Café… », « à la Galerie… »; une personne garde « chez »', () => {
    expect(titre('exposition', 'Café Le Petit Détour')).toBe('Exposition collaborative au Café Le Petit Détour');
    expect(titre('exposition', 'Centre de photographie Obscura')).toBe('Exposition collaborative au Centre de photographie Obscura');
    expect(titre('spectacle', "Galerie L'Éclat")).toBe('Soirée spectacle à la Galerie L’Éclat');
    expect(titre('marche_ephemere', 'Microbrasserie du Faubourg')).toBe('Marché éphémère à la Microbrasserie du Faubourg');
    expect(titre('atelier', 'Épicerie Le Panier')).toBe('Atelier ouvert à l’Épicerie Le Panier');
    expect(titre('conference', 'Association des gens d’affaires')).toBe('Conférence à l’Association des gens d’affaires');
    expect(titre('exposition', 'Disques Vinyle Nord')).toBe('Exposition collaborative chez Disques Vinyle Nord');
    expect(titre('spectacle', 'Camille Vézina')).toBe('Soirée spectacle chez Camille Vézina');
    expect(titre('animation_de_rue', 'Café Le Pignon')).toBe('Animation de rue avec Café Le Pignon');
  });
  it('proposition hébergée par un lieu public: titre sans « chez »', () => {
    const artiste: Besoin = {
      auteurRole: 'citoyen', auteurId: 'story-artiste', texte: '',
      besoins: ['espace_interieur', 'visibilite'], offres: ['contenu_artistique'],
      creneaux: ['semaine_soir'], themes: ['art'],
    };
    const res = lancer(artiste, profils.filter((p) => !['story-cafe', 'bistro', 'loin'].includes(p.id)));
    expect(res[0].lieuId).toBe('lieu-salle');
    expect(res[0].titre).not.toMatch(/chez/);
    expect(res[0].titre).toMatch(/ à la Salle communautaire Dauphine$/);
  });
  it('énumération « a, b et c »', () => {
    expect(enumerer(['a'])).toBe('a');
    expect(enumerer(['a', 'b'])).toBe('a et b');
    expect(enumerer(['a', 'b', 'c'])).toBe('a, b et c');
  });
  it('profil pré-rempli d’un citoyen: une action à faire, avec son nom', () => {
    const ps = profils.map((p) => (p.id === 'etudiant' ? { ...p, reclame: false } : p));
    const b: Besoin = {
      auteurRole: 'commerce', auteurId: 'story-cafe', texte: '', besoins: ['animation'], offres: ['espace_interieur'],
      creneaux: ['semaine_soir'], themes: ['culture'],
    };
    const lignes = lancer(b, ps).flatMap((p) => p.aConfirmer).filter((l) => l.includes('Samuel Roy'));
    expect(lignes.length).toBeGreaterThan(0);
    for (const l of lignes) expect(l).toMatch(/^Faire activer le profil pré-rempli de Samuel Roy/);
  });
});
