import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import NumbersSection from '@/site/sections/NumbersSection'
import ServicesSection from '@/site/sections/ServicesSection'
import MarketplacesSection from '@/site/sections/MarketplacesSection'
import HowItWorks from '@/site/sections/HowItWorks'
import DifferentialsSection from '@/site/sections/DifferentialsSection'
import ConversionSection from '@/site/sections/ConversionSection'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

// Home institucional Vintec — 9 seções, narrativa comercial direta (hero →
// Quem Somos → o que muda na prática → marketplaces → como começamos → por
// que Vintec → conversão → FAQ → footer). A antiga seção institucional com
// pessoa (InstitutionalSolutionSection/InstitutionalPlatformSection) foi
// removida da renderização: repetia o argumento do hero e de Quem Somos sem
// resposta comercial nova. Demais seções antigas (ProblemSection,
// PlatformShowcase, DiagnosticSection, IntegrationsSecurity, WhatWeDo,
// PreviewSection, PlatformCardSection, EcosystemMarquee, CommercialBanner,
// Demo) continuam no repo fora da renderização pública.
export default function SitePage() {
  useEffect(() => {
    document.documentElement.classList.add('site-active')
    return () => document.documentElement.classList.remove('site-active')
  }, [])

  return (
    <div className="site-root site-root--dark">
      <SiteHeader />
      <main>
        {/* 1. Hero — gradiente escuro azul-marinho */}
        <Hero />
        {/* 2. Quem Somos + métricas — canvas */}
        <NumbersSection />
        {/* 3. O que muda na prática — warm */}
        <ServicesSection />
        {/* 4. Marketplaces — ink-900 */}
        <MarketplacesSection />
        {/* 5. Como começamos — cool */}
        <HowItWorks />
        {/* 6. Por que Vintec — warm */}
        <DifferentialsSection />
        {/* 7. Conversão — gradiente escuro azul → azul vivo */}
        <ConversionSection />
        {/* 8. FAQ — canvas */}
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
