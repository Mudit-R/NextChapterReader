# OAuth Redirect Fix

## Problem
After successfully signing in with Google OAuth, the user was staying on the sign-in or sign-up page instead of being redirected to the `/books` page.

## Root Cause
There was a race condition between:
1. OAuth redirecting to `/books` with a hash fragment (`#access_token=...`)
2. The `ProtectedRoute` checking authentication status
3. Supabase processing the hash to authenticate the user

When OAuth redirected directly to `/books`, the `ProtectedRoute` would check authentication before Supabase finished processing the token, causing the user to be redirected back to `/sign-up`.

## Solution

### 1. Changed OAuth Redirect Target
**File**: `src/contexts/AuthContext.jsx`

Changed the OAuth `redirectTo` from `/books` (protected route) to `/sign-in` (public route):

```javascript
const signInWithOAuth = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Redirect to sign-in page (public) to avoid race condition with ProtectedRoute
      redirectTo: `${window.location.origin}/sign-in`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}
```

### 2. Added Automatic Redirect on Authentication
**File**: `src/contexts/AuthContext.jsx`

Enhanced the `onAuthStateChange` listener to automatically redirect to `/books` after successful OAuth sign-in:

```javascript
if (event === 'SIGNED_IN' && session) {
  const currentPath = window.location.pathname
  
  // If we're on a public auth page, redirect to /books
  if (currentPath === '/sign-in' || currentPath === '/sign-up' || currentPath === '/') {
    setTimeout(() => {
      window.location.href = '/books'
    }, 100)
  }
  
  // Clean up hash after OAuth sign-in
  if (window.location.hash) {
    setTimeout(() => {
      const cleanUrl = window.location.pathname + window.location.search
      window.history.replaceState(null, '', cleanUrl)
    }, 150)
  }
}
```

### 3. Added Debug Logging
Added comprehensive console logging throughout the authentication flow to help diagnose any future issues:

- **AuthContext**: Logs auth state changes, current location, and redirect actions
- **SignInPage/SignUpPage**: Logs authentication status checks and redirect actions

## How It Works Now

### OAuth Sign-In Flow:
1. User clicks "Continue with Google" on sign-in or sign-up page
2. User is redirected to Google for authentication
3. Google redirects back to `/sign-in#access_token=...` (or `/sign-up` if clicked from sign-up page)
4. Supabase processes the hash fragment and authenticates the user
5. `onAuthStateChange` fires with `SIGNED_IN` event
6. AuthContext detects the user is on `/sign-in` (or `/sign-up`) and redirects to `/books`
7. Hash fragment is cleaned up from the URL
8. User lands on `/books` with a clean URL

### Email/Password Sign-In Flow:
1. User enters credentials and submits form
2. `signIn` or `signUp` function is called
3. On success, the page redirects to `/books` using React Router's navigate
4. User lands on `/books`

## Testing

### Test OAuth Sign-In:
1. Clear browser cache/cookies or use incognito mode
2. Navigate to the sign-in or sign-up page
3. Click "Continue with Google"
4. Complete Google authentication
5. **Expected Result**: You should be redirected to `/books` with a clean URL (no hash fragment)
6. Check browser console for debug logs showing the authentication flow

### Test Email/Password Sign-In:
1. Navigate to the sign-in page
2. Enter valid credentials
3. Click "Sign In"
4. **Expected Result**: You should be redirected to `/books`

### Test Already Authenticated User:
1. Sign in successfully
2. Try to navigate to `/sign-in` or `/sign-up`
3. **Expected Result**: You should be automatically redirected to `/books`

## Console Logs to Watch For

When signing in with OAuth, you should see logs like:
```
🔐 Auth state changed: SIGNED_IN User: your.email@gmail.com
📍 Current location: /sign-in
✅ SIGNED_IN event detected
🚀 Redirecting to /books from /sign-in
```

When the redirect happens in SignInPage/SignUpPage:
```
📊 SignInPage - authLoading: false user: your.email@gmail.com
👤 User detected on sign-in page, redirecting to /books
```

## Supabase Configuration

Make sure your Supabase project has:
1. Google OAuth enabled in Authentication > Providers
2. Correct redirect URLs configured:
   - `http://localhost:5174/sign-in` (for development)
   - `http://localhost:5174/sign-up` (for development)
   - Add production URLs when deploying

## Troubleshooting

### Still stuck on sign-in page after OAuth:
1. Check browser console for error messages
2. Verify Supabase OAuth configuration
3. Check that redirect URLs are whitelisted in Supabase
4. Clear browser cache and try again

### Hash still visible in URL:
1. The hash cleanup has a small delay (150ms) to let Supabase process it first
2. If it persists, check browser console for errors
3. The `OAuthCallbackHandler` component also has hash cleanup logic as a fallback

### Protected routes not working:
1. Verify `ProtectedRoute` is wrapping the routes in `App.jsx`
2. Check that `AuthProvider` is wrapping the entire app in `main.jsx`
3. Verify Supabase credentials in `.env` file

## Related Files
- `src/contexts/AuthContext.jsx` - Main authentication logic and OAuth redirect handling
- `src/pages/SignInPage.jsx` - Sign-in page with OAuth buttons
- `src/pages/SignUpPage.jsx` - Sign-up page with OAuth buttons
- `src/components/ProtectedRoute.jsx` - Route protection component
- `src/components/OAuthCallbackHandler.jsx` - Fallback hash cleanup component
- `src/App.jsx` - Route definitions

