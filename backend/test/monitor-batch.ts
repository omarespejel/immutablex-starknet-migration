// Monitor batch submission by checking Redis and running test
// This helps verify the batching system is working

async function monitorBatch() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Monitoring Transaction Batching\n');
  
  // Check Redis connection
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    // Check Redis queue length before
    const { stdout: beforeQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:wait');
    console.log(`📊 Redis queue length (before): ${beforeQueue.trim()}`);
    
    // Generate wallet and session
    console.log('\n📤 Setting up test...');
    const walletRes = await fetch(`${baseUrl}/wallet/generate`);
    const wallet = await walletRes.json();
    
    const sessionRes = await fetch(`${baseUrl}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'monitor-test-user',
        walletAddress: wallet.address,
      }),
    });
    const { token } = await sessionRes.json();
    
    console.log('✅ Wallet and session created\n');
    
    // Send actions and monitor
    console.log('📤 Sending 105 actions...\n');
    
    for (let i = 0; i < 105; i++) {
      await fetch(`${baseUrl}/game/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: token,
          action: {
            id: `monitor-action-${i}`,
            method: 'game_action',
            parameters: { score: i * 100 },
          },
        }),
      });
      
      // Check queue at key points
      if (i === 50) {
        const { stdout: midQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:wait');
        console.log(`📊 Queue length at action 50: ${midQueue.trim()}`);
      }
      
      if (i === 99) {
        console.log('\n🎯 BATCH TRIGGER POINT (action 100 next)\n');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for batch to process
      }
      
      if (i === 100) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for batch submission
        const { stdout: afterQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:wait');
        console.log(`📊 Queue length after batch trigger: ${afterQueue.trim()}`);
      }
    }
    
    // Final check
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { stdout: finalQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:wait');
    console.log(`\n📊 Final queue length: ${finalQueue.trim()}`);
    
    // Check for completed jobs
    const { stdout: completedJobs } = await execAsync('redis-cli -p 6379 KEYS "bull:transactions:completed"');
    console.log(`✅ Completed jobs: ${completedJobs.trim().split('\n').length}`);
    
    console.log('\n📋 Check backend logs for:');
    console.log('   [BATCH] Submitting batch of 100 actions');
    console.log('   [BATCH] Processing 100 actions for user monitor-test-user');
    console.log('   Batch sponsored: 0x...');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('redis-cli')) {
      console.error('   Make sure Redis is running: docker-compose up redis');
    }
  }
}

monitorBatch();

