echo "🚀 Options Pricing Platform - Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    echo -e "${GREEN}✓ Python3 found${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
    echo -e "${GREEN}✓ Python found${NC}"
else
    echo -e "${RED}✗ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

# Check if Node.js is installed
echo ""
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found${NC}"
    echo "Node.js version: $NODE_VERSION"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 14+${NC}"
    exit 1
fi

echo ""
echo "===================================="
echo "📦 Installing Backend Dependencies"
echo "===================================="
echo ""

# Create virtual environment
echo "Creating Python virtual environment..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source venv/Scripts/activate
else
    # Unix/Linux/Mac
    source venv/bin/activate
fi

# Install Python packages
echo "Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install backend dependencies${NC}"
    exit 1
fi

echo ""
echo "===================================="
echo "📦 Installing Frontend Dependencies"
echo "===================================="
echo ""

# Check if frontend directory exists
if [ -d "frontend" ]; then
    cd frontend
    echo "Installing Node packages..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${BLUE}ℹ Frontend directory not found. Skipping frontend setup.${NC}"
fi

echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo "===================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend (in terminal 1):"
echo -e "   ${BLUE}source venv/bin/activate${NC}  # or venv\\Scripts\\activate on Windows"
echo -e "   ${BLUE}python options_pricing_backend.py${NC}"
echo ""
echo "2. Start Frontend (in terminal 2):"
echo -e "   ${BLUE}cd frontend${NC}"
echo -e "   ${BLUE}npm start${NC}"
echo ""
echo "3. Open browser at http://localhost:3000"
echo ""
echo "📚 For more information, see README.md"
echo ""