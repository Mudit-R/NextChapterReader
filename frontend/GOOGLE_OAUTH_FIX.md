# Fix: Google Client ID "Invalid characters" Error in Supabase

## 🔴 The Error

When trying to add Google Client ID to Supabase, you see:
```
Invalid characters. Google Client IDs should be a comma-separated list of domain-like strings.
```

## ✅ Solution

### Step 1: Get Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click on it to view details
5. **Copy the Client ID** - it should look like:
   ```
   123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```

### Step 2: Verify the Format

Your Client ID should:
- ✅ Start with numbers (e.g., `123456789-`)
- ✅ Contain a hyphen
- ✅ End with `.apps.googleusercontent.com`
- ✅ Be a single string (no spaces, no commas)
- ✅ Be about 60-80 characters long

**Example of CORRECT format:**
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**Examples of INCORRECT formats:**
```
❌ 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com, another-id
❌ "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
❌ 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com 
   (with trailing space)
```

### Step 3: Add to Supabase Correctly

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. **Enable** the Google provider
3. In the **Client ID (for OAuth)** field:
   - Clear the field completely
   - Paste ONLY the Client ID (no extra spaces before/after)
   - Make sure there are no hidden characters
4. In the **Client Secret (for OAuth)** field:
   - Paste your Client Secret (starts with `GOCSPX-`)
5. Click **Save**

### Step 4: If Still Getting Error

**Option A: Copy Fresh from Google Console**
1. Go back to Google Cloud Console
2. Click on your OAuth Client ID
3. Click the **copy icon** next to Client ID (don't manually select text)
4. Paste directly into Supabase field

**Option B: Check for Multiple Client IDs**
- If you have multiple OAuth clients (dev/prod), make sure you're using the correct one
- Supabase expects a single Client ID, not multiple
- Use the one configured for your Supabase redirect URI

**Option C: Verify Redirect URI Match**
- Make sure the Client ID you're using has the redirect URI configured:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
- Go to Google Console → Your OAuth Client → Authorized redirect URIs
- Verify the Supabase callback URL is listed there

## 🔍 Common Mistakes

1. **Copying with extra spaces**: Make sure no leading/trailing spaces
2. **Copying multiple IDs**: Only paste ONE Client ID
3. **Wrong field**: Make sure you're pasting in "Client ID (for OAuth)" not another field
4. **Hidden characters**: Try copying again or typing manually (carefully)
5. **Using wrong Client ID**: Make sure it's the Web application Client ID, not iOS/Android

## 📝 Quick Checklist

- [ ] Client ID copied from Google Cloud Console
- [ ] Client ID ends with `.apps.googleusercontent.com`
- [ ] No spaces before or after the Client ID
- [ ] Only ONE Client ID (not comma-separated)
- [ ] Redirect URI configured in Google Console
- [ ] Client Secret also added correctly
- [ ] Clicked "Save" in Supabase

## 🆘 Still Not Working?

1. **Try a different browser** - Sometimes browser extensions interfere
2. **Clear browser cache** and try again
3. **Check Supabase status** - Make sure Supabase is not having issues
4. **Create a new OAuth Client** in Google Console and try with that
5. **Contact Supabase support** if the issue persists

## ✅ Success Indicators

When correctly configured, you should:
- See "Saved successfully" message in Supabase
- Be able to click "Continue with Google" on your sign-in page
- Get redirected to Google sign-in page
- Be redirected back to your app after signing in

---

**Need more help?** Check the full `OAUTH_SETUP_GUIDE.md` for complete setup instructions.

