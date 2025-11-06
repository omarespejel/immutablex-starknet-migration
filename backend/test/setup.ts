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
  nock('https://sepolia.paymaster.avnu.fi')
    .post('/sponsor')
    .reply(200, {
      transaction_hash: '0xsponsored_tx',
      sponsored: true,
    })
    .persist();

  nock('https://sepolia.paymaster.avnu.fi')
    .post('/sponsor-account-deployment')
    .reply(200, {
      transaction_hash: '0xdeployment_tx',
      deployed: true,
    })
    .persist();
}

// Clean up mocks
export function cleanupMocks() {
  nock.cleanAll();
}
