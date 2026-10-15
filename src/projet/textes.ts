import type { TypeProjet } from '../types'

export const t = {
  demo: 'Démo simulée',
  retour: 'Retour',
  fil: {
    titre: 'Coordination du projet',
    onglets: { participants: 'Participants', maj: 'Mises à jour', discussion: 'Discussion' },
    organisateur: 'Organisateur',
    accepte: 'Accepté',
    enAttente: 'En attente',
    vous: 'vous',
    apresAcceptation: 'Coordonnées partagées après acceptation',
    fictives: 'coordonnées fictives',
    courriel: 'Courriel',
    texto: 'Texto',
    whatsapp: 'WhatsApp',
    inviter: 'Inviter quelqu’un',
    objetInvitation: (titre: string) => `Invitation au projet Maillage : ${titre}`,
    texteInvitation: (titre: string) => `Bonjour, je vous invite à rejoindre le projet « ${titre} » sur Maillage.`,
    inviteCopie: 'Invitation prête. Rien n’est envoyé sans votre choix.',
    nouvelleMaj: 'Publier une mise à jour',
    majTitre: 'Titre',
    majTexte: 'Texte',
    majPublier: 'Publier',
    majReserve: 'Seul l’organisateur peut publier une mise à jour.',
    majVide: 'Aucune mise à jour pour le moment.',
    msgPlaceholder: 'Écrire au groupe',
    msgEnvoyer: 'Envoyer',
    msgLimite: (n: number) => `${n} / 500 caractères`,
    prochain: (s: number) => `Prochain message dans ${s} s`,
    pause: (s: number) => `Pause de ${s} s pour éviter les pourriels`,
    majLancement: 'Projet lancé',
    majLancementTexte: (partenaires: string) => `Partenaires : ${partenaires}. Prochaine étape : confirmer la date et le lieu ensemble.`,
    preRempli: 'Profil pré-rempli : coordonnées partagées après activation',
    msgOuverture: 'Bonjour tout le monde, ravi de lancer ce projet avec vous!',
    msgQuestion: 'Quelles dates vous conviendraient?',
    msgSuite: 'Parfait pour moi. On confirme la date cette semaine.',
    msgReponse: 'Bien reçu, je regarde mes disponibilités et je vous reviens.',
    signaler: 'Signaler',
    signale: 'Message signalé, en attente de modération',
    simule: 'simulé',
    moderation: 'En pilote, la SDC modère les signalements.',
    aucunMsg: 'Aucun message.',
  },
  nouveau: {
    titre: 'Proposer un projet ouvert',
    intro: 'Décrivez votre idée et les rôles dont vous avez besoin. Les personnes intéressées pourront se joindre au projet.',
    exemple: 'Exemple : corvée graffitis rue Saint-Joseph',
    champTitre: 'Titre du projet',
    champDescription: 'Description',
    champType: 'Type de projet',
    champCreneau: 'Quand',
    champLieu: 'Lieu public',
    lieuTbd: 'À déterminer',
    roles: 'Rôles recherchés',
    trouver: 'Trouver des partenaires',
    partenaires: 'Partenaires possibles',
    aucun: 'Aucun profil ne correspond pour le moment.',
    inviter: 'Inviter',
    invite: 'Invité',
    pasDeNom: 'Choisissez au moins un rôle recherché.',
    avant: 'Avant de commencer',
    creer: 'Créer le projet',
    titreRequis: 'Ajoutez un titre pour créer le projet.',
    urgence:
      'Urgence ou crime : composez le 911. Pour un problème sur la voie publique : 311 (Ville de Québec). Maillage sert aux projets collaboratifs du quartier.',
    apportVous: 'Organise le projet',
    apportPour: (role: string) => `Peut aider : ${role.toLowerCase()}`,
    aConfirmerDate: 'Date et heure à confirmer avec les partenaires',
    aConfirmerLieu: 'Lieu à confirmer',
    distance: (m: number) => (m < 1000 ? `à ${Math.round(m / 10) * 10} m` : `à ${(m / 1000).toFixed(1).replace('.', ',')} km`),
  },
  exemple: {
    titre: 'Corvée graffitis rue Saint-Joseph',
    description:
      'Enlever les graffitis et nettoyer les abords de la rue Saint-Joseph avec des voisins, des commerçants et un organisme du quartier.',
  },
}

const generique = [
  'Autorisation du propriétaire ou du gestionnaire du lieu',
  'Assurance responsabilité ou entente avec un organisme reconnu',
  'Avertir les voisins et les commerces proches',
]

const parType: Record<TypeProjet, string[]> = {
  exposition: ['Accord du lieu pour accrocher les œuvres', 'Assurance des œuvres exposées', 'Droits d’auteur et consentement des artistes'],
  spectacle: ['Permis de bruit et d’événement auprès de la Ville', 'Capacité du lieu et sorties de secours', 'Droits de diffusion de la musique'],
  atelier: ['Matériel et espace adaptés au nombre de participants', 'Accord des parents si des mineurs participent', 'Trousse de premiers soins'],
  marche_ephemere: ['Permis d’occupation du domaine public (Ville)', 'Permis alimentaire du MAPAQ si de la nourriture est vendue', 'Plan d’installation des kiosques'],
  animation_de_rue: ['Permis d’événement sur la voie publique (Ville)', 'Plan de circulation et de sécurité', 'Capacité de l’espace et accessibilité'],
  verdissement: ['Autorisation du propriétaire du terrain', 'Vérifier les services souterrains avant de creuser (Info-Excavation)', 'Plan d’arrosage et d’entretien après la plantation'],
  conference: ['Réservation de la salle et de l’équipement', 'Accessibilité du lieu', 'Confirmation des conférenciers'],
  corvee_proprete: ['Autorisation du propriétaire pour les graffitis sur un bâtiment privé', 'Signaler au 311 de la Ville ce qui relève de la Ville (mobilier urbain, voie publique)', 'Matériel de sécurité (gants, sacs, dossards)'],
  collecte: ['Autorisation du lieu de dépôt', 'Entente avec l’organisme qui reçoit les dons ou les matières', 'Matériel de sécurité (gants, sacs, dossards)'],
}

const nettoyage = [
  'Autorisation du propriétaire pour les graffitis sur un bâtiment privé',
  'Signaler au 311 de la Ville ce qui relève de la Ville (mobilier urbain, voie publique)',
  'Matériel de sécurité',
]

/** Checklist for the chosen type; cleanup ideas (graffiti, nettoyage, corvée) get their own items first. */
export function listeAvant(type: TypeProjet, texte: string): string[] {
  const res: string[] = []
  if (/graffiti|nettoy|corv[ée]e|propret/i.test(texte)) res.push(...nettoyage)
  for (const x of [...parType[type], ...generique]) if (!res.includes(x)) res.push(x)
  return res.slice(0, 6)
}

const DANGER = /(^|[^\p{L}])(danger\p{L}*|vols?|vol[ée]\p{L}*|voleurs?|crim\p{L}*|urgen\p{L}*|agress\p{L}*|menac\p{L}*|armes?)(?![\p{L}])/iu
export const mentionneDanger = (texte: string): boolean => DANGER.test(texte)
