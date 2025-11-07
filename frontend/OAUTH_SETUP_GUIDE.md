# Google & Apple OAuth Setup Guide

This guide will help you enable Google and Apple sign-in/sign-up for NextChapter.

## 🔧 Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in:
     - **App name**: NextChapter
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email) if in testing mode
   - Click **Save and Continue**

4. Create OAuth Client:
   - **Application type**: Web application
   - **Name**: NextChapter Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     - Replace `YOUR_PROJECT_REF` with your Supabase project reference
     - You can find this in your Supabase project URL: `https://xxxxx.supabase.co`
   
5. Click **Create**
6. **Copy the Client ID and Client Secret** (you'll need these for Supabase)

### Step 3: Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to expand
4. **Enable** the Google provider
5. Enter the credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID here
     - Format: Should be a single Client ID string (e.g., `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
     - **Important**: If you see an error about "comma-separated list", make sure you're only pasting ONE Client ID, not multiple
     - The Client ID should look like: `xxxxx-xxxxx.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: Paste your Google Client Secret here
     - Format: A single secret string (e.g., `GOCSPX-xxxxxxxxxxxxx`)
6. Click **Save**

**Troubleshooting "Invalid characters" error:**
- Make sure you're copying the **entire** Client ID from Google Console
- The Client ID should end with `.apps.googleusercontent.com`
- Don't add any spaces, commas, or extra characters
- If you have multiple Client IDs (dev/prod), use only ONE in Supabase
- Try copying the Client ID again from Google Console to ensure no hidden characters

### Step 4: Configure Redirect URLs in Supabase

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:5173/books
   http://localhost:5173/*
   https://yourdomain.com/books
   https://yourdomain.com/*
   ```

## 🍎 Apple OAuth Setup

### Step 1: Apple Developer Account Requirements

- You need an **Apple Developer Account** ($99/year)
- This is required for Apple Sign In

### Step 2: Create Services ID in Apple Developer

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → Click **+** to create new
4. Select **Services IDs** → **Continue**
5. Fill in:
   - **Description**: NextChapter
   - **Identifier**: `com.nextchapter.app` (or your unique identifier)
6. Enable **Sign In with Apple**
7. Click **Configure**:
   - **Primary App ID**: Select your app (or create one)
   - **Website URLs**:
     - **Domains**: `yourdomain.com`
     - **Return URLs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
8. Click **Save** → **Continue** → **Register**

### Step 3: Create Key for Sign In with Apple

1. Go to **Keys** → Click **+** to create new
2. Fill in:
   - **Key Name**: NextChapter Sign In Key
   - Enable **Sign In with Apple**
3. Click **Configure**:
   - **Primary App ID**: Select your app
4. Click **Save** → **Continue** → **Register**
5. **Download the key file** (.p8 file) - You can only download this once!
6. Note the **Key ID**

### Step 4: Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Apple** and click to expand
4. **Enable** the Apple provider
5. Enter:
   - **Services ID**: The identifier you created (e.g., `com.nextchapter.app`)
   - **Team ID**: Found in Apple Developer → Membership
   - **Key ID**: The Key ID from step 3
   - **Private Key**: The contents of the .p8 file you downloaded
6. Click **Save**

## 🧪 Testing OAuth

### Test Google Sign In

1. Go to `/sign-in` or `/sign-up`
2. Click **"Continue with Google"**
3. You should be redirected to Google sign-in page
4. After signing in, you'll be redirected back to `/books`
5. Check that your email appears in the header

### Test Apple Sign In

1. Go to `/sign-in` or `/sign-up`
2. Click **"Continue with Apple"**
3. You should be redirected to Apple sign-in page
4. After signing in, you'll be redirected back to `/books`
5. Check that your email appears in the header

## 🐛 Troubleshooting

### Google OAuth Issues

**"redirect_uri_mismatch" error:**
- Check that the redirect URI in Google Console matches exactly: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or typos

**"access_denied" error:**
- Check OAuth consent screen is configured
- If in testing mode, make sure your email is in test users list
- Verify the app is published (for production)

**OAuth not redirecting:**
- Check Redirect URLs in Supabase dashboard
- Make sure Site URL is set correctly
- Check browser console for errors

### Apple OAuth Issues

**"invalid_client" error:**
- Verify Services ID is correct
- Check Team ID matches your Apple Developer account
- Ensure the key file (.p8) is correctly pasted (include the header and footer)

**"invalid_request" error:**
- Verify return URL matches exactly in Apple Developer portal
- Check that Sign In with Apple is enabled for your Services ID

**Apple Sign In not showing:**
- Make sure you're testing on a device that supports Apple Sign In
- Some browsers may not support Apple Sign In (works best on Safari or iOS)

### General OAuth Issues

**"Provider not enabled" error:**
- Make sure the provider is enabled in Supabase dashboard
- Check that Client ID and Secret are correct
- Restart your dev server after making changes

**Redirects to wrong page:**
- Check the `redirectTo` option in `AuthContext.jsx`
- Verify Redirect URLs in Supabase match your app URLs

## 📝 Important Notes

1. **HTTPS Required**: OAuth requires HTTPS in production. Supabase handles this automatically.

2. **Local Development**: 
   - Use `http://localhost:5173` for local development
   - Make sure this is added to authorized origins in Google Console

3. **Production Deployment**:
   - Update authorized origins and redirect URIs with your production domain
   - Update Site URL in Supabase dashboard

4. **Email Already Exists**:
   - If a user signs up with email/password, then tries Google with the same email, they'll need to link accounts
   - Supabase handles this automatically in most cases

5. **Apple Developer Account**:
   - Apple Sign In requires a paid Apple Developer account
   - Free accounts cannot use Apple Sign In in production

## ✅ Checklist

### Google OAuth
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI added to Google Console
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Tested Google sign in

### Apple OAuth
- [ ] Apple Developer account (paid)
- [ ] Services ID created
- [ ] Sign In with Apple enabled
- [ ] Key created and downloaded
- [ ] Apple provider enabled in Supabase
- [ ] All credentials added to Supabase
- [ ] Tested Apple sign in

## 🔗 Useful Links

- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Setup](https://developer.apple.com/sign-in-with-apple/)
- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)

---

**Need Help?** Check the Supabase documentation or their Discord community for support.

