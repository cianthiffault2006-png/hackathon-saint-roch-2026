import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BasculeDirect from '../projet/BasculeDirect'
import { lire } from '../projet/stockage'
import { t } from '../projet/textes'
import {
  codeErreur,
  configFil,
  ecrireBascule,
  estDemo,
  horodatage,
  idFilValide,
  lienDirect,
  lienFil,
  lireLienFil,
  nouvelIdFil,
  ouvrirFil,
  RELECTURE_MS,
  useFilDirect,
  type CanalFil,
  type ClientFil,
  type EtatFil,
  type StatutFil,
} from './filDirect'

const CAFE = 'prop-story-cafe-story-artiste+story-organisme'
const SOFIA = 'ouvert-demo-sofia'
const VISITE = `visite-${CAFE}`
const ENV = { VITE_SUPABASE_URL: 'https://exemple.supabase.co/', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('configFil', () => {
  it('is enabled only when both variables exist', () => {
    expect(configFil(ENV)).toEqual({ url: 'https://exemple.supabase.co', cle: 'sb_publishable_test' })
    expect(configFil({})).toBeNull()
    expect(configFil({ VITE_SUPABASE_URL: ENV.VITE_SUPABASE_URL })).toBeNull()
    expect(configFil({ VITE_SUPABASE_PUBLISHABLE_KEY: ENV.VITE_SUPABASE_PUBLISHABLE_KEY })).toBeNull()
    expect(configFil({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_PUBLISHABLE_KEY: 'x' })).toBeNull()
    expect(configFil({ VITE_SUPABASE_URL: 'pas une url', VITE_SUPABASE_PUBLISHABLE_KEY: 'x' })).toBeNull()
  })
})

describe('demo ids never go live', () => {
  it('recognizes the café story, Sofia and the tour, as ids or project keys', () => {
    for (const id of [CAFE, SOFIA, VISITE, `${CAFE}|Exposition au café`, `${SOFIA}|Corvée graffitis rue Saint-Joseph`, `${VISITE}|Titre`]) {
      expect(estDemo(id)).toBe(true)
      expect(idFilValide(id)).toBe(false)
    }
    expect(estDemo('prop-p-12-p-3+p-9')).toBe(false)
  })

  it('accepts random thread ids only', () => {
    const id = nouvelIdFil()
    expect(id).toMatch(/^f-[a-z0-9]{22}$/)
    expect(idFilValide(id)).toBe(true)
    expect(nouvelIdFil()).not.toBe(id)
    expect(idFilValide('court')).toBe(false)
    expect(idFilValide('f-court')).toBe(false)
    expect(idFilValide('abcdefghijkl')).toBe(false)
    expect(idFilValide('f-a+b+c-defghij')).toBe(false)
    expect(idFilValide(`f-${'x'.repeat(119)}`)).toBe(false)
    expect(idFilValide(`f-${'x'.repeat(118)}`)).toBe(true)
  })

  it('gives desactive from the hook for demo ids, even when Supabase is configured', () => {
    vi.stubEnv('VITE_SUPABASE_URL', ENV.VITE_SUPABASE_URL)
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ENV.VITE_SUPABASE_PUBLISHABLE_KEY)
    const statut = (id: string | null): StatutFil => {
      let s: StatutFil = 'erreur'
      function Sonde() {
        s = useFilDirect(id).statut
        return null
      }
      renderToString(createElement(Sonde))
      return s
    }
    expect(statut(CAFE)).toBe('desactive')
    expect(statut(SOFIA)).toBe('desactive')
    expect(statut(VISITE)).toBe('desactive')
    expect(statut(null)).toBe('desactive')
    // A real thread id is live (connecting) with the configuration...
    expect(statut(nouvelIdFil())).toBe('hors_ligne')
    // ...and disabled without it.
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(statut(nouvelIdFil())).toBe('desactive')
  })

  it('never builds a share link for a demo project, nor without configuration', () => {
    const config = configFil(ENV)
    ecrireBascule(`${CAFE}|Exposition`, true)
    expect(lienDirect(`${CAFE}|Exposition`, 'Exposition', config)).toBeNull()
    ecrireBascule('prop-a-b+c|Projet', true)
    expect(lienDirect('prop-a-b+c|Projet', 'Projet', null)).toBeNull()
  })
})

describe('error codes', () => {
  const pgrst = (message: string, code = 'P0001') => ({ code, message, details: null, hint: null })
  it('maps every server rule to its code', () => {
    for (const cle of ['fil_delai', 'fil_achalande', 'fil_repetition', 'fil_lien', 'fil_coordonnees', 'fil_sature', 'signal_limite'] as const) {
      expect(codeErreur(pgrst(cle))).toBe(cle)
    }
    expect(codeErreur(pgrst('new row for relation "messages" violates check constraint', '23514'))).toBe('invalide')
    expect(codeErreur(pgrst('value too long', '22001'))).toBe('invalide')
    expect(codeErreur(pgrst('signal_invalide', '22023'))).toBe('invalide')
  })
  it('maps network failures and unknown errors', () => {
    expect(codeErreur({ code: '', message: 'TypeError: Failed to fetch' })).toBe('reseau')
    expect(codeErreur(new TypeError('Load failed'))).toBe('reseau')
    expect(codeErreur(pgrst('relation "public.messages" does not exist', '42P01'))).toBe('inconnu')
    expect(codeErreur(null)).toBe('inconnu')
  })
  it('has Québec French text for every code', () => {
    for (const texte of Object.values(t.direct.erreurs)) {
      expect(texte.length).toBeGreaterThan(10)
      expect(texte).not.toMatch(/'| [?!]/)
    }
    for (const texte of [t.direct.avis, t.direct.aucunMsg, t.direct.nonConfigure, t.direct.lienInvalide, t.direct.bascule]) {
      expect(texte).not.toMatch(/'| [?!]/)
    }
    expect(t.direct.avis).toBe('Les messages sont visibles par toute personne qui a le lien de ce projet. Ne partagez pas de coordonnées. Modération par la SDC en pilote.')
  })
})

describe('deep link', () => {
  const lieu = { origin: 'https://maillage.exemple', pathname: '/app/', search: '' }
  it('round-trips the thread id and the title', () => {
    const id = nouvelIdFil()
    const titre = 'Exposition « Rouge & or » au café? Oui!'
    const url = lienFil(id, titre, lieu)
    expect(url.startsWith(`https://maillage.exemple/app/#fil/${id}?t=`)).toBe(true)
    expect(lireLienFil(url.slice(url.indexOf('#')))).toEqual({ filId: id, titre })
  })
  it('ignores other hashes and survives malformed ones', () => {
    expect(lireLienFil('')).toBeNull()
    expect(lireLienFil('#carte')).toBeNull()
    expect(lireLienFil('#fil/f-abc%E0%A4%A?t=%E0%A4%A')).toMatchObject({ filId: 'f-abc%E0%A4%A' })
    expect(idFilValide('f-abc%E0%A4%A')).toBe(false)
    expect(lireLienFil(`#fil/${CAFE}`)?.filId).toBe(CAFE)
    expect(idFilValide(lireLienFil(`#fil/${SOFIA}`)!.filId)).toBe(false)
  })
})

// A mocked supabase-js client: RPCs and a broadcast channel; the test pushes pings and channel states.
function fauxClient(options: { lignes?: unknown[]; erreurLecture?: unknown; erreurAjout?: unknown; erreurSignal?: unknown } = {}) {
  const rappels: Record<string, (c: { payload?: unknown }) => void> = {}
  let statutCanal: ((s: string) => void) | undefined
  const envoyes: unknown[] = []
  const canal: CanalFil = {
    on(type, filtre, rappel) {
      rappels[`${type}:${String(filtre.event)}`] = rappel
      return canal
    },
    subscribe(rappel) {
      statutCanal = rappel
      return canal
    },
    send(message) {
      envoyes.push(message)
      return Promise.resolve('ok')
    },
  }
  let compteur = 0
  const lectures: Record<string, string>[] = []
  const ajouts: Record<string, string>[] = []
  const serveur = { lignes: [...(options.lignes ?? [])] }
  const rpc = vi.fn((fn: string, args: Record<string, string>) => {
    if (fn === 'lire_fil') {
      lectures.push(args)
      return Promise.resolve(options.erreurLecture ? { data: null, error: options.erreurLecture } : { data: [...serveur.lignes], error: null })
    }
    if (fn === 'envoyer_message') {
      ajouts.push(args)
      if (options.erreurAjout) return Promise.resolve({ data: null, error: options.erreurAjout })
      compteur += 1
      return Promise.resolve({ data: [{ id: `nouveau-${compteur}`, auteur: args.nom, texte: args.contenu, cree_le: '2026-10-15T18:00:00.123456+00:00', de_moi: true }], error: null })
    }
    return Promise.resolve({ data: null, error: (options.erreurSignal ?? null) as never })
  })
  const client = { rpc, channel: vi.fn(() => canal), removeChannel: vi.fn() }
  return {
    client: client as unknown as ClientFil,
    brut: client,
    serveur,
    rappels,
    envoyes,
    lectures,
    ajouts,
    statutCanal: (s: string) => statutCanal?.(s),
  }
}

// What lire_fil returns: no author id, only de_moi.
const ligne = (id: string, minute: number, extra: Record<string, unknown> = {}) => ({
  id,
  auteur: 'Camille',
  texte: `Message ${id}`,
  cree_le: `2026-10-15T17:${String(minute).padStart(2, '0')}:00.654321+00:00`,
  de_moi: false,
  ...extra,
})

const APPAREIL = 'appareil-sofia-1'

async function ouvrir(f: ReturnType<typeof fauxClient>) {
  const etats: EtatFil[] = []
  const fil = ouvrirFil('f-test-fil-0001', () => Promise.resolve(f.client), (e) => etats.push(e), () => APPAREIL)
  await vi.waitFor(() => expect(etats.some((e) => !e.chargement)).toBe(true))
  return { fil, dernier: () => etats[etats.length - 1] }
}

describe('ouvrirFil with a mocked client', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the thread through lire_fil with this device id, in order, without author ids', async () => {
    const f = fauxClient({ lignes: [ligne('a', 1), ligne('b', 2, { de_moi: true })] })
    const { fil, dernier } = await ouvrir(f)
    expect(f.lectures).toEqual([{ projet_id: 'f-test-fil-0001', appareil_id: APPAREIL }])
    expect(f.brut.channel).toHaveBeenCalledWith('fil:f-test-fil-0001')
    expect(dernier().messages.map((m) => [m.id, m.deMoi])).toEqual([['a', false], ['b', true]])
    expect(Object.keys(dernier().messages[0]).sort()).toEqual(['auteur', 'deMoi', 'id', 'texte', 'ts'])
    expect(dernier().statut).toBe('connecte')
    fil.fermer()
  })

  it('re-reads on a ping and never trusts its content', async () => {
    const f = fauxClient({ lignes: [ligne('a', 1)] })
    const { fil, dernier } = await ouvrir(f)
    f.serveur.lignes = [ligne('a', 1), ligne('c', 3)]
    f.rappels['broadcast:maj']({ payload: { id: 'faux', texte: 'message inventé' } })
    // Just after a read, pings are coalesced into one read a second later.
    await vi.waitFor(() => expect(dernier().messages.map((m) => m.id)).toEqual(['a', 'c']), { timeout: 2500 })
    expect(dernier().messages.some((m) => m.texte === 'message inventé')).toBe(false)
    expect(f.rappels['broadcast:signale']).toBeUndefined()
    // A report elsewhere: the next read drops the message.
    f.serveur.lignes = [ligne('c', 3)]
    await new Promise((r) => setTimeout(r, 1100))
    f.rappels['broadcast:maj']({ payload: {} })
    await vi.waitFor(() => expect(dernier().messages.map((m) => m.id)).toEqual(['c']))
    fil.fermer()
  })

  it('re-reads after a Realtime drop and every 20 s', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    const f = fauxClient({ lignes: [ligne('a', 1)] })
    const etats: EtatFil[] = []
    const fil = ouvrirFil('f-test-fil-0001', () => Promise.resolve(f.client), (e) => etats.push(e), () => APPAREIL)
    await vi.advanceTimersByTimeAsync(10)
    expect(f.lectures).toHaveLength(1)
    f.statutCanal('SUBSCRIBED')
    f.statutCanal('CHANNEL_ERROR')
    await vi.advanceTimersByTimeAsync(1500)
    f.statutCanal('SUBSCRIBED')
    await vi.advanceTimersByTimeAsync(10)
    expect(f.lectures).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(RELECTURE_MS)
    expect(f.lectures).toHaveLength(3)
    fil.fermer()
    await vi.advanceTimersByTimeAsync(RELECTURE_MS * 2)
    expect(f.lectures).toHaveLength(3)
    expect(f.brut.removeChannel).toHaveBeenCalledTimes(1)
  })

  it('posts through envoyer_message, shows the message as mine and pings the others', async () => {
    const f = fauxClient()
    const { fil, dernier } = await ouvrir(f)
    expect(await fil.envoyer('  Bonjour!  ', 'Sofia')).toEqual({ ok: true })
    expect(f.ajouts).toEqual([{ projet_id: 'f-test-fil-0001', nom: 'Sofia', appareil_id: APPAREIL, contenu: 'Bonjour!' }])
    expect(dernier().messages.map((m) => [m.texte, m.deMoi])).toEqual([['Bonjour!', true]])
    expect(f.envoyes).toEqual([{ type: 'broadcast', event: 'maj', payload: {} }])
    expect(await fil.envoyer('   ', 'Sofia')).toEqual({ ok: false, code: 'invalide' })
    expect(await fil.envoyer('x'.repeat(501), 'Sofia')).toEqual({ ok: false, code: 'invalide' })
    expect(f.ajouts).toHaveLength(1)
    fil.fermer()
  })

  it('returns the server rule as a code', async () => {
    const f = fauxClient({ erreurAjout: { code: 'P0001', message: 'fil_delai', hint: 'Attendez 15 secondes entre deux messages.' } })
    const { fil } = await ouvrir(f)
    expect(await fil.envoyer('Encore moi', 'Sofia')).toEqual({ ok: false, code: 'fil_delai' })
    expect(f.envoyes).toEqual([])
    fil.fermer()
  })

  it('reports through the RPC with this device id, hides the message and pings the others', async () => {
    const f = fauxClient({ lignes: [ligne('a', 1)] })
    const { fil, dernier } = await ouvrir(f)
    expect(await fil.signaler('a')).toEqual({ ok: true })
    expect(f.brut.rpc).toHaveBeenCalledWith('signaler', { message_id: 'a', appareil_id: APPAREIL })
    expect(dernier().messages).toEqual([])
    expect(f.envoyes).toEqual([{ type: 'broadcast', event: 'maj', payload: {} }])
    fil.fermer()
  })

  it('keeps the message when the server refuses the report', async () => {
    const f = fauxClient({ lignes: [ligne('a', 1)], erreurSignal: { code: 'P0001', message: 'signal_limite' } })
    const { fil, dernier } = await ouvrir(f)
    expect(await fil.signaler('a')).toEqual({ ok: false, code: 'signal_limite' })
    expect(dernier().messages.map((m) => m.id)).toEqual(['a'])
    expect(f.envoyes).toEqual([])
    fil.fermer()
  })

  it('is in error when the server refuses the read, offline when the network fails', async () => {
    const refuse = await ouvrir(fauxClient({ erreurLecture: { code: '22023', message: 'fil_invalide' } }))
    expect(refuse.dernier().statut).toBe('erreur')
    refuse.fil.fermer()
    const coupe = await ouvrir(fauxClient({ erreurLecture: { code: '', message: 'TypeError: Failed to fetch' } }))
    expect(coupe.dernier()).toMatchObject({ statut: 'hors_ligne', dejaConnecte: false, chargement: false })
    coupe.fil.fermer()
  })

  it('is offline when supabase-js cannot load, and sends nothing', async () => {
    const etats: EtatFil[] = []
    const fil = ouvrirFil('f-test-fil-0001', () => Promise.reject(new Error('chunk')), (e) => etats.push(e), () => APPAREIL)
    expect(await fil.envoyer('Bonjour', 'Sofia')).toEqual({ ok: false, code: 'reseau' })
    expect(etats[etats.length - 1]).toMatchObject({ statut: 'hors_ligne', chargement: false })
    fil.fermer()
  })
})

describe('horodatage', () => {
  it('reads server timestamps with microseconds, and falls back to now', () => {
    expect(horodatage('2026-10-15T18:40:44.311818+00:00')).toBe(Date.UTC(2026, 9, 15, 18, 40, 44, 311))
    expect(horodatage('2026-10-15T18:40:44Z')).toBe(Date.UTC(2026, 9, 15, 18, 40, 44))
    const avant = Date.now()
    expect(horodatage('pas une date')).toBeGreaterThanOrEqual(avant)
  })
})

describe('BasculeDirect (Discussion data source)', () => {
  const local = createElement('p', null, 'fil local')
  const rendu = (propositionId: string) =>
    renderToString(createElement(BasculeDirect, { propositionId, cle: `${propositionId}|Titre`, titre: 'Titre', children: local }))
  const configurer = () => {
    vi.stubEnv('VITE_SUPABASE_URL', ENV.VITE_SUPABASE_URL)
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ENV.VITE_SUPABASE_PUBLISHABLE_KEY)
  }

  it('leaves the demo threads exactly as they were', () => {
    configurer()
    for (const id of [CAFE, SOFIA, VISITE]) expect(rendu(id)).toBe('<p>fil local</p>')
  })

  it('shows a quiet note and the local thread without configuration', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    const html = rendu('prop-p-1-p-2+p-3')
    expect(html).toContain('pas offert dans cette version')
    expect(html).toContain('<p>fil local</p>')
    expect(html).not.toContain('role="switch"')
  })

  it('offers the toggle, off by default, with the local thread, when configured', () => {
    configurer()
    const html = rendu('prop-p-4-p-5+p-6')
    expect(html).toContain('role="switch"')
    expect(html).not.toMatch(/checked/)
    expect(html).toContain('Fil en direct (bêta)')
    expect(html).toContain('<p>fil local</p>')
    expect(html).not.toContain(t.direct.avis)
  })

  it('writes no device id for demo projects, without configuration, or with the toggle off', () => {
    configurer()
    for (const id of [CAFE, SOFIA, VISITE, 'prop-p-7-p-8+p-9']) rendu(id)
    vi.stubEnv('VITE_SUPABASE_URL', '')
    rendu('prop-p-7-p-8+p-9')
    expect(lire('maillage.direct.appareil', '')).toBe('')
  })
})
