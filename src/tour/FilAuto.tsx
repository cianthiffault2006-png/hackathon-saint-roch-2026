import { useEffect, useRef } from 'react'

/** Guided tour only: drives the real project thread (Discussion tab, one message, Camille's reply). */
export default function FilAuto({ ms }: { ms: number }) {
  const etape = useRef(0)

  useEffect(() => {
    if (ms > 300 && etape.current === 0) {
      etape.current = 1
      document.querySelector<HTMLButtonElement>('#pj-tab-discussion')?.click()
    }
    if (ms > 700 && etape.current === 1) {
      const champ = document.querySelector<HTMLTextAreaElement>('.pj-champ textarea')
      const valeur = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      if (champ && valeur) {
        etape.current = 2
        valeur.call(champ, 'Super idée, je prépare le mur jeudi !')
        champ.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
    if (ms > 900 && etape.current === 2) {
      // Wait until React has enabled the button for the typed text.
      const envoyer = document.querySelector<HTMLButtonElement>('.pj-carte button[type=submit]')
      if (envoyer && !envoyer.disabled) {
        etape.current = 3
        envoyer.click()
      }
    }
  }, [ms])

  return null
}
