import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import NumbersSection from '@/site/sections/NumbersSection'
import InstitutionalPlatformSection from '@/site/sections/InstitutionalPlatformSection'
import PlatformCardSection from '@/site/sections/PlatformCardSection'
import PreviewSection from '@/site/sections/PreviewSection'
import EcosystemMarquee from '@/site/sections/EcosystemMarquee'
import HowItWorks from '@/site/sections/HowItWorks'
import DifferentialsSection from '@/site/sections/DifferentialsSection'
import CommercialBanner from '@/site/sections/CommercialBanner'
import Demo from '@/site/sections/Demo'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'
import { commercialBanners } from '@/site/content'

// Home dark-first (direção premium Vintec). Seções antigas baseadas em
// screenshot de dashboard (ProblemSection, PlatformShowcase,
// DiagnosticSection, IntegrationsSecurity) e o WhatWeDo (fundido no bloco
// institucional) continuam no repo, fora da renderização pública.
export default function SitePage() {
  useEffect(() => {
    document.documentElement.classList.add('site-active')
    return () => document.documentElement.classList.remove('site-active')
  }, [])

  return (
    <div className="site-root site-root--dark">
      <SiteHeader />
      <main>
        {/* 1. Promessa — hero slider dark */}
        <Hero />
        {/* 2. Quem Somos + números */}
        <NumbersSection />
        {/* 3. Institucional — pessoa consultora + texto */}
        <InstitutionalPlatformSection />
        {/* 4. O que você recebe — card vertical único */}
        <PlatformCardSection />
        {/* 5. Prévia da plataforma — print do dashboard */}
        <PreviewSection />
        {/* 4. Marketplaces */}
        <EcosystemMarquee />
        {/* 5. Como funciona */}
        <HowItWorks />
        {/* 6. Banner humanizado — organização */}
        <CommercialBanner content={commercialBanners[0]} />
        {/* 7. Diferenciais */}
        <DifferentialsSection />
        {/* 8. Banner humanizado — proximidade / especialista */}
        <CommercialBanner content={commercialBanners[1]} />
        {/* 9. Conversão final */}
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
