import Navbar from './Navbar'
import Footer from './Footer'
import BottomNav from './BottomNav'
import PageTransition from '../ui/PageTransition'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only-focusable fixed top-2 left-2 z-[999] bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageTransition />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
