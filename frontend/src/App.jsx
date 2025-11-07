import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import BooksPage from './pages/BooksPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Gallery from './components/Gallery'
import GalleryLocal from './components/GalleryLocal'
import Reader from './components/Reader'
import ReaderLocal from './components/ReaderLocal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/books" element={<BooksPage />} />
      <Route path="/subscription" element={<SubscriptionPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/gallery-local" element={<GalleryLocal />} />
      <Route path="/reader" element={<Reader />} />
      <Route path="/reader-local" element={<ReaderLocal />} />
    </Routes>
  )
}

export default App

