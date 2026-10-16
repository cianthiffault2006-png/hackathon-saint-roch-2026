// Markdown (sous-ensemble : titres, citations, listes, tableaux, gras, code) vers PDF en gros caractères, par Chromium.
// Usage : node docs/pitch/md2pdf.cjs <entree.md> <sortie.pdf> [taille en pt, défaut 15]
// Requiert Playwright avec Chromium : PW_MODULE pointe vers un dossier node_modules/playwright (défaut : celui du dépôt, sinon
// un dossier déjà installé sur ce PC). Rien n'est envoyé en ligne.
const fs = require('fs')
const path = require('path')
const [entree, sortie, taille = '15'] = process.argv.slice(2)
if (!entree || !sortie) { console.error('Usage : node md2pdf.cjs entree.md sortie.pdf [pt]'); process.exit(2) }
const PW = process.env.PW_MODULE || (() => {
  for (const c of [path.join(__dirname, '..', '..', 'node_modules', 'playwright'), 'C:/Users/maeli/AppData/Local/Temp/claude/C--Users-maeli-cian-claude-claude-ecosystem/5c161595-9ea6-4de4-9254-e15944c04a15/scratchpad/pw/node_modules/playwright']) if (fs.existsSync(c)) return c
  throw new Error('Playwright introuvable : npm i -D playwright && npx playwright install chromium, ou PW_MODULE=...')
})()
const { chromium } = require(PW)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[ \]/g, '☐')

function md2html(md) {
  const out = []
  const lignes = md.split(/\r?\n/)
  let i = 0
  while (i < lignes.length) {
    const l = lignes[i]
    if (/^---+\s*$/.test(l)) { out.push('<hr>'); i++; continue }
    const h = l.match(/^(#{1,6})\s+(.*)$/)
    if (h) { const n = h[1].length; out.push(`<h${n}${n === 1 ? ' class="page"' : ''}>${inline(h[2])}</h${n}>`); i++; continue }
    if (l.startsWith('>')) {
      const b = []
      while (i < lignes.length && lignes[i].startsWith('>')) { b.push(inline(lignes[i].replace(/^>\s?/, ''))); i++ }
      out.push(`<blockquote>${b.join('<br>')}</blockquote>`); continue
    }
    if (l.startsWith('|')) {
      const rows = []
      while (i < lignes.length && lignes[i].startsWith('|')) { rows.push(lignes[i]); i++ }
      const cells = (r) => r.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => inline(c.trim()))
      const head = cells(rows[0])
      const body = rows.slice(1).filter((r) => !/^\|\s*-{3,}/.test(r)).map(cells)
      out.push('<table><thead><tr>' + head.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>')
      continue
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items = []
      while (i < lignes.length && /^\s*[-*]\s+/.test(lignes[i])) { items.push(inline(lignes[i].replace(/^\s*[-*]\s+/, ''))); i++ }
      out.push('<ul>' + items.map((x) => `<li>${x}</li>`).join('') + '</ul>'); continue
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      const items = []
      while (i < lignes.length && /^\s*\d+\.\s+/.test(lignes[i])) { items.push(inline(lignes[i].replace(/^\s*\d+\.\s+/, ''))); i++ }
      out.push('<ol>' + items.map((x) => `<li>${x}</li>`).join('') + '</ol>'); continue
    }
    if (l.trim() === '') { i++; continue }
    const p = []
    while (i < lignes.length && lignes[i].trim() !== '' && !/^(#|>|\||\s*[-*]\s|\s*\d+\.\s|---)/.test(lignes[i])) { p.push(inline(lignes[i])); i++ }
    out.push(`<p>${p.join('<br>')}</p>`)
  }
  return out.join('\n')
}

const css = `
@page { size: Letter; margin: 14mm 14mm 16mm 14mm; }
body { font-family: "Atkinson Hyperlegible", "Segoe UI", Arial, sans-serif; font-size: ${taille}pt; line-height: 1.35; color: #111; }
h1 { font-size: 1.7em; margin: 0 0 .4em; } h1.page { page-break-before: always; } h1.page:first-of-type { page-break-before: auto; }
h2 { font-size: 1.25em; margin: 1em 0 .3em; border-bottom: 2px solid #1f5c3a; padding-bottom: .15em; }
h3 { font-size: 1.1em; margin: .8em 0 .2em; }
blockquote { margin: .4em 0 .6em; padding: .4em .7em; border-left: 6px solid #b5401a; background: #fff6ee; font-size: 1.08em; }
table { border-collapse: collapse; width: 100%; margin: .5em 0; font-size: .92em; }
th, td { border: 1px solid #999; padding: .25em .45em; vertical-align: top; text-align: left; }
th { background: #eef3ee; }
code { font-family: Consolas, monospace; font-size: .9em; background: #f2f2f2; padding: 0 .2em; }
ul, ol { margin: .3em 0 .6em 1.3em; padding: 0; } li { margin: .15em 0; }
hr { border: 0; border-top: 1px dashed #999; margin: 1em 0; }
p { margin: .35em 0; }
`
;(async () => {
  const md = fs.readFileSync(entree, 'utf8')
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(path.basename(entree))}</title><style>${css}</style></head><body>${md2html(md)}</body></html>`
  const b = await chromium.launch()
  const p = await b.newPage()
  await p.setContent(html, { waitUntil: 'load' })
  fs.mkdirSync(path.dirname(path.resolve(sortie)), { recursive: true })
  await p.pdf({ path: sortie, format: 'Letter', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:9px;width:100%;text-align:center;color:#666">${esc(path.basename(entree))} · page <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' } })
  await b.close()
  console.log(`écrit ${sortie} (${(fs.statSync(sortie).size / 1024).toFixed(0)} ko)`)
})().catch((e) => { console.error(String(e)); process.exit(1) })
