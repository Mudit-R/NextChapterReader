import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    loadBooks()
  }, [page])

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    params.set('page', page)
    return `https://gutendex.com/books/?${params.toString()}`
  }

  const loadBooks = async () => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      
      setBooks(data.results || [])
      setHasNext(!!data.next)
      setHasPrev(!!data.previous)
      setCount(data.count || 0)
    } catch (e) {
      console.error('Failed to load books:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadBooks()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Your Next
              <span className="text-transparent bg-clip-text bg-linear-to-r from-coral to-pink-400"> Adventure</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Explore thousands of free books from Project Gutenberg
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-6 py-4 shadow-lg">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books, authors, subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none ml-3 w-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-coral hover:bg-pink-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300"
                >
                  Search
                </button>
              </div>
            </form>
            
            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!hasPrev}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-6 py-2 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>
              <span className="text-white font-medium px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNext}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-6 py-2 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 dark:text-gray-400">No books found</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-coral">{books.length}</span> books
                {count > 0 && <span> of <span className="font-semibold">{count.toLocaleString()}</span> total</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {books.map((book) => (
                <Link
                  key={book.id}
                  to={`/reader?id=${encodeURIComponent(book.id)}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={book.formats['image/jpeg'] || book.formats['image/png'] || 'https://via.placeholder.com/200x300?text=No+Cover'}
                      alt={book.title}
                      className="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-gray-300 text-xs line-clamp-1">
                        {book.authors?.[0]?.name || 'Unknown Author'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <h3 className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-1">
                      {book.authors?.[0]?.name || 'Unknown Author'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4">
            Next<span className="text-coral">Chapter</span>
          </div>
          <p className="text-gray-400 dark:text-gray-500 mb-6">
            Redefining digital reading with AI-powered intelligence
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400 dark:text-gray-500">
            <Link to="/" className="hover:text-coral transition-colors">Home</Link>
            <a href="#" className="hover:text-coral transition-colors">About</a>
            <a href="#" className="hover:text-coral transition-colors">Contact</a>
            <a href="#" className="hover:text-coral transition-colors">Privacy</a>
          </div>
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-600">
            Powered by Project Gutenberg • © 2025 NextChapter. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default BooksPage

