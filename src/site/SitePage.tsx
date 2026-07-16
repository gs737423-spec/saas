import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import NumbersSection from '@/site/sections/NumbersSection'
import WhatWeDo from '@/site/sections/WhatWeDo'
import ServicesSection from '@/site/sections/ServicesSection'
import EcosystemMarquee from '@/site/sections/EcosystemMarquee'
import HowItWorks from '@/site/sections/HowItWorks'
import DifferentialsSection from '@/site/sections/DifferentialsSection'
import CommercialBanner from '@/site/sections/CommercialBanner'
import Demo from '@/site/sections/Demo'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'
import { commercialBanners } from '@/site/content'

// Seções antigas (ProblemSection, PlatformShowcase, DiagnosticSection,
// IntegrationsSecurity) saíram da renderização pública na reformulação
// Vintec — dependiam de screenshot de dashboard, fora do escopo comercial
// novo. O código continua no repo (src/site/sections/), não foi apagado.
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
        {/* 1. Promessa — hero com slider */}
        <Hero />
        {/* 2. Quem é a Vintec + números */}
        <NumbersSection />
        {/* 3. O que a Vintec faz */}
        <WhatWeDo />
        {/* 4. Serviços */}
        <ServicesSection />
        {/* 5. Marketplaces atendidos */}
        <EcosystemMarquee />
        {/* 6. Como funciona */}
        <HowItWorks />
        {/* 7. Diferenciais */}
        <DifferentialsSection />
        {/* 8. Banners comerciais humanizados */}
        {commercialBanners.map((b) => <CommercialBanner key={b.id} content={b} />)}
        {/* 9. Conversão */}
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
