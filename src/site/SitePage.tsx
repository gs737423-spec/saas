import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import MarketplaceMarquee from '@/site/sections/MarketplaceMarquee'
import ProblemSection from '@/site/sections/ProblemSection'
import PlatformShowcase from '@/site/sections/PlatformShowcase'
import IntelligenceSection from '@/site/sections/IntelligenceSection'
import HowItWorks from '@/site/sections/HowItWorks'
import Benefits from '@/site/sections/Benefits'
import FinalCta from '@/site/sections/FinalCta'
import DemoForm from '@/site/sections/DemoForm'
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
        {/* 1. Hero + marquee */}
        <Hero />
        <MarketplaceMarquee />
        {/* 2. Problema e solução */}
        <ProblemSection />
        {/* 3. Plataforma interativa */}
        <PlatformShowcase />
        {/* 4. Inteligência da operação */}
        <IntelligenceSection />
        {/* 5. Como funciona (API) + integrações */}
        <HowItWorks />
        {/* 6. Benefícios e confiança */}
        <Benefits />
        {/* 7. Conversão */}
        <FinalCta />
        <DemoForm />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
