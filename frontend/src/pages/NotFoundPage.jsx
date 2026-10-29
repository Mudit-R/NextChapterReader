import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-dark-gray text-dark-gray dark:text-white">
      <Header />
      <main className="flex-1 flex items-center px-6 py-20 sm:py-28">
        <div className="max-w-5xl w-full mx-auto grid gap-10 md:grid-cols-2 md:gap-20 items-center">
          <div className="border-b md:border-b-0 md:border-r border-current/20 pb-10 md:pb-0 md:pr-16">
            <BookOpen className="w-12 h-12 mb-8 text-coral" aria-hidden="true" />
            <p className="text-xs uppercase tracking-widest mb-4 opacity-60">Page 404</p>
            <h1 className="text-5xl sm:text-7xl leading-none">A chapter<br />still unwritten.</h1>
          </div>
          <div>
            <p className="text-xl leading-relaxed mb-8 opacity-75">We couldn't find this page. The link may have changed, or the address may contain a typo.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/" className="px-6 py-3 bg-dark-gray dark:bg-white text-white dark:text-dark-gray text-center focus-visible:outline-2 focus-visible:outline-offset-4">Back to home</Link>
              <Link to="/books" className="px-6 py-3 border border-current inline-flex items-center justify-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4">Explore books <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
