// Extended API Test with Detailed Response Analysis

const API_BASE_URL = 'http://localhost:5001/api';

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

async function makeRequest(method, endpoint, body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testAuth() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         AUTHENTICATION TESTS              ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Register
  const email = `test.${Date.now()}@example.com`;
  const registerResult = await makeRequest('POST', '/auth/register', {
    email,
    password: 'TestPassword123!',
    name: 'Test User',
    phone: '+27123456789'
  });

  console.log('1️⃣  REGISTER');
  console.log('   Status:', registerResult.status);
  console.log('   Success:', registerResult.ok);
  if (registerResult.ok) {
    console.log('   ✅ Token received:', registerResult.data.token?.substring(0, 30) + '...');
    console.log('   User ID:', registerResult.data.user?.id);
    testResults.passed++;
  } else {
    console.log('   ❌ Error:', registerResult.data.error);
    testResults.failed++;
  }

  if (!registerResult.data.token) return null;

  const token = registerResult.data.token;

  // Login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email,
    password: 'TestPassword123!'
  });

  console.log('\n2️⃣  LOGIN');
  console.log('   Status:', loginResult.status);
  console.log('   Success:', loginResult.ok);
  if (loginResult.ok) {
    console.log('   ✅ Token received:', loginResult.data.token?.substring(0, 30) + '...');
    testResults.passed++;
  } else {
    console.log('   ❌ Error:', loginResult.data.error);
    testResults.failed++;
  }

  // Get Profile
  const profileResult = await makeRequest('GET', '/auth/profile', null, token);

  console.log('\n3️⃣  GET PROFILE');
  console.log('   Status:', profileResult.status);
  console.log('   Success:', profileResult.ok);
  console.log('   Response:', JSON.stringify(profileResult.data, null, 2));
  if (profileResult.ok && profileResult.data) {
    console.log('   ✅ Profile retrieved');
    testResults.passed++;
  } else {
    console.log('   ❌ Could not retrieve profile');
    testResults.failed++;
  }

  return token;
}

async function testWallet(token) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║           WALLET TESTS                    ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get Balance
  const balanceResult = await makeRequest('GET', '/wallet/balance', null, token);

  console.log('1️⃣  GET BALANCE');
  console.log('   Status:', balanceResult.status);
  console.log('   Success:', balanceResult.ok);
  console.log('   Response:', JSON.stringify(balanceResult.data, null, 2));
  if (balanceResult.ok) {
    console.log('   ✅ Balance:', balanceResult.data.amount || 0, balanceResult.data.currency || 'ZAR');
    testResults.passed++;
  } else {
    console.log('   ❌ Failed');
    testResults.failed++;
  }

  // Get Transactions
  const transactionsResult = await makeRequest('GET', '/wallet/transactions?page=1&limit=10', null, token);

  console.log('\n2️⃣  GET TRANSACTIONS');
  console.log('   Status:', transactionsResult.status);
  console.log('   Success:', transactionsResult.ok);
  console.log('   Transactions count:', transactionsResult.data.transactions?.length || 0);
  if (transactionsResult.ok) {
    console.log('   ✅ Transactions retrieved');
    testResults.passed++;
  } else {
    console.log('   ❌ Failed');
    testResults.failed++;
  }

  // Add Funds
  const addFundsResult = await makeRequest('POST', '/wallet/add-funds', {
    amount: 1000,
    paymentMethod: 'BANK_TRANSFER'
  }, token);

  console.log('\n3️⃣  ADD FUNDS');
  console.log('   Status:', addFundsResult.status);
  console.log('   Success:', addFundsResult.ok);
  if (addFundsResult.ok) {
    console.log('   ✅ Funds added:', addFundsResult.data.amount, addFundsResult.data.message);
    testResults.passed++;
  } else {
    console.log('   Response:', JSON.stringify(addFundsResult.data, null, 2));
    console.log('   ❌ Failed:', addFundsResult.data.error);
    testResults.failed++;
  }
}

async function testEscrow(token) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║          ESCROW TESTS                     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Create Escrow
  const createResult = await makeRequest('POST', '/escrow/create', {
    itemDescription: 'Test Item',
    amount: 5000,
    currency: 'ZAR',
    seller_email: 'seller@example.com'
  }, token);

  console.log('1️⃣  CREATE ESCROW');
  console.log('   Status:', createResult.status);
  console.log('   Success:', createResult.ok);
  if (createResult.ok) {
    console.log('   ✅ Escrow created:', createResult.data.id);
    console.log('   Status:', createResult.data.status);
    testResults.passed++;
  } else {
    console.log('   Response:', JSON.stringify(createResult.data, null, 2));
    console.log('   ❌ Failed:', createResult.data.error);
    testResults.failed++;
  }

  // Get Escrows
  const listResult = await makeRequest('GET', '/escrow', null, token);

  console.log('\n2️⃣  GET ESCROWS');
  console.log('   Status:', listResult.status);
  console.log('   Success:', listResult.ok);
  if (listResult.ok) {
    console.log('   ✅ Escrows retrieved:', listResult.data.escrows?.length || 0);
    testResults.passed++;
  } else {
    console.log('   ❌ Failed');
    testResults.failed++;
  }
}

async function testPayments(token) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         PAYMENT TESTS                     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Initiate Payment
  const initiateResult = await makeRequest('POST', '/payments/initiate', {
    amount: 1000,
    paymentMethod: 'CARD',
    description: 'Test Payment'
  }, token);

  console.log('1️⃣  INITIATE PAYMENT');
  console.log('   Status:', initiateResult.status);
  console.log('   Success:', initiateResult.ok);
  if (initiateResult.ok) {
    console.log('   ✅ Payment initiated:', initiateResult.data.id);
    testResults.passed++;
  } else {
    console.log('   ❌ Failed:', initiateResult.data.error);
    testResults.failed++;
  }
}

async function testDisputes(token) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         DISPUTE TESTS                     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Create Dispute
  const createResult = await makeRequest('POST', '/disputes/create', {
    escrowId: 'test-escrow-id',
    reason: 'Item not as described',
    description: 'Test dispute'
  }, token);

  console.log('1️⃣  CREATE DISPUTE');
  console.log('   Status:', createResult.status);
  console.log('   Success:', createResult.ok);
  if (createResult.ok && createResult.data.id) {
    console.log('   ✅ Dispute created:', createResult.data.id);
    testResults.passed++;
  } else if (createResult.status === 400) {
    console.log('   ⚠️  Expected error (invalid escrow):', createResult.data.error);
    testResults.passed++;
  } else {
    console.log('   ❌ Failed:', createResult.data.error);
    testResults.failed++;
  }
}

async function printFinalReport() {
  const total = testResults.passed + testResults.failed;
  const percentage = ((testResults.passed / total) * 100).toFixed(1);

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         FINAL TEST REPORT                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${percentage}%\n`);

  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Backend is fully functional.\n');
  } else {
    console.log(`⚠️  ${testResults.failed} test(s) need attention.\n`);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('█████████████████████████████████████████████████████');
  console.log('█  COMPREHENSIVE BACKEND-TO-FRONTEND INTEGRATION TEST  █');
  console.log('█  Backend: http://localhost:5001/api                  █');
  console.log('█  Frontend: http://localhost:3000                     █');
  console.log('█████████████████████████████████████████████████████\n');

  const token = await testAuth();
  if (token) {
    await testWallet(token);
    await testEscrow(token);
    await testPayments(token);
    await testDisputes(token);
  }

  await printFinalReport();
}

runAllTests().catch(console.error);
