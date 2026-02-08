#!/usr/bin/env bash
# Common utilities for dev.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [ "${DEBUG:-}" = "1" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        log_warn ".env file not found. Copying from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "Created .env from .env.example"
        else
            log_error ".env.example not found!"
            exit 1
        fi
    fi
}

# Get the script directory (where dev.sh lives)
get_script_dir() {
    cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

