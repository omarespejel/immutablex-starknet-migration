#!/bin/bash

# Test Alchemy RPC Connection
# Usage: ./test-alchemy.sh YOUR_ALCHEMY_API_KEY

if [ -z "$1" ]; then
  echo "Usage: ./test-alchemy.sh YOUR_ALCHEMY_API_KEY"
  echo ""
  echo "Get your API key from: https://dashboard.alchemy.com/"
  exit 1
fi

ALCHEMY_KEY="$1"
ENDPOINT="https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/${ALCHEMY_KEY}"

echo "Testing Alchemy connection..."
echo "Endpoint: ${ENDPOINT}"
echo ""

curl -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"starknet_chainId","params":[]}'

echo ""
echo ""
echo "Expected result: {\"jsonrpc\":\"2.0\",\"id\":1,\"result\":\"0x534e5f5345504f4c4941\"}"
echo "The result '0x534e5f5345504f4c4941' is 'SN_SEPOLIA' in hex (Sepolia testnet chain ID)"

