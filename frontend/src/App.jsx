import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import OAuthCallbackHandler from './components/OAuthCallbackHandler'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const BooksPage = lazy(() => import('./pages/BooksPage'))
const ReadingListPage = lazy(() => import('./pages/ReadingListPage'))
const AlreadyReadPage = lazy(() => import('./pages/AlreadyReadPage'))
const BookDetailPage = lazy(() => import('./pages/BookDetailPage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PersonalizationPage = lazy(() => import('./pages/PersonalizationPage'))
const RecommendedBooksPage = lazy(() => import('./pages/RecommendedBooksPage'))
const TrendingBooksPage = lazy(() => import('./pages/TrendingBooksPage'))
const HighestRatedBooksPage = lazy(() => import('./pages/HighestRatedBooksPage'))
const ExploreBooksPage = lazy(() => import('./pages/ExploreBooksPage'))
const NewReleasesPage = lazy(() => import('./pages/NewReleasesPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const RefundsPage = lazy(() => import('./pages/RefundsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ShippingPage = lazy(() => import('./pages/ShippingPage'))
const OfflinePage = lazy(() => import('./pages/OfflinePage'))
const Gallery = lazy(() => import('./components/Gallery'))
const GalleryLocal = lazy(() => import('./components/GalleryLocal'))
const Reader = lazy(() => import('./components/Reader'))
const ReaderLocal = lazy(() => import('./components/ReaderLocal'))
const Admin = lazy(() => import('./components/Admin'))

function App() {
  return (
    <ErrorBoundary>
      <OAuthCallbackHandler />
      <Suspense fallback={
        <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center bg-cream dark:bg-dark-gray text-dark-gray dark:text-white">
          <div className="text-center"><p className="text-2xl mb-3">Opening your next chapter…</p><p>Please wait while this page loads.</p></div>
        </div>
      }>
      <Routes>
        {/* Public routes - Landing page accessible to everyone including admin */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes - Public access, redirect if already logged in */}
        <Route 
          path="/sign-in" 
          element={
            <ProtectedRoute publicRoute>
              <SignInPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sign-up" 
          element={
            <ProtectedRoute publicRoute>
              <SignUpPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <ProtectedRoute publicRoute>
              <ForgotPasswordPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <ProtectedRoute publicRoute>
              <ResetPasswordPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify-email" 
          element={
            <ProtectedRoute publicRoute>
              <VerifyEmailPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Policy pages - Public access for everyone */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        
        {/* Offline page - accessible to everyone */}
        <Route path="/offline" element={<OfflinePage />} />
        
        {/* OAuth callback route - handles OAuth redirects for both old and new users */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        
        {/* Personalization - shown after first sign-in, blocks admin */}
        <Route 
          path="/personalization" 
          element={
            <ProtectedRoute blockAdmin>
              <PersonalizationPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - require authentication, block admin */}
        <Route 
          path="/books" 
          element={
            <ProtectedRoute blockAdmin>
              <BooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recommended" 
          element={
            <ProtectedRoute blockAdmin>
              <RecommendedBooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/trending" 
          element={
            <ProtectedRoute blockAdmin>
              <TrendingBooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/new-releases" 
          element={
            <ProtectedRoute blockAdmin>
              <NewReleasesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/highest-rated" 
          element={
            <ProtectedRoute blockAdmin>
              <HighestRatedBooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/explore" 
          element={
            <ProtectedRoute blockAdmin>
              <ExploreBooksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reading-list" 
          element={
            <ProtectedRoute blockAdmin>
              <ReadingListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/already-read" 
          element={
            <ProtectedRoute blockAdmin>
              <AlreadyReadPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/book/:id" 
          element={
            <ProtectedRoute blockAdmin>
              <BookDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subscription" 
          element={
            <ProtectedRoute blockAdmin>
              <SubscriptionPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute blockAdmin>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/gallery" 
          element={
            <ProtectedRoute blockAdmin>
              <Gallery />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/gallery-local" 
          element={
            <ProtectedRoute blockAdmin>
              <GalleryLocal />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reader" 
          element={
            <ProtectedRoute blockAdmin>
              <Reader />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reader-local" 
          element={
            <ProtectedRoute blockAdmin>
              <ReaderLocal />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App

