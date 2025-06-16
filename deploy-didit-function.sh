#!/bin/bash

# Deploy didit-verification function to Supabase
echo "Deploying didit-verification function..."

# Navigate to the function directory
cd supabase/functions/didit-verification

# Deploy the function
npx supabase functions deploy didit-verification --no-verify-jwt

echo "Deployment complete!" 