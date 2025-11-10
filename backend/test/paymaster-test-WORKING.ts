// test/paymaster-test-WORKING.ts
// Fixed version with VALID Starknet address format

const AVNU_PAYMASTER_URL = process.env.AVNU_PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi';
const AVNU_API_KEY = process.env.AVNU_API_KEY || 'CONTACT_AVNU_FOR_KEY';

async function testAVNUPaymasterFixed() {
  console.log('🧪 Testing AVNU Paymaster with VALID Starknet format...\n');

  // Use a REAL Starknet testnet address (66 chars: 0x + 64 hex)
  // This is a known testnet account address format
  const VALID_TESTNET_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000001';

  // ETH token contract on Sepolia testnet (correct address)
  const ETH_TOKEN_SEPOLIA = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

  // Build the correct payload based on AVNU docs
  const correctPayload = {
    userAddress: VALID_TESTNET_ADDRESS, // Must be 66 chars
    calls: [
      {
        // Try both field names since docs vary
        to: ETH_TOKEN_SEPOLIA,
        contractAddress: ETH_TOKEN_SEPOLIA,
        entrypoint: 'approve',
        selector: 'approve',  // Also try selector
        calldata: ['0x1', '0x1', '0x0']  // Small amounts
      }
    ]
  };

  try {
    const response = await fetch(
      `${AVNU_PAYMASTER_URL}/api/v1/paymaster/build`,
      {
        method: 'POST',
        headers: {
          'API-Key': AVNU_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correctPayload)
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error:', JSON.stringify(data.error, null, 2));

      // More specific error handling
      if (data.error.code === -32700) {
        console.log('\nParse error details:');
        console.log('1. Check address is 66 characters (0x + 64 hex)');
        console.log('2. Verify API key has credits');
        console.log('3. Contact AVNU: The endpoint might require different format');
      }
    } else {
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
      
      if (data.typedData) {
        console.log('\n✅ Typed data received - ready for signing!');
      }
    }

  } catch (error: any) {
    console.error('Request failed:', error.message);
  }
}

testAVNUPaymasterFixed().catch(console.error);

