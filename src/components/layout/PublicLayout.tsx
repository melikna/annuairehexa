import { Header } from './Header'
import { Footer } from './Footer'
import { CookieConsentBanner } from './CookieConsentBanner'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  )
}
