import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import HospitalsSection from '../components/HospitalsSection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-white font-sans overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <hr className="border-none border-t border-white/[0.06]" />
        <HospitalsSection />
      </main>
      <Footer />
    </div>
  )
}
