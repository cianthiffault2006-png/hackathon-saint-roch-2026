#!/usr/bin/env node
// Enregistre la Visite guidée de bout en bout (vidéo de secours du pitch), en disposition téléphone telle que projetée.
//
//   node scripts/enregistrer-visite.mjs [--url <https://…/>] [--sortie <fichier.mp4>] [--suite] [--chrome] [--ips 15]
//
// Fenêtre 850 x 480 px CSS (sous le seuil téléphone de 900 px) à deviceScaleFactor 2 : vidéo 1700 x 960.
// Stockage vide (nouveau contexte), accueil, « Visite guidée », jusqu'à la carte de fin des 7 chapitres (≈ 2 min),
// puis la « Suite de la visite » (≈ 69 s) avec --suite. Trois images de contrôle (début, milieu, fin) à côté du .mp4.
// Rien ici n'est destiné au dépôt : la sortie va dans media/.
//
// Pourquoi des captures et non recordVideo : le screencast de Chrome rend les images en pixels CSS (850 x 480) quel
// que soit le deviceScaleFactor, donc recordVideo pose la page dans un coin d'une vidéo 1700 x 960 ; page.screenshot
// rend les vrais pixels (≈ 50 ms l'image), et ffmpeg assemble les images avec leurs durées réelles.
//
// Playwright n'est pas une dépendance du projet : on prend celui du projet s'il existe, sinon l'installation globale
// (npm i -g playwright@1.64.1). ffmpeg : winget install Gyan.FFmpeg.
import { createRequire } from 'node:module'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const args = process.argv.slice(2)
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 && args[i + 1] ? args[i + 1] : defaut }
const drapeau = (nom) => args.includes(nom)

const URL_DEFAUT = 'https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/'
const url = option('--url', URL_DEFAUT)
const sortie = resolve(option('--sortie', 'C:/Users/maeli/cian-claude/media/backup-d2.mp4'))
const avecSuite = drapeau('--suite')
const IPS = Number(option('--ips', '15'))
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
  const ok = (cmd) => spawnSync(cmd, ['-version'], { stdio: 'ignore' }).status === 0
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

/** Captures à intervalle régulier dans `dossier`, jusqu'à arret(); rend la liste (fichier, instant) pour ffmpeg. */
function capturer(page, dossier) {
  const images = []
  let actif = true
  const boucle = (async () => {
    const debut = Date.now()
    let n = 0
    while (actif) {
      const prevu = debut + (n * 1000) / IPS
      const retard = prevu - Date.now()
      if (retard > 0) await new Promise((r) => setTimeout(r, retard))
      const fichier = join(dossier, `${String(n).padStart(5, '0')}.jpg`)
      try {
        await page.screenshot({ path: fichier, type: 'jpeg', quality: 88 })
        images.push({ fichier, t: (Date.now() - debut) / 1000 })
      } catch { /* page fermée pendant la capture */ }
      n++
    }
  })()
  return { images, arret: async () => { actif = false; await boucle } }
}

async function main() {
  const ffmpeg = trouverFfmpeg()
  if (!ffmpeg) throw new Error('ffmpeg introuvable : winget install Gyan.FFmpeg (puis ouvrir un nouveau terminal)')
  const { chromium } = chargerPlaywright()

  mkdirSync(dirname(sortie), { recursive: true })
  const dossier = join(tmpdir(), `visite-${Date.now()}`)
  mkdirSync(dossier, { recursive: true })

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
  })
  const page = await contexte.newPage()
  const t0 = Date.now()
  const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s] ${m}`)

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.waitForTimeout(1500)
  log('accueil')

  const capture = capturer(page, dossier)
  await page.waitForTimeout(1000)
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

  await capture.arret()
  await navigateur.close()
  const images = capture.images
  if (images.length < IPS * 10) throw new Error(`Trop peu d'images capturées (${images.length})`)
  log(`${images.length} images (${(images.length / images[images.length - 1].t).toFixed(1)} i/s réelles)`)

  // Liste concat avec la durée réelle de chaque image, puis H.264 yuv420p lisible partout (PowerPoint, VLC, Windows).
  const liste = join(dossier, 'liste.txt')
  const lignes = images.map((im, i) => {
    const suivante = images[i + 1]?.t ?? im.t + 1 / IPS
    return `file '${im.fichier.replace(/\\/g, '/').replace(/'/g, "'\\''")}'\nduration ${(suivante - im.t).toFixed(4)}`
  })
  writeFileSync(liste, [...lignes, `file '${images[images.length - 1].fichier.replace(/\\/g, '/')}'`].join('\n') + '\n')
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', sortie], { stdio: 'inherit' })
  rmSync(dossier, { recursive: true, force: true })

  const secondes = duree(ffmpeg, sortie)
  const octets = statSync(sortie).size
  console.log(`Sortie : ${sortie}`)
  console.log(`Durée : ${Math.floor(secondes / 60)} min ${(secondes % 60).toFixed(1)} s · Taille : ${(octets / 1e6).toFixed(1)} Mo · ${LARGEUR * ECHELLE} x ${HAUTEUR * ECHELLE}`)
  if (octets < TAILLE_MIN_OCTETS) throw new Error(`Vidéo trop petite (${octets} octets < 1 Mo) : enregistrement probablement vide`)

  // Trois images de contrôle : début, milieu, fin (avant la carte de fin).
  const base = sortie.replace(/\.mp4$/i, '')
  for (const [nom, t] of [['debut', 8], ['milieu', secondes / 2], ['fin', Math.max(0, secondes - PAUSE_FIN_MS / 1000 - 2)]]) {
    const png = `${base}-${nom}.png`
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', t.toFixed(1), '-i', sortie, '-frames:v', '1', png])
    console.log(`Image : ${png} (à ${t.toFixed(0)} s)`)
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
