#!/bin/bash

# Configure Secrets for Blaze Intelligence Data Layer
# This script helps set up Notion integration and other secrets

echo "🔐 Configuring Blaze Intelligence Data Layer Secrets"
echo "===================================================="
echo ""

# Function to prompt for secret
prompt_secret() {
    local secret_name=$1
    local description=$2
    local current_value=$3
    
    echo "📝 $description"
    if [ -n "$current_value" ]; then
        echo "   Current value is set (hidden for security)"
        read -p "   Enter new value (or press Enter to keep current): " new_value
    else
        read -p "   Enter value: " new_value
    fi
    
    if [ -n "$new_value" ]; then
        echo "$new_value" | wrangler secret put "$secret_name" --env production 2>/dev/null
        echo "   ✅ $secret_name configured"
    else
        echo "   ⏭️  Keeping existing value"
    fi
    echo ""
}

# Check if wrangler is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare first:"
    wrangler login
fi

echo "This script will help you configure the following secrets:"
echo "1. NOTION_TOKEN - For Notion API integration"
echo "2. NOTION_DATABASE_ID - Your Notion database ID"
echo "3. API_KEY - Optional API key for secured endpoints"
echo ""
echo "You can get your Notion integration token from:"
echo "https://www.notion.so/my-integrations"
echo ""
read -p "Press Enter to continue..."
echo ""

# Configure Notion Token
prompt_secret "NOTION_TOKEN" "Notion Integration Token (starts with 'secret_' or 'ntn_')"

# Configure Notion Database ID
echo "📝 Notion Database ID"
echo "   You can find this in your Notion database URL:"
echo "   https://notion.so/[workspace]/[database-id]?v=..."
echo "   The database-id is the 32-character string"
prompt_secret "NOTION_DATABASE_ID" "Notion Database ID (32 characters)"

# Optional API Key
echo "📝 API Key (Optional)"
echo "   This can be used to secure your endpoints"
echo "   Leave blank if you want public access"
prompt_secret "API_KEY" "API Key for secured access"

echo ""
echo "🎉 Configuration Complete!"
echo "=========================="
echo ""
echo "Your secrets have been configured for the production environment."
echo ""
echo "To verify your configuration, you can check:"
echo "1. List secrets: wrangler secret list --env production"
echo "2. Test Notion integration: curl https://blaze-data-layer-prod.humphrey-austin20.workers.dev/portfolio"
echo ""
echo "To update the worker with these secrets:"
echo "wrangler deploy --env production"
echo ""