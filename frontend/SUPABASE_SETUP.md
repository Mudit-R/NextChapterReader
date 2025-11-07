# Supabase Authentication Setup Guide

This guide will help you configure Supabase authentication for the NextChapter application.

## ✅ What's Already Done

- Authentication context (`AuthContext.jsx`) created
- Sign In page integrated with Supabase
- Sign Up page integrated with Supabase
- Forgot Password page integrated with Supabase
- Header shows user info when logged in
- Sign out functionality implemented
- OAuth providers (Google, Apple) ready

## 🔧 Supabase Dashboard Configuration

### 1. Authentication Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure the following:

#### Site URL
- Set your **Site URL** to your production domain (e.g., `https://yourdomain.com`)
- For local development, you can use `http://localhost:5173` (or your Vite dev server port)

#### Redirect URLs
Add the following redirect URLs in **Redirect URLs** section:
```
http://localhost:5173/books
http://localhost:5173/*
https://yourdomain.com/books
https://yourdomain.com/*
```

This allows OAuth redirects to work properly.

### 2. Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup** - Email sent when user signs up
   - **Reset password** - Email sent for password reset
   - **Magic Link** - If you plan to use magic links

You can customize the email content, subject, and styling to match your brand.

### 3. Email Confirmation Settings

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Choose one of the following:

#### Option A: Require Email Confirmation (Recommended for Production)
- Enable **"Enable email confirmations"**
- Users must verify their email before they can sign in
- More secure, prevents fake accounts

#### Option B: Disable Email Confirmation (For Development)
- Disable **"Enable email confirmations"**
- Users can sign in immediately after signup
- Useful for testing and development

### 4. OAuth Providers (Google & Apple)

#### Google OAuth Setup

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. You'll need:
   - **Google Client ID** - Get from [Google Cloud Console](https://console.cloud.google.com/)
   - **Google Client Secret** - Get from Google Cloud Console
4. In Google Cloud Console:
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

#### Apple OAuth Setup

1. Go to **Authentication** → **Providers** → **Apple**
2. Enable Apple provider
3. You'll need:
   - **Apple Services ID**
   - **Apple Team ID**
   - **Apple Key ID**
   - **Apple Private Key**
4. Configure these in your Apple Developer account

**Note:** OAuth setup is optional. Email/password authentication works without OAuth.

### 5. Password Requirements

1. Go to **Authentication** → **Settings** → **Password**
2. Configure password requirements:
   - **Minimum length** (default: 6 characters)
   - **Require uppercase, lowercase, numbers, special characters** (optional)

The frontend currently validates minimum 6 characters. Adjust if needed.

### 6. Rate Limiting (Optional)

1. Go to **Authentication** → **Settings** → **Rate Limits**
2. Configure rate limits to prevent abuse:
   - **Email sending rate limit**
   - **Sign in attempts rate limit**

## 🧪 Testing Authentication

### Test Sign Up
1. Go to `/sign-up`
2. Enter email and password
3. Check if email confirmation is required (based on your settings)
4. If email confirmation is enabled, check your email inbox

### Test Sign In
1. Go to `/sign-in`
2. Enter credentials
3. Should redirect to `/books` on success
4. Header should show user email

### Test Password Reset
1. Go to `/forgot-password`
2. Enter your email
3. Check email inbox for reset link
4. Click link and set new password

### Test Sign Out
1. Click "Sign Out" in header
2. Should redirect to home page
3. Header should show "Sign In" link

## 🔒 Security Best Practices

1. **Enable Email Confirmation** in production
2. **Set up rate limiting** to prevent brute force attacks
3. **Use HTTPS** in production (Supabase requires it for OAuth)
4. **Keep your Supabase keys secure** - Never commit `.env` file
5. **Use Row Level Security (RLS)** if you add user-specific data tables

## 📝 Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** 
- The `.env` file should be in the `frontend` directory
- Never commit `.env` to version control
- Restart your dev server after changing `.env`

## 🐛 Troubleshooting

### "Invalid API key" error
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Make sure there are no extra spaces or quotes
- Restart your dev server

### "Invalid email" error when signing up
**Common causes:**
1. **Email already exists**: The email is already registered. Try signing in instead.
2. **Supabase email validation**: Check Supabase project settings:
   - Go to **Authentication** → **Settings** → **Email Auth**
   - Check if there are any email domain restrictions
   - Verify email confirmation settings
3. **Whitespace in email**: The code now trims emails automatically, but double-check
4. **Supabase rate limiting**: Too many signup attempts may be blocked temporarily

**Solutions:**
- Try a different email address to test
- Check Supabase dashboard → **Authentication** → **Users** to see if the email exists
- Wait a few minutes if rate-limited
- Check browser console for detailed error messages

### OAuth redirect not working
- Check Redirect URLs in Supabase dashboard
- Make sure Site URL matches your domain
- For local dev, use `http://localhost:5173` (or your port)
- See `OAUTH_SETUP_GUIDE.md` for detailed OAuth setup

### Email not sending
- Check Supabase project settings
- Verify email templates are configured
- Check spam folder
- For development, emails might be rate-limited
- Check **Authentication** → **Settings** → **Email Auth** → **SMTP Settings** (if using custom SMTP)

### "Email already registered" error
- User already exists - they should sign in instead
- Or use password reset if they forgot password
- The error message now provides clearer guidance

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [OAuth Provider Setup](https://supabase.com/docs/guides/auth/social-login)

## ✅ Checklist

- [ ] Supabase project created
- [ ] Environment variables added to `.env`
- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Email confirmation settings configured
- [ ] Email templates customized (optional)
- [ ] OAuth providers configured (optional)
- [ ] Tested sign up flow
- [ ] Tested sign in flow
- [ ] Tested password reset flow
- [ ] Tested sign out flow

---

**Need Help?** Check the Supabase documentation or their Discord community for support.

