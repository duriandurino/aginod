# Northern Cebu Relief Tracker - Setup Guide

## Overview

This application tracks earthquake relief efforts in Northern Cebu, Philippines. It features:

- **Google Authentication** via Supabase Auth
- **Interactive Map** with OpenStreetMap and Leaflet
- **Relief Pin Management** with photo uploads
- **Admin Dashboard** for moderation and user management
- **Real-time Updates** using Supabase realtime subscriptions
- **Role-based Access Control** (Public users and Admins)

## Prerequisites

1. **Supabase Account** - Already configured with this project
2. **Google Cloud Console Account** - Required for Google OAuth
3. **Vercel Account** (optional) - For deployment

## Step 1: Configure Google OAuth

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Fill in project details:
   - **Project Name**: Northern Cebu Relief Tracker
   - **Organization**: Your organization (optional)
4. Click "Create"

### 1.2 Enable Google+ API

1. In your project dashboard, go to "APIs & Services" → "Library"
2. Search for "Google+ API" and click on it
3. Click "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - **App Name**: Northern Cebu Relief Tracker
   - **User Support Email**: Your email
   - **Developer Contact Email**: Your email
4. Add scopes: `email`, `profile`
5. Save and continue

### 1.4 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   https://dvjxhgqmpltulzhcvaek.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
5. Click "Create"
6. Copy your **Client ID** and **Client Secret**

## Step 2: Configure Supabase Authentication

1. Go to your Supabase Dashboard: https://dvjxhgqmpltulzhcvaek.supabase.co
2. Navigate to **Authentication** → **Providers**
3. Find **Google** provider and enable it
4. Paste your Google **Client ID** and **Client Secret**
5. Copy the "Callback URL" (should match what you added to Google)
6. Click **Save**

## Step 3: Set Up Admin User

### Option A: Manual SQL Update (Recommended)

After you sign in with Google for the first time:

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

1. Click "Continue with Google"
2. Complete Google authentication
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
NEXT_PUBLIC_SUPABASE_URL=https://iysmlytmjordarghhdrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5c21seXRtam9yZGFyZ2hoZHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTYzNTksImV4cCI6MjA3NTA5MjM1OX0.t9-w3CJPKHOA_d9Gn5HA80LOK0Uh3B6uV-Z-21qLQFE

```

### 6.4 Update Google OAuth URLs

After deployment, update your Google Cloud Console settings:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your Vercel URL to "Authorized redirect URIs":
   ```
   https://your-app.vercel.app/auth/callback
   ```
4. Save changes

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

### Google Login Not Working

- Verify Google OAuth consent screen is configured
- Check OAuth redirect URIs match exactly
- Ensure Supabase has correct Google credentials

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
2. **Google Client Secret** should only be in Supabase, not in code
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
