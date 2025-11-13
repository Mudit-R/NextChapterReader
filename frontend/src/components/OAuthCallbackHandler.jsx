import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Component to handle OAuth callback and clean up URL hash
 * This should be rendered in the App component to handle OAuth redirects
 * 
 * IMPORTANT: This component should NOT clean the hash immediately.
 * Supabase needs time to process the OAuth hash fragment first.
 */
function OAuthCallbackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    // ONLY clean up hash AFTER user is authenticated
    // This gives Supabase time to process the OAuth callback
    const cleanHash = () => {
      if (window.location.hash && user) {
        const hash = window.location.hash
        
        console.log('🧹 OAuthCallbackHandler: Cleaning hash after authentication')
        
        // Check if this is an OAuth callback
        if (hash.includes('access_token') || hash.includes('error') || hash.includes('type=recovery')) {
          // Remove hash from URL
          const urlWithoutHash = window.location.pathname + window.location.search
          window.history.replaceState(null, '', urlWithoutHash)
          console.log('✅ Hash cleaned successfully')
        }
      }
    }

    // Only clean hash if user is authenticated
    if (user && !loading) {
      console.log('🔑 User authenticated, will clean hash in 500ms')
      // Wait a bit to ensure all auth state is updated
      const timeout = setTimeout(cleanHash, 500)
      return () => clearTimeout(timeout)
    }
  }, [user, loading, location])

  return null // This component doesn't render anything
}

export default OAuthCallbackHandler

