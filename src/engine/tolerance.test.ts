import { describe, expect, it } from 'vitest';
import { lireBesoin } from './lecture.ts';
import { distance } from './tolerance.ts';

describe('lecture tolérante: fautes et accents', () => {
  it('distance: un échange de lettres compte pour 1', () => {
    expect(distance('artsite', 'artiste')).toBe(1);
  });
  it.each(['artistes', 'artiste', 'artsite', 'Artistes!'])('« %s » → thème art', (m) => {
    expect(lireBesoin(`On cherche des ${m}`).themes).toContain('art');
  });
  it('« anmation » → animation', () => {
    expect(lireBesoin('on cherche de l anmation').besoins).toContain('animation');
  });
  it('« graffitti » → nettoyage (expertise, bénévoles, environnement)', () => {
    const r = lireBesoin('besoin d aide pour les graffittis sur le mur');
    expect(r.besoins).toEqual(expect.arrayContaining(['expertise', 'benevoles']));
    expect(r.themes).toContain('environnement');
  });
  it('« benevoles » sans accents → bénévoles', () => {
    expect(lireBesoin('nous cherchons des benevoles').besoins).toContain('benevoles');
  });
  it('« jeudi soire » → semaine_soir', () => {
    expect(lireBesoin('libre le jeudi soire').creneaux).toEqual(['semaine_soir']);
  });
  it('« on veut voir » → aucun créneau', () => {
    expect(lireBesoin('on veut voir').creneaux).toEqual([]);
  });
});

describe('lecture tolérante: anglais', () => {
  it('« we need volunteers for a cleanup on saturday »', () => {
    const r = lireBesoin('we need volunteers for a cleanup on saturday');
    expect(r.besoins).toEqual(expect.arrayContaining(['benevoles', 'expertise', 'materiel']));
    expect(r.themes).toContain('environnement');
    expect(r.creneaux).toEqual(['fin_de_semaine']);
  });
  it('artists + venue + tonight', () => {
    const r = lireBesoin('looking for a venue for artists tonight');
    expect(r.themes).toContain('art');
    expect(r.besoins).toContain('espace_interieur');
    expect(r.creneaux).toEqual(['semaine_soir']);
  });
  it('kids, garden, coffee, workshop, sunday morning', () => {
    const r = lireBesoin('a garden workshop for kids with coffee on sunday morning');
    expect(r.themes).toEqual(expect.arrayContaining(['jeunesse', 'environnement', 'alimentation']));
    expect(r.besoins).toEqual(expect.arrayContaining(['animation', 'nourriture']));
    expect(r.creneaux).toEqual(['fin_de_semaine']);
  });
});

describe('lecture tolérante: pas de fausses puces', () => {
  it.each([
    'Bonjour, je voulais juste vous dire merci pour tout.',
    'On commence la semaine prochaine, je vous écris pour une information.',
    'Il pense que la position de la maison est parfaite.',
    'Ma mère aime lire des romans policiers.',
    'Les affaires vont bien et on veut voir la suite.',
    'Il a publié une photo de son chien.',
  ])('« %s »', (t) => {
    const r = lireBesoin(t);
    expect([...r.besoins, ...r.offres, ...r.themes, ...r.creneaux]).toEqual([]);
  });
});
