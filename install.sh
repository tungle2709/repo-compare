#!/bin/bash

# RepoDiffMatch Installation Script
# Supports: macOS, Linux, Windows (WSL)

set -e

REPO_URL="https://github.com/tungle2709/RepoDiffMatch"
INSTALL_DIR="$HOME/.repodiffmatch"
BIN_DIR="$HOME/.local/bin"

echo "Installing RepoDiffMatch..."

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Clone or download the repository
if command -v git &> /dev/null; then
    echo "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
        echo "Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull origin main
    }
else
    echo "Downloading repository..."
    curl -L "$REPO_URL/archive/main.zip" -o /tmp/repodiffmatch.zip
    unzip -q /tmp/repodiffmatch.zip -d /tmp/
    cp -r /tmp/RepoDiffMatch-main/* "$INSTALL_DIR/"
    rm -rf /tmp/repodiffmatch.zip /tmp/RepoDiffMatch-main
fi

# Install dependencies
cd "$INSTALL_DIR"
echo "Installing dependencies..."
npm install --production

# Create executable script
cat > "$BIN_DIR/repodm" << 'EOF'
#!/bin/bash
exec node "$HOME/.repodiffmatch/index.js" "$@"
EOF

chmod +x "$BIN_DIR/repodm"

# Add to PATH if not already there
SHELL_RC=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [[ -n "$SHELL_RC" ]] && ! grep -q "$BIN_DIR" "$SHELL_RC" 2>/dev/null; then
    echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_RC"
    echo "Added $BIN_DIR to PATH in $SHELL_RC"
fi

echo ""
echo "RepoDiffMatch installed successfully!"
echo ""
echo "Usage:"
echo "  repodm compare owner1/repo1 owner2/repo2"
echo "  repodm compare https://github.com/owner1/repo1 https://github.com/owner2/repo2"
echo ""
echo "Restart your terminal or run: source $SHELL_RC"
echo "Then test with: repodm --version"
