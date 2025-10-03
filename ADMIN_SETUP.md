# Admin Setup Instructions

## Making Yourself the First Admin

After you sign in with Google for the first time, you need to promote yourself to admin role.

### Step 1: Sign In

1. Go to your deployed app or `http://localhost:3000`
2. Click "Continue with Google"
3. Complete the Google authentication
4. You'll be redirected to the dashboard

### Step 2: Get Your Email

Your email is visible in the dashboard header. Note it down (it's your Google email).

### Step 3: Promote to Admin

Go to your Supabase Dashboard SQL Editor:

**URL**: https://supabase.com/dashboard/project/dvjxhgqmpltulzhcvaek/sql/new

Run this SQL query (replace with your actual email):

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-google-email@example.com';
```

Click "Run" or press Cmd/Ctrl + Enter.

### Step 4: Verify Admin Access

1. Refresh your dashboard page
2. You should now see an "Admin" badge next to your name
3. The "Admin Panel" button should appear in the header
4. Click it to access admin features

## Admin Capabilities

As an admin, you can:

### Pin Management
- ✅ View all pins (pending, approved, rejected)
- ✅ Approve pending pins
- ✅ Reject inappropriate pins
- ✅ Delete any pin
- ✅ View full pin details including photos

### User Management
- ✅ View all registered users
- ✅ Promote other users to admin
- ✅ Demote admins to public users
- ✅ Activate/deactivate user accounts
- ✅ View user statistics

## Adding More Admins

To promote another user to admin:

### Option 1: Via Admin Panel (Recommended)

1. Go to Admin Panel → Users tab
2. Find the user you want to promote
3. Click the Shield icon next to their name
4. Confirm the action

### Option 2: Via SQL

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'another-user@example.com';
```

## Managing Users

### Deactivate a User

If you need to temporarily disable a user:

1. Go to Admin Panel → Users tab
2. Find the user
3. Click the UserX (red) icon
4. User will not be able to log in or create pins

### Reactivate a User

1. Find the inactive user
2. Click the UserCheck (green) icon
3. User can log in again

## Pin Moderation Workflow

### Approving Pins

1. Go to Admin Panel → Relief Pins tab
2. Pending pins are highlighted in yellow
3. Click the ✓ (check) icon to approve
4. Pin becomes visible to all users on the map

### Rejecting Pins

1. Find the pin to reject
2. Click the ✗ (X) icon
3. Pin status changes to rejected
4. User can still see it but it's not public

### Deleting Pins

1. Click the 🗑️ (trash) icon
2. Confirm deletion
3. Pin is permanently removed

**Note**: Be careful with deletion - it cannot be undone!

## Best Practices

### For Pin Approval

- ✅ Verify photo shows actual relief distribution
- ✅ Check location is in Northern Cebu
- ✅ Ensure description is clear and relevant
- ❌ Reject spam or test pins
- ❌ Reject inappropriate content
- ❌ Reject duplicate submissions

### For User Management

- ✅ Only promote trusted volunteers to admin
- ✅ Have at least 2-3 admins for availability
- ❌ Don't demote yourself if you're the only admin
- ❌ Don't deactivate all users

### Security Reminders

1. **Protect your account** - Use strong password on Google
2. **Log out** when using shared computers
3. **Regular reviews** - Check users and pins weekly
4. **Monitor activity** - Watch for suspicious patterns
5. **Backup admins** - Always have backup admin contacts

## Troubleshooting

### "I can't see Admin Panel button"

**Solutions**:
1. Check if SQL query ran successfully
2. Refresh the page (hard refresh: Cmd/Ctrl + Shift + R)
3. Try signing out and signing back in
4. Verify in database: `SELECT role FROM user_profiles WHERE email = 'your@email.com';`

### "I accidentally demoted myself"

**Solution**: Ask another admin to promote you back, or run the SQL query again.

### "No other admins and I lost access"

**Solution**: You have direct database access. Run the SQL query to restore your admin role.

## SQL Queries for Common Tasks

### Check all admins
```sql
SELECT email, full_name, role, is_active
FROM user_profiles
WHERE role = 'admin';
```

### Count pending pins
```sql
SELECT COUNT(*) as pending_count
FROM relief_pins
WHERE status = 'pending' AND is_active = true;
```

### View recent activity
```sql
SELECT
  rp.location_name,
  rp.status,
  rp.created_at,
  up.email as submitted_by
FROM relief_pins rp
JOIN user_profiles up ON rp.user_id = up.id
ORDER BY rp.created_at DESC
LIMIT 10;
```

### Bulk approve pins (use carefully!)
```sql
UPDATE relief_pins
SET status = 'approved'
WHERE status = 'pending'
AND created_at > '2025-01-01'::date;
```

## Getting Help

If you encounter issues:

1. Check browser console for errors (F12)
2. Review Supabase logs in dashboard
3. Verify Google OAuth consent screen is configured
4. Check environment variables are set
5. Ensure database migrations ran successfully

## Contact for Emergency

Keep these resources handy:

- Supabase Dashboard: https://supabase.com/dashboard/project/dvjxhgqmpltulzhcvaek
- Google Cloud Console: https://console.cloud.google.com/
- Vercel Dashboard: https://vercel.com/dashboard

---

**You're all set! Start moderating and coordinating relief efforts.** 🎯
