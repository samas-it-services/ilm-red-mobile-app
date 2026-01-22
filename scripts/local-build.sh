#!/bin/bash

# Local Build and Test Script for ILM Red Mobile App
# Usage: ./scripts/local-build.sh [option]
# Options:
#   dev      - Start Expo development server (Expo Go)
#   android  - Build and run on Android device/emulator
#   apk      - Build APK locally using EAS
#   clean    - Clean all caches

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "${GREEN}=== ILM Red Mobile App - Local Build ===${NC}"
echo ""

# Function to clean caches
clean_caches() {
    echo -e "${YELLOW}Cleaning caches...${NC}"
    rm -rf node_modules/.cache
    rm -rf .expo
    rm -rf android/app/build 2>/dev/null || true
    rm -rf android/.gradle 2>/dev/null || true
    watchman watch-del-all 2>/dev/null || true
    echo -e "${GREEN}Caches cleaned${NC}"
}

# Function to check dependencies
check_deps() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed${NC}"
        exit 1
    fi

    if ! command -v npx &> /dev/null; then
        echo -e "${RED}npx is not installed${NC}"
        exit 1
    fi

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing node modules...${NC}"
        npm install --legacy-peer-deps
    fi

    echo -e "${GREEN}Dependencies OK${NC}"
}

# Function to show environment info
show_env() {
    echo ""
    echo -e "${YELLOW}Environment:${NC}"
    echo "  Node: $(node -v)"
    echo "  npm: $(npm -v)"
    echo "  API URL: ${EXPO_PUBLIC_API_URL:-http://localhost:8000}"
    echo ""
}

# Option 1: Start dev server (Expo Go)
start_dev() {
    echo -e "${GREEN}Starting Expo development server...${NC}"
    echo ""
    echo "Scan the QR code with Expo Go app on your phone"
    echo "Or press 'a' to open on Android emulator"
    echo ""
    npx expo start --clear
}

# Option 2: Build and run on Android
run_android() {
    echo -e "${GREEN}Building and running on Android...${NC}"
    echo ""
    echo "Make sure you have:"
    echo "  - Android device connected via USB with USB debugging enabled"
    echo "  - OR Android emulator running"
    echo ""

    # Check for connected devices
    if command -v adb &> /dev/null; then
        DEVICES=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)
        if [ "$DEVICES" -eq 0 ]; then
            echo -e "${RED}No Android devices found. Connect a device or start an emulator.${NC}"
            exit 1
        fi
        echo -e "${GREEN}Found $DEVICES device(s)${NC}"
    fi

    npx expo run:android
}

# Option 3: Build APK locally with EAS
build_apk() {
    echo -e "${GREEN}Building APK locally with EAS...${NC}"
    echo ""

    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}Installing EAS CLI...${NC}"
        npm install -g eas-cli
    fi

    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${RED}Android SDK not found.${NC}"
        echo "Set ANDROID_HOME or ANDROID_SDK_ROOT environment variable"
        echo ""
        echo "On macOS with Android Studio:"
        echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk"
        echo ""
        exit 1
    fi

    echo "This will build an APK on your local machine."
    echo "It requires Android SDK and Java 17+ installed."
    echo ""

    # Build locally
    eas build --platform android --profile preview --local

    echo ""
    echo -e "${GREEN}APK built successfully!${NC}"
    echo "Look for the .apk file in the current directory"
}

# Option 4: Quick test with Expo Go + specific API
test_with_api() {
    API_URL="${1:-https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io}"

    echo -e "${GREEN}Starting with API: ${API_URL}${NC}"
    echo ""

    EXPO_PUBLIC_API_URL="$API_URL" npx expo start --clear
}

# Main menu
show_menu() {
    echo "Choose an option:"
    echo ""
    echo "  1) dev      - Start Expo Go dev server (fastest, but uses Expo Go)"
    echo "  2) android  - Build & run dev build on device/emulator (closer to production)"
    echo "  3) apk      - Build APK locally with EAS (same as GitHub Action)"
    echo "  4) clean    - Clean all caches"
    echo "  5) test-api - Start dev server with production API URL"
    echo ""
    read -p "Enter option (1-5): " choice

    case $choice in
        1|dev)
            OPTION="dev"
            ;;
        2|android)
            OPTION="android"
            ;;
        3|apk)
            OPTION="apk"
            ;;
        4|clean)
            OPTION="clean"
            ;;
        5|test-api)
            OPTION="test-api"
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
}

# Parse command line argument or show menu
OPTION="${1:-}"

if [ -z "$OPTION" ]; then
    show_menu
fi

# Execute based on option
check_deps
show_env

case $OPTION in
    dev)
        start_dev
        ;;
    android)
        run_android
        ;;
    apk)
        build_apk
        ;;
    clean)
        clean_caches
        ;;
    test-api)
        test_with_api "https://ilmred-prod-api.braverock-f357973c.westus2.azurecontainerapps.io"
        ;;
    *)
        echo -e "${RED}Unknown option: $OPTION${NC}"
        echo "Usage: $0 [dev|android|apk|clean|test-api]"
        exit 1
        ;;
esac
