#!/bin/bash

# Deployment script for Zomatify
echo "🚀 Starting Zomatify deployment..."

# Check if environment variables are set
check_env() {
    if [ -z "$1" ]; then
        echo "❌ Error: Environment variable $2 is not set"
        exit 1
    fi
}

echo "📋 Checking environment variables..."
check_env "$REACT_APP_SUPABASE_URL" "REACT_APP_SUPABASE_URL"
check_env "$REACT_APP_SUPABASE_ANON_KEY" "REACT_APP_SUPABASE_ANON_KEY"
check_env "$REACT_APP_RAZORPAY_KEY_ID" "REACT_APP_RAZORPAY_KEY_ID"

echo "✅ Environment variables are set"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🏗️ Building frontend..."
npm run frontend:build

echo "✅ Frontend built successfully"

# Test backend
echo "🧪 Testing backend..."
cd backend && npm test && cd ..

echo "✅ Backend tests passed"

echo "🎉 Deployment preparation complete!"
echo "🌐 Ready to deploy to Vercel (frontend) and Render (backend)"
