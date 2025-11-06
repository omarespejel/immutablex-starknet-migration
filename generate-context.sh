#!/bin/bash

#
# Description:
# This script generates a comprehensive prompt for an LLM by concatenating key source
# files from the IMMUTABLEX-STARKNET-MIGRATION project, including NestJS backend,
# Cairo contracts, Unity client, and deployment configuration.
#
# Usage:
# ./generate-context.sh
#

# --- Configuration ---
# Get current date for the output filename (ISO 8601 format for best practices)
DATE=$(date '+%Y-%m-%d_%H-%M-%S_%Z')

# Output filename with descriptive name following best practices
OUTPUT_FILE="immutablex-starknet-migration-context-${DATE}.txt"

# --- Script Body ---
# Clean up any previous output file to start fresh
rm -f "$OUTPUT_FILE"

echo "🚀 Starting LLM prompt generation for the IMMUTABLEX-STARKNET-MIGRATION project..."
echo "------------------------------------------------------------"
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

# 1. Add a Preamble and Goal for the LLM
echo "Adding LLM preamble and goal..."
{
  echo "# IMMUTABLEX-STARKNET-MIGRATION Project Context & Goal"
  echo ""
  echo "## Goal for the LLM"
  echo "You are an expert full-stack blockchain developer with deep expertise in:"
  echo "- NestJS backend architecture and dependency injection"
  echo "- Starknet smart contracts (Cairo language)"
  echo "- Account abstraction and session keys"
  echo "- WebSocket real-time communication"
  echo "- Transaction batching and gas optimization"
  echo "- Paymaster integration (AVNU)"
  echo "- Redis/Bull queue processing"
  echo "- Unity C# client integration"
  echo "- Docker containerization"
  echo "- Bun runtime and package management"
  echo "- JWT authentication and session management"
  echo "- Cryptographic key encryption/decryption"
  echo ""
  echo "Your task is to analyze the complete context of this ImmutableX to Starknet migration project. The system features:"
  echo "- NestJS backend API server"
  echo "- Self-custody wallet generation"
  echo "- Session key management (24hr expiry)"
  echo "- Transaction batching (100 actions per batch)"
  echo "- AVNU Paymaster integration for gasless transactions"
  echo "- WebSocket gateway for real-time game actions"
  echo "- Redis/Bull queue for async transaction processing"
  echo "- Unity client integration ready"
  echo "- Docker compose setup (Redis + Postgres)"
  echo ""
  echo "Please review the project structure, dependencies, source code, and configuration,"
  echo "then provide specific, actionable advice for improvement. Focus on:"
  echo "- NestJS best practices and module architecture"
  echo "- Service optimization and dependency injection patterns"
  echo "- Starknet integration patterns (Account abstraction, session keys)"
  echo "- Transaction batching efficiency and gas optimization"
  echo "- Paymaster integration and error handling"
  echo "- WebSocket connection management and scalability"
  echo "- Queue processing reliability and error recovery"
  echo "- Security best practices (key encryption, JWT handling)"
  echo "- Error handling and logging strategies"
  echo "- API design and RESTful conventions"
  echo "- TypeScript type safety and interfaces"
  echo "- Docker compose configuration"
  echo "- Unity client integration patterns"
  echo "- Testing strategies (unit, integration, e2e)"
  echo "- Performance monitoring and metrics"
  echo "- Deployment strategies (production readiness)"
  echo ""
  echo "---"
  echo ""
} >> "$OUTPUT_FILE"

# 2. Add the project's directory structure (cleaned up)
echo "Adding cleaned directory structure..."
echo "## Directory Structure" >> "$OUTPUT_FILE"
if command -v tree &> /dev/null; then
    echo "  -> Adding directory structure (tree -L 4)"
    # Exclude common noise from the tree view
    tree -L 4 -I "node_modules|dist|.git|.DS_Store|bun.lock|*.log|build|Library|Temp|obj|*.csproj" >> "$OUTPUT_FILE"
else
    echo "  -> WARNING: 'tree' command not found. Using find instead."
    echo "NOTE: 'tree' command was not found. Directory listing:" >> "$OUTPUT_FILE"
    find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/Library/*' -not -path '*/Temp/*' | head -50 >> "$OUTPUT_FILE"
fi
echo "" >> "$OUTPUT_FILE"

# 3. Add Core Project and Configuration Files
echo "Adding core project and configuration files..."
# Core files that provide project context
CORE_FILES=(
  "README.md"
  "docker-compose.yml"
  ".gitignore"
  "$0" # This script itself
)

for file in "${CORE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  -> Adding $file"
    echo "## FILE: $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  else
    echo "  -> WARNING: $file not found. Skipping."
  fi
done

# 4. Add Backend Configuration Files
echo "Adding backend configuration files..."
BACKEND_CONFIG_FILES=(
  "backend/package.json"
  "backend/tsconfig.json"
  "backend/.env.example"
  "backend/README.md"
)

for file in "${BACKEND_CONFIG_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  -> Adding $file"
    echo "## FILE: $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  else
    echo "  -> WARNING: $file not found. Skipping."
  fi
done

# 5. Add all backend source files from backend/src/
echo "Adding backend source files from backend/src/..."
if [ -d "backend/src" ]; then
  echo "  -> Found backend/src/ directory; adding its files"
  # Find all TypeScript files
  find "backend/src" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    | sort | while read -r src_file; do
      echo "  -> Adding source file: $src_file"
      echo "## FILE: $src_file" >> "$OUTPUT_FILE"
      cat "$src_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
else
  echo "  -> WARNING: backend/src/ directory not found."
fi

# 6. Add backend modules (organized by feature)
echo "Adding backend modules..."

# Wallet module
if [ -d "backend/src/wallet" ]; then
  find "backend/src/wallet" -type f \( -name "*.ts" \) \
    | sort | while read -r module_file; do
      echo "  -> Adding wallet module file: $module_file"
      echo "## FILE: $module_file" >> "$OUTPUT_FILE"
      cat "$module_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

# Session module
if [ -d "backend/src/session" ]; then
  find "backend/src/session" -type f \( -name "*.ts" \) \
    | sort | while read -r module_file; do
      echo "  -> Adding session module file: $module_file"
      echo "## FILE: $module_file" >> "$OUTPUT_FILE"
      cat "$module_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

# Game module
if [ -d "backend/src/game" ]; then
  find "backend/src/game" -type f \( -name "*.ts" \) \
    | sort | while read -r module_file; do
      echo "  -> Adding game module file: $module_file"
      echo "## FILE: $module_file" >> "$OUTPUT_FILE"
      cat "$module_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

# Paymaster module
if [ -d "backend/src/paymaster" ]; then
  find "backend/src/paymaster" -type f \( -name "*.ts" \) \
    | sort | while read -r module_file; do
      echo "  -> Adding paymaster module file: $module_file"
      echo "## FILE: $module_file" >> "$OUTPUT_FILE"
      cat "$module_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

# Config module (if exists)
if [ -d "backend/src/config" ]; then
  find "backend/src/config" -type f \( -name "*.ts" \) \
    | sort | while read -r config_file; do
      echo "  -> Adding config file: $config_file"
      echo "## FILE: $config_file" >> "$OUTPUT_FILE"
      cat "$config_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

# 7. Add Cairo contracts (if any)
echo "Adding Cairo contracts..."
if [ -d "contracts" ]; then
  find "contracts" -type f \( -name "*.cairo" -o -name "Scarb.toml" -o -name "*.toml" \) \
    -not -path "*/target/*" \
    | sort | while read -r contract_file; do
      echo "  -> Adding contract file: $contract_file"
      echo "## FILE: $contract_file" >> "$OUTPUT_FILE"
      cat "$contract_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
else
  echo "  -> No contracts directory found. Skipping."
fi

# 8. Add Unity client files (if any relevant config)
echo "Adding Unity client configuration..."
if [ -d "unity-client" ]; then
  # Only include configuration files, not binaries
  find "unity-client" -type f \( -name "*.cs" -o -name "*.json" -o -name "*.md" -o -name "*.txt" \) \
    -not -path "*/Library/*" \
    -not -path "*/Temp/*" \
    -not -path "*/obj/*" \
    -not -path "*/build/*" \
    | head -20 | sort | while read -r unity_file; do
      echo "  -> Adding Unity file: $unity_file"
      echo "## FILE: $unity_file" >> "$OUTPUT_FILE"
      cat "$unity_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
else
  echo "  -> No unity-client directory found. Skipping."
fi

# 9. Add documentation files
echo "Adding documentation files..."
if [ -d "docs" ]; then
  find "docs" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.rst" \) \
    | sort | while read -r doc_file; do
      echo "  -> Adding documentation file: $doc_file"
      echo "## FILE: $doc_file" >> "$OUTPUT_FILE"
      cat "$doc_file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      echo "---" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
else
  echo "  -> No docs directory found. Skipping."
fi

# 10. Add configuration files (never include .env)
echo "Adding additional configuration files..."
# Never include .env to avoid secret exposure
if [ -f "backend/.env" ]; then
  echo "  -> WARNING: backend/.env detected but will NOT be included to avoid exposing secrets."
fi

CONFIG_FILES=(
  ".env.example"
  ".prettierrc"
  ".eslintrc"
  ".eslintrc.json"
  ".eslintrc.js"
  ".eslintrc.cjs"
  "tsconfig.json"
  "jsconfig.json"
)

for config_file in "${CONFIG_FILES[@]}"; do
  if [ -f "$config_file" ]; then
    echo "  -> Adding config file: $config_file"
    echo "## FILE: $config_file" >> "$OUTPUT_FILE"
    cat "$config_file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
done

# Check for backend-specific config files
if [ -f "backend/.prettierrc" ] || [ -f "backend/.eslintrc*" ]; then
  find "backend" -maxdepth 1 -type f \( -name ".prettierrc*" -o -name ".eslintrc*" \) | while read -r backend_config; do
    echo "  -> Adding backend config file: $backend_config"
    echo "## FILE: $backend_config" >> "$OUTPUT_FILE"
    cat "$backend_config" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done
fi

# --- Completion Summary ---
echo ""
echo "-------------------------------------"
echo "✅ Prompt generation complete!"
echo "Generated on: $(date '+%A, %B %d, %Y at %I:%M:%S %p %Z')"
echo ""
echo "This context file now includes:"
echo "  ✓ A clear goal and preamble for the LLM"
echo "  ✓ A cleaned project directory structure"
echo "  ✓ Core project files (README.md, docker-compose.yml)"
echo "  ✓ Backend configuration files (package.json, tsconfig.json, .env.example)"
echo "  ✓ All NestJS backend source code (main.ts, app.module.ts)"
echo "  ✓ Wallet module (service, controller)"
echo "  ✓ Session module (service, controller, JWT handling)"
echo "  ✓ Game module (WebSocket gateway, transaction processor)"
echo "  ✓ Paymaster module (AVNU integration)"
echo "  ✓ Cairo smart contracts (if present)"
echo "  ✓ Unity client source files (C# scripts, configs)"
echo "  ✓ Documentation files"
echo "  ✓ Additional configuration files"
echo ""
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "Total lines: $(wc -l < "$OUTPUT_FILE" | xargs)"
echo ""
echo "You can now use the content of '$OUTPUT_FILE' as a context prompt for your LLM."
echo "Perfect for getting comprehensive code reviews, architecture advice, or feature suggestions!"
echo ""
echo "💡 Tip: This is especially useful for:"
echo "   - NestJS module architecture optimization"
echo "   - Starknet integration patterns (Account abstraction)"
echo "   - Session key management improvements"
echo "   - Transaction batching efficiency"
echo "   - Paymaster integration error handling"
echo "   - WebSocket scalability and connection management"
echo "   - Queue processing reliability"
echo "   - Security best practices (encryption, JWT)"
echo "   - TypeScript type safety improvements"
echo "   - API design and RESTful conventions"
echo "   - Docker compose optimization"
echo "   - Unity client integration patterns"
echo "   - Testing strategy recommendations"
echo "   - Production deployment readiness"
echo ""
echo "🎯 Key areas to focus on:"
echo "   - Wallet generation and key encryption security"
echo "   - Session key expiry and renewal logic"
echo "   - Transaction batching algorithm and gas optimization"
echo "   - Paymaster integration error handling and retry logic"
echo "   - WebSocket connection lifecycle management"
echo "   - Queue job processing and failure recovery"
echo "   - Error handling and logging strategies"
echo "   - TypeScript interface definitions and type safety"
echo "   - API endpoint design and validation"
echo "   - Docker compose service dependencies"
echo "   - Unity WebSocket client implementation"
echo "   - Production monitoring and metrics"
echo ""
