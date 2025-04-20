# Zomatify Setup Instructions

## Database Setup

To fix the current errors, please follow these steps:

1. **Create required tables in Supabase**
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Run the SQL commands in `setup_database.sql`
   - This will create:
     - `orders` table for customer orders
     - `menu_items` table for restaurant menu items
     - Required Row Level Security (RLS) policies

2. **Create a storage bucket for image uploads**
   - In your Supabase dashboard, go to Storage
   - Click "Create a new bucket"
   - Name it "images"
   - Set the access to "public" (for development)
   - Set bucket permissions as needed

3. **Enable CORS for your storage bucket**
   - In your Supabase dashboard, go to Storage → Settings → CORS Configuration
   - Add the following configuration:
     ```
     {
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "origin": ["http://localhost:3000", "https://yourdomain.com"],
       "maxAgeSeconds": 3600
     }
     ```
   - Replace `yourdomain.com` with your production domain

4. **Add missing logo files (optional)**
   - Add logo images to the `frontend/public/images/` directory:
     - `logo192.png` (192x192 pixels)
     - `logo512.png` (512x512 pixels)
   - These are currently removed from the manifest.json

## Development Mode

For development purposes, the application now includes:

1. **Fallback data**: Sample data will be shown when database tables don't exist
   - Sample orders with different statuses
   - Sample menu items with descriptions and images
   
2. **Temporary image handling**: Images are processed as Data URLs when Storage bucket is missing

3. **Mobile optimizations**: The interface is now more user-friendly on mobile devices

4. **Development access**: You can access the shopkeeper dashboard via the development route (/dev-shopkeeper)

## Production Readiness

Before deploying to production:

1. Complete all database setup steps above
2. Switch to using Supabase storage for image uploads (uncomment code in ImageUploader)
3. Remove the development-only routes and fallbacks
4. Configure proper authentication and authorization

## Troubleshooting

If you still encounter issues:

1. Check browser console for specific errors
2. Verify Supabase configuration in `supabaseClient.ts`
3. Ensure all required tables have proper RLS policies
4. Check that storage bucket permissions are correctly set
5. Make sure your Supabase service is active and not in maintenance mode 