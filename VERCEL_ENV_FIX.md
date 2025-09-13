# 🔧 Vercel Environment Variable Fix

## The Problem
You're getting: `Environment Variable 'REACT_APP_SUPABASE_URL' references Secret 'supabase_url', which does not exist`

This happens when you accidentally use variable names instead of actual values.

## Step-by-Step Solution

### 1. Delete ALL existing environment variables in Vercel
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to Settings → Environment Variables
4. **DELETE ALL** existing variables that show errors

### 2. Add New Variables with EXACT Values

#### For Frontend Project:
Add these **exact** variables with **exact** values:

```
Variable Name: REACT_APP_SUPABASE_URL
Value: https://vounlslounuoasoniazo.supabase.co
Environment: Production, Preview, Development (check all three)

Variable Name: REACT_APP_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdW5sc2xvdW51b2Fzb25pYXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MDU1NDIsImV4cCI6MjA1MDM4MTU0Mn0.hXiSKD8KoAlWz-l2qfpnGX0VHlGwZ2JZGv4PHZA5nFs
Environment: Production, Preview, Development (check all three)

Variable Name: REACT_APP_API_BASE_URL
Value: https://your-backend.vercel.app/api
Environment: Production, Preview, Development (check all three)

Variable Name: REACT_APP_RAZORPAY_KEY_ID
Value: rzp_test_your_key_here
Environment: Production, Preview, Development (check all three)
```

#### For Backend Project (if separate):
```
Variable Name: NODE_ENV
Value: production
Environment: Production, Preview, Development (check all three)

Variable Name: SUPABASE_URL
Value: https://vounlslounuoasoniazo.supabase.co
Environment: Production, Preview, Development (check all three)

Variable Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Your service role key from Supabase dashboard]
Environment: Production, Preview, Development (check all three)
```

### 3. Critical Rules

❌ **NEVER use these patterns**:
- `@supabase_url`
- `${SUPABASE_URL}`
- `supabase_url`
- Any reference to another variable

✅ **ALWAYS use direct values**:
- `https://vounlslounuoasoniazo.supabase.co`
- The actual key string
- The actual URL

### 4. Re-deploy

1. After setting all variables with actual values
2. Go to Deployments tab
3. Click "Redeploy" on the latest deployment
4. Or trigger a new deployment by pushing to Git

## Common Mistakes to Avoid

1. **Using variable references**: Don't use `@variable_name` or `${VARIABLE}`
2. **Copying from examples**: Don't copy placeholder values from documentation
3. **Using wrong keys**: Make sure you're using the correct Supabase keys for your project
4. **Missing environments**: Always select Production, Preview, AND Development

## How to Get the Correct Values

### Supabase Keys:
1. Go to https://app.supabase.com
2. Select your project: `vounlslounuoasoniazo`
3. Go to Settings → API
4. Copy the URL and anon key from there

### Razorpay Keys:
1. Go to https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Use test keys for testing, live keys for production

## Verification Steps

After setting variables:
1. Check that each variable shows the actual value (not a reference)
2. Verify all environments are selected
3. Redeploy the project
4. Check deployment logs for any remaining errors

## If It Still Doesn't Work

1. Screenshot your environment variables page
2. Share the exact error message
3. Try deploying from a fresh Git commit
