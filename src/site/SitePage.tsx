import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import NumbersSection from '@/site/sections/NumbersSection'
import ServicesSection from '@/site/sections/ServicesSection'
import MarketplacesSection from '@/site/sections/MarketplacesSection'
import HowItWorks from '@/site/sections/HowItWorks'
import ConversionSection from '@/site/sections/ConversionSection'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

// Home institucional Vintec — 8 seções. "Por que Vintec" deixou de ser
// seção independente (repetia argumentos de benefícios/como funciona) e foi
// incorporada como faixa final compacta dentro de HowItWorks. Demais seções
// antigas (ProblemSection, PlatformShowcase, DiagnosticSection,
// IntegrationsSecurity, WhatWeDo, PreviewSection, CommercialBanner, Demo,
// InstitutionalPlatformSection, InstitutionalSolutionSection,
// DifferentialsSection) continuam no repo fora da renderização pública.
// (PlatformCardSection e EcosystemMarquee foram removidos — órfãos, sem uso.)
export default function SitePage() {
  useEffect(() => {
    document.documentElement.classList.add('site-active')
    return () => document.documentElement.classList.remove('site-active')
  }, [])

  return (
    <div className="site-root site-root--dark">
      <SiteHeader />
      <main>
        {/* 1. Hero — escuro, gradiente */}
        <Hero />
        {/* 2. Quem Somos + métricas — claro */}
        <NumbersSection />
        {/* 3. Benefícios — escuro */}
        <ServicesSection />
        {/* 4. Marketplaces — claro */}
        <MarketplacesSection />
        {/* 5. Como funciona (+ faixa final) — claro */}
        <HowItWorks />
        {/* 6. Conversão — escuro, gradiente */}
        <ConversionSection />
        {/* 7. FAQ — claro */}
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
