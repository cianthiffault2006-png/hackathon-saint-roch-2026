#!/usr/bin/env node
// Enregistre la Visite guidée de bout en bout (vidéo de secours ou démo vidéo du pitch).
//
//   node scripts/enregistrer-visite.mjs [--url <https://…/>] [--sortie <fichier.mp4>] [--suite] [--chrome] [--ips 15]
//   node scripts/enregistrer-visite.mjs --portrait [--url …] [--sortie tour-cadre-complet.mp4] [--court [tour-cadre-court.mp4]]
//
// Paysage (défaut) : fenêtre 850 x 480 px CSS (sous le seuil téléphone de 900 px) à l'échelle 2, vidéo 1700 x 960.
// Portrait (--portrait) : fenêtre 390 x 844 px CSS à l'échelle 3 (iPhone), chaque image composée dans un cadre de
// téléphone (bord sombre fin, coins ronds, ombre douce, sans logo) centré sur un fond 1920 x 1080 aux couleurs du
// « point de maille » (--papier, --lin). --court ajoute une version courte : chapitres 1 à 5 puis la carte de fin,
// fondu enchaîné de 0,3 s à la coupe, d'après les changements de chapitre réellement observés dans la barre de visite.
// Stockage vide (nouveau contexte), accueil, « Visite guidée », jusqu'à la carte de fin des 7 chapitres (≈ 2 min),
// puis la « Suite de la visite » (≈ 69 s) avec --suite. Trois images de contrôle (début, milieu, fin) à côté de chaque .mp4.
// Rien ici n'est destiné au dépôt : la sortie va dans media/.
//
// Pourquoi des captures et non recordVideo : le screencast de Chrome rend les images en pixels CSS quel que soit le
// deviceScaleFactor ; page.screenshot rend les vrais pixels, et ffmpeg assemble les images avec leurs durées réelles.
//
// Playwright n'est pas une dépendance du projet : on prend celui du projet s'il existe, sinon l'installation globale
// (npm i -g playwright@1.64.1). ffmpeg : winget install Gyan.FFmpeg.
import { createRequire } from 'node:module'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { deflateSync } from 'node:zlib'

const args = process.argv.slice(2)
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : defaut }
const drapeau = (nom) => args.includes(nom)

const URL_DEFAUT = 'https://cianthiffault2006-png.github.io/hackathon-saint-roch-2026/'
const MEDIA = 'C:/Users/maeli/cian-claude/media'
const url = option('--url', URL_DEFAUT)
const portrait = drapeau('--portrait')
const sortie = resolve(option('--sortie', portrait ? `${MEDIA}/tour-cadre-complet.mp4` : `${MEDIA}/backup-d2.mp4`))
const sortieCourt = portrait && drapeau('--court') ? resolve(option('--court', `${MEDIA}/tour-cadre-court.mp4`)) : null
const avecSuite = drapeau('--suite')
const IPS = Number(option('--ips', portrait ? '12' : '15'))
const ECRAN = portrait ? { largeur: 390, hauteur: 844, echelle: 3 } : { largeur: 850, hauteur: 480, echelle: 2 }
const TAILLE_MIN_OCTETS = 1024 * 1024
const PAUSE_FIN_MS = 3000
const FONDU_S = 0.3

// Cadre 1920 x 1080 : écran 434 x 940 (1170 x 2532 réduit), bord de 12 px, coins ronds, ombre portée.
const CADRE = { largeur: 1920, hauteur: 1080, ecran: { l: 434, h: 940, r: 52 }, bord: 12, rBord: 64, ombre: { dy: 18, flou: 44, alpha: 0.32 } }
const COULEURS = { papier: [247, 241, 230], lin: [239, 231, 216], bord: [31, 31, 31] }

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

// --- PNG minimal (pas de dépendance) : RGBA ou gris, 8 bits, sans filtre. ---
const TABLE_CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = TABLE_CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function png(largeur, hauteur, pixels, gris = false) {
  const canaux = gris ? 1 : 4
  const brut = Buffer.alloc((largeur * canaux + 1) * hauteur)
  for (let y = 0; y < hauteur; y++) pixels.copy(brut, y * (largeur * canaux + 1) + 1, y * largeur * canaux, (y + 1) * largeur * canaux)
  const morceau = (type, donnees) => {
    const t = Buffer.from(type, 'latin1')
    const long = Buffer.alloc(4); long.writeUInt32BE(donnees.length)
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, donnees])))
    return Buffer.concat([long, t, donnees, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largeur, 0); ihdr.writeUInt32BE(hauteur, 4); ihdr[8] = 8; ihdr[9] = gris ? 0 : 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), morceau('IHDR', ihdr), morceau('IDAT', deflateSync(brut)), morceau('IEND', Buffer.alloc(0))])
}

/** Distance signée d'un point au rectangle arrondi (négative dedans). */
function distanceRect(px, py, cx, cy, demiL, demiH, r) {
  const qx = Math.abs(px - cx) - (demiL - r), qy = Math.abs(py - cy) - (demiH - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}
const couverture = (d) => Math.min(1, Math.max(0, 0.5 - d))

/** Fond papier avec une grille lin discrète, ombre portée, bord sombre : l'écran se pose dessus. Et le masque de l'écran. */
function dessinerCadre(dossier) {
  const { largeur, hauteur, ecran, bord, rBord, ombre } = CADRE
  const bl = ecran.l + 2 * bord, bh = ecran.h + 2 * bord
  const cx = largeur / 2, cy = hauteur / 2
  const fond = Buffer.alloc(largeur * hauteur * 4)
  for (let y = 0; y < hauteur; y++) for (let x = 0; x < largeur; x++) {
    const grille = x % 48 === 0 || y % 48 === 0
    let [r, g, b] = grille ? COULEURS.lin : COULEURS.papier
    const dOmbre = distanceRect(x + 0.5, y + 0.5 - ombre.dy, cx, cy, bl / 2, bh / 2, rBord)
    const aOmbre = ombre.alpha * (1 - Math.min(1, Math.max(0, dOmbre / ombre.flou)))
    r *= 1 - aOmbre; g *= 1 - aOmbre; b *= 1 - aOmbre
    const aBord = couverture(distanceRect(x + 0.5, y + 0.5, cx, cy, bl / 2, bh / 2, rBord))
    r = r * (1 - aBord) + COULEURS.bord[0] * aBord; g = g * (1 - aBord) + COULEURS.bord[1] * aBord; b = b * (1 - aBord) + COULEURS.bord[2] * aBord
    const i = (y * largeur + x) * 4
    fond[i] = r; fond[i + 1] = g; fond[i + 2] = b; fond[i + 3] = 255
  }
  const masque = Buffer.alloc(ecran.l * ecran.h)
  for (let y = 0; y < ecran.h; y++) for (let x = 0; x < ecran.l; x++) {
    masque[y * ecran.l + x] = Math.round(255 * couverture(distanceRect(x + 0.5, y + 0.5, ecran.l / 2, ecran.h / 2, ecran.l / 2, ecran.h / 2, ecran.r)))
  }
  const cadre = join(dossier, 'cadre.png'), masqueFichier = join(dossier, 'masque.png')
  writeFileSync(cadre, png(largeur, hauteur, fond))
  writeFileSync(masqueFichier, png(ecran.l, ecran.h, masque, true))
  return { cadre, masque: masqueFichier, x: Math.round(cx - ecran.l / 2), y: Math.round(cy - ecran.h / 2) }
}

/** Captures à intervalle régulier dans `dossier`, jusqu'à arret(); rend la liste (fichier, instant) pour ffmpeg. */
function capturer(page, dossier) {
  const images = []
  const debut = Date.now()
  let actif = true
  const boucle = (async () => {
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
  return { images, instant: () => (Date.now() - debut) / 1000, arret: async () => { actif = false; await boucle } }
}

/** Suit la barre de visite (« 3/7 · La proposition ») et note chaque changement de chapitre avec son instant. */
function suivreChapitres(page, capture) {
  const chapitres = []
  let actif = true
  const boucle = (async () => {
    let dernier = ''
    while (actif) {
      await new Promise((r) => setTimeout(r, 150))
      const texte = await page.evaluate(() => document.querySelector('.visite-chapitre span[aria-hidden="true"]')?.textContent ?? '').catch(() => '')
      if (texte && texte !== dernier) {
        const m = /(\d+)\/(\d+)\s*·\s*(.+)$/.exec(texte)
        if (m) chapitres.push({ n: Number(m[1]), titre: m[3].trim(), t: capture.instant() })
        dernier = texte
      }
    }
  })()
  return { chapitres, arret: async () => { actif = false; await boucle } }
}

function listeConcat(images, dossier) {
  const liste = join(dossier, 'liste.txt')
  const chemin = (f) => f.replace(/\\/g, '/').replace(/'/g, "'\\''")
  const lignes = images.map((im, i) => `file '${chemin(im.fichier)}'\nduration ${((images[i + 1]?.t ?? im.t + 1 / IPS) - im.t).toFixed(4)}`)
  writeFileSync(liste, [...lignes, `file '${chemin(images[images.length - 1].fichier)}'`].join('\n') + '\n')
  return liste
}

// H.264 High yuv420p 30 i/s constant, faststart : lisible dans PowerPoint, VLC et le lecteur Windows.
// Les JPEG sont en pleine plage (yuvj420p) : on convertit explicitement en plage limitée BT.709, sinon le fichier
// garde l'étiquette « full range » et certains lecteurs l'affichent délavé.
const PLAGE = 'scale=in_range=auto:out_range=tv:out_color_matrix=bt709,format=yuv420p'
const ENCODAGE = ['-r', '30', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', '-an']

function imagesDeControle(ffmpeg, fichier, secondes) {
  const base = fichier.replace(/\.mp4$/i, '')
  for (const [nom, t] of [['debut', Math.min(8, secondes / 4)], ['milieu', secondes / 2], ['fin', Math.max(0, secondes - 1.5)]]) {
    const png = `${base}-${nom}.png`
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', t.toFixed(1), '-i', fichier, '-frames:v', '1', png])
    console.log(`Image : ${png} (à ${t.toFixed(0)} s)`)
  }
}

function bilan(ffmpeg, fichier, dims) {
  const secondes = duree(ffmpeg, fichier)
  const octets = statSync(fichier).size
  console.log(`Sortie : ${fichier}`)
  console.log(`Durée : ${Math.floor(secondes / 60)} min ${(secondes % 60).toFixed(1)} s · Taille : ${(octets / 1e6).toFixed(1)} Mo · ${dims}`)
  if (octets < TAILLE_MIN_OCTETS) throw new Error(`Vidéo trop petite (${octets} octets < 1 Mo) : enregistrement probablement vide`)
  imagesDeControle(ffmpeg, fichier, secondes)
  return secondes
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
    viewport: { width: ECRAN.largeur, height: ECRAN.hauteur },
    deviceScaleFactor: ECRAN.echelle,
    isMobile: portrait,
    hasTouch: portrait,
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
  const suivi = suivreChapitres(page, capture)
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Visite guidée' }).click()
  log('visite lancée')
  const carteFin = page.getByRole('dialog', { name: 'Visite guidée' })
  await carteFin.waitFor({ state: 'visible', timeout: 4 * 60 * 1000 })
  const tCarteFin = capture.instant()
  log('carte de fin (7 chapitres)')
  await page.waitForTimeout(PAUSE_FIN_MS)

  if (avecSuite) {
    await carteFin.getByRole('button', { name: 'Continuer la visite' }).click()
    log('suite lancée')
    await page.getByRole('dialog', { name: 'Suite de la visite' }).waitFor({ state: 'visible', timeout: 3 * 60 * 1000 })
    log('carte de fin (suite)')
    await page.waitForTimeout(PAUSE_FIN_MS)
  }

  await suivi.arret()
  await capture.arret()
  await navigateur.close()
  const images = capture.images
  if (images.length < IPS * 10) throw new Error(`Trop peu d'images capturées (${images.length})`)
  log(`${images.length} images (${(images.length / images[images.length - 1].t).toFixed(1)} i/s réelles)`)
  for (const c of suivi.chapitres) log(`chapitre ${c.n} « ${c.titre} » à ${c.t.toFixed(1)} s`)
  const liste = listeConcat(images, dossier)

  if (!portrait) {
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-vf', PLAGE, ...ENCODAGE, sortie], { stdio: 'inherit' })
    rmSync(dossier, { recursive: true, force: true })
    bilan(ffmpeg, sortie, `${ECRAN.largeur * ECRAN.echelle} x ${ECRAN.hauteur * ECRAN.echelle}`)
    return
  }

  // Portrait : chaque image réduite à 434 x 940, coins arrondis par le masque, posée sur le cadre.
  const cadre = dessinerCadre(dossier)
  const { ecran } = CADRE
  const filtre = `[0:v]scale=${ecran.l}:${ecran.h}:flags=lanczos,format=rgba[e];[2:v]format=gray[m];[e][m]alphamerge[ea];[1:v][ea]overlay=${cadre.x}:${cadre.y}:shortest=1,${PLAGE}[v]`
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-loop', '1', '-i', cadre.cadre, '-i', cadre.masque, '-filter_complex', filtre, '-map', '[v]', ...ENCODAGE, sortie], { stdio: 'inherit' })
  rmSync(dossier, { recursive: true, force: true })
  const secondes = bilan(ffmpeg, sortie, `${CADRE.largeur} x ${CADRE.hauteur}`)

  if (sortieCourt) {
    // Chapitres 1 à 5, puis la carte de fin, fondu enchaîné de 0,3 s à la coupe (instants observés dans la barre).
    const debutCh6 = suivi.chapitres.find((c) => c.n === 6)?.t
    if (!debutCh6) throw new Error('Chapitre 6 non observé : version courte impossible')
    const finA = debutCh6 - 0.2, debutB = tCarteFin + 0.2
    const filtreCourt = `[0:v]split[s1][s2];[s1]trim=0:${finA.toFixed(3)},setpts=PTS-STARTPTS[a];[s2]trim=${debutB.toFixed(3)}:${secondes.toFixed(3)},setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=${FONDU_S}:offset=${(finA - FONDU_S).toFixed(3)},format=yuv420p[v]`
    // (la source est déjà en plage limitée ; xfade travaille dessus sans la changer)
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', sortie, '-filter_complex', filtreCourt, '-map', '[v]', ...ENCODAGE, sortieCourt], { stdio: 'inherit' })
    console.log(`Version courte : chapitres 1-5 (0 à ${finA.toFixed(1)} s) + carte de fin (${debutB.toFixed(1)} s à ${secondes.toFixed(1)} s)`)
    bilan(ffmpeg, sortieCourt, `${CADRE.largeur} x ${CADRE.hauteur}`)
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
