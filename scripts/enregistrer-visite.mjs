#!/usr/bin/env node
// Enregistre la Visite guidée de bout en bout (vidéo de secours du pitch), en disposition téléphone telle que projetée.
//
//   node scripts/enregistrer-visite.mjs [--url <https://…/>] [--sortie <fichier.mp4>] [--suite] [--chrome]
//
// Fenêtre 850 x 480 px CSS (sous le seuil téléphone de 900 px) à deviceScaleFactor 2 : vidéo 1700 x 960.
// Stockage vide (nouveau contexte), accueil, « Visite guidée », jusqu'à la carte de fin des 7 chapitres (≈ 2 min),
// puis la « Suite de la visite » (≈ 69 s) avec --suite. Le .webm de Playwright est converti en H.264 (ffmpeg) et
// trois images (début, milieu, fin) sont tirées à côté du .mp4. Rien ici n'est destiné au dépôt : la sortie va dans media/.
//
// Playwright n'est pas une dépendance du projet : on prend celui du projet s'il existe, sinon l'installation globale
// (npm i -g playwright@1.64.1 ; les navigateurs de ms-playwright sont partagés).
import { createRequire } from 'node:module'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const args = process.argv.slice(2)
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 && args[i + 1] ? args[i + 1] : defaut }
const drapeau = (nom) => args.includes(nom)

const URL_DEFAUT = 'https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/'
const url = option('--url', URL_DEFAUT)
const sortie = resolve(option('--sortie', 'C:/Users/maeli/cian-claude/media/backup-d2.mp4'))
const avecSuite = drapeau('--suite')
const LARGEUR = 850, HAUTEUR = 480, ECHELLE = 2
const TAILLE_MIN_OCTETS = 1024 * 1024
const PAUSE_FIN_MS = 3000

function chargerPlaywright() {
  const essais = [
    () => createRequire(import.meta.url)('playwright'),
    () => createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x'))('playwright'),
  ]
  for (const essai of essais) { try { return essai() } catch { /* suivant */ } }
  throw new Error('Playwright introuvable : npm i -g playwright@1.64.1')
}

function trouverFfmpeg() {
  const ok = (cmd) => spawnSync(cmd, ['-version'], { stdio: 'ignore', shell: false }).status === 0
  if (ok('ffmpeg')) return 'ffmpeg'
  // winget (Gyan.FFmpeg) ajoute le PATH pour les nouveaux terminaux seulement : on le cherche directement.
  const paquets = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages')
  if (existsSync(paquets)) {
    for (const d of readdirSync(paquets).filter((d) => d.startsWith('Gyan.FFmpeg'))) {
      for (const sous of readdirSync(join(paquets, d))) {
        const exe = join(paquets, d, sous, 'bin', 'ffmpeg.exe')
        if (existsSync(exe) && ok(exe)) return exe
      }
    }
  }
  return null
}

function duree(ffmpeg, fichier) {
  const r = spawnSync(ffmpeg, ['-i', fichier], { encoding: 'utf8' })
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(r.stderr ?? '')
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN
}

async function main() {
  const { chromium } = chargerPlaywright()
  const ffmpeg = trouverFfmpeg()
  if (!ffmpeg) console.warn('ffmpeg introuvable (winget install Gyan.FFmpeg) : le .webm sera gardé tel quel.')

  mkdirSync(dirname(sortie), { recursive: true })
  const dossierVideo = join(tmpdir(), `visite-${Date.now()}`)
  mkdirSync(dossierVideo, { recursive: true })

  // Le Chromium de Playwright manque souvent (version non téléchargée) : on retombe sur le Chrome installé.
  const navigateur = await (drapeau('--chrome') ? chromium.launch({ channel: 'chrome' }) : chromium.launch().catch((e) => {
    console.warn(`Chromium de Playwright indisponible (${String(e.message).split('\n')[0]}) : Chrome installé utilisé.`)
    return chromium.launch({ channel: 'chrome' })
  }))
  const contexte = await navigateur.newContext({
    viewport: { width: LARGEUR, height: HAUTEUR },
    deviceScaleFactor: ECHELLE,
    locale: 'fr-CA',
    timezoneId: 'America/Toronto',
    recordVideo: { dir: dossierVideo, size: { width: LARGEUR * ECHELLE, height: HAUTEUR * ECHELLE } },
  })
  const page = await contexte.newPage()
  const t0 = Date.now()
  const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s] ${m}`)

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.waitForTimeout(1500)
  log('accueil')

  await page.getByRole('button', { name: 'Visite guidée' }).click()
  log('visite lancée')
  const carteFin = page.getByRole('dialog', { name: 'Visite guidée' })
  await carteFin.waitFor({ state: 'visible', timeout: 4 * 60 * 1000 })
  log('carte de fin (7 chapitres)')
  await page.waitForTimeout(PAUSE_FIN_MS)

  if (avecSuite) {
    await carteFin.getByRole('button', { name: 'Continuer la visite' }).click()
    log('suite lancée')
    await page.getByRole('dialog', { name: 'Suite de la visite' }).waitFor({ state: 'visible', timeout: 3 * 60 * 1000 })
    log('carte de fin (suite)')
    await page.waitForTimeout(PAUSE_FIN_MS)
  }

  await contexte.close() // écrit la vidéo
  await navigateur.close()

  const webm = readdirSync(dossierVideo).filter((f) => f.endsWith('.webm')).map((f) => join(dossierVideo, f))[0]
  if (!webm) throw new Error('Aucune vidéo écrite par Playwright')
  log(`webm : ${webm} (${(statSync(webm).size / 1e6).toFixed(1)} Mo)`)

  if (!ffmpeg) {
    const cible = sortie.replace(/\.mp4$/i, '.webm')
    renameSync(webm, cible)
    console.log(`Sortie : ${cible}`)
    return
  }
  // H.264 yuv420p lisible partout (PowerPoint, VLC, lecteur Windows); dimensions paires garanties par 1700 x 960.
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', sortie], { stdio: 'inherit' })
  unlinkSync(webm)
  const secondes = duree(ffmpeg, sortie)
  const octets = statSync(sortie).size
  console.log(`Sortie : ${sortie}`)
  console.log(`Durée : ${Math.floor(secondes / 60)} min ${(secondes % 60).toFixed(1)} s · Taille : ${(octets / 1e6).toFixed(1)} Mo`)
  if (octets < TAILLE_MIN_OCTETS) throw new Error(`Vidéo trop petite (${octets} octets < 1 Mo) : enregistrement probablement vide`)

  // Trois images de contrôle : début, milieu, fin (avant la carte de fin).
  const base = sortie.replace(/\.mp4$/i, '')
  for (const [nom, t] of [['debut', 8], ['milieu', secondes / 2], ['fin', Math.max(0, secondes - PAUSE_FIN_MS / 1000 - 2)]]) {
    const png = `${base}-${nom}.png`
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(t.toFixed(1)), '-i', sortie, '-frames:v', '1', png])
    console.log(`Image : ${png} (à ${t.toFixed(0)} s)`)
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
