import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isShareRequest } from './editor/share.ts'
import { SiteViewer } from './view/SiteViewer.tsx'

const share = isShareRequest(
  typeof window === 'undefined' ? '' : window.location.search,
  typeof window === 'undefined' ? '' : window.location.hash,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{share ? <SiteViewer /> : <App />}</StrictMode>,
)
