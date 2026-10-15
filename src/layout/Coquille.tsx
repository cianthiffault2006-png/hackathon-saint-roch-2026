import type { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'
import type { Rubrique } from './rubriques'
import './bureau.css'

interface Props {
  rubrique: Rubrique
  nbProjets: number
  /** Guided tour: the sidebar is inert, like the screens. */
  inerte: boolean
  onAller: (rubrique: Rubrique) => void
  children: ReactNode
}

/**
 * App shell. On a phone the wrapper is display: contents and the sidebar is hidden, so the app renders exactly as before.
 * From 900 px wide (bureau.css): the sidebar on the left, the app in the main pane, which contains its fixed screens.
 */
export default function Coquille({ rubrique, nbProjets, inerte, onAller, children }: Props) {
  return (
    <div className={inerte ? 'coquille coquille-inerte' : 'coquille'}>
      <Sidebar pageActive={rubrique} onNaviguer={onAller} nombreProjets={nbProjets} inerte={inerte} />
      {children}
    </div>
  )
}
