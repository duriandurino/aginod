# Northern Cebu Relief Tracker - Setup Guide

## Overview

This application tracks earthquake relief efforts in Northern Cebu, Philippines. It features:

- **Facebook Authentication** via Supabase Auth
- **Interactive Map** with OpenStreetMap and Leaflet
- **Relief Pin Management** with photo uploads
- **Admin Dashboard** for moderation and user management
- **Real-time Updates** using Supabase realtime subscriptions
- **Role-based Access Control** (Public users and Admins)

## Prerequisites

1. **Supabase Account** - Already configured with this project
2. **Facebook Developer Account** - Required for Facebook OAuth
3. **Vercel Account** (optional) - For deployment

## Step 1: Configure Facebook OAuth

### 1.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as app type
4. Fill in app details:
   - **App Name**: Northern Cebu Relief Tracker
   - **Contact Email**: Your email
5. Click "Create App"

### 1.2 Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" as platform
4. Enter your Site URL (for local dev: `http://localhost:3000`)

### 1.3 Configure OAuth Settings

1. Go to Facebook Login → Settings
2. Add these to "Valid OAuth Redirect URIs":
   ```
   https://dvjxhgqmpltulzhcvaek.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
3. Save changes

### 1.4 Get App Credentials

1. Go to Settings → Basic
2. Copy your **App ID** and **App Secret**

## Step 2: Configure Supabase Authentication

1. Go to your Supabase Dashboard: https://dvjxhgqmpltulzhcvaek.supabase.co
2. Navigate to **Authentication** → **Providers**
3. Find **Facebook** provider and enable it
4. Paste your Facebook **App ID** and **App Secret**
5. Copy the "Callback URL" (should match what you added to Facebook)
6. Click **Save**

## Step 3: Set Up Admin User

### Option A: Manual SQL Update (Recommended)

After you sign in with Facebook for the first time:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your email):
   ```sql
   UPDATE user_profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

### Option B: During First Signup

The first user can be promoted to admin immediately after signup by running the SQL query above.

## Step 4: Create Storage Bucket Policies

The storage bucket is already created. Verify policies are in place:

1. Go to Supabase Dashboard → Storage
2. Find `relief-photos` bucket
3. Check Policies tab - should have:
   - Public SELECT access
   - Authenticated INSERT access
   - Owner UPDATE/DELETE access

If missing, run this SQL:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view relief photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'relief-photos');

CREATE POLICY "Authenticated users can upload relief photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'relief-photos');

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'relief-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'relief-photos' AND owner = auth.uid());

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'relief-photos' AND owner = auth.uid());
```

## Step 5: Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test the Application

1. Click "Continue with Facebook"
2. Complete Facebook authentication
3. You should be redirected to the dashboard
4. Promote yourself to admin using SQL (Step 3)
5. Test adding pins, uploading photos
6. Access admin panel at `/admin`

## Step 6: Deploy to Vercel

### 6.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 6.2 Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Import Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 6.3 Configure Environment Variables

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://dvjxhgqmpltulzhcvaek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2anhoZ3FtcGx0dWx6aGN2YWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTI5MTYsImV4cCI6MjA3NTA4ODkxNn0.34Doh6tGeRT2igSdC2NKiAWuke8p2lgT-4b3Z-9w9Lo
```

### 6.4 Update Facebook OAuth URLs

After deployment, update your Facebook App settings:

1. Go to Facebook App → Facebook Login → Settings
2. Add your Vercel URL to "Valid OAuth Redirect URIs":
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Save changes

### 6.5 Deploy

Click "Deploy" in Vercel. Your app will be live in minutes!

## Features Guide

### For Public Users

- **View Approved Pins**: See all relief distribution points on the map
- **Add Pins**: Click on map to add new relief locations with photos
- **Track Own Pins**: View status of your submitted pins (pending/approved/rejected)
- **Real-time Updates**: See new pins appear automatically

### For Admins

- **Approve/Reject Pins**: Moderate all relief submissions
- **User Management**: Promote users to admin, activate/deactivate accounts
- **Full Pin Control**: Delete any pin if needed
- **Statistics Dashboard**: View total pins, pending approvals, user counts

## Database Schema

### Tables

1. **user_profiles**
   - User information and roles
   - Automatically created on signup

2. **relief_pins**
   - Relief distribution locations
   - Includes coordinates, photos, status

### Row Level Security

- Public users can only see approved pins
- Users can edit their own pending pins
- Admins have full access to everything

## Troubleshooting

### Facebook Login Not Working

- Verify Facebook App is in "Live" mode (not Development)
- Check OAuth redirect URIs match exactly
- Ensure Supabase has correct Facebook credentials

### Photos Not Uploading

- Check storage bucket exists: `relief-photos`
- Verify storage policies are set correctly
- Check file size (max 5MB)

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues

- Verify `.env` file has correct Supabase credentials
- Check Supabase project is not paused (free tier limitation)

## Security Notes

1. **Never commit `.env` file** to version control
2. **Facebook App Secret** should only be in Supabase, not in code
3. **Admin promotion** requires direct database access
4. **All pins** require admin approval before being visible

## Support

For issues or questions:
- Check Supabase logs for errors
- Review Facebook App dashboard for auth issues
- Inspect browser console for client-side errors

## Next Steps

1. Customize the map center/zoom for your specific area
2. Add more relief types as needed
3. Set up email notifications for pending approvals
4. Add analytics and reporting features
5. Implement bulk import for existing relief data

## License

This application is built for humanitarian relief efforts in Northern Cebu, Philippines.
