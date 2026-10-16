// Compte les mots dits à voix haute dans script-fr.md : seules les lignes en citation (`> …`) comptent,
// par section « ## N. ». Exclues : la ligne [CONDITIONNEL] de la partie 4 (dite seulement si le mode présentation
// local est livré). La partie 3 est la vidéo de la visite guidée : son créneau est la durée de la vidéo, ou la parole
// si elle est plus longue (ce qui serait une erreur : la narration doit tenir dans la vidéo).
// Usage : node docs/pitch/compter.mjs [mots/min, défaut 150]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const texte = readFileSync(join(ici, 'script-fr.md'), 'utf8')
const debit = Number(process.argv[2] ?? 150)
// Durée fixe de la partie 3 : 8 s de cadrage avant lecture + la vidéo (chapitres 1 à 5 et carte de fin, 92 s mesurés par build sur tour-cadre-court.mp4 le 16 octobre).
const FIXE = { 3: 100 }
const EXCLUS = [/CONDITIONNEL/]

const sections = new Map()
let courante = null
let exclureSuivante = false
for (const brute of texte.split('\n')) {
  const ligne = brute.trim()
  const m = ligne.match(/^## (\d)\. (.+?) \(/)
  if (m) { courante = m[1]; sections.set(courante, { titre: m[2], mots: 0 }); continue }
  if (/^## /.test(ligne) || /^---/.test(ligne)) { courante = null; continue }
  if (EXCLUS.some((r) => r.test(ligne)) && !ligne.startsWith('>')) { exclureSuivante = true; continue }
  if (!courante || !ligne.startsWith('>')) continue
  if (exclureSuivante) { exclureSuivante = false; continue }
  const mots = ligne.replace(/^>\s*/, '').replace(/\[.*?\]/g, '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
  sections.get(courante).mots += mots.length
}

const fmt = (s0) => { const s = Math.round(s0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
let totalMots = 0, totalParole = 0, debut = 0
console.log(`| Partie | Mots | Parole à ${debit} mots/min | Créneau | Début | Fin |`)
console.log('|---|---|---|---|---|---|')
for (const [n, s] of sections) {
  const parole = (s.mots / debit) * 60
  const creneau = FIXE[n] ? Math.max(parole, FIXE[n]) : parole
  const fin = debut + creneau
  const note = FIXE[n] ? (parole > FIXE[n] ? ' (TROP LONG pour la vidéo)' : ` (vidéo ${FIXE[n]} s, ${Math.round(FIXE[n] - parole)} s de silence)`) : ''
  console.log(`| ${n}. ${s.titre} | ${s.mots} | ${Math.round(parole)} s | ${Math.round(creneau)} s${note} | ${fmt(debut)} | ${fmt(fin)} |`)
  totalMots += s.mots; totalParole += parole; debut = fin
}
console.log(`| Total | ${totalMots} | ${fmt(totalParole)} | ${fmt(debut)} | | ${fmt(debut)} |`)
