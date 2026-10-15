// Fil en direct (bêta): a real shared project thread on Supabase, off unless two env vars exist.
// supabase-js is imported dynamically, only when a live thread opens, so the main bundle stays small.
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMOS, ID_DEMO_SOFIA } from './projets'
import { ecrire, lire } from '../projet/stockage'

export type StatutFil = 'connecte' | 'hors_ligne' | 'erreur' | 'desactive'
export type CodeErreur =
  | 'fil_delai'
  | 'fil_achalande'
  | 'fil_repetition'
  | 'fil_lien'
  | 'fil_coordonnees'
  | 'fil_sature'
  | 'signal_limite'
  | 'invalide'
  | 'reseau'
  | 'inconnu'
export type Resultat = { ok: true } | { ok: false; code: CodeErreur }

export interface MessageDirect {
  id: string
  auteur: string
  texte: string
  ts: number
  /** Sent from this device (computed by the server; author ids never reach the client). */
  deMoi: boolean
}

export interface ConfigFil {
  url: string
  cle: string
}

/** Enabled only when both variables exist (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY). */
export function configFil(env: Record<string, unknown> = import.meta.env): ConfigFil | null {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : ''
  const cle = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : ''
  if (!/^https?:\/\/\S+$/.test(url) || !cle) return null
  return { url: url.replace(/\/+$/, ''), cle }
}

/**
 * The jury demo stays simulated, always: the café story, Sofia's corvée and the tour's thread
 * (`visite-…`). Accepts a proposition id or a project key (`<id>|<titre>`).
 */
export function estDemo(id: string): boolean {
  const base = id.split('|')[0]
  return Object.hasOwn(DEMOS, base) || base === ID_DEMO_SOFIA || base.startsWith('visite-')
}

/** Live thread ids (see nouvelIdFil): f- then letters, digits, - and _; the server enforces the same pattern. */
export function idFilValide(id: string): boolean {
  return /^f-[A-Za-z0-9_-]{8,120}$/.test(id) && id.length <= 120 && !estDemo(id)
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
/** Random text from crypto.getRandomValues (works on plain http too, unlike randomUUID). */
export function aleatoire(n: number): string {
  const octets = new Uint8Array(n)
  crypto.getRandomValues(octets)
  return Array.from(octets, (x) => ALPHABET[x % ALPHABET.length]).join('')
}

/**
 * A thread id per project and device, not the proposition id: proposition ids are built from the
 * profiles (`prop-<asker>-<partners>`), so everyone who picks the same role would share one thread,
 * and anyone could guess it. The random id makes the shared link the way in.
 */
export const nouvelIdFil = (): string => `f-${aleatoire(22)}`

// Device-local preferences (localStorage with a memory fallback).
const CLE_APPAREIL = 'maillage.direct.appareil'
const CLE_NOM = 'maillage.direct.nom'
const cleBascule = (cleProjet: string) => `maillage.pj.direct.${cleProjet}`

export function idAppareil(): string {
  const id = lire<string>(CLE_APPAREIL, '')
  if (/^[a-z0-9]{8,64}$/.test(id)) return id
  const nouveau = aleatoire(24)
  ecrire(CLE_APPAREIL, nouveau)
  return nouveau
}

export const lireNom = (): string => lire<string>(CLE_NOM, '').slice(0, 40)
export function ecrireNom(nom: string): string {
  const propre = nom.trim().replace(/\s+/g, ' ').slice(0, 40)
  if (propre) ecrire(CLE_NOM, propre)
  return propre
}

export interface Bascule {
  actif: boolean
  filId: string
}
export function lireBascule(cleProjet: string): Bascule | null {
  const b = lire<Bascule | null>(cleBascule(cleProjet), null)
  return b && typeof b.actif === 'boolean' && typeof b.filId === 'string' && idFilValide(b.filId) ? b : null
}
/** Turning it on the first time creates the thread id; turning it off keeps it for later. */
export function ecrireBascule(cleProjet: string, actif: boolean): Bascule {
  const b: Bascule = { actif, filId: lireBascule(cleProjet)?.filId ?? nouvelIdFil() }
  ecrire(cleBascule(cleProjet), b)
  return b
}

// Deep link: #fil/<filId>?t=<titre>, opened by src/projet/Aiguillage.tsx on any device.
export function lienFil(filId: string, titre: string, lieu: Pick<Location, 'origin' | 'pathname' | 'search'> = window.location): string {
  return `${lieu.origin}${lieu.pathname}${lieu.search}#fil/${encodeURIComponent(filId)}?t=${encodeURIComponent(titre.slice(0, 120))}`
}

export function lireLienFil(hash: string): { filId: string; titre: string } | null {
  const m = /^#fil\/([^?]*)(?:\?(.*))?$/.exec(hash)
  if (!m) return null
  let filId = m[1]
  try {
    filId = decodeURIComponent(filId)
  } catch {
    // Malformed escape: keep the raw text, idFilValide will refuse it.
  }
  let titre = ''
  try {
    titre = new URLSearchParams(m[2] ?? '').get('t') ?? ''
  } catch {
    titre = ''
  }
  return { filId, titre: titre.trim().slice(0, 120) }
}

/** The link « Inviter quelqu’un » shares, when this project's live thread is on. */
export function lienDirect(cleProjet: string, titre: string, config: ConfigFil | null = configFil()): string | null {
  if (!config || estDemo(cleProjet)) return null
  const b = lireBascule(cleProjet)
  return b?.actif ? lienFil(b.filId, titre) : null
}

/** navigator.share, else the clipboard; 'manuel' means the caller shows the link to copy by hand. */
export async function partagerLien(url: string, titre: string, texte: string): Promise<'partage' | 'annule' | 'copie' | 'manuel'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: titre, text: texte, url })
      return 'partage'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'annule'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copie'
  } catch {
    return 'manuel'
  }
}

/** Server error (PostgREST shape) or thrown error → a code the UI turns into French. */
export function codeErreur(e: unknown): CodeErreur {
  if (!e || typeof e !== 'object') return 'inconnu'
  const { code, message } = e as { code?: unknown; message?: unknown }
  const texte = typeof message === 'string' ? message : ''
  const cle = /\b(fil_(?:delai|achalande|repetition|lien|coordonnees|sature)|signal_limite)\b/.exec(texte)
  if (cle) return cle[1] as CodeErreur
  if (code === '23514' || code === '23502' || code === '22001' || code === '22023') return 'invalide'
  if (e instanceof TypeError || /fetch|network|load failed|réseau/i.test(texte) || code === '' || code === undefined) return 'reseau'
  return 'inconnu'
}

// The slice of supabase-js this module uses: a seam for tests, nothing more.
// Reads and writes go through RPCs (lire_fil, envoyer_message, signaler): the API has no access to
// the table, so a thread is readable only with its id, and author ids never leave the server.
interface Ligne {
  id: string
  auteur: string
  texte: string
  cree_le: string
  de_moi?: boolean
}
interface Reponse<T> {
  data: T | null
  error: { code?: string; message?: string } | null
}
export interface CanalFil {
  on(type: string, filtre: Record<string, unknown>, rappel: (charge: { payload?: unknown }) => void): CanalFil
  subscribe(rappel?: (statut: string) => void): CanalFil
  send(message: { type: 'broadcast'; event: string; payload: unknown }): Promise<unknown>
}
export interface ClientFil {
  rpc(fn: 'lire_fil' | 'envoyer_message' | 'signaler', args: Record<string, string>): PromiseLike<Reponse<unknown>>
  channel(nom: string): CanalFil
  removeChannel(canal: CanalFil): unknown
}

/** Fallback when no broadcast arrives (blocked WebSocket, missed ping). */
export const RELECTURE_MS = 20_000
const ECART_MIN_MS = 1_000

let clientPromis: Promise<ClientFil> | null = null
/** One client per page, created on first use. */
export function clientPartage(config: ConfigFil | null = configFil()): Promise<ClientFil> {
  if (!config) return Promise.reject(new Error('desactive'))
  if (!clientPromis) {
    const promis = import('@supabase/supabase-js').then(
      ({ createClient }) =>
        createClient(config.url, config.cle, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        }) as unknown as ClientFil,
    )
    promis.catch(() => {
      if (clientPromis === promis) clientPromis = null
    })
    clientPromis = promis
  }
  return clientPromis
}

export interface EtatFil {
  messages: MessageDirect[]
  statut: Exclude<StatutFil, 'desactive'>
  chargement: boolean
  /** True once the thread has loaded at least once: a later drop keeps the live view. */
  dejaConnecte: boolean
}

/** Server timestamps have microseconds, which older Safari cannot parse: keep milliseconds, else now. */
export function horodatage(iso: string): number {
  const ts = Date.parse(iso.replace(/(\.\d{3})\d+/, '$1'))
  return Number.isFinite(ts) ? ts : Date.now()
}
const estLigne = (x: unknown): x is Ligne =>
  !!x &&
  typeof x === 'object' &&
  typeof (x as Ligne).id === 'string' &&
  typeof (x as Ligne).texte === 'string' &&
  typeof (x as Ligne).auteur === 'string' &&
  typeof (x as Ligne).cree_le === 'string'
const versMessage = (l: Ligne): MessageDirect => ({ id: l.id, auteur: l.auteur, texte: l.texte, ts: horodatage(l.cree_le), deMoi: l.de_moi === true })

export interface Fil {
  envoyer(texte: string, auteur: string): Promise<Resultat>
  /** Hides the message for everyone; the server allows 10 reports an hour per device. */
  signaler(id: string): Promise<Resultat>
  /** Browser online/offline events. */
  reseau(enLigne: boolean): void
  fermer(): void
}

/**
 * Opens one live thread. lire_fil is the only source of messages: a broadcast `maj` on fil:<id>
 * (sent after a post or a report) only triggers a re-read and is never trusted as content.
 * Re-reads also happen on reconnection and every 20 s.
 */
export function ouvrirFil(projetId: string, fournir: () => Promise<ClientFil>, notifier: (e: EtatFil) => void, appareil: () => string): Fil {
  let messages: MessageDirect[] = []
  let chargement = true
  let dejaConnecte = false
  let charge = false // last read succeeded
  let refuse = false // the server answered with an error
  let horsLigne = false // the browser says it is offline
  let ferme = false
  let client: ClientFil | null = null
  let canal: CanalFil | null = null
  let enCours = false
  let encore = false
  let dernierFin = 0
  let suite: ReturnType<typeof setTimeout> | undefined
  // Messages this device just posted, with when they were added (kept if a read started before).
  const ajoutsLocaux = new Map<string, number>()

  function publier() {
    if (ferme) return
    const statut = refuse ? 'erreur' : charge && !horsLigne ? 'connecte' : 'hors_ligne'
    notifier({ messages, statut, chargement, dejaConnecte })
  }

  function plusTard() {
    if (suite !== undefined || ferme) return
    suite = setTimeout(() => {
      suite = undefined
      void charger()
    }, ECART_MIN_MS)
  }

  async function charger() {
    if (!client || ferme) return
    if (enCours) {
      encore = true
      return
    }
    enCours = true
    const debut = Date.now()
    try {
      const { data, error } = await client.rpc('lire_fil', { projet_id: projetId, appareil_id: appareil() })
      if (error) {
        charge = false
        refuse = codeErreur(error) !== 'reseau'
      } else {
        const lus = (Array.isArray(data) ? data : []).filter(estLigne).map(versMessage)
        const ids = new Set(lus.map((m) => m.id))
        const recents = messages.filter((m) => !ids.has(m.id) && (ajoutsLocaux.get(m.id) ?? 0) >= debut)
        messages = [...lus, ...recents].sort((a, b) => a.ts - b.ts)
        charge = true
        refuse = false
        dejaConnecte = true
      }
    } catch {
      charge = false
    }
    enCours = false
    dernierFin = Date.now()
    chargement = false
    publier()
    if (encore) {
      encore = false
      plusTard()
    }
  }

  /** Coalesces bursts of pings into at most one read a second. */
  function demander() {
    if (enCours) encore = true
    else if (Date.now() - dernierFin < ECART_MIN_MS) plusTard()
    else void charger()
  }

  function prevenir() {
    void canal?.send({ type: 'broadcast', event: 'maj', payload: {} }).catch(() => undefined)
  }

  const minuterie = setInterval(demander, RELECTURE_MS)

  const pret = (async () => {
    try {
      client = await fournir()
    } catch {
      chargement = false
      publier()
      return null
    }
    if (ferme) return null
    let decroche = false
    canal = client
      .channel(`fil:${projetId}`)
      .on('broadcast', { event: 'maj' }, () => demander())
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          // Back after a drop: read what was missed.
          if (decroche) demander()
          decroche = false
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          decroche = true
        }
      })
    await charger()
    return client
  })()

  async function appel(action: (c: ClientFil) => Promise<Resultat>): Promise<Resultat> {
    const c = await pret
    if (!c || ferme) return { ok: false, code: 'reseau' }
    try {
      return await action(c)
    } catch (e) {
      const code = codeErreur(e)
      return { ok: false, code: code === 'inconnu' ? 'reseau' : code }
    }
  }

  return {
    envoyer(texte, auteur) {
      const propre = texte.trim()
      const nom = auteur.trim().slice(0, 40)
      if (!propre || propre.length > 500 || !nom) return Promise.resolve({ ok: false, code: 'invalide' })
      return appel(async (c) => {
        const { data, error } = await c.rpc('envoyer_message', { projet_id: projetId, nom, appareil_id: appareil(), contenu: propre })
        const ligne: unknown = Array.isArray(data) ? data[0] : data
        if (error || !estLigne(ligne)) return { ok: false, code: error ? codeErreur(error) : 'inconnu' }
        const message = { ...versMessage(ligne), deMoi: true }
        ajoutsLocaux.set(message.id, Date.now())
        messages = [...messages.filter((m) => m.id !== message.id), message].sort((a, b) => a.ts - b.ts)
        publier()
        prevenir()
        return { ok: true }
      })
    },
    signaler(id) {
      return appel(async (c) => {
        const { error } = await c.rpc('signaler', { message_id: id, appareil_id: appareil() })
        if (error) return { ok: false, code: codeErreur(error) }
        messages = messages.filter((m) => m.id !== id)
        publier()
        prevenir()
        return { ok: true }
      })
    },
    reseau(enLigne) {
      horsLigne = !enLigne
      publier()
      if (enLigne) void pret.then(() => demander())
    },
    fermer() {
      ferme = true
      clearInterval(minuterie)
      clearTimeout(suite)
      if (client && canal) client.removeChannel(canal)
      canal = null
    },
  }
}

export interface FilDirect {
  messages: MessageDirect[]
  envoyer(texte: string): Promise<Resultat>
  signaler(id: string): Promise<Resultat>
  statut: StatutFil
  /** First load in progress. */
  chargement: boolean
  dejaConnecte: boolean
}

const DEPART: EtatFil = { messages: [], statut: 'hors_ligne', chargement: true, dejaConnecte: false }

/**
 * Live thread of one project; `null`, a demo id or a missing configuration gives 'desactive'.
 * The device id is created only when a live thread actually opens (never for demos or without
 * configuration).
 */
export function useFilDirect(projetId: string | null): FilDirect {
  const actif = projetId !== null && idFilValide(projetId) && configFil() !== null
  const [etat, setEtat] = useState<{ pour: string | null; e: EtatFil }>({ pour: null, e: DEPART })
  const fil = useRef<Fil | null>(null)

  useEffect(() => {
    if (!actif || projetId === null) return
    const ouvert = ouvrirFil(projetId, () => clientPartage(), (e) => setEtat({ pour: projetId, e }), idAppareil)
    fil.current = ouvert
    const enLigne = () => ouvert.reseau(true)
    const horsLigne = () => ouvert.reseau(false)
    window.addEventListener('online', enLigne)
    window.addEventListener('offline', horsLigne)
    return () => {
      window.removeEventListener('online', enLigne)
      window.removeEventListener('offline', horsLigne)
      ouvert.fermer()
      if (fil.current === ouvert) fil.current = null
    }
  }, [actif, projetId])

  const envoyer = useCallback((texte: string): Promise<Resultat> => fil.current?.envoyer(texte, lireNom()) ?? Promise.resolve({ ok: false, code: 'reseau' }), [])
  const signaler = useCallback((id: string): Promise<Resultat> => fil.current?.signaler(id) ?? Promise.resolve({ ok: false, code: 'reseau' }), [])

  // State from a previous project id never leaks into this one.
  const e = actif && etat.pour === projetId ? etat.e : DEPART
  return {
    messages: actif ? e.messages : [],
    envoyer,
    signaler,
    statut: actif ? e.statut : 'desactive',
    chargement: actif && e.chargement,
    dejaConnecte: actif && e.dejaConnecte,
  }
}
