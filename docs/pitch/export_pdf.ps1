# Export des diapos en PDF, une seule commande pour le gel de 12 h 30 (Windows, PowerPoint installe).
# Usage (depuis la racine du depot ou n'importe ou) :
#   powershell -ExecutionPolicy Bypass -File docs/pitch/export_pdf.ps1
#   ... -Sortie "C:\chemin\slides.pdf"   (defaut : C:\Users\maeli\cian-claude\media\slides.pdf)
#   ... -SansBuild                        (ne pas reconstruire Maillage.pptx avant)
# Etapes : build_pptx.py (slides-fr.md + img/) -> Maillage.pptx -> PowerPoint (COM) -> PDF -> verification
# (7 pages, images presentes, aucun crochet "[" sur une diapo). Fichier en ASCII pour PowerShell 5.1.
param(
  [string]$Sortie = "C:\Users\maeli\cian-claude\media\slides.pdf",
  [switch]$SansBuild
)
$ErrorActionPreference = "Stop"
$racine = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$pptx = Join-Path $PSScriptRoot "Maillage.pptx"

if (-not $SansBuild) {
  Push-Location $racine
  try { py -3.12 docs/pitch/build_pptx.py } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw "build_pptx.py a echoue" }
}

New-Item -ItemType Directory -Force (Split-Path $Sortie) | Out-Null
if (Test-Path $Sortie) { Remove-Item $Sortie -Force }

$pp = New-Object -ComObject PowerPoint.Application
try {
  $p = $pp.Presentations.Open($pptx, $true, $false, $false)   # lecture seule, sans fenetre
  $p.SaveAs($Sortie, 32)                                       # 32 = ppSaveAsPDF
  $p.Close()
} finally { $pp.Quit() }

$verif = @"
import sys
from pypdf import PdfReader
from pptx import Presentation
r = PdfReader(sys.argv[1]); n = len(r.pages)
imgs = [len(p.images) for p in r.pages]
pres = Presentation(sys.argv[2])
bad = [i for i, s in enumerate(pres.slides, 1) if any(sh.has_text_frame and '[' in sh.text_frame.text for sh in s.shapes)]
print('pages=%d images_par_page=%s crochets_sur_diapos=%s' % (n, imgs, bad or 'aucun'))
sys.exit(0 if n == 7 and not bad and sum(imgs) >= 5 else 1)
"@
$verif | py -3.12 - $Sortie $pptx
if ($LASTEXITCODE -ne 0) { throw "Verification echouee : voir la ligne ci-dessus" }
Get-Item $Sortie | Select-Object FullName, Length, LastWriteTime
Write-Output "OK. Reste a faire a la main : copier $Sortie sur la cle USB et le deuxieme portable, et l'ouvrir dans Chrome (onglet 2)."
