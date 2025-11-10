// test/paymaster-test-fixed.ts
// Fixed version with proper payload format for AVNU REST API

const AVNU_PAYMASTER_URL = process.env.AVNU_PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi';
const AVNU_API_KEY = process.env.AVNU_API_KEY || 'CONTACT_AVNU_FOR_KEY';

async function testAVNUPaymasterCorrectly() {
  console.log('🧪 Testing AVNU Paymaster with CORRECT format...\n');

  // AVNU expects specific field names and types - clean payload
  const correctPayload: any = {
    userAddress: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    calls: [
      {
        contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        entrypoint: 'approve',
        calldata: ['0x1', '0xf', '0x0']
      }
    ],
    // Optional fields - omit for sponsored transaction
    // Don't include undefined fields - AVNU doesn't like them
  };

  try {
    const response = await fetch(
      `${AVNU_PAYMASTER_URL}/api/v1/paymaster/build`,
      {
        method: 'POST',
        headers: {
          'API-Key': AVNU_API_KEY,
          'Content-Type': 'application/json',
          // NOT a JSON-RPC request - it's REST API!
        },
        body: JSON.stringify(correctPayload)
      }
    );

    const data = await response.json();

    // Check for JSON-RPC error format first (even if response.ok is true)
    if (data.error?.code === -32700) {
      console.error('❌ Parse error (-32700): Payload format issue');
      console.log('\nPossible issues:');
      console.log('- Invalid user address format');
      console.log('- Invalid contract addresses');
      console.log('- Missing required fields');
      console.log('- API key might not have credits');
      console.log('- Contact AVNU team to verify API key has credits');
      return;
    }

    if (!response.ok) {

      console.error(`❌ Error: HTTP ${response.status}`);
      console.error('Response:', JSON.stringify(data, null, 2));

      if (response.status === 400) {
        console.log('\nPossible issues:');
        console.log('- Invalid user address format');
        console.log('- Invalid contract addresses');
        console.log('- Missing required fields');
      } else if (response.status === 401) {
        console.log('\nAPI key issues:');
        console.log('- Key might not have credits');
        console.log('- Key might be rate-limited');
      } else if (response.status === 500) {
        console.log('\nServer error - contact AVNU team');
      }
      return;
    }

    console.log('✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));

    // Expected response should contain typedData
    if (data.typedData) {
      console.log('\n✅ Typed data received - ready for signing!');
    } else {
      console.log('\n⚠️ No typedData in response - check AVNU documentation');
    }

  } catch (error: any) {
    console.error('❌ Network error:', error.message);
  }
}

testAVNUPaymasterCorrectly().catch(console.error);

