#!/bin/bash
# BSI Development Environment Setup Script
# Championship-grade development setup in one command

set -euo pipefail

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="BSI - Blaze Sports Intelligence"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}Setting up ${PROJECT_NAME}...${NC}"
echo -e "${BLUE}Project root: ${PROJECT_ROOT}${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    local missing_tools=()

    if ! command -v docker &> /dev/null; then
        missing_tools+=("Docker")
    fi

    if ! command -v python3 &> /dev/null; then
        missing_tools+=("Python 3")
    fi

    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    fi

    if ! command -v git &> /dev/null; then
        missing_tools+=("Git")
    fi

    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}Missing required tools:${NC}"
        printf '%s\n' "${missing_tools[@]}"
        echo ""
        echo "Please install the missing tools and run setup again."
        exit 1
    fi

    echo -e "${GREEN}✓ All prerequisites found${NC}"
}

# Create necessary directories
create_directories() {
    echo -e "${BLUE}Creating project directories...${NC}"

    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/cache"
    mkdir -p "${PROJECT_ROOT}/uploads"
    mkdir -p "${PROJECT_ROOT}/backups"
    mkdir -p "${PROJECT_ROOT}/tmp"

    echo -e "${GREEN}✓ Directories created${NC}"
}

# Setup environment
setup_environment() {
    echo -e "${BLUE}Setting up environment...${NC}"

    cd "${PROJECT_ROOT}"

    # Copy environment template if .env doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}Created .env from template - please update with your values${NC}"
    else
        echo -e "${GREEN}✓ .env already exists${NC}"
    fi

    # Check environment sync
    if [ -f scripts/check_env_sync.py ]; then
        python3 scripts/check_env_sync.py || true
    fi
}

# Install Python dependencies
install_python_deps() {
    echo -e "${BLUE}Installing Python dependencies...${NC}"

    cd "${PROJECT_ROOT}"

    # Create virtual environment if it doesn't exist
    if [ ! -d venv ]; then
        python3 -m venv venv
        echo -e "${GREEN}✓ Created Python virtual environment${NC}"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    pip install --upgrade pip

    # Install requirements
    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
        echo -e "${GREEN}✓ Python dependencies installed${NC}"
    else
        echo -e "${YELLOW}Warning: requirements.txt not found${NC}"
    fi
}

# Install Node dependencies
install_node_deps() {
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"

    cd "${PROJECT_ROOT}"

    if [ -f package.json ]; then
        npm install
        echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
    else
        echo -e "${YELLOW}Warning: package.json not found${NC}"
    fi
}

# Setup pre-commit hooks
setup_pre_commit() {
    echo -e "${BLUE}Setting up pre-commit hooks...${NC}"

    cd "${PROJECT_ROOT}"

    # Install pre-commit if available
    if command -v pre-commit &> /dev/null && [ -f .pre-commit-config.yaml ]; then
        pre-commit install
        echo -e "${GREEN}✓ Pre-commit hooks installed${NC}"
    else
        echo -e "${YELLOW}Warning: pre-commit not available or config missing${NC}"
    fi
}

# Setup Docker network
setup_docker() {
    echo -e "${BLUE}Setting up Docker environment...${NC}"

    # Create Docker network if it doesn't exist
    if ! docker network ls | grep -q bsi-network; then
        docker network create bsi-network
        echo -e "${GREEN}✓ Created Docker network 'bsi-network'${NC}"
    else
        echo -e "${GREEN}✓ Docker network already exists${NC}"
    fi

    # Build Docker images
    if [ -f docker-compose.yml ]; then
        docker-compose build --no-cache
        echo -e "${GREEN}✓ Docker images built${NC}"
    else
        echo -e "${YELLOW}Warning: docker-compose.yml not found${NC}"
    fi
}

# Setup Cloudflare Wrangler
setup_wrangler() {
    echo -e "${BLUE}Setting up Cloudflare Wrangler...${NC}"

    cd "${PROJECT_ROOT}"

    # Install wrangler globally if not available
    if ! command -v wrangler &> /dev/null; then
        npm install -g wrangler@latest
        echo -e "${GREEN}✓ Wrangler installed globally${NC}"
    else
        echo -e "${GREEN}✓ Wrangler already available${NC}"
    fi

    # Validate wrangler.toml
    if [ -f wrangler.toml ]; then
        if wrangler pages validate 2>/dev/null; then
            echo -e "${GREEN}✓ Wrangler configuration valid${NC}"
        else
            echo -e "${YELLOW}Warning: Wrangler configuration may need updates${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: wrangler.toml not found${NC}"
    fi
}

# Verify installation
verify_installation() {
    echo -e "${BLUE}Verifying installation...${NC}"

    cd "${PROJECT_ROOT}"

    # Check if Docker services can start
    if [ -f docker-compose.yml ]; then
        echo "Testing Docker services..."
        docker-compose config > /dev/null
        echo -e "${GREEN}✓ Docker Compose configuration valid${NC}"
    fi

    # Check Python imports
    if [ -f requirements.txt ]; then
        echo "Testing Python imports..."
        python3 -c "import numpy, pandas, fastapi" 2>/dev/null && \
            echo -e "${GREEN}✓ Core Python packages importable${NC}" || \
            echo -e "${YELLOW}Warning: Some Python packages may not be installed correctly${NC}"
    fi

    # Check Node packages
    if [ -f package.json ]; then
        echo "Testing Node packages..."
        node -e "console.log('Node.js test successful')" && \
            echo -e "${GREEN}✓ Node.js working correctly${NC}"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 BSI development environment setup complete!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update .env file with your API keys and configuration"
    echo "2. Start development environment: ${YELLOW}make dev${NC}"
    echo "3. Open your browser to: ${YELLOW}http://localhost:8000${NC}"
    echo "4. View API docs at: ${YELLOW}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "  ${YELLOW}make help${NC}        - Show all available commands"
    echo "  ${YELLOW}make test${NC}        - Run test suite"
    echo "  ${YELLOW}make format${NC}      - Format code"
    echo "  ${YELLOW}make deploy${NC}      - Deploy to production"
    echo ""
    echo -e "${BLUE}Need help?${NC}"
    echo "  📚 Documentation: docs/dev_quickstart.md"
    echo "  🐛 Issues: https://github.com/ahump20/BSI/issues"
    echo "  📧 Email: austin@blazesportsintel.com"
    echo ""
    echo -e "${GREEN}Happy coding! 🏆${NC}"
}

# Main execution
main() {
    check_prerequisites
    create_directories
    setup_environment
    install_python_deps
    install_node_deps
    setup_pre_commit
    setup_docker
    setup_wrangler
    verify_installation
    show_next_steps
}

# Run main function
main "$@"