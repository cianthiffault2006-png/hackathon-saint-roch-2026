import { describe, expect, it } from 'vitest';
import { lireBesoin } from './lecture.ts';

const cas = (t: string) => lireBesoin(t);

describe('lireBesoin: histoire', () => {
  it('café: espace libre le jeudi soir, attirer du monde', () => {
    const r = cas('On a un espace libre le jeudi soir et on aimerait attirer du monde');
    expect(r.offres).toContain('espace_interieur');
    expect(r.besoins).toContain('public');
    expect(r.besoins).not.toContain('espace_interieur');
    expect(r.creneaux).toEqual(['semaine_soir']);
  });
  it('artiste: exposer mes œuvres', () => {
    const r = cas('Je cherche un endroit pour exposer mes œuvres');
    expect(r.besoins).toEqual(expect.arrayContaining(['espace_interieur', 'visibilite']));
    expect(r.themes).toContain('art');
    expect(r.offres).toContain('contenu_artistique');
  });
  it("organisme: pas de salle", () => {
    const r = cas("On veut organiser un événement culturel mais on n'a pas de salle");
    expect(r.besoins).toContain('espace_interieur');
    expect(r.offres).not.toContain('espace_interieur');
    expect(r.themes).toContain('culture');
  });
});

describe('lireBesoin: intention', () => {
  it.each([
    ['Nous cherchons des bénévoles pour la fête', 'besoins', 'benevoles'],
    ["J'ai besoin de chaises et de tables", 'besoins', 'materiel'],
    ['On aimerait plus de clientèle', 'besoins', 'public'],
    ['Recherche subvention pour notre projet', 'besoins', 'financement'],
    ['On voudrait faire connaître notre boutique', 'besoins', 'visibilite'],
    ['Besoin d’affichage dans le quartier', 'besoins', 'affichage'],
    ['Il nous manque de la sono', 'besoins', 'materiel'],
    ['Je cherche un traiteur', 'besoins', 'nourriture'],
    ['Une terrasse serait idéale', 'besoins', 'espace_exterieur'],
    ['Du monde pour notre atelier', 'besoins', 'public'],
    ["On offre notre terrasse en fin de semaine", 'offres', 'espace_exterieur'],
    ['Disponible pour animer un atelier', 'offres', 'animation'],
    ["Peut accueillir un spectacle de musique", 'offres', 'animation'],
    ["On prête des chaises et une sono", 'offres', 'materiel'],
    ["J'ai du temps, je peux aider comme bénévole", 'offres', 'benevoles'],
    ['On offre du café et de la bouffe', 'offres', 'nourriture'],
    ["J'ai une salle disponible", 'offres', 'espace_interieur'],
  ] as const)('%s', (t, cle, tag) => {
    expect(cas(t)[cle]).toContain(tag);
    expect(cas(t)[cle === 'besoins' ? 'offres' : 'besoins']).not.toContain(tag);
  });
  it('clause sans marqueur: besoin par défaut', () => {
    expect(cas('Une salle pour 30 personnes').besoins).toContain('espace_interieur');
  });
  it('insensible aux accents et à la casse', () => {
    expect(cas('BENEVOLES').besoins).toContain('benevoles');
    expect(cas('Bénévoles').besoins).toContain('benevoles');
    expect(cas('EXPOSITION').besoins).toContain('visibilite');
  });
  it('deux clauses opposées', () => {
    const r = cas("J'ai une salle libre mais je cherche des bénévoles");
    expect(r.offres).toContain('espace_interieur');
    expect(r.besoins).toContain('benevoles');
  });
});

describe('lireBesoin: propreté', () => {
  it.each([
    'Il y a des graffitis sur ma rue',
    'On aimerait organiser un nettoyage du trottoir',
    'Des déchets partout, il faut ramasser',
    'Les vitrines sales nuisent au commerce',
  ])('%s', (t) => {
    const r = lireBesoin(t);
    expect(r.besoins).toEqual(expect.arrayContaining(['expertise', 'materiel', 'benevoles']));
    expect(r.themes).toEqual(expect.arrayContaining(['environnement', 'securite']));
  });
});

describe('lireBesoin: créneaux et thèmes', () => {
  it.each([
    ['jeudi soir', ['semaine_soir']],
    ['le soir après le travail', ['semaine_soir']],
    ['samedi', ['fin_de_semaine']],
    ['samedi soir', ['fin_de_semaine']],
    ['dimanche après-midi', ['fin_de_semaine']],
    ['la fin de semaine', ['fin_de_semaine']],
    ['mardi midi', ['semaine_jour']],
    ['mercredi après-midi', ['semaine_jour']],
    ['jeudi soir ou samedi', ['fin_de_semaine', 'semaine_soir']],
    ['les jeudis soirs', ['semaine_soir']],
    ['le jeudi en soirée', ['semaine_soir']],
    ['la soirée du jeudi', ['semaine_soir']],
    ['le soir du mardi', ['semaine_soir']],
    ['le matin du jeudi', ['semaine_jour']],
    ['jeudi matin', ['semaine_jour']],
    ['la soirée du samedi', ['fin_de_semaine']],
    ['dimanche matin', ['fin_de_semaine']],
    ['vendredi soir le samedi', ['fin_de_semaine', 'semaine_soir']],
    ['jeudi', ['semaine_jour']],
    ['une soirée concert samedi', ['fin_de_semaine']],
    ['samedi, le soir', ['fin_de_semaine']],
    ['le jeudi, de préférence le soir', ['semaine_jour', 'semaine_soir']],
  ] as const)('créneau %s', (t, att) => {
    expect([...cas(t).creneaux].sort()).toEqual([...att].sort());
  });
  it.each([
    ['des activités pour les jeunes', 'jeunesse'],
    ['pour les étudiants du cégep', 'etudiants'],
    ['verdissement de la ruelle', 'environnement'],
    ['améliorer le sentiment de sécurité', 'securite'],
    ['un tournoi de sport', 'sport'],
    ['une exposition de peinture', 'art'],
    ['un événement culturel', 'culture'],
    ['pour les commerçants du quartier', 'commerce_local'],
    ['de la bouffe de rue', 'alimentation'],
    ['une activité communautaire', 'communautaire'],
  ] as const)('thème %s', (t, th) => {
    expect(cas(t).themes).toContain(th);
  });
  it('texte vide', () => {
    expect(cas('')).toEqual({ besoins: [], offres: [], creneaux: [], themes: [] });
  });
});

describe('lireBesoin: extérieur et expo', () => {
  it.each([
    'Je cherche un espace extérieur pour un spectacle de danse',
    'Je veux organiser une soirée de musique en plein air',
    'On cherche un lieu à l’extérieur pour une projection',
  ])('« %s » lit un espace extérieur, pas intérieur', (t) => {
    const r = cas(t);
    expect(r.besoins).toContain('espace_exterieur');
    expect(r.besoins).not.toContain('espace_interieur');
  });
  it('« des cours de yoga » ne sont pas une cour', () => {
    const r = cas('J’offre des cours de yoga, je cherche une salle le matin');
    expect(r.offres).not.toContain('espace_exterieur');
    expect(r.besoins).toContain('espace_interieur');
  });
  it('« expo » court compte comme une exposition', () => {
    const r = cas('Je cherche du public pour mon expo');
    expect(r.besoins).toEqual(expect.arrayContaining(['visibilite', 'public']));
    expect(r.themes).toContain('art');
  });
});

describe('lireBesoin: questions du jury (vocabulaire élargi)', () => {
  it.each([
    ["Je viens d'ouvrir un café sur Saint-Joseph, je cherche des musiciens le samedi", ['animation', 'nourriture'], ['fin_de_semaine']],
    ["Je veux réparer mon toit avant l'hiver, je cherche un couvreur", [], []],
    ['Nous cherchons des cuisiniers bénévoles pour une soupe populaire le lundi matin', ['benevoles', 'nourriture'], ['semaine_jour']],
    ['Je cherche des vélos usagés pour un atelier de réparation avec des ados', ['animation', 'expertise', 'materiel'], []],
    ['Je fais du yoga et je cherche une salle le dimanche matin pour un cours gratuit', ['espace_interieur'], ['fin_de_semaine']],
    ["Je veux apprendre le mandarin avec d'autres personnes du quartier", ['expertise', 'public'], []],
  ] as const)('%s', (t, besoins, creneaux) => {
    const r = cas(t);
    expect([...r.besoins].sort()).toEqual([...besoins].sort());
    expect([...r.creneaux].sort()).toEqual([...creneaux].sort());
  });
  it('vélos et ados: thèmes sport et jeunesse', () => {
    expect(cas('Je cherche des vélos usagés pour un atelier de réparation avec des ados').themes).toEqual(expect.arrayContaining(['sport', 'jeunesse']));
  });
  it('soupe populaire: alimentation et communautaire', () => {
    expect(cas('Nous cherchons des cuisiniers bénévoles pour une soupe populaire').themes).toEqual(expect.arrayContaining(['alimentation', 'communautaire']));
  });
});
