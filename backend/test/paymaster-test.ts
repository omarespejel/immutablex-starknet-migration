// test/paymaster-test.ts
// Based on official AVNU Paymaster API documentation

const AVNU_PAYMASTER_URL = process.env.AVNU_PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi';
const AVNU_API_KEY = process.env.AVNU_API_KEY || 'CONTACT_AVNU_FOR_KEY';

async function testAVNUPaymaster() {
  console.log('🧪 Testing AVNU Paymaster (Based on Official Docs)...\n');

  // 1. Build Typed Data (This is the main endpoint)
  console.log('1️⃣ Testing Build Typed Data endpoint...');

  const buildPayload = {
    userAddress: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    calls: [
      {
        contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        entrypoint: 'approve',
        calldata: ['0x1', '0xf', '0x0']
      }
    ],
    // Omit gasTokenAddress for sponsored transaction
    // gasTokenAddress: '0x...', 
    // maxGasTokenAmount: '1000'
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
        body: JSON.stringify(buildPayload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Build successful!');
    console.log('   Typed data:', data.typedData ? 'Received' : 'Not received');
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    if (error.message?.includes('401')) {
      console.error('❌ Unauthorized - Need valid API key from AVNU team');
    } else {
      console.error('❌ Build failed:', error.message);
    }
  }

  // 2. Activity endpoint (requires valid API key)
  console.log('\n2️⃣ Testing Sponsor Activity endpoint...');

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const response = await fetch(
      `${AVNU_PAYMASTER_URL}/api/v1/paymaster/activity?` +
      `startDate=${weekAgo.toISOString().split('T')[0]}&` +
      `endDate=${today.toISOString().split('T')[0]}`,
      {
        headers: {
          'API-Key': AVNU_API_KEY,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Activity retrieved:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    if (error.message?.includes('401')) {
      console.error('❌ Need valid API key for sponsor features');
    } else {
      console.error('❌ Activity failed:', error.message);
    }
  }
}

testAVNUPaymaster().catch(console.error);
