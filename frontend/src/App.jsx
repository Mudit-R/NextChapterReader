import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import BooksPage from './pages/BooksPage'
import Gallery from './components/Gallery'
import Reader from './components/Reader'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/books" element={<BooksPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/reader" element={<Reader />} />
    </Routes>
  )
}

export default App

