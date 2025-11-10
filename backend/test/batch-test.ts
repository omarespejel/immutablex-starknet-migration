// backend/test/batch-test.ts
// Quick manual test for transaction batching system

async function testBatching() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Transaction Batching System\n');

  // Step 1: Generate wallet
  console.log('Step 1: Generating wallet...');
  const walletRes = await fetch(`${baseUrl}/wallet/generate`);
  if (!walletRes.ok) {
    throw new Error(`Wallet generation failed: ${walletRes.statusText}`);
  }
  const wallet = await walletRes.json();
  console.log('✅ Wallet created:', wallet.address);
  console.log('');

  // Step 2: Create session
  console.log('Step 2: Creating session...');
  const sessionRes = await fetch(`${baseUrl}/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'batch-test-user',
      walletAddress: wallet.address,
    }),
  });
  if (!sessionRes.ok) {
    throw new Error(`Session creation failed: ${sessionRes.statusText}`);
  }
  const { token } = await sessionRes.json();
  console.log('✅ Session created');
  console.log('');

  // Step 3: Submit 105 actions to trigger batch
  console.log('Step 3: Submitting 105 actions (batch triggers at 100)...');
  console.log('');

  for (let i = 0; i < 105; i++) {
    const actionRes = await fetch(`${baseUrl}/game/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: token,
        action: {
          id: `action-${i}`,
          method: 'game_action',
          parameters: { score: i * 100 },
        },
      }),
    });

    if (!actionRes.ok) {
      const error = await actionRes.text();
      console.error(`❌ Action ${i} failed: ${error}`);
      continue;
    }

    const result = await actionRes.json();

    if (i % 10 === 0) {
      console.log(`  Action ${i}: Position ${result.batchPosition}`);
    }

    // Batch triggers at 100
    if (i === 99) {
      console.log('');
      console.log('🎯 BATCH TRIGGER! Actions 0-99 will be submitted');
      console.log('');
    }
  }

  console.log('');
  console.log('✅ All actions submitted');
  console.log('');
  console.log('📊 Check backend logs for batch submission');
  console.log('   Look for: [TransactionBatchProcessor] BATCH: Submitting batch');
}

testBatching().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

