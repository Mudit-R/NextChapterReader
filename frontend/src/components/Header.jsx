import { useState } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { Menu, X, Moon, Sun, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

function LibraryDropdown({ location }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const libraryFilter = searchParams.get('library') || 'all'

  const options = [
    { value: 'all', label: 'All' },
    { value: 'readinglist', label: 'Reading List' },
    { value: 'read', label: 'Already Read' }
  ]

  const handleSelect = (value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('library')
    } else {
      newParams.set('library', value)
    }
    
    // Navigate to /books with the new params if not already there
    if (location.pathname !== '/books') {
      navigate(`/books?${newParams.toString()}`)
    } else {
      setSearchParams(newParams)
    }
    setIsOpen(false)
  }

  const currentLabel = options.find(opt => opt.value === libraryFilter)?.label || 'All'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xs font-medium uppercase tracking-widest transition-colors flex items-center space-x-2 cursor-pointer ${
          location.pathname === '/books' ? 'text-dark-gray dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-dark-gray dark:hover:text-white'
        }`}
      >
        <span>My Library</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10 bg-dark-gray/5 dark:bg-dark-gray/20"
            onClick={() => setIsOpen(false)}
            style={{ 
              animation: 'fadeIn 0.15s ease-out',
            }}
          />
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-dark-gray border-2 border-dark-gray dark:border-white z-20"
            style={{ 
              animation: 'slideDown 0.2s ease-out',
              transformOrigin: 'top center',
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 text-xs font-medium uppercase tracking-widest transition-colors duration-200 ease-out cursor-pointer border-b-2 border-dark-gray dark:border-white last:border-b-0 ${
                  libraryFilter === option.value
                    ? 'bg-dark-gray dark:bg-white text-white dark:text-dark-gray'
                    : 'text-dark-gray dark:text-white hover:bg-dark-gray/5 dark:hover:bg-white/5'
                }`}
                style={{
                  animation: `fadeIn 0.15s ease-out ${index * 0.02}s both`
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LibraryDropdownMobile() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const libraryFilter = searchParams.get('library') || 'all'

  const options = [
    { value: 'all', label: 'All' },
    { value: 'wishlist', label: 'Wishlist' },
    { value: 'read', label: 'Already Read' }
  ]

  const handleSelect = (value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('library')
    } else {
      newParams.set('library', value)
    }
    
    // Navigate to /books with the new params if not already there
    if (location.pathname !== '/books') {
      navigate(`/books?${newParams.toString()}`)
    } else {
      setSearchParams(newParams)
    }
    setIsOpen(false)
  }

  const currentLabel = options.find(opt => opt.value === libraryFilter)?.label || 'All'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left font-medium py-2 text-gray-700 dark:text-gray-300 hover:text-coral flex items-center justify-between transition-colors duration-200 cursor-pointer"
      >
        <span>My Library: {currentLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      {isOpen && (
        <div 
          className="mt-2 space-y-1 pl-4 overflow-hidden"
          style={{ animation: 'slideDown 0.2s ease-out' }}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left py-2 px-3 text-sm rounded transition-colors duration-200 ease-out cursor-pointer ${
                libraryFilter === option.value
                  ? 'bg-coral/10 text-coral font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-coral hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={{
                animation: `fadeIn 0.2s ease-out ${index * 0.03}s both`
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <header className="bg-white dark:bg-dark-gray border-b border-dark-gray dark:border-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-12 items-center gap-4">
          {/* Logo - Left aligned */}
          <div className="col-span-3">
            <Link to="/" className="flex items-center">
              <img 
                src={isDark ? "/Union-dark.svg" : "/Union.svg"} 
                alt="NextChapter Logo" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          
          {/* Desktop Navigation - Centered grid */}
          <nav className="hidden md:flex items-center justify-center col-span-6 gap-12">
            <Link to="/books" className={`text-xs font-medium uppercase tracking-widest transition-colors ${location.pathname === '/books' ? 'text-dark-gray dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-dark-gray dark:hover:text-white'}`}>
              Home
            </Link>
            <LibraryDropdown location={location} />
            <Link 
              to="/subscription" 
              className={`bg-dark-gray dark:bg-white text-white dark:text-dark-gray px-6 py-2 text-xs font-medium uppercase tracking-widest hover:opacity-80 transition-opacity ${
                location.pathname === '/subscription' ? 'opacity-100' : ''
              }`}
            >
              Subscription
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center justify-end col-span-3 gap-8">
            <Link 
              to="/sign-in" 
              className={`text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-60 ${
                location.pathname === '/sign-in' 
                  ? 'text-dark-gray dark:text-white opacity-100' 
                  : 'text-dark-gray dark:text-white'
              }`}
            >
              Sign In
            </Link>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 border border-dark-gray dark:border-white hover:opacity-60 transition-opacity"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-dark-gray" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-dark-gray/20 dark:border-white/20 pt-4 animate-fade-in">
            <nav className="flex flex-col space-y-3">
              <Link to="/books" className={`font-medium py-2 transition-colors ${location.pathname === '/books' ? 'text-coral' : 'text-dark-gray/70 dark:text-white/70 hover:text-coral'}`}>
                Home
              </Link>
              <LibraryDropdownMobile />
              <Link 
                to="/subscription" 
                className="w-full bg-coral hover:bg-pink-500 text-white px-6 py-2.5 rounded-full font-medium transition-all text-left"
              >
                Subscription
              </Link>
              <div className="pt-2">
                <Link 
                  to="/sign-in" 
                  className="w-full text-left text-dark-gray/70 dark:text-white/70 hover:text-coral font-medium py-2 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

