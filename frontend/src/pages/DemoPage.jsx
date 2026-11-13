import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, ShieldCheck } from 'lucide-react'
import PdfViewer from '../components/PdfViewer'
import './demo.css'

const sampleBooks = [
  {
    slug: 'alice', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865,
    genre: 'Fantasy', pdf: '/pdfs/alices-adventures-in-wonderland.pdf', cover: 'alice',
    description: 'A curious girl follows a white rabbit into a world governed by playful, improbable rules.',
  },
  {
    slug: 'gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925,
    genre: 'Literary fiction', pdf: '/pdfs/the-great-gatsby.pdf', cover: 'gatsby',
    description: 'A summer on Long Island becomes a study of ambition, reinvention, and the American dream.',
  },
  {
    slug: 'frankenstein', title: 'Frankenstein', author: 'Mary Shelley', year: 1818,
    genre: 'Gothic fiction', pdf: '/pdfs/frankenstein.pdf', cover: 'frankenstein',
    description: 'A scientist creates life and confronts the consequences of abandoning his creation.',
  },
  {
    slug: 'dracula', title: 'Dracula', author: 'Bram Stoker', year: 1897,
    genre: 'Gothic fiction', pdf: '/pdfs/dracula.pdf', cover: 'dracula',
    description: 'Letters and journal entries trace a group of friends facing a mysterious visitor from Transylvania.',
  },
  {
    slug: 'time-machine', title: 'The Time Machine', author: 'H. G. Wells', year: 1895,
    genre: 'Science fiction', pdf: '/pdfs/the-time-machine.pdf', cover: 'time',
    description: 'An inventor travels far into the future and finds humanity changed beyond recognition.',
  },
  {
    slug: 'pride-and-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813,
    genre: 'Romance', pdf: '/pdfs/pride-and-prejudice.pdf', cover: 'pride',
    description: 'Elizabeth Bennet navigates family, first impressions, and the social expectations of her time.',
  },
  {
    slug: 'metamorphosis', title: 'The Metamorphosis', author: 'Franz Kafka', year: 1915,
    genre: 'Novella', pdf: '/pdfs/the-metamorphosis.pdf', cover: 'metamorphosis',
    description: 'Gregor Samsa wakes to find himself transformed, and his family must reckon with a new reality.',
  },
]

function PreviewHeader() {
  return (
    <header className="demo-header">
      <Link to="/" className="demo-brand" aria-label="NextChapter home">
        <span className="demo-brand-mark"><BookOpen size={18} strokeWidth={1.7} /></span>
        <span>NextChapter</span>
      </Link>
      <div className="demo-header-actions">
        <span className="demo-state"><span /> Guest preview · Read-only</span>
        <Link to="/sign-in" className="demo-signin">Sign in <ArrowRight size={15} /></Link>
      </div>
    </header>
  )
}

function SampleCover({ book, compact = false }) {
  return (
    <div className={`sample-cover cover-${book.cover}${compact ? ' sample-cover-compact' : ''}`} aria-hidden="true">
      <span className="cover-kicker">A classic</span>
      <span className="cover-title">{book.title}</span>
      <span className="cover-rule" />
      <span className="cover-author">{book.author}</span>
    </div>
  )
}

function SampleShelf() {
  const [query, setQuery] = useState('')
  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return sampleBooks
    return sampleBooks.filter((book) => `${book.title} ${book.author} ${book.genre} ${book.year}`.toLowerCase().includes(normalized))
  }, [query])

  return (
    <main className="demo-main">
      <div className="demo-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Sample library</span></div>
      <section className="demo-intro">
        <div>
          <p className="demo-eyebrow">A hands-on preview</p>
          <h1>Start with a story.</h1>
          <p className="demo-lede">Browse a small set of classic sample texts and open one in the in-browser reader. No account is needed for this preview.</p>
        </div>
        <div className="demo-preview-note"><ShieldCheck size={19} /><span>Sample content only. Your account library and personal reading data stay private.</span></div>
      </section>

      <section className="demo-catalog" aria-labelledby="catalog-heading">
        <div className="demo-catalog-top">
          <div>
            <p className="demo-eyebrow">The preview shelf</p>
            <h2 id="catalog-heading">Seven classics, ready to read</h2>
          </div>
          <label className="demo-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search sample books</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author, genre" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </label>
        </div>

        {filteredBooks.length ? (
          <div className="demo-book-grid">
            {filteredBooks.map((book, index) => (
              <article className="demo-book-card" key={book.slug} style={{ '--card-index': index }}>
                <Link to={`/demo/read/${book.slug}`} className="demo-cover-link" aria-label={`Read sample: ${book.title}`}>
                  <SampleCover book={book} />
                  <span className="demo-read-overlay"><BookOpen size={17} /> Read sample</span>
                </Link>
                <div className="demo-book-meta">
                  <span className="demo-genre">{book.genre}<span> · </span>{book.year}</span>
                  <h3><Link to={`/demo/read/${book.slug}`}>{book.title}</Link></h3>
                  <p className="demo-author">{book.author}</p>
                  <p className="demo-description">{book.description}</p>
                  <Link to={`/demo/read/${book.slug}`} className="demo-card-link">Open reader <ArrowRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="demo-empty"><Search size={22} /><p>No sample books match “{query}”.</p><button onClick={() => setQuery('')}>Clear search</button></div>
        )}
      </section>

      <section className="demo-account-callout">
        <div className="demo-account-icon"><Check size={19} /></div>
        <div><h2>Want your own shelf?</h2><p>Sign in to use your personal library and account features.</p></div>
        <Link to="/sign-in">Go to sign in <ArrowRight size={15} /></Link>
      </section>
      <p className="demo-legal-note">Bundled classic texts are provided as sample content. Copyright status can vary by jurisdiction; this preview is separate from the live account catalog.</p>
    </main>
  )
}

function SampleReader({ book }) {
  const [pdfLoadStatus, setPdfLoadStatus] = useState('loading')
  const onPdfLoadStatusChange = useCallback((status) => setPdfLoadStatus(status), [])

  useEffect(() => {
    setPdfLoadStatus('loading')
    const timeout = window.setTimeout(() => {
      setPdfLoadStatus((status) => status === 'loading' ? 'timeout' : status)
    }, 12000)
    return () => window.clearTimeout(timeout)
  }, [book.pdf])

  return (
    <main className="demo-reader-page">
      <div className="demo-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/demo">Sample library</Link><span>/</span><span>{book.title}</span></div>
      <section className="demo-reader-heading">
        <Link to="/demo" className="demo-back-link"><ArrowLeft size={16} /> Back to sample library</Link>
        <div className="demo-reader-title-row">
          <div><p className="demo-eyebrow">Read-only sample · {book.year}</p><h1>{book.title}</h1><p>{book.author}</p></div>
          <a className="demo-download" href={book.pdf} download>Download sample PDF</a>
        </div>
      </section>
      <div className="demo-reader-disclaimer"><ShieldCheck size={17} /><span>This reader uses a bundled sample PDF. Reading position and notes are not saved in this guest preview.</span></div>
      {(pdfLoadStatus === 'error' || pdfLoadStatus === 'timeout') && (
        <div className="demo-reader-fallback" role="alert">
          <span>The embedded PDF is taking too long to load in this browser.</span>
          <a href={book.pdf} target="_blank" rel="noopener noreferrer">Open the sample PDF in a new tab</a>
          <a href={book.pdf} download>Download sample PDF</a>
        </div>
      )}
      <section className="demo-pdf-shell" aria-label={`Sample reader for ${book.title}`}>
        <PdfViewer pdfSource={book.pdf} initialPage={1} className="demo-pdf-viewer" onLoadStatusChange={onPdfLoadStatusChange} />
      </section>
      <div className="demo-reader-footer"><span>Sample text · {book.title}</span><Link to="/sign-in">Sign in for your personal library <ArrowRight size={14} /></Link></div>
    </main>
  )
}

export default function DemoPage() {
  const { slug } = useParams()
  const book = sampleBooks.find((sample) => sample.slug === slug)
  return (
    <div className="demo-page">
      <PreviewHeader />
      {slug && book ? <SampleReader book={book} /> : slug ? (
        <main className="demo-not-found"><p className="demo-eyebrow">Sample not found</p><h1>That title is not on this shelf.</h1><Link to="/demo" className="demo-card-link">Back to sample library <ArrowRight size={15} /></Link></main>
      ) : <SampleShelf />}
      <footer className="demo-footer"><span>NextChapter</span><span>Guest preview · Read-only</span><Link to="/sign-in">Sign in</Link></footer>
    </div>
  )
}
