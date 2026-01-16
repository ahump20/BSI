#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Blaze Sports Intel - Git SSH Setup${NC}"
echo "========================================"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${YELLOW}⚠️  No SSH key found. Generating new key...${NC}"

    read -p "Enter your email address: " email
    ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519

    echo -e "${GREEN}✅ SSH key generated!${NC}"
else
    echo -e "${GREEN}✅ SSH key already exists${NC}"
fi

# Set up SSH config
echo ""
echo -e "${BLUE}📝 Configuring SSH...${NC}"

cat > ~/.ssh/config << 'EOF'
# GitHub Configuration
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    UseKeychain yes

# Replit Configuration
Host *.replit.dev
    IdentityFile ~/.ssh/replit
    AddKeysToAgent yes
EOF

echo -e "${GREEN}✅ SSH config updated${NC}"

# Add key to SSH agent
echo ""
echo -e "${BLUE}🔑 Adding key to SSH agent...${NC}"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
echo -e "${GREEN}✅ Key added to SSH agent${NC}"

# Copy public key to clipboard
echo ""
echo -e "${BLUE}📋 Copying public key to clipboard...${NC}"
cat ~/.ssh/id_ed25519.pub | pbcopy
echo -e "${GREEN}✅ Public key copied to clipboard!${NC}"

# Display the public key
echo ""
echo -e "${YELLOW}Your SSH public key:${NC}"
cat ~/.ssh/id_ed25519.pub
echo ""

# Prompt to add to GitHub
echo -e "${YELLOW}⚠️  IMPORTANT: Add this key to GitHub${NC}"
echo ""
echo "1. The key has been copied to your clipboard"
echo "2. Opening GitHub SSH settings page..."
echo "3. Click 'New SSH key'"
echo "4. Paste the key (Cmd+V)"
echo "5. Give it a title like 'Blaze Intelligence Mac'"
echo "6. Click 'Add SSH key'"
echo ""

read -p "Press Enter to open GitHub SSH settings page..."
open "https://github.com/settings/ssh/new"

# Wait for user to add key
echo ""
read -p "Press Enter after you've added the key to GitHub..."

# Test SSH connection
echo ""
echo -e "${BLUE}🧪 Testing SSH connection to GitHub...${NC}"
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
else
    echo -e "${RED}❌ SSH connection failed. Please check your setup.${NC}"
    exit 1
fi

# Update Git remote to use SSH
echo ""
echo -e "${BLUE}🔄 Updating Git remote to use SSH...${NC}"

current_url=$(git remote get-url origin)
if [[ $current_url == https* ]]; then
    # Extract repo from HTTPS URL
    repo=$(echo $current_url | sed 's/https:\/\/github.com\///' | sed 's/.git$//')
    new_url="git@github.com:${repo}.git"

    git remote set-url origin "$new_url"
    echo -e "${GREEN}✅ Git remote updated to: $new_url${NC}"
else
    echo -e "${YELLOW}ℹ️  Remote already using SSH: $current_url${NC}"
fi

# Verify remote
echo ""
echo -e "${BLUE}📡 Current Git remotes:${NC}"
git remote -v

# Test Git connection
echo ""
echo -e "${BLUE}🧪 Testing Git connection...${NC}"
if git ls-remote origin HEAD &>/dev/null; then
    echo -e "${GREEN}✅ Git connection successful!${NC}"
else
    echo -e "${RED}❌ Git connection failed. Please check your setup.${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Read the PR workflow guide: docs/PR_WORKFLOW.md"
echo "2. Create a feature branch: git checkout -b feature/my-feature"
echo "3. Make your changes and commit"
echo "4. Push and create a PR: gh pr create"
echo ""
echo -e "${BLUE}Happy coding! 🔥${NC}"
