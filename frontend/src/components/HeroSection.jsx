import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="bg-dark-gray dark:bg-white py-32 md:py-40">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="col-span-12 md:col-span-8">
            {/* Label */}
            <div className="mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-white dark:text-dark-gray border-b-2 border-white dark:border-dark-gray pb-2 inline-block">
                AI-Powered Reading
              </span>
            </div>

            {/* Main Heading - Swiss Style */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl text-white dark:text-dark-gray mb-12 leading-none tracking-tight">
              Your Next
              <br />
              Chapter
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/70 dark:text-dark-gray/70 mb-16 max-w-2xl leading-relaxed font-light">
              Discover a revolutionary online bookstore where AI meets literature. 
              Explore thousands of books, get personalized recommendations, and enjoy 
              an immersive reading experience.
            </p>

            {/* CTA Button - Swiss Style with Inversion Animation */}
            <Link 
              to="/books" 
              className="group inline-flex items-center gap-3 bg-white dark:bg-dark-gray text-dark-gray dark:text-white px-8 py-4 text-sm font-medium uppercase tracking-widest border-2 border-white dark:border-dark-gray transition-all duration-300 hover:bg-dark-gray dark:hover:bg-white hover:text-white dark:hover:text-dark-gray overflow-hidden relative"
            >
              <span className="relative z-10 transition-colors duration-300">Explore Books</span>
              <ArrowRight 
                className="w-4 h-4 relative z-10 transition-all duration-300 -translate-x-5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" 
              />
            </Link>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="col-span-12 md:col-span-4 border-t-2 border-white dark:border-dark-gray pt-12 md:pt-0 md:border-t-0 md:border-l-2 md:pl-12">
            <div className="space-y-16">
              <div>
                <div className="text-6xl md:text-7xl text-white dark:text-dark-gray mb-4 leading-none">10K+</div>
                <div className="text-xs font-medium uppercase tracking-widest text-white/60 dark:text-dark-gray/60">Books</div>
              </div>
              <div>
                <div className="text-6xl md:text-7xl text-white dark:text-dark-gray mb-4 leading-none">50K+</div>
                <div className="text-xs font-medium uppercase tracking-widest text-white/60 dark:text-dark-gray/60">Readers</div>
              </div>
              <div>
                <div className="text-6xl md:text-7xl text-white dark:text-dark-gray mb-4 leading-none">4.8</div>
                <div className="text-xs font-medium uppercase tracking-widest text-white/60 dark:text-dark-gray/60">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

