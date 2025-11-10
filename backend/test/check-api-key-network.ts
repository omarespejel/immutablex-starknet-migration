// test/check-api-key-network.ts
// Diagnostic script to check if AVNU API key is for mainnet or testnet

const API_KEY = process.env.AVNU_API_KEY || 'your_key_here';

async function checkAPIKeyNetwork() {
  console.log('🔍 Checking AVNU API Key Network...\n');

  // Test 1: Try Testnet (Sepolia)
  console.log('1️⃣ Testing Sepolia Testnet...');
  try {
    const testnetResponse = await fetch(
      'https://sepolia.paymaster.avnu.fi/api/v1/paymaster/build',
      {
        method: 'POST',
        headers: {
          'API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          calls: [{
            contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            entrypoint: 'approve',
            calldata: ['0x1', '0xf', '0x0']
          }]
        })
      }
    );

    if (testnetResponse.ok) {
      const data = await testnetResponse.json();
      console.log('✅ API Key works on TESTNET (Sepolia)');
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return 'testnet';
    } else {
      const errorData = await testnetResponse.json().catch(() => ({ error: testnetResponse.statusText }));
      if (testnetResponse.status === 401) {
        console.log('❌ API Key invalid for testnet (401 Unauthorized)');
      } else {
        console.log(`⚠️ Testnet error: HTTP ${testnetResponse.status}`);
        console.log('   Response:', JSON.stringify(errorData, null, 2).substring(0, 200));
      }
    }
  } catch (error: any) {
    console.log('⚠️ Testnet error:', error.message);
  }

  // Test 2: Try Mainnet
  console.log('\n2️⃣ Testing Mainnet...');
  try {
    const mainnetResponse = await fetch(
      'https://starknet.paymaster.avnu.fi/api/v1/paymaster/build',
      {
        method: 'POST',
        headers: {
          'API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          calls: [{
            contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            entrypoint: 'approve',
            calldata: ['0x1', '0xf', '0x0']
          }]
        })
      }
    );

    if (mainnetResponse.ok) {
      const data = await mainnetResponse.json();
      console.log('✅ API Key works on MAINNET');
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return 'mainnet';
    } else {
      const errorData = await mainnetResponse.json().catch(() => ({ error: mainnetResponse.statusText }));
      if (mainnetResponse.status === 401) {
        console.log('❌ API Key invalid for mainnet (401 Unauthorized)');
      } else {
        console.log(`⚠️ Mainnet error: HTTP ${mainnetResponse.status}`);
        console.log('   Response:', JSON.stringify(errorData, null, 2).substring(0, 200));
      }
    }
  } catch (error: any) {
    console.log('⚠️ Mainnet error:', error.message);
  }

  console.log('\n📊 Results:');
  console.log('- Your API key might be invalid or expired');
  console.log('- Contact AVNU team to verify');
  return null;
}

checkAPIKeyNetwork().then(network => {
  if (network) {
    console.log(`\n✅ Your API key is for: ${network.toUpperCase()}`);
    if (network === 'mainnet') {
      console.log('\n⚠️ Update your .env to use mainnet URL:');
      console.log('AVNU_PAYMASTER_URL=https://starknet.paymaster.avnu.fi');
    } else {
      console.log('\n✅ Your .env is correctly configured for testnet');
      console.log('AVNU_PAYMASTER_URL=https://sepolia.paymaster.avnu.fi');
    }
  } else {
    console.log('\n❌ API key not valid for either network');
    console.log('Contact AVNU on Telegram: https://t.me/avnu_fi');
  }
});

