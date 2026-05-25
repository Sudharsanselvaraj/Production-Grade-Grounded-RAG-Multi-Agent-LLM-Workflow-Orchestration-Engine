import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import FeatureCards from '@/components/landing/FeatureCards'
import WorkflowSection from '@/components/landing/WorkflowSection'
import EnterpriseSections from '@/components/landing/EnterpriseSections'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F8F5] text-[#111111]">
      <Navbar />
      <Hero />
      <FeatureCards />
      <WorkflowSection />
      <EnterpriseSections />
    </main>
  )
}
