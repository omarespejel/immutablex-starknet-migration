// Check batch status and provide verification summary

async function checkBatchStatus() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BATCH VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // 1. Check Redis Stats
    console.log('1️⃣  Redis Status:');
    const { stdout: stats } = await execAsync('redis-cli -p 6379 INFO stats');
    const totalCommands = stats.match(/total_commands_processed:(\d+)/)?.[1] || '0';
    console.log(`   Total commands processed: ${totalCommands}`);
    console.log('');

    // 2. Check Queue Lengths
    console.log('2️⃣  Queue Status:');
    const { stdout: waitQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:wait');
    const { stdout: activeQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:active');
    const { stdout: completedQueue } = await execAsync('redis-cli -p 6379 LLEN bull:transactions:completed');
    
    console.log(`   Wait queue: ${waitQueue.trim()}`);
    console.log(`   Active queue: ${activeQueue.trim()}`);
    console.log(`   Completed queue: ${completedQueue.trim()}`);
    console.log('');

    // 3. Check for completed jobs
    console.log('3️⃣  Completed Jobs:');
    const { stdout: completedKeys } = await execAsync('redis-cli -p 6379 KEYS "bull:transactions:*completed*"');
    const completedCount = completedKeys.trim() ? completedKeys.trim().split('\n').length : 0;
    console.log(`   Found ${completedCount} completed job entries`);
    
    if (completedCount > 0) {
      console.log('   ✅ Batch processing is working!');
      console.log('   Jobs are being completed successfully.');
    } else {
      console.log('   ⚠️  No completed jobs found yet.');
      console.log('   This could mean:');
      console.log('   - Batch hasn\'t triggered yet');
      console.log('   - Jobs are processing but not marked complete');
      console.log('   - Check backend logs for batch submission');
    }
    console.log('');

    // 4. Instructions
    console.log('4️⃣  Next Steps:');
    console.log('');
    console.log('   📋 Check Backend Logs:');
    console.log('      Look for these log messages:');
    console.log('      - [BATCH] Submitting batch of 100 actions');
    console.log('      - [BATCH] Processing 100 actions for user ...');
    console.log('      - Batch sponsored: 0x... (transaction hash)');
    console.log('');
    console.log('   🔍 Monitor Starknet Explorer:');
    console.log('      Use the transaction hash from backend logs');
    console.log('      Sepolia: https://sepolia.starkscan.co/tx/0x...');
    console.log('      Mainnet: https://starkscan.co/tx/0x...');
    console.log('');
    console.log('   ✅ Verification Checklist:');
    console.log('      [ ] Backend logs show batch submission');
    console.log('      [ ] Transaction hash appears in logs');
    console.log('      [ ] Transaction visible on Starknet explorer');
    console.log('      [ ] Transaction status is ACCEPTED_ON_L2');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error checking status:', error.message);
    if (error.message.includes('redis-cli')) {
      console.error('');
      console.error('   Make sure Redis is running:');
      console.error('   docker-compose up redis');
    }
  }
}

checkBatchStatus();

