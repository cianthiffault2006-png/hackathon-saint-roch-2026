# Finishes the deck built by build_deck.py through PowerPoint COM (ASCII only, PowerShell 5.1):
#   1. makes the embedded video of slide 6 play on click (one click in the slideshow), no loop, no autoplay;
#   2. exports every slide to PNG (1920x1080) in media\deck-png\ so they can be looked at;
#   3. exports the PDF next to the pptx (no video in a PDF: the pitch runs from the pptx).
# Usage: powershell -ExecutionPolicy Bypass -File docs/pitch/finish_deck.ps1 [-Pptx <path>]
param([string]$Pptx = "C:\Users\maeli\cian-claude\media\Maillage-pitch.pptx")
$ErrorActionPreference = "Stop"
$dir = Split-Path $Pptx
$png = Join-Path $dir "deck-png"
New-Item -ItemType Directory -Force $png | Out-Null
Get-ChildItem $png -Filter *.png | Remove-Item -Force
$pdf = [System.IO.Path]::ChangeExtension($Pptx, ".pdf")

$pp = New-Object -ComObject PowerPoint.Application
try {
  $p = $pp.Presentations.Open($Pptx, $false, $false, $false)   # read-write, no window
  $videos = 0
  foreach ($s in $p.Slides) {
    foreach ($sh in $s.Shapes) {
      if ($sh.Type -eq 16 -and $sh.MediaType -eq 3) {            # msoMedia, ppMediaTypeMovie
        $videos++
        # Remove any existing media effect, then add "play on click" (effect 83 = msoAnimEffectMediaPlay, trigger 1 = on click)
        $seq = $s.TimeLine.MainSequence
        for ($i = $seq.Count; $i -ge 1; $i--) { if ($seq.Item($i).Shape.Name -eq $sh.Name) { $seq.Item($i).Delete() } }
        $eff = $seq.AddEffect($sh, 83, 0, 1)
        $sh.AnimationSettings.PlaySettings.LoopUntilStopped = 0
        $sh.AnimationSettings.PlaySettings.RewindMovie = 0
        $sh.AnimationSettings.PlaySettings.PauseAnimation = 0
        try { $sh.MediaFormat.Volume = 0 } catch {}
        Write-Output ("video on slide {0}: '{1}' {2}x{3}, click-to-play effect added, main sequence count={4}" -f $s.SlideIndex, $sh.Name, [int]$sh.Width, [int]$sh.Height, $seq.Count)
      }
    }
  }
  $p.Save()
  $p.SaveAs($pdf, 32)
  foreach ($s in $p.Slides) {
    $s.Export((Join-Path $png ("slide-{0:D2}.png" -f $s.SlideIndex)), "PNG", 1920, 1080)
  }
  Write-Output ("slides={0} videos={1} pdf={2}" -f $p.Slides.Count, $videos, $pdf)
  $p.Close()
} finally { $pp.Quit() }
Get-ChildItem $png | Select-Object Name, Length | Format-Table -AutoSize | Out-String -Width 120
