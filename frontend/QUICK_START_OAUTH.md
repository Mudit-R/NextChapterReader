# Quick Start: Enable Google & Apple Sign In

## 🚀 Quick Setup (5 minutes)

### For Google OAuth:

1. **Get Google Credentials** (2 min):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project → Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Add redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret

2. **Add to Supabase** (1 min):
   - Supabase Dashboard → **Authentication** → **Providers** → **Google**
   - Enable → Paste Client ID and Secret → Save
   - **Important**: Paste ONLY the Client ID (no spaces, no commas)
   - If you get "Invalid characters" error, see `GOOGLE_OAUTH_FIX.md`

3. **Test** (1 min):
   - Go to `/sign-in` → Click "Continue with Google"
   - Should redirect to Google and back

### For Apple OAuth:

**Note:** Requires paid Apple Developer account ($99/year)

1. **Get Apple Credentials** (10 min):
   - Apple Developer Portal → Create Services ID
   - Enable Sign In with Apple
   - Create Key → Download .p8 file
   - Note: Services ID, Team ID, Key ID

2. **Add to Supabase** (1 min):
   - Supabase Dashboard → **Authentication** → **Providers** → **Apple**
   - Enable → Paste all credentials → Save

3. **Test**:
   - Go to `/sign-in` → Click "Continue with Apple"
   - Should redirect to Apple and back

## 📋 Required Supabase Settings

Make sure these are configured:

1. **Site URL**: `http://localhost:5173` (or your domain)
2. **Redirect URLs**:
   ```
   http://localhost:5173/books
   http://localhost:5173/*
   ```

## ✅ That's It!

Once configured, users can click "Continue with Google" or "Continue with Apple" on sign-in/sign-up pages.

For detailed instructions, see `OAUTH_SETUP_GUIDE.md`

