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
  | 'invalide'
  | 'reseau'
  | 'inconnu'
export type Resultat = { ok: true } | { ok: false; code: CodeErreur }

export interface MessageDirect {
  id: string
  auteur: string
  auteurId: string
  texte: string
  ts: number
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
  return base in DEMOS || base === ID_DEMO_SOFIA || base.startsWith('visite-')
}

/** Live thread ids are random (see nouvelIdFil): letters, digits, - and _, 8 to 120 characters. */
export function idFilValide(id: string): boolean {
  return /^[A-Za-z0-9_-]{8,120}$/.test(id) && !estDemo(id)
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
  const cle = /\b(fil_(?:delai|achalande|repetition|lien|coordonnees|sature))\b/.exec(texte)
  if (cle) return cle[1] as CodeErreur
  if (code === '23514' || code === '23502' || code === '22001') return 'invalide'
  if (e instanceof TypeError || /fetch|network|load failed|réseau/i.test(texte) || code === '' || code === undefined) return 'reseau'
  return 'inconnu'
}

// The slice of supabase-js this module uses: a seam for tests, nothing more.
interface Ligne {
  id: string
  projet_id: string
  auteur: string
  auteur_id: string
  texte: string
  signale: boolean
  cree_le: string
}
interface Reponse<T> {
  data: T | null
  error: { code?: string; message?: string } | null
}
export interface CanalFil {
  on(type: string, filtre: Record<string, unknown>, rappel: (charge: { new?: unknown; payload?: unknown }) => void): CanalFil
  subscribe(rappel?: (statut: string) => void): CanalFil
  send(message: { type: 'broadcast'; event: string; payload: unknown }): Promise<unknown>
}
export interface ClientFil {
  from(table: 'messages'): {
    select(colonnes: string): { eq(col: string, val: string): { order(col: string, o: { ascending: boolean }): { limit(n: number): PromiseLike<Reponse<Ligne[]>> } } }
    insert(ligne: Pick<Ligne, 'projet_id' | 'auteur' | 'auteur_id' | 'texte'>): { select(colonnes: string): { single(): PromiseLike<Reponse<Ligne>> } }
  }
  rpc(fn: 'signaler', args: { message_id: string }): PromiseLike<{ error: Reponse<unknown>['error'] }>
  channel(nom: string): CanalFil
  removeChannel(canal: CanalFil): unknown
}

const COLONNES = 'id, projet_id, auteur, auteur_id, texte, signale, cree_le'
const LIMITE = 100

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

const versMessage = (l: Ligne): MessageDirect => ({ id: l.id, auteur: l.auteur, auteurId: l.auteur_id, texte: l.texte, ts: Date.parse(l.cree_le) })
const estLigne = (x: unknown): x is Ligne =>
  !!x && typeof x === 'object' && typeof (x as Ligne).id === 'string' && typeof (x as Ligne).texte === 'string' && typeof (x as Ligne).cree_le === 'string'

export interface Fil {
  envoyer(texte: string, auteur: string, auteurId: string): Promise<Resultat>
  signaler(id: string): Promise<Resultat>
  /** Browser online/offline events. */
  reseau(enLigne: boolean): void
  fermer(): void
}

/**
 * Opens one live thread: subscribes to inserts and updates for this project, then loads the last
 * 100 messages. A reported message stops passing RLS, so Realtime cannot deliver its UPDATE to
 * other viewers: the reporter also broadcasts `signale` on the channel, and every reload is
 * authoritative.
 */
export function ouvrirFil(projetId: string, fournir: () => Promise<ClientFil>, notifier: (e: EtatFil) => void): Fil {
  let messages: MessageDirect[] = []
  let chargement = true
  let dejaConnecte = false
  let charge = false // last load succeeded
  let refuse = false // the server answered with an error (missing table, policy…)
  let canalKo = false // Realtime reported an error, a timeout or a close
  let horsLigne = false // the browser says it is offline
  let ferme = false
  let client: ClientFil | null = null
  let canal: CanalFil | null = null

  function publier() {
    if (ferme) return
    const statut = refuse ? 'erreur' : charge && !canalKo && !horsLigne ? 'connecte' : 'hors_ligne'
    notifier({ messages, statut, chargement, dejaConnecte })
  }

  function ranger(liste: MessageDirect[]) {
    messages = liste.sort((a, b) => a.ts - b.ts).slice(-2 * LIMITE)
  }

  function ajouter(lignes: unknown[]) {
    const parId = new Map(messages.map((m) => [m.id, m]))
    for (const l of lignes) {
      if (!estLigne(l)) continue
      if (l.signale) parId.delete(l.id)
      else parId.set(l.id, versMessage(l))
    }
    ranger([...parId.values()])
    publier()
  }

  function retirer(id: unknown) {
    if (typeof id !== 'string') return
    messages = messages.filter((m) => m.id !== id)
    publier()
  }

  async function charger() {
    if (!client || ferme) return
    try {
      const { data, error } = await client.from('messages').select(COLONNES).eq('projet_id', projetId).order('cree_le', { ascending: false }).limit(LIMITE)
      if (error) {
        charge = false
        refuse = codeErreur(error) !== 'reseau'
      } else {
        const lignes = (data ?? []).filter(estLigne).filter((l) => !l.signale)
        const dernier = lignes.reduce((max, l) => Math.max(max, Date.parse(l.cree_le)), 0)
        // The server list is authoritative; keep only what Realtime brought after its last row.
        const recents = messages.filter((m) => m.ts > dernier && !lignes.some((l) => l.id === m.id))
        ranger([...lignes.map(versMessage), ...recents])
        charge = true
        refuse = false
        dejaConnecte = true
      }
    } catch {
      charge = false
    }
    chargement = false
    publier()
  }

  const pret = (async () => {
    try {
      client = await fournir()
    } catch {
      chargement = false
      publier()
      return null
    }
    if (ferme) return null
    const filtre = { schema: 'public', table: 'messages', filter: `projet_id=eq.${projetId}` }
    canal = client
      .channel(`fil:${projetId}`)
      .on('postgres_changes', { event: 'INSERT', ...filtre }, (c) => ajouter([c.new]))
      .on('postgres_changes', { event: 'UPDATE', ...filtre }, (c) => ajouter([c.new]))
      .on('broadcast', { event: 'signale' }, (c) => retirer((c.payload as { id?: unknown } | undefined)?.id))
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          const reprise = canalKo
          canalKo = false
          publier()
          // Back after a drop: fetch what was missed.
          if (reprise) void charger()
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          canalKo = true
          publier()
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
    envoyer(texte, auteur, auteurId) {
      const propre = texte.trim()
      const nom = auteur.trim().slice(0, 40)
      if (!propre || propre.length > 500 || !nom) return Promise.resolve({ ok: false, code: 'invalide' })
      return appel(async (c) => {
        const { data, error } = await c.from('messages').insert({ projet_id: projetId, auteur: nom, auteur_id: auteurId, texte: propre }).select(COLONNES).single()
        if (error || !data) return { ok: false, code: error ? codeErreur(error) : 'inconnu' }
        ajouter([data])
        return { ok: true }
      })
    },
    signaler(id) {
      return appel(async (c) => {
        const { error } = await c.rpc('signaler', { message_id: id })
        if (error) return { ok: false, code: codeErreur(error) }
        retirer(id)
        void canal?.send({ type: 'broadcast', event: 'signale', payload: { id } }).catch(() => undefined)
        return { ok: true }
      })
    },
    reseau(enLigne) {
      horsLigne = !enLigne
      publier()
      if (enLigne) void pret.then(() => charger())
    },
    fermer() {
      ferme = true
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
  /** This device's random id: its own messages get no « Signaler » button. */
  moiId: string
}

const DEPART: EtatFil = { messages: [], statut: 'hors_ligne', chargement: true, dejaConnecte: false }

/** Live thread of one project; `null`, a demo id or a missing configuration gives 'desactive'. */
export function useFilDirect(projetId: string | null): FilDirect {
  const actif = projetId !== null && idFilValide(projetId) && configFil() !== null
  const [etat, setEtat] = useState<{ pour: string | null; e: EtatFil }>({ pour: null, e: DEPART })
  const fil = useRef<Fil | null>(null)
  const [moiId] = useState(idAppareil)

  useEffect(() => {
    if (!actif || projetId === null) return
    const ouvert = ouvrirFil(projetId, () => clientPartage(), (e) => setEtat({ pour: projetId, e }))
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

  const envoyer = useCallback(
    (texte: string): Promise<Resultat> => fil.current?.envoyer(texte, lireNom(), moiId) ?? Promise.resolve({ ok: false, code: 'reseau' }),
    [moiId],
  )
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
    moiId,
  }
}
