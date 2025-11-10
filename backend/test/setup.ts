import nock from 'nock';

// Mock Starknet RPC
export function mockStarknetRpc() {
  nock('https://starknet-sepolia.public.blastapi.io')
    .post('/rpc')
    .reply(200, {
      result: {
        transaction_hash: '0xmocked_hash',
        status: 'ACCEPTED_ON_L2',
      },
    })
    .persist();
}

// Mock AVNU Paymaster
export function mockPaymaster() {
  const paymasterUrl = 'https://sepolia.paymaster.avnu.fi';

  // Health check
  nock(paymasterUrl)
    .get('/health')
    .reply(200, { status: 'ok' })
    .persist();

  // Build transaction (correct endpoint: /api/v1/paymaster/build)
  nock(paymasterUrl)
    .post('/api/v1/paymaster/build')
    .reply(200, {
      typedData: {
        types: {},
        primaryType: 'StarknetTransaction',
        domain: {},
        message: {}
      },
      typedDataHash: '0xbuild_hash',
      estimatedFee: '0.001'
    })
    .persist();

  // Sponsor activity (correct endpoint: /api/v1/paymaster/activity)
  nock(paymasterUrl)
    .get(/\/api\/v1\/paymaster\/activity/)
    .reply(200, {
      totalTransactions: 10,
      creditsRemaining: 1000
    })
    .persist();

  // Execute transaction (for completeness)
  nock(paymasterUrl)
    .post('/api/v1/paymaster/execute')
    .reply(200, {
      transaction_hash: '0xexecuted_tx',
      success: true,
    })
    .persist();
}

// Clean up mocks
export function cleanupMocks() {
  nock.cleanAll();
}
