import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import EcosystemMarquee from '@/site/sections/EcosystemMarquee'
import ProblemSection from '@/site/sections/ProblemSection'
import PlatformShowcase from '@/site/sections/PlatformShowcase'
import DiagnosticSection from '@/site/sections/DiagnosticSection'
import HowItWorks from '@/site/sections/HowItWorks'
import IntegrationsSecurity from '@/site/sections/IntegrationsSecurity'
import Demo from '@/site/sections/Demo'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

export default function SitePage() {
  // Ativa o scroll suave escopado ao site (não afeta a área /app).
  useEffect(() => {
    document.documentElement.classList.add('site-active')
    return () => document.documentElement.classList.remove('site-active')
  }, [])

  return (
    <div className="site-root">
      <SiteHeader />
      <main>
        {/* 1. Promessa */}
        <Hero />
        {/* 2. Prova técnica — ecossistema + confiança */}
        <EcosystemMarquee />
        {/* 3. Problema */}
        <ProblemSection />
        {/* 4. Produto imersivo */}
        <PlatformShowcase />
        {/* 5. Diagnóstico executivo */}
        <DiagnosticSection />
        {/* 6. Como funciona */}
        <HowItWorks />
        {/* 7. Integração e segurança */}
        <IntegrationsSecurity />
        {/* 8. Conversão */}
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
