import { useEffect, useMemo, useRef, useState } from 'react'
import type { Profil, Proposition } from '../types'
import { t } from './textes'
import { ecrire, lire } from './stockage'
import './projet.css'

interface Props {
  proposition: Proposition
  profils: Profil[]
  moi: Profil
  onRetour(): void
}

type Onglet = 'participants' | 'maj' | 'discussion'
interface Maj { id: string; titre: string; texte: string; date: string }
interface Msg { id: string; auteur: string; texte: string; ts: number; moi?: boolean; simule?: boolean; signale?: boolean }

const DELAI_S = 15
const PAUSE_S = 60
const MAX = 500
// Scripted content of the café story: only its own project gets it (Camille's canvases, Thu Oct 22).
const ID_DEMO_CAFE = 'prop-story-cafe-story-artiste+story-organisme'
const REPONSE_DEMO = 'Super, j’apporte aussi deux chevalets!'

const MAJ_SEED: Maj[] = [
  { id: 's1', titre: 'Date confirmée : jeudi 22 octobre', texte: 'Le lieu est réservé en soirée. Merci de confirmer votre présence.', date: '2026-10-14' },
  { id: 's2', titre: 'Camille apporte 12 toiles', texte: 'Elles seront prêtes à accrocher dès l’arrivée du groupe.', date: '2026-10-13' },
]

const cleProjet = (p: Proposition) => `${p.id}|${p.titre}`

/** Other projects start with one update built from their own partners. */
function majDepart(noms: string[]): Maj[] {
  const liste = noms.length <= 1 ? (noms[0] ?? '') : `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`
  return [{ id: 's0', titre: t.fil.majLancement, texte: t.fil.majLancementTexte(liste), date: new Date().toLocaleDateString('en-CA') }]
}
const dateCourte = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })

export default function FilProjet({ proposition, profils, moi, onRetour }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('participants')
  const cle = cleProjet(proposition)
  const organisateurId = proposition.partenaires[0]?.profilId
  const estOrganisateur = organisateurId === moi.id
  const demo = proposition.id === ID_DEMO_CAFE

  const partenaires = useMemo(
    () =>
      proposition.partenaires.map((c, i) => {
        const profil = profils.find((p) => p.id === c.profilId) ?? (c.profilId === moi.id ? moi : undefined)
        const statut: 'organisateur' | 'accepte' | 'attente' =
          i === 0 ? 'organisateur' : proposition.statut === 'confirmee' || i === 1 ? 'accepte' : 'attente'
        return { c, profil, statut, i }
      }),
    [proposition, profils, moi],
  )

  const onglets: [Onglet, string][] = [
    ['participants', t.fil.onglets.participants],
    ['maj', t.fil.onglets.maj],
    ['discussion', t.fil.onglets.discussion],
  ]

  return (
    <main className="pj-page">
      <button type="button" className="pj-retour" onClick={onRetour}>{t.retour}</button>
      <h1 className="pj-titre">{proposition.titre}</h1>
      <p className="pj-sous">{t.fil.titre} · <span className="pj-badge">{t.demo}</span></p>

      <div role="tablist" aria-label={t.fil.titre} className="pj-onglets">
        {onglets.map(([id, libelle]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`pj-tab-${id}`}
            aria-selected={onglet === id}
            aria-controls={`pj-panneau-${id}`}
            className="pj-onglet"
            onClick={() => setOnglet(id)}
          >
            {libelle}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`pj-panneau-${onglet}`} aria-labelledby={`pj-tab-${onglet}`}>
        {onglet === 'participants' && <Participants titre={proposition.titre} partenaires={partenaires} moi={moi} />}
        {onglet === 'maj' && <MisesAJour cle={cle} estOrganisateur={estOrganisateur} depart={demo ? MAJ_SEED : majDepart(partenaires.map((x) => x.profil?.nom ?? 'Partenaire'))} />}
        {onglet === 'discussion' && <Discussion cle={cle} demo={demo} partenaires={partenaires.map((x) => x.profil?.nom ?? 'Partenaire')} moi={moi} />}
      </div>
    </main>
  )
}

function Participants({ titre, partenaires, moi }: { titre: string; partenaires: { c: Proposition['partenaires'][number]; profil?: Profil; statut: string; i: number }[]; moi: Profil }) {
  const [info, setInfo] = useState('')

  async function inviter() {
    const donnees = { title: t.fil.objetInvitation(titre), text: t.fil.texteInvitation(titre), url: window.location.origin }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(donnees)
      } catch {
        // Share sheet closed by the user.
      }
      return
    }
    const lien = `mailto:?subject=${encodeURIComponent(donnees.title)}&body=${encodeURIComponent(`${donnees.text}\n${donnees.url}`)}`
    window.location.href = lien
    setInfo(t.fil.inviteCopie)
  }

  return (
    <section aria-label={t.fil.onglets.participants}>
      {partenaires.map(({ c, profil, statut, i }) => {
        const nom = profil?.nom ?? 'Partenaire'
        const estMoi = profil?.id === moi.id
        const accepte = statut !== 'attente'
        const num = `418555010${i}`
        const mail = `${nom.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@exemple.invalid`
        return (
          <article key={c.profilId} className="pj-carte">
            <div className="pj-ligne">
              <h2 className="pj-nom">{nom}{estMoi ? ` (${t.fil.vous})` : ''}</h2>
              <span className={statut === 'attente' ? 'pj-statut pj-statut-attente' : 'pj-statut'}>
                {statut === 'organisateur' ? t.fil.organisateur : statut === 'accepte' ? t.fil.accepte : t.fil.enAttente}
              </span>
            </div>
            <p className="pj-texte">{c.apport}</p>
            {estMoi ? null : profil?.reclame === false ? (
              <p className="pj-note">{t.fil.preRempli}</p>
            ) : accepte ? (
              <>
                <div className="pj-contacts">
                  <a className="pj-lien" href={`mailto:${mail}`}>{t.fil.courriel}</a>
                  <a className="pj-lien" href={`sms:+1${num}`}>{t.fil.texto}</a>
                  <a className="pj-lien" href={`https://wa.me/1${num}`} target="_blank" rel="noreferrer">{t.fil.whatsapp}</a>
                </div>
                <p className="pj-note">({t.fil.fictives})</p>
              </>
            ) : (
              <p className="pj-note">{t.fil.apresAcceptation}</p>
            )}
          </article>
        )
      })}
      <button type="button" className="pj-btn pj-btn-cta" onClick={inviter}>{t.fil.inviter}</button>
      {info && <p className="pj-note" role="status">{info}</p>}
    </section>
  )
}

function MisesAJour({ cle, estOrganisateur, depart }: { cle: string; estOrganisateur: boolean; depart: Maj[] }) {
  const cleMaj = `maillage.pj.maj.${cle}`
  const [liste, setListe] = useState<Maj[]>(() => lire<Maj[]>(cleMaj, depart))
  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')

  function publier(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) return
    const suivante = [{ id: `m${Date.now()}`, titre: titre.trim(), texte: texte.trim(), date: new Date().toISOString().slice(0, 10) }, ...liste]
    setListe(suivante)
    ecrire(cleMaj, suivante)
    setTitre('')
    setTexte('')
  }

  const triees = [...liste].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <section aria-label={t.fil.onglets.maj}>
      {estOrganisateur ? (
        <form className="pj-carte" onSubmit={publier}>
          <h2 className="pj-nom">{t.fil.nouvelleMaj}</h2>
          <label className="pj-champ">{t.fil.majTitre}<input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} required /></label>
          <label className="pj-champ">{t.fil.majTexte}<textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500} /></label>
          <button type="submit" className="pj-btn pj-btn-cta">{t.fil.majPublier}</button>
        </form>
      ) : (
        <p className="pj-note">{t.fil.majReserve}</p>
      )}
      {triees.length === 0 && <p className="pj-texte">{t.fil.majVide}</p>}
      {triees.map((m) => (
        <article key={m.id} className="pj-carte">
          <h2 className="pj-nom">{m.titre}</h2>
          <p className="pj-note">{dateCourte(m.date)}</p>
          {m.texte && <p className="pj-texte">{m.texte}</p>}
        </article>
      ))}
    </section>
  )
}

function Discussion({ cle, demo, partenaires, moi }: { cle: string; demo: boolean; partenaires: string[]; moi: Profil }) {
  const cleMsg = `maillage.pj.msg.${cle}`
  const autres = partenaires.filter((n) => n !== moi.nom)
  const repondant = (demo ? autres.find((n) => n.startsWith('Camille')) : undefined) ?? autres[0] ?? 'Partenaire'

  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const sauve = lire<Msg[] | null>(cleMsg, null)
    if (sauve) return sauve
    const base = Date.now() - 3600_000
    const a = (i: number) => autres[i % Math.max(autres.length, 1)] ?? repondant
    return [
      { id: 'x1', auteur: a(0), texte: t.fil.msgOuverture, ts: base, simule: true },
      { id: 'x2', auteur: a(1), texte: demo ? 'Je peux accueillir le groupe en soirée, ça vous irait?' : t.fil.msgQuestion, ts: base + 600_000, simule: true },
      { id: 'x3', auteur: a(0), texte: t.fil.msgSuite, ts: base + 1_200_000, simule: true },
    ]
  })
  const [texte, setTexte] = useState('')
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [prochainA, setProchainA] = useState(0)
  const [pauseJusqua, setPauseJusqua] = useState(0)
  const minuterie = useRef<number | undefined>(undefined)
  const fin = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 500)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(minuterie.current)
    }
  }, [])

  function maj(suivante: Msg[]) {
    setMsgs(suivante)
    ecrire(cleMsg, suivante)
  }

  const attenteS = Math.max(0, Math.ceil((prochainA - maintenant) / 1000))
  const pauseS = Math.max(0, Math.ceil((pauseJusqua - maintenant) / 1000))
  const bloque = attenteS > 0 || pauseS > 0
  const vide = texte.trim().length === 0

  function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const brut = texte.trim()
    const now = Date.now()
    if (!brut || now < prochainA || now < pauseJusqua) return
    const message: Msg = { id: `u${now}`, auteur: moi.nom, texte: brut.slice(0, MAX), ts: now, moi: true }
    const suivante = [...msgs, message]
    const miens = suivante.filter((m) => m.moi)
    const dernier3 = miens.slice(-3)
    if (dernier3.length === 3 && dernier3.every((m) => m.texte === brut)) setPauseJusqua(now + PAUSE_S * 1000)
    setProchainA(now + DELAI_S * 1000)
    setTexte('')
    if (!msgs.some((m) => m.moi) && !msgs.some((m) => m.id === 'rep')) {
      window.clearTimeout(minuterie.current)
      minuterie.current = window.setTimeout(() => {
        setMsgs((cur) => {
          const nv = [...cur, { id: 'rep', auteur: repondant, texte: demo ? REPONSE_DEMO : t.fil.msgReponse, ts: Date.now(), simule: true }]
          ecrire(cleMsg, nv)
          return nv
        })
      }, 3000)
    }
    maj(suivante)
  }

  function signaler(id: string) {
    maj(msgs.map((m) => (m.id === id ? { ...m, signale: true } : m)))
  }

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs.length])

  return (
    <section aria-label={t.fil.onglets.discussion}>
      <p className="pj-note"><span className="pj-badge">{t.demo}</span> {t.fil.moderation}</p>
      <ul className="pj-fil" aria-live="polite">
        {msgs.length === 0 && <li className="pj-texte">{t.fil.aucunMsg}</li>}
        {msgs.map((m) => (
          <li key={m.id} className={m.moi ? 'pj-msg pj-msg-moi' : 'pj-msg'}>
            <div className="pj-msg-tete">
              <span><strong>{m.auteur}</strong>{m.simule ? ` · ${t.fil.simule}` : ''}</span>
              {!m.moi && !m.signale && (
                <button type="button" className="pj-signaler" onClick={() => signaler(m.id)} aria-label={`${t.fil.signaler} : message de ${m.auteur}`}>
                  {t.fil.signaler}
                </button>
              )}
            </div>
            {m.signale ? <p className="pj-cache">{t.fil.signale}</p> : <p>{m.texte}</p>}
          </li>
        ))}
        <li ref={fin} aria-hidden="true" />
      </ul>
      <form className="pj-carte" onSubmit={envoyer}>
        <label className="pj-champ">
          {t.fil.msgPlaceholder}
          <textarea value={texte} onChange={(e) => setTexte(e.target.value.slice(0, MAX))} maxLength={MAX} />
        </label>
        <p className="pj-note">{t.fil.msgLimite(texte.length)}</p>
        {pauseS > 0 ? (
          <p className="pj-compte" role="status">{t.fil.pause(pauseS)}</p>
        ) : attenteS > 0 ? (
          <p className="pj-compte" role="timer" aria-live="off">{t.fil.prochain(attenteS)}</p>
        ) : null}
        <button type="submit" className="pj-btn pj-btn-cta" disabled={bloque || vide}>{t.fil.msgEnvoyer}</button>
      </form>
    </section>
  )
}
