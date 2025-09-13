# 🚀 Deployment Guide

This guide walks you through deploying Zomatify to production environments.

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Supabase project created and configured
- [ ] Razorpay account set up with API keys
- [ ] Database schema deployed (run `supabase_setup.sql`)
- [ ] Environment variables configured

### ✅ Code Preparation
- [ ] All tests passing
- [ ] No console.errors in production build
- [ ] Environment variables using production URLs
- [ ] CORS configured for production domains

## 🌐 Frontend Deployment (Vercel)

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

### Method 2: Git Integration
1. **Connect Repository**: Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Import Project**: Click "New Project" → Import from Git
3. **Configure Settings**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Environment Variables** (Set in Vercel Dashboard → Settings → Environment Variables):

   **⚠️ CRITICAL**: Use ACTUAL values, not variable names or references!

   ```
   REACT_APP_SUPABASE_URL = https://vounlslounuoasoniazo.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdW5sc2xvdW51b2Fzb25pYXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MDU1NDIsImV4cCI6MjA1MDM4MTU0Mn0.hXiSKD8KoAlWz-l2qfpnGX0VHlGwZ2JZGv4PHZA5nFs
   REACT_APP_API_BASE_URL = https://your-backend.vercel.app/api
   REACT_APP_RAZORPAY_KEY_ID = rzp_test_your_key_here
   ```

   **STEP-BY-STEP**:
   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   2. **DELETE** any existing variables that show errors
   3. Click "Add New" for each variable
   4. Enter the variable name exactly (e.g., `REACT_APP_SUPABASE_URL`)
   5. Enter the ACTUAL value (e.g., `https://vounlslounuoasoniazo.supabase.co`)
   6. Select all environments: Production, Preview, Development
   7. Click "Save"
   8. Repeat for all variables

   **❌ NEVER USE**:
   - `@supabase_url` or `@anything`
   - `${VARIABLE_NAME}` 
   - `supabase_url` (just the name)
   
   **✅ ALWAYS USE**:
   - The actual URL/key value
   - Copy directly from Supabase/Razorpay dashboards

5. **Deploy**: Click "Deploy"

### Custom Domain Setup
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## 🖥️ Backend Deployment (Vercel)

### Method 1: Vercel Dashboard
1. **Create Account**: Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Import Backend**: Click "New Project" → Import from Git
3. **Configure Settings**:
   - Name: `zomatify-backend`
   - Framework Preset: `Other`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Output Directory: `` (leave empty for serverless functions)

4. **Environment Variables** (Set in Vercel Dashboard → Settings → Environment Variables):
   ```env
   NODE_ENV=production
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   RAZORPAY_KEY_SECRET=your-secret-key
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

   **Important**: Use actual values, not variable references:
   - `SUPABASE_URL`: Your actual Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your actual service role key from Supabase
   - `RAZORPAY_KEY_ID`: Your actual Razorpay key ID
   - `RAZORPAY_KEY_SECRET`: Your actual Razorpay secret key
   - `ALLOWED_ORIGINS`: Your actual frontend URL

5. **Deploy**: Click "Deploy"

### Method 2: Vercel CLI
```bash
# From project root
cd backend
vercel --prod
```

### Serverless Function Structure
Your backend will be converted to Vercel serverless functions automatically. The `vercel.json` file in the backend directory configures this:

```json
{
  "version": 2,
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }]
}
```

### Important Notes for Vercel Backend:
- All routes will be available at `/api/*` on your Vercel domain
- Serverless functions have a 30-second timeout limit
- Environment variables must be set in Vercel dashboard
- Database connections should use connection pooling

## 🗄️ Database Setup (Supabase)

1. **Create Project**: Go to [Supabase Dashboard](https://app.supabase.com)
2. **Run Schema**: Execute `supabase_setup.sql` in SQL Editor
3. **Configure RLS**: Enable Row Level Security policies
4. **Enable Realtime**: For tables that need live updates

### Required Tables
- `profiles` - User profiles
- `vendors` - Restaurant information
- `menu_items` - Food items
- `orders` - Order data with JSONB items
- `vendor_payment_distributions` - Payment tracking

## 🔐 Security Configuration

### Supabase RLS Policies
```sql
-- Example: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- Example: Vendors can manage their orders
CREATE POLICY "Vendors can manage orders" ON orders
FOR ALL USING (vendor_id IN (
  SELECT id FROM vendors WHERE user_id = auth.uid()
));
```

### Environment Security
- Never commit `.env` files
- Use different Razorpay keys for production
- Enable Supabase RLS on all tables
- Configure CORS for specific domains only

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Go to Vercel project → Analytics
2. Enable Web Analytics
3. Add to your React app:
   ```jsx
   import { Analytics } from '@vercel/analytics/react';
   
   function MyApp() {
     return (
       <>
         <Component {...pageProps} />
         <Analytics />
       </>
     );
   }
   ```

### Vercel Backend Monitoring
- Built-in serverless function logs
- Real-time deployment monitoring
- Performance insights and analytics

### Supabase Monitoring
- Database insights and query performance
- Real-time monitoring dashboard
- Log explorer for debugging

## 🚨 Troubleshooting

### Common Issues

#### Environment Variable Errors
If you see errors like `Environment Variable "REACT_APP_SUPABASE_URL" references Secret "supabase_url", which does not exist`:

**Solution**: In Vercel Dashboard → Settings → Environment Variables, enter **actual values**, not variable names:
- ❌ Wrong: `supabase_url` or `${SUPABASE_URL}`
- ✅ Correct: `https://abcdefghijk.supabase.co`

**Steps to Fix**:
1. Go to your Vercel project dashboard
2. Click Settings → Environment Variables
3. Delete any variables with placeholder values
4. Add new variables with actual values from your services:
   - Get Supabase URL and keys from [Supabase Dashboard](https://app.supabase.com) → Settings → API
   - Get Razorpay keys from [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm run install:all
npm run build:all
```

#### CORS Errors
```javascript
// Backend: Update ALLOWED_ORIGINS
const allowedOrigins = [
  'https://your-frontend.vercel.app',
  'https://your-custom-domain.com'
];
```

#### Database Connection
- Check Supabase service status
- Verify connection strings
- Ensure RLS policies are correct

#### Payment Issues
- Verify Razorpay webhook URLs
- Check API key validity
- Test in Razorpay dashboard

### Logs and Debugging

#### Vercel Logs
```bash
vercel logs your-deployment-url
```

#### Supabase Logs
- SQL Editor for query logs
- Auth logs for user issues
- Real-time logs for subscription problems

## 📈 Performance Optimization

### Frontend
- Enable Vercel Edge caching
- Optimize images and assets
- Use React.memo for heavy components
- Implement code splitting

### Backend
- Enable Vercel Edge caching
- Use efficient serverless functions
- Optimize database queries
- Implement connection pooling

### Database
- Use Supabase connection pooling
- Optimize JSONB queries
- Add appropriate indexes
- Monitor slow queries

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm run install:all
      - run: npm run build:all
      - run: npm test
```

### Deployment Workflow
1. **Development**: Work on feature branches
2. **Testing**: Merge to staging branch for testing
3. **Production**: Merge to main branch for auto-deployment

## 📞 Support

If you encounter issues during deployment:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review service status pages:
   - [Vercel Status](https://vercel-status.com)
   - [Supabase Status](https://status.supabase.com)
3. Create an issue in the [GitHub repository](https://github.com/Aryaman129/Zomatify/issues)

## 🎉 Post-Deployment

After successful deployment:

- [ ] Test all major user flows
- [ ] Verify payment processing
- [ ] Check real-time features
- [ ] Monitor error rates
- [ ] Set up alerts and monitoring
- [ ] Update documentation with live URLs

---

**Congratulations! Your Zomatify application is now live! 🚀**
