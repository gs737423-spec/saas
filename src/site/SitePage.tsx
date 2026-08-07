import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import NumbersSection from '@/site/sections/NumbersSection'
import ServicosSection from '@/site/sections/ServicosSection'
import MarketplacesSection from '@/site/sections/MarketplacesSection'
import ConversionSection from '@/site/sections/ConversionSection'
import Footer from '@/site/sections/Footer'
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton'

// Home institucional MKTOnline — reposicionamento "consultoria de e-commerce
// como produto principal" (2026-07). A MKTOnline é consultoria; a plataforma é
// um dos serviços, não a seção-argumento central — por isso a antiga
// ExperienceSection (fundida com "como atuamos") foi aposentada e virou
// ServicosSection (id="servicos", 4 serviços nomeados, um deles a própria
// plataforma). MarketplacesSection (id="plataforma" no bloco de
// seletores/screenshot, não no topo da seção) comunica a tecnologia como
// apoio da consultoria. FAQ continua fora da renderização —
// `#faq` é âncora de compatibilidade dentro de ConversionSection (Footer
// ainda linka pra lá). ComoTrabalhamosSection (pedido do usuário,
// 2026-08-07) e seus links/âncoras (`#como-trabalhamos`, `#como-funciona`)
// foram removidos — todo link que apontava pra lá agora vai pra `#conversao`
// (Contato). `#sobre` (Footer
// "Quem somos") é âncora de compatibilidade dentro de NumbersSection, que
// passou a ter `id="consultoria"` de verdade. NumbersSection permanece —
// regra explícita do usuário: não pode sair do ar nem ter números alterados,
// só a copy do lado esquerdo foi reescrita (ver content.tsx `about`).
// Componentes antigos (ServicesSection, HowItWorks, ProcessStep,
// processSteps, Faq, ProblemSection, PlatformShowcase, DiagnosticSection,
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
        {/* 2. Credibilidade + números — claro (mantida, números intocados) */}
        <NumbersSection />
        {/* 3. Serviços da consultoria (plataforma é um deles) — escuro */}
        <ServicosSection />
        {/* 4. Plataforma (screenshots/tabs/logos) — escuro */}
        <MarketplacesSection />
        {/* 5. Contato / CTA final — escuro, gradiente */}
        <ConversionSection />
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  )
}
