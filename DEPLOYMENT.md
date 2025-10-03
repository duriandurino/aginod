# Quick Deployment Guide

## Prerequisites Checklist

- [ ] Facebook Developer account created
- [ ] Facebook App created and configured
- [ ] Supabase Facebook OAuth configured
- [ ] GitHub repository ready
- [ ] Vercel account created

## Fast Track Deployment (5 minutes)

### 1. Facebook App Setup (2 minutes)

```
1. Go to https://developers.facebook.com/
2. Create App → Consumer type
3. Add "Facebook Login" product
4. Settings → Basic: Copy App ID & App Secret
5. Facebook Login → Settings: Add callback URL:
   https://dvjxhgqmpltulzhcvaek.supabase.co/auth/v1/callback
```

### 2. Supabase Configuration (1 minute)

```
1. Visit: https://supabase.com/dashboard/project/dvjxhgqmpltulzhcvaek
2. Authentication → Providers → Facebook
3. Paste App ID and App Secret
4. Enable and Save
```

### 3. Deploy to Vercel (2 minutes)

```bash
# Push to GitHub
git init
git add .
git commit -m "Northern Cebu Relief Tracker"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

```
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Click Deploy
```

### 4. Post-Deployment (1 minute)

After deployment completes:

```
1. Copy your Vercel URL (e.g., https://your-app.vercel.app)
2. Go back to Facebook App → Facebook Login → Settings
3. Add to Valid OAuth Redirect URIs:
   https://your-app.vercel.app/auth/callback
4. Save changes
5. Switch Facebook App to "Live" mode (App Settings → Basic)
```

### 5. Make Yourself Admin

After first login:

```sql
-- Run in Supabase SQL Editor
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-facebook-email@example.com';
```

## Verification Steps

Test your deployment:

1. ✅ Visit your Vercel URL
2. ✅ Click "Continue with Facebook"
3. ✅ Complete Facebook login flow
4. ✅ Should redirect to dashboard
5. ✅ Promote yourself to admin via SQL
6. ✅ Access admin panel at `/admin`
7. ✅ Add a test relief pin with photo
8. ✅ Approve the pin as admin

## Environment Variables

Copy these to Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dvjxhgqmpltulzhcvaek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2anhoZ3FtcGx0dWx6aGN2YWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTI5MTYsImV4cCI6MjA3NTA4ODkxNn0.34Doh6tGeRT2igSdC2NKiAWuke8p2lgT-4b3Z-9w9Lo
```

## Common Issues

### Issue: "Redirect URI Mismatch"
**Solution**: Ensure Facebook App has exact callback URL including `/auth/v1/callback`

### Issue: "App Not Setup"
**Solution**: Complete Facebook Login setup in Facebook App dashboard

### Issue: "Cannot sign in"
**Solution**: Switch Facebook App from Development to Live mode

### Issue: "Database error"
**Solution**: Check Supabase project is active (not paused on free tier)

## Production Checklist

Before going live:

- [ ] Facebook App is in "Live" mode
- [ ] All OAuth redirect URIs configured
- [ ] Environment variables set in Vercel
- [ ] Admin user created and tested
- [ ] Storage bucket and policies verified
- [ ] Test pin creation and approval flow
- [ ] Test on mobile devices
- [ ] Custom domain configured (optional)

## Performance Optimization

For better performance:

1. Enable Vercel Analytics
2. Configure Image Optimization in Vercel
3. Set up Supabase Connection Pooling
4. Add caching headers for static assets

## Monitoring

Monitor your application:

- **Vercel Dashboard**: Deployment status, errors
- **Supabase Dashboard**: Database usage, auth logs
- **Facebook App Dashboard**: Login attempts, errors

## Scaling

As usage grows:

1. Upgrade Supabase plan for more storage/bandwidth
2. Configure Vercel Pro for better performance
3. Add CDN for photo storage
4. Implement rate limiting for API calls

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Facebook Login Docs: https://developers.facebook.com/docs/facebook-login
- Next.js Docs: https://nextjs.org/docs

## Estimated Costs

**Free Tier (Sufficient for MVP):**
- Vercel: Free for hobby projects
- Supabase: 500MB database, 1GB storage
- Facebook: Free OAuth service

**Paid Plans (If scaling):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Total: ~$45/month for production use

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Deploy to Vercel (with CLI)
npm i -g vercel
vercel --prod
```

---

**Your app is ready to help coordinate relief efforts in Northern Cebu! 🚀**
