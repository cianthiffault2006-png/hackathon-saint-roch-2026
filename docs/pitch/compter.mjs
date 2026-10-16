// Compte les mots dits à voix haute dans script-fr.md : seules les lignes en citation (`> …`) comptent,
// par section « ## N. ». Deux lignes optionnelles sont exclues : la version « avec citation » de la partie 2
// (une seule des deux versions est dite) et la deuxième histoire (étape 6 de la démo, seulement si le temps le permet).
// Usage : node docs/pitch/compter.mjs [mots/min, défaut 150]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const texte = readFileSync(join(ici, 'script-fr.md'), 'utf8')
const debit = Number(process.argv[2] ?? 150)
// Clics, collage et chargements pendant la démo (partie 3), mesurés le 15 octobre : environ 40 s.
const CLICS = { 3: 40 }
const EXCLUS = [/CITATION RÉELLE/, /^> Deuxième histoire/]

const sections = new Map()
let courante = null
for (const brute of texte.split('\n')) {
  const ligne = brute.trim()
  const m = ligne.match(/^## (\d)\. (.+?) \(/)
  if (m) { courante = m[1]; sections.set(courante, { titre: m[2], mots: 0 }); continue }
  if (/^## /.test(ligne) || /^---/.test(ligne)) { courante = null; continue }
  if (!courante || !ligne.startsWith('>')) continue
  if (EXCLUS.some((r) => r.test(ligne))) continue
  const mots = ligne.replace(/^>\s*/, '').replace(/\[.*?\]/g, '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
  sections.get(courante).mots += mots.length
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
let totalMots = 0, totalParole = 0, totalClics = 0, debut = 0
console.log(`| Partie | Mots | Parole à ${debit} mots/min | Clics | Début | Fin |`)
console.log('|---|---|---|---|---|---|')
for (const [n, s] of sections) {
  const parole = (s.mots / debit) * 60
  const clics = CLICS[n] ?? 0
  const fin = debut + parole + clics
  console.log(`| ${n}. ${s.titre} | ${s.mots} | ${Math.round(parole)} s | ${clics ? clics + ' s' : ''} | ${fmt(debut)} | ${fmt(fin)} |`)
  totalMots += s.mots; totalParole += parole; totalClics += clics; debut = fin
}
console.log(`| Total | ${totalMots} | ${fmt(totalParole)} | ${totalClics} s | | ${fmt(totalParole + totalClics)} |`)
