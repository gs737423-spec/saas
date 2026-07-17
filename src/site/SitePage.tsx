import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import InstitutionalPlatformSection from '@/site/sections/InstitutionalPlatformSection'
import PlatformFeaturesSection from '@/site/sections/PlatformFeaturesSection'
import NumbersSection from '@/site/sections/NumbersSection'
import EcosystemMarquee from '@/site/sections/EcosystemMarquee'
import HowItWorks from '@/site/sections/HowItWorks'
import DifferentialsSection from '@/site/sections/DifferentialsSection'
import Demo from '@/site/sections/Demo'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

// Home dark-first (direção premium Vintec). Seções antigas preservadas no
// repo mas fora da renderização pública: ProblemSection, PlatformShowcase,
// DiagnosticSection, IntegrationsSecurity (screenshot de dashboard),
// ServicesSection, WhatWeDo e CommercialBanner (substituídas pelas seções
// institucional + plataforma).
export default function SitePage() {
  useEffect(() => {
    document.documentElement.classList.add('site-active')
    return () => document.documentElement.classList.remove('site-active')
  }, [])

  return (
    <div className="site-root site-root--dark">
      <SiteHeader />
      <main>
        {/* 1. Hero slider */}
        <Hero />
        {/* 2. Quem Somos + números */}
        <NumbersSection />
        {/* 3. Institucional — plataforma + pessoa */}
        <InstitutionalPlatformSection />
        {/* 4. A plataforma Vintec — bloco único */}
        <PlatformFeaturesSection />
        {/* 5. Marketplaces */}
        <EcosystemMarquee />
        {/* 6. Como funciona */}
        <HowItWorks />
        {/* 7. Diferenciais */}
        <DifferentialsSection />
        {/* 8. Conversão final */}
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
