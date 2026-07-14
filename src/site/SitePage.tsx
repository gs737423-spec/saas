import { useEffect } from 'react'
import './site.css'
import SiteHeader from '@/site/sections/SiteHeader'
import Hero from '@/site/sections/Hero'
import MarketplaceMarquee from '@/site/sections/MarketplaceMarquee'
import ProblemSection from '@/site/sections/ProblemSection'
import TransitionMark from '@/site/sections/TransitionMark'
import PlatformShowcase from '@/site/sections/PlatformShowcase'
import MetricsSection from '@/site/sections/MetricsSection'
import MarketplaceComparison from '@/site/sections/MarketplaceComparison'
import ProductIntelligence from '@/site/sections/ProductIntelligence'
import Product360 from '@/site/sections/Product360'
import HowItWorks from '@/site/sections/HowItWorks'
import Benefits from '@/site/sections/Benefits'
import Security from '@/site/sections/Security'
import Integrations from '@/site/sections/Integrations'
import FinalCta from '@/site/sections/FinalCta'
import DemoForm from '@/site/sections/DemoForm'
import Faq from '@/site/sections/Faq'
import Footer from '@/site/sections/Footer'

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
        <Hero />
        <MarketplaceMarquee />
        <ProblemSection />
        <TransitionMark />
        <PlatformShowcase />
        <MetricsSection />
        <MarketplaceComparison />
        <ProductIntelligence />
        <Product360 />
        <HowItWorks />
        <Benefits />
        <Security />
        <Integrations />
        <FinalCta />
        <DemoForm />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
